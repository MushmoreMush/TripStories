import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { Sparkles, Brain, MapPin, BookOpen, X, ArrowLeft, Save, Loader2, Users, Lightbulb, Heart, Sun, Target, ChevronDown, ChevronUp } from "lucide-react";
import type { User } from "@shared/schema";
import { SUBSTANCES, SUGGESTED_TAGS, EXPERIENCE_TEMPLATES } from "@shared/constants";
import { basicReportFormSchema, type BasicReportFormValues } from "@shared/formSchemas";

// Map icon names to components for templates
const iconMap: Record<string, typeof Heart> = {
  heart: Heart,
  sparkles: Sparkles,
  sun: Sun,
  target: Target,
  lightbulb: Lightbulb,
};

const PREFILL_EXAMPLES = {
  substance: "Psilocybin",
  amount: "2g dried mushrooms",
  setMindset: "Feeling curious and open today. I've been thinking about some patterns in my life that I want to understand better. Setting an intention to stay present and accept whatever comes up.",
  setting: "At home in my comfortable living room. Soft ambient music playing, candles lit. My partner is nearby as a sitter. Phone is off and I've cleared my schedule for the day.",
  experience: "The experience began gently after about 45 minutes. Colors became more vivid and I noticed subtle patterns in ordinary objects. Around the peak, I felt a deep sense of connection to everything around me. Some moments felt challenging but I reminded myself to breathe and trust the process. Insights about my relationships started surfacing - particularly about how I sometimes hold back from expressing my true feelings. The comedown was gradual and peaceful, filled with gratitude.",
};

