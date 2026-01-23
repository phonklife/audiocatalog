import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plus, ListMusic } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface CreatePlaylistDialogProps {
  onSuccess?: () => void;
}

export function CreatePlaylistDialog({ onSuccess }: CreatePlaylistDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);

  const createPlaylistMutation = trpc.playlist.create.useMutation({
    onSuccess: () => {
      toast.success("Playlist created successfully!");
      setOpen(false);
      setName("");
      setDescription("");
      setIsPublic(false);
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(`Failed to create playlist: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please enter a playlist name");
      return;
    }
    createPlaylistMutation.mutate({ name, description, isPublic });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
          <Plus className="w-4 h-4 mr-2" />
          New Playlist
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ListMusic className="w-5 h-5" />
            Create New Playlist
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Playlist Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Awesome Playlist"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A collection of my favorite tracks..."
              rows={3}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="isPublic">Make playlist public</Label>
            <Switch
              id="isPublic"
              checked={isPublic}
              onCheckedChange={setIsPublic}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createPlaylistMutation.isPending}>
              {createPlaylistMutation.isPending ? "Creating..." : "Create Playlist"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
