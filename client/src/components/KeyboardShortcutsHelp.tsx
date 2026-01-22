import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Keyboard } from "lucide-react";
import { useState } from "react";

export function KeyboardShortcutsHelp() {
  const [open, setOpen] = useState(false);

  const shortcuts = [
    { key: "Space", description: "Play / Pause" },
    { key: "→ (Right Arrow)", description: "Next Track" },
    { key: "← (Left Arrow)", description: "Previous Track" },
    { key: "M", description: "Mute / Unmute" },
    { key: "+ (Plus)", description: "Volume Up" },
    { key: "- (Minus)", description: "Volume Down" },
    { key: "Shift + T", description: "Toggle Theme" },
  ];

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        onClick={() => setOpen(true)}
        className="w-10 h-10"
        aria-label="Keyboard shortcuts help"
        title="Keyboard shortcuts (press ? for help)"
      >
        <Keyboard className="w-5 h-5" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription>
            Use these keyboard shortcuts to control AudioCatalog
          </DialogDescription>
          <div className="space-y-3 py-4">
            {shortcuts.map((shortcut, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-foreground">{shortcut.description}</span>
                <kbd className="px-3 py-1 bg-muted text-muted-foreground rounded font-mono text-sm border border-border">
                  {shortcut.key}
                </kbd>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
