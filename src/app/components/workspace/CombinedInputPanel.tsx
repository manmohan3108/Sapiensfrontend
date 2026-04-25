import { useState, useRef } from 'react';
import { X, File, Files, FolderOpen, Upload, CheckCircle, CloudUpload } from 'lucide-react';
import { Button } from '../ui/button';
import { useSapiens } from '../../hooks/useSapiens';
import { useSapiensStore } from '../../core/state/sapiensStore';
import { formatFileSize } from '../../utils/formatters';
import {
  Dialog, DialogContent, DialogDescription,
  DialogHeader, DialogTitle, DialogTrigger,
} from '../ui/dialog';
import { ScrollArea } from '../ui/scroll-area';

type FileWithPath = File & { webkitRelativePath?: string };

const getFileName = (f: FileWithPath) =>
  f.webkitRelativePath ? (f.webkitRelativePath.split('/').pop() || f.name) : f.name;

const getFileDir = (f: FileWithPath) =>
  f.webkitRelativePath?.includes('/')
    ? f.webkitRelativePath.substring(0, f.webkitRelativePath.lastIndexOf('/'))
    : '';

// File type → color dot
const extColor: Record<string, string> = {
  pdf: 'bg-red-400', py: 'bg-yellow-400', ts: 'bg-blue-400', tsx: 'bg-cyan-400',
  js: 'bg-amber-400', json: 'bg-green-400', md: 'bg-purple-400', txt: 'bg-slate-400',
  csv: 'bg-emerald-400', docx: 'bg-blue-500', doc: 'bg-blue-500',
};
function fileColor(name: string) {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  return extColor[ext] ?? 'bg-slate-500';
}

