import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Loader2, Music, ArrowLeft } from "lucide-react";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import { AudioTrack } from "@/components/AudioTrack";
import { usePlayback } from "@/contexts/PlaybackContext";
import { useLocation } from "wouter";

export default function Favorites() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const { currentTrackId, isPlaying, playTrack, pauseTrack, playNext, playPrevious, setPlaylist } = usePlayback();

  const { data: favoriteTracks, isLoading: tracksLoading, refetch } = trpc.favorites.list.useQuery(
    { limit: 50, offset: 0 },
    { enabled: isAuthenticated }
  );

  // Update playlist when favorite tracks change
  useEffect(() => {
    if (favoriteTracks && favoriteTracks.length > 0) {
      const playlistTracks = favoriteTracks.map((track) => ({
        id: track.id.toString(),
        title: track.title,
        artist: track.artist,
        duration: track.duration,
        url: track.fileUrl,
      }));
      setPlaylist(playlistTracks);
    }
  }, [favoriteTracks, setPlaylist]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-950 via-blue-950 to-blue-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-950 via-blue-950 to-blue-900 flex items-center justify-center p-4">
        <div className="glass-card max-w-md w-full p-8 text-center">
          <Music className="w-16 h-16 mx-auto mb-4 text-accent" />
          <h1 className="text-3xl font-bold mb-2 text-foreground">Favorites</h1>
          <p className="text-muted-foreground mb-6">Sign in to view your favorite tracks</p>
          <Button
            onClick={() => (window.location.href = getLoginUrl())}
            className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
          >
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950 via-blue-950 to-blue-900">
      {/* Header */}
      <div className="border-b border-border/20 backdrop-blur-md bg-background/10">
        <div className="container py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setLocation('/')}
                className="p-2 hover:bg-border/30 rounded-lg transition-colors"
                aria-label="Back to catalog"
              >
                <ArrowLeft className="w-6 h-6 text-muted-foreground" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Favorites</h1>
                <p className="text-sm text-muted-foreground">
                  {favoriteTracks?.length || 0} track{favoriteTracks?.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={() => window.location.href = getLoginUrl()}>
              {user?.name || "Profile"}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container py-8">
        {/* Tracks List */}
        <div className="space-y-4">
          {tracksLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-accent" />
            </div>
          ) : favoriteTracks && favoriteTracks.length > 0 ? (
            favoriteTracks.map((track) => (
              <AudioTrack
                key={track.id}
                id={track.id.toString()}
                title={track.title}
                artist={track.artist}
                duration={track.duration}
                url={track.fileUrl}
                isPlaying={currentTrackId === track.id.toString() && isPlaying}
                onPlay={(id) => playTrack(id)}
                onPause={() => pauseTrack()}
                onNext={() => {
                  playNext();
                }}
                onPrevious={() => {
                  playPrevious();
                }}
              />
            ))
          ) : (
            <div className="glass-card p-12 text-center">
              <Music className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-6">
                No favorite tracks yet. Add tracks to your favorites to see them here!
              </p>
              <Button
                onClick={() => setLocation('/')}
                className="bg-accent hover:bg-accent/90 text-accent-foreground"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Catalog
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
