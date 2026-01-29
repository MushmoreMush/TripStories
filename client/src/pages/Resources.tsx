import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BookOpen, Shield, Heart, Brain, Sparkles, 
  ChevronRight, ExternalLink, Clock, AlertTriangle, Compass
} from "lucide-react";

interface Resource {
  id: string;
  title: string;
  description: string;
  category: "harm-reduction" | "integration" | "preparation" | "support";
  readTime: string;
  content: string[];
  keyPoints: string[];
}

const RESOURCES: Resource[] = [
  {
    id: "set-and-setting",
    title: "Set and Setting: The Foundation",
    description: "Understanding how your mindset and environment shape your experience",
    category: "preparation",
    readTime: "5 min",
    content: [
      "Set refers to your mindset—your intentions, expectations, emotional state, and mental preparation before an experience. A clear, positive mindset and genuine intention can help guide a meaningful journey.",
      "Setting refers to the physical and social environment. This includes the location, people present, comfort level, and any external stimuli like music or lighting.",
      "Research consistently shows that these two factors are often more predictive of experience quality than the substance itself. Taking time to prepare both can significantly reduce challenging experiences."
    ],
    keyPoints: [
      "Clarify your intentions before each experience",
      "Choose a safe, comfortable, familiar environment",
      "Have trusted people present when possible",
      "Prepare the space: lighting, temperature, music",
      "Address any anxiety or concerns beforehand"
    ]
  },
  {
    id: "dosing-safety",
    title: "Dosing and Safety Guidelines",
    description: "Start low, go slow—practical guidance for responsible use",
    category: "harm-reduction",
    readTime: "7 min",
    content: [
      "The single most important harm reduction principle is to start with a lower dose than you think you need. Sensitivity varies dramatically between individuals, and you can always take more another time.",
      "Testing your substances with reagent kits helps verify what you have. Many harm reduction organizations offer free or low-cost testing services.",
      "Timing matters: allow adequate time between experiences for your body and mind to recover. Different substances have different recommended intervals."
    ],
    keyPoints: [
      "Start with a fraction of a typical dose for new substances",
      "Test substances when possible using reagent kits",
      "Research interactions with any medications you take",
      "Stay hydrated but don't over-drink water",
      "Have a sober tripsitter for significant experiences"
    ]
  },
  {
    id: "integration-basics",
    title: "Integration: Making Meaning",
    description: "How to process and apply insights from your experiences",
    category: "integration",
    readTime: "6 min",
    content: [
      "Integration is the process of making sense of your experiences and incorporating any insights into daily life. Without integration, even profound experiences may fade without lasting benefit.",
      "The integration window is typically most potent in the first 24-72 hours after an experience, when memories and insights are freshest. Journaling during this time is especially valuable.",
      "Integration is ongoing work. Insights often unfold over weeks or months. Regular reflection, therapy, and community support can help deepen understanding."
    ],
    keyPoints: [
      "Journal within 24 hours while memories are fresh",
      "Identify 1-3 key insights or themes from the experience",
      "Create specific action items for integrating lessons",
      "Consider working with an integration therapist",
      "Share with trusted friends or integration circles"
    ]
  },
  {
    id: "challenging-experiences",
    title: "Navigating Challenging Experiences",
    description: "Tools and techniques for difficult moments",
    category: "support",
    readTime: "8 min",
    content: [
      "Challenging experiences, while uncomfortable, are often where the most growth occurs. They're not necessarily 'bad trips' but opportunities for healing and insight.",
      "When difficulty arises: change your environment, put on calming music, hold something comforting, or move your body gently. Sometimes simply changing rooms or going outside can shift the experience.",
      "Breathwork is one of the most powerful tools: slow, deep breaths can activate the parasympathetic nervous system and reduce anxiety. Focus on exhaling longer than inhaling."
    ],
    keyPoints: [
      "Remind yourself: this is temporary and will pass",
      "Practice slow, deep breathing (4-7-8 pattern)",
      "Change your environment if possible",
      "Accept rather than resist difficult feelings",
      "Have a trusted person offer calm, reassuring presence"
    ]
  },
  {
    id: "substance-interactions",
    title: "Substance Interactions",
    description: "Understanding risks when combining substances",
    category: "harm-reduction",
    readTime: "6 min",
    content: [
      "Combining substances significantly increases unpredictability and risk. Even substances that seem safe individually can interact dangerously.",
      "MAOI interactions are particularly dangerous with many psychedelics, especially with substances like ayahuasca. Research thoroughly before any combination.",
      "Mental health medications, particularly SSRIs and lithium, can have serious interactions with many psychedelics. Always consult reliable resources and consider discussing with a healthcare provider."
    ],
    keyPoints: [
      "Research every combination thoroughly before use",
      "Avoid combining with MAOIs or SSRIs unless researched",
      "Alcohol typically diminishes and complicates experiences",
      "Cannabis can intensify experiences unpredictably",
      "When in doubt, don't combine"
    ]
  },
  {
    id: "community-support",
    title: "Finding Community and Support",
    description: "Resources for connection and ongoing support",
    category: "support",
    readTime: "4 min",
    content: [
      "Having community around psychedelic experiences can provide invaluable support, perspective, and accountability. Integration circles and peer support groups exist in many areas.",
      "Online communities can offer connection, especially for those in areas without local resources. Look for moderated spaces with harm reduction values.",
      "Professional support from therapists trained in psychedelic integration is increasingly available. They can help process difficult experiences and deepen integration."
    ],
    keyPoints: [
      "Seek integration circles in your area",
      "Connect with harm reduction organizations",
      "Consider working with an integration therapist",
      "Join moderated online communities",
      "Build relationships with experienced, trusted individuals"
    ]
  },
];

