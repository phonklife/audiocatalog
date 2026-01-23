import { useEffect } from "react";

interface KeyboardShortcuts {
  onPlayPause?: () => void;
  onNextTrack?: () => void;
  onPreviousTrack?: () => void;
  onMuteToggle?: () => void;
  onVolumeUp?: () => void;
  onVolumeDown?: () => void;
  onThemeToggle?: () => void;
}

const VOLUME_STEP = 0.1;

export function useKeyboardShortcuts({
  onPlayPause,
  onNextTrack,
  onPreviousTrack,
  onMuteToggle,
  onVolumeUp,
  onVolumeDown,
  onThemeToggle,
}: KeyboardShortcuts) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in an input field
      const target = event.target as HTMLElement;
      const isInput =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.contentEditable === "true";

      if (isInput) {
        return;
      }

      switch (event.code) {
        case "Space":
          event.preventDefault();
          onPlayPause?.();
          break;
        case "ArrowRight":
          event.preventDefault();
          onNextTrack?.();
          break;
        case "ArrowLeft":
          event.preventDefault();
          onPreviousTrack?.();
          break;
        case "KeyM":
          if (!event.ctrlKey && !event.metaKey && !event.altKey) {
            event.preventDefault();
            onMuteToggle?.();
          }
          break;
        case "Equal":
        case "Plus":
        case "NumpadAdd":
          if (!event.ctrlKey && !event.metaKey && !event.altKey) {
            event.preventDefault();
            onVolumeUp?.();
          }
          break;
        case "Minus":
        case "NumpadSubtract":
          if (!event.ctrlKey && !event.metaKey && !event.altKey) {
            event.preventDefault();
            onVolumeDown?.();
          }
          break;
        case "KeyT":
          if (event.shiftKey && !event.ctrlKey && !event.metaKey && !event.altKey) {
            event.preventDefault();
            onThemeToggle?.();
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onPlayPause, onNextTrack, onPreviousTrack, onMuteToggle, onVolumeUp, onVolumeDown, onThemeToggle]);
}
