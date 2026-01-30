import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Minus,
  Sparkles,
  MapPin,
  Brain,
  Calendar,
  Scale,
  TrendingUp,
  TrendingDown
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import type { TripReport, MoodEntry } from "@shared/schema";

const SUBSTANCE_COLORS: Record<string, string> = {
  psilocybin: "bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-500/30",
  lsd: "bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30",
  mdma: "bg-pink-500/20 text-pink-700 dark:text-pink-300 border-pink-500/30",
  ketamine: "bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border-cyan-500/30",
  dmt: "bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30",
  cannabis: "bg-green-500/20 text-green-700 dark:text-green-300 border-green-500/30",
  ayahuasca: "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
};

function getSubstanceColor(substance: string): string {
  const lowerSubstance = substance.toLowerCase();
  for (const [key, value] of Object.entries(SUBSTANCE_COLORS)) {
    if (lowerSubstance.includes(key)) return value;
  }
  return "bg-gray-500/20 text-gray-700 dark:text-gray-300 border-gray-500/30";
}

interface MoodDelta {
  before: number | null;
  after: number | null;
  delta: number | null;
}

function calculateMoodDelta(reportDate: Date, moodEntries: MoodEntry[]): MoodDelta {
  const reportTime = reportDate.getTime();
  
  const threeDaysBefore = new Date(reportTime - 3 * 24 * 60 * 60 * 1000);
  const threeDaysAfter = new Date(reportTime + 3 * 24 * 60 * 60 * 1000);
  
  const beforeMoods = moodEntries.filter(m => {
    const moodTime = new Date(m.createdAt!).getTime();
    return moodTime >= threeDaysBefore.getTime() && moodTime < reportTime;
  });
  
  const afterMoods = moodEntries.filter(m => {
    const moodTime = new Date(m.createdAt!).getTime();
    return moodTime > reportTime && moodTime <= threeDaysAfter.getTime();
  });
  
  const beforeAvg = beforeMoods.length > 0 
    ? beforeMoods.reduce((sum, m) => sum + m.level, 0) / beforeMoods.length 
    : null;
  const afterAvg = afterMoods.length > 0 
    ? afterMoods.reduce((sum, m) => sum + m.level, 0) / afterMoods.length 
    : null;
  
  return {
    before: beforeAvg ? Math.round(beforeAvg * 10) / 10 : null,
    after: afterAvg ? Math.round(afterAvg * 10) / 10 : null,
    delta: beforeAvg && afterAvg ? Math.round((afterAvg - beforeAvg) * 10) / 10 : null,
  };
}

