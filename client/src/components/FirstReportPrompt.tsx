import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PenLine, Sparkles, ArrowRight } from "lucide-react";
import { Link } from "wouter";

interface FirstReportPromptProps {
  userName?: string;
}

export function FirstReportPrompt({ userName }: FirstReportPromptProps) {
  return (
    <Card className="border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
      <CardContent className="p-6 md:p-8">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          
          <div className="flex-1 space-y-3">
            <div>
              <h3 className="text-lg font-semibold" data-testid="text-first-report-title">
                {userName ? `Ready to begin, ${userName}?` : "Ready to begin your journey?"}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Your first report is waiting. Don't worry about getting it perfect - 
                you can always edit later. Start with what feels most present.
              </p>
            </div>
            
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Example to get started:
              </p>
              <div className="space-y-1 text-sm">
                <p><span className="font-medium">Substance:</span> Psilocybin mushrooms</p>
                <p><span className="font-medium">Mindset:</span> Curious and open, looking for clarity on a decision I've been avoiding...</p>
                <p><span className="font-medium">Setting:</span> At home, comfortable space with soft lighting and calm music...</p>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col gap-2 w-full md:w-auto">
            <Link href="/reports/new?prefill=true">
              <Button className="w-full" data-testid="button-create-first-report">
                <PenLine className="h-4 w-4 mr-2" />
                Create first report
              </Button>
            </Link>
            <Link href="/reports/new">
              <Button variant="ghost" size="sm" className="w-full" data-testid="button-start-blank">
                Start blank
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
