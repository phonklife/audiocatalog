import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Pencil, Loader2, Trash2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface TrackData {
  id: number;
  title: string;
  artist: string;
  album?: string | null;
  genre?: string | null;
  description?: string | null;
}

interface EditTrackDialogProps {
  track: TrackData;
  onSuccess?: () => void;
}

export function EditTrackDialog({ track, onSuccess }: EditTrackDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(track.title);
  const [artist, setArtist] = useState(track.artist);
  const [album, setAlbum] = useState(track.album || "");
  const [genre, setGenre] = useState(track.genre || "");
  const [description, setDescription] = useState(track.description || "");

  const utils = trpc.useUtils();

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setTitle(track.title);
      setArtist(track.artist);
      setAlbum(track.album || "");
      setGenre(track.genre || "");
      setDescription(track.description || "");
    }
  }, [open, track]);

  const updateMutation = trpc.audio.update.useMutation({
    onSuccess: () => {
      toast.success("Track updated successfully!");
      utils.audio.list.invalidate();
      utils.audio.search.invalidate();
      utils.favorites.list.invalidate();
      utils.history.recentlyPlayed.invalidate();
      utils.history.topTracks.invalidate();
      setOpen(false);
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update track");
    },
  });

  const deleteMutation = trpc.audio.delete.useMutation({
    onSuccess: () => {
      toast.success("Track deleted successfully!");
      utils.audio.list.invalidate();
      utils.audio.search.invalidate();
      utils.favorites.list.invalidate();
      utils.history.recentlyPlayed.invalidate();
      utils.history.topTracks.invalidate();
      utils.history.statistics.invalidate();
      setOpen(false);
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete track");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !artist.trim()) {
      toast.error("Title and artist are required");
      return;
    }

    updateMutation.mutate({
      trackId: track.id,
      title: title.trim(),
      artist: artist.trim(),
      album: album.trim() || null,
      genre: genre.trim() || null,
      description: description.trim() || null,
    });
  };

  const handleDelete = () => {
    deleteMutation.mutate({ trackId: track.id });
  };

  const isLoading = updateMutation.isPending || deleteMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          className="p-2 rounded-lg hover:bg-accent/20 transition-colors text-muted-foreground hover:text-foreground"
          title="Edit track"
        >
          <Pencil className="w-4 h-4" />
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="w-5 h-5" />
            Edit Track
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Track title"
              className="w-full px-3 py-2 bg-background/50 border border-border/30 rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/30"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Artist <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              placeholder="Artist name"
              className="w-full px-3 py-2 bg-background/50 border border-border/30 rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/30"
              disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Album
              </label>
              <input
                type="text"
                value={album}
                onChange={(e) => setAlbum(e.target.value)}
                placeholder="Album name"
                className="w-full px-3 py-2 bg-background/50 border border-border/30 rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/30"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Genre
              </label>
              <input
                type="text"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                placeholder="Genre"
                className="w-full px-3 py-2 bg-background/50 border border-border/30 rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/30"
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description for this track"
              rows={3}
              className="w-full px-3 py-2 bg-background/50 border border-border/30 rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/30 resize-none"
              disabled={isLoading}
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  disabled={isLoading}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Track
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Track</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete "{track.title}"? This will also
                    remove it from all playlists, favorites, and playback history.
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-accent hover:bg-accent/90 text-accent-foreground"
              >
                {updateMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
