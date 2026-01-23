import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ListMusic, Plus, Check } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface AddToPlaylistDialogProps {
  trackId: number;
  trackTitle: string;
}

export function AddToPlaylistDialog({ trackId, trackTitle }: AddToPlaylistDialogProps) {
  const [open, setOpen] = useState(false);

  const { data: playlists, isLoading } = trpc.playlist.list.useQuery(
    { limit: 50, offset: 0 },
    { enabled: open }
  );

  const utils = trpc.useUtils();

  const addTrackMutation = trpc.playlist.addTrack.useMutation({
    onSuccess: (_, variables) => {
      toast.success("Track added to playlist!");
      utils.playlist.getTracks.invalidate({ playlistId: variables.playlistId });
      setOpen(false);
    },
    onError: (error) => {
      toast.error(`Failed to add track: ${error.message}`);
    },
  });

  const handleAddToPlaylist = (playlistId: number) => {
    addTrackMutation.mutate({ playlistId, trackId });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
          <Plus className="w-4 h-4 mr-1" />
          Add to Playlist
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ListMusic className="w-5 h-5" />
            Add to Playlist
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground mb-4">
          Adding: <span className="font-medium text-foreground">{trackTitle}</span>
        </p>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
          </div>
        ) : playlists && playlists.length > 0 ? (
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-2">
              {playlists.map((playlist) => (
                <button
                  key={playlist.id}
                  onClick={() => handleAddToPlaylist(playlist.id)}
                  disabled={addTrackMutation.isPending}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-accent/10 transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded bg-accent/20 flex items-center justify-center">
                    <ListMusic className="w-5 h-5 text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{playlist.name}</p>
                    {playlist.description && (
                      <p className="text-sm text-muted-foreground truncate">{playlist.description}</p>
                    )}
                  </div>
                  {addTrackMutation.isPending && addTrackMutation.variables?.playlistId === playlist.id ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-accent"></div>
                  ) : (
                    <Plus className="w-5 h-5 text-muted-foreground" />
                  )}
                </button>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="text-center py-8">
            <ListMusic className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No playlists yet</p>
            <p className="text-sm text-muted-foreground">Create a playlist first to add tracks</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
