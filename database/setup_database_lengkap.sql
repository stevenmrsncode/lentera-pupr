-- ============================================================
-- 🏛️ LENTERA — ALL-IN-ONE COMPLETE DATABASE SETUP (FINAL)
-- Sistem Informasi Leger Jalan | Dinas PUPR Provinsi NTT
-- Versi: v2.5.0 SIGAP (Production Ready)
--
-- CARA PENGGUNAAN:
-- 1. Buka Supabase Dashboard (https://supabase.com/dashboard)
-- 2. Pilih Project Anda -> Masuk ke menu "SQL Editor"
-- 3. Copy-Paste SEMUA kode di bawah ini, lalu klik "RUN" (Ctrl + Enter)
-- 4. Script ini 100% IDEMPOTENT (aman dijalankan berulang kali tanpa error)
-- ============================================================

-- ============================================================
-- BAGIAN 0: EXTENSION & BERSIHKAN POLICY / TRIGGER LAMA
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Hapus semua policy lama di tabel public agar tidak terjadi infinite recursion / konflik
DO $drop_all_policies$
DECLARE
  pol record;
  tbl text;
BEGIN
  FOR tbl IN VALUES
    ('users'), ('road_segments'), ('leger_documents'),
    ('maintenance_activities'), ('audit_logs'),
    ('districts'), ('sub_districts'), ('guidelines'), ('system_settings')
  LOOP
    FOR pol IN
      SELECT policyname FROM pg_policies
      WHERE schemaname = 'public' AND tablename = tbl
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, tbl);
    END LOOP;
  END LOOP;
EXCEPTION WHEN OTHERS THEN NULL;
END $drop_all_policies$;

-- Hapus storage policy lama jika ada
DO $storage_cleanup$ BEGIN
  DROP POLICY IF EXISTS "Public dapat membaca semua berkas" ON storage.objects;
  DROP POLICY IF EXISTS "User terautentikasi bisa upload berkas" ON storage.objects;
  DROP POLICY IF EXISTS "User bisa update berkas milik sendiri" ON storage.objects;
  DROP POLICY IF EXISTS "User atau Admin bisa hapus berkas" ON storage.objects;
EXCEPTION WHEN OTHERS THEN NULL;
END $storage_cleanup$;

-- Hapus trigger lama
DO $droptriggers$ BEGIN
  DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
  DROP TRIGGER IF EXISTS trg_users_updated_at ON public.users;
  DROP TRIGGER IF EXISTS trg_road_segments_updated_at ON public.road_segments;
EXCEPTION WHEN OTHERS THEN NULL;
END $droptriggers$;


-- ============================================================
-- BAGIAN 1: PEMBUATAN TABEL MASTER & TABEL UTAMA
-- ============================================================

-- 1a. Master Kabupaten / Kota (22 Kab/Kota se-NTT)
CREATE TABLE IF NOT EXISTS public.districts (
    id         serial      PRIMARY KEY,
    name       text        NOT NULL UNIQUE,
    province   text        NOT NULL DEFAULT 'Nusa Tenggara Timur',
    created_at timestamptz DEFAULT now()
);

-- 1b. Master Kecamatan
CREATE TABLE IF NOT EXISTS public.sub_districts (
    id          serial  PRIMARY KEY,
    district_id integer NOT NULL REFERENCES public.districts(id) ON DELETE CASCADE,
    name        text    NOT NULL,
    created_at  timestamptz DEFAULT now(),
    UNIQUE(district_id, name)
);

-- 1c. Profil Pengguna Sistem (Sinkron dengan auth.users Supabase)
CREATE TABLE IF NOT EXISTS public.users (
    id                  uuid    PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name           text    NOT NULL,
    email               text    NOT NULL UNIQUE,
    role                text    NOT NULL DEFAULT 'Surveyor Lapangan'
                        CHECK (role IN ('Administrator', 'Surveyor Lapangan', 'Kepala Dinas/Verifikator', 'Visitor')),
    district_assignment text,
    regional_code       text,
    avatar_url          text,
    is_active           boolean DEFAULT true,
    created_at          timestamptz DEFAULT now(),
    updated_at          timestamptz DEFAULT now()
);

