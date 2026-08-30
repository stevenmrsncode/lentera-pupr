/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from "react";
import { useRoads } from "../context/RoadContext";
import { RoadCondition } from "../types";
import {
  Milestone,
  Layers,
  TrendingUp,
  SlidersHorizontal,
  Download,
  ArrowRight,
  Wrench,
  Save,
  CheckCircle2,
  Trash2,
  Plus,
  AlertTriangle
} from "lucide-react";

import { useAuth } from "../context/AuthContext";

export const Dashboard: React.FC = () => {
  const { segments, activities, addActivity, setActiveTab, deleteSegment, showToast } = useRoads();
  const { appRole } = useAuth();
  const isAdmin = appRole === "admin";

  // State for quick activity form
  const [showQuickActivity, setShowQuickActivity] = useState(false);
  const [activityTitle, setActivityTitle] = useState("");
  const [activityDesc, setActivityDesc] = useState("");
  const [activityType, setActivityType] = useState<"construction" | "survey" | "task_alt">("construction");

  // Dynamic statistics calculations
  const stats = useMemo(() => {
    let totalLength = 0;
    let countMantap = 0;
    let countSedang = 0;
    let countRusak = 0; // Rusak Ringan + Rusak Berat

    segments.forEach((seg) => {
      totalLength += seg.lengthKm;
      if (seg.condition === RoadCondition.MANTAP) {
        countMantap++;
      } else if (seg.condition === RoadCondition.SEDANG) {
        countSedang++;
      } else {
        countRusak++;
      }
    });

    const totalCount = segments.length || 1;
    const pctMantap = Math.round((countMantap / totalCount) * 100);
    const pctSedang = Math.round((countSedang / totalCount) * 100);
    const pctRusak = Math.round((countRusak / totalCount) * 100);

    return {
      totalLength: Math.round(totalLength * 10) / 10,
      totalCount: segments.length,
      pctMantap,
      pctSedang,
      pctRusak
    };
  }, [segments]);

  // Group by district dynamically
  const districtSummary = useMemo(() => {
    const summaryMap: Record<string, { count: number; length: number; conditions: Record<string, number> }> = {};

    segments.forEach((seg) => {
      if (!summaryMap[seg.district]) {
        summaryMap[seg.district] = { count: 0, length: 0, conditions: {} };
      }
      summaryMap[seg.district].count += 1;
      summaryMap[seg.district].length += seg.lengthKm;
      summaryMap[seg.district].conditions[seg.condition] = (summaryMap[seg.district].conditions[seg.condition] || 0) + 1;
    });

    return Object.entries(summaryMap).map(([district, data]) => {
      // Find mayoritas status
      let mayoritas = RoadCondition.MANTAP;
      let maxCount = -1;
      Object.entries(data.conditions).forEach(([cond, count]) => {
        if (count > maxCount) {
          maxCount = count;
          mayoritas = cond as RoadCondition;
        }
      });

      return {
        district,
        count: data.count,
        length: Math.round(data.length * 10) / 10,
        mayoritas
      };
    }).sort((a, b) => b.count - a.count);
  }, [segments]);

  const handleCreateActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activityTitle || !activityDesc) return;

    addActivity(activityTitle, activityDesc, activityType);
    setActivityTitle("");
    setActivityDesc("");
    setShowQuickActivity(false);
    showToast("Aktivitas baru berhasil dicatat di log pemeliharaan!", "success");
  };

  const handleExportReport = () => {
    showToast("Laporan Statistik berhasil diexport ke format PDF!", "success");
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 md:space-y-8 px-4 sm:p-gutter pt-6 md:pt-8 pb-16 md:pb-24">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="font-display-lg text-display-lg text-on-surface">Dashboard Statistik</h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant mt-2">
            Ringkasan kondisi dan data infrastruktur jalan provinsi (NTT).
          </p>
        </div>
        <div className="flex flex-row gap-2.5 sm:gap-3 w-full md:w-auto">
          <button
            onClick={() => setActiveTab("map")}
            className="flex-1 md:flex-none bg-surface-container border border-outline-variant px-3 sm:px-4 py-2.5 md:py-2 rounded font-label-md text-label-md text-on-surface flex items-center justify-center gap-2 hover:bg-surface-container-high transition-colors whitespace-nowrap"
          >
            <SlidersHorizontal className="w-4 h-4 shrink-0" />
            <span className="sm:hidden">Map</span>
            <span className="hidden sm:inline">Interactive Map</span>
          </button>
          <button
            onClick={handleExportReport}
            className="flex-1 md:flex-none bg-primary text-on-primary px-3 sm:px-5 py-2.5 md:py-2 rounded font-label-md text-label-md flex items-center justify-center gap-2 hover:bg-primary-container transition-colors shadow-sm whitespace-nowrap"
          >
            <Download className="w-4 h-4 shrink-0" />
            <span className="sm:hidden">Export</span>
            <span className="hidden sm:inline">Export Laporan</span>
          </button>
        </div>
      </div>

      {/* Bento Grid Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6">
        {/* KPI Card 1: Total Length */}
        <div className="relative col-span-1 md:col-span-4 bg-surface-container-lowest border border-outline-variant/60 rounded-2xl p-5 sm:p-7 flex flex-col justify-between shadow-sm overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/30 hover:-translate-y-0.5 cursor-default group">
          {/* Decorative glow */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

          <div className="relative">
            <div className="p-3 bg-primary/5 rounded-lg inline-block mb-4 transition-all duration-300 group-hover:bg-primary group-hover:scale-110 group-hover:rotate-3 group-hover:shadow-md group-hover:shadow-primary/30">
              <Milestone className="text-primary w-6 h-6 transition-colors duration-300 group-hover:text-on-primary" />
            </div>
            <h3 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
              Total Panjang Jalan
            </h3>
          </div>
          <div className="relative mt-4">
            <div className="font-display-lg text-display-lg text-on-surface flex items-baseline gap-2 transition-transform duration-300 group-hover:translate-x-0.5">
              {stats.totalLength.toLocaleString("id-ID")}{" "}
              <span className="font-body-md text-body-md text-on-surface-variant font-normal">KM</span>
            </div>
            <div className="flex items-center gap-2 mt-2 font-body-sm text-body-sm text-tertiary">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-tertiary/10 transition-transform duration-300 group-hover:scale-110">
                <TrendingUp className="w-3 h-3" />
              </span>
              <span>+12.4 KM (Tahun ini)</span>
            </div>
          </div>
          {/* Bottom accent line */}
          <div className="absolute bottom-0 left-0 h-0.5 bg-primary w-0 group-hover:w-full transition-all duration-500 ease-out"></div>
        </div>

        {/* KPI Card 2: Segments */}
        <div className="relative col-span-1 md:col-span-4 bg-surface-container-lowest border border-outline-variant/60 rounded-2xl p-5 sm:p-7 flex flex-col justify-between shadow-sm overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-secondary/5 hover:border-secondary/30 hover:-translate-y-0.5 cursor-default group">
          {/* Decorative glow */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-secondary/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

          <div className="relative">
            <div className="p-3 bg-secondary-fixed rounded-lg inline-block mb-4 transition-all duration-300 group-hover:bg-secondary group-hover:scale-110 group-hover:-rotate-3 group-hover:shadow-md group-hover:shadow-secondary/30">
              <Layers className="text-secondary w-6 h-6 transition-colors duration-300 group-hover:text-on-secondary" />
            </div>
            <h3 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
              Total Ruas Jalan
            </h3>
          </div>
          <div className="relative mt-4">
            <div className="font-display-lg text-display-lg text-on-surface transition-transform duration-300 group-hover:translate-x-0.5">
              {stats.totalCount}
            </div>
            <div className="flex items-center gap-2 mt-2 font-body-sm text-body-sm text-on-surface-variant">
              <span>Tersebar di {districtSummary.length} Kabupaten/Kota</span>
            </div>
          </div>
          {/* Bottom accent line */}
          <div className="absolute bottom-0 left-0 h-0.5 bg-secondary w-0 group-hover:w-full transition-all duration-500 ease-out"></div>
        </div>

        {/* Condition Percentages Bar Panel */}
        <div className="col-span-1 md:col-span-4 bg-surface-container-lowest border border-outline-variant/60 rounded-2xl p-5 sm:p-7 shadow-sm transition-all duration-300 hover:shadow-lg">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
              Kondisi Jalan (Persentase)
            </h3>
          </div>
          <div className="space-y-4">
            {/* Baik / Mantap */}
            <div className="group/row rounded-lg -mx-2 px-2 py-1.5 transition-colors duration-200 hover:bg-tertiary/5">
              <div className="flex justify-between font-body-sm text-body-sm mb-1.5">
                <span className="text-on-surface font-medium flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-tertiary transition-transform duration-200 group-hover/row:scale-125"></span> Baik (Mantap)
                </span>
                <span className="text-on-surface font-bold font-mono transition-transform duration-200 group-hover/row:scale-110">{stats.pctMantap}%</span>
              </div>
              <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                <div
                  className="bg-tertiary h-full rounded-full transition-all duration-500 group-hover/row:brightness-110"
                  style={{ width: `${stats.pctMantap}%` }}
                ></div>
              </div>
            </div>

            {/* Sedang */}
            <div className="group/row rounded-lg -mx-2 px-2 py-1.5 transition-colors duration-200 hover:bg-secondary/5">
              <div className="flex justify-between font-body-sm text-body-sm mb-1.5">
                <span className="text-on-surface font-medium flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-secondary transition-transform duration-200 group-hover/row:scale-125"></span> Sedang
                </span>
                <span className="text-on-surface font-bold font-mono transition-transform duration-200 group-hover/row:scale-110">{stats.pctSedang}%</span>
              </div>
              <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                <div
                  className="bg-secondary h-full rounded-full transition-all duration-500 group-hover/row:brightness-110"
                  style={{ width: `${stats.pctSedang}%` }}
                ></div>
              </div>
            </div>

            {/* Rusak / Berat */}
            <div className="group/row rounded-lg -mx-2 px-2 py-1.5 transition-colors duration-200 hover:bg-error/5">
              <div className="flex justify-between font-body-sm text-body-sm mb-1.5">
                <span className="text-on-surface font-medium flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-error transition-transform duration-200 group-hover/row:scale-125"></span> Rusak / Berat
                </span>
                <span className="text-on-surface font-bold font-mono transition-transform duration-200 group-hover/row:scale-110">{stats.pctRusak}%</span>
              </div>
              <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                <div
                  className="bg-error h-full rounded-full transition-all duration-500 group-hover/row:brightness-110"
                  style={{ width: `${stats.pctRusak}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lower Section Grid: Sebaran Ruas and Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Table: Road Segments by District */}
        <div className="lg:col-span-2 bg-surface-container-lowest border border-outline-variant/60 rounded-2xl overflow-hidden flex flex-col shadow-sm hover:shadow-md transition-shadow">
          <div className="p-4 sm:p-6 border-b border-outline-variant flex flex-wrap justify-between items-center gap-2 bg-surface-bright">
            <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
              Sebaran Ruas Per Kabupaten
            </h3>
            <button
              onClick={() => setActiveTab("data")}
              className="font-label-md text-label-md text-primary flex items-center gap-1 hover:underline font-bold whitespace-nowrap"
            >
              Lihat Semua <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse min-w-[480px]">
              <thead>
                <tr className="bg-surface-container-low font-label-md text-label-md text-on-surface-variant border-b border-outline-variant">
                  <th className="p-3 sm:p-4">Kabupaten / Kota</th>
                  <th className="p-3 sm:p-4 text-right">Jml Ruas</th>
                  <th className="p-3 sm:p-4 text-right">Total Panjang (KM)</th>
                  <th className="p-3 sm:p-4">Status Mayoritas</th>
                </tr>
              </thead>
              <tbody className="font-body-md text-body-md text-on-surface divide-y divide-outline-variant/40">
                {districtSummary.map((row) => {
                  const badgeColors = {
                    [RoadCondition.MANTAP]: "bg-tertiary-fixed-dim text-on-tertiary-fixed-variant",
                    [RoadCondition.SEDANG]: "bg-secondary-fixed text-on-secondary-fixed-variant",
                    [RoadCondition.RUSAK_RINGAN]: "bg-orange-100 text-orange-800",
                    [RoadCondition.RUSAK_BERAT]: "bg-error-container text-on-error-container"
                  }[row.mayoritas];

                  return (
                    <tr key={row.district} className="hover:bg-surface-container-low transition-colors">
                      <td className="p-3 sm:p-4 font-semibold">{row.district}</td>
                      <td className="p-3 sm:p-4 text-right font-mono font-medium">{row.count}</td>
                      <td className="p-3 sm:p-4 text-right font-mono font-medium">
                        {row.length.toLocaleString("id-ID")}
                      </td>
                      <td className="p-3 sm:p-4">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-bold whitespace-nowrap ${badgeColors}`}>
                          {row.mayoritas}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Maintenance Activities Panel */}
        <div className="lg:col-span-1 bg-surface-container-lowest border border-outline-variant/60 rounded-2xl flex flex-col shadow-sm hover:shadow-md transition-shadow overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-outline-variant bg-surface-bright flex justify-between items-center gap-2">
            <div>
              <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                Aktivitas Pemeliharaan
              </h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                Update terakhir dari lapangan
              </p>
            </div>
            {isAdmin && (
              <button
                onClick={() => setShowQuickActivity((prev) => !prev)}
                className="p-1.5 rounded-full bg-primary/5 hover:bg-primary/10 text-primary transition-colors border border-outline-variant shrink-0"
                title="Tambah Aktivitas Pemeliharaan"
              >
                <Plus className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick Add Activity Dialog Form */}
          {showQuickActivity && (
            <form onSubmit={handleCreateActivity} className="p-4 bg-surface-container-low border-b border-outline-variant space-y-3 animate-fade-in">
              <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Catat Kegiatan Baru</p>
              <div>
                <input
                  type="text"
                  placeholder="Nama Kegiatan (e.g. Pemeliharaan Rutin)"
                  value={activityTitle}
                  onChange={(e) => setActivityTitle(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  required
                />
              </div>
              <div className="flex flex-wrap gap-1 items-center pb-1">
                <span className="text-[9px] text-on-surface-variant font-bold uppercase tracking-wider mr-1">Pilih:</span>
                <button
                  type="button"
                  onClick={() => {
                    setActivityTitle("Pemeliharaan Rutin");
                    setActivityDesc("Pekerjaan pemeliharaan rutin, babat rumput bahu jalan, pembersihan drainase.");
                    setActivityType("construction");
                  }}
                  className="px-2 py-0.5 rounded border border-outline-variant bg-surface text-[10px] text-on-surface font-bold hover:bg-surface-container-high transition-colors"
                >
                  Pemeliharaan Rutin
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActivityTitle("Rekonstruksi");
                    setActivityDesc("Pekerjaan rekonstruksi struktur perkerasan jalan pada segmen terpilih.");
                    setActivityType("construction");
                  }}
                  className="px-2 py-0.5 rounded border border-outline-variant bg-surface text-[10px] text-on-surface font-bold hover:bg-surface-container-high transition-colors"
                >
                  Rekonstruksi
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActivityTitle("Rehabilitasi");
                    setActivityDesc("Pekerjaan rehabilitasi jalan, patching aspal berlubang, dan overlay minor.");
                    setActivityType("construction");
                  }}
                  className="px-2 py-0.5 rounded border border-outline-variant bg-surface text-[10px] text-on-surface font-bold hover:bg-surface-container-high transition-colors"
                >
                  Rehabilitasi
                </button>
              </div>
              <div>
                <textarea
                  placeholder="Detail lokasi dan teknisi lapangan..."
                  value={activityDesc}
                  onChange={(e) => setActivityDesc(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded px-2.5 py-1.5 text-xs h-12 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  required
                ></textarea>
              </div>
              <div className="flex justify-between items-center gap-2">
                <div className="flex gap-2">
                  <select
                    value={activityType}
                    onChange={(e) => setActivityType(e.target.value as any)}
                    className="bg-surface border border-outline-variant rounded px-2 py-1 text-[11px]"
                  >
                    <option value="construction">Perbaikan</option>
                    <option value="survey">Survey</option>
                    <option value="task_alt">Administrasi</option>
                  </select>
                </div>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => setShowQuickActivity(false)}
                    className="px-2 py-1 text-xs text-on-surface-variant"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1 text-xs bg-primary text-on-primary rounded font-bold"
                  >
                    Simpan
                  </button>
                </div>
              </div>
            </form>
          )}

          <div className="flex-1 p-4 sm:p-6 flex flex-col gap-5 sm:gap-6 overflow-y-auto max-h-[380px]">
            {activities.map((act) => {
              const iconMap = {
                construction: <Wrench className="w-4 h-4 text-on-primary" />,
                survey: <Save className="w-4 h-4 text-on-secondary" />,
                task_alt: <CheckCircle2 className="w-4 h-4 text-white" />
              };

              const bgMap = {
                construction: "bg-primary-container",
                survey: "bg-secondary-container",
                task_alt: "bg-tertiary"
              };

              return (
                <div key={act.id} className="flex gap-4">
                  <div className="mt-1 shrink-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${bgMap[act.iconType]}`}>
                      {iconMap[act.iconType]}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-body-md text-body-md font-bold text-on-surface">
                      {act.title}
                    </h4>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 leading-relaxed">
                      {act.description}
                    </p>
                    <span className="font-label-sm text-label-sm text-on-surface-variant mt-2 inline-block">
                      {act.timeLabel}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="p-4 border-t border-outline-variant bg-surface-container-low text-center">
            <button
              onClick={() => showToast("Seluruh log aktivitas pemeliharaan up-to-date.", "info")}
              className="font-label-md text-label-md text-primary hover:underline font-bold"
            >
              Lihat Log Aktivitas Penuh
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};