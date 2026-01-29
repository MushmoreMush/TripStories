import { useState, type ReactNode } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Zap, Loader2, Sparkles } from "lucide-react";

const substances = [
  "Psilocybin",
  "LSD",
  "DMT",
  "Ayahuasca",
  "MDMA",
  "Ketamine",
  "Cannabis",
  "Mescaline",
  "2C-B",
  "Salvia",
  "Other",
];

interface QuickLogModalProps {
  trigger?: ReactNode;
}

export function QuickLogModal({ trigger }: QuickLogModalProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    substance: "",
    amount: "",
    notes: "",
  });

  const mutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/reports", {
        substance: formData.substance,
        amount: formData.amount,
        setMindset: formData.notes || "Quick log - to be expanded later",
        setting: "Quick log - to be expanded later",
        experience: formData.notes || "Quick log entry. Experience details to be added later.",
        isQuickLog: true,
      });
    },
    onSuccess: () => {
      toast({
        title: "Quick log saved",
        description: "You can expand on this entry later from your journal.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
      queryClient.invalidateQueries({ queryKey: ["/api/feed"] });
      setOpen(false);
      setFormData({ substance: "", amount: "", notes: "" });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to save quick log",
        variant: "destructive",
      });
    },
  });

  const isValid = formData.substance && formData.amount;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" data-testid="button-quick-log">
            <Zap className="h-4 w-4 mr-2" />
            Quick Log
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div>
              <DialogTitle>Quick Log</DialogTitle>
              <DialogDescription>
                Capture the essentials now, expand later
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Substance
            </label>
            <Select
              value={formData.substance}
              onValueChange={(value) =>
                setFormData({ ...formData, substance: value })
              }
            >
              <SelectTrigger data-testid="quicklog-select-substance">
                <SelectValue placeholder="Select substance" />
              </SelectTrigger>
              <SelectContent>
                {substances.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Amount / Dosage</label>
            <Input
              placeholder="e.g., 2g, 100ug, 1 tab"
              value={formData.amount}
              onChange={(e) =>
                setFormData({ ...formData, amount: e.target.value })
              }
              data-testid="quicklog-input-amount"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Quick Notes{" "}
              <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <Textarea
              placeholder="Any initial thoughts or feelings..."
              className="min-h-[80px] resize-none"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              data-testid="quicklog-textarea-notes"
            />
          </div>

          <p className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
            This creates a quick entry you can expand on later. We'll prompt you
            to add more details when you're ready.
          </p>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => setOpen(false)}
            disabled={mutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={!isValid || mutation.isPending}
            data-testid="button-save-quicklog"
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Save Quick Log
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
