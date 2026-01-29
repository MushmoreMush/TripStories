import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { Lock, MapPin, Brain, Clock, Sparkles, ChevronDown, ChevronUp, MessageCircle, Zap, Pencil, Users } from "lucide-react";
import type { TripReportWithUser, User, CommentWithUser } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { CommentSection } from "./CommentSection";
import { ReactionBar } from "./ReactionBar";
import { Link } from "wouter";

interface TripReportCardProps {
  report: TripReportWithUser;
  showUser?: boolean;
  currentUser?: User | null;
}

export function TripReportCard({ report, showUser = true, currentUser }: TripReportCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showComments, setShowComments] = useState(false);

  const { data: comments = [] } = useQuery<CommentWithUser[]>({
    queryKey: ["/api/reports", report.id, "comments"],
  });

  const { data: friends = [] } = useQuery<User[]>({
    queryKey: ["/api/friends"],
  });

  const commentCount = comments.length;
  const hasCompanions = report.companionIds && report.companionIds.length > 0;
  const companions = hasCompanions
    ? friends.filter((f) => report.companionIds?.includes(f.id))
    : [];

  const userInitials = report.user?.username?.[0]?.toUpperCase() || "U";

  const displayName = report.user?.username || "Anonymous";

  const shouldTruncate = report.experience.length > 300;
  const displayExperience = shouldTruncate && !isExpanded 
    ? `${report.experience.slice(0, 300)}...`
    : report.experience;

  return (
    <Card 
      className="hover-elevate transition-all duration-200 overflow-visible" 
      data-testid={`card-report-${report.id}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          {showUser && (
            <div className="flex items-center gap-3">
              <Avatar className="h-11 w-11 ring-2 ring-background shadow-sm">
                <AvatarImage
                  src={report.user?.profileImageUrl || undefined}
                  alt={displayName}
                  className="object-cover"
                />
                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 text-primary text-sm font-semibold">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="font-semibold text-sm" data-testid={`text-author-${report.id}`}>
                  {displayName}
                </span>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {report.createdAt
                    ? formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })
                    : "Recently"}
                </span>
              </div>
            </div>
          )}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge 
              className="font-medium bg-gradient-to-r from-primary/10 to-accent/10 text-foreground border-0" 
              data-testid={`badge-substance-${report.id}`}
            >
              <Sparkles className="h-3 w-3 mr-1.5 text-primary" />
              {report.substance}
            </Badge>
            <Badge variant="outline" className="text-muted-foreground font-normal">
              {report.amount}
            </Badge>
            <div className="flex items-center justify-center h-6 w-6 rounded-full bg-muted/50">
              <Lock className="h-3 w-3 text-muted-foreground" />
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {report.isQuickLog && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center flex-shrink-0">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">Quick log entry</p>
              <p className="text-xs text-muted-foreground">Want to add more details about this experience?</p>
            </div>
            <Button size="sm" variant="outline" className="flex-shrink-0" asChild data-testid={`button-expand-quicklog-${report.id}`}>
              <Link href={`/edit-report/${report.id}`}>
                <Pencil className="h-3.5 w-3.5 mr-1.5" />
                Expand
              </Link>
            </Button>
          </div>
        )}
        
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg bg-muted/30 p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <div className="flex items-center justify-center h-6 w-6 rounded-full bg-purple-500/10">
                <Brain className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
              </div>
              <span>Set (Mindset)</span>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground pl-8" data-testid={`text-set-${report.id}`}>
              {report.setMindset}
            </p>
          </div>
          <div className="rounded-lg bg-muted/30 p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <div className="flex items-center justify-center h-6 w-6 rounded-full bg-emerald-500/10">
                <MapPin className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <span>Setting</span>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground pl-8" data-testid={`text-setting-${report.id}`}>
              {report.setting}
            </p>
          </div>
        </div>

        <div className="space-y-3 pt-3 border-t">
          <h4 className="font-semibold text-sm flex items-center gap-2">
            <div className="h-1 w-1 rounded-full bg-primary" />
            Experience
          </h4>
          <p 
            className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap" 
            data-testid={`text-experience-${report.id}`}
          >
            {displayExperience}
          </p>
          {shouldTruncate && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs text-muted-foreground p-0 h-auto"
              data-testid={`button-expand-${report.id}`}
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-3 w-3 mr-1" />
                  Show less
                </>
              ) : (
                <>
                  <ChevronDown className="h-3 w-3 mr-1" />
                  Read more
                </>
              )}
            </Button>
          )}
        </div>

        {report.tags && report.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-2">
            {report.tags.map((tag, index) => (
              <Badge 
                key={index} 
                variant="outline" 
                className="text-xs font-normal bg-background/50"
              >
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {hasCompanions && companions.length > 0 && (
          <div className="flex items-center gap-2 pt-2">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Users className="h-3.5 w-3.5" />
              <span className="text-xs font-medium">Group experience with:</span>
            </div>
            <div className="flex -space-x-2">
              {companions.slice(0, 4).map((companion) => {
                const initials = `${companion.firstName?.[0] || ""}${companion.lastName?.[0] || ""}`.toUpperCase() || "U";
                return (
                  <Tooltip key={companion.id}>
                    <TooltipTrigger asChild>
                      <Avatar className="h-6 w-6 ring-2 ring-background cursor-pointer">
                        <AvatarImage src={companion.profileImageUrl || undefined} alt={companion.firstName || "Companion"} />
                        <AvatarFallback className="text-[10px] bg-primary/10">{initials}</AvatarFallback>
                      </Avatar>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{companion.firstName} {companion.lastName}</p>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
              {companions.length > 4 && (
                <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center ring-2 ring-background">
                  <span className="text-[10px] font-medium">+{companions.length - 4}</span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="pt-3 border-t space-y-3">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <ReactionBar reportId={report.id} compact />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowComments(!showComments)}
              className="text-muted-foreground gap-1.5"
              data-testid={`button-comments-${report.id}`}
            >
              <MessageCircle className="h-4 w-4" />
              <span className="text-xs">
                {commentCount > 0 ? `${commentCount} Comment${commentCount !== 1 ? "s" : ""}` : "Comments"}
              </span>
            </Button>
          </div>
          
          <Collapsible open={showComments} onOpenChange={setShowComments}>
            <CollapsibleContent>
              <CommentSection reportId={report.id} currentUser={currentUser || null} />
            </CollapsibleContent>
          </Collapsible>
        </div>
      </CardContent>
    </Card>
  );
}

export function TripReportCardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-full bg-muted animate-pulse" />
            <div className="space-y-2">
              <div className="h-4 w-28 bg-muted animate-pulse rounded" />
              <div className="h-3 w-20 bg-muted animate-pulse rounded" />
            </div>
          </div>
          <div className="flex gap-2">
            <div className="h-6 w-24 bg-muted animate-pulse rounded-full" />
            <div className="h-6 w-14 bg-muted animate-pulse rounded-full" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg bg-muted/30 p-4 space-y-2">
            <div className="h-4 w-24 bg-muted animate-pulse rounded" />
            <div className="h-16 bg-muted animate-pulse rounded" />
          </div>
          <div className="rounded-lg bg-muted/30 p-4 space-y-2">
            <div className="h-4 w-20 bg-muted animate-pulse rounded" />
            <div className="h-16 bg-muted animate-pulse rounded" />
          </div>
        </div>
        <div className="space-y-2 pt-3 border-t">
          <div className="h-4 w-24 bg-muted animate-pulse rounded" />
          <div className="h-24 bg-muted animate-pulse rounded" />
        </div>
        <div className="flex gap-2 pt-3 border-t">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-8 w-16 bg-muted animate-pulse rounded" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
