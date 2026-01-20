import { useEffect, useRef, useState } from 'react';
import { Play, Pause, Volume2, VolumeX, SkipBack, SkipForward } from 'lucide-react';
import { Slider } from '@/components/ui/slider';

interface AudioPlayerProps {
  url: string;
  title: string;
  artist: string;
  isPlaying: boolean;
  onPlayPause: (playing: boolean) => void;
  onTrackEnd?: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
}

export function AudioPlayer({
  url,
  title,
  artist,
  isPlaying,
  onPlayPause,
  onTrackEnd,
  onNext,
  onPrevious,
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle play/pause
  useEffect(() => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.play().catch((err) => {
        console.error('Playback error:', err);
        setError('Failed to play audio');
        onPlayPause(false);
      });
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, onPlayPause]);

  // Handle URL changes
  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.src = url;
    setCurrentTime(0);
    setError(null);
    if (isPlaying) {
      audioRef.current.play().catch((err) => {
        console.error('Playback error:', err);
        setError('Failed to play audio');
        onPlayPause(false);
      });
    }
  }, [url, isPlaying, onPlayPause]);

  // Handle volume changes
  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  // Update current time
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  // Update duration
  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
      setIsLoading(false);
    }
  };

  // Handle track end
  const handleEnded = () => {
    onPlayPause(false);
    onTrackEnd?.();
  };

  // Handle seek
  const handleSeek = (value: number[]) => {
    const newTime = value[0];
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  // Format time display
  const formatTime = (seconds: number) => {
    if (!isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate progress percentage
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="glass-card p-4 space-y-4">
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onLoadStart={() => setIsLoading(true)}
        onCanPlay={() => setIsLoading(false)}
        onError={() => {
          setError('Failed to load audio');
          setIsLoading(false);
        }}
      />

      {/* Track info */}
      <div className="min-h-[3rem] flex flex-col justify-center">
        <h3 className="text-sm font-semibold text-foreground truncate">{title}</h3>
        <p className="text-xs text-muted-foreground truncate">{artist}</p>
      </div>

      {/* Error display */}
      {error && (
        <div className="text-xs text-red-400 bg-red-500/10 p-2 rounded">
          {error}
        </div>
      )}

      {/* Progress bar */}
      <div className="space-y-1">
        <Slider
          value={[currentTime]}
          max={duration || 100}
          step={0.1}
          onValueChange={handleSeek}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between gap-2">
        {/* Previous button */}
        <button
          onClick={onPrevious}
          disabled={!onPrevious}
          className="p-2 hover:bg-border/30 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Previous track"
        >
          <SkipBack className="w-4 h-4 text-muted-foreground" />
        </button>

        {/* Play/Pause button */}
        <button
          onClick={() => onPlayPause(!isPlaying)}
          disabled={isLoading || !!error}
          className="flex-1 p-2 bg-accent hover:bg-accent/90 disabled:bg-accent/50 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:cursor-not-allowed"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-accent-foreground/30 border-t-accent-foreground rounded-full animate-spin" />
          ) : isPlaying ? (
            <Pause className="w-4 h-4 text-accent-foreground" />
          ) : (
            <Play className="w-4 h-4 text-accent-foreground" />
          )}
          <span className="text-sm font-medium text-accent-foreground">
            {isLoading ? 'Loading...' : isPlaying ? 'Pause' : 'Play'}
          </span>
        </button>

        {/* Next button */}
        <button
          onClick={onNext}
          disabled={!onNext}
          className="p-2 hover:bg-border/30 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Next track"
        >
          <SkipForward className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* Volume control */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setIsMuted(!isMuted)}
          className="p-1 hover:bg-border/30 rounded transition-colors"
          aria-label={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? (
            <VolumeX className="w-4 h-4 text-muted-foreground" />
          ) : (
            <Volume2 className="w-4 h-4 text-muted-foreground" />
          )}
        </button>
        <Slider
          value={[isMuted ? 0 : volume]}
          max={1}
          step={0.01}
          onValueChange={(value) => {
            setVolume(value[0]);
            if (value[0] > 0) setIsMuted(false);
          }}
          className="flex-1"
        />
      </div>
    </div>
  );
}