-- 1d. Data Ruas Jalan & Inventaris Leger
CREATE TABLE IF NOT EXISTS public.road_segments (
    id                uuid     PRIMARY KEY DEFAULT gen_random_uuid(),
    code              text     NOT NULL UNIQUE,
    name              text     NOT NULL,
    district_id       integer  REFERENCES public.districts(id),
    sub_district_id   integer  REFERENCES public.sub_districts(id),
    district_name     text     NOT NULL,
    sub_district_name text     NOT NULL DEFAULT '',
    length_km         numeric(8,3)  NOT NULL CHECK (length_km > 0),
    width_m           numeric(6,2)  NOT NULL CHECK (width_m > 0),
    surface_type      text     NOT NULL CHECK (surface_type IN (
                          'Aspal', 'Hotmix AC-WC', 'Hotmix AC-BC',
                          'Rigid Pavement', 'Telford / Makadam'
                      )),
    condition         text     NOT NULL CHECK (condition IN (
                          'Mantap', 'Sedang', 'Rusak Ringan', 'Rusak Berat'
                      )),
    const_year        smallint NOT NULL CHECK (const_year BETWEEN 1900 AND 2100),
    start_lat         double precision,
    start_lng         double precision,
    end_lat           double precision,
    end_lng           double precision,
    description       text,
    surveyor_name     text     NOT NULL DEFAULT 'Tim Surveyor PUPR NTT',
    surveyor_id       uuid     REFERENCES public.users(id) ON DELETE SET NULL,
    created_by        uuid     REFERENCES public.users(id) ON DELETE SET NULL,
    updated_by        uuid     REFERENCES public.users(id) ON DELETE SET NULL,
    last_surveyed_at  timestamptz,
    created_at        timestamptz DEFAULT now(),
    updated_at        timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_road_segments_coords    ON public.road_segments (start_lat, start_lng);
CREATE INDEX IF NOT EXISTS idx_road_segments_district  ON public.road_segments (district_id);
CREATE INDEX IF NOT EXISTS idx_road_segments_condition ON public.road_segments (condition);

-- 1e. Dokumen Leger (Kartu Leger & Sertifikat Hak Pakai)
CREATE TABLE IF NOT EXISTS public.leger_documents (
    id           uuid  PRIMARY KEY DEFAULT gen_random_uuid(),
    segment_id   uuid  NOT NULL REFERENCES public.road_segments(id) ON DELETE CASCADE,
    type         text  NOT NULL CHECK (type IN ('kartu_leger', 'sertifikat_jalan')),
    document_no  text  NOT NULL,
    file_name    text  NOT NULL,
    file_size    text  NOT NULL,
    file_url     text,
    storage_path text,
    issue_date   date  NOT NULL,
    status       text  NOT NULL DEFAULT 'Pending'
                 CHECK (status IN ('Pending', 'Tervalidasi', 'Ditolak')),
    notes        text,
    uploaded_by  uuid  REFERENCES public.users(id) ON DELETE SET NULL,
    validated_by uuid  REFERENCES public.users(id) ON DELETE SET NULL,
    validated_at timestamptz,
    uploaded_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_leger_docs_segment ON public.leger_documents (segment_id);
CREATE INDEX IF NOT EXISTS idx_leger_docs_status  ON public.leger_documents (status);
CREATE INDEX IF NOT EXISTS idx_leger_docs_type    ON public.leger_documents (type);

-- 1f. Riwayat Aktivitas & Pemeliharaan Jalan
CREATE TABLE IF NOT EXISTS public.maintenance_activities (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    segment_id    uuid REFERENCES public.road_segments(id) ON DELETE SET NULL,
    title         text NOT NULL,
    description   text NOT NULL,
    activity_type text NOT NULL CHECK (activity_type IN (
                      'construction', 'survey', 'task_alt', 'rehabilitation'
                  )),
    activity_date date NOT NULL DEFAULT CURRENT_DATE,
    time_label    text,
    performed_by  uuid REFERENCES public.users(id) ON DELETE SET NULL,
    created_by    uuid REFERENCES public.users(id) ON DELETE SET NULL,
    created_at    timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activities_segment ON public.maintenance_activities (segment_id);
CREATE INDEX IF NOT EXISTS idx_activities_date    ON public.maintenance_activities (activity_date DESC);

-- 1g. Log Audit Aktivitas Sistem
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id          bigserial PRIMARY KEY,
    user_id     uuid REFERENCES public.users(id) ON DELETE SET NULL,
    action      text NOT NULL CHECK (action IN (
                    'CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'VALIDATE', 'REJECT'
                )),
    entity_type text NOT NULL,
    entity_id   text,
    old_data    jsonb,
    new_data    jsonb,
    ip_address  inet,
    user_agent  text,
    created_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_created ON public.audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_user    ON public.audit_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_audit_entity  ON public.audit_logs (entity_type, entity_id);

-- 1h. Pengaturan Sistem
CREATE TABLE IF NOT EXISTS public.system_settings (
    key         text PRIMARY KEY,
    value       text NOT NULL,
    description text,
    updated_by  uuid REFERENCES public.users(id) ON DELETE SET NULL,
    updated_at  timestamptz DEFAULT now()
);

-- 1i. Perpustakaan Regulasi & Pedoman Teknis (Guidelines)
CREATE TABLE IF NOT EXISTS public.guidelines (
    id           uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
    title        text    NOT NULL,
    document_no  text    NOT NULL,
    year         text    NOT NULL,
    category     text    NOT NULL CHECK (category IN (
                     'Undang-Undang', 'Peraturan Menteri', 'Keputusan Gubernur',
                     'Panduan Teknis', 'SOP', 'Lainnya'
                 )),
    publisher    text    NOT NULL,
    file_name    text    NOT NULL,
    file_size    text    NOT NULL,
    file_url     text,
    storage_path text,
    summary      text    NOT NULL,
    is_official  boolean DEFAULT false,
    uploaded_by  uuid    REFERENCES public.users(id) ON DELETE SET NULL,
    created_at   timestamptz DEFAULT now()
);


-- ============================================================
-- BAGIAN 2: TRIGGER & HELPER FUNCTIONS
-- ============================================================

-- 2a. Auto-update timestamp updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER trg_road_segments_updated_at
    BEFORE UPDATE ON public.road_segments
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 2b. Auto-create profil di public.users saat user register di auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    INSERT INTO public.users (id, full_name, email, role, district_assignment)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'role', 'Visitor'),
        NEW.raw_user_meta_data->>'district'
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2c. Helper cek apakah user saat ini adalah Administrator (Bebas Infinite Recursion)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'Administrator'
  );
$$;

-- 2d. RPC Function: Admin ganti sandi user lain dari antarmuka web
CREATE OR REPLACE FUNCTION public.admin_update_user_password(
    target_user_id UUID,
    new_password    TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Hanya Administrator yang boleh memanggil fungsi ini
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Akses ditolak. Hanya Administrator yang dapat mengubah sandi pengguna lain.';
    END IF;

    -- Validasi panjang password
    IF length(new_password) < 6 THEN
        RAISE EXCEPTION 'Kata sandi minimal 6 karakter.';
    END IF;

    -- Update sandi di auth.users
    UPDATE auth.users
    SET
        encrypted_password = crypt(new_password, gen_salt('bf')),
        updated_at         = NOW()
    WHERE id = target_user_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'User dengan ID % tidak ditemukan.', target_user_id;
    END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_update_user_password(UUID, TEXT) TO authenticated;


-- ============================================================
-- BAGIAN 3: ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================

ALTER TABLE public.users                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.road_segments          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leger_documents        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.districts              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sub_districts          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guidelines             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings        ENABLE ROW LEVEL SECURITY;

-- 3a. Policies untuk public.users
CREATE POLICY "Authenticated dapat baca semua profil"
    ON public.users FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admin dan user update profil"
    ON public.users FOR UPDATE
    USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Trigger insert profil baru"
    ON public.users FOR INSERT WITH CHECK (true);

CREATE POLICY "Admin dan user delete profil"
    ON public.users FOR DELETE
    USING (auth.uid() = id OR public.is_admin());

-- 3b. Policies untuk public.road_segments
CREATE POLICY "Semua user bisa baca ruas jalan"
    ON public.road_segments FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "User terautentikasi bisa tambah ruas"
    ON public.road_segments FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Update ruas oleh pembuat atau Admin"
    ON public.road_segments FOR UPDATE
    USING (created_by = auth.uid() OR public.is_admin() OR auth.role() = 'authenticated');

CREATE POLICY "Hanya Admin bisa hapus ruas"
    ON public.road_segments FOR DELETE
    USING (public.is_admin());

-- 3c. Policies untuk public.leger_documents
CREATE POLICY "Semua user bisa baca dokumen"
    ON public.leger_documents FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "User bisa upload dokumen"
    ON public.leger_documents FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admin dan verifikator bisa validasi/update"
    ON public.leger_documents FOR UPDATE
    USING (auth.role() = 'authenticated');

CREATE POLICY "Admin atau pemilik bisa hapus dokumen"
    ON public.leger_documents FOR DELETE
    USING (uploaded_by = auth.uid() OR public.is_admin());

-- 3d. Policies untuk public.maintenance_activities
CREATE POLICY "Semua user bisa baca aktivitas"
    ON public.maintenance_activities FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "User bisa tambah aktivitas"
    ON public.maintenance_activities FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 3e. Policies untuk public.audit_logs
CREATE POLICY "Semua user bisa baca audit log"
    ON public.audit_logs FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "System bisa tulis audit log"
    ON public.audit_logs FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 3f. Policies untuk public.districts & sub_districts
CREATE POLICY "Semua user bisa baca districts"
    ON public.districts FOR SELECT USING (true);

CREATE POLICY "Semua user bisa baca sub_districts"
    ON public.sub_districts FOR SELECT USING (true);

-- 3g. Policies untuk public.guidelines
CREATE POLICY "Semua user bisa baca guidelines"
    ON public.guidelines FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Semua user bisa tambah guidelines"
    ON public.guidelines FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "User bisa delete guidelines miliknya atau Admin"
    ON public.guidelines FOR DELETE
    USING (uploaded_by = auth.uid() OR public.is_admin());

-- 3h. Policies untuk public.system_settings
CREATE POLICY "Semua user bisa baca system_settings"
    ON public.system_settings FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admin bisa update system_settings"
    ON public.system_settings FOR UPDATE USING (public.is_admin());


-- ============================================================
-- BAGIAN 4: STORAGE BUCKET & STORAGE POLICIES
-- ============================================================

-- Otomatis buat bucket 'storage-lentera' (Public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('storage-lentera', 'storage-lentera', true)
ON CONFLICT (id) DO UPDATE SET public = true;

CREATE POLICY "Public dapat membaca semua berkas"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'storage-lentera');

CREATE POLICY "User terautentikasi bisa upload berkas"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'storage-lentera'
        AND auth.role() = 'authenticated'
    );

CREATE POLICY "User bisa update berkas milik sendiri"
    ON storage.objects FOR UPDATE
    USING (
        bucket_id = 'storage-lentera'
        AND auth.role() = 'authenticated'
    );

CREATE POLICY "User atau Admin bisa hapus berkas"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'storage-lentera'
        AND auth.role() = 'authenticated'
    );


