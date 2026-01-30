import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { TripReportCard, TripReportCardSkeleton } from "@/components/TripReportCard";
import { ReportFilters, type FilterValues } from "@/components/ReportFilters";
import { FirstReportPrompt } from "@/components/FirstReportPrompt";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Users, FileText, Compass, Sparkles } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import type { TripReportWithUser, TripReport } from "@shared/schema";

function buildQueryString(filters: FilterValues): string {
  const params = new URLSearchParams();
  if (filters.search) params.set("search", filters.search);
  if (filters.substance && filters.substance !== "all") params.set("substance", filters.substance);
  if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
  if (filters.dateTo) params.set("dateTo", filters.dateTo);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export default function Home() {
  const { user } = useAuth();
  const [filters, setFilters] = useState<FilterValues>({
    search: "",
    substance: "",
    dateFrom: "",
    dateTo: "",
  });

  const queryString = buildQueryString(filters);

  const { data: reports, isLoading } = useQuery<TripReportWithUser[]>({
    queryKey: ["/api/feed", queryString],
    queryFn: async () => {
      const res = await fetch(`/api/feed${queryString}`);
      if (!res.ok) throw new Error(`${res.status}: ${res.statusText}`);
      return res.json();
    },
  });

  const { data: substances = [] } = useQuery<string[]>({
    queryKey: ["/api/reports/substances"],
  });

  const { data: myReports = [] } = useQuery<TripReport[]>({
    queryKey: ["/api/reports"],
  });

  const handleFilterChange = useCallback((newFilters: FilterValues) => {
    setFilters(newFilters);
  }, []);

  const hasFilters = filters.search || filters.substance || filters.dateFrom || filters.dateTo;
  const hasNoReports = myReports.length === 0;

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4 md:px-6 space-y-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5">
              <Compass className="h-4 w-4 text-primary" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Community Feed</h1>
          </div>
          <p className="text-muted-foreground text-sm pl-10">
            Experiences shared by your trusted circle
          </p>
        </div>
        <Button asChild data-testid="button-new-report-header">
          <Link href="/new-report">
            <Sparkles className="h-4 w-4 mr-2" />
            New Report
          </Link>
        </Button>
      </div>

      {hasNoReports && !hasFilters && (
        <FirstReportPrompt userName={user?.firstName || undefined} />
      )}

      <ReportFilters
        substances={substances}
        onFilterChange={handleFilterChange}
        initialFilters={filters}
      />

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <TripReportCardSkeleton key={i} />
          ))}
        </div>
      ) : reports && reports.length > 0 ? (
        <div className="space-y-4">
          {reports.map((report) => (
            <TripReportCard key={report.id} report={report} currentUser={user} />
          ))}
        </div>
      ) : (
        <Card className="py-16 bg-gradient-to-br from-card to-muted/20">
          <CardContent className="flex flex-col items-center text-center space-y-6">
            <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/10 flex items-center justify-center">
              {hasFilters ? (
                <FileText className="h-10 w-10 text-muted-foreground" />
              ) : (
                <Users className="h-10 w-10 text-primary/60" />
              )}
            </div>
            <div className="space-y-2 max-w-md">
              <h3 className="font-semibold text-xl tracking-tight">
                {hasFilters ? "No matching reports" : "Your feed awaits"}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {hasFilters
                  ? "Try adjusting your filters to find what you're looking for."
                  : "Connect with friends to see their experiences here, or document your first journey to get started."}
              </p>
            </div>
            {!hasFilters && (
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button asChild>
                  <Link href="/new-report">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Document Journey
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/friends">
                    <Users className="h-4 w-4 mr-2" />
                    Find Friends
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
