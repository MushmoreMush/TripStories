import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { X, Lightbulb } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { User } from "@shared/schema";

interface FeatureTooltipProps {
  id: string;
  title: string;
  description: string;
  position?: "top" | "bottom" | "left" | "right";
  children: React.ReactNode;
}

export function FeatureTooltip({ 
  id, 
  title, 
  description, 
  position = "bottom",
  children 
}: FeatureTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  const { data: user } = useQuery<User>({
    queryKey: ["/api/auth/user"],
  });

  const dismissMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("/api/user/tooltips/dismiss", {
        method: "POST",
        body: JSON.stringify({ tooltipId: id }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setIsVisible(false);
    },
  });

  const hasSeenTooltip = user?.seenFeatureTooltips?.includes(id);
  const hasCompletedOnboarding = user?.hasCompletedOnboarding;

  useEffect(() => {
    if (hasCompletedOnboarding && !hasSeenTooltip) {
      const timer = setTimeout(() => setIsVisible(true), 500);
      return () => clearTimeout(timer);
    }
  }, [hasCompletedOnboarding, hasSeenTooltip]);

  const handleDismiss = () => {
    dismissMutation.mutate();
  };

  const positionClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  const arrowClasses = {
    top: "top-full left-1/2 -translate-x-1/2 border-t-primary border-x-transparent border-b-transparent",
    bottom: "bottom-full left-1/2 -translate-x-1/2 border-b-primary border-x-transparent border-t-transparent",
    left: "left-full top-1/2 -translate-y-1/2 border-l-primary border-y-transparent border-r-transparent",
    right: "right-full top-1/2 -translate-y-1/2 border-r-primary border-y-transparent border-l-transparent",
  };

  return (
    <div className="relative inline-block">
      {children}
      
      {isVisible && (
        <div 
          className={`absolute z-50 ${positionClasses[position]} animate-in fade-in slide-in-from-bottom-2 duration-300`}
          data-testid={`tooltip-${id}`}
        >
          <div className="bg-primary text-primary-foreground rounded-lg shadow-lg p-4 max-w-xs">
            <div className="flex items-start gap-3">
              <Lightbulb className="h-5 w-5 shrink-0 mt-0.5" />
              <div className="flex-1 space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-semibold text-sm">{title}</h4>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 -mt-1 -mr-1 hover:bg-primary-foreground/20"
                    onClick={handleDismiss}
                    data-testid={`button-dismiss-tooltip-${id}`}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                <p className="text-xs opacity-90">{description}</p>
              </div>
            </div>
            <Button
              variant="secondary"
              size="sm"
              className="w-full mt-3"
              onClick={handleDismiss}
            >
              Got it
            </Button>
          </div>
          <div 
            className={`absolute w-0 h-0 border-8 ${arrowClasses[position]}`}
          />
        </div>
      )}
    </div>
  );
}
