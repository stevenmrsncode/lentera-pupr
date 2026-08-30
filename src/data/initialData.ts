/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RoadSegment, RoadCondition, SurfaceType, MaintenanceActivity } from "../types";

export const INITIAL_ROAD_SEGMENTS: RoadSegment[] = [
  {
    id: "seg-1",
    code: "53.00.001.K",
    name: "Jl. Yos Sudarso",
    district: "Kota Kupang",
    kecamatan: "Kec. Alak",
    lengthKm: 3.89,
    widthM: 6.00,
    surfaceType: SurfaceType.HOTMIX_AC_WC,
    condition: RoadCondition.MANTAP,
    constYear: 2021,
    startLat: -10.173327,
    startLng: 123.557061,
    endLat: -10.19424,
    endLng: 123.53269,
    description: "Ruas jalan utama pelabuhan beraspal mulus dengan sistem drainase berfungsi baik.",
    lastUpdated: "Hari ini, 09:30 WITA",
    surveyor: "Budi Santoso",
    path: [[-10.173327,123.557061],[-10.17402,123.55712],[-10.17533,123.55538],[-10.17687,123.55348],[-10.17851,123.55144],[-10.17999,123.5494],[-10.18115,123.54784],[-10.18275,123.54746],[-10.18468,123.54679],[-10.18777,123.54574],[-10.18945,123.54463],[-10.19105,123.54209],[-10.19222,123.53865],[-10.19235,123.53669],[-10.19254,123.53497],[-10.19358,123.53295],[-10.19424,123.53269]]
  },
  {
    id: "seg-2",
    code: "53.00.003.K",
    name: "Sp. Patung Sonbai - Sp. Tiga Bundaran Oebufu",
    district: "Kota Kupang",
    kecamatan: "Kec. Oebobo",
    lengthKm: 5.1,
    widthM: 10.00,
    surfaceType: SurfaceType.ASPHALT,
    condition: RoadCondition.SEDANG,
    constYear: 2020,
    startLat: -10.176075,
    startLng: 123.623574,
    endLat: -10.163439,
    endLng: 123.58205,
    description: "Kondisi permukaan sedang, terdapat beberapa retak ringan di sekitar bundaran.",
    lastUpdated: "Kemarin, 14:15 WITA",
    surveyor: "Ahmad Ridwan",
    path: [[-10.176075,123.623574],[-10.17526,123.62093],[-10.17476,123.61842],[-10.1733,123.61388],[-10.17224,123.61106],[-10.17052,123.60842],[-10.168627,123.605659],[-10.16712,123.60377],[-10.16694,123.60143],[-10.16744,123.59862],[-10.166851,123.596554],[-10.165228,123.59342],[-10.16459,123.589941],[-10.164373,123.588083],[-10.164027,123.584064],[-10.163795,123.582445],[-10.163439,123.58205]]
  },
  {
    id: "seg-3",
    code: "53.00.099",
    name: "Koro (Bts. Kab. Ende) - Maumere",
    district: "Kab. Sikka",
    kecamatan: "Kec. Alok",
    lengthKm: 36.58,
    widthM: 7.00,
    surfaceType: SurfaceType.HOTMIX_AC_WC,
    condition: RoadCondition.MANTAP,
    constYear: 2022,
    startLat: -8.617398,
    startLng: 122.216864,
    endLat: -8.53312,
    endLng: 121.993519,
    description: "Kondisi lapis permukaan sangat mantap, marka jalan terlihat jelas sepanjang ruas antar kabupaten.",
    lastUpdated: "2 Hari Lalu",
    surveyor: "Budi Santoso",
    path: [[-8.617398,122.216864],[-8.612257,122.201212],[-8.596093,122.190893],[-8.565164,122.164871],[-8.551421,122.141443],[-8.545704,122.127279],[-8.539484,122.109718],[-8.544765,122.084697],[-8.529051,122.078879],[-8.524788,122.069314],[-8.531167,122.060352],[-8.532714,122.042197],[-8.525996,122.023934],[-8.523866,122.011052],[-8.528874,122.001337],[-8.533202,121.995098],[-8.53312,121.993519]]
  },
  {
    id: "seg-4",
    code: "53.00.029",
    name: "Soe - Kapan",
    district: "Kab. Timor Tengah Selatan",
    kecamatan: "Kec. Soe",
    lengthKm: 16.8,
    widthM: 6.50,
    surfaceType: SurfaceType.RIGID_PAVEMENT,
    condition: RoadCondition.SEDANG,
    constYear: 2019,
    startLat: -9.738807,
    startLng: 124.273324,
    endLat: -9.861537,
    endLng: 124.272374,
    description: "Permukaan beton kokoh, terdapat penurunan minor di beberapa oprit jembatan pegunungan.",
    lastUpdated: "3 Hari Lalu",
    surveyor: "Ahmad Ridwan",
    path: [[-9.738807,124.273324],[-9.747609,124.271198],[-9.755871,124.269202],[-9.763083,124.274676],[-9.771391,124.277886],[-9.782024,124.281409],[-9.785857,124.281216],[-9.786429,124.281216],[-9.788061,124.279786],[-9.793466,124.27959],[-9.806673,124.281348],[-9.817398,124.284698],[-9.83182,124.281577],[-9.840812,124.280322],[-9.849706,124.279778],[-9.858124,124.274355],[-9.861537,124.272374]]
  },
  {
    id: "seg-5",
    code: "53.00.100",
    name: "Hepang - Sikka",
    district: "Kab. Sikka",
    kecamatan: "Kec. Maumere",
    lengthKm: 8.65,
    widthM: 6.00,
    surfaceType: SurfaceType.ASPHALT,
    condition: RoadCondition.RUSAK_RINGAN,
    constYear: 2018,
    startLat: -8.747971,
    startLng: 122.194564,
    endLat: -8.709622,
    endLng: 122.149433,
    description: "Bergelombang di beberapa segmen akibat beban lalu lintas dan curah hujan tinggi. Diperlukan penambalan.",
    lastUpdated: "5 Hari Lalu",
    surveyor: "Budi Santoso",
    path: [[-8.747971,122.194564],[-8.74443,122.192447],[-8.740003,122.188821],[-8.73577,122.185245],[-8.731795,122.181349],[-8.728773,122.174768],[-8.729059,122.171664],[-8.72904,122.165631],[-8.728316,122.159517],[-8.726866,122.154353],[-8.72489,122.14984],[-8.719736,122.150821],[-8.715328,122.150356],[-8.708692,122.151472],[-8.70959,122.149956],[-8.709622,122.149433]]
  },
  {
    id: "seg-6",
    code: "53.00.072",
    name: "Sp. Nggorang - Sp. Terang",
    district: "Kab. Manggarai Barat",
    kecamatan: "Kec. Komodo",
    lengthKm: 32.9,
    widthM: 4.50,
    surfaceType: SurfaceType.TELFORD,
    condition: RoadCondition.RUSAK_BERAT,
    constYear: 2015,
    startLat: -8.499183,
    startLng: 120.079598,
    endLat: -8.549009,
    endLng: 119.918581,
    description: "Konstruksi telford rusak di beberapa titik, batu permukaan terlepas, memerlukan peningkatan struktur jalan.",
    lastUpdated: "1 Minggu Lalu",
    surveyor: "Ahmad Ridwan",
    path: [[-8.499183,120.079598],[-8.510854,120.066903],[-8.524932,120.05371],[-8.504307,120.05222],[-8.487808,120.033681],[-8.480311,120.031635],[-8.477449,120.01162],[-8.49586,119.997696],[-8.499958,119.986006],[-8.508137,119.976113],[-8.519721,119.96255],[-8.518234,119.954535],[-8.530877,119.947955],[-8.531829,119.938048],[-8.540677,119.930362],[-8.549009,119.918581]]
  },
  {
    id: "seg-7",
    code: "53.00.095",
    name: "Detusoko - Maurole",
    district: "Kab. Ende",
    kecamatan: "Kec. Detusoko",
    lengthKm: 48.65,
    widthM: 7.00,
    surfaceType: SurfaceType.HOTMIX_AC_WC,
    condition: RoadCondition.MANTAP,
    constYear: 2021,
    startLat: -8.511068,
    startLng: 121.803953,
    endLat: -8.715922,
    endLng: 121.761899,
    description: "Ruas jalan lintas utara Ende beraspal mantap dan pemeliharaan rutin berjalan baik.",
    lastUpdated: "2 Minggu Lalu",
    surveyor: "Budi Santoso",
    path: [[-8.511068,121.803953],[-8.501333,121.778669],[-8.501211,121.764423],[-8.496515,121.734892],[-8.515341,121.699197],[-8.553374,121.705813],[-8.576352,121.719916],[-8.61227,121.713753],[-8.635287,121.704431],[-8.655228,121.709401],[-8.671091,121.720582],[-8.681576,121.729566],[-8.691413,121.739755],[-8.704858,121.739054],[-8.711568,121.749634],[-8.714533,121.760246],[-8.715922,121.761899]]
  }
];