-- ============================================================
-- BAGIAN 5: SINKRONISASI USER & PEMBUATAN AKUN DEFAULT ADMIN
-- ============================================================

-- Sinkronisasi user yang sudah ada di auth.users ke public.users
INSERT INTO public.users (id, email, full_name, role)
SELECT
    id,
    email,
    COALESCE(raw_user_meta_data->>'full_name', split_part(email, '@', 1)) AS full_name,
    COALESCE(raw_user_meta_data->>'role', 'Visitor') AS role
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- Buat akun Administrator default jika belum pernah ada
DO $$
DECLARE
    new_admin_id UUID := gen_random_uuid();
BEGIN
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@pupr-ntt.go.id') THEN
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            email_change,
            email_change_token_new,
            recovery_token
        )
        VALUES (
            '00000000-0000-0000-0000-000000000000',
            new_admin_id,
            'authenticated',
            'authenticated',
            'admin@pupr-ntt.go.id',
            crypt('Admin@12345', gen_salt('bf')),
            NOW(),
            '{"provider":"email","providers":["email"]}',
            '{"full_name":"Administrator PUPR NTT","role":"Administrator","district":null}',
            NOW(),
            NOW(),
            '',
            '',
            '',
            ''
        );

        INSERT INTO public.users (id, full_name, email, role, is_active)
        VALUES (
            new_admin_id,
            'Administrator PUPR NTT',
            'admin@pupr-ntt.go.id',
            'Administrator',
            true
        )
        ON CONFLICT (id) DO UPDATE 
        SET role = 'Administrator', is_active = true;
    END IF;
