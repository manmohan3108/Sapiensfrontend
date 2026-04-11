import { useState, useRef } from 'react';
import { FolderOpen, File, X, Folder } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';
import { useSapiens } from '../../hooks/useSapiens';
import { formatFileSize } from '../../utils/formatters';

interface FileWithPath extends File {
  webkitRelativePath?: string;
}

export function FileUploadPanel() {
  const [selectedFiles, setSelectedFiles] = useState<FileWithPath[]>([]);
  const [folderName, setFolderName] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const { uploadFiles } = useSapiens();

  const handleFolderSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as FileWithPath[];
    
    if (files.length > 0) {
      // Extract folder name from the first file's path
      const firstPath = files[0].webkitRelativePath || '';
      const folder = firstPath.split('/')[0] || 'Selected Folder';
      setFolderName(folder);
      setSelectedFiles(files);
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    
    // Clear folder name if no files left
    if (selectedFiles.length === 1) {
      setFolderName('');
      if (folderInputRef.current) {
        folderInputRef.current.value = '';
      }
    }
  };

  const handleClearAll = () => {
    setSelectedFiles([]);
    setFolderName('');
    if (folderInputRef.current) {
      folderInputRef.current.value = '';
    }
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    try {
      setIsUploading(true);
      setUploadProgress(0);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      await uploadFiles(selectedFiles);

      clearInterval(progressInterval);
      setUploadProgress(100);

      // Clear files after successful upload
      setTimeout(() => {
        setSelectedFiles([]);
        setFolderName('');
        setUploadProgress(0);
        if (folderInputRef.current) {
          folderInputRef.current.value = '';
        }
      }, 1000);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
    }
  };

  // Group files by their directory
  const getFileTree = () => {
    const tree: { [key: string]: FileWithPath[] } = {};
    
    selectedFiles.forEach((file) => {
      const path = file.webkitRelativePath || file.name;
      const parts = path.split('/');
      
      if (parts.length > 1) {
        const dir = parts.slice(0, -1).join('/');
        if (!tree[dir]) {
          tree[dir] = [];
        }
        tree[dir].push(file);
      } else {
        if (!tree['root']) {
          tree['root'] = [];
        }
        tree['root'].push(file);
      }
    });
    
    return tree;
  };

  const fileTree = getFileTree();

  return (
    <Card className="h-full flex flex-col overflow-hidden">
      <CardHeader className="flex-shrink-0">
        <CardTitle>Folder Upload</CardTitle>
        <CardDescription>
          Upload a folder for Sapiens to learn from
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <div
          className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center mb-4 hover:border-slate-400 transition-colors cursor-pointer flex-shrink-0"
          onClick={() => folderInputRef.current?.click()}
        >
          <FolderOpen className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <p className="text-sm text-slate-600 mb-2">
            Click to select a folder
          </p>
          <p className="text-xs text-slate-500">
            All files within the folder will be uploaded
          </p>
          <input
            ref={folderInputRef}
            type="file"
            /* @ts-ignore - webkitdirectory is not in standard types */
            webkitdirectory=""
            directory=""
            onChange={handleFolderSelect}
            className="hidden"
          />
        </div>

        {selectedFiles.length > 0 && (
          <div className="flex-1 flex flex-col min-h-0 mb-4 overflow-hidden">
            <div className="flex items-center justify-between mb-3 flex-shrink-0">
              <h4 className="text-sm text-slate-700 flex items-center gap-2">
                <Folder className="w-4 h-4 text-slate-500" />
                {folderName} ({selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''})
              </h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                disabled={isUploading}
                className="text-xs"
              >
                Clear All
              </Button>
            </div>
            
            <div className="flex-1 overflow-y-auto overflow-x-hidden pr-2 space-y-3 min-h-0">
              {Object.entries(fileTree).map(([dir, files]) => (
                <div key={dir} className="space-y-1">
                  {dir !== 'root' && (
                    <div className="text-xs text-slate-500 font-medium px-2 py-1 bg-slate-50 rounded">
                      {dir}
                    </div>
                  )}
                  <div className="space-y-1">
                    {files.map((file, index) => {
                      const globalIndex = selectedFiles.indexOf(file);
                      const fileName = file.webkitRelativePath 
                        ? file.webkitRelativePath.split('/').pop() || file.name
                        : file.name;
                      
                      return (
                        <div
                          key={globalIndex}
                          className="flex items-center justify-between p-2 bg-slate-50 rounded border border-slate-200 hover:bg-slate-100 transition-colors"
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <File className="w-4 h-4 text-slate-500 flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm text-slate-900 truncate">
                                {fileName}
                              </p>
                              <p className="text-xs text-slate-500">
                                {formatFileSize(file.size)}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveFile(globalIndex)}
                            disabled={isUploading}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {isUploading && (
          <div className="mb-4 flex-shrink-0">
            <div className="flex justify-between text-sm text-slate-600 mb-2">
              <span>Uploading folder...</span>
              <span>{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} />
          </div>
        )}

        <Button
          onClick={handleUpload}
          disabled={selectedFiles.length === 0 || isUploading}
          className="w-full flex-shrink-0"
        >
          <FolderOpen className="w-4 h-4 mr-2" />
          {isUploading ? 'Uploading...' : `Upload Folder (${selectedFiles.length} file${selectedFiles.length !== 1 ? 's' : ''})`}
        </Button>
      </CardContent>
    </Card>
  );
}