import { useState, useRef } from 'react';
import { X, Files, FolderOpen, Upload, CheckCircle2, CloudUpload, AlertCircle, FileText } from 'lucide-react';
import { Button } from '../ui/button';
import { useSapiens } from '../../hooks/useSapiens';
import { useSapiensStore } from '../../core/state/sapiensStore';
import { formatFileSize } from '../../utils/formatters';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from '../ui/dialog';
import { ScrollArea } from '../ui/scroll-area';

type FileWithPath = File & { webkitRelativePath?: string };

const getName = (f: FileWithPath) =>
  f.webkitRelativePath ? (f.webkitRelativePath.split('/').pop() || f.name) : f.name;
const getDir = (f: FileWithPath) =>
  f.webkitRelativePath?.includes('/') ? f.webkitRelativePath.slice(0, f.webkitRelativePath.lastIndexOf('/')) : '';

const EXT: Record<string, { fg: string; bg: string }> = {
  pdf:  { fg: 'var(--sp-danger, #f87171)', bg: 'rgba(239,68,68,0.15)' },
  py:   { fg: 'var(--sp-warning, #fbbf24)', bg: 'rgba(251,191,36,0.15)' },
  ts:   { fg: 'var(--sp-accent, #60a5fa)', bg: 'rgba(96,165,250,0.15)' },
  tsx:  { fg: 'var(--sp-accent, #22d3ee)', bg: 'rgb(var(--sp-accent-rgb, 34 211 238) / 0.15)' },
  js:   { fg: 'var(--sp-warning, #fbbf24)', bg: 'rgba(251,191,36,0.12)' },
  json: { fg: 'var(--sp-success, #34d399)', bg: 'rgba(52,211,153,0.15)' },
  md:   { fg: 'var(--sp-accent, #c084fc)', bg: 'rgba(192,132,252,0.15)' },
  txt:  { fg: 'var(--sp-muted, #94a3b8)', bg: 'rgba(148,163,184,0.15)' },
  csv:  { fg: 'var(--sp-success, #34d399)', bg: 'rgba(52,211,153,0.12)' },
  docx: { fg: 'var(--sp-accent, #60a5fa)', bg: 'rgba(96,165,250,0.15)' },
  doc:  { fg: 'var(--sp-accent, #60a5fa)', bg: 'rgba(96,165,250,0.15)' },
};
function getExt(name: string) {
  const e = name.split('.').pop()?.toLowerCase() ?? '';
  return { str: e.toUpperCase().slice(0, 4) || '?', ...(EXT[e] ?? { fg: 'var(--sp-muted, #94a3b8)', bg: 'rgba(148,163,184,0.15)' }) };
}

function ExtBadge({ name }: { name: string }) {
  const { str, fg, bg } = getExt(name);
  return (
    <span className="flex-shrink-0 text-[9px] px-1.5 py-0.5 rounded font-mono leading-none"
      style={{ color: fg, background: bg, border: `1px solid color-mix(in srgb, ${fg} 25.1%, transparent)` }}>
      {str}
    </span>
  );
}

