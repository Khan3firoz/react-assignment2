import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, Copy, Globe, Lock } from "lucide-react";
import {
  loadShareState,
  setShareVisibility,
  type ShareState,
} from "@/services/shareService";

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ShareDialog({ open, onOpenChange }: ShareDialogProps) {
  const [state, setState] = useState<ShareState>(() => loadShareState());
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open) setState(loadShareState());
  }, [open]);

  const choose = (visibility: ShareState["visibility"]) => {
    setState(setShareVisibility(visibility));
    setCopied(false);
  };

  const copy = async () => {
    if (!state.url) return;
    try {
      await navigator.clipboard.writeText(state.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked — user can select manually */
    }
  };

  const options = [
    {
      value: "private" as const,
      icon: Lock,
      title: "Private",
      desc: "Only you can view this dashboard.",
    },
    {
      value: "link" as const,
      icon: Globe,
      title: "Anyone with link can view",
      desc: "Anyone who has the link can view (simulated — no backend).",
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)} className="max-w-md">
        <DialogHeader>
          <DialogTitle>Share dashboard</DialogTitle>
        </DialogHeader>

        <div
          role="radiogroup"
          aria-label="Dashboard visibility"
          className="flex flex-col gap-2"
        >
          {options.map((opt) => {
            const Icon = opt.icon;
            const active = state.visibility === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => choose(opt.value)}
                className={`flex items-start gap-3 rounded-md border p-3 text-left transition-colors ${
                  active
                    ? "border-primary bg-primary/5"
                    : "hover:bg-accent"
                }`}
              >
                <Icon className="mt-0.5 h-4 w-4 shrink-0" />
                <span className="flex flex-col">
                  <span className="text-sm font-medium">{opt.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {opt.desc}
                  </span>
                </span>
                {active && <Check className="ml-auto h-4 w-4 text-primary" />}
              </button>
            );
          })}
        </div>

        {state.visibility === "link" && state.url && (
          <div className="flex items-center gap-2">
            <Input readOnly value={state.url} className="font-mono text-xs" />
            <Button variant="outline" size="sm" onClick={copy}>
              {copied ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
        )}

        <p className="text-[11px] text-muted-foreground">
          This is a frontend-only simulation. No data leaves your browser.
        </p>
      </DialogContent>
    </Dialog>
  );
}