export function CombinedInputPanel() {
  const [selectedFiles, setSelectedFiles] = useState<FileWithPath[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const folderRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { uploadFiles } = useSapiens();
  const status = useSapiensStore((s) => s.status);

  const addFiles = (files: FileWithPath[]) => {
    setSelectedFiles((p) => [...p, ...files]);
    setDone(false);
  };

  const handleFolderSelect = (e: React.ChangeEvent<HTMLInputElement>) =>
    addFiles(Array.from(e.target.files || []) as FileWithPath[]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) =>
    addFiles(Array.from(e.target.files || []) as FileWithPath[]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files) as FileWithPath[];
    if (files.length) addFiles(files);
  };

  const handleRemove = (i: number) =>
    setSelectedFiles((p) => p.filter((_, idx) => idx !== i));

  const handleClearAll = () => {
    setSelectedFiles([]);
    setProgress(0);
    setDone(false);
    if (fileRef.current) fileRef.current.value = '';
    if (folderRef.current) folderRef.current.value = '';
  };

  const handleUpload = async () => {
    if (!selectedFiles.length) return;
    setIsUploading(true);
    setDone(false);
    setProgress(0);
    const iv = setInterval(() => setProgress((p) => p >= 85 ? 85 : p + 15), 200);
    try {
      await uploadFiles(selectedFiles);
      clearInterval(iv);
      setProgress(100);
      setDone(true);
      setTimeout(handleClearAll, 1400);
    } catch {
      clearInterval(iv);
      setProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  const folderLabel = (() => {
    if (!selectedFiles.length) return '';
    const first = selectedFiles[0].webkitRelativePath || selectedFiles[0].name;
    const parts = first.split('/');
    return parts.length > 1 ? parts[0] : '';
  })();

  const disabled = isUploading || status === 'processing';
  const PREVIEW = 5;

  return (
    <div
      className="h-full flex flex-col rounded-2xl overflow-hidden border border-white/[0.08] shadow-2xl shadow-black/40"
      style={{ background: 'rgba(10,14,28,0.75)', backdropFilter: 'blur(20px)' }}
    >
      {/* Hidden inputs */}
      <input ref={folderRef} type="file" /* @ts-ignore */ webkitdirectory="" directory="" onChange={handleFolderSelect} className="hidden" />
      <input ref={fileRef} type="file" multiple onChange={handleFileSelect} className="hidden" />

      {/* ── Header ── */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-white/[0.07]" style={{ background: 'rgba(255,255,255,0.02)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500/30 to-teal-500/20 border border-emerald-500/25 flex items-center justify-center">
            <CloudUpload className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <p className="text-sm text-white/80 leading-none">Knowledge Upload</p>
            <p className="text-[10px] text-white/25 mt-0.5">Feed documents for Sapiens to learn</p>
          </div>
          {selectedFiles.length > 0 && (
            <span className="ml-auto px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 tabular-nums">
              {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex-1 min-h-0 flex flex-col gap-3 p-3 overflow-y-auto">

        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          className={`relative rounded-xl border-2 border-dashed transition-all duration-200 overflow-hidden
            ${isDragOver
              ? 'border-emerald-400/60 bg-emerald-500/10'
              : 'border-white/10 hover:border-white/20 hover:bg-white/[0.02]'}
          `}
        >
          {/* Glow behind when drag */}
          {isDragOver && (
            <div className="absolute inset-0 bg-emerald-500/5 pointer-events-none" />
          )}
          <div className="grid grid-cols-2 gap-0 divide-x divide-white/[0.07]">
            <button
              onClick={() => fileRef.current?.click()}
              disabled={disabled}
              className="flex flex-col items-center gap-1.5 py-5 group disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center group-hover:border-violet-500/30 group-hover:bg-violet-500/10 transition-all">
                <Files className="w-4 h-4 text-white/30 group-hover:text-violet-400 transition-colors" />
              </div>
              <span className="text-xs text-white/30 group-hover:text-white/60 transition-colors">Add Files</span>
              <span className="text-[10px] text-white/15">Ctrl/Shift to multi-select</span>
            </button>
            <button
              onClick={() => folderRef.current?.click()}
              disabled={disabled}
              className="flex flex-col items-center gap-1.5 py-5 group disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center group-hover:border-emerald-500/30 group-hover:bg-emerald-500/10 transition-all">
                <FolderOpen className="w-4 h-4 text-white/30 group-hover:text-emerald-400 transition-colors" />
              </div>
              <span className="text-xs text-white/30 group-hover:text-white/60 transition-colors">Add Folder</span>
              <span className="text-[10px] text-white/15">Entire directory</span>
            </button>
          </div>
          {isDragOver && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <p className="text-sm text-emerald-400">Drop files here</p>
            </div>
          )}
        </div>

        {/* File list */}
        {selectedFiles.length > 0 && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between px-0.5">
              <div className="flex items-center gap-1.5">
                {folderLabel && (
                  <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-white/5 border border-white/10 text-white/40 font-mono truncate max-w-[90px]">
                    📁 {folderLabel}
                  </span>
                )}
              </div>
              <button
                onClick={handleClearAll}
                disabled={disabled}
                className="text-[10px] text-white/25 hover:text-red-400 transition-colors disabled:opacity-40"
              >
                Clear all
              </button>
            </div>

            <div className="space-y-1">
              {selectedFiles.slice(0, PREVIEW).map((file, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-white/[0.07] hover:border-white/[0.12] group transition-all"
                  style={{ background: 'rgba(255,255,255,0.03)' }}
                >
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${fileColor(getFileName(file))}`} />
                  <span className="flex-1 text-xs text-white/60 truncate min-w-0">{getFileName(file)}</span>
                  <span className="text-[10px] text-white/20 flex-shrink-0 font-mono">{formatFileSize(file.size)}</span>
                  <button
                    onClick={() => handleRemove(i)}
                    disabled={disabled}
                    className="flex-shrink-0 w-4 h-4 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-500/20 transition-all disabled:hidden"
                  >
                    <X className="w-2.5 h-2.5 text-white/40 hover:text-red-400" />
                  </button>
                </div>
              ))}

              {selectedFiles.length > PREVIEW && (
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <button
                      className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-dashed border-white/[0.08] hover:border-white/[0.15] text-[11px] text-white/30 hover:text-white/60 transition-all"
                      style={{ background: 'rgba(255,255,255,0.02)' }}
                    >
                      <Files className="w-3 h-3" />
                      +{selectedFiles.length - PREVIEW} more files
                    </button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle>All Files ({selectedFiles.length})</DialogTitle>
                      {folderLabel && <DialogDescription>Folder: {folderLabel}</DialogDescription>}
                    </DialogHeader>
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-1.5 pr-3">
                        {selectedFiles.map((file, i) => (
                          <div key={i} className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-muted/40 border border-border/50 hover:bg-muted transition-colors group">
                            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${fileColor(getFileName(file))}`} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm truncate">{getFileName(file)}</p>
                              {getFileDir(file) && <p className="text-[10px] text-muted-foreground truncate">{getFileDir(file)}</p>}
                              <p className="text-[10px] text-muted-foreground font-mono">{formatFileSize(file.size)}</p>
                            </div>
                            <Button variant="ghost" size="icon" className="w-7 h-7 opacity-0 group-hover:opacity-100" disabled={disabled}
                              onClick={() => { handleRemove(i); if (selectedFiles.length === 1) setDialogOpen(false); }}>
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
      </div>

      {/* ── Footer ── */}
      <div
        className="flex-shrink-0 px-3 pb-3 pt-2 border-t border-white/[0.07] space-y-2"
        style={{ background: 'rgba(0,0,0,0.2)' }}
      >
        {/* Progress bar */}
        {isUploading && (
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-white/30">
              <span>{done ? '✓ Done' : 'Uploading…'}</span>
              <span>{progress}%</span>
            </div>
            <div className="h-1 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Upload button */}
        {done ? (
          <div className="w-full h-9 rounded-xl flex items-center justify-center gap-2 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-sm">
            <CheckCircle className="w-4 h-4" />
            Uploaded successfully!
          </div>
        ) : (
          <button
            onClick={handleUpload}
            disabled={selectedFiles.length === 0 || disabled}
            className={`w-full h-9 rounded-xl flex items-center justify-center gap-2 text-sm font-medium
              transition-all duration-200 active:scale-[0.98]
              ${selectedFiles.length > 0 && !disabled
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 border border-emerald-500/30'
                : 'bg-white/[0.04] border border-white/10 text-white/20 cursor-not-allowed'
              }
            `}
          >
            <Upload className={`w-4 h-4 ${isUploading ? 'animate-bounce' : ''}`} />
            {isUploading
              ? 'Uploading…'
              : selectedFiles.length > 0
              ? `Upload ${selectedFiles.length} file${selectedFiles.length !== 1 ? 's' : ''}`
              : 'Select files to upload'
            }
          </button>
        )}
      </div>
    </div>
  );
}
