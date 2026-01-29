import { useState, lazy, Suspense } from "react";
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
import { OnboardingModal } from "@/components/OnboardingModal";
import { QuickMoodButton } from "@/components/QuickMoodButton";
import { UsernameSetupDialog } from "@/components/UsernameSetupDialog";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Loader2 } from "lucide-react";

// Lazy load pages for code splitting - critical pages loaded eagerly
import Landing from "@/pages/Landing";
import Home from "@/pages/Home";
import NotFound from "@/pages/not-found";

// Lazy loaded pages - these are loaded on demand
const MyReports = lazy(() => import("@/pages/MyReports"));
const Friends = lazy(() => import("@/pages/Friends"));
const NewReport = lazy(() => import("@/pages/NewReport"));
const Insights = lazy(() => import("@/pages/Insights"));
const Calendar = lazy(() => import("@/pages/Calendar"));
const Resources = lazy(() => import("@/pages/Resources"));
const Timeline = lazy(() => import("@/pages/Timeline"));
const Compare = lazy(() => import("@/pages/Compare"));
const Import = lazy(() => import("@/pages/Import"));
const Profile = lazy(() => import("@/pages/Profile"));
const EditReport = lazy(() => import("@/pages/EditReport"));
const Discover = lazy(() => import("@/pages/Discover"));
const Community = lazy(() => import("@/pages/Community"));

// Loading fallback component
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

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
      <Suspense fallback={<PageLoader />}>
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
          <Route component={NotFound} />
        </Switch>
      </Suspense>
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
    <ErrorBoundary>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
