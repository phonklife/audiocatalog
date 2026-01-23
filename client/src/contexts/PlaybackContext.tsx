import { createContext, useContext, useState, useCallback } from 'react';

interface Track {
  id: string;
  title: string;
  artist: string;
  duration: number;
  url: string;
}

interface PlaybackContextType {
  currentTrackId: string | null;
  isPlaying: boolean;
  playlist: Track[];
  currentTrackIndex: number;
  volume: number;
  isMuted: boolean;
  
  setPlaylist: (tracks: Track[]) => void;
  playTrack: (trackId: string) => void;
  pauseTrack: () => void;
  togglePlayPause: () => void;
  playNext: () => void;
  playPrevious: () => void;
  getCurrentTrack: () => Track | null;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
}

const PlaybackContext = createContext<PlaybackContextType | undefined>(undefined);

export function PlaybackProvider({ children }: { children: React.ReactNode }) {
  const [currentTrackId, setCurrentTrackId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playlist, setPlaylist] = useState<Track[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);

  const getCurrentTrack = useCallback(() => {
    if (currentTrackIndex >= 0 && currentTrackIndex < playlist.length) {
      return playlist[currentTrackIndex];
    }
    return null;
  }, [playlist, currentTrackIndex]);

  const playTrack = useCallback((trackId: string) => {
    const index = playlist.findIndex((t) => t.id === trackId);
    if (index !== -1) {
      setCurrentTrackId(trackId);
      setCurrentTrackIndex(index);
      setIsPlaying(true);
    }
  }, [playlist]);

  const pauseTrack = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const togglePlayPause = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  const playNext = useCallback(() => {
    if (currentTrackIndex < playlist.length - 1) {
      const nextTrack = playlist[currentTrackIndex + 1];
      playTrack(nextTrack.id);
    }
  }, [playlist, currentTrackIndex, playTrack]);

  const playPrevious = useCallback(() => {
    if (currentTrackIndex > 0) {
      const prevTrack = playlist[currentTrackIndex - 1];
      playTrack(prevTrack.id);
    }
  }, [playlist, currentTrackIndex, playTrack]);

  const handleSetVolume = useCallback((newVolume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, newVolume));
    setVolume(clampedVolume);
    if (clampedVolume > 0 && isMuted) {
      setIsMuted(false);
    }
  }, [isMuted]);

  const handleToggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  const value: PlaybackContextType = {
    currentTrackId,
    isPlaying,
    playlist,
    currentTrackIndex,
    volume,
    isMuted,
    setPlaylist,
    playTrack,
    pauseTrack,
    togglePlayPause,
    playNext,
    playPrevious,
    getCurrentTrack,
    setVolume: handleSetVolume,
    toggleMute: handleToggleMute,
  };

  return (
    <PlaybackContext.Provider value={value}>
      {children}
    </PlaybackContext.Provider>
  );
}

export function usePlayback() {
  const context = useContext(PlaybackContext);
  if (context === undefined) {
    throw new Error('usePlayback must be used within a PlaybackProvider');
  }
  return context;
}
