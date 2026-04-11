import { useState, useRef } from 'react';
import { Send, X, File, Files, FolderOpen } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Textarea } from '../ui/textarea';
import { Progress } from '../ui/progress';
import { useSapiens } from '../../hooks/useSapiens';
import { useSapiensStore } from '../../core/state/sapiensStore';
import { formatFileSize } from '../../utils/formatters';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';

export function CombinedInputPanel() {
  const [textInput, setTextInput] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadFiles, sendTextInput } = useSapiens();
  const status = useSapiensStore((state) => state.status);

  const handleFolderSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles((prev) => [...prev, ...files]);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles((prev) => [...prev, ...files]);
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleClearAllFiles = () => {
    setSelectedFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (folderInputRef.current) {
      folderInputRef.current.value = '';
    }
  };

  const handleUploadFolder = async () => {
    if (selectedFiles.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);

    try {
      await uploadFiles(selectedFiles);
      setUploadProgress(100);
      
      // Clear files only after successful upload
      setTimeout(() => {
        handleClearAllFiles();
        setUploadProgress(0);
      }, 500);
    } catch (error) {
      console.error('Upload failed:', error);
      // Don't clear files on failure - user can retry
      setUploadProgress(0);
    } finally {
      clearInterval(progressInterval);
      setIsUploading(false);
    }
  };

  const handleSendText = async () => {
    if (!textInput.trim()) return;

    try {
      await sendTextInput(textInput);
      setTextInput('');
    } catch (error) {
      console.error('Failed to send text:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSendText();
    }
  };

  const getFolderName = () => {
    if (selectedFiles.length === 0) return '';
    const firstFilePath = (selectedFiles[0] as any).webkitRelativePath || selectedFiles[0].name;
    const parts = firstFilePath.split('/');
    return parts.length > 1 ? parts[0] : 'Files';
  };

  const folderName = getFolderName();
  const isProcessing = status === 'processing';

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex-shrink-0">
        <CardTitle>Input</CardTitle>
        <CardDescription>
          Send text or upload files and folders to Sapiens
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4 min-h-0">
        {/* Text Input Section */}
        <div className="flex flex-col gap-2">
          <Textarea
            placeholder="Type your message here... (Cmd/Ctrl+Enter to send)"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isProcessing}
            className="min-h-[120px] resize-none"
          />
          <Button
            onClick={handleSendText}
            disabled={!textInput.trim() || isProcessing}
            className="w-full"
          >
            <Send className="w-4 h-4 mr-2" />
            Send Text
          </Button>
        </div>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">Or</span>
          </div>
        </div>

        {/* Folder Upload Section */}
        <div className="flex flex-col gap-3">
          <input
            ref={folderInputRef}
            type="file"
            /* @ts-ignore - webkitdirectory is not in standard types */
            webkitdirectory=""
            directory=""
            onChange={handleFolderSelect}
            className="hidden"
          />
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading || isProcessing}
              className="w-full"
            >
              <Files className="w-4 h-4 mr-2" />
              Add Files
            </Button>
            <Button
              variant="outline"
              onClick={() => folderInputRef.current?.click()}
              disabled={isUploading || isProcessing}
              className="w-full"
            >
              <FolderOpen className="w-4 h-4 mr-2" />
              Add Folder
            </Button>
          </div>

          {/* Selected Files Chips */}
          {selectedFiles.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {folderName} ({selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''})
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearAllFiles}
                  disabled={isUploading}
                  className="h-6 text-xs"
                >
                  Clear All
                </Button>
              </div>

              {/* File Chips - Show first 3 + View All button */}
              <div className="flex flex-wrap gap-2">
                {selectedFiles.slice(0, 3).map((file, index) => {
                  const fileName = (file as any).webkitRelativePath
                    ? (file as any).webkitRelativePath.split('/').pop() || file.name
                    : file.name;
                  
                  return (
                    <Badge key={index} variant="secondary" className="gap-1 pr-1 max-w-[200px]">
                      <File className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate text-xs">{fileName}</span>
                      <button
                        onClick={() => handleRemoveFile(index)}
                        disabled={isUploading}
                        className="ml-1 hover:bg-muted rounded-sm p-0.5 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  );
                })}
                
                {selectedFiles.length > 3 && (
                  <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                      <Badge 
                        variant="outline" 
                        className="gap-1 cursor-pointer hover:bg-accent"
                      >
                        <Files className="w-3 h-3" />
                        <span className="text-xs">+{selectedFiles.length - 3} more</span>
                      </Badge>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[80vh]">
                      <DialogHeader>
                        <DialogTitle>All Files ({selectedFiles.length})</DialogTitle>
                        <DialogDescription>
                          Files from {folderName}
                        </DialogDescription>
                      </DialogHeader>
                      <ScrollArea className="h-[500px] pr-4">
                        <div className="space-y-2">
                          {selectedFiles.map((file, index) => {
                            const filePath = (file as any).webkitRelativePath || file.name;
                            const fileName = filePath.split('/').pop() || file.name;
                            const fileDir = filePath.includes('/') 
                              ? filePath.substring(0, filePath.lastIndexOf('/'))
                              : '';
                            
                            return (
                              <div
                                key={index}
                                className="flex items-center justify-between p-3 bg-accent/50 rounded-lg border border-border hover:bg-accent transition-colors"
                              >
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                  <File className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                  <div className="min-w-0 flex-1">
                                    <p className="text-sm truncate">
                                      {fileName}
                                    </p>
                                    {fileDir && (
                                      <p className="text-xs text-muted-foreground truncate">
                                        {fileDir}
                                      </p>
                                    )}
                                    <p className="text-xs text-muted-foreground">
                                      {formatFileSize(file.size)}
                                    </p>
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    handleRemoveFile(index);
                                    if (selectedFiles.length === 1) {
                                      setDialogOpen(false);
                                    }
                                  }}
                                  disabled={isUploading}
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      </ScrollArea>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </div>
          )}

          {/* Upload Progress */}
          {isUploading && (
            <div>
              <div className="flex justify-between text-sm text-muted-foreground mb-2">
                <span>Uploading files...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} />
            </div>
          )}

          {/* Upload Button */}
          {selectedFiles.length > 0 && (
            <Button
              onClick={handleUploadFolder}
              disabled={isUploading || isProcessing}
              className="w-full"
            >
              <Files className="w-4 h-4 mr-2" />
              {isUploading 
                ? 'Uploading...' 
                : `Upload Files (${selectedFiles.length} file${selectedFiles.length !== 1 ? 's' : ''})`
              }
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}