const TEMPLATES = [
  {
    substance: "Psilocybin",
    prompts: {
      setMindset: "What is your intention for this journey? What are you hoping to understand or heal? How is your emotional state going into this experience?",
      setting: "Describe your environment: Where are you? Who is with you? What music or sounds will be present? Have you prepared the space?",
      experience: "Describe the arc of your journey... What visuals or sensations stood out? What emotions arose? What insights or realizations came through?"
    }
  },
  {
    substance: "LSD",
    prompts: {
      setMindset: "What aspects of your consciousness do you want to explore? Are there any specific questions you're bringing? How have you prepared mentally?",
      setting: "Describe your setting and timeline. Who will be present? What activities do you have planned? Have you cleared your schedule for the duration?",
      experience: "Map your experience from onset to resolution... What patterns of thought emerged? How did your perception shift? What connections did you make?"
    }
  },
  {
    substance: "MDMA",
    prompts: {
      setMindset: "What emotional work or connection do you want to foster? Are there relationships or feelings you want to explore? How are you taking care of your body beforehand?",
      setting: "Describe your environment and companions. What is the social context? How will you stay cool and hydrated? Do you have quiet space available if needed?",
      experience: "Describe the emotional journey... What feelings surfaced? What insights about yourself or relationships emerged? How did you connect with others?"
    }
  },
  {
    substance: "Ketamine",
    prompts: {
      setMindset: "What therapeutic goals do you have for this session? Are you working with a provider? What mental preparation have you done?",
      setting: "Describe your setting: Is this a clinical or personal context? What safety measures are in place? How will you remain comfortable during the experience?",
      experience: "Describe your journey through dissociation... What perspectives emerged? How did your relationship to your body or thoughts shift? What insights arose?"
    }
  },
  {
    substance: "DMT",
    prompts: {
      setMindset: "How have you prepared for the intensity of this experience? What is your relationship with letting go? What do you hope to encounter or understand?",
      setting: "Describe your safe space: Who is with you? How will you be positioned? What will be there to comfort you upon return?",
      experience: "Attempt to describe the ineffable... What entities or dimensions appeared? What was the felt quality of the experience? What did you bring back?"
    }
  },
];

const CATEGORY_INFO = {
  "harm-reduction": { icon: Shield, color: "text-red-500", bg: "bg-red-500/10" },
  "integration": { icon: Brain, color: "text-purple-500", bg: "bg-purple-500/10" },
  "preparation": { icon: Compass, color: "text-blue-500", bg: "bg-blue-500/10" },
  "support": { icon: Heart, color: "text-pink-500", bg: "bg-pink-500/10" },
};

