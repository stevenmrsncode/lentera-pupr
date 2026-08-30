import React from 'react';
export const Test = () => {
  const isAdmin = true;
  return (
    <div className="grid">
        {isAdmin && (
          <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm">
            <h3 className="font-sans font-bold text-base text-on-surface mb-4 flex items-center gap-2 pb-3 border-b border-outline-variant/60">
              <UploadCloud className="w-5 h-5 text-primary" />
              Unggah Dokumen Baru
            </h3>

            <form onSubmit={handleUploadSubmit} className="flex flex-col gap-4">
              
              {/* Select Ruas Jalan */}
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">
                  Pilih Ruas Jalan
                </label>
                <select
                  value={selectedSegmentId}
                  onChange={(e) => {
                    setSelectedSegmentId(e.target.value);
                    if (selectedFile && useAiExtraction) {
                      triggerAiExtraction(selectedFile, e.target.value, docType);
                    }
                  }}
                  className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant rounded-lg font-body-sm text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                >
                  {segments.map((seg) => (
                    <option key={seg.id} value={seg.id}>
                      [{seg.code}] {seg.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Jenis Dokumen Radio Buttons */}
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
                  Jenis Dokumen
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setDocType("kartu_leger");
                      if (selectedFile && useAiExtraction) {
                        triggerAiExtraction(selectedFile, selectedSegmentId, "kartu_leger");
                      }
                    }}
                    className={`flex items-center justify-center gap-2 py-3 px-3 rounded-lg border font-semibold text-xs transition-all ${
                      docType === "kartu_leger"
                        ? "bg-primary/5 text-primary border-primary shadow-sm"
                        : "bg-surface-container-low text-on-surface-variant border-outline-variant hover:bg-surface-container-high"
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    <span>Kartu Leger (KL)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setDocType("sertifikat_jalan");
                      if (selectedFile && useAiExtraction) {
                        triggerAiExtraction(selectedFile, selectedSegmentId, "sertifikat_jalan");
                      }
                    }}
                    className={`flex items-center justify-center gap-2 py-3 px-3 rounded-lg border font-semibold text-xs transition-all ${
                      docType === "sertifikat_jalan"
                        ? "bg-primary/5 text-primary border-primary shadow-sm"
                        : "bg-surface-container-low text-on-surface-variant border-outline-variant hover:bg-surface-container-high"
                    }`}
                  >
                    <Award className="w-4 h-4" />
                    <span>Sertifikat (SHP)</span>
                  </button>
                </div>
              </div>

              {/* Drag & Drop File Zone */}
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">
                  Unggah Berkas (PDF, JPG, PNG, atau DWG)
                </label>
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all min-h-[140px] relative overflow-hidden ${
                    isDragging
                      ? "border-primary bg-primary/5"
                      : selectedFile
                      ? "border-emerald-300 bg-emerald-50/20"
                      : "border-outline-variant hover:border-primary/50 hover:bg-surface-container-low"
                  }`}
                >
                  {isScanning && (
                    <div className="absolute inset-0 bg-white/95 flex flex-col items-center justify-center gap-2.5 z-10 animate-fade-in">
                      <RefreshCw className="w-8 h-8 text-primary animate-spin" />
                      <div className="flex items-center gap-1.5 text-primary font-bold text-xs">
                        <Sparkles className="w-4 h-4 animate-pulse" />
                        <span>Mengekstrak Metadata dengan Gemini AI...</span>
                      </div>
                      <span className="text-[10px] text-on-surface-variant max-w-[200px]">Membaca dokumen, mencocokkan koordinat geometris, dan mengisi form...</span>
                    </div>
                  )}

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".pdf,.png,.jpg,.jpeg,.dwg,.docx"
                  />

                  {selectedFile ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700">
                        {selectedFile.name.endsWith(".pdf") ? (
                          <FileText className="w-6 h-6" />
                        ) : selectedFile.name.endsWith(".dwg") ? (
                          <FileCode className="w-6 h-6" />
                        ) : (
                          <FileImage className="w-6 h-6" />
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-on-surface truncate max-w-[240px]">
                          {selectedFile.name}
                        </p>
                        <p className="text-[10px] text-on-surface-variant font-mono mt-0.5">
                          {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                        Terpilih
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <UploadCloud className="w-10 h-10 text-on-surface-variant/60" />
                      <div>
                        <p className="text-xs font-bold text-on-surface">
                          Klik untuk menelusuri berkas atau seret ke sini
                        </p>
                        <p className="text-[10px] text-on-surface-variant mt-1">
                          Ukuran maksimal berkas: 20MB
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* AI Assistant Switcher */}
              <div className="bg-surface-container-low border border-outline-variant/60 rounded-lg p-3 flex items-start gap-2.5">
                <input
                  type="checkbox"
                  id="aiExtraction"
                  checked={useAiExtraction}
                  onChange={(e) => setUseAiExtraction(e.target.checked)}
                  className="mt-1 rounded border-outline text-primary focus:ring-primary h-4 w-4"
                />
                <div className="leading-tight">
                  <label htmlFor="aiExtraction" className="text-xs font-bold text-on-surface flex items-center gap-1 cursor-pointer">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    Ekstraksi Dokumen Otomatis (Gemini AI)
                  </label>
                  <p className="text-[10px] text-on-surface-variant mt-0.5">
                    Gunakan Gemini LLM untuk membaca teks berkas dan otomatis mengisi Nomor Dokumen &amp; Tanggal Terbit.
                  </p>
                </div>
              </div>

              {/* Form Metadata Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                    Nomor Dokumen
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: KL-011.11..."
                    value={documentNo}
                    onChange={(e) => setDocumentNo(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant rounded-lg font-body-sm text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                    Tanggal Terbit
                  </label>
                  <input
                    type="date"
                    required
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant rounded-lg font-body-sm text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Notes / Catatan */}
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                  Catatan Dokumen / Deskripsi
                </label>
                <textarea
                  rows={2}
                  placeholder="Tambahkan rincian validasi fisik, tanda batas, atau catatan lainnya..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant rounded-lg font-body-sm text-xs focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>

              {/* Form Actions */}
              <div className="flex flex-col gap-2 mt-2">
                {isUploading && (
                  <div className="w-full bg-surface-container-high rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-primary h-1.5 transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={resetForm}
                    disabled={isUploading || isScanning}
                    className="flex-1 py-2.5 px-4 bg-surface-container-high hover:bg-surface-dim text-on-surface font-bold text-xs rounded-lg border border-outline-variant transition-all text-center disabled:opacity-50"
                  >
                    Reset Form
                  </button>
                  <button
                    type="submit"
                    disabled={isUploading || isScanning}
                    className="flex-1 py-2.5 px-4 bg-primary hover:bg-primary-container text-white font-bold text-xs rounded-lg transition-all text-center shadow-md border border-primary-container flex items-center justify-center gap-1.5 disabled:opacity-70 disabled:cursor-wait"
                  >
                    {isUploading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Mengunggah ({Math.round(uploadProgress)}%)
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        Simpan Arsip
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Quick Informational Notice */}
          <div className="bg-blue-50 border border-blue-150 rounded-xl p-4.5 text-blue-950 text-xs flex gap-3">
            <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-bold block mb-0.5">Informasi Legalitas</span>
              Sesuai Peraturan Menteri PUPR, setiap ruas Jalan Provinsi wajib dilengkapi dengan Kartu Leger yang diperbarui minimal sekali setiap 5 tahun, dan memiliki Sertifikat Hak Pakai guna pengamanan aset daerah dari sengketa.
            </div>
          </div>
        </div>
        )}
    </div>
  );
};