END $$;


-- ============================================================
-- BAGIAN 6: MASTER DATA WILAYAH NTT (22 Kabupaten/Kota)
-- ============================================================

INSERT INTO public.districts (name) VALUES
    ('Kota Kupang'),
    ('Kab. Kupang'),
    ('Kab. Timor Tengah Selatan'),
    ('Kab. Timor Tengah Utara'),
    ('Kab. Belu'),
    ('Kab. Malaka'),
    ('Kab. Alor'),
    ('Kab. Flores Timur'),
    ('Kab. Sikka'),
    ('Kab. Ende'),
    ('Kab. Ngada'),
    ('Kab. Nagekeo'),
    ('Kab. Manggarai'),
    ('Kab. Manggarai Timur'),
    ('Kab. Manggarai Barat'),
    ('Kab. Sumba Timur'),
    ('Kab. Sumba Tengah'),
    ('Kab. Sumba Barat'),
    ('Kab. Sumba Barat Daya'),
    ('Kab. Sabu Raijua'),
    ('Kab. Rote Ndao'),
    ('Provinsi NTT')
ON CONFLICT (name) DO NOTHING;

-- Kota Kupang
INSERT INTO public.sub_districts (district_id, name)
SELECT id, unnest(ARRAY['Kec. Oebobo','Kec. Kelapa Lima','Kec. Maulafa','Kec. Alak','Kec. Kota Raja','Kec. Kota Lama'])
FROM public.districts WHERE name = 'Kota Kupang' ON CONFLICT DO NOTHING;

