import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, Heart, FileText,
  Clock, MapPin
} from "lucide-react";
import { Link } from "wouter";
import type { MoodEntry, TripReportWithUser } from "@shared/schema";

interface DayData {
  date: Date;
  trips: TripReportWithUser[];
  moods: MoodEntry[];
  isCurrentMonth: boolean;
  isToday: boolean;
}

const SUBSTANCE_COLORS: Record<string, { bg: string; dot: string; text: string }> = {
  psilocybin: { bg: "bg-purple-500/20", dot: "bg-purple-500", text: "text-purple-600 dark:text-purple-400" },
  lsd: { bg: "bg-blue-500/20", dot: "bg-blue-500", text: "text-blue-600 dark:text-blue-400" },
  mdma: { bg: "bg-pink-500/20", dot: "bg-pink-500", text: "text-pink-600 dark:text-pink-400" },
  dmt: { bg: "bg-amber-500/20", dot: "bg-amber-500", text: "text-amber-600 dark:text-amber-400" },
  ketamine: { bg: "bg-cyan-500/20", dot: "bg-cyan-500", text: "text-cyan-600 dark:text-cyan-400" },
  mescaline: { bg: "bg-emerald-500/20", dot: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400" },
  ayahuasca: { bg: "bg-teal-500/20", dot: "bg-teal-500", text: "text-teal-600 dark:text-teal-400" },
  cannabis: { bg: "bg-green-500/20", dot: "bg-green-500", text: "text-green-600 dark:text-green-400" },
  default: { bg: "bg-slate-500/20", dot: "bg-slate-500", text: "text-slate-600 dark:text-slate-400" },
};

function getSubstanceColor(substance: string): { bg: string; dot: string; text: string } {
  const normalized = substance.toLowerCase().trim();
  for (const [key, value] of Object.entries(SUBSTANCE_COLORS)) {
    if (normalized.includes(key)) {
      return value;
    }
  }
  return SUBSTANCE_COLORS.default;
}

function getMoodColor(level: number): string {
  switch (level) {
    case 1: return "bg-red-500/30";
    case 2: return "bg-orange-500/30";
    case 3: return "bg-yellow-500/30";
    case 4: return "bg-lime-500/30";
    case 5: return "bg-green-500/30";
    default: return "";
  }
}

function getMoodGradient(level: number): string {
  switch (level) {
    case 1: return "from-red-500/20 to-transparent";
    case 2: return "from-orange-500/20 to-transparent";
    case 3: return "from-yellow-500/20 to-transparent";
    case 4: return "from-lime-500/20 to-transparent";
    case 5: return "from-green-500/20 to-transparent";
    default: return "";
  }
}

function DayCell({ day, onClick }: { day: DayData; onClick: () => void }) {
  const avgMood = day.moods.length > 0
    ? day.moods.reduce((sum, m) => sum + m.level, 0) / day.moods.length
    : null;

  const uniqueSubstances = [...new Set(day.trips.map(t => t.substance))];

  return (
    <button
      onClick={onClick}
      className={`
        relative min-h-[80px] md:min-h-[100px] p-1 md:p-2 border-b border-r text-left
        transition-colors hover-elevate
        ${!day.isCurrentMonth ? "opacity-40" : ""}
        ${day.isToday ? "ring-2 ring-primary ring-inset" : ""}
        ${avgMood ? `bg-gradient-to-br ${getMoodGradient(Math.round(avgMood))}` : ""}
      `}
      data-testid={`calendar-day-${day.date.toISOString().split('T')[0]}`}
    >
      <div className="flex items-center justify-between">
        <span className={`text-sm font-medium ${day.isToday ? "bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center" : ""}`}>
          {day.date.getDate()}
        </span>
        {avgMood !== null && (
          <span className="text-xs flex items-center gap-0.5 text-muted-foreground">
            <Heart className="h-3 w-3" />
            {avgMood.toFixed(1)}
          </span>
        )}
      </div>
      
      <div className="mt-1 flex flex-wrap gap-1">
        {uniqueSubstances.slice(0, 4).map((substance, i) => {
          const color = getSubstanceColor(substance);
          const count = day.trips.filter(t => t.substance === substance).length;
          return (
            <div
              key={i}
              className={`h-3 w-3 rounded-full ${color.dot} ring-1 ring-background`}
              title={`${substance}${count > 1 ? ` (${count})` : ""}`}
            />
          );
        })}
        {uniqueSubstances.length > 4 && (
          <span className="text-xs text-muted-foreground">+{uniqueSubstances.length - 4}</span>
        )}
      </div>

      {day.trips.length > 0 && (
        <div className="absolute bottom-1 left-1">
          <span className="text-xs text-muted-foreground flex items-center gap-0.5">
            <FileText className="h-3 w-3" />
            {day.trips.length}
          </span>
        </div>
      )}
    </button>
  );
}

function DayDetail({ day, onClose }: { day: DayData; onClose: () => void }) {
  const dateStr = day.date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const avgMood = day.moods.length > 0
    ? (day.moods.reduce((sum, m) => sum + m.level, 0) / day.moods.length).toFixed(1)
    : null;

  return (
    <Card className="sticky top-20">
      <CardHeader className="flex flex-row items-start justify-between gap-4 pb-3">
        <div>
          <CardTitle className="text-lg">{dateStr}</CardTitle>
          <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
            {day.trips.length > 0 && (
              <span className="flex items-center gap-1">
                <FileText className="h-4 w-4" />
                {day.trips.length} trip{day.trips.length !== 1 ? "s" : ""}
              </span>
            )}
            {avgMood && (
              <span className="flex items-center gap-1">
                <Heart className="h-4 w-4" />
                {avgMood}/5
              </span>
            )}
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} data-testid="button-close-detail">
          Close
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {day.trips.length > 0 && (
          <div>
            <h4 className="font-medium mb-2 text-sm">Trip Reports</h4>
            <div className="space-y-2">
              {day.trips.map((trip) => {
                const color = getSubstanceColor(trip.substance);
                return (
                  <div 
                    key={trip.id} 
                    className={`p-3 rounded-lg border ${color.bg}`}
                    data-testid={`trip-detail-${trip.id}`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`h-3 w-3 rounded-full ${color.dot}`} />
                        <span className={`font-medium ${color.text}`}>{trip.substance}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">{trip.amount}</Badge>
                    </div>
                    
                    {trip.setting && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                        <MapPin className="h-3 w-3" />
                        <span className="capitalize">{trip.setting}</span>
                      </div>
                    )}
                    
                    <p className="text-sm line-clamp-3 mt-2">{trip.experience}</p>
                    
                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/50">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {trip.createdAt ? new Date(trip.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                      </div>
                      <Link href="/my-reports">
                        <Button variant="ghost" size="sm" data-testid={`button-view-report-${trip.id}`}>
                          View Full Report
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {day.moods.length > 0 && (
          <div>
            <h4 className="font-medium mb-2 text-sm">Mood Entries</h4>
            <div className="space-y-2">
              {day.moods.map((mood) => (
                <div 
                  key={mood.id} 
                  className={`flex items-center gap-3 p-2 rounded-lg ${getMoodColor(mood.level)}`}
                  data-testid={`mood-detail-${mood.id}`}
                >
                  <div className="h-8 w-8 rounded-full bg-background flex items-center justify-center text-sm font-medium border">
                    {mood.level}
                  </div>
                  <div className="flex-1 min-w-0">
                    {mood.notes ? (
                      <p className="text-sm truncate">{mood.notes}</p>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">No notes</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {mood.createdAt ? new Date(mood.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {day.trips.length === 0 && day.moods.length === 0 && (
          <div className="text-center py-6">
            <CalendarIcon className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
            <p className="text-muted-foreground">No entries for this day</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Legend({ substances }: { substances: string[] }) {
  const uniqueSubstances = [...new Set(substances)].slice(0, 8);
  
  return (
    <Card>
      <CardContent className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Substances</h4>
            <div className="flex flex-wrap gap-2">
              {uniqueSubstances.length > 0 ? (
                uniqueSubstances.map((substance) => {
                  const color = getSubstanceColor(substance);
                  return (
                    <div key={substance} className="flex items-center gap-1.5">
                      <div className={`h-3 w-3 rounded-full ${color.dot}`} />
                      <span className="text-sm capitalize">{substance}</span>
                    </div>
                  );
                })
              ) : (
                <span className="text-sm text-muted-foreground">No trips recorded</span>
              )}
            </div>
          </div>
          
          <div>
            <h4 className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Mood Scale</h4>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((level) => (
                <div key={level} className="flex flex-col items-center gap-1">
                  <div className={`h-6 w-6 rounded ${getMoodColor(level)} flex items-center justify-center text-xs font-medium`}>
                    {level}
                  </div>
                </div>
              ))}
              <div className="ml-2 text-xs text-muted-foreground">
                <span>Low</span>
                <span className="mx-1">→</span>
                <span>Great</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<DayData | null>(null);

  const { data: reports, isLoading: reportsLoading } = useQuery<TripReportWithUser[]>({
    queryKey: ["/api/reports"],
  });

  const { data: moodData, isLoading: moodLoading } = useQuery<MoodEntry[]>({
    queryKey: ["/api/mood"],
  });

  const isLoading = reportsLoading || moodLoading;

  const allSubstances = useMemo(() => {
    return (reports || []).map(r => r.substance);
  }, [reports]);

  const generateCalendarDays = (): DayData[] => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    
    const startDay = new Date(firstDayOfMonth);
    startDay.setDate(startDay.getDate() - firstDayOfMonth.getDay());
    
    const endDay = new Date(lastDayOfMonth);
    endDay.setDate(endDay.getDate() + (6 - lastDayOfMonth.getDay()));
    
    const days: DayData[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const current = new Date(startDay);
    while (current <= endDay) {
      const dateStr = current.toISOString().split("T")[0];
      
      const dayTrips = (reports || []).filter((r) => {
        if (!r.createdAt) return false;
        return new Date(r.createdAt).toISOString().split("T")[0] === dateStr;
      });
      
      const dayMoods = (moodData || []).filter((m) => {
        if (!m.createdAt) return false;
        return new Date(m.createdAt).toISOString().split("T")[0] === dateStr;
      });
      
      const dayDate = new Date(current);
      dayDate.setHours(0, 0, 0, 0);
      
      days.push({
        date: new Date(current),
        trips: dayTrips,
        moods: dayMoods,
        isCurrentMonth: current.getMonth() === month,
        isToday: dayDate.getTime() === today.getTime(),
      });
      
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  };

  const calendarDays = generateCalendarDays();
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const goToPrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    setSelectedDay(null);
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    setSelectedDay(null);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDay(null);
  };

  const monthYear = currentDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto p-6 md:p-8 space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-8 space-y-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500/20 to-purple-500/5">
            <CalendarIcon className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight" data-testid="heading-calendar">
            Journey Calendar
          </h1>
        </div>
        <p className="text-muted-foreground pl-10">
          View your trips and moods over time
        </p>
      </div>

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={goToPrevMonth} data-testid="button-prev-month">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={goToNextMonth} data-testid="button-next-month">
            <ChevronRight className="h-4 w-4" />
          </Button>
          <span className="text-lg font-semibold ml-2">{monthYear}</span>
        </div>
        <Button variant="outline" size="sm" onClick={goToToday} data-testid="button-today">
          Today
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <Card className="flex-1 overflow-hidden">
          <div className="grid grid-cols-7 border-b bg-muted/30">
            {weekDays.map((day) => (
              <div
                key={day}
                className="p-2 text-center text-sm font-medium text-muted-foreground border-r last:border-r-0"
              >
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {calendarDays.map((day, i) => (
              <DayCell
                key={i}
                day={day}
                onClick={() => setSelectedDay(day)}
              />
            ))}
          </div>
        </Card>

        {selectedDay && (
          <div className="lg:w-96">
            <DayDetail day={selectedDay} onClose={() => setSelectedDay(null)} />
          </div>
        )}
      </div>

      <Legend substances={allSubstances} />
    </div>
  );
}
