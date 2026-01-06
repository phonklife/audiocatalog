import { useState } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';

interface AudioUploadFormProps {
  onSuccess?: () => void;
  onClose?: () => void;
}

const SUPPORTED_FORMATS = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/webm'];
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export function AudioUploadForm({ onSuccess, onClose }: AudioUploadFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [album, setAlbum] = useState('');
  const [genre, setGenre] = useState('');
  const [description, setDescription] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const uploadMutation = trpc.audio.upload.useMutation({
    onSuccess: () => {
      toast.success('Audio track uploaded successfully!');
      resetForm();
      onSuccess?.();
    },
    onError: (error) => {
      toast.error((error as any)?.message || "Failed to upload audio track");
    },
  });

  const resetForm = () => {
    setFile(null);
    setTitle('');
    setArtist('');
    setAlbum('');
    setGenre('');
    setDescription('');
    setUploadProgress(0);
  };

  const handleFileSelect = (selectedFile: File) => {
    if (!SUPPORTED_FORMATS.includes(selectedFile.type)) {
      toast.error('Unsupported audio format. Please use MP3, WAV, OGG, MP4, or WebM.');
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      toast.error('File size exceeds 50MB limit.');
      return;
    }

    setFile(selectedFile);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      toast.error('Please select an audio file');
      return;
    }

    if (!title || !artist) {
      toast.error('Please fill in title and artist');
      return;
    }

    uploadMutation.mutate({
      file,
      title,
      artist,
      album: album || undefined,
      genre: genre || undefined,
      description: description || undefined,
    });
  };

  return (
    <div className="glass-card p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-foreground">Upload Audio Track</h2>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 hover:bg-border/30 rounded transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* File Upload Area */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragging
              ? 'border-accent bg-accent/10'
              : 'border-border/50 hover:border-border'
          }`}
        >
          {file ? (
            <div className="space-y-2">
              <Upload className="w-8 h-8 mx-auto text-accent" />
              <p className="font-medium text-foreground">{file.name}</p>
              <p className="text-sm text-muted-foreground">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
              <button
                type="button"
                onClick={() => setFile(null)}
                className="text-sm text-accent hover:underline"
              >
                Change file
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
              <p className="text-foreground">
                Drag and drop your audio file here
              </p>
              <p className="text-sm text-muted-foreground">
                or click to browse (MP3, WAV, OGG, MP4, WebM - Max 50MB)
              </p>
              <input
                type="file"
                accept={SUPPORTED_FORMATS.join(',')}
                onChange={(e) => {
                  const selectedFile = e.target.files?.[0];
                  if (selectedFile) handleFileSelect(selectedFile);
                }}
                className="hidden"
                id="file-input"
              />
              <label
                htmlFor="file-input"
                className="inline-block mt-4 px-4 py-2 bg-accent/20 hover:bg-accent/30 text-accent rounded-lg cursor-pointer transition-colors"
              >
                Browse Files
              </label>
            </div>
          )}
        </div>

        {/* Metadata Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Track title"
              className="w-full px-3 py-2 bg-background/50 border border-border/30 rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:border-accent/50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Artist *
            </label>
            <input
              type="text"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              placeholder="Artist name"
              className="w-full px-3 py-2 bg-background/50 border border-border/30 rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:border-accent/50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Album
            </label>
            <input
              type="text"
              value={album}
              onChange={(e) => setAlbum(e.target.value)}
              placeholder="Album name"
              className="w-full px-3 py-2 bg-background/50 border border-border/30 rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:border-accent/50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Genre
            </label>
            <input
              type="text"
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              placeholder="Genre"
              className="w-full px-3 py-2 bg-background/50 border border-border/30 rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:border-accent/50"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add a description for this track"
            rows={3}
            className="w-full px-3 py-2 bg-background/50 border border-border/30 rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:border-accent/50 resize-none"
          />
        </div>

        {/* Upload Progress */}
        {uploadProgress > 0 && uploadProgress < 100 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Uploading...</span>
              <span className="text-accent font-medium">{uploadProgress}%</span>
            </div>
            <div className="h-2 bg-border/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-accent to-primary transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end">
          {onClose && (
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={uploadMutation.isPending}
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            disabled={!file || uploadMutation.isPending}
            className="bg-accent hover:bg-accent/90 text-accent-foreground"
          >
            {uploadMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload Track
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