export function CombinedInputPanel() {
  const [files, setFiles] = useState<FileWithPath[]>([]);
  const [uploading, setUploading] = useState(false);
  const [acceptedCount, setAcceptedCount] = useState(0);
  const inFlight = useRef(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const folderRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { uploadFiles } = useSapiens();
  const status = useSapiensStore((s) => s.status);

  const add = (f: FileWithPath[]) => { setFiles((p) => [...p, ...f]); setDone(false); setErr(false); };
  const disabled = uploading || status === 'processing';
  const totalSize = files.reduce((a, f) => a + f.size, 0);
  const PREVIEW = 6;

  const clear = () => {
    setFiles([]); setAcceptedCount(0); setDone(false); setErr(false);
    if (fileRef.current) fileRef.current.value = '';
    if (folderRef.current) folderRef.current.value = '';
  };

  const upload = async () => {
    if (!files.length || inFlight.current || err) return;
    inFlight.current = true;
    setUploading(true); setDone(false); setErr(false);
    try {
      const result = await uploadFiles(files);
      setAcceptedCount(result.documents.length); setDone(true);
    } catch {
      setErr(true);
    } finally { inFlight.current = false; setUploading(false); }
  };

  const folderLabel = (() => {
    if (!files.length) return '';
    const p = (files[0].webkitRelativePath || files[0].name).split('/');
    return p.length > 1 ? p[0] : '';
  })();

  return (
    <div className="h-full flex flex-col rounded-2xl overflow-hidden relative"
      style={{
        background: 'rgb(var(--sp-panel-rgb, 8 12 22) / 0.85)',
        border: '1px solid rgba(16,185,129,0.22)',
        boxShadow: '0 0 0 1px rgba(16,185,129,0.08), inset 0 1px 0 rgba(16,185,129,0.12), 0 30px 60px rgb(var(--sp-shadow-rgb, 0 0 0) / var(--sp-shadow-opacity, 0.5))',
        backdropFilter: 'blur(24px)',
      }}>
      {/* Emerald top accent */}
      <div style={{ height: '3px', background: 'var(--sp-accent, #059669)', flexShrink: 0 }} />

      {/* Hidden inputs */}
      {/* @ts-ignore - webkitdirectory is non-standard but widely supported */}
      <input ref={folderRef} type="file" {...{ webkitdirectory: '', directory: '' }} onChange={(e) => add(Array.from(e.target.files || []) as FileWithPath[])} className="hidden" />
      <input ref={fileRef} type="file" multiple onChange={(e) => add(Array.from(e.target.files || []) as FileWithPath[])} className="hidden" />

      {/* ── Header ── */}
      <div className="flex-shrink-0 flex items-center gap-3 px-4 py-3"
        style={{ background: 'rgba(16,185,129,0.06)', borderBottom: '1px solid rgba(16,185,129,0.12)' }}>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: 'rgba(16,185,129,0.22)', border: '1px solid rgba(16,185,129,0.35)' }}>
          <CloudUpload className="w-4 h-4 text-sp-success" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-sp-ink">Knowledge Upload</p>
          <p className="text-[10px] text-sp-success">Feed documents to Sapiens</p>
        </div>
        {files.length > 0 && (
          <span className="px-2 py-0.5 rounded-full text-[10px] tabular-nums"
            style={{ background: 'rgba(16,185,129,0.18)', border: '1px solid rgba(16,185,129,0.3)', color: 'var(--sp-success, #6ee7b7)' }}>
            {files.length}
          </span>
        )}
      </div>

      {/* ── Body ── */}
      <div className="flex-1 min-h-0 flex flex-col gap-3 p-3 overflow-y-auto">

        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); add(Array.from(e.dataTransfer.files) as FileWithPath[]); }}
          className="rounded-xl flex-shrink-0 overflow-hidden transition-all duration-200"
          style={{
            border: `2px dashed ${dragOver ? 'rgba(52,211,153,0.6)' : 'rgb(var(--sp-ink-rgb, 255 255 255) / 0.1)'}`,
            background: dragOver ? 'rgba(16,185,129,0.08)' : 'transparent',
          }}
        >
          {dragOver ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <Upload className="w-6 h-6 text-sp-success animate-bounce" />
              <p className="text-sm text-sp-success">Drop files here</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 divide-x" style={{ borderColor: 'rgb(var(--sp-ink-rgb, 255 255 255) / 0.06)' }}>
                {/* Add Files */}
                <button onClick={() => fileRef.current?.click()} disabled={disabled}
                  className="flex flex-col items-center gap-2 py-5 group transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-all group-hover:scale-110"
                    style={{ background: 'rgb(var(--sp-accent-rgb, 124 58 237) / 0.12)', border: '1px solid rgb(var(--sp-accent-rgb, 124 58 237) / 0.2)' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgb(var(--sp-accent-rgb, 124 58 237) / 0.25)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgb(var(--sp-accent-rgb, 124 58 237) / 0.4)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgb(var(--sp-accent-rgb, 124 58 237) / 0.12)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgb(var(--sp-accent-rgb, 124 58 237) / 0.2)'; }}>
                    <Files className="w-5 h-5 text-sp-accent" />
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-sp-muted group-hover:text-sp-ink transition-colors">Add Files</p>
                    <p className="text-[9px] text-sp-muted">Multi-select OK</p>
                  </div>
                </button>

                {/* Add Folder */}
                <button onClick={() => folderRef.current?.click()} disabled={disabled}
                  className="flex flex-col items-center gap-2 py-5 group transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-all group-hover:scale-110"
                    style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.2)' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(16,185,129,0.25)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(16,185,129,0.4)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(16,185,129,0.12)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(16,185,129,0.2)'; }}>
                    <FolderOpen className="w-5 h-5 text-sp-success" />
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-sp-muted group-hover:text-sp-ink transition-colors">Add Folder</p>
                    <p className="text-[9px] text-sp-muted">Entire directory</p>
                  </div>
                </button>
              </div>

              {/* Drag hint */}
              <div className="flex items-center justify-center gap-1.5 py-2"
                style={{ borderTop: '1px solid rgb(var(--sp-ink-rgb, 255 255 255) / 0.05)' }}>
                <Upload className="w-3 h-3 text-sp-muted" />
                <p className="text-[10px] text-sp-muted">or drag &amp; drop</p>
              </div>
            </>
          )}
        </div>

        {/* File list */}
        {files.length > 0 && (
          <div className="flex flex-col gap-2 min-h-0">
            <div className="flex items-center justify-between px-0.5">
              <div className="flex items-center gap-1.5">
                <FileText className="w-3 h-3 text-sp-muted" />
                <span className="text-[11px] text-sp-muted">
                  {folderLabel ? `📁 ${folderLabel}` : `${files.length} file${files.length !== 1 ? 's' : ''}`}
                </span>
                <span className="text-[10px] text-sp-muted font-mono">({formatFileSize(totalSize)})</span>
              </div>
              <button onClick={clear} disabled={disabled}
                className="text-[10px] text-sp-muted hover:text-sp-danger transition-colors disabled:opacity-40">
                Clear all
              </button>
            </div>

            <div className="space-y-1">
              {files.slice(0, PREVIEW).map((f, i) => (
                <div key={i} className="flex items-center gap-2 px-2.5 py-2 rounded-lg group transition-all"
                  style={{ background: 'rgb(var(--sp-ink-rgb, 255 255 255) / 0.03)', border: '1px solid rgb(var(--sp-ink-rgb, 255 255 255) / 0.06)' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgb(var(--sp-ink-rgb, 255 255 255) / 0.1)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgb(var(--sp-ink-rgb, 255 255 255) / 0.06)'; }}>
                  <ExtBadge name={getName(f)} />
                  <span className="flex-1 text-[11px] text-sp-muted truncate">{getName(f)}</span>
                  <span className="text-[10px] text-sp-muted font-mono flex-shrink-0">{formatFileSize(f.size)}</span>
                  <button onClick={() => setFiles((p) => p.filter((_, j) => j !== i))} disabled={disabled}
                    className="w-4 h-4 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-500/20 transition-all disabled:hidden">
                    <X className="w-2.5 h-2.5 text-sp-muted hover:text-sp-danger" />
                  </button>
                </div>
              ))}

              {files.length > PREVIEW && (
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <button className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] text-sp-muted hover:text-sp-muted transition-all"
                      style={{ border: '1px dashed rgb(var(--sp-ink-rgb, 255 255 255) / 0.08)' }}>
                      <Files className="w-3 h-3" />+{files.length - PREVIEW} more files
                    </button>
                  </DialogTrigger>
                  <DialogContent className="product-surface product-dialog max-w-lg border-sp-line bg-sp-panel text-sp-ink">
                    <DialogHeader>
                      <DialogTitle>All Files ({files.length})</DialogTitle>
                      {folderLabel && <DialogDescription>Folder: {folderLabel}</DialogDescription>}
                    </DialogHeader>
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-1.5 pr-3">
                        {files.map((f, i) => (
                          <div key={i} className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-muted/40 border border-border/50 hover:bg-muted transition-colors group">
                            <ExtBadge name={getName(f)} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm truncate">{getName(f)}</p>
                              {getDir(f) && <p className="text-[10px] text-muted-foreground truncate">{getDir(f)}</p>}
                              <p className="text-[10px] text-muted-foreground font-mono">{formatFileSize(f.size)}</p>
                            </div>
                            <Button variant="ghost" size="icon" className="w-7 h-7 opacity-0 group-hover:opacity-100" disabled={disabled}
                              onClick={() => { setFiles((p) => p.filter((_, j) => j !== i)); if (files.length === 1) setDialogOpen(false); }}>
                              <X className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        )}

        {files.length === 0 && (
          <p className="text-center text-[11px] text-sp-muted py-2">
            No files selected yet
          </p>
        )}
      </div>

      {/* ── Footer ── */}
      <div className="flex-shrink-0 px-3 pb-3 pt-2 space-y-2"
        style={{ background: 'var(--sp-recessed, rgba(0,0,0,0.25))', borderTop: '1px solid rgb(var(--sp-ink-rgb, 255 255 255) / 0.06)' }}>

        {uploading && <p role="status" className="text-xs text-sp-ink">Uploading and waiting for acceptance…</p>}

        {err && (
          <div role="alert" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sp-danger text-xs"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}>
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> We couldn’t confirm acceptance of all files. Some may have been accepted. We haven’t retried the upload.
          </div>
        )}

        {done ? (
          <div role="status" className="w-full rounded-xl p-3 flex items-center justify-center gap-2 text-sp-success text-xs"
            style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)' }}>
            <CheckCircle2 className="w-4 h-4" /> {acceptedCount} document{acceptedCount === 1 ? '' : 's'} accepted for processing. Processing completion is not confirmed.
          </div>
        ) : (
          <button onClick={upload} disabled={files.length === 0 || disabled || err}
            className="w-full h-10 rounded-xl flex items-center justify-center gap-2 text-sm text-sp-on-action transition-all duration-200 active:scale-[0.98] disabled:cursor-not-allowed"
            style={{
              background: files.length > 0 && !disabled ? 'var(--sp-action, #059669)' : 'rgb(var(--sp-ink-rgb, 255 255 255) / 0.04)',
              border: files.length > 0 && !disabled ? '1px solid rgba(16,185,129,0.4)' : '1px solid rgb(var(--sp-ink-rgb, 255 255 255) / 0.07)',
              boxShadow: files.length > 0 && !disabled ? '0 0 20px rgba(16,185,129,0.25)' : 'none',
              opacity: files.length === 0 || disabled ? 0.45 : 1,
            }}>
            <Upload className={`w-4 h-4 ${uploading ? 'animate-bounce' : ''}`} />
            {uploading ? 'Uploading…' : files.length > 0 ? `Upload ${files.length} file${files.length !== 1 ? 's' : ''}` : 'Select files to upload'}
          </button>
        )}
      </div>
    </div>
  );
}
