import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Music, ListMusic, ArrowLeft, Trash2, MoreVertical } from "lucide-react";
import { useLocation } from "wouter";
import { CreatePlaylistDialog } from "@/components/CreatePlaylistDialog";
import { ThemeToggle } from "@/components/ThemeToggle";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

export default function Playlists() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  const { data: playlists, isLoading, refetch } = trpc.playlist.list.useQuery(
    { limit: 50, offset: 0 },
    { enabled: isAuthenticated }
  );

  const deletePlaylistMutation = trpc.playlist.delete.useMutation({
    onSuccess: () => {
      toast.success("Playlist deleted");
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to delete playlist: ${error.message}`);
    },
  });

  const handleDeletePlaylist = (playlistId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this playlist?")) {
      deletePlaylistMutation.mutate({ playlistId });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Music className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-2">Sign in to view playlists</h2>
          <p className="text-muted-foreground">Create and manage your custom playlists</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/20 backdrop-blur-md bg-background/10">
        <div className="container py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => setLocation("/")}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <ListMusic className="w-8 h-8 text-accent" />
              <h1 className="text-2xl font-bold text-foreground">My Playlists</h1>
            </div>
            <div className="flex items-center gap-3">
              <CreatePlaylistDialog onSuccess={() => refetch()} />
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
          </div>
        ) : playlists && playlists.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {playlists.map((playlist) => (
              <div
                key={playlist.id}
                onClick={() => setLocation(`/playlist/${playlist.id}`)}
                className="group relative p-6 rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-all cursor-pointer"
              >
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-lg bg-accent/20 flex items-center justify-center flex-shrink-0">
                    <ListMusic className="w-8 h-8 text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg truncate">{playlist.name}</h3>
                    {playlist.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {playlist.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <span>{playlist.isPublic ? "Public" : "Private"}</span>
                      <span>•</span>
                      <span>{new Date(playlist.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={(e) => handleDeletePlaylist(playlist.id, e)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Playlist
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <ListMusic className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-2">No playlists yet</h2>
            <p className="text-muted-foreground mb-6">Create your first playlist to organize your favorite tracks</p>
            <CreatePlaylistDialog onSuccess={() => refetch()} />
          </div>
        )}
      </div>
    </div>
  );
}
