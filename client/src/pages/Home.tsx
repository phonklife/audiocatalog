import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Loader2, Music, Plus } from "lucide-react";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { AudioTrack } from "@/components/AudioTrack";
import { SearchBar } from "@/components/SearchBar";
import { UploadDialog } from "@/components/UploadDialog";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

  const { data: tracks, isLoading: tracksLoading, refetch } = trpc.audio.list.useQuery(
    { limit: 50, offset: 0 },
    { enabled: isAuthenticated }
  );

  const { data: searchResults } = trpc.audio.search.useQuery(
    { query: searchQuery, limit: 50 },
    { enabled: isAuthenticated && searchQuery.length > 0 }
  );

  const displayTracks = searchQuery.length > 0 ? searchResults : tracks;

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
          <h1 className="text-3xl font-bold mb-2 text-foreground">AudioCatalog</h1>
          <p className="text-muted-foreground mb-6">Discover and organize your audio collection</p>
          <Button
            onClick={() => (window.location.href = getLoginUrl())}
            className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
          >
            Sign In to Continue
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
              <Music className="w-8 h-8 text-accent" />
              <h1 className="text-2xl font-bold text-foreground">AudioCatalog</h1>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={() => setUploadDialogOpen(true)}
                className="bg-accent hover:bg-accent/90 text-accent-foreground"
              >
                <Plus className="w-4 h-4 mr-2" />
                Upload Track
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
        {/* Search Bar */}
        <div className="mb-8">
          <SearchBar
            onSearch={setSearchQuery}
            placeholder="Search by title, artist, or album..."
          />
        </div>

        {/* Tracks List */}
        <div className="space-y-4">
          {tracksLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-accent" />
            </div>
          ) : displayTracks && displayTracks.length > 0 ? (
            displayTracks.map((track) => (
              <AudioTrack
                key={track.id}
                id={track.id.toString()}
                title={track.title}
                artist={track.artist}
                duration={track.duration}
                url={track.fileUrl}
                isPlaying={playingTrackId === track.id.toString()}
                onPlay={(id) => setPlayingTrackId(id)}
                onPause={() => setPlayingTrackId(null)}
              />
            ))
          ) : (
            <div className="glass-card p-12 text-center">
              <Music className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-6">
                {searchQuery ? "No tracks found" : "No audio tracks yet. Upload your first track to get started!"}
              </p>
              {!searchQuery && (
                <Button
                  onClick={() => setUploadDialogOpen(true)}
                  className="bg-accent hover:bg-accent/90 text-accent-foreground"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Upload Your First Track
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Upload Dialog */}
      <UploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        onSuccess={() => refetch()}
      />
    </div>
  );
}