-- Kab. Kupang
INSERT INTO public.sub_districts (district_id, name)
SELECT id, unnest(ARRAY['Kec. Kupang Tengah','Kec. Kupang Barat','Kec. Kupang Timur','Kec. Amarasi','Kec. Fatuleu','Kec. Semau'])
FROM public.districts WHERE name = 'Kab. Kupang' ON CONFLICT DO NOTHING;

-- Kab. Timor Tengah Selatan
INSERT INTO public.sub_districts (district_id, name)
SELECT id, unnest(ARRAY['Kec. Soe','Kec. Amanuban Barat','Kec. Mollo Utara','Kec. Kie','Kec. Tobu','Kec. Boking'])
FROM public.districts WHERE name = 'Kab. Timor Tengah Selatan' ON CONFLICT DO NOTHING;

-- Kab. Timor Tengah Utara
INSERT INTO public.sub_districts (district_id, name)
SELECT id, unnest(ARRAY['Kec. Kefamenanu','Kec. Miomafo Barat','Kec. Miomafo Timur','Kec. Biboki Utara','Kec. Insana'])
FROM public.districts WHERE name = 'Kab. Timor Tengah Utara' ON CONFLICT DO NOTHING;

-- Kab. Belu
INSERT INTO public.sub_districts (district_id, name)
SELECT id, unnest(ARRAY['Kec. Atambua','Kec. Atambua Barat','Kec. Atambua Selatan','Kec. Tasifeto Barat','Kec. Tasifeto Timur'])
FROM public.districts WHERE name = 'Kab. Belu' ON CONFLICT DO NOTHING;

-- Kab. Malaka
INSERT INTO public.sub_districts (district_id, name)
SELECT id, unnest(ARRAY['Kec. Malaka Tengah','Kec. Malaka Barat','Kec. Malaka Timur','Kec. Kobalima','Kec. Rinhat'])
FROM public.districts WHERE name = 'Kab. Malaka' ON CONFLICT DO NOTHING;

-- Kab. Alor
INSERT INTO public.sub_districts (district_id, name)
SELECT id, unnest(ARRAY['Kec. Teluk Mutiara','Kec. Alor Barat Laut','Kec. Alor Tengah Utara','Kec. Alor Selatan','Kec. Pantar'])
FROM public.districts WHERE name = 'Kab. Alor' ON CONFLICT DO NOTHING;

-- Kab. Flores Timur
INSERT INTO public.sub_districts (district_id, name)
SELECT id, unnest(ARRAY['Kec. Larantuka','Kec. Ile Mandiri','Kec. Demon Pagong','Kec. Titehena','Kec. Lewolema'])
FROM public.districts WHERE name = 'Kab. Flores Timur' ON CONFLICT DO NOTHING;

-- Kab. Sikka
INSERT INTO public.sub_districts (district_id, name)
SELECT id, unnest(ARRAY['Kec. Alok','Kec. Maumere','Kec. Kewapante','Kec. Nita','Kec. Magepanda','Kec. Talibura'])
FROM public.districts WHERE name = 'Kab. Sikka' ON CONFLICT DO NOTHING;

-- Kab. Ende
INSERT INTO public.sub_districts (district_id, name)
SELECT id, unnest(ARRAY['Kec. Ende Selatan','Kec. Ende Timur','Kec. Ende Tengah','Kec. Detusoko','Kec. Ndona','Kec. Wolowaru'])
FROM public.districts WHERE name = 'Kab. Ende' ON CONFLICT DO NOTHING;

-- Kab. Ngada
INSERT INTO public.sub_districts (district_id, name)
SELECT id, unnest(ARRAY['Kec. Bajawa','Kec. Inerie','Kec. Aimere','Kec. Golewa','Kec. Soa'])
FROM public.districts WHERE name = 'Kab. Ngada' ON CONFLICT DO NOTHING;

