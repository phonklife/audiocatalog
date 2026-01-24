import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plus, ListMusic } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { PlaylistCoverUpload } from "./PlaylistCoverUpload";

interface CreatePlaylistDialogProps {
  onSuccess?: () => void;
}

export function CreatePlaylistDialog({ onSuccess }: CreatePlaylistDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [coverImageData, setCoverImageData] = useState<string>("");
  const [coverMimeType, setCoverMimeType] = useState<string>("");

  const utils = trpc.useUtils();

  const uploadCoverMutation = trpc.playlist.uploadCover.useMutation();

  const createPlaylistMutation = trpc.playlist.create.useMutation({
    onSuccess: async (data) => {
      // If we have a cover image, upload it
      if (coverImageData && coverMimeType && data.playlistId) {
        try {
          await uploadCoverMutation.mutateAsync({
            playlistId: data.playlistId,
            imageData: coverImageData,
            mimeType: coverMimeType,
          });
        } catch (error) {
          console.error("Failed to upload cover image:", error);
          // Continue anyway, playlist was created
        }
      }
      
      toast.success("Playlist created successfully!");
      setOpen(false);
      resetForm();
      utils.playlist.list.invalidate();
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(`Failed to create playlist: ${error.message}`);
    },
  });

  const resetForm = () => {
    setName("");
    setDescription("");
    setIsPublic(false);
    setCoverImageData("");
    setCoverMimeType("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please enter a playlist name");
      return;
    }
    createPlaylistMutation.mutate({ name, description, isPublic });
  };

  const handleImageSelect = (imageData: string, mimeType: string) => {
    setCoverImageData(imageData);
    setCoverMimeType(mimeType);
  };

  const isLoading = createPlaylistMutation.isPending || uploadCoverMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) resetForm();
    }}>
      <DialogTrigger asChild>
        <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
          <Plus className="w-4 h-4 mr-2" />
          New Playlist
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ListMusic className="w-5 h-5" />
            Create New Playlist
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-4">
            <PlaylistCoverUpload
              onImageSelect={handleImageSelect}
              size="lg"
            />
            <div className="flex-1 space-y-3">
              <div className="space-y-2">
                <Label htmlFor="name">Playlist Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="My Awesome Playlist"
                  required
                />
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A collection of my favorite tracks..."
              rows={3}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="isPublic">Make playlist public</Label>
            <Switch
              id="isPublic"
              checked={isPublic}
              onCheckedChange={setIsPublic}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Playlist"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