export default function NewReport() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [companions, setCompanions] = useState<string[]>([]);
  const [showIntegrationPrompts, setShowIntegrationPrompts] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(true);
  const [integrationData, setIntegrationData] = useState({
    whatSurprised: "",
    lessonsToRemember: "",
    dailyLifeApplication: "",
    weeklyIntention: "",
  });

  const searchParams = new URLSearchParams(window.location.search);
  const shouldPrefill = searchParams.get("prefill") === "true";

  const { data: friends = [] } = useQuery<User[]>({
    queryKey: ["/api/friends"],
  });

  const form = useForm<BasicReportFormValues>({
    resolver: zodResolver(basicReportFormSchema),
    defaultValues: shouldPrefill ? {
      substance: PREFILL_EXAMPLES.substance,
      amount: PREFILL_EXAMPLES.amount,
      setMindset: PREFILL_EXAMPLES.setMindset,
      setting: PREFILL_EXAMPLES.setting,
      experience: PREFILL_EXAMPLES.experience,
    } : {
      substance: "",
      amount: "",
      setMindset: "",
      setting: "",
      experience: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: BasicReportFormValues) => {
      await apiRequest("POST", "/api/reports", {
        ...data,
        tags,
        isAnonymous,
        companionIds: companions.length > 0 ? companions : undefined,
        whatSurprised: integrationData.whatSurprised || undefined,
        lessonsToRemember: integrationData.lessonsToRemember || undefined,
        dailyLifeApplication: integrationData.dailyLifeApplication || undefined,
        weeklyIntention: integrationData.weeklyIntention || undefined,
      });
    },
    onSuccess: () => {
      toast({ title: "Report saved", description: "Your experience has been documented" });
      queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
      queryClient.invalidateQueries({ queryKey: ["/api/feed"] });
      navigate("/my-reports");
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({ title: "Unauthorized", description: "Logging in again...", variant: "destructive" });
        setTimeout(() => { window.location.href = "/api/login"; }, 500);
        return;
      }
      toast({ title: "Error", description: "Failed to save report", variant: "destructive" });
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

  const applyTemplate = (templateId: string) => {
    const template = EXPERIENCE_TEMPLATES.find(t => t.id === templateId);
    if (template) {
      form.setValue("setMindset", template.defaults.setMindset);
      form.setValue("setting", template.defaults.setting);
      setTags(template.suggestedTags);
      setSelectedTemplate(templateId);
      setShowTemplates(false);
      toast({
        title: `${template.name} template applied`,
        description: "Mindset and setting have been pre-filled. Feel free to customize!",
      });
    }
  };

  return (
    <div className="container max-w-2xl mx-auto py-6 px-4 md:px-6">
      <Button
        variant="ghost"
        className="mb-4"
        onClick={() => navigate("/my-reports")}
        data-testid="button-back"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Reports
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            New Trip Report
          </CardTitle>
          <CardDescription>
            Document your experience with care. Your report is private and only shared with friends.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {showTemplates && !shouldPrefill && (
            <div className="mb-6 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Start with a template (optional)</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowTemplates(false)}
                  data-testid="button-skip-templates"
                >
                  Skip
                </Button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {EXPERIENCE_TEMPLATES.map((template) => {
                  const Icon = iconMap[template.icon] || Heart;
                  return (
                    <Button
                      key={template.id}
                      variant={selectedTemplate === template.id ? "default" : "outline"}
                      className="h-auto flex-col items-start p-3 gap-1"
                      onClick={() => applyTemplate(template.id)}
                      data-testid={`button-template-${template.id}`}
                    >
                      <div className="flex items-center gap-2 w-full">
                        <Icon className="h-4 w-4 shrink-0" />
                        <span className="text-sm font-medium truncate">{template.name}</span>
                      </div>
                      <span className="text-xs text-muted-foreground text-left line-clamp-1">
                        {template.description}
                      </span>
                    </Button>
                  );
                })}
              </div>
            </div>
          )}
          
          {selectedTemplate && !showTemplates && (
            <div className="mb-4 flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {EXPERIENCE_TEMPLATES.find(t => t.id === selectedTemplate)?.name} template
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs"
                onClick={() => setShowTemplates(true)}
              >
                Change
              </Button>
            </div>
          )}
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-6">
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
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-substance">
                            <SelectValue placeholder="Select substance" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {SUBSTANCES.map((s) => (
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
                          data-testid="input-amount"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

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
                        data-testid="textarea-setting"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                
                <div className="space-y-3 pt-2">
                  <p className="text-xs text-muted-foreground font-medium">Suggested tags:</p>
                  <div className="space-y-2">
                    <div>
                      <span className="text-xs text-muted-foreground">Effects:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {SUGGESTED_TAGS.effects.filter(t => !tags.includes(t)).map((tag) => (
                          <Badge
                            key={tag}
                            variant="outline"
                            className="cursor-pointer text-xs"
                            onClick={() => setTags([...tags, tag])}
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Emotions:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {SUGGESTED_TAGS.emotions.filter(t => !tags.includes(t)).map((tag) => (
                          <Badge
                            key={tag}
                            variant="outline"
                            className="cursor-pointer text-xs"
                            onClick={() => setTags([...tags, tag])}
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Insights:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {SUGGESTED_TAGS.insights.filter(t => !tags.includes(t)).map((tag) => (
                          <Badge
                            key={tag}
                            variant="outline"
                            className="cursor-pointer text-xs"
                            onClick={() => setTags([...tags, tag])}
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Click suggested tags to add them, or type your own. Click added tags to remove.
                </p>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowIntegrationPrompts(!showIntegrationPrompts)}
                  className="flex items-center justify-between w-full text-left"
                  data-testid="toggle-integration-prompts"
                >
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-5 rounded-md bg-gradient-to-br from-amber-500/20 to-amber-500/10 flex items-center justify-center">
                      <Lightbulb className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                    </div>
                    <span className="text-sm font-medium">Integration Prompts</span>
                    <span className="text-xs text-muted-foreground">(optional)</span>
                  </div>
                  {showIntegrationPrompts ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
                
                {showIntegrationPrompts && (
                  <div className="space-y-4 pl-7">
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
                        onChange={(e) => setIntegrationData({ ...integrationData, whatSurprised: e.target.value })}
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
                        onChange={(e) => setIntegrationData({ ...integrationData, lessonsToRemember: e.target.value })}
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
                        onChange={(e) => setIntegrationData({ ...integrationData, dailyLifeApplication: e.target.value })}
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
                        onChange={(e) => setIntegrationData({ ...integrationData, weeklyIntention: e.target.value })}
                        data-testid="textarea-weekly-intention"
                      />
                    </div>
                  </div>
                )}
              </div>

              {friends.length > 0 && (
                <div className="space-y-4 pt-2 border-t">
                  <div>
                    <FormLabel className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Companions (optional)
                    </FormLabel>
                    <p className="text-xs text-muted-foreground mt-1">
                      Tag friends who shared this experience with you
                    </p>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {friends.map((friend) => {
                      const isSelected = companions.includes(friend.id);
                      const initials = friend.username?.[0]?.toUpperCase() || "U";
                      const name = friend.username || "Anonymous";
                      
                      return (
                        <div
                          key={friend.id}
                          className={`flex items-center gap-3 p-2 rounded-lg border cursor-pointer transition-colors ${
                            isSelected 
                              ? "bg-primary/10 border-primary/30" 
                              : "bg-background border-input hover-elevate"
                          }`}
                          onClick={() => {
                            if (isSelected) {
                              setCompanions(companions.filter(c => c !== friend.id));
                            } else {
                              setCompanions([...companions, friend.id]);
                            }
                          }}
                          data-testid={`companion-${friend.id}`}
                        >
                          <Checkbox 
                            checked={isSelected} 
                            className="pointer-events-none"
                          />
                          <Avatar className="h-7 w-7">
                            <AvatarImage 
                              src={friend.profileImageUrl || undefined} 
                              alt={name}
                              className="object-cover"
                            />
                            <AvatarFallback className="text-xs bg-primary/10 text-primary">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium truncate">{name}</span>
                        </div>
                      );
                    })}
                  </div>
                  {companions.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {companions.length} companion{companions.length !== 1 ? "s" : ""} selected
                    </p>
                  )}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={mutation.isPending}
                  className="flex-1"
                  data-testid="button-submit-report"
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
        </CardContent>
      </Card>
    </div>
  );
}
