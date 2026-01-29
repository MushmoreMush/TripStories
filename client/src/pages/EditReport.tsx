import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation, useRoute } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Sparkles, Brain, MapPin, BookOpen, X, ArrowLeft, Save, Loader2, Zap, Lightbulb, Heart, Sun, Target, ChevronDown, ChevronUp, Lock, Users, Shield, Eye, EyeOff, Clock, FileEdit } from "lucide-react";
import type { TripReport, ReportStatus } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusChip, AutoSaveIndicator } from "@/components/StatusChip";

const substances = [
  "Psilocybin",
  "LSD",
  "DMT",
  "Ayahuasca",
  "MDMA",
  "Ketamine",
  "Cannabis",
  "Mescaline",
  "2C-B",
  "Salvia",
  "Other",
];

const formSchema = z.object({
  substance: z.string().min(1, "Please select a substance"),
  amount: z.string().min(1, "Please enter an amount"),
  setMindset: z.string().min(10, "Please describe your mindset (at least 10 characters)"),
  setting: z.string().min(10, "Please describe your setting (at least 10 characters)"),
  experience: z.string().min(50, "Please describe your experience (at least 50 characters)"),
});

type FormValues = z.infer<typeof formSchema>;

export default function EditReport() {
  const [, navigate] = useLocation();
  const [, params] = useRoute("/edit-report/:id");
  const reportId = params?.id;
  const { toast } = useToast();
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [showIntegrationPrompts, setShowIntegrationPrompts] = useState(true);
  const [status, setStatus] = useState<ReportStatus>("draft");
  const [shareExpiration, setShareExpiration] = useState<string>("forever");
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showAftercare, setShowAftercare] = useState(false);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [integrationData, setIntegrationData] = useState({
    whatSurprised: "",
    lessonsToRemember: "",
    dailyLifeApplication: "",
    weeklyIntention: "",
  });

  const { data: report, isLoading } = useQuery<TripReport>({
    queryKey: ["/api/reports", reportId],
    queryFn: async () => {
      const res = await fetch(`/api/reports/${reportId}`);
      if (!res.ok) throw new Error(`${res.status}: ${res.statusText}`);
      return res.json();
    },
    enabled: !!reportId,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      substance: "",
      amount: "",
      setMindset: "",
      setting: "",
      experience: "",
    },
  });

  useEffect(() => {
    if (report) {
      form.reset({
        substance: report.substance,
        amount: report.amount,
        setMindset: report.setMindset,
        setting: report.setting,
        experience: report.experience,
      });
      setTags(report.tags || []);
      setStatus((report.status as ReportStatus) || "draft");
      setIntegrationData({
        whatSurprised: report.whatSurprised || "",
        lessonsToRemember: report.lessonsToRemember || "",
        dailyLifeApplication: report.dailyLifeApplication || "",
        weeklyIntention: report.weeklyIntention || "",
      });
      if (report.shareExpiresAt) {
        const expires = new Date(report.shareExpiresAt);
        const now = new Date();
        const diffDays = Math.round((expires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays <= 7) setShareExpiration("7days");
        else if (diffDays <= 30) setShareExpiration("30days");
        else setShareExpiration("forever");
      }
    }
  }, [report, form]);

  const getShareExpiresAt = useCallback(() => {
    if (status !== "shared") return null;
    const now = new Date();
    switch (shareExpiration) {
      case "7days": return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
      case "30days": return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
      default: return null;
    }
  }, [status, shareExpiration]);

  const autoSave = useCallback(async () => {
    if (!reportId) return;
    const formValues = form.getValues();
    if (!formValues.substance) return;
    
    setIsSaving(true);
    try {
      await apiRequest("PATCH", `/api/reports/${reportId}`, {
        ...formValues,
        tags,
        status,
        shareExpiresAt: getShareExpiresAt(),
        isQuickLog: false,
        whatSurprised: integrationData.whatSurprised || undefined,
        lessonsToRemember: integrationData.lessonsToRemember || undefined,
        dailyLifeApplication: integrationData.dailyLifeApplication || undefined,
        weeklyIntention: integrationData.weeklyIntention || undefined,
      });
      setLastSaved(new Date());
      queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
    } catch (error) {
      console.error("Auto-save failed:", error);
    } finally {
      setIsSaving(false);
    }
  }, [reportId, form, tags, status, integrationData, getShareExpiresAt]);

  const scheduleAutoSave = useCallback(() => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    autoSaveTimerRef.current = setTimeout(autoSave, 2000);
  }, [autoSave]);

  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, []);

  const mutation = useMutation({
    mutationFn: async (data: FormValues) => {
      await apiRequest("PATCH", `/api/reports/${reportId}`, { 
        ...data, 
        tags,
        status,
        shareExpiresAt: getShareExpiresAt(),
        isQuickLog: false,
        whatSurprised: integrationData.whatSurprised || undefined,
        lessonsToRemember: integrationData.lessonsToRemember || undefined,
        dailyLifeApplication: integrationData.dailyLifeApplication || undefined,
        weeklyIntention: integrationData.weeklyIntention || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
      queryClient.invalidateQueries({ queryKey: ["/api/feed"] });
      setShowAftercare(true);
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({ title: "Unauthorized", description: "Logging in again...", variant: "destructive" });
        setTimeout(() => { window.location.href = "/api/login"; }, 500);
        return;
      }
      toast({ title: "Error", description: "Failed to update report", variant: "destructive" });
    },
  });

  const addTag = () => {
    const trimmed = tagInput.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed) && tags.length < 10) {
      setTags([...tags, trimmed]);
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  };

  if (isLoading) {
    return (
      <div className="container max-w-2xl mx-auto py-6 px-4 md:px-6">
        <Skeleton className="h-8 w-32 mb-4" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </CardHeader>
          <CardContent className="space-y-6">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-48 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="container max-w-2xl mx-auto py-6 px-4 md:px-6">
        <Card className="py-12">
          <CardContent className="text-center">
            <p className="text-muted-foreground">Report not found</p>
            <Button variant="ghost" className="mt-4" onClick={() => navigate("/my-reports")}>
              Back to Journal
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showAftercare) {
    return (
      <div className="container max-w-lg mx-auto py-12 px-4 md:px-6">
        <Card className="text-center" data-testid="card-aftercare">
          <CardContent className="pt-8 pb-8 space-y-6">
            <div className="h-16 w-16 mx-auto rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg">
              <Heart className="h-8 w-8 text-white" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">Thanks for reflecting</h2>
              <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                Taking time to process and integrate your experiences is an act of self-care. 
                The real work begins after the experience ends.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <StatusChip status={status} />
              {status === "shared" && (
                <span className="flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  Only visible to your friends
                </span>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <Button onClick={() => navigate("/my-reports")} data-testid="button-view-journal">
                <BookOpen className="h-4 w-4 mr-2" />
                View Journal
              </Button>
              <Button variant="outline" onClick={() => setShowAftercare(false)} data-testid="button-continue-editing">
                Continue Editing
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto py-6 px-4 md:px-6">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <Button
          variant="ghost"
          onClick={() => navigate("/my-reports")}
          data-testid="button-back"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Journal
        </Button>
        <div className="flex items-center gap-3">
          <AutoSaveIndicator isSaving={isSaving} lastSaved={lastSaved} />
          <StatusChip status={status} />
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg">
                  <Zap className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg">Substance & Dose</CardTitle>
                  <CardDescription className="text-xs">
                    What and how much
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="substance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4" />
                        Substance
                      </FormLabel>
                      <Select onValueChange={(v) => { field.onChange(v); scheduleAutoSave(); }} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-substance">
                            <SelectValue placeholder="Select substance" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {substances.map((s) => (
                            <SelectItem key={s} value={s}>
                              {s}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount / Dosage</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., 2g, 100ug, 1 tab"
                          {...field}
                          onChange={(e) => { field.onChange(e); scheduleAutoSave(); }}
                          data-testid="input-amount"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Brain className="h-5 w-5 text-purple-500" />
                Before: Set & Setting
              </CardTitle>
              <CardDescription className="text-xs">
                Your mindset and environment going in
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="setMindset"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Brain className="h-4 w-4" />
                      Set (Mindset)
                    </FormLabel>
                    <FormDescription>
                      What was your mental state? What were your intentions?
                    </FormDescription>
                    <FormControl>
                      <Textarea
                        placeholder="Describe your headspace, emotional state, and intentions going into the experience..."
                        className="min-h-[100px] resize-none"
                        {...field}
                        onChange={(e) => { field.onChange(e); scheduleAutoSave(); }}
                        data-testid="textarea-set"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="setting"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Setting
                    </FormLabel>
                    <FormDescription>
                      Where were you? Who was present? What was the environment like?
                    </FormDescription>
                    <FormControl>
                      <Textarea
                        placeholder="Describe the physical location, people present, music, lighting, and overall atmosphere..."
                        className="min-h-[100px] resize-none"
                        {...field}
                        onChange={(e) => { field.onChange(e); scheduleAutoSave(); }}
                        data-testid="textarea-setting"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-blue-500" />
                During: The Experience
              </CardTitle>
              <CardDescription className="text-xs">
                What happened in your journey
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="experience"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      Experience
                    </FormLabel>
                    <FormDescription>
                      Describe your journey in detail. What did you feel, see, learn?
                    </FormDescription>
                    <FormControl>
                      <Textarea
                        placeholder="Share your experience... the onset, peak, and comedown. Include insights, visuals, emotions, and any meaningful moments..."
                        className="min-h-[200px] resize-none"
                        {...field}
                        onChange={(e) => { field.onChange(e); scheduleAutoSave(); }}
                        data-testid="textarea-experience"
                      />
                    </FormControl>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <FormMessage />
                      <span>{field.value.length} characters</span>
                    </div>
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <FormLabel>Tags (optional)</FormLabel>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a tag..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    className="flex-1"
                    data-testid="input-tags"
                  />
                  <Button type="button" variant="outline" onClick={addTag}>
                    Add
                  </Button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="cursor-pointer"
                        onClick={() => removeTag(tag)}
                      >
                        {tag}
                        <X className="h-3 w-3 ml-1" />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-amber-500" />
                After: Integration
              </CardTitle>
              <CardDescription className="text-xs">
                Carrying insights forward into daily life
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <button
                type="button"
                onClick={() => setShowIntegrationPrompts(!showIntegrationPrompts)}
                className="flex items-center justify-between w-full text-left p-3 rounded-lg bg-muted/50 hover-elevate"
                data-testid="toggle-integration-prompts"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Integration Prompts</span>
                  <span className="text-xs text-muted-foreground">(recommended)</span>
                </div>
                {showIntegrationPrompts ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
              
              {showIntegrationPrompts && (
                <div className="space-y-4 pt-2">
                  <p className="text-xs text-muted-foreground italic">
                    Gentle prompts to help you extract meaning and carry insights forward
                  </p>
                  
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Sparkles className="h-3.5 w-3.5 text-purple-500" />
                      What surprised you?
                    </label>
                    <Textarea
                      placeholder="Something unexpected that emerged..."
                      className="min-h-[80px] resize-none"
                      value={integrationData.whatSurprised}
                      onChange={(e) => { setIntegrationData({ ...integrationData, whatSurprised: e.target.value }); scheduleAutoSave(); }}
                      data-testid="textarea-what-surprised"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Heart className="h-3.5 w-3.5 text-rose-500" />
                      What lesson wants to be remembered?
                    </label>
                    <Textarea
                      placeholder="An insight or truth that felt important..."
                      className="min-h-[80px] resize-none"
                      value={integrationData.lessonsToRemember}
                      onChange={(e) => { setIntegrationData({ ...integrationData, lessonsToRemember: e.target.value }); scheduleAutoSave(); }}
                      data-testid="textarea-lessons"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Sun className="h-3.5 w-3.5 text-amber-500" />
                      How might this show up in daily life?
                    </label>
                    <Textarea
                      placeholder="Ways this experience could influence your everyday..."
                      className="min-h-[80px] resize-none"
                      value={integrationData.dailyLifeApplication}
                      onChange={(e) => { setIntegrationData({ ...integrationData, dailyLifeApplication: e.target.value }); scheduleAutoSave(); }}
                      data-testid="textarea-daily-life"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Target className="h-3.5 w-3.5 text-emerald-500" />
                      One thing I want to integrate this week is...
                    </label>
                    <Textarea
                      placeholder="A specific intention or practice to focus on..."
                      className="min-h-[80px] resize-none"
                      value={integrationData.weeklyIntention}
                      onChange={(e) => { setIntegrationData({ ...integrationData, weeklyIntention: e.target.value }); scheduleAutoSave(); }}
                      data-testid="textarea-weekly-intention"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="h-5 w-5 text-slate-500" />
                Visibility & Sharing
              </CardTitle>
              <CardDescription className="text-xs">
                Control who can see your reflection
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant={status === "draft" ? "default" : "outline"}
                  size="sm"
                  onClick={() => { setStatus("draft"); scheduleAutoSave(); }}
                  data-testid="button-status-draft"
                >
                  <FileEdit className="h-4 w-4 mr-1" />
                  Draft
                </Button>
                <Button
                  type="button"
                  variant={status === "private" ? "default" : "outline"}
                  size="sm"
                  onClick={() => { setStatus("private"); scheduleAutoSave(); }}
                  data-testid="button-status-private"
                >
                  <Lock className="h-4 w-4 mr-1" />
                  Private
                </Button>
                <Button
                  type="button"
                  variant={status === "shared" ? "default" : "outline"}
                  size="sm"
                  onClick={() => { setStatus("shared"); scheduleAutoSave(); }}
                  data-testid="button-status-shared"
                >
                  <Users className="h-4 w-4 mr-1" />
                  Share with Friends
                </Button>
              </div>

              {status === "shared" && (
                <div className="space-y-4 pt-3 border-t">
                  <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                    <div className="flex items-start gap-2 text-sm">
                      <Eye className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">Who can see this</p>
                        <p className="text-muted-foreground text-xs">Only your accepted friends</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <EyeOff className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">What they can't do</p>
                        <p className="text-muted-foreground text-xs">Copy, download, or share outside the app</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <Shield className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-emerald-700 dark:text-emerald-400">Never indexed or public</p>
                        <p className="text-muted-foreground text-xs">Your reflections are never visible to search engines or strangers</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      Share expiration
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant={shareExpiration === "7days" ? "default" : "outline"}
                        size="sm"
                        onClick={() => { setShareExpiration("7days"); scheduleAutoSave(); }}
                        data-testid="button-expire-7days"
                      >
                        7 days
                      </Button>
                      <Button
                        type="button"
                        variant={shareExpiration === "30days" ? "default" : "outline"}
                        size="sm"
                        onClick={() => { setShareExpiration("30days"); scheduleAutoSave(); }}
                        data-testid="button-expire-30days"
                      >
                        30 days
                      </Button>
                      <Button
                        type="button"
                        variant={shareExpiration === "forever" ? "default" : "outline"}
                        size="sm"
                        onClick={() => { setShareExpiration("forever"); scheduleAutoSave(); }}
                        data-testid="button-expire-forever"
                      >
                        Forever
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {shareExpiration === "forever" 
                        ? "Shared until you change it" 
                        : `Automatically becomes private after ${shareExpiration === "7days" ? "7 days" : "30 days"}`}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-3 pt-2">
            <Button
              type="submit"
              disabled={mutation.isPending}
              className="flex-1"
              data-testid="button-save-report"
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Report
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