-- Kab. Nagekeo
INSERT INTO public.sub_districts (district_id, name)
SELECT id, unnest(ARRAY['Kec. Aesesa','Kec. Mauponggo','Kec. Boawae','Kec. Nangaroro','Kec. Keo Tengah'])
FROM public.districts WHERE name = 'Kab. Nagekeo' ON CONFLICT DO NOTHING;

-- Kab. Manggarai
INSERT INTO public.sub_districts (district_id, name)
SELECT id, unnest(ARRAY['Kec. Langke Rembong','Kec. Ruteng','Kec. Reok','Kec. Rahong Utara','Kec. Cibal'])
FROM public.districts WHERE name = 'Kab. Manggarai' ON CONFLICT DO NOTHING;

-- Kab. Manggarai Timur
INSERT INTO public.sub_districts (district_id, name)
SELECT id, unnest(ARRAY['Kec. Borong','Kec. Rana Mese','Kec. Kota Komba','Kec. Sambi Rampas','Kec. Poco Ranaka'])
FROM public.districts WHERE name = 'Kab. Manggarai Timur' ON CONFLICT DO NOTHING;

-- Kab. Manggarai Barat
INSERT INTO public.sub_districts (district_id, name)
SELECT id, unnest(ARRAY['Kec. Komodo','Kec. Lembor','Kec. Sano Nggoang','Kec. Boleng','Kec. Macang Pacar'])
FROM public.districts WHERE name = 'Kab. Manggarai Barat' ON CONFLICT DO NOTHING;

-- Kab. Sumba Timur
INSERT INTO public.sub_districts (district_id, name)
SELECT id, unnest(ARRAY['Kec. Kota Waingapu','Kec. Kanatang','Kec. Rindi','Kec. Haharu','Kec. Lewa'])
FROM public.districts WHERE name = 'Kab. Sumba Timur' ON CONFLICT DO NOTHING;

-- Kab. Sumba Tengah
INSERT INTO public.sub_districts (district_id, name)
SELECT id, unnest(ARRAY['Kec. Katiku Tana','Kec. Mamboro','Kec. Umbu Ratu Nggay','Kec. Umbu Ratu Nggay Barat'])
FROM public.districts WHERE name = 'Kab. Sumba Tengah' ON CONFLICT DO NOTHING;

-- Kab. Sumba Barat
INSERT INTO public.sub_districts (district_id, name)
SELECT id, unnest(ARRAY['Kec. Kota Waikabubak','Kec. Loli','Kec. Tana Righu','Kec. Wanokaka','Kec. Lamboya'])
FROM public.districts WHERE name = 'Kab. Sumba Barat' ON CONFLICT DO NOTHING;

-- Kab. Sumba Barat Daya
INSERT INTO public.sub_districts (district_id, name)
SELECT id, unnest(ARRAY['Kec. Kodi','Kec. Kodi Bangedo','Kec. Loura','Kec. Wewewa Timur','Kec. Wewewa Barat'])
FROM public.districts WHERE name = 'Kab. Sumba Barat Daya' ON CONFLICT DO NOTHING;

-- Kab. Rote Ndao
INSERT INTO public.sub_districts (district_id, name)
SELECT id, unnest(ARRAY['Kec. Lobalain','Kec. Rote Barat','Kec. Rote Timur','Kec. Rote Tengah','Kec. Pantai Baru'])
FROM public.districts WHERE name = 'Kab. Rote Ndao' ON CONFLICT DO NOTHING;

-- Kab. Sabu Raijua
INSERT INTO public.sub_districts (district_id, name)
SELECT id, unnest(ARRAY['Kec. Sabu Barat','Kec. Sabu Tengah','Kec. Sabu Timur','Kec. Hawu Mehara','Kec. Raijua'])
FROM public.districts WHERE name = 'Kab. Sabu Raijua' ON CONFLICT DO NOTHING;


-- ============================================================
-- BAGIAN 7: INITIAL SYSTEM SETTINGS
-- ============================================================

INSERT INTO public.system_settings (key, value, description) VALUES
    ('app_version',   'v2.5.0',                  'Versi aplikasi LENTERA'),
    ('org_name',      'Dinas PUPR Provinsi NTT',  'Nama instansi pengelola'),
    ('regional_code', 'PUPR-NTT-REG01',           'Kode unit regional default'),
    ('app_env',       'production',               'Environment deployment')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;


-- ============================================================
-- BAGIAN 8: PERPUSTAKAAN REGULASI AWAL (GUIDELINES)
-- ============================================================

