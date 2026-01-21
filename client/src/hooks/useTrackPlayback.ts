import { useEffect } from 'react';
import { trpc } from '@/lib/trpc';

export function useTrackPlayback(trackId: number | null, isPlaying: boolean) {
  const recordMutation = trpc.history.record.useMutation();

  useEffect(() => {
    if (isPlaying && trackId) {
      // Record the playback when track starts playing
      recordMutation.mutate({ trackId });
    }
  }, [isPlaying, trackId, recordMutation]);
}
