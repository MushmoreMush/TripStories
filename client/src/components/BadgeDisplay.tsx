import { useQuery, useMutation } from "@tanstack/react-query";
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge as BadgeUI } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { 
  Sparkles, BookOpen, Compass, Trophy, Brain, Flame, Crown, Users, Heart, PenTool, Award
} from "lucide-react";
import type { Badge, BadgeType } from "@shared/schema";
import { BADGE_INFO } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

const ICON_MAP: Record<string, typeof Sparkles> = {
  sparkles: Sparkles,
  "book-open": BookOpen,
  compass: Compass,
  trophy: Trophy,
  brain: Brain,
  flame: Flame,
  crown: Crown,
  users: Users,
  heart: Heart,
  "pen-tool": PenTool,
};

const BADGE_COLORS: Record<BadgeType, string> = {
  first_report: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  five_reports: "bg-green-500/10 text-green-600 border-green-500/20",
  ten_reports: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  twenty_five_reports: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  integration_master: "bg-pink-500/10 text-pink-600 border-pink-500/20",
  consistent_tracker: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  mood_champion: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  social_explorer: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20",
  supportive_friend: "bg-red-500/10 text-red-600 border-red-500/20",
  storyteller: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
};

interface BadgeDisplayProps {
  showCheckButton?: boolean;
  compact?: boolean;
}

export function BadgeDisplay({ showCheckButton = true, compact = false }: BadgeDisplayProps) {
  const { toast } = useToast();
  
  const { data: userBadges = [], isLoading } = useQuery<Badge[]>({
    queryKey: ["/api/badges"],
  });

  const checkBadgesMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/badges/check");
    },
    onSuccess: async (response) => {
      const data = await response.json();
      if (data.newBadges && data.newBadges.length > 0) {
        queryClient.invalidateQueries({ queryKey: ["/api/badges"] });
        data.newBadges.forEach((badge: Badge) => {
          const info = BADGE_INFO[badge.badgeType as BadgeType];
          if (info) {
            toast({
              title: `Badge Earned: ${info.name}`,
              description: info.description,
            });
          }
        });
      }
    },
  });

  useEffect(() => {
    if (showCheckButton) {
      checkBadgesMutation.mutate();
    }
  }, []);

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-br from-amber-500/5 to-orange-500/5">
        <CardContent className="p-6">
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  const earnedBadgeTypes = new Set(userBadges.map((b) => b.badgeType));
  const allBadgeTypes = Object.keys(BADGE_INFO) as BadgeType[];

  if (compact) {
    if (userBadges.length === 0) return null;
    
    return (
      <div className="flex flex-wrap gap-2">
        {userBadges.slice(0, 5).map((badge) => {
          const info = BADGE_INFO[badge.badgeType as BadgeType];
          const Icon = ICON_MAP[info?.icon || "sparkles"] || Award;
          const colorClass = BADGE_COLORS[badge.badgeType as BadgeType] || "";
          
          return (
            <Tooltip key={badge.id}>
              <TooltipTrigger asChild>
                <BadgeUI variant="outline" className={`gap-1 ${colorClass}`}>
                  <Icon className="h-3 w-3" />
                  <span className="text-xs">{info?.name}</span>
                </BadgeUI>
              </TooltipTrigger>
              <TooltipContent>
                <p className="font-medium">{info?.name}</p>
                <p className="text-xs text-muted-foreground">{info?.description}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
        {userBadges.length > 5 && (
          <BadgeUI variant="secondary" className="text-xs">
            +{userBadges.length - 5} more
          </BadgeUI>
        )}
      </div>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-amber-500/5 to-orange-500/5 border-amber-500/20">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Award className="h-5 w-5 text-amber-500" />
          Your Badges
        </CardTitle>
        <CardDescription>
          Milestones earned on your journey ({userBadges.length}/{allBadgeTypes.length})
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {allBadgeTypes.map((badgeType) => {
            const info = BADGE_INFO[badgeType];
            const Icon = ICON_MAP[info?.icon || "sparkles"] || Award;
            const isEarned = earnedBadgeTypes.has(badgeType);
            const earnedBadge = userBadges.find((b) => b.badgeType === badgeType);
            const colorClass = isEarned ? BADGE_COLORS[badgeType] : "bg-muted/50 text-muted-foreground border-muted";
            
            return (
              <Tooltip key={badgeType}>
                <TooltipTrigger asChild>
                  <div
                    className={`
                      flex flex-col items-center justify-center p-3 rounded-lg border text-center
                      transition-all cursor-default
                      ${colorClass}
                      ${isEarned ? "" : "opacity-40 grayscale"}
                    `}
                    data-testid={`badge-${badgeType}`}
                  >
                    <Icon className={`h-6 w-6 mb-1 ${isEarned ? "" : ""}`} />
                    <span className="text-xs font-medium line-clamp-2">{info?.name}</span>
                    {isEarned && earnedBadge?.earnedAt && (
                      <span className="text-[10px] text-muted-foreground mt-0.5">
                        {formatDistanceToNow(new Date(earnedBadge.earnedAt), { addSuffix: true })}
                      </span>
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="font-medium">{info?.name}</p>
                  <p className="text-xs text-muted-foreground">{info?.description}</p>
                  {!isEarned && <p className="text-xs text-amber-500 mt-1">Not yet earned</p>}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
