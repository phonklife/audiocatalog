import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ImagePlus, X, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface PlaylistCoverUploadProps {
  playlistId?: number;
  currentCoverUrl?: string | null;
  onCoverChange?: (coverUrl: string | null) => void;
  onImageSelect?: (imageData: string, mimeType: string) => void;
  size?: "sm" | "md" | "lg";
}

export function PlaylistCoverUpload({
  playlistId,
  currentCoverUrl,
  onCoverChange,
  onImageSelect,
  size = "md",
}: PlaylistCoverUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentCoverUrl || null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadCoverMutation = trpc.playlist.uploadCover.useMutation({
    onSuccess: (data) => {
      toast.success("Cover image uploaded!");
      setPreviewUrl(data.coverUrl);
      onCoverChange?.(data.coverUrl);
    },
    onError: (error) => {
      toast.error(`Failed to upload cover: ${error.message}`);
    },
    onSettled: () => {
      setIsUploading(false);
    },
  });

  const sizeClasses = {
    sm: "w-16 h-16",
    md: "w-24 h-24",
    lg: "w-32 h-32",
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Invalid image type. Please use JPEG, PNG, GIF, or WEBP.");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image too large. Maximum size is 5MB.");
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      setPreviewUrl(dataUrl);

      // Extract base64 data
      const base64Data = dataUrl.split(",")[1];

      if (playlistId) {
        // Upload immediately if we have a playlist ID
        setIsUploading(true);
        uploadCoverMutation.mutate({
          playlistId,
          imageData: base64Data,
          mimeType: file.type,
        });
      } else {
        // Just notify parent for new playlist creation
        onImageSelect?.(base64Data, file.type);
      }
    };
    reader.readAsDataURL(file);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveCover = () => {
    setPreviewUrl(null);
    onCoverChange?.(null);
    onImageSelect?.("", "");
  };

  return (
    <div className="relative group">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />

      <div
        className={`${sizeClasses[size]} rounded-lg overflow-hidden border-2 border-dashed border-border/50 hover:border-accent/50 transition-colors cursor-pointer bg-card/50`}
        onClick={() => fileInputRef.current?.click()}
      >
        {previewUrl ? (
          <div className="relative w-full h-full">
            <img
              src={previewUrl}
              alt="Playlist cover"
              className="w-full h-full object-cover"
            />
            {isUploading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-white" />
              </div>
            )}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <ImagePlus className="w-6 h-6 text-white" />
            </div>
          </div>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
            <ImagePlus className="w-6 h-6 mb-1" />
            <span className="text-xs">Add Cover</span>
          </div>
        )}
      </div>

      {previewUrl && !isUploading && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleRemoveCover();
          }}
          className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
