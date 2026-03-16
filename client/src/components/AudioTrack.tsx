import { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { AudioPlayer } from './AudioPlayer';
import { FavoriteButton } from './FavoriteButton';
import { AddToPlaylistDialog } from './AddToPlaylistDialog';
import { EditTrackDialog } from './EditTrackDialog';
import { useTrackPlayback } from '@/hooks/useTrackPlayback';

interface AudioTrackProps {
  id: string;
  title: string;
  artist: string;
  album?: string | null;
  genre?: string | null;
  description?: string | null;
  duration: number;
  url: string;
  isPlaying?: boolean;
  onPlay?: (id: string) => void;
  onPause?: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  onTrackUpdated?: () => void;
}

export function AudioTrack({
  id,
  title,
  artist,
  album,
  genre,
  description,
  duration,
  url,
  isPlaying = false,
  onPlay,
  onPause,
  onNext,
  onPrevious,
  onTrackUpdated,
}: AudioTrackProps) {
  const [waveform, setWaveform] = useState<number[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  // Track playback for statistics
  useTrackPlayback(parseInt(id), isPlaying);

  // Generate random waveform data for visualization
  useEffect(() => {
    const bars = Array.from({ length: 40 }, () => Math.random() * 100);
    setWaveform(bars);
  }, []);

  // Handle play/pause
  useEffect(() => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.play().catch((err) => {
        console.error('Playback error:', err);
        onPause?.();
      });
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, onPause]);

  const handlePlayClick = () => {
    if (isPlaying) {
      onPause?.();
    } else {
      onPlay?.(id);
      setIsExpanded(true);
    }
  };

  const formatTime = (seconds: number) => {
    if (!isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="glass-card overflow-hidden transition-all duration-300">
      {/* Collapsed view */}
      <div className="p-4 hover:bg-card/50 transition-all duration-300 group">
        <div className="flex items-start gap-4">
          {/* Play Button */}
          <button
            onClick={handlePlayClick}
            className="mt-1 p-3 rounded-lg bg-accent/20 hover:bg-accent/30 transition-all duration-300 flex-shrink-0"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <svg className="w-5 h-5 text-accent" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-accent" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          {/* Track Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground truncate text-lg">{title}</h3>
            <p className="text-muted-foreground text-sm truncate">{artist}</p>

            {/* Waveform Visualization */}
            <div className="mt-3 flex items-center gap-1 h-8">
              {waveform.map((height, idx) => (
                <div
                  key={idx}
                  className="waveform-bar"
                  style={{
                    height: `${isPlaying ? height * 0.8 + 20 : height * 0.5 + 10}%`,
                    opacity: idx / waveform.length < progress / 100 ? 1 : 0.5,
                  }}
                />
              ))}
            </div>

            {/* Progress Bar */}
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 h-1 bg-border/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-accent to-primary transition-all duration-100"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground font-mono">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex-shrink-0 flex items-center gap-2">
            <EditTrackDialog
              track={{ id: parseInt(id), title, artist, album, genre, description }}
              onSuccess={onTrackUpdated}
            />
            <AddToPlaylistDialog trackId={parseInt(id)} trackTitle={title} />
            <FavoriteButton trackId={parseInt(id)} size="md" />
          </div>

          {/* Expand button */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex-shrink-0 p-2 hover:bg-border/30 rounded-lg transition-colors"
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            )}
          </button>
        </div>
      </div>

      {/* Expanded player view */}
      {isExpanded && (
        <div className="border-t border-border/20 p-4 bg-background/50">
          <AudioPlayer
            url={url}
            title={title}
            artist={artist}
            isPlaying={isPlaying}
            onPlayPause={(playing) => {
              if (playing) {
                onPlay?.(id);
              } else {
                onPause?.();
              }
            }}
            onNext={onNext}
            onPrevious={onPrevious}
          />
        </div>
      )}

      {/* Hidden audio element for playback */}
      <audio
        ref={audioRef}
        src={url}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onEnded={() => onPause?.()}
      />
    </div>
  );
}