INSERT INTO public.guidelines (title, document_no, year, category, publisher, file_name, file_size, summary, is_official) VALUES
(
    'Permen PUPR No. 04/PRT/M/2016 tentang Pedoman Penyelenggaraan Leger Jalan',
    '04/PRT/M/2016', '2016', 'Peraturan Menteri',
    'Kementerian Pekerjaan Umum & Perumahan Rakyat RI',
    'Permen_PUPR_04_2016_Penyelenggaraan_Leger_Jalan.pdf', '14.2 MB',
    'Regulasi dasar tingkat nasional yang menetapkan kewajiban penyelenggara jalan untuk mengumpulkan data, menyusun, dan mengesahkan Leger Jalan. Mengatur format kartu leger (KL-1 s.d KL-8) serta tata cara penyerahan laporan leger secara berkala.',
    true
),
(
    'Undang-Undang RI No. 38 Tahun 2004 tentang Jalan',
    'UU No. 38 Tahun 2004', '2004', 'Undang-Undang',
    'Pemerintah Republik Indonesia',
    'UU_No_38_2004_Tentang_Jalan.pdf', '5.6 MB',
    'Payung hukum tertinggi tata kelola jalan di Indonesia. Menyebutkan sanksi pidana dan administratif bagi penyelenggara jalan yang mengabaikan kewajiban pemeliharaan dan pembuatan leger jalan.',
    true
),
(
    'Manual Survei Geometris & Inventarisasi Lapangan Provinsi NTT',
    'MAN-PUPR-NTT/2024/08', '2024', 'Panduan Teknis',
    'Dinas PUPR Provinsi Nusa Tenggara Timur',
    'Manual_Survei_Geometris_Leger_NTT.pdf', '8.4 MB',
    'Petunjuk praktis lapangan yang dirancang khusus untuk kondisi topografi NTT. Panduan cara menentukan koordinat pangkal/ujung ruas jalan, pendataan patok KM dan HM, serta penilaian visual kondisi aspal.',
    true
),
(
    'SOP Pengolahan Data & Pengesahan Digital Kartu Leger Bina Marga',
    'SOP-PUPR-BM/2025/12', '2025', 'SOP',
    'Bidang Bina Marga PUPR NTT',
    'SOP_Bina_Marga_Leger_Digital.pdf', '3.1 MB',
    'SOP internal Dinas PUPR NTT untuk proses validasi data survei LENTERA. Menjelaskan proses verifikasi sertifikat hak pakai, pengolahan draf kartu leger, penandatanganan digital, hingga penataan arsip fisik.',
    true
)
ON CONFLICT DO NOTHING;


-- ============================================================
-- BAGIAN 9: DATA SAMPEL RUAS JALAN PROVINSI NTT (14 ruas)
-- ============================================================

INSERT INTO public.road_segments
    (code, name, district_name, sub_district_name, length_km, width_m,
     surface_type, condition, const_year,
     start_lat, start_lng, end_lat, end_lng, description, surveyor_name)