export const INITIAL_MAINTENANCE_ACTIVITIES: MaintenanceActivity[] = [
  {
    id: "act-1",
    title: "Pemeliharaan Rutin",
    description: "Ruas Jl. El Tari - Km 4, Kota Kupang. Dikerjakan oleh Tim BPPW.",
    timeLabel: "Hari ini, 09:30 WITA",
    iconType: "construction",
    date: "2026-07-05"
  },
  {
    id: "act-4",
    title: "Rekonstruksi Jalan",
    description: "Rekonstruksi struktur perkerasan lentur menjadi rigid pavement pada Ruas Jl. Lintas Selatan.",
    timeLabel: "3 Hari Lalu",
    iconType: "construction",
    date: "2026-07-02"
  },
  {
    id: "act-5",
    title: "Rehabilitasi Jalan",
    description: "Pekerjaan rehabilitasi minor / overlay permukaan aspal yang retak pada Ruas Jl. W.J. Lalamentik.",
    timeLabel: "4 Hari Lalu",
    iconType: "construction",
    date: "2026-07-01"
  },
  {
    id: "act-2",
    title: "Survey Kondisi Berkala",
    description: "Ruas Ruteng - Labuan Bajo. Status survey selesai (100%).",
    timeLabel: "Kemarin, 14:15 WITA",
    iconType: "survey",
    date: "2026-07-04"
  },
  {
    id: "act-3",
    title: "Pembaruan Data Leger",
    description: "Data atribut jembatan Liliba telah diperbarui oleh Admin.",
    timeLabel: "2 Hari Lalu",
    iconType: "task_alt",
    date: "2026-07-03"
  }
];

export const DISTRICT_LIST = [
  "Kota Kupang",
  "Kab. Timor Tengah Selatan",
  "Kab. Sikka",
  "Kab. Manggarai Barat",
  "Kab. Ende"
];

export const KECAMATAN_MAP: Record<string, string[]> = {
  "Kota Kupang": ["Kec. Oebobo", "Kec. Kelapa Lima", "Kec. Maulafa", "Kec. Alak"],
  "Kab. Timor Tengah Selatan": ["Kec. Soe", "Kec. Amanuban Barat", "Kec. Mollo Utara"],
  "Kab. Sikka": ["Kec. Alok", "Kec. Maumere", "Kec. Kewapante", "Kec. Nita"],
  "Kab. Manggarai Barat": ["Kec. Komodo", "Kec. Lembor", "Kec. Sano Nggoang"],
  "Kab. Ende": ["Kec. Ende Selatan", "Kec. Ende Timur", "Kec. Detusoko"]
};
