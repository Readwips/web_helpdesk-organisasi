import { useState, useRef } from 'react';
import {
  UploadCloud, FileSpreadsheet, CheckCircle2, XCircle,
  AlertTriangle, Play, Download, RefreshCw, X
} from 'lucide-react';
import { importService } from '../services';
import toast from 'react-hot-toast';

interface PreviewRow {
  requester_name?: string;
  department?: string;
  category?: string;
  issue?: string;
  priority?: string;
  status?: string;
  created_at?: string;
  [key: string]: string | undefined;
}

interface ValidationResult {
  totalRows: number;
  validCount: number;
  invalidCount: number;
  duplicateCount: number;
  preview: PreviewRow[];
  rawRows: PreviewRow[];
  invalidRows: { row: number; reason: string }[];
}

type ImportStep = 'upload' | 'preview' | 'done';

const PRIORITY_COLOR: Record<string, string> = {
  critical: 'priority-critical', high: 'priority-high',
  medium: 'priority-medium', low: 'priority-low',
};

export default function ImportPage() {
  const [step, setStep] = useState<ImportStep>('upload');
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ imported: number; failed: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    const ext = f.name.split('.').pop()?.toLowerCase();
    if (!['csv', 'xlsx', 'xls'].includes(ext || '')) {
      toast.error('Hanya file CSV atau Excel (.xlsx/.xls) yang diperbolehkan');
      return;
    }
    setFile(f);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleValidate = async () => {
    if (!file) return;
    setIsValidating(true);
    try {
      const res = await importService.validate(file);
      setValidation(res.data.data);
      setStep('preview');
    } catch {
      toast.error('Gagal memvalidasi file. Periksa format kolom.');
    } finally {
      setIsValidating(false);
    }
  };

  const handleImport = async () => {
    if (!validation?.rawRows) return;
    setIsImporting(true);
    try {
      const res = await importService.execute(validation.rawRows as Record<string, string>[]);
      setImportResult(res.data.data);
      setStep('done');
      toast.success(res.data.message);
    } catch {
      toast.error('Import gagal. Coba lagi.');
    } finally {
      setIsImporting(false);
    }
  };

  const handleReset = () => {
    setStep('upload');
    setFile(null);
    setValidation(null);
    setImportResult(null);
  };

  // ─── Template download (Excel) ──
  const downloadTemplate = async () => {
    try {
      const res = await importService.downloadTemplate();
      const blob = new Blob([res.data]);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'template-import-tiket.xlsx';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Gagal mengunduh template');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Import Data</h1>
          <p className="text-sm text-muted-foreground mt-1">Upload file CSV atau Excel untuk import tiket secara massal</p>
        </div>
        <button onClick={downloadTemplate} className="btn-secondary">
          <Download size={16} /> Download Template Excel
        </button>
      </div>

      {/* ── Progress Steps ── */}
      <div className="flex items-center gap-2">
        {(['upload', 'preview', 'done'] as ImportStep[]).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors
              ${step === s ? 'bg-primary-600 text-foreground' : 
                (step === 'preview' && i === 0) || step === 'done' ? 'bg-emerald-600 text-foreground' : 
                'bg-dark-border text-muted-foreground'}`}
            >
              {((step === 'preview' && i === 0) || step === 'done') && i < ['upload','preview','done'].indexOf(step)
                ? <CheckCircle2 size={14} />
                : i + 1}
            </div>
            <span className={`text-sm font-medium capitalize ${step === s ? 'text-foreground' : 'text-muted-foreground'}`}>
              {s === 'upload' ? '1. Upload File' : s === 'preview' ? '2. Preview & Validasi' : '3. Selesai'}
            </span>
            {i < 2 && <div className="w-8 h-px bg-dark-border mx-1" />}
          </div>
        ))}
      </div>

      {/* ══ STEP 1: UPLOAD ══ */}
      {step === 'upload' && (
        <div className="card p-8">
          {/* Drop Zone */}
          <div
            className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all
              ${isDragging
                ? 'border-primary-500 bg-primary-500/10'
                : file
                  ? 'border-emerald-500 bg-emerald-500/10'
                  : 'border-dark-border hover:border-primary-600/60 hover:bg-primary-600/5'
              }`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />

            {file ? (
              <div className="flex flex-col items-center gap-3">
                <FileSpreadsheet size={52} className="text-emerald-400" />
                <div>
                  <p className="text-foreground font-semibold">{file.name}</p>
                  <p className="text-muted-foreground text-sm">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
                <button
                  className="p-1 text-muted-foreground hover:text-red-400 transition-colors"
                  onClick={(e) => { e.stopPropagation(); setFile(null); }}
                >
                  <X size={16} /> Hapus file
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <UploadCloud size={52} className="text-muted-foreground" />
                <div>
                  <p className="text-foreground font-medium">Drag & drop file di sini, atau klik untuk memilih</p>
                  <p className="text-muted-foreground text-sm mt-1">Mendukung: CSV, Excel (.xlsx, .xls) — Maks. 10 MB</p>
                </div>
              </div>
            )}
          </div>

          {/* Kolom yang dibutuhkan */}
          <div className="mt-6 p-4 bg-dark-bg rounded-lg border border-dark-border">
            <p className="text-sm font-semibold text-foreground mb-2">📋 Kolom yang Diperlukan:</p>
            <div className="flex flex-wrap gap-2">
              {['requester_name*', 'department*', 'category*', 'issue*', 'priority*', 'status', 'technician', 'created_at', 'resolved_at', 'resolution_notes'].map(col => (
                <span
                  key={col}
                  className={`px-2 py-0.5 rounded text-xs font-mono ${col.endsWith('*') ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'bg-dark-surface text-muted-foreground border border-dark-border'}`}
                >
                  {col}
                </span>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">* Kolom wajib diisi. Priority: critical/high/medium/low</p>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={handleValidate}
              disabled={!file || isValidating}
              className="btn-primary"
            >
              {isValidating
                ? <><RefreshCw size={16} className="animate-spin" /> Memvalidasi...</>
                : <><Play size={16} /> Validasi & Preview</>
              }
            </button>
          </div>
        </div>
      )}

      {/* ══ STEP 2: PREVIEW ══ */}
      {step === 'preview' && validation && (
        <div className="space-y-4">
          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="card p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{validation.totalRows}</p>
              <p className="text-xs text-muted-foreground mt-1">Total Baris</p>
            </div>
            <div className="card p-4 text-center border-emerald-500/30">
              <p className="text-2xl font-bold text-emerald-400">{validation.validCount}</p>
              <p className="text-xs text-muted-foreground mt-1">Valid & Siap Import</p>
            </div>
            <div className="card p-4 text-center border-red-500/30">
              <p className="text-2xl font-bold text-red-400">{validation.invalidCount}</p>
              <p className="text-xs text-muted-foreground mt-1">Tidak Valid</p>
            </div>
            <div className="card p-4 text-center border-amber-500/30">
              <p className="text-2xl font-bold text-amber-400">{validation.duplicateCount}</p>
              <p className="text-xs text-muted-foreground mt-1">Duplikat (dilewati)</p>
            </div>
          </div>

          {/* Invalid rows warning */}
          {validation.invalidRows.length > 0 && (
            <div className="card p-4 border-red-500/30">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={16} className="text-red-400" />
                <h3 className="text-sm font-semibold text-red-400">Baris yang Tidak Valid (akan dilewati):</h3>
              </div>
              <div className="space-y-1 max-h-32 overflow-y-auto custom-scrollbar">
                {validation.invalidRows.map(({ row, reason }) => (
                  <p key={row} className="text-xs text-muted-foreground">
                    <span className="text-red-400 font-mono">Baris {row}:</span> {reason}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Preview table */}
          <div className="card">
            <div className="px-5 py-4 border-b border-dark-border">
              <h3 className="text-sm font-semibold text-foreground">Preview (10 data pertama dari {validation.validCount} data valid)</h3>
            </div>
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Requester</th>
                    <th>Departemen</th>
                    <th>Kategori</th>
                    <th>Issue</th>
                    <th>Prioritas</th>
                    <th>Status</th>
                    <th>Tgl Dibuat</th>
                  </tr>
                </thead>
                <tbody>
                  {validation.preview.map((row, i) => (
                    <tr key={i}>
                      <td className="text-muted-foreground">{i + 1}</td>
                      <td className="text-foreground">{row.requester_name}</td>
                      <td className="text-xs text-muted-foreground">{row.department}</td>
                      <td className="text-xs text-muted-foreground">{row.category}</td>
                      <td className="max-w-[200px]">
                        <div className="truncate text-foreground text-xs" title={row.issue}>{row.issue}</div>
                      </td>
                      <td>
                        <span className={PRIORITY_COLOR[row.priority?.toLowerCase() || ''] || 'badge'}>
                          {row.priority}
                        </span>
                      </td>
                      <td className="text-xs text-muted-foreground">{row.status || 'OPEN'}</td>
                      <td className="text-xs text-muted-foreground">{row.created_at || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between">
            <button onClick={handleReset} className="btn-secondary">
              <RefreshCw size={16} /> Upload Ulang
            </button>
            <button
              onClick={handleImport}
              disabled={isImporting || validation.validCount === 0}
              className="btn-primary"
            >
              {isImporting
                ? <><RefreshCw size={16} className="animate-spin" /> Mengimport...</>
                : <><UploadCloud size={16} /> Import {validation.validCount} Tiket</>
              }
            </button>
          </div>
        </div>
      )}

      {/* ══ STEP 3: DONE ══ */}
      {step === 'done' && importResult && (
        <div className="card p-12 flex flex-col items-center text-center">
          <CheckCircle2 size={64} className="text-emerald-400 mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Import Berhasil!</h2>
          <p className="text-muted-foreground mb-8">Data tiket telah berhasil ditambahkan ke sistem</p>

          <div className="flex gap-8 mb-8">
            <div>
              <p className="text-4xl font-bold text-emerald-400">{importResult.imported}</p>
              <p className="text-sm text-muted-foreground mt-1">Tiket Berhasil Diimport</p>
            </div>
            {importResult.failed > 0 && (
              <div>
                <p className="text-4xl font-bold text-red-400">{importResult.failed}</p>
                <p className="text-sm text-muted-foreground mt-1">Tiket Gagal</p>
              </div>
            )}
          </div>

          <button onClick={handleReset} className="btn-primary">
            <UploadCloud size={16} /> Import File Lain
          </button>
        </div>
      )}
    </div>
  );
}
