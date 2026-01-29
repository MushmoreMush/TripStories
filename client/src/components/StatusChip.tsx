import { Badge } from "@/components/ui/badge";
import { FileEdit, Lock, Users, Cloud, CloudOff, Loader2 } from "lucide-react";
import type { ReportStatus } from "@shared/schema";

interface StatusChipProps {
  status: ReportStatus;
  className?: string;
}

export function StatusChip({ status, className = "" }: StatusChipProps) {
  const config = {
    draft: {
      label: "Draft",
      icon: FileEdit,
      className: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
    },
    private: {
      label: "Private",
      icon: Lock,
      className: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20",
    },
    shared: {
      label: "Shared",
      icon: Users,
      className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
    },
  };

  const { label, icon: Icon, className: statusClassName } = config[status];

  return (
    <Badge 
      variant="outline" 
      className={`${statusClassName} ${className}`}
      data-testid={`badge-status-${status}`}
    >
      <Icon className="h-3 w-3 mr-1" />
      {label}
    </Badge>
  );
}

interface AutoSaveIndicatorProps {
  isSaving: boolean;
  lastSaved: Date | null;
}

export function AutoSaveIndicator({ isSaving, lastSaved }: AutoSaveIndicatorProps) {
  if (isSaving) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground" data-testid="indicator-saving">
        <Loader2 className="h-3 w-3 animate-spin" />
        <span>Saving...</span>
      </div>
    );
  }

  if (lastSaved) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground" data-testid="indicator-saved">
        <Cloud className="h-3 w-3 text-emerald-500" />
        <span>Saved</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground" data-testid="indicator-unsaved">
      <CloudOff className="h-3 w-3" />
      <span>Not saved</span>
    </div>
  );
}
