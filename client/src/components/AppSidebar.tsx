import { useLocation, Link } from "wouter";
import { Home, FileText, Users, PlusCircle, LogOut, BarChart3, Compass, Calendar, BookOpen, Clock, Upload, Settings, User, Zap, Scale, MessageCircle, Shield, Heart, Trophy, UsersRound, Mail, AlertTriangle, ClipboardCheck } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { QuickLogModal } from "@/components/QuickLogModal";

const navItems = [
  { title: "Feed", url: "/", icon: Compass, description: "See your community" },
  { title: "Community", url: "/community", icon: MessageCircle, description: "Chat with others" },
  { title: "Messages", url: "/messages", icon: Mail, description: "Private chats" },
  { title: "Discover", url: "/discover", icon: Users, description: "Friends' shared experiences" },
  { title: "Integration Journal", url: "/my-reports", icon: FileText, description: "Your journey log" },
  { title: "Timeline", url: "/timeline", icon: Clock, description: "Your journey growth" },
  { title: "Patterns & Learnings", url: "/insights", icon: BarChart3, description: "Personal patterns" },
  { title: "Challenges", url: "/challenges", icon: Trophy, description: "Weekly goals" },
  { title: "Calendar", url: "/calendar", icon: Calendar, description: "Journey timeline" },
  { title: "Friends", url: "/friends", icon: Users, description: "Your circle" },
];

const safetyItems = [
  { title: "Pre-Trip Checklist", url: "/checklist", icon: ClipboardCheck, description: "Preparation guide" },
  { title: "Trip Sitter", url: "/trip-sitter", icon: Shield, description: "Safety check-ins" },
  { title: "Safety Check", url: "/safety", icon: AlertTriangle, description: "Interaction checker" },
  { title: "Resources", url: "/resources", icon: BookOpen, description: "Harm reduction" },
];

const socialItems = [
  { title: "Group Experiences", url: "/groups", icon: UsersRound, description: "Shared journeys" },
  { title: "Mentorship", url: "/mentorship", icon: Heart, description: "Connect with guides" },
];

const toolItems = [
  { title: "Compare Journeys", url: "/compare", icon: Scale, description: "Side-by-side comparison" },
  { title: "Import", url: "/import", icon: Upload, description: "Import external data" },
  { title: "Profile", url: "/profile", icon: User, description: "Edit your profile" },
  { title: "Settings", url: "/settings", icon: Settings, description: "App preferences" },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { user } = useAuth();

  const userInitials = user?.username?.[0]?.toUpperCase() || "U";

  const displayName = user?.username || "Anonymous";

  return (
    <Sidebar>
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-primary via-purple-500 to-accent flex items-center justify-center shadow-lg shadow-primary/20">
            <Compass className="h-5 w-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-sm tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Trip Reporter</span>
            <span className="text-xs text-muted-foreground">Medical Wellness Journal</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 overflow-y-auto">
        <SidebarGroup className="pt-4">
          <SidebarGroupLabel className="text-xs font-medium text-muted-foreground px-2 mb-2">
            Navigate
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                    className="rounded-lg"
                    data-testid={`nav-${item.title.toLowerCase().replace(" ", "-")}`}
                  >
                    <Link href={item.url} className="flex items-center gap-3 px-3 py-2.5">
                      <item.icon className="h-4 w-4" />
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{item.title}</span>
                      </div>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="pt-4">
          <SidebarGroupLabel className="text-xs font-medium text-muted-foreground px-2 mb-2">
            Safety
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {safetyItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                    className="rounded-lg"
                  >
                    <Link href={item.url} className="flex items-center gap-3 px-3 py-2.5">
                      <item.icon className="h-4 w-4" />
                      <span className="text-sm font-medium">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="pt-4">
          <SidebarGroupLabel className="text-xs font-medium text-muted-foreground px-2 mb-2">
            Social
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {socialItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                    className="rounded-lg"
                  >
                    <Link href={item.url} className="flex items-center gap-3 px-3 py-2.5">
                      <item.icon className="h-4 w-4" />
                      <span className="text-sm font-medium">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="pt-4">
          <SidebarGroupLabel className="text-xs font-medium text-muted-foreground px-2 mb-2">
            Tools
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {toolItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                    className="rounded-lg"
                  >
                    <Link href={item.url} className="flex items-center gap-3 px-3 py-2.5">
                      <item.icon className="h-4 w-4" />
                      <span className="text-sm font-medium">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="pt-4">
          <SidebarGroupLabel className="text-xs font-medium text-muted-foreground px-2 mb-2">
            Quick Actions
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={location === "/new-report"}
                  className="rounded-lg bg-gradient-to-r from-primary/15 to-accent/15 border border-primary/25"
                  data-testid="nav-new-report"
                >
                  <Link href="/new-report" className="flex items-center gap-3 px-3 py-2.5">
                    <div className="h-5 w-5 rounded-md bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                      <PlusCircle className="h-3 w-3 text-white" />
                    </div>
                    <span className="text-sm font-medium">Full Report</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <QuickLogModal
                  trigger={
                    <SidebarMenuButton
                      className="rounded-lg bg-gradient-to-r from-amber-500/15 to-orange-500/15 border border-amber-500/25 w-full"
                      data-testid="nav-quick-log"
                    >
                      <div className="flex items-center gap-3 px-3 py-2.5 w-full">
                        <div className="h-5 w-5 rounded-md bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                          <Zap className="h-3 w-3 text-white" />
                        </div>
                        <span className="text-sm font-medium">Quick Log</span>
                      </div>
                    </SidebarMenuButton>
                  }
                />
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-sidebar-border">
        <Link href="/profile">
          <div className="flex items-center gap-3 mb-3 p-2 rounded-lg bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/10 hover-elevate cursor-pointer" data-testid="link-profile">
            <Avatar className="h-9 w-9 ring-2 ring-background shadow-md">
              <AvatarImage
                src={user?.profileImageUrl || undefined}
                alt={displayName}
                className="object-cover"
              />
              <AvatarFallback className="bg-gradient-to-br from-primary via-purple-500 to-accent text-white text-sm font-semibold">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="font-medium text-sm truncate" data-testid="text-current-user">
                {displayName}
              </span>
              <span className="text-xs text-muted-foreground truncate">
                {user?.email || ""}
              </span>
            </div>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </div>
        </Link>
        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground"
          asChild
          data-testid="button-logout"
        >
          <a href="/api/logout">
            <LogOut className="h-4 w-4 mr-2" />
            Log out
          </a>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
