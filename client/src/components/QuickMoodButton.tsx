import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { FeatureTooltip } from "./FeatureTooltip";
import { Plus, X, Smile, Meh, Frown, Heart, Sparkles } from "lucide-react";

const MOOD_OPTIONS = [
  { level: 1, icon: Frown, label: "Struggling", color: "text-red-500 hover:bg-red-500/10" },
  { level: 2, icon: Frown, label: "Low", color: "text-orange-500 hover:bg-orange-500/10" },
  { level: 3, icon: Meh, label: "Okay", color: "text-yellow-500 hover:bg-yellow-500/10" },
  { level: 4, icon: Smile, label: "Good", color: "text-green-500 hover:bg-green-500/10" },
  { level: 5, icon: Sparkles, label: "Great", color: "text-emerald-500 hover:bg-emerald-500/10" },
];

export function QuickMoodButton() {
  const { toast } = useToast();
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [notes, setNotes] = useState("");

  const moodMutation = useMutation({
    mutationFn: async (data: { level: number; notes: string }) => {
      const response = await apiRequest("POST", "/api/mood", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Mood logged!",
        description: "Your check-in has been recorded.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/mood"] });
      queryClient.invalidateQueries({ queryKey: ["/api/streak"] });
      queryClient.invalidateQueries({ queryKey: ["/api/suggestions/timing"] });
      setIsOpen(false);
      setSelectedMood(null);
      setNotes("");
    },
    onError: () => {
      toast({
        title: "Failed to log mood",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (selectedMood === null) return;
    moodMutation.mutate({ level: selectedMood, notes });
  };

  // Hide on community page to avoid overlapping with chat input
  if (location === "/community") {
    return null;
  }

  if (!isOpen) {
    return (
      <div className="fixed bottom-20 right-6 z-40">
        <FeatureTooltip
          id="quick-mood"
          title="Quick Mood Check"
          description="Tap here anytime to log how you're feeling. Regular check-ins help you spot patterns in your wellbeing."
          position="left"
        >
          <Button
            size="icon"
            className="rounded-full shadow-lg"
            onClick={() => setIsOpen(true)}
            data-testid="button-quick-mood"
          >
            <Plus className="h-5 w-5" />
          </Button>
        </FeatureTooltip>
      </div>
    );
  }

  return (
    <div 
      className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4"
      data-testid="modal-quick-mood-overlay"
    >
      <Card className="w-full max-w-sm animate-in slide-in-from-bottom-4 duration-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Heart className="h-5 w-5 text-accent" />
              Quick Mood Check
            </CardTitle>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => {
                setIsOpen(false);
                setSelectedMood(null);
                setNotes("");
              }}
              data-testid="button-close-quick-mood"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between gap-2">
            {MOOD_OPTIONS.map((option) => {
              const Icon = option.icon;
              return (
                <Button
                  key={option.level}
                  variant="outline"
                  onClick={() => setSelectedMood(option.level)}
                  className={`flex-1 flex flex-col items-center gap-1 p-3 ${
                    selectedMood === option.level
                      ? "border-primary bg-primary/10 ring-2 ring-primary"
                      : ""
                  }`}
                  data-testid={`mood-option-${option.level}`}
                >
                  <Icon className={`h-6 w-6 ${selectedMood === option.level ? "text-primary" : ""}`} />
                  <span className="text-xs">{option.label}</span>
                </Button>
              );
            })}
          </div>

          <Textarea
            placeholder="Any notes? (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="resize-none"
            rows={2}
            data-testid="input-quick-mood-notes"
          />

          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={selectedMood === null || moodMutation.isPending}
            data-testid="button-submit-quick-mood"
          >
            {moodMutation.isPending ? "Saving..." : "Log Mood"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
