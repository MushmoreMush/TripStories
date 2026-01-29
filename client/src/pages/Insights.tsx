import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { 
  BarChart3, TrendingUp, Hash, FileText, Sparkles, 
  Heart, Sun, Cloud, Lightbulb, Calendar, Brain,
  ChevronRight, Smile, Meh, Frown, Flame, Trophy, Star, Zap,
  Download, FileDown, Stethoscope, Clock, CheckCircle2, AlertTriangle
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  ComposedChart,
  ReferenceLine,
  Area,
  Legend,
  Cell,
} from "recharts";
import type { MoodEntry, TripReport } from "@shared/schema";
import { BadgeDisplay } from "@/components/BadgeDisplay";

interface InsightsData {
  substanceFrequency: { name: string; count: number }[];
  monthlyActivity: { month: string; count: number }[];
  tagFrequency: { name: string; count: number }[];
  totalReports: number;
  uniqueSubstances: number;
}

interface PatternsData {
  settingPatterns: { setting: string; avgMood: number; count: number }[];
  substancePatterns: { substance: string; avgMood: number; count: number }[];
  timePatterns: { timeOfDay: string; avgMood: number; count: number }[];
  insights: string[];
}

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  totalCheckIns: number;
  lastCheckIn: string | null;
  checkedInToday: boolean;
}

const STREAK_MILESTONES = [
  { days: 3, icon: Zap, label: "Getting Started", color: "text-blue-500" },
  { days: 7, icon: Star, label: "One Week", color: "text-purple-500" },
  { days: 14, icon: Flame, label: "Two Weeks", color: "text-orange-500" },
  { days: 30, icon: Trophy, label: "One Month", color: "text-amber-500" },
  { days: 60, icon: Trophy, label: "Two Months", color: "text-amber-600" },
  { days: 90, icon: Trophy, label: "Quarter Year", color: "text-amber-700" },
];

interface TimingSuggestion {
  type: "optimal" | "caution" | "insight";
  title: string;
  message: string;
}

interface TimingData {
  suggestions: TimingSuggestion[];
  stats?: {
    recentAvg: string;
    overallAvg: string;
    daysSinceLastExperience: number | null;
  };
}

