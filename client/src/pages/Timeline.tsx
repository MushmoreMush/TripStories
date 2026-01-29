import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "wouter";
import { 
  Clock, 
  MapPin, 
  Heart,
  TrendingUp,
  Sparkles,
  ChevronRight,
  Calendar,
  MessageCircle,
  Check,
  Loader2,
  Layers,
  Pill,
  Activity
} from "lucide-react";
import { format, formatDistanceToNow, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from "date-fns";
import type { TripReport, MoodEntry, TimelineReflection } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const SUBSTANCE_COLORS: Record<string, string> = {
  psilocybin: "bg-purple-500/20 text-purple-700 dark:text-purple-300",
  lsd: "bg-blue-500/20 text-blue-700 dark:text-blue-300",
  mdma: "bg-pink-500/20 text-pink-700 dark:text-pink-300",
  ketamine: "bg-cyan-500/20 text-cyan-700 dark:text-cyan-300",
  dmt: "bg-amber-500/20 text-amber-700 dark:text-amber-300",
  cannabis: "bg-green-500/20 text-green-700 dark:text-green-300",
  ayahuasca: "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300",
  mescaline: "bg-orange-500/20 text-orange-700 dark:text-orange-300",
  salvia: "bg-lime-500/20 text-lime-700 dark:text-lime-300",
  ibogaine: "bg-indigo-500/20 text-indigo-700 dark:text-indigo-300",
};

function getSubstanceColor(substance: string): string {
  const lowerSubstance = substance.toLowerCase();
  for (const [key, value] of Object.entries(SUBSTANCE_COLORS)) {
    if (lowerSubstance.includes(key)) return value;
  }
  return "bg-gray-500/20 text-gray-700 dark:text-gray-300";
}

interface TimelineEvent {
  type: "trip" | "mood" | "milestone";
  date: Date;
  data: TripReport | MoodEntry | { milestone: string; count: number };
}

function TimelineItem({ event, isLast }: { event: TimelineEvent; isLast: boolean }) {
  if (event.type === "trip") {
    const report = event.data as TripReport;
    return (
      <div className="flex gap-4">
        <div className="flex flex-col items-center">
          <div className={`h-10 w-10 rounded-full flex items-center justify-center ${getSubstanceColor(report.substance)}`}>
            <Sparkles className="h-5 w-5" />
          </div>
          {!isLast && <div className="w-0.5 flex-1 bg-border mt-2" />}
        </div>
        <div className="flex-1 pb-8">
          <Link href={`/report/${report.id}`}>
            <Card className="hover-elevate cursor-pointer transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="secondary" className={getSubstanceColor(report.substance)}>
                        {report.substance}
                      </Badge>
                      {report.amount && (
                        <span className="text-xs text-muted-foreground">{report.amount}</span>
                      )}
                    </div>
                    <p className="text-sm line-clamp-2">
                      {report.experience?.slice(0, 150)}...
                    </p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(report.createdAt!), { addSuffix: true })}
                      </span>
                      {report.setting && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {report.setting.slice(0, 30)}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    );
  }

  if (event.type === "milestone") {
    const milestone = event.data as { milestone: string; count: number };
    return (
      <div className="flex gap-4">
        <div className="flex flex-col items-center">
          <div className="h-10 w-10 rounded-full flex items-center justify-center bg-gradient-to-br from-amber-500 to-orange-500 text-white">
            <TrendingUp className="h-5 w-5" />
          </div>
          {!isLast && <div className="w-0.5 flex-1 bg-border mt-2" />}
        </div>
        <div className="flex-1 pb-8">
          <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold">{milestone.milestone}</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {milestone.count} {milestone.count === 1 ? "experience" : "experiences"} logged
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const mood = event.data as MoodEntry;
  const moodLevel = mood.level;
  const moodColor = moodLevel >= 4 ? "bg-green-500/20 text-green-600" 
    : moodLevel >= 3 ? "bg-yellow-500/20 text-yellow-600" 
    : "bg-red-500/20 text-red-600";

  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className={`h-8 w-8 rounded-full flex items-center justify-center ${moodColor}`}>
          <Heart className="h-4 w-4" />
        </div>
        {!isLast && <div className="w-0.5 flex-1 bg-border mt-2" />}
      </div>
      <div className="flex-1 pb-6">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Mood: {moodLevel}/5</span>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(mood.createdAt!), { addSuffix: true })}
          </span>
        </div>
        {mood.notes && (
          <p className="text-sm text-muted-foreground mt-1">{mood.notes}</p>
        )}
      </div>
    </div>
  );
}