function ResourceCard({ resource, onSelect }: { resource: Resource; onSelect: () => void }) {
  const categoryInfo = CATEGORY_INFO[resource.category];
  const Icon = categoryInfo.icon;

  return (
    <Card className="hover-elevate cursor-pointer" onClick={onSelect} data-testid={`resource-card-${resource.id}`}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className={`h-10 w-10 rounded-lg ${categoryInfo.bg} flex items-center justify-center`}>
            <Icon className={`h-5 w-5 ${categoryInfo.color}`} />
          </div>
          <Badge variant="outline" className="text-xs">
            <Clock className="h-3 w-3 mr-1" />
            {resource.readTime}
          </Badge>
        </div>
        <CardTitle className="text-lg mt-2">{resource.title}</CardTitle>
        <CardDescription>{resource.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button variant="ghost" size="sm" className="w-full justify-between" data-testid={`button-read-${resource.id}`}>
          Read article
          <ChevronRight className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}

function ResourceDetail({ resource, onBack }: { resource: Resource; onBack: () => void }) {
  const categoryInfo = CATEGORY_INFO[resource.category];
  const Icon = categoryInfo.icon;

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={onBack} data-testid="button-back-to-resources">
        <ChevronRight className="h-4 w-4 rotate-180 mr-2" />
        Back to Resources
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className={`h-10 w-10 rounded-lg ${categoryInfo.bg} flex items-center justify-center`}>
              <Icon className={`h-5 w-5 ${categoryInfo.color}`} />
            </div>
            <Badge variant="outline" className="capitalize">{resource.category.replace("-", " ")}</Badge>
          </div>
          <CardTitle className="text-2xl">{resource.title}</CardTitle>
          <CardDescription className="text-base">{resource.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            {resource.content.map((paragraph, i) => (
              <p key={i} className="text-muted-foreground leading-relaxed">
                {paragraph}
              </p>
            ))}
          </div>

          <div className="bg-muted/50 rounded-lg p-4">
            <h3 className="font-medium mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500" />
              Key Points
            </h3>
            <ul className="space-y-2">
              {resource.keyPoints.map((point, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-amber-700 dark:text-amber-400">Important Reminder</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  This information is for harm reduction purposes only. Always research thoroughly, start low, and prioritize safety. Consider seeking professional guidance for therapeutic use.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function TemplateCard({ template }: { template: typeof TEMPLATES[0] }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card data-testid={`template-card-${template.substance.toLowerCase()}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-lg">{template.substance}</CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setExpanded(!expanded)}
            data-testid={`button-toggle-template-${template.substance.toLowerCase()}`}
          >
            {expanded ? "Collapse" : "View Prompts"}
            <ChevronRight className={`h-4 w-4 ml-1 transition-transform ${expanded ? "rotate-90" : ""}`} />
          </Button>
        </div>
        <CardDescription>Guided journaling prompts for {template.substance.toLowerCase()} experiences</CardDescription>
      </CardHeader>
      {expanded && (
        <CardContent className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-1">Set / Mindset</h4>
            <p className="text-sm bg-muted/50 p-3 rounded-lg">{template.prompts.setMindset}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-1">Setting</h4>
            <p className="text-sm bg-muted/50 p-3 rounded-lg">{template.prompts.setting}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-1">Experience</h4>
            <p className="text-sm bg-muted/50 p-3 rounded-lg">{template.prompts.experience}</p>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

export default function Resources() {
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const filteredResources = categoryFilter === "all" 
    ? RESOURCES 
    : RESOURCES.filter(r => r.category === categoryFilter);

  if (selectedResource) {
    return (
      <div className="max-w-3xl mx-auto p-6 md:p-8">
        <ResourceDetail resource={selectedResource} onBack={() => setSelectedResource(null)} />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-8 space-y-8">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500/20 to-emerald-500/5">
            <BookOpen className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight" data-testid="heading-resources">
            Resource Library
          </h1>
        </div>
        <p className="text-muted-foreground pl-10">
          Harm reduction knowledge and integration practices
        </p>
      </div>

      <Tabs defaultValue="articles" className="space-y-6">
        <TabsList>
          <TabsTrigger value="articles" data-testid="tab-articles">
            <BookOpen className="h-4 w-4 mr-2" />
            Articles
          </TabsTrigger>
          <TabsTrigger value="templates" data-testid="tab-templates">
            <Sparkles className="h-4 w-4 mr-2" />
            Experience Templates
          </TabsTrigger>
        </TabsList>

        <TabsContent value="articles" className="space-y-6">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={categoryFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setCategoryFilter("all")}
              data-testid="filter-all"
            >
              All
            </Button>
            <Button
              variant={categoryFilter === "harm-reduction" ? "default" : "outline"}
              size="sm"
              onClick={() => setCategoryFilter("harm-reduction")}
              data-testid="filter-harm-reduction"
            >
              <Shield className="h-4 w-4 mr-1" />
              Harm Reduction
            </Button>
            <Button
              variant={categoryFilter === "preparation" ? "default" : "outline"}
              size="sm"
              onClick={() => setCategoryFilter("preparation")}
              data-testid="filter-preparation"
            >
              <Compass className="h-4 w-4 mr-1" />
              Preparation
            </Button>
            <Button
              variant={categoryFilter === "integration" ? "default" : "outline"}
              size="sm"
              onClick={() => setCategoryFilter("integration")}
              data-testid="filter-integration"
            >
              <Brain className="h-4 w-4 mr-1" />
              Integration
            </Button>
            <Button
              variant={categoryFilter === "support" ? "default" : "outline"}
              size="sm"
              onClick={() => setCategoryFilter("support")}
              data-testid="filter-support"
            >
              <Heart className="h-4 w-4 mr-1" />
              Support
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredResources.map((resource) => (
              <ResourceCard
                key={resource.id}
                resource={resource}
                onSelect={() => setSelectedResource(resource)}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium">Guided Journaling Templates</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    These prompts are designed to help you reflect deeply on your experiences. 
                    Use them as starting points—modify them to fit your personal practice.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            {TEMPLATES.map((template) => (
              <TemplateCard key={template.substance} template={template} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
