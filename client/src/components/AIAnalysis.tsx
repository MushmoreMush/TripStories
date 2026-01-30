import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, Brain, Heart, Lightbulb, TrendingUp, RefreshCw } from "lucide-react";

interface AnalysisResult {
  id: number;
  reportId: number;
  sentimentScore: number;
  emotionalArc: string[];
  themes: string[];
  insights: string[];
  integrationSuggestions: string[];
  riskFactors: string[];
  analyzedAt: string;
}

interface AIAnalysisProps {
  reportId: number;
  experience?: string;
  setMindset?: string;
  setting?: string;
}

const sentimentLabels: Record<string, { label: string; color: string }> = {
  negative: { label: "Challenging", color: "text-red-600" },
  neutral: { label: "Neutral", color: "text-gray-600" },
  positive: { label: "Positive", color: "text-green-600" },
  very_positive: { label: "Transformative", color: "text-purple-600" },
};

function getSentimentLabel(score: number) {
  if (score < 0.3) return sentimentLabels.negative;
  if (score < 0.5) return sentimentLabels.neutral;
  if (score < 0.7) return sentimentLabels.positive;
  return sentimentLabels.very_positive;
}

export function AIAnalysis({ reportId, experience, setMindset, setting }: AIAnalysisProps) {
  const queryClient = useQueryClient();

  const { data: analysis, isLoading } = useQuery<AnalysisResult>({
    queryKey: ["/api/analysis", reportId],
    queryFn: async () => {
      const res = await fetch(`/api/analysis/${reportId}`);
      if (!res.ok) return null;
      return res.json();
    },
  });

  const runAnalysis = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/analysis/${reportId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ experience, setMindset, setting }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/analysis", reportId] });
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            AI Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardContent>
      </Card>
    );
  }

  if (!analysis) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            AI Analysis
          </CardTitle>
          <CardDescription>
            Get personalized insights and integration suggestions powered by AI
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={() => runAnalysis.mutate()}
            disabled={runAnalysis.isPending}
            className="w-full"
          >
            {runAnalysis.isPending ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Brain className="h-4 w-4 mr-2" />
                Generate Analysis
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const sentiment = getSentimentLabel(analysis.sentimentScore);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            AI Analysis
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => runAnalysis.mutate()}
            disabled={runAnalysis.isPending}
          >
            <RefreshCw className={`h-4 w-4 ${runAnalysis.isPending ? "animate-spin" : ""}`} />
          </Button>
        </div>
        <CardDescription>
          Analyzed {new Date(analysis.analyzedAt).toLocaleDateString()}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Sentiment */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Overall Experience</span>
            <span className={`font-semibold ${sentiment.color}`}>{sentiment.label}</span>
          </div>
          <Progress value={analysis.sentimentScore * 100} className="h-2" />
        </div>

        {/* Emotional Arc */}
        {analysis.emotionalArc && analysis.emotionalArc.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Emotional Journey
            </h4>
            <div className="flex flex-wrap gap-2">
              {analysis.emotionalArc.map((emotion, idx) => (
                <div key={idx} className="flex items-center gap-1">
                  <Badge variant="outline" className="text-xs">
                    {emotion}
                  </Badge>
                  {idx < analysis.emotionalArc.length - 1 && (
                    <span className="text-muted-foreground">→</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Themes */}
        {analysis.themes && analysis.themes.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
              <Brain className="h-4 w-4" />
              Key Themes
            </h4>
            <div className="flex flex-wrap gap-2">
              {analysis.themes.map((theme, idx) => (
                <Badge key={idx} variant="secondary">
                  {theme}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Insights */}
        {analysis.insights && analysis.insights.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              Insights
            </h4>
            <ul className="space-y-2">
              {analysis.insights.map((insight, idx) => (
                <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  {insight}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Integration Suggestions */}
        {analysis.integrationSuggestions && analysis.integrationSuggestions.length > 0 && (
          <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
            <h4 className="text-sm font-medium mb-3 flex items-center gap-2 text-purple-800">
              <Heart className="h-4 w-4" />
              Integration Suggestions
            </h4>
            <ul className="space-y-2">
              {analysis.integrationSuggestions.map((suggestion, idx) => (
                <li key={idx} className="text-sm text-purple-700 flex items-start gap-2">
                  <span className="mt-1">→</span>
                  {suggestion}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Risk Factors (if any) */}
        {analysis.riskFactors && analysis.riskFactors.length > 0 && (
          <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <h4 className="text-sm font-medium mb-3 text-yellow-800">
              Areas for Attention
            </h4>
            <ul className="space-y-2">
              {analysis.riskFactors.map((risk, idx) => (
                <li key={idx} className="text-sm text-yellow-700 flex items-start gap-2">
                  <span className="mt-1">⚠</span>
                  {risk}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