function TimingSuggestions() {
  const { data, isLoading } = useQuery<TimingData>({
    queryKey: ["/api/suggestions/timing"],
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.suggestions.length === 0) {
    return null;
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "optimal": return CheckCircle2;
      case "caution": return AlertTriangle;
      default: return Lightbulb;
    }
  };

  const getColors = (type: string) => {
    switch (type) {
      case "optimal": return "bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400";
      case "caution": return "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400";
      default: return "bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400";
    }
  };

  return (
    <Card className="bg-gradient-to-br from-blue-500/5 to-purple-500/5">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="h-5 w-5 text-blue-500" />
          Timing Suggestions
        </CardTitle>
        <CardDescription>
          Personalized insights based on your mood patterns
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {data.suggestions.map((suggestion, idx) => {
          const Icon = getIcon(suggestion.type);
          const colors = getColors(suggestion.type);
          
          return (
            <div
              key={idx}
              className={`p-3 rounded-lg border ${colors}`}
              data-testid={`suggestion-${suggestion.type}-${idx}`}
            >
              <div className="flex items-start gap-3">
                <Icon className="h-5 w-5 shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium text-sm">{suggestion.title}</div>
                  <p className="text-xs mt-1 opacity-80">{suggestion.message}</p>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

interface CorrelationData {
  substanceMood: { substance: string; avgMoodBefore: number; avgMoodAfter: number; count: number }[];
  settingMood: { setting: string; avgMood: number; count: number }[];
  totalReports: number;
  totalMoodEntries: number;
}

function CorrelationCharts() {
  const { data, isLoading } = useQuery<CorrelationData>({
    queryKey: ["/api/correlations"],
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const hasSubstanceData = data?.substanceMood && data.substanceMood.length > 0;
  const hasSettingData = data?.settingMood && data.settingMood.length > 0;

  if (!hasSubstanceData && !hasSettingData) {
    return (
      <Card className="bg-gradient-to-br from-purple-500/5 to-blue-500/5">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-purple-500" />
            How things tend to affect your mood
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">Log mood entries before and after your experiences to see patterns.</p>
            <p className="text-xs mt-2">We look at your mood within 3 days before and 7 days after each experience.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Substance vs Mood Before/After */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            How substances affect your mood
          </CardTitle>
          <CardDescription>
            Your average mood before and after each type of experience
          </CardDescription>
        </CardHeader>
        <CardContent>
          {hasSubstanceData ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data.substanceMood} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={true} vertical={false} />
                <XAxis type="number" domain={[0, 5]} tick={{ fontSize: 12 }} className="text-xs fill-muted-foreground" />
                <YAxis type="category" dataKey="substance" width={80} tick={{ fontSize: 11 }} className="text-xs fill-muted-foreground" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)",
                  }}
                  formatter={(value: number) => [value.toFixed(1), ""]}
                />
                <Legend wrapperStyle={{ fontSize: "12px" }} />
                <Bar dataKey="avgMoodBefore" name="Before" fill="hsl(var(--muted-foreground))" radius={[0, 4, 4, 0]} />
                <Bar dataKey="avgMoodAfter" name="After" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[280px] flex items-center justify-center text-muted-foreground text-sm">
              Not enough data yet
            </div>
          )}
        </CardContent>
      </Card>

      {/* Setting vs Mood Outcome */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-amber-500" />
            How settings affect your mood
          </CardTitle>
          <CardDescription>
            Average mood in the week following experiences by setting
          </CardDescription>
        </CardHeader>
        <CardContent>
          {hasSettingData ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data.settingMood}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="setting" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={60} className="text-xs fill-muted-foreground" />
                <YAxis domain={[0, 5]} tick={{ fontSize: 12 }} className="text-xs fill-muted-foreground" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)",
                  }}
                  formatter={(value: number, name: string) => [value.toFixed(1), name === "avgMood" ? "Avg Mood" : name]}
                />
                <Bar dataKey="avgMood" name="Avg Mood" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]}>
                  {data.settingMood.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.avgMood >= 4 ? "hsl(142 76% 36%)" : entry.avgMood >= 3 ? "hsl(var(--primary))" : "hsl(var(--accent))"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[280px] flex items-center justify-center text-muted-foreground text-sm">
              Not enough data yet
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  isLoading,
  gradient,
}: {
  title: string;
  value: number | string;
  icon: typeof FileText;
  isLoading: boolean;
  gradient?: string;
}) {
  return (
    <Card className="overflow-visible">
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={`h-8 w-8 rounded-lg ${gradient || 'bg-primary/10'} flex items-center justify-center`}>
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-9 w-16" />
        ) : (
          <div className="text-3xl font-bold tracking-tight" data-testid={`stat-${title.toLowerCase().replace(/\s+/g, '-')}`}>
            {value}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StreakDisplay({ streak }: { streak: StreakData | undefined }) {
  if (!streak) {
    return (
      <Card className="bg-gradient-to-br from-orange-500/10 to-amber-500/10 border-orange-500/20">
        <CardContent className="p-6">
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  const currentMilestone = STREAK_MILESTONES.filter(m => streak.currentStreak >= m.days).pop();
  const nextMilestone = STREAK_MILESTONES.find(m => streak.currentStreak < m.days);
  const progress = nextMilestone 
    ? (streak.currentStreak / nextMilestone.days) * 100 
    : 100;

  return (
    <Card className="bg-gradient-to-br from-orange-500/10 to-amber-500/10 border-orange-500/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Flame className="h-5 w-5 text-orange-500" />
          Mood Check-in Streak
        </CardTitle>
        <CardDescription>
          Keep tracking to build healthy habits
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className={`h-16 w-16 rounded-full flex items-center justify-center text-2xl font-bold ${
                streak.currentStreak > 0 
                  ? "bg-gradient-to-br from-orange-500 to-amber-500 text-white" 
                  : "bg-muted text-muted-foreground"
              }`}>
                {streak.currentStreak}
              </div>
              {streak.checkedInToday && (
                <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-green-500 flex items-center justify-center">
                  <Star className="h-3 w-3 text-white" />
                </div>
              )}
            </div>
            <div>
              <div className="text-sm font-medium">
                {streak.currentStreak === 0 
                  ? "Start your streak today!" 
                  : streak.currentStreak === 1 
                    ? "1 day streak" 
                    : `${streak.currentStreak} day streak`}
              </div>
              <div className="text-xs text-muted-foreground">
                {streak.checkedInToday 
                  ? "Checked in today" 
                  : "Check in to keep your streak"}
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className="text-2xl font-bold text-muted-foreground">{streak.longestStreak}</div>
            <div className="text-xs text-muted-foreground">Longest streak</div>
          </div>
        </div>

        {nextMilestone && streak.currentStreak > 0 && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Next: {nextMilestone.label}</span>
              <span className="font-medium">{streak.currentStreak}/{nextMilestone.days} days</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div 
                className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-500 transition-all"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
          </div>
        )}

        {currentMilestone && (
          <div className="flex items-center gap-2 pt-2">
            <Badge variant="secondary" className="gap-1">
              <currentMilestone.icon className={`h-3 w-3 ${currentMilestone.color}`} />
              {currentMilestone.label}
            </Badge>
            <span className="text-xs text-muted-foreground">Achieved!</span>
          </div>
        )}

        <div className="flex items-center gap-4 pt-2 text-xs text-muted-foreground border-t">
          <div className="flex items-center gap-1">
            <Heart className="h-3 w-3" />
            {streak.totalCheckIns} total check-ins
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function MoodCheckIn() {
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  const { toast } = useToast();

  const createMoodMutation = useMutation({
    mutationFn: async (data: { level: number; notes?: string }) => {
      return apiRequest("POST", "/api/mood", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mood"] });
      queryClient.invalidateQueries({ queryKey: ["/api/patterns"] });
      queryClient.invalidateQueries({ queryKey: ["/api/streak"] });
      setSelectedMood(null);
      setNotes("");
      toast({
        title: "Mood logged",
        description: "Your mood has been recorded.",
      });
    },
  });

  const moodOptions = [
    { level: 1, icon: Frown, label: "Very Low", color: "text-red-500" },
    { level: 2, icon: Frown, label: "Low", color: "text-orange-500" },
    { level: 3, icon: Meh, label: "Neutral", color: "text-yellow-500" },
    { level: 4, icon: Smile, label: "Good", color: "text-lime-500" },
    { level: 5, icon: Smile, label: "Great", color: "text-green-500" },
  ];

  return (
    <Card className="bg-gradient-to-br from-primary/5 to-accent/5">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Heart className="h-5 w-5 text-accent" />
          How are you feeling?
        </CardTitle>
        <CardDescription>
          Track your mood to see how experiences affect your wellbeing
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between gap-2">
          {moodOptions.map((option) => (
            <button
              key={option.level}
              type="button"
              className={`
                flex-1 flex flex-col items-center justify-center gap-1 py-3 rounded-md border transition-colors
                hover-elevate active-elevate-2
                ${selectedMood === option.level 
                  ? "bg-primary text-primary-foreground border-primary" 
                  : `bg-background border-input ${option.color}`
                }
              `}
              onClick={() => setSelectedMood(option.level)}
              data-testid={`button-mood-${option.level}`}
            >
              <option.icon className="h-5 w-5" />
              <span className="text-xs">{option.level}</span>
            </button>
          ))}
        </div>
        
        {selectedMood && (
          <div className="space-y-3">
            <Textarea
              placeholder="Any notes about how you're feeling? (optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="resize-none"
              data-testid="input-mood-notes"
            />
            <Button
              onClick={() => createMoodMutation.mutate({ level: selectedMood, notes: notes || undefined })}
              disabled={createMoodMutation.isPending}
              className="w-full"
              data-testid="button-submit-mood"
            >
              {createMoodMutation.isPending ? "Saving..." : "Log Mood"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MoodTrendsChart({ moodData, tripDates }: { moodData: MoodEntry[]; tripDates: Date[] }) {
  if (moodData.length === 0) {
    return (
      <div className="h-[250px] flex items-center justify-center text-muted-foreground">
        <div className="text-center space-y-2">
          <Heart className="h-8 w-8 mx-auto opacity-50" />
          <p>Log your mood to see trends over time</p>
        </div>
      </div>
    );
  }

  // Group mood entries by date and calculate daily average
  const dailyMoods = new Map<string, { total: number; count: number }>();
  
  moodData.forEach((entry) => {
    if (entry.createdAt) {
      const dateKey = new Date(entry.createdAt).toISOString().split("T")[0];
      const existing = dailyMoods.get(dateKey) || { total: 0, count: 0 };
      existing.total += entry.level;
      existing.count += 1;
      dailyMoods.set(dateKey, existing);
    }
  });

  // Create chart data for last 30 days
  const chartData: { date: string; displayDate: string; mood: number | null; hasTrip: boolean }[] = [];
  const today = new Date();
  
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateKey = date.toISOString().split("T")[0];
    const moodInfo = dailyMoods.get(dateKey);
    
    const hasTrip = tripDates.some((tripDate) => {
      const tripKey = new Date(tripDate).toISOString().split("T")[0];
      return tripKey === dateKey;
    });

    chartData.push({
      date: dateKey,
      displayDate: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      mood: moodInfo ? Math.round((moodInfo.total / moodInfo.count) * 10) / 10 : null,
      hasTrip,
    });
  }

  return (
    <ResponsiveContainer width="100%" height={250}>
      <ComposedChart data={chartData}>
        <defs>
          <linearGradient id="moodGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis 
          dataKey="displayDate" 
          className="text-xs fill-muted-foreground"
          tick={{ fontSize: 10 }}
          interval={4}
        />
        <YAxis 
          domain={[1, 5]} 
          ticks={[1, 2, 3, 4, 5]}
          className="text-xs fill-muted-foreground"
          tick={{ fontSize: 12 }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "var(--radius)",
          }}
          labelStyle={{ color: "hsl(var(--foreground))" }}
          formatter={(value) => typeof value === "number" ? [value.toFixed(1), "Mood"] : ["No data", "Mood"]}
        />
        <Area
          type="monotone"
          dataKey="mood"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          fill="url(#moodGradient)"
          connectNulls
        />
        {chartData.filter(d => d.hasTrip).map((d, i) => (
          <ReferenceLine
            key={i}
            x={d.displayDate}
            stroke="hsl(var(--accent))"
            strokeDasharray="3 3"
            strokeWidth={2}
          />
        ))}
      </ComposedChart>
    </ResponsiveContainer>
  );
}

function PatternInsights({ patterns }: { patterns: PatternsData | undefined }) {
  if (!patterns || patterns.insights.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Brain className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>Log more moods and trips to discover patterns</p>
      </div>
    );
  }

  const insightIcons = [Lightbulb, Sun, Cloud, Brain, Heart];

  return (
    <div className="space-y-3">
      {patterns.insights.map((insight, index) => (
        <div
          key={index}
          className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
          data-testid={`insight-card-${index}`}
        >
          {(() => {
            const IconComponent = insightIcons[index % insightIcons.length];
            return <IconComponent className="h-5 w-5 text-primary mt-0.5 shrink-0" />;
          })()}
          <p className="text-sm">{insight}</p>
        </div>
      ))}
      
      {patterns.settingPatterns.length > 0 && (
        <div className="pt-4">
          <h4 className="text-sm font-medium mb-2">Setting Insights</h4>
          <div className="flex flex-wrap gap-2">
            {patterns.settingPatterns.slice(0, 5).map((p) => (
              <Badge key={p.setting} variant="secondary" className="capitalize">
                {p.setting}: {p.avgMood}/5
              </Badge>
            ))}
          </div>
        </div>
      )}

      {patterns.substancePatterns.length > 0 && (
        <div className="pt-2">
          <h4 className="text-sm font-medium mb-2">Substance Insights</h4>
          <div className="flex flex-wrap gap-2">
            {patterns.substancePatterns.slice(0, 5).map((p) => (
              <Badge key={p.substance} variant="outline">
                {p.substance}: {p.avgMood}/5
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function IntegrationPrompts({ reports }: { reports: TripReport[] }) {
  const [expandedReport, setExpandedReport] = useState<number | null>(null);
  const { toast } = useToast();

  const saveIntegrationMutation = useMutation({
    mutationFn: async (data: { reportId: number; insightsCarriedForward?: string; dailyLifeImpact?: string; lessonsLearned?: string }) => {
      return apiRequest("POST", "/api/integration", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/integration/pending"] });
      setExpandedReport(null);
      toast({
        title: "Integration saved",
        description: "Your reflections have been recorded.",
      });
    },
  });

  if (reports.length === 0) {
    return null;
  }

  return (
    <Card className="border-accent/30 bg-gradient-to-br from-accent/5 to-transparent">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Brain className="h-5 w-5 text-accent" />
          Integration Prompts
        </CardTitle>
        <CardDescription>
          Reflect on recent experiences to deepen your insights
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {reports.slice(0, 3).map((report) => (
          <div key={report.id} className="border rounded-lg overflow-hidden">
            <button
              className="w-full p-3 flex items-center justify-between hover-elevate text-left"
              onClick={() => setExpandedReport(expandedReport === report.id ? null : report.id)}
              data-testid={`button-integration-${report.id}`}
            >
              <div>
                <div className="font-medium">{report.substance}</div>
                <div className="text-sm text-muted-foreground">
                  {report.createdAt ? new Date(report.createdAt).toLocaleDateString() : "Unknown date"}
                </div>
              </div>
              <ChevronRight className={`h-5 w-5 transition-transform ${expandedReport === report.id ? "rotate-90" : ""}`} />
            </button>
            
            {expandedReport === report.id && (
              <div className="p-3 pt-0 border-t space-y-3">
                <div>
                  <label className="text-sm font-medium">What insights have you carried forward?</label>
                  <Textarea
                    placeholder="Describe any lasting realizations or perspectives..."
                    className="mt-1 resize-none"
                    id={`insights-${report.id}`}
                    data-testid={`input-insights-${report.id}`}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">How has this affected your daily life?</label>
                  <Textarea
                    placeholder="Any changes in behavior, relationships, or outlook..."
                    className="mt-1 resize-none"
                    id={`impact-${report.id}`}
                    data-testid={`input-impact-${report.id}`}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Key lessons learned</label>
                  <Textarea
                    placeholder="What would you tell yourself before this experience..."
                    className="mt-1 resize-none"
                    id={`lessons-${report.id}`}
                    data-testid={`input-lessons-${report.id}`}
                  />
                </div>
                <Button
                  onClick={() => {
                    const insights = (document.getElementById(`insights-${report.id}`) as HTMLTextAreaElement)?.value;
                    const impact = (document.getElementById(`impact-${report.id}`) as HTMLTextAreaElement)?.value;
                    const lessons = (document.getElementById(`lessons-${report.id}`) as HTMLTextAreaElement)?.value;
                    saveIntegrationMutation.mutate({
                      reportId: report.id,
                      insightsCarriedForward: insights || undefined,
                      dailyLifeImpact: impact || undefined,
                      lessonsLearned: lessons || undefined,
                    });
                  }}
                  disabled={saveIntegrationMutation.isPending}
                  data-testid={`button-save-integration-${report.id}`}
                >
                  {saveIntegrationMutation.isPending ? "Saving..." : "Save Reflections"}
                </Button>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function ChartSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-[200px] w-full" />
    </div>
  );
}

export default function Insights() {
  const { data: insights, isLoading } = useQuery<InsightsData>({
    queryKey: ["/api/insights"],
  });

  const { data: moodData } = useQuery<MoodEntry[]>({
    queryKey: ["/api/mood"],
  });

  const { data: patterns } = useQuery<PatternsData>({
    queryKey: ["/api/patterns"],
  });

  const { data: pendingIntegrations } = useQuery<TripReport[]>({
    queryKey: ["/api/integration/pending"],
  });

  const { data: reports } = useQuery<any[]>({
    queryKey: ["/api/reports"],
  });

  const { data: streakData } = useQuery<StreakData>({
    queryKey: ["/api/streak"],
  });

  const formatMonth = (month: string) => {
    const [year, m] = month.split("-");
    const date = new Date(parseInt(year), parseInt(m) - 1);
    return date.toLocaleDateString("en-US", { month: "short" });
  };

  const formattedMonthlyData = insights?.monthlyActivity?.map((item) => ({
    ...item,
    displayMonth: formatMonth(item.month),
  })) ?? [];

  // Extract trip dates for the mood chart
  const tripDates = (reports || [])
    .filter((r: any) => r.createdAt)
    .map((r: any) => new Date(r.createdAt));

  // Calculate average mood
  const avgMood = moodData && moodData.length > 0
    ? (moodData.reduce((sum, m) => sum + m.level, 0) / moodData.length).toFixed(1)
    : "—";

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-8 space-y-8">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-gradient-to-br from-amber-500/20 to-amber-500/5">
            <Sparkles className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight" data-testid="heading-insights">
            Patterns & Learnings
          </h1>
        </div>
        <p className="text-muted-foreground pl-10">
          Discover what works for you and carry insights forward
        </p>
      </div>

      {/* Streak Display */}
      <StreakDisplay streak={streakData} />

      {/* Badges */}
      <BadgeDisplay />

      {/* Mood Check-in and Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <MoodCheckIn />
        
        <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard
            title="Total Reports"
            value={insights?.totalReports ?? 0}
            icon={FileText}
            isLoading={isLoading}
            gradient="bg-gradient-to-br from-primary/20 to-primary/5"
          />
          <StatCard
            title="Avg Mood"
            value={avgMood}
            icon={Heart}
            isLoading={!moodData}
            gradient="bg-gradient-to-br from-accent/20 to-accent/5"
          />
          <StatCard
            title="Substances"
            value={insights?.uniqueSubstances ?? 0}
            icon={BarChart3}
            isLoading={isLoading}
            gradient="bg-gradient-to-br from-purple-500/20 to-purple-500/5"
          />
          <StatCard
            title="Mood Logs"
            value={moodData?.length ?? 0}
            icon={TrendingUp}
            isLoading={!moodData}
            gradient="bg-gradient-to-br from-emerald-500/20 to-emerald-500/5"
          />
        </div>
      </div>

      {/* Integration Prompts */}
      {pendingIntegrations && pendingIntegrations.length > 0 && (
        <IntegrationPrompts reports={pendingIntegrations} />
      )}

      {/* Smart Timing Suggestions */}
      <TimingSuggestions />

      {/* How things tend to affect your mood */}
      <CorrelationCharts />

      {/* Mood Trends and Pattern Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Heart className="h-5 w-5 text-accent" />
              Mood Trends
            </CardTitle>
            <CardDescription>
              Your mood over the last 30 days (dashed lines = trip dates)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MoodTrendsChart moodData={moodData || []} tripDates={tripDates} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-primary" />
              Pattern Insights
            </CardTitle>
            <CardDescription>
              Personalized insights based on your data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PatternInsights patterns={patterns} />
          </CardContent>
        </Card>
      </div>

      {/* Activity and Substance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Activity Over Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <ChartSkeleton />
            ) : formattedMonthlyData && formattedMonthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={formattedMonthlyData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-muted"
                  />
                  <XAxis
                    dataKey="displayMonth"
                    className="text-xs fill-muted-foreground"
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis
                    className="text-xs fill-muted-foreground"
                    tick={{ fontSize: 12 }}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)",
                    }}
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    name="Reports"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--primary))", strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                No activity data yet
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Substance Frequency
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <ChartSkeleton />
            ) : insights?.substanceFrequency &&
              insights.substanceFrequency.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart
                  data={insights.substanceFrequency}
                  layout="vertical"
                  margin={{ left: 20 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-muted"
                    horizontal={true}
                    vertical={false}
                  />
                  <XAxis
                    type="number"
                    className="text-xs fill-muted-foreground"
                    tick={{ fontSize: 12 }}
                    allowDecimals={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    className="text-xs fill-muted-foreground"
                    tick={{ fontSize: 12 }}
                    width={80}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)",
                    }}
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                  />
                  <Bar
                    dataKey="count"
                    name="Count"
                    fill="hsl(var(--primary))"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                No substance data yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tags Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Hash className="h-5 w-5" />
            Common Tags
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <ChartSkeleton />
          ) : insights?.tagFrequency && insights.tagFrequency.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={insights.tagFrequency}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-muted"
                />
                <XAxis
                  dataKey="name"
                  className="text-xs fill-muted-foreground"
                  tick={{ fontSize: 11 }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis
                  className="text-xs fill-muted-foreground"
                  tick={{ fontSize: 12 }}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)",
                  }}
                  labelStyle={{ color: "hsl(var(--foreground))" }}
                />
                <Bar
                  dataKey="count"
                  name="Count"
                  fill="hsl(var(--accent))"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground">
              No tags data yet. Add tags to your reports to see patterns.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Export Options */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Your Data
          </CardTitle>
          <CardDescription>
            Download your data for personal records or to share with healthcare providers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <a
              href="/api/export"
              download
              className="flex items-center gap-3 p-4 rounded-lg border bg-card hover-elevate cursor-pointer transition-colors"
              data-testid="button-export-json"
            >
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileDown className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="font-medium text-sm">Personal Export (JSON)</div>
                <div className="text-xs text-muted-foreground">Full data backup for your records</div>
              </div>
            </a>

            <a
              href="/api/export/therapist"
              download
              className="flex items-center gap-3 p-4 rounded-lg border bg-card hover-elevate cursor-pointer transition-colors"
              data-testid="button-export-therapist"
            >
              <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <Stethoscope className="h-5 w-5 text-accent" />
              </div>
              <div>
                <div className="font-medium text-sm">Therapist Report</div>
                <div className="text-xs text-muted-foreground">Professional summary for healthcare providers</div>
              </div>
            </a>
          </div>
          <p className="text-xs text-muted-foreground">
            The therapist report includes a summary of your experiences, mood patterns, and insights formatted for clinical discussion.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
