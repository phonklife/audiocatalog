import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { FolderUp, Music, X, CheckCircle, AlertCircle, Loader2, Upload } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface FileUploadItem {
  id: string;
  file: File;
  status: "pending" | "uploading" | "complete" | "error";
  progress: number;
  error?: string;
  title: string;
  artist: string;
}

interface BulkUploadDialogProps {
  onSuccess?: () => void;
}

export function BulkUploadDialog({ onSuccess }: BulkUploadDialogProps) {
  const [open, setOpen] = useState(false);
  const [files, setFiles] = useState<FileUploadItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const utils = trpc.useUtils();
  const uploadMutation = trpc.audio.upload.useMutation();

  const allowedTypes = ["audio/mpeg", "audio/wav", "audio/ogg", "audio/mp4", "audio/webm", "audio/x-m4a"];
  const maxFileSize = 50 * 1024 * 1024; // 50MB

  const extractMetadataFromFilename = (filename: string): { title: string; artist: string } => {
    // Remove extension
    const nameWithoutExt = filename.replace(/\.[^/.]+$/, "");
    
    // Try to extract artist - title format
    const dashMatch = nameWithoutExt.match(/^(.+?)\s*[-–—]\s*(.+)$/);
    if (dashMatch) {
      return { artist: dashMatch[1].trim(), title: dashMatch[2].trim() };
    }
    
    // Default: use filename as title, unknown artist
    return { title: nameWithoutExt.trim(), artist: "Unknown Artist" };
  };

  const processFiles = (fileList: FileList | File[]) => {
    const newFiles: FileUploadItem[] = [];
    const filesArray = Array.from(fileList);

    for (const file of filesArray) {
      // Validate file type
      if (!allowedTypes.includes(file.type)) {
        toast.error(`${file.name}: Invalid file type. Only audio files are allowed.`);
        continue;
      }

      // Validate file size
      if (file.size > maxFileSize) {
        toast.error(`${file.name}: File too large. Maximum size is 50MB.`);
        continue;
      }

      // Check for duplicates
      if (files.some(f => f.file.name === file.name && f.file.size === file.size)) {
        continue;
      }

      const metadata = extractMetadataFromFilename(file.name);
      newFiles.push({
        id: `${file.name}-${file.size}-${Date.now()}`,
        file,
        status: "pending",
        progress: 0,
        title: metadata.title,
        artist: metadata.artist,
      });
    }

    if (newFiles.length > 0) {
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const items = e.dataTransfer.items;
    const allFiles: File[] = [];

    // Process items to handle folders
    const processEntry = async (entry: FileSystemEntry): Promise<File[]> => {
      const files: File[] = [];
      
      if (entry.isFile) {
        const fileEntry = entry as FileSystemFileEntry;
        const file = await new Promise<File>((resolve) => {
          fileEntry.file(resolve);
        });
        if (allowedTypes.includes(file.type)) {
          files.push(file);
        }
      } else if (entry.isDirectory) {
        const dirEntry = entry as FileSystemDirectoryEntry;
        const reader = dirEntry.createReader();
        const entries = await new Promise<FileSystemEntry[]>((resolve) => {
          reader.readEntries(resolve);
        });
        for (const childEntry of entries) {
          const childFiles = await processEntry(childEntry);
          files.push(...childFiles);
        }
      }
      
      return files;
    };

    const processItems = async () => {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const entry = item.webkitGetAsEntry();
        if (entry) {
          const entryFiles = await processEntry(entry);
          allFiles.push(...entryFiles);
        }
      }
      
      if (allFiles.length > 0) {
        processFiles(allFiles);
      }
    };

    processItems();
  }, [files]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const updateFileMetadata = (id: string, field: "title" | "artist", value: string) => {
    setFiles(prev => prev.map(f => 
      f.id === id ? { ...f, [field]: value } : f
    ));
  };

  const uploadFile = async (fileItem: FileUploadItem): Promise<boolean> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        try {
          const arrayBuffer = event.target?.result as ArrayBuffer;
          const uint8Array = new Uint8Array(arrayBuffer);
          const base64 = btoa(
            uint8Array.reduce((data, byte) => data + String.fromCharCode(byte), "")
          );

          // Create audio element to get duration
          const audio = new Audio();
          audio.src = URL.createObjectURL(fileItem.file);
          
          await new Promise<void>((resolveAudio) => {
            audio.onloadedmetadata = () => {
              resolveAudio();
            };
            audio.onerror = () => {
              resolveAudio();
            };
          });

          const duration = Math.round(audio.duration) || 0;
          URL.revokeObjectURL(audio.src);

          await uploadMutation.mutateAsync({
            file: fileItem.file,
            title: fileItem.title,
            artist: fileItem.artist,
            album: "",
            genre: "",
            description: "",
          });

          setFiles(prev => prev.map(f => 
            f.id === fileItem.id ? { ...f, status: "complete", progress: 100 } : f
          ));
          resolve(true);
        } catch (error) {
          setFiles(prev => prev.map(f => 
            f.id === fileItem.id ? { 
              ...f, 
              status: "error", 
              error: error instanceof Error ? error.message : "Upload failed" 
            } : f
          ));
          resolve(false);
        }
      };

      reader.onerror = () => {
        setFiles(prev => prev.map(f => 
          f.id === fileItem.id ? { ...f, status: "error", error: "Failed to read file" } : f
        ));
        resolve(false);
      };

      reader.readAsArrayBuffer(fileItem.file);
    });
  };

  const startUpload = async () => {
    const pendingFiles = files.filter(f => f.status === "pending");
    if (pendingFiles.length === 0) {
      toast.error("No files to upload");
      return;
    }

    setIsUploading(true);
    abortControllerRef.current = new AbortController();

    let successCount = 0;
    let errorCount = 0;

    for (const fileItem of pendingFiles) {
      if (abortControllerRef.current?.signal.aborted) {
        break;
      }

      setFiles(prev => prev.map(f => 
        f.id === fileItem.id ? { ...f, status: "uploading", progress: 50 } : f
      ));

      const success = await uploadFile(fileItem);
      if (success) {
        successCount++;
      } else {
        errorCount++;
      }
    }

    setIsUploading(false);
    
    if (successCount > 0) {
      toast.success(`Successfully uploaded ${successCount} track${successCount > 1 ? "s" : ""}`);
      utils.audio.list.invalidate();
      onSuccess?.();
    }
    
    if (errorCount > 0) {
      toast.error(`Failed to upload ${errorCount} track${errorCount > 1 ? "s" : ""}`);
    }

    // Remove completed files after a delay
    setTimeout(() => {
      setFiles(prev => prev.filter(f => f.status !== "complete"));
    }, 2000);
  };

  const cancelUpload = () => {
    abortControllerRef.current?.abort();
    setIsUploading(false);
    setFiles(prev => prev.map(f => 
      f.status === "uploading" ? { ...f, status: "pending", progress: 0 } : f
    ));
  };

  const clearAll = () => {
    setFiles([]);
  };

  const pendingCount = files.filter(f => f.status === "pending").length;
  const completedCount = files.filter(f => f.status === "complete").length;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isUploading) {
        setOpen(isOpen);
        if (!isOpen) {
          setFiles([]);
        }
      }
    }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-accent/50 hover:bg-accent/10">
          <FolderUp className="w-4 h-4 mr-2" />
          Bulk Import
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderUp className="w-5 h-5" />
            Bulk Import Tracks
          </DialogTitle>
        </DialogHeader>

        {/* Drop Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`
            border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
            ${isDragOver 
              ? "border-accent bg-accent/10" 
              : "border-border/50 hover:border-accent/50 hover:bg-accent/5"
            }
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
          <Upload className={`w-12 h-12 mx-auto mb-4 ${isDragOver ? "text-accent" : "text-muted-foreground"}`} />
          <p className="text-lg font-medium mb-1">
            {isDragOver ? "Drop files here" : "Drag & drop audio files or folders"}
          </p>
          <p className="text-sm text-muted-foreground">
            or click to browse • MP3, WAV, OGG, M4A • Max 50MB each
          </p>
        </div>

        {/* File List */}
        {files.length > 0 && (
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">
                {files.length} file{files.length > 1 ? "s" : ""} selected
                {completedCount > 0 && ` • ${completedCount} uploaded`}
              </span>
              {!isUploading && (
                <Button variant="ghost" size="sm" onClick={clearAll}>
                  Clear All
                </Button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 max-h-64">
              {files.map((fileItem) => (
                <div
                  key={fileItem.id}
                  className={`
                    flex items-center gap-3 p-3 rounded-lg border
                    ${fileItem.status === "complete" ? "border-green-500/30 bg-green-500/5" : ""}
                    ${fileItem.status === "error" ? "border-red-500/30 bg-red-500/5" : ""}
                    ${fileItem.status === "pending" || fileItem.status === "uploading" ? "border-border/50 bg-card/50" : ""}
                  `}
                >
                  <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center flex-shrink-0">
                    {fileItem.status === "complete" ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : fileItem.status === "error" ? (
                      <AlertCircle className="w-5 h-5 text-red-500" />
                    ) : fileItem.status === "uploading" ? (
                      <Loader2 className="w-5 h-5 text-accent animate-spin" />
                    ) : (
                      <Music className="w-5 h-5 text-accent" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    {fileItem.status === "pending" ? (
                      <div className="space-y-1">
                        <input
                          type="text"
                          value={fileItem.title}
                          onChange={(e) => updateFileMetadata(fileItem.id, "title", e.target.value)}
                          className="w-full bg-transparent border-b border-border/50 focus:border-accent outline-none text-sm font-medium"
                          placeholder="Track title"
                        />
                        <input
                          type="text"
                          value={fileItem.artist}
                          onChange={(e) => updateFileMetadata(fileItem.id, "artist", e.target.value)}
                          className="w-full bg-transparent border-b border-border/50 focus:border-accent outline-none text-xs text-muted-foreground"
                          placeholder="Artist"
                        />
                      </div>
                    ) : (
                      <>
                        <p className="text-sm font-medium truncate">{fileItem.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{fileItem.artist}</p>
                      </>
                    )}
                    {fileItem.status === "uploading" && (
                      <Progress value={fileItem.progress} className="h-1 mt-2" />
                    )}
                    {fileItem.status === "error" && (
                      <p className="text-xs text-red-500 mt-1">{fileItem.error}</p>
                    )}
                  </div>

                  <div className="text-xs text-muted-foreground flex-shrink-0">
                    {(fileItem.file.size / (1024 * 1024)).toFixed(1)} MB
                  </div>

                  {fileItem.status === "pending" && !isUploading && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="flex-shrink-0"
                      onClick={() => removeFile(fileItem.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t border-border/20">
          {isUploading ? (
            <Button variant="destructive" onClick={cancelUpload}>
              Cancel Upload
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Close
              </Button>
              <Button 
                onClick={startUpload} 
                disabled={pendingCount === 0}
                className="bg-accent hover:bg-accent/90"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload {pendingCount > 0 ? `${pendingCount} Track${pendingCount > 1 ? "s" : ""}` : ""}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
