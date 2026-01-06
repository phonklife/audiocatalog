import { useState, useEffect } from 'react';
import { Play, Pause, Volume2 } from 'lucide-react';

interface AudioTrackProps {
  id: string;
  title: string;
  artist: string;
  duration: number;
  url: string;
  isPlaying?: boolean;
  onPlay?: (id: string) => void;
  onPause?: () => void;
}

export function AudioTrack({
  id,
  title,
  artist,
  duration,
  url,
  isPlaying = false,
  onPlay,
  onPause,
}: AudioTrackProps) {
  const [waveform, setWaveform] = useState<number[]>([]);
  const [currentTime, setCurrentTime] = useState(0);

  // Generate random waveform data for visualization
  useEffect(() => {
    const bars = Array.from({ length: 40 }, () => Math.random() * 100);
    setWaveform(bars);
  }, []);

  const handlePlayClick = () => {
    if (isPlaying) {
      onPause?.();
    } else {
      onPlay?.(id);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = (currentTime / duration) * 100;

  return (
    <div className="glass-card p-4 hover:bg-card/50 transition-all duration-300 group">
      <div className="flex items-start gap-4">
        {/* Play Button */}
        <button
          onClick={handlePlayClick}
          className="mt-1 p-3 rounded-lg bg-accent/20 hover:bg-accent/30 transition-all duration-300 flex-shrink-0"
        >
          {isPlaying ? (
            <Pause className="w-5 h-5 text-accent" />
          ) : (
            <Play className="w-5 h-5 text-accent" />
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

        {/* Volume Icon */}
        <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <Volume2 className="w-5 h-5 text-muted-foreground" />
        </div>
      </div>

      {/* Hidden audio element for future implementation */}
      <audio
        src={url}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onEnded={() => onPause?.()}
      />
    </div>
  );
}