function MoodDeltaDisplay({ delta }: { delta: MoodDelta }) {
  if (delta.before === null && delta.after === null) {
    return (
      <div className="text-center p-4 bg-muted/30 rounded-lg">
        <p className="text-sm text-muted-foreground">No mood data around this experience</p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-4 p-4 bg-muted/30 rounded-lg" data-testid="mood-delta-display">
      <div className="text-center">
        <p className="text-xs text-muted-foreground mb-1">3 days before</p>
        <p className="text-lg font-semibold" data-testid="text-mood-before">
          {delta.before !== null ? `${delta.before}/5` : "—"}
        </p>
      </div>
      
      <ArrowRight className="h-4 w-4 text-muted-foreground" />
      
      <div className="text-center">
        <p className="text-xs text-muted-foreground mb-1">3 days after</p>
        <p className="text-lg font-semibold" data-testid="text-mood-after">
          {delta.after !== null ? `${delta.after}/5` : "—"}
        </p>
      </div>
      
      {delta.delta !== null && (
        <div className={`flex items-center gap-1 px-3 py-1 rounded-full ${
          delta.delta > 0 
            ? "bg-green-500/20 text-green-700 dark:text-green-300" 
            : delta.delta < 0 
            ? "bg-red-500/20 text-red-700 dark:text-red-300"
            : "bg-gray-500/20 text-gray-600"
        }`} data-testid="badge-mood-delta">
          {delta.delta > 0 ? (
            <ArrowUp className="h-4 w-4" />
          ) : delta.delta < 0 ? (
            <ArrowDown className="h-4 w-4" />
          ) : (
            <Minus className="h-4 w-4" />
          )}
          <span className="font-medium">{delta.delta > 0 ? "+" : ""}{delta.delta}</span>
        </div>
      )}
    </div>
  );
}

interface ReportCardProps {
  report: TripReport;
  moodDelta: MoodDelta;
  label: string;
}

function ReportCard({ report, moodDelta, label }: ReportCardProps) {
  return (
    <Card className={`flex-1 ${getSubstanceColor(report.substance)}`} data-testid={`card-report-${label.toLowerCase()}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <Badge variant="outline" className="font-normal" data-testid={`badge-label-${label.toLowerCase()}`}>
            {label}
          </Badge>
          <span className="text-xs text-muted-foreground" data-testid={`text-date-${report.id}`}>
            {format(new Date(report.createdAt!), "MMM d, yyyy")}
          </span>
        </div>
        <CardTitle className="text-lg flex items-center gap-2" data-testid={`text-substance-${report.id}`}>
          <Sparkles className="h-5 w-5" />
          {report.substance}
        </CardTitle>
        {report.amount && (
          <CardDescription>{report.amount}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {report.setting && (
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">Setting</p>
                <p className="text-sm">{report.setting}</p>
              </div>
            </div>
          )}
          
          {report.setMindset && (
            <div className="flex items-start gap-2">
              <Brain className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">Mindset</p>
                <p className="text-sm line-clamp-3">{report.setMindset}</p>
              </div>
            </div>
          )}
        </div>

        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            Mood Impact
          </p>
          <MoodDeltaDisplay delta={moodDelta} />
        </div>

        {report.experience && (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground mb-1">Experience</p>
            <p className="text-sm line-clamp-4">{report.experience}</p>
          </div>
        )}

        {report.lessonsToRemember && (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground mb-1">Lessons to remember</p>
            <p className="text-sm line-clamp-3 italic">{report.lessonsToRemember}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ComparisonInsights({ report1, report2, delta1, delta2 }: { 
  report1: TripReport; 
  report2: TripReport;
  delta1: MoodDelta;
  delta2: MoodDelta;
}) {
  const insights: string[] = [];

  if (delta1.delta !== null && delta2.delta !== null) {
    if (delta1.delta > delta2.delta) {
      insights.push(`The first experience had a more positive mood impact (+${delta1.delta} vs ${delta2.delta > 0 ? "+" : ""}${delta2.delta})`);
    } else if (delta2.delta > delta1.delta) {
      insights.push(`The second experience had a more positive mood impact (+${delta2.delta} vs ${delta1.delta > 0 ? "+" : ""}${delta1.delta})`);
    } else {
      insights.push("Both experiences had similar mood impacts");
    }
  }

  if (report1.substance.toLowerCase() !== report2.substance.toLowerCase()) {
    insights.push(`Comparing different substances: ${report1.substance} vs ${report2.substance}`);
  } else {
    insights.push(`Both experiences involved ${report1.substance}`);
    if (report1.amount !== report2.amount) {
      insights.push(`Different amounts: ${report1.amount || "not specified"} vs ${report2.amount || "not specified"}`);
    }
  }

  const daysBetween = Math.abs(differenceInDays(
    new Date(report1.createdAt!), 
    new Date(report2.createdAt!)
  ));
  if (daysBetween > 0) {
    insights.push(`${daysBetween} day${daysBetween === 1 ? "" : "s"} between these experiences`);
  }

  if (insights.length === 0) return null;

  return (
    <Card className="bg-primary/5 border-primary/20" data-testid="card-comparison-insights">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Scale className="h-4 w-4" />
          Comparison Insights
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2" data-testid="list-insights">
          {insights.map((insight, idx) => (
            <li key={idx} className="flex items-start gap-2 text-sm" data-testid={`text-insight-${idx}`}>
              <span className="text-primary">•</span>
              <span>{insight}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

export default function Compare() {
  const [report1Id, setReport1Id] = useState<string>("");
  const [report2Id, setReport2Id] = useState<string>("");

  const { data: reports, isLoading: reportsLoading } = useQuery<TripReport[]>({
    queryKey: ["/api/reports"],
  });

  const { data: moodEntries } = useQuery<MoodEntry[]>({
    queryKey: ["/api/mood"],
  });

  const sortedReports = useMemo(() => {
    return [...(reports || [])].sort(
      (a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
    );
  }, [reports]);

  const report1 = sortedReports.find(r => r.id.toString() === report1Id);
  const report2 = sortedReports.find(r => r.id.toString() === report2Id);

  const delta1 = report1 && moodEntries 
    ? calculateMoodDelta(new Date(report1.createdAt!), moodEntries) 
    : { before: null, after: null, delta: null };
  const delta2 = report2 && moodEntries 
    ? calculateMoodDelta(new Date(report2.createdAt!), moodEntries) 
    : { before: null, after: null, delta: null };

  if (reportsLoading) {
    return (
      <div className="max-w-6xl mx-auto p-6 md:p-8 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid md:grid-cols-2 gap-6">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (!reports || reports.length < 2) {
    return (
      <div className="max-w-3xl mx-auto p-6 md:p-8">
        <Card className="bg-muted/20">
          <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
              <Scale className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-lg font-medium">Not Enough Experiences Yet</h3>
              <p className="text-muted-foreground max-w-md">
                You need at least two documented experiences to compare them. Keep journaling to unlock this feature.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-8 space-y-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5">
            <Scale className="h-4 w-4 text-primary" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight" data-testid="heading-compare">
            Compare Journeys
          </h1>
        </div>
        <p className="text-muted-foreground pl-10">
          See how different experiences affected you
        </p>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="flex-1 w-full">
              <label className="text-sm text-muted-foreground mb-2 block">First experience</label>
              <Select value={report1Id} onValueChange={setReport1Id}>
                <SelectTrigger data-testid="select-report-1">
                  <SelectValue placeholder="Select an experience..." />
                </SelectTrigger>
                <SelectContent>
                  {sortedReports.map((report) => (
                    <SelectItem 
                      key={report.id} 
                      value={report.id.toString()}
                      disabled={report.id.toString() === report2Id}
                    >
                      <span className="flex items-center gap-2">
                        <span>{report.substance}</span>
                        <span className="text-muted-foreground text-xs">
                          {format(new Date(report.createdAt!), "MMM d, yyyy")}
                        </span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="hidden md:flex items-center justify-center">
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>

            <div className="flex-1 w-full">
              <label className="text-sm text-muted-foreground mb-2 block">Second experience</label>
              <Select value={report2Id} onValueChange={setReport2Id}>
                <SelectTrigger data-testid="select-report-2">
                  <SelectValue placeholder="Select an experience..." />
                </SelectTrigger>
                <SelectContent>
                  {sortedReports.map((report) => (
                    <SelectItem 
                      key={report.id} 
                      value={report.id.toString()}
                      disabled={report.id.toString() === report1Id}
                    >
                      <span className="flex items-center gap-2">
                        <span>{report.substance}</span>
                        <span className="text-muted-foreground text-xs">
                          {format(new Date(report.createdAt!), "MMM d, yyyy")}
                        </span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {report1 && report2 ? (
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <ReportCard report={report1} moodDelta={delta1} label="First" />
            <ReportCard report={report2} moodDelta={delta2} label="Second" />
          </div>
          <ComparisonInsights 
            report1={report1} 
            report2={report2} 
            delta1={delta1}
            delta2={delta2}
          />
        </div>
      ) : (
        <Card className="bg-muted/10 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Scale className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">
              Select two experiences above to compare them side-by-side
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
