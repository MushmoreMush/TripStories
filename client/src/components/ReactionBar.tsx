import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Heart, HandHeart, Zap, Lightbulb, Sparkles, Loader2 } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { ReactionCount, ReactionType } from "@shared/schema";

const reactionConfig: Record<ReactionType, { icon: typeof Heart; label: string; color: string }> = {
  care: { icon: Heart, label: "Care", color: "text-pink-500" },
  solidarity: { icon: HandHeart, label: "Solidarity", color: "text-blue-500" },
  strength: { icon: Zap, label: "Strength", color: "text-amber-500" },
  insight: { icon: Lightbulb, label: "Insight", color: "text-purple-500" },
  gratitude: { icon: Sparkles, label: "Gratitude", color: "text-emerald-500" },
};

interface ReactionBarProps {
  reportId: number;
  compact?: boolean;
}

export function ReactionBar({ reportId, compact = false }: ReactionBarProps) {
  const { data: reactions, isLoading } = useQuery<ReactionCount[]>({
    queryKey: [`/api/reports/${reportId}/reactions`],
  });

  const toggleMutation = useMutation({
    mutationFn: async (type: ReactionType) => {
      return apiRequest("POST", `/api/reports/${reportId}/reactions`, { type });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/reports/${reportId}/reactions`] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-1 h-8">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const activeReactions = (reactions ?? []).filter((r) => r.count > 0 || r.userReacted);

  if (compact) {
    return (
      <div className="flex items-center gap-1 flex-wrap">
        {(reactions ?? []).map((reaction) => {
          const config = reactionConfig[reaction.type];
          const Icon = config.icon;
          const isActive = reaction.userReacted;
          
          return (
            <Tooltip key={reaction.type}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-8 px-2 gap-1 ${isActive ? config.color : "text-muted-foreground"}`}
                  onClick={() => toggleMutation.mutate(reaction.type)}
                  disabled={toggleMutation.isPending}
                  data-testid={`button-reaction-${reaction.type}-${reportId}`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? "fill-current" : ""}`} />
                  {reaction.count > 0 && (
                    <span className="text-xs font-medium">{reaction.count}</span>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{config.label}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {(reactions ?? []).map((reaction) => {
        const config = reactionConfig[reaction.type];
        const Icon = config.icon;
        const isActive = reaction.userReacted;
        
        return (
          <Tooltip key={reaction.type}>
            <TooltipTrigger asChild>
              <Button
                variant={isActive ? "secondary" : "ghost"}
                size="sm"
                className={`gap-1.5 ${isActive ? config.color : "text-muted-foreground"}`}
                onClick={() => toggleMutation.mutate(reaction.type)}
                disabled={toggleMutation.isPending}
                data-testid={`button-reaction-${reaction.type}-${reportId}`}
              >
                <Icon className={`h-4 w-4 ${isActive ? "fill-current" : ""}`} />
                <span className="text-xs">{config.label}</span>
                {reaction.count > 0 && (
                  <span className={`text-xs font-medium ${isActive ? "" : "text-muted-foreground"}`}>
                    {reaction.count}
                  </span>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Send {config.label.toLowerCase()}</p>
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}
