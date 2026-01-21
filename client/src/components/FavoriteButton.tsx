import { Heart } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';

interface FavoriteButtonProps {
  trackId: number;
  size?: 'sm' | 'md' | 'lg';
  onFavoriteChange?: (isFavorite: boolean) => void;
}

export function FavoriteButton({ trackId, size = 'md', onFavoriteChange }: FavoriteButtonProps) {
  const [isFavorite, setIsFavorite] = useState(false);

  // Check if track is favorited
  const { data: isFav } = trpc.favorites.check.useQuery(
    { trackId },
    { enabled: !!trackId }
  );

  useEffect(() => {
    if (isFav !== undefined) {
      setIsFavorite(isFav);
    }
  }, [isFav]);

  const addMutation = trpc.favorites.add.useMutation({
    onSuccess: () => {
      setIsFavorite(true);
      onFavoriteChange?.(true);
      toast.success('Added to favorites');
    },
    onError: () => {
      toast.error('Failed to add to favorites');
    },
  });

  const removeMutation = trpc.favorites.remove.useMutation({
    onSuccess: () => {
      setIsFavorite(false);
      onFavoriteChange?.(false);
      toast.success('Removed from favorites');
    },
    onError: () => {
      toast.error('Failed to remove from favorites');
    },
  });

  const handleToggle = () => {
    if (isFavorite) {
      removeMutation.mutate({ trackId });
    } else {
      addMutation.mutate({ trackId });
    }
  };

  const sizeMap = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const isLoading = addMutation.isPending || removeMutation.isPending;

  return (
    <button
      onClick={handleToggle}
      disabled={isLoading}
      className={`p-2 hover:bg-border/30 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
        isFavorite ? 'text-red-500' : 'text-muted-foreground'
      }`}
      aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
      title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
    >
      <Heart
        className={`${sizeMap[size]} transition-all duration-200 ${
          isFavorite ? 'fill-current' : ''
        }`}
      />
    </button>
  );
}