VALUES
-- Kota Kupang
('53.71.001.K', 'Jl. Yos Sudarso',        'Kota Kupang', 'Kec. Kota Lama',       3.89, 7.0, 'Hotmix AC-WC',      'Mantap',       2021, -10.1756, 123.5847, -10.1934, 123.5613, 'Jalan utama jalur niaga pesisir Kota Kupang.',                        'Tim Surveyor PUPR NTT'),
('53.71.002.K', 'Jl. El Tari',             'Kota Kupang', 'Kec. Oebobo',           5.10, 8.0, 'Hotmix AC-WC',      'Mantap',       2022, -10.1501, 123.6278, -10.1712, 123.6145, 'Jalan protokol menuju Bandara El Tari Kupang.',                       'Tim Surveyor PUPR NTT'),
('53.71.003.K', 'Jl. Timor Raya',          'Kota Kupang', 'Kec. Maulafa',          8.20, 7.0, 'Aspal',             'Sedang',       2018, -10.1823, 123.6520, -10.2001, 123.6789, 'Jalur lintas barat menuju perbatasan Kab. Kupang.',                   'Surveyor Lapangan B.'),
-- Kab. Kupang
('53.01.008.P', 'Jl. Noelmina',            'Kab. Kupang', 'Kec. Kupang Tengah',   15.00, 6.0, 'Aspal',             'Sedang',       2019, -10.2143, 123.8012, -10.3215, 123.8789, 'Jalan penghubung ibu kota kecamatan lintas selatan.',                 'Rizky Ananda'),
-- Kab. Timor Tengah Selatan
('53.02.015.P', 'Jl. Trans Timor (Soe-Kef Selatan)', 'Kab. Timor Tengah Selatan', 'Kec. Soe', 12.50, 6.0, 'Aspal', 'Rusak Ringan', 2016, -9.8612, 124.2847, -9.8012, 124.3124, 'Jalan provinsi penghubung Soe - perbatasan TTU.',             'Bambang Pratama'),
('53.02.021.P', 'Jl. Soe - Amanuban',      'Kab. Timor Tengah Selatan', 'Kec. Amanuban Barat', 9.70, 5.5, 'Telford / Makadam', 'Rusak Berat', 2012, -9.9015, 124.2501, -9.9563, 124.2890, 'Jalan pertanian yang perlu rehabilitasi mayor.',     'Bambang Pratama'),
-- Kab. Sikka
('53.07.011.P', 'Jl. Maumere Bypass',      'Kab. Sikka', 'Kec. Maumere',           7.40, 7.0, 'Hotmix AC-WC',      'Mantap',       2023, -8.6213, 122.2156, -8.6745, 122.2489, 'Jalan lingkar kota Maumere, kondisi sangat baik.',                   'Dewi Santoso'),
('53.07.014.P', 'Jl. Sikka - Nita',        'Kab. Sikka', 'Kec. Nita',              6.80, 5.5, 'Aspal',             'Rusak Ringan', 2015, -8.6945, 122.3012, -8.7213, 122.3490, 'Jalan pedesaan menuju sentra kerajinan tenun.',                       'Dewi Santoso'),
-- Kab. Ende
('53.10.007.P', 'Jl. Kota Baru Ende',      'Kab. Ende', 'Kec. Ende Selatan',       4.50, 7.0, 'Hotmix AC-BC',      'Mantap',       2020, -8.8432, 121.6598, -8.8712, 121.6780, 'Ruas protokol pusat kota Ende.',                                     'Tim Surveyor Ende'),
('53.10.022.P', 'Jl. Detusoko - Ndona',    'Kab. Ende', 'Kec. Detusoko',          11.20, 5.0, 'Aspal',             'Rusak Berat',  2010, -8.7561, 121.7234, -8.8012, 121.7891, 'Ruas penghubung wisata Kelimutu, perlu rehabilitasi.',                'Tim Surveyor Ende'),
-- Kab. Manggarai Barat
('53.15.003.P', 'Jl. Labuan Bajo - Komodo','Kab. Manggarai Barat', 'Kec. Komodo',  18.70, 7.0, 'Hotmix AC-WC',      'Mantap',       2022, -8.4871, 119.8902, -8.5612, 120.0213, 'Jalan wisata premium menuju Taman Nasional Komodo.',                  'Siti Rahayu'),
('53.15.011.P', 'Jl. Lembor Raya',         'Kab. Manggarai Barat', 'Kec. Lembor',  9.30, 6.0, 'Aspal',             'Sedang',       2017, -8.5623, 119.9456, -8.6145, 120.0012, 'Jalan pertanian sentra pangan Manggarai Barat.',                      'Siti Rahayu'),
-- Kab. Sumba Timur
('53.13.005.P', 'Jl. Waingapu - Rindi',    'Kab. Sumba Timur', 'Kec. Rindi',       22.10, 6.0, 'Aspal',             'Rusak Ringan', 2014, -9.6321, 120.2678, -9.7145, 120.4123, 'Jalan lintas timur Sumba menuju pelabuhan.',                          'Hendra Wijaya'),
('53.13.012.P', 'Jl. Haharu Pantai',        'Kab. Sumba Timur', 'Kec. Haharu',     13.40, 5.5, 'Telford / Makadam', 'Rusak Berat',  2009, -9.5012, 120.1456, -9.5789, 120.2234, 'Jalan pantai utara Sumba kondisi kritis.',                           'Hendra Wijaya')
ON CONFLICT (code) DO NOTHING;


-- ============================================================
-- BAGIAN 10: VERIFIKASI AKHIR
-- ============================================================

DO $$
DECLARE
  tbl  text;
  cnt  bigint;
BEGIN
  RAISE NOTICE '=== VERIFIKASI TABEL LENTERA ===';
  FOR tbl IN
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY tablename
  LOOP
    EXECUTE format('SELECT count(*) FROM public.%I', tbl) INTO cnt;
    RAISE NOTICE 'Tabel %-35s : % baris', tbl, cnt;
  END LOOP;
  RAISE NOTICE '================================';
  RAISE NOTICE 'Setup LENTERA v2.5.0 ALL-IN-ONE BERHASIL SELESAI!';
END $$;