interface MonthReflectionProps {
  month: Date;
  existingReflection?: TimelineReflection;
  eventCount: number;
}

function MonthReflection({ month, existingReflection, eventCount }: MonthReflectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(existingReflection?.content || "");
  const { toast } = useToast();

  const saveMutation = useMutation({
    mutationFn: async (data: { periodType: string; periodStart: string; content: string }) => {
      await apiRequest("POST", "/api/reflections", data);
    },
    onSuccess: () => {
      toast({ title: "Reflection saved" });
      queryClient.invalidateQueries({ queryKey: ["/api/reflections"] });
      setIsEditing(false);
    },
    onError: () => {
      toast({ title: "Failed to save reflection", variant: "destructive" });
    },
  });

  const handleSave = () => {
    if (!content.trim()) return;
    saveMutation.mutate({
      periodType: "month",
      periodStart: startOfMonth(month).toISOString(),
      content: content.trim(),
    });
  };

  // Only show for months with activity
  if (eventCount === 0) return null;

  const monthLabel = format(month, "MMMM");

  if (existingReflection && !isEditing) {
    return (
      <Card className="mt-4 bg-primary/5 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <MessageCircle className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-primary mb-1">Your {monthLabel} reflection</p>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{existingReflection.content}</p>
              <Button 
                variant="ghost" 
                size="sm" 
                className="mt-2 -ml-2"
                onClick={() => {
                  setContent(existingReflection.content);
                  setIsEditing(true);
                }}
                data-testid={`button-edit-reflection-${format(month, "yyyy-MM")}`}
              >
                Edit reflection
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-4 bg-muted/30 border-dashed">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex-1">
            {isEditing ? (
              <div className="space-y-3">
                <p className="text-sm font-medium">Reflecting on {monthLabel}...</p>
                <Textarea
                  placeholder="Anything you're noticing about patterns lately? What's working well? What would you like to do differently?"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="min-h-[100px] resize-none"
                  data-testid={`textarea-reflection-${format(month, "yyyy-MM")}`}
                />
                <div className="flex items-center gap-2">
                  <Button 
                    size="sm" 
                    onClick={handleSave}
                    disabled={!content.trim() || saveMutation.isPending}
                    data-testid={`button-save-reflection-${format(month, "yyyy-MM")}`}
                  >
                    {saveMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4 mr-1" />
                    )}
                    Save
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => {
                      setIsEditing(false);
                      setContent(existingReflection?.content || "");
                    }}
                    data-testid={`button-cancel-reflection-${format(month, "yyyy-MM")}`}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Anything you're noticing about patterns in {monthLabel}?
                </p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  data-testid={`button-add-reflection-${format(month, "yyyy-MM")}`}
                >
                  Add a reflection
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface MonthSectionProps {
  month: Date;
  events: TimelineEvent[];
  reflection?: TimelineReflection;
}

function MonthSection({ month, events, reflection }: MonthSectionProps) {
  const monthLabel = format(month, "MMMM yyyy");
  
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 sticky top-0 bg-background py-2 z-10">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold">{monthLabel}</h3>
        <Badge variant="secondary" className="ml-2">{events.length}</Badge>
      </div>
      <div className="ml-4">
        {events.map((event, idx) => (
          <TimelineItem 
            key={`${event.type}-${event.date.getTime()}-${idx}`} 
            event={event} 
            isLast={idx === events.length - 1}
          />
        ))}
      </div>
      <MonthReflection 
        month={month} 
        existingReflection={reflection} 
        eventCount={events.length}
      />
    </div>
  );
}

function TimelineSkeleton() {
  return (
    <div className="space-y-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className="space-y-4">
          <Skeleton className="h-6 w-32" />
          <div className="flex gap-4 ml-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-24 flex-1 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyTimeline() {
  return (
    <Card className="bg-muted/20">
      <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
          <Sparkles className="h-8 w-8 text-muted-foreground" />
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-lg font-medium">Your Journey Begins Here</h3>
          <p className="text-muted-foreground max-w-md">
            Start documenting your experiences to see your personal timeline grow.
          </p>
        </div>
        <Link href="/new">
          <Button data-testid="button-create-first-report">Create Your First Report</Button>
        </Link>
      </CardContent>
    </Card>
  );
}

type GroupBy = "time" | "substance" | "intensity";

function SubstanceGroup({ 
  substance, 
  reports 
}: { 
  substance: string; 
  reports: TripReport[] 
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 sticky top-0 bg-background py-2 z-10">
        <Badge variant="secondary" className={getSubstanceColor(substance)}>
          <Sparkles className="h-3 w-3 mr-1" />
          {substance}
        </Badge>
        <span className="text-xs text-muted-foreground">
          {reports.length} experience{reports.length !== 1 ? "s" : ""}
        </span>
      </div>
      <div className="grid gap-3">
        {reports.map((report) => (
          <Link key={report.id} href={`/report/${report.id}`}>
            <Card className="hover-elevate cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <p className="text-sm line-clamp-2">{report.experience?.slice(0, 120)}...</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {report.amount && <span>{report.amount}</span>}
                      {report.createdAt && (
                        <span>{format(new Date(report.createdAt), "MMM d, yyyy")}</span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

function IntensityGroup({ 
  level, 
  reports 
}: { 
  level: string; 
  reports: TripReport[] 
}) {
  const intensityConfig: Record<string, { label: string; color: string; description: string }> = {
    "high": { 
      label: "High Intensity", 
      color: "bg-red-500/20 text-red-700 dark:text-red-300",
      description: "Deep, transformative experiences"
    },
    "medium": { 
      label: "Medium Intensity", 
      color: "bg-amber-500/20 text-amber-700 dark:text-amber-300",
      description: "Meaningful journeys"
    },
    "low": { 
      label: "Low Intensity", 
      color: "bg-green-500/20 text-green-700 dark:text-green-300",
      description: "Gentle explorations"
    },
  };

  const config = intensityConfig[level] || intensityConfig["medium"];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 sticky top-0 bg-background py-2 z-10">
        <Badge variant="secondary" className={config.color}>
          <Activity className="h-3 w-3 mr-1" />
          {config.label}
        </Badge>
        <span className="text-xs text-muted-foreground">
          {reports.length} experience{reports.length !== 1 ? "s" : ""}
        </span>
      </div>
      <p className="text-xs text-muted-foreground -mt-1">{config.description}</p>
      <div className="grid gap-3">
        {reports.map((report) => (
          <Link key={report.id} href={`/report/${report.id}`}>
            <Card className="hover-elevate cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className={getSubstanceColor(report.substance)}>
                        {report.substance}
                      </Badge>
                      {report.amount && (
                        <span className="text-xs text-muted-foreground">{report.amount}</span>
                      )}
                    </div>
                    <p className="text-sm line-clamp-2">{report.experience?.slice(0, 100)}...</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

function estimateIntensity(report: TripReport): "high" | "medium" | "low" {
  const experienceLength = report.experience?.length || 0;
  const hasIntegration = !!(report.whatSurprised || report.lessonsToRemember || report.dailyLifeApplication);
  
  // Check for intensity keywords
  const highIntensityKeywords = ["intense", "overwhelming", "profound", "transformative", "breakthrough", "ego death", "dissolution", "peak"];
  const lowIntensityKeywords = ["gentle", "mild", "subtle", "light", "microdose", "threshold"];
  
  const textToCheck = `${report.experience} ${report.setMindset}`.toLowerCase();
  
  const hasHighKeywords = highIntensityKeywords.some(k => textToCheck.includes(k));
  const hasLowKeywords = lowIntensityKeywords.some(k => textToCheck.includes(k));
  
  if (hasHighKeywords || (experienceLength > 1000 && hasIntegration)) return "high";
  if (hasLowKeywords || experienceLength < 200) return "low";
  return "medium";
}

export default function Timeline() {
  const [groupBy, setGroupBy] = useState<GroupBy>("time");
  
  const { data: reports, isLoading: reportsLoading } = useQuery<TripReport[]>({
    queryKey: ["/api/reports"],
  });

  const { data: moodData, isLoading: moodLoading } = useQuery<MoodEntry[]>({
    queryKey: ["/api/mood"],
  });

  const { data: reflections } = useQuery<TimelineReflection[]>({
    queryKey: ["/api/reflections"],
  });

  const isLoading = reportsLoading || moodLoading;

  // Build timeline events
  const events: TimelineEvent[] = [];

  // Add trip reports
  (reports || []).forEach((report) => {
    if (report.createdAt) {
      events.push({
        type: "trip",
        date: new Date(report.createdAt),
        data: report,
      });
    }
  });

  // Add mood entries (limit to last 30 days for performance)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  (moodData || []).forEach((mood) => {
    if (mood.createdAt && new Date(mood.createdAt) >= thirtyDaysAgo) {
      events.push({
        type: "mood",
        date: new Date(mood.createdAt),
        data: mood,
      });
    }
  });

  // Add milestones for report counts
  const reportCounts = [1, 5, 10, 25, 50, 100];
  const sortedReports = [...(reports || [])].sort(
    (a, b) => new Date(a.createdAt!).getTime() - new Date(b.createdAt!).getTime()
  );
  
  reportCounts.forEach((count) => {
    if (sortedReports.length >= count) {
      const report = sortedReports[count - 1];
      events.push({
        type: "milestone",
        date: new Date(report.createdAt!),
        data: { 
          milestone: count === 1 ? "First Experience Documented" 
            : count === 5 ? "5 Experiences Milestone"
            : count === 10 ? "10 Experiences Milestone"
            : count === 25 ? "25 Experiences - Quarter Century"
            : count === 50 ? "50 Experiences - Half Century"
            : "100 Experiences - Century Club",
          count 
        },
      });
    }
  });

  // Sort events by date descending
  events.sort((a, b) => b.date.getTime() - a.date.getTime());

  // Group by month
  const eventsByMonth = new Map<string, TimelineEvent[]>();
  
  if (events.length > 0) {
    const months = eachMonthOfInterval({
      start: subMonths(new Date(), 12),
      end: new Date(),
    }).reverse();

    months.forEach((month) => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      const monthEvents = events.filter(
        (e) => e.date >= monthStart && e.date <= monthEnd
      );
      if (monthEvents.length > 0) {
        eventsByMonth.set(format(month, "yyyy-MM"), monthEvents);
      }
    });
  }

  // Map reflections by month key
  const reflectionsByMonth = new Map<string, TimelineReflection>();
  (reflections || []).forEach((r) => {
    if (r.periodStart) {
      const key = format(new Date(r.periodStart), "yyyy-MM");
      reflectionsByMonth.set(key, r);
    }
  });

  // Group by substance
  const reportsBySubstance = new Map<string, TripReport[]>();
  (reports || []).forEach((report) => {
    const substance = report.substance || "Unknown";
    if (!reportsBySubstance.has(substance)) {
      reportsBySubstance.set(substance, []);
    }
    reportsBySubstance.get(substance)!.push(report);
  });

  // Group by intensity
  const reportsByIntensity = new Map<string, TripReport[]>();
  ["high", "medium", "low"].forEach(level => reportsByIntensity.set(level, []));
  (reports || []).forEach((report) => {
    const intensity = estimateIntensity(report);
    reportsByIntensity.get(intensity)!.push(report);
  });

  return (
    <div className="max-w-3xl mx-auto p-6 md:p-8 space-y-8">
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5">
                <Clock className="h-4 w-4 text-primary" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight" data-testid="heading-timeline">
                Your Journey
              </h1>
            </div>
            <p className="text-muted-foreground pl-10">
              A chronological view of your experiences and growth
            </p>
          </div>
          
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            <Button
              variant={groupBy === "time" ? "default" : "ghost"}
              size="sm"
              onClick={() => setGroupBy("time")}
              data-testid="button-group-time"
            >
              <Calendar className="h-4 w-4 mr-1" />
              Time
            </Button>
            <Button
              variant={groupBy === "substance" ? "default" : "ghost"}
              size="sm"
              onClick={() => setGroupBy("substance")}
              data-testid="button-group-substance"
            >
              <Pill className="h-4 w-4 mr-1" />
              Substance
            </Button>
            <Button
              variant={groupBy === "intensity" ? "default" : "ghost"}
              size="sm"
              onClick={() => setGroupBy("intensity")}
              data-testid="button-group-intensity"
            >
              <Activity className="h-4 w-4 mr-1" />
              Intensity
            </Button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <TimelineSkeleton />
      ) : events.length === 0 ? (
        <EmptyTimeline />
      ) : groupBy === "time" ? (
        <div className="space-y-8">
          {Array.from(eventsByMonth.entries()).map(([monthKey, monthEvents]) => (
            <MonthSection 
              key={monthKey} 
              month={new Date(monthKey + "-01")} 
              events={monthEvents}
              reflection={reflectionsByMonth.get(monthKey)}
            />
          ))}
        </div>
      ) : groupBy === "substance" ? (
        <div className="space-y-8">
          {Array.from(reportsBySubstance.entries())
            .sort((a, b) => b[1].length - a[1].length)
            .map(([substance, substanceReports]) => (
              <SubstanceGroup 
                key={substance} 
                substance={substance} 
                reports={substanceReports}
              />
            ))}
        </div>
      ) : (
        <div className="space-y-8">
          {["high", "medium", "low"].map((level) => {
            const levelReports = reportsByIntensity.get(level) || [];
            if (levelReports.length === 0) return null;
            return (
              <IntensityGroup 
                key={level} 
                level={level} 
                reports={levelReports}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
