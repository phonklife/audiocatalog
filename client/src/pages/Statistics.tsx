import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Loader2, Music, ArrowLeft, TrendingUp, Clock, Play, BarChart3 } from "lucide-react";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import { AudioTrack } from "@/components/AudioTrack";
import { usePlayback } from "@/contexts/PlaybackContext";
import { useLocation } from "wouter";

export default function Statistics() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const { currentTrackId, isPlaying, playTrack, pauseTrack, playNext, playPrevious, setPlaylist } = usePlayback();

  const { data: stats, isLoading: statsLoading } = trpc.history.statistics.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const { data: recentlyPlayed, isLoading: recentLoading } = trpc.history.recentlyPlayed.useQuery(
    { limit: 5 },
    { enabled: isAuthenticated }
  );

  const { data: topTracks, isLoading: topLoading } = trpc.history.topTracks.useQuery(
    { limit: 10 },
    { enabled: isAuthenticated }
  );

  // Update playlist when top tracks change
  useEffect(() => {
    if (topTracks && topTracks.length > 0) {
      const playlistTracks = topTracks.map((track) => ({
        id: track.id.toString(),
        title: track.title,
        artist: track.artist,
        duration: track.duration,
        url: track.fileUrl,
      }));
      setPlaylist(playlistTracks);
    }
  }, [topTracks, setPlaylist]);

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
          <h1 className="text-3xl font-bold mb-2 text-foreground">Statistics</h1>
          <p className="text-muted-foreground mb-6">Sign in to view your listening statistics</p>
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
                <h1 className="text-2xl font-bold text-foreground">Your Statistics</h1>
                <p className="text-sm text-muted-foreground">Track your listening habits</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={() => setLocation('/analytics')}
                variant="outline"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Analytics
              </Button>
              <Button variant="outline" onClick={() => window.location.href = getLoginUrl()}>
                {user?.name || "Profile"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container py-8">
        {/* Statistics Cards */}
        {statsLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {/* Total Plays */}
            <div className="glass-card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm mb-1">Total Plays</p>
                  <p className="text-3xl font-bold text-foreground">{stats?.totalPlays || 0}</p>
                </div>
                <Play className="w-10 h-10 text-accent opacity-50" />
              </div>
            </div>

            {/* Unique Tracks */}
            <div className="glass-card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm mb-1">Unique Tracks Played</p>
                  <p className="text-3xl font-bold text-foreground">{stats?.uniqueTracks || 0}</p>
                </div>
                <Music className="w-10 h-10 text-accent opacity-50" />
              </div>
            </div>

            {/* Total Tracks */}
            <div className="glass-card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm mb-1">Total Tracks</p>
                  <p className="text-3xl font-bold text-foreground">{stats?.totalTracks || 0}</p>
                </div>
                <TrendingUp className="w-10 h-10 text-accent opacity-50" />
              </div>
            </div>
          </div>
        )}

        {/* Recently Played */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-accent" />
            Recently Played
          </h2>
          {recentLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-accent" />
            </div>
          ) : recentlyPlayed && recentlyPlayed.length > 0 ? (
            <div className="space-y-3">
              {recentlyPlayed.map((track) => (
                <div key={track.id} className="glass-card p-4 flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">{track.title}</p>
                    <p className="text-sm text-muted-foreground">{track.artist}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(track.playedAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="glass-card p-8 text-center">
              <p className="text-muted-foreground">No recently played tracks</p>
            </div>
          )}
        </div>

        {/* Top Tracks Recommendations */}
        <div>
          <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-accent" />
            Your Top Tracks
          </h2>
          {topLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-accent" />
            </div>
          ) : topTracks && topTracks.length > 0 ? (
            <div className="space-y-4">
              {topTracks.map((track) => (
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
              ))}
            </div>
          ) : (
            <div className="glass-card p-12 text-center">
              <Music className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-6">No top tracks yet. Start playing to see recommendations!</p>
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
