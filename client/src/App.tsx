import { useState } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/Landing";
import Home from "@/pages/Home";
import MyReports from "@/pages/MyReports";
import Friends from "@/pages/Friends";
import NewReport from "@/pages/NewReport";
import Insights from "@/pages/Insights";
import Calendar from "@/pages/Calendar";
import Resources from "@/pages/Resources";
import Timeline from "@/pages/Timeline";
import Compare from "@/pages/Compare";
import Import from "@/pages/Import";
import Profile from "@/pages/Profile";
import EditReport from "@/pages/EditReport";
import Discover from "@/pages/Discover";
import Community from "@/pages/Community";
// New feature pages
import Messages from "@/pages/Messages";
import TripSitter from "@/pages/TripSitter";
import SafetyCheck from "@/pages/SafetyCheck";
import Mentorship from "@/pages/Mentorship";
import Settings from "@/pages/Settings";
import Challenges from "@/pages/Challenges";
import GroupExperiences from "@/pages/GroupExperiences";
import { OnboardingModal } from "@/components/OnboardingModal";
import { QuickMoodButton } from "@/components/QuickMoodButton";
import { UsernameSetupDialog } from "@/components/UsernameSetupDialog";
import { Loader2 } from "lucide-react";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Landing />;
  }

  return (
    <AuthenticatedLayout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/my-reports" component={MyReports} />
        <Route path="/friends" component={Friends} />
        <Route path="/new-report" component={NewReport} />
        <Route path="/reports/new" component={NewReport} />
        <Route path="/insights" component={Insights} />
        <Route path="/calendar" component={Calendar} />
        <Route path="/resources" component={Resources} />
        <Route path="/timeline" component={Timeline} />
        <Route path="/compare" component={Compare} />
        <Route path="/discover" component={Discover} />
        <Route path="/community" component={Community} />
        <Route path="/import" component={Import} />
        <Route path="/profile" component={Profile} />
        <Route path="/edit-report/:id" component={EditReport} />
        {/* New feature routes */}
        <Route path="/messages" component={Messages} />
        <Route path="/trip-sitter" component={TripSitter} />
        <Route path="/safety" component={SafetyCheck} />
        <Route path="/mentorship" component={Mentorship} />
        <Route path="/settings" component={Settings} />
        <Route path="/challenges" component={Challenges} />
        <Route path="/groups" component={GroupExperiences} />
        <Route component={NotFound} />
      </Switch>
    </AuthenticatedLayout>
  );
}

function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [usernameDialogDismissed, setUsernameDialogDismissed] = useState(false);
  
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  const needsUsername = user && !user.username && !usernameDialogDismissed;

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1">
          <header className="sticky top-0 z-50 flex h-14 items-center justify-between gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-auto bg-background">
            {children}
          </main>
        </div>
      </div>
      {needsUsername && (
        <UsernameSetupDialog 
          user={user} 
          open={true} 
          onComplete={() => setUsernameDialogDismissed(true)} 
        />
      )}
      <OnboardingModal />
      <QuickMoodButton />
    </SidebarProvider>
  );
}

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
