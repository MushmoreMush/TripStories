import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { TripReportCard } from "@/components/TripReportCard";
import { Users, Search, Filter, Heart, Compass, Sparkles } from "lucide-react";
import type { TripReportWithUser, User } from "@shared/schema";
import { Link } from "wouter";

export default function Discover() {
  const [selectedFriend, setSelectedFriend] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [substanceFilter, setSubstanceFilter] = useState<string>("all");
  const [recencyFilter, setRecencyFilter] = useState<string>("all");

  const { data: currentUser } = useQuery<User>({
    queryKey: ["/api/auth/user"],
  });

  const { data: friends = [] } = useQuery<User[]>({
    queryKey: ["/api/friends"],
  });

  const buildQueryString = () => {
    const params = new URLSearchParams();
    if (selectedFriend !== "all") params.set("friendId", selectedFriend);
    if (searchTerm) params.set("search", searchTerm);
    if (substanceFilter !== "all") params.set("substance", substanceFilter);
    
    if (recencyFilter !== "all") {
      const now = new Date();
      const dateFrom = new Date();
      switch (recencyFilter) {
        case "7":
          dateFrom.setDate(now.getDate() - 7);
          break;
        case "30":
          dateFrom.setDate(now.getDate() - 30);
          break;
        case "90":
          dateFrom.setDate(now.getDate() - 90);
          break;
      }
      params.set("dateFrom", dateFrom.toISOString());
    }
    return params.toString();
  };

  const { data: reports = [], isLoading } = useQuery<TripReportWithUser[]>({
    queryKey: ["/api/discover", selectedFriend, searchTerm, substanceFilter, recencyFilter],
    queryFn: async () => {
      const qs = buildQueryString();
      const url = `/api/discover${qs ? `?${qs}` : ""}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch discovery feed");
      return res.json();
    },
  });

  const substances = [...new Set(reports.map((r) => r.substance))];

  return (
    <div className="container max-w-4xl mx-auto p-4 space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Compass className="h-6 w-6 text-primary" />
          Discovery Feed
        </h1>
        <p className="text-muted-foreground">
          Explore shared experiences from your trusted friends
        </p>
      </div>

      {friends.length === 0 ? (
        <Card className="bg-gradient-to-br from-primary/5 to-accent/5">
          <CardContent className="p-8 text-center space-y-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Users className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Connect with Friends</h3>
              <p className="text-muted-foreground text-sm mt-1">
                Add friends to see their shared experiences in your discovery feed
              </p>
            </div>
            <Link href="/friends">
              <Button data-testid="link-find-friends">
                <Users className="h-4 w-4 mr-2" />
                Find Friends
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search experiences..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                    data-testid="input-search-discover"
                  />
                </div>
                <Select value={selectedFriend} onValueChange={setSelectedFriend}>
                  <SelectTrigger className="w-full sm:w-[180px]" data-testid="select-friend-filter">
                    <SelectValue placeholder="Filter by friend" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Friends</SelectItem>
                    {friends.map((friend) => (
                      <SelectItem key={friend.id} value={friend.id}>
                        {friend.username || "Anonymous"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={substanceFilter} onValueChange={setSubstanceFilter}>
                  <SelectTrigger className="w-full sm:w-[140px]" data-testid="select-substance-filter">
                    <SelectValue placeholder="Substance" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {substances.map((substance) => (
                      <SelectItem key={substance} value={substance}>
                        {substance}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={recencyFilter} onValueChange={setRecencyFilter}>
                  <SelectTrigger className="w-full sm:w-[130px]" data-testid="select-recency-filter">
                    <SelectValue placeholder="Recency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="7">Last 7 days</SelectItem>
                    <SelectItem value="30">Last 30 days</SelectItem>
                    <SelectItem value="90">Last 90 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <Skeleton className="h-32 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : reports.length === 0 ? (
            <Card className="bg-gradient-to-br from-muted/50 to-muted/30">
              <CardContent className="p-8 text-center space-y-4">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto">
                  <Sparkles className="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">No Shared Experiences Yet</h3>
                  <p className="text-muted-foreground text-sm mt-1">
                    {selectedFriend !== "all" 
                      ? "This friend hasn't shared any experiences with you yet"
                      : "Your friends haven't shared any experiences yet"}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  When friends share their experiences, they'll appear here
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {reports.length} shared experience{reports.length !== 1 ? "s" : ""}
                </p>
              </div>
              {reports.map((report) => (
                <TripReportCard
                  key={report.id}
                  report={report}
                  showUser={true}
                  currentUser={currentUser}
                />
              ))}
            </div>
          )}
        </>
      )}

      <Card className="bg-gradient-to-br from-accent/5 to-primary/5 border-accent/20">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Heart className="h-4 w-4 text-accent" />
            About Discovery
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            This feed shows experiences that your friends have chosen to share with their trusted circle.
          </p>
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li>Only shared reports appear here - drafts and private reports remain hidden</li>
            <li>Expired shares are automatically removed</li>
            <li>React and comment to show support for your friends' journeys</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
