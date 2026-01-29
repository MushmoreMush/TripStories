import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, X, Filter } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

export interface FilterValues {
  search: string;
  substance: string;
  dateFrom: string;
  dateTo: string;
}

interface ReportFiltersProps {
  substances: string[];
  onFilterChange: (filters: FilterValues) => void;
  initialFilters?: Partial<FilterValues>;
}

export function ReportFilters({
  substances,
  onFilterChange,
  initialFilters,
}: ReportFiltersProps) {
  const [search, setSearch] = useState(initialFilters?.search || "");
  const [substance, setSubstance] = useState(initialFilters?.substance || "");
  const [dateFrom, setDateFrom] = useState(initialFilters?.dateFrom || "");
  const [dateTo, setDateTo] = useState(initialFilters?.dateTo || "");
  const [isOpen, setIsOpen] = useState(false);

  const hasActiveFilters = substance || dateFrom || dateTo;

  useEffect(() => {
    const timer = setTimeout(() => {
      onFilterChange({ search, substance, dateFrom, dateTo });
    }, 300);
    return () => clearTimeout(timer);
  }, [search, substance, dateFrom, dateTo, onFilterChange]);

  const clearFilters = () => {
    setSearch("");
    setSubstance("");
    setDateFrom("");
    setDateTo("");
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search reports..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            data-testid="input-search-reports"
          />
        </div>

        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <Button
              variant="outline"
              size="default"
              className={hasActiveFilters ? "border-primary" : ""}
              data-testid="button-toggle-filters"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {hasActiveFilters && (
                <span className="ml-1 text-xs bg-primary text-primary-foreground rounded-full px-1.5">
                  {[substance, dateFrom, dateTo].filter(Boolean).length}
                </span>
              )}
            </Button>
          </CollapsibleTrigger>
        </Collapsible>

        {(search || hasActiveFilters) && (
          <Button
            variant="ghost"
            size="default"
            onClick={clearFilters}
            data-testid="button-clear-filters"
          >
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleContent>
          <div className="flex flex-wrap gap-3 pt-2">
            <Select value={substance} onValueChange={setSubstance}>
              <SelectTrigger
                className="w-[180px]"
                data-testid="select-substance-filter"
              >
                <SelectValue placeholder="All substances" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All substances</SelectItem>
                {substances.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-[150px]"
                placeholder="From"
                data-testid="input-date-from"
              />
              <span className="text-muted-foreground">to</span>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-[150px]"
                placeholder="To"
                data-testid="input-date-to"
              />
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
