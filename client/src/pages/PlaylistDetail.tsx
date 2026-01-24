import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Music, ListMusic, ArrowLeft, Play, Pause, GripVertical, Trash2, MoreVertical } from "lucide-react";
import { useLocation, useParams } from "wouter";
import { ThemeToggle } from "@/components/ThemeToggle";
import { PlaylistCoverUpload } from "@/components/PlaylistCoverUpload";
import { usePlayback } from "@/contexts/PlaybackContext";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface Track {
  id: number;
  title: string;
  artist: string;
  album: string | null;
  duration: number;
  fileUrl: string;
  position: number;
}

export default function PlaylistDetail() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const params = useParams();
  const playlistId = parseInt(params.id || "0");

  const { currentTrackId, isPlaying, playTrack, pauseTrack, setPlaylist } = usePlayback();

  const { data: playlist, isLoading: playlistLoading } = trpc.playlist.get.useQuery(
    { playlistId },
    { enabled: isAuthenticated && playlistId > 0 }
  );

  const { data: tracks, isLoading: tracksLoading, refetch } = trpc.playlist.getTracks.useQuery(
    { playlistId },
    { enabled: isAuthenticated && playlistId > 0 }
  );

  const [localTracks, setLocalTracks] = useState<Track[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  useEffect(() => {
    if (tracks) {
      setLocalTracks(tracks as Track[]);
    }
  }, [tracks]);

  const reorderMutation = trpc.playlist.reorderTracks.useMutation({
    onSuccess: () => {
      toast.success("Playlist reordered");
    },
    onError: (error) => {
      toast.error(`Failed to reorder: ${error.message}`);
      refetch();
    },
  });

  const removeTrackMutation = trpc.playlist.removeTrack.useMutation({
    onSuccess: () => {
      toast.success("Track removed from playlist");
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to remove track: ${error.message}`);
    },
  });

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newTracks = [...localTracks];
    const [draggedTrack] = newTracks.splice(draggedIndex, 1);
    newTracks.splice(dropIndex, 0, draggedTrack);
    setLocalTracks(newTracks);

    // Save new order to database
    const trackIds = newTracks.map((t) => t.id);
    reorderMutation.mutate({ playlistId, trackIds });

    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handlePlayTrack = (track: Track) => {
    // Set playlist tracks for playback context
    const playlistTracks = localTracks.map((t) => ({
      id: t.id.toString(),
      title: t.title,
      artist: t.artist,
      duration: t.duration,
      url: t.fileUrl,
    }));
    setPlaylist(playlistTracks);
    playTrack(track.id.toString());
  };

  const handleRemoveTrack = (trackId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    removeTrackMutation.mutate({ playlistId, trackId });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (loading || playlistLoading) {
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
          <h2 className="text-2xl font-bold mb-2">Sign in to view playlist</h2>
        </div>
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <ListMusic className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-2">Playlist not found</h2>
          <Button onClick={() => setLocation("/playlists")}>Back to Playlists</Button>
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
              <Button variant="ghost" size="icon" onClick={() => setLocation("/playlists")}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <PlaylistCoverUpload
                playlistId={playlistId}
                currentCoverUrl={playlist.coverUrl}
                onCoverChange={() => {
                  // Refetch playlist to update cover
                }}
                size="md"
              />
              <div>
                <h1 className="text-2xl font-bold text-foreground">{playlist.name}</h1>
                {playlist.description && (
                  <p className="text-sm text-muted-foreground">{playlist.description}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">
                {localTracks.length} {localTracks.length === 1 ? "track" : "tracks"}
              </span>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container py-8">
        {tracksLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
          </div>
        ) : localTracks.length > 0 ? (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground mb-4">
              Drag tracks to reorder them in the playlist
            </p>
            {localTracks.map((track, index) => {
              const isCurrentTrack = currentTrackId === track.id.toString();
              const isDragging = draggedIndex === index;
              const isDragOver = dragOverIndex === index;

              return (
                <div
                  key={track.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`group flex items-center gap-4 p-4 rounded-lg border transition-all cursor-grab active:cursor-grabbing ${
                    isDragging
                      ? "opacity-50 border-accent"
                      : isDragOver
                      ? "border-accent bg-accent/10"
                      : isCurrentTrack
                      ? "border-accent/50 bg-accent/5"
                      : "border-border/50 bg-card/50 hover:bg-card/80"
                  }`}
                >
                  <div className="text-muted-foreground cursor-grab">
                    <GripVertical className="w-5 h-5" />
                  </div>
                  <span className="w-8 text-center text-sm text-muted-foreground">
                    {index + 1}
                  </span>
                  <button
                    onClick={() => {
                      if (isCurrentTrack && isPlaying) {
                        pauseTrack();
                      } else {
                        handlePlayTrack(track);
                      }
                    }}
                    className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center hover:bg-accent/30 transition-colors"
                  >
                    {isCurrentTrack && isPlaying ? (
                      <Pause className="w-5 h-5 text-accent" />
                    ) : (
                      <Play className="w-5 h-5 text-accent ml-0.5" />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium truncate ${isCurrentTrack ? "text-accent" : ""}`}>
                      {track.title}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">{track.artist}</p>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {formatDuration(track.duration)}
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={(e) => handleRemoveTrack(track.id, e)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Remove from Playlist
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <ListMusic className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-2">No tracks in this playlist</h2>
            <p className="text-muted-foreground mb-6">
              Add tracks from your library to build your playlist
            </p>
            <Button onClick={() => setLocation("/")}>Browse Library</Button>
          </div>
        )}
      </div>
    </div>
  );
}
