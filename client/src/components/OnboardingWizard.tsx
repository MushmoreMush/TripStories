import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Sparkles, 
  Heart, 
  BookOpen, 
  Users, 
  ArrowRight, 
  ArrowLeft,
  Check,
  PenLine
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";

interface OnboardingWizardProps {
  onComplete: () => void;
  userName?: string;
}

const steps = [
  {
    id: 1,
    icon: Sparkles,
    title: "Welcome to Trip Reporter",
    subtitle: "Your integration companion",
    content: "This isn't just a logging app. It's designed to help you carry forward the insights from your experiences into everyday life.",
    highlight: "The real work begins after the experience ends.",
  },
  {
    id: 2,
    icon: BookOpen,
    title: "Document Your Journey",
    subtitle: "Before, during, and after",
    content: "Capture your mindset going in, what happened during, and most importantly - what you want to remember and apply.",
    features: [
      "Quick logs for in-the-moment capture",
      "Full reports for deep reflection",
      "Integration prompts to extract meaning",
    ],
  },
  {
    id: 3,
    icon: Heart,
    title: "Track Your Wellbeing",
    subtitle: "See patterns over time",
    content: "Log your mood regularly to understand how your experiences connect to your overall wellbeing.",
    features: [
      "Quick mood logging anytime",
      "See trends and patterns",
      "Connect experiences to outcomes",
    ],
  },
  {
    id: 4,
    icon: Users,
    title: "Share With Trusted Friends",
    subtitle: "Optional and private",
    content: "If you choose, share select experiences with close friends. Everything stays private by default.",
    features: [
      "You control what's shared",
      "Never indexed or public",
      "Supportive reactions only",
    ],
  },
];

export function OnboardingWizard({ onComplete, userName }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [, navigate] = useLocation();

  const updateOnboardingMutation = useMutation({
    mutationFn: async (step: number) => {
      return apiRequest("/api/user/onboarding", {
        method: "POST",
        body: JSON.stringify({ step, completed: step >= steps.length }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
  });

  const handleNext = () => {
    const nextStep = currentStep + 1;
    updateOnboardingMutation.mutate(nextStep);
    
    if (nextStep >= steps.length) {
      onComplete();
    } else {
      setCurrentStep(nextStep);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    updateOnboardingMutation.mutate(steps.length);
    onComplete();
  };

  const handleStartFirstReport = () => {
    updateOnboardingMutation.mutate(steps.length);
    onComplete();
    navigate("/reports/new?prefill=true");
  };

  const step = steps[currentStep];
  const StepIcon = step.icon;
  const isLastStep = currentStep === steps.length - 1;

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg shadow-2xl border-2">
        <CardContent className="p-8">
          <div className="space-y-6">
            <div className="flex justify-center">
              <div className="flex items-center gap-2">
                {steps.map((_, index) => (
                  <div
                    key={index}
                    className={`h-2 rounded-full transition-all ${
                      index === currentStep
                        ? "w-8 bg-primary"
                        : index < currentStep
                        ? "w-2 bg-primary/60"
                        : "w-2 bg-muted"
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                  <StepIcon className="h-8 w-8 text-primary" />
                </div>
              </div>

              {currentStep === 0 && userName && (
                <p className="text-sm text-muted-foreground">
                  Hi {userName}!
                </p>
              )}

              <div className="space-y-1">
                <h2 className="text-2xl font-bold tracking-tight" data-testid="text-onboarding-title">
                  {step.title}
                </h2>
                <p className="text-muted-foreground">{step.subtitle}</p>
              </div>

              <p className="text-sm leading-relaxed">{step.content}</p>

              {step.highlight && (
                <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
                  <p className="text-sm font-medium text-primary">
                    {step.highlight}
                  </p>
                </div>
              )}

              {step.features && (
                <div className="space-y-2 text-left bg-muted/50 rounded-lg p-4">
                  {step.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between gap-3 pt-4">
              {currentStep > 0 ? (
                <Button
                  variant="ghost"
                  onClick={handleBack}
                  data-testid="button-onboarding-back"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  onClick={handleSkip}
                  className="text-muted-foreground"
                  data-testid="button-onboarding-skip"
                >
                  Skip for now
                </Button>
              )}

              {isLastStep ? (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handleNext}
                    data-testid="button-onboarding-explore"
                  >
                    Explore first
                  </Button>
                  <Button
                    onClick={handleStartFirstReport}
                    data-testid="button-onboarding-start-report"
                  >
                    <PenLine className="h-4 w-4 mr-1" />
                    Create first report
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={handleNext}
                  data-testid="button-onboarding-next"
                >
                  Continue
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
