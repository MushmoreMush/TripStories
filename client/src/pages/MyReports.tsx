import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { TripReportCard, TripReportCardSkeleton } from "@/components/TripReportCard";
import { ReportFilters, type FilterValues } from "@/components/ReportFilters";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, FileText, Download, BookOpen, Sparkles } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import type { TripReportWithUser } from "@shared/schema";

function buildQueryString(filters: FilterValues): string {
  const params = new URLSearchParams();
  if (filters.search) params.set("search", filters.search);
  if (filters.substance && filters.substance !== "all") params.set("substance", filters.substance);
  if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
  if (filters.dateTo) params.set("dateTo", filters.dateTo);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export default function MyReports() {
  const { user } = useAuth();
  const [filters, setFilters] = useState<FilterValues>({
    search: "",
    substance: "",
    dateFrom: "",
    dateTo: "",
  });

  const queryString = buildQueryString(filters);

  const { data: reports, isLoading } = useQuery<TripReportWithUser[]>({
    queryKey: ["/api/reports", queryString],
    queryFn: async () => {
      const res = await fetch(`/api/reports${queryString}`);
      if (!res.ok) throw new Error(`${res.status}: ${res.statusText}`);
      return res.json();
    },
  });

  const { data: substances = [] } = useQuery<string[]>({
    queryKey: ["/api/reports/substances"],
  });

  const handleFilterChange = useCallback((newFilters: FilterValues) => {
    setFilters(newFilters);
  }, []);

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4 md:px-6 space-y-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500/20 to-purple-500/5">
              <BookOpen className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">My Integration Journal</h1>
          </div>
          <p className="text-muted-foreground text-sm pl-10">
            Your personal journey documentation
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            asChild
            data-testid="button-export"
          >
            <a href="/api/export?format=json" download>
              <Download className="h-4 w-4 mr-2" />
              Export
            </a>
          </Button>
          <Button asChild data-testid="button-new-report">
            <Link href="/new-report">
              <Sparkles className="h-4 w-4 mr-2" />
              New Report
            </Link>
          </Button>
        </div>
      </div>

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
            <TripReportCard key={report.id} report={report} showUser={false} currentUser={user} />
          ))}
        </div>
      ) : (
        <Card className="py-12">
          <CardContent className="flex flex-col items-center text-center space-y-4">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">
                {filters.search || filters.substance || filters.dateFrom || filters.dateTo
                  ? "No matching reports"
                  : "No reports yet"}
              </h3>
              <p className="text-muted-foreground text-sm max-w-sm">
                {filters.search || filters.substance || filters.dateFrom || filters.dateTo
                  ? "Try adjusting your filters to find what you're looking for."
                  : "Start documenting your experiences. Your reports are private and only shared with friends you choose."}
              </p>
            </div>
            {!filters.search && !filters.substance && !filters.dateFrom && !filters.dateTo && (
              <Button asChild data-testid="button-create-first-report">
                <Link href="/new-report">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Create Your First Report
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
