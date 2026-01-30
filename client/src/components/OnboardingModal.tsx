import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { OnboardingWizard } from "./OnboardingWizard";
import type { User } from "@shared/schema";

export function OnboardingModal() {
  const [showWizard, setShowWizard] = useState(false);

  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["/api/auth/user"],
  });

  useEffect(() => {
    if (!isLoading && user && !user.hasCompletedOnboarding) {
      setShowWizard(true);
    }
  }, [user, isLoading]);

  const handleComplete = () => {
    setShowWizard(false);
  };

  if (!showWizard) return null;

  return (
    <OnboardingWizard 
      onComplete={handleComplete}
      userName={user?.firstName || undefined}
    />
  );
}
