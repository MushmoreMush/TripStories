import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { UserPlus, Check, X, Users, Search, Clock, Heart, Sparkles, Send } from "lucide-react";
import type { User, FriendshipWithUsers } from "@shared/schema";

export default function Friends() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: friends, isLoading: friendsLoading } = useQuery<User[]>({
    queryKey: ["/api/friends"],
  });

  const { data: pendingRequests, isLoading: pendingLoading } = useQuery<FriendshipWithUsers[]>({
    queryKey: ["/api/friends/pending"],
  });

  const { data: sentRequests, isLoading: sentLoading } = useQuery<FriendshipWithUsers[]>({
    queryKey: ["/api/friends/sent"],
  });

  const { data: searchResults, isLoading: searchLoading } = useQuery<User[]>({
    queryKey: ["/api/users/search", searchQuery],
    queryFn: async () => {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`);
      if (!res.ok) throw new Error(`${res.status}: ${res.statusText}`);
      return res.json();
    },
    enabled: searchQuery.length >= 2,
  });

  const sendRequestMutation = useMutation({
    mutationFn: async (addresseeId: string) => {
      await apiRequest("POST", "/api/friends/request", { addresseeId });
    },
    onSuccess: () => {
      toast({ title: "Friend request sent" });
      queryClient.invalidateQueries({ queryKey: ["/api/users/search"] });
      queryClient.invalidateQueries({ queryKey: ["/api/friends/sent"] });
    },
    onError: async (error: any) => {
      if (isUnauthorizedError(error)) {
        toast({ title: "Unauthorized", description: "Logging in again...", variant: "destructive" });
        setTimeout(() => { window.location.href = "/api/login"; }, 500);
        return;
      }
      const message = error?.message || "Failed to send request";
      toast({ title: "Could not add friend", description: message, variant: "destructive" });
    },
  });

  const respondMutation = useMutation({
    mutationFn: async ({ requestId, status }: { requestId: number; status: string }) => {
      await apiRequest("PATCH", `/api/friends/request/${requestId}`, { status });
    },
    onSuccess: (_, variables) => {
      toast({ title: variables.status === "accepted" ? "Friend added" : "Request declined" });
      queryClient.invalidateQueries({ queryKey: ["/api/friends"] });
      queryClient.invalidateQueries({ queryKey: ["/api/friends/pending"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({ title: "Unauthorized", description: "Logging in again...", variant: "destructive" });
        setTimeout(() => { window.location.href = "/api/login"; }, 500);
        return;
      }
      toast({ title: "Error", description: "Failed to respond", variant: "destructive" });
    },
  });

  const cancelRequestMutation = useMutation({
    mutationFn: async (friendshipId: number) => {
      await apiRequest("DELETE", `/api/friendships/${friendshipId}`);
    },
    onSuccess: () => {
      toast({ title: "Request cancelled" });
      queryClient.invalidateQueries({ queryKey: ["/api/friends/sent"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({ title: "Unauthorized", description: "Logging in again...", variant: "destructive" });
        setTimeout(() => { window.location.href = "/api/login"; }, 500);
        return;
      }
      toast({ title: "Error", description: "Failed to cancel request", variant: "destructive" });
    },
  });

  const getUserDisplay = (user: User) => {
    // Only show username to protect privacy
    const name = user.username || "Anonymous";
    const initials = user.username?.[0]?.toUpperCase() || "U";
    return { name, initials };
  };

  return (
    <div className="container max-w-4xl mx-auto py-6 px-4 md:px-6 space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Friends</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage your connections and find new friends
        </p>
      </div>

      <Tabs defaultValue="friends" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="friends" data-testid="tab-friends">
            Friends
            {friends && friends.length > 0 && (
              <Badge variant="secondary" className="ml-2">{friends.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="pending" data-testid="tab-pending">
            Pending
            {pendingRequests && pendingRequests.length > 0 && (
              <Badge variant="secondary" className="ml-2">{pendingRequests.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="sent" data-testid="tab-sent">
            Sent
            {sentRequests && sentRequests.length > 0 && (
              <Badge variant="secondary" className="ml-2">{sentRequests.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="search" data-testid="tab-search">Search</TabsTrigger>
        </TabsList>

        <TabsContent value="friends" className="space-y-4 mt-6">
          {friendsLoading ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i}>
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-muted animate-pulse" />
                    <div className="space-y-2 flex-1">
                      <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                      <div className="h-3 w-32 bg-muted animate-pulse rounded" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : friends && friends.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {friends.map((friend) => {
                const { name, initials } = getUserDisplay(friend);
                return (
                  <Card key={friend.id} className="hover-elevate" data-testid={`card-friend-${friend.id}`}>
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={friend.profileImageUrl || undefined} className="object-cover" />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{name}</p>
                          <p className="text-sm text-muted-foreground truncate">{friend.email || ""}</p>
                        </div>
                      </div>
                      {(friend.bio || friend.favoriteSubstance || friend.currentProject) && (
                        <div className="space-y-1.5 pt-2 border-t text-sm">
                          {friend.bio && (
                            <p className="text-muted-foreground line-clamp-2">{friend.bio}</p>
                          )}
                          {friend.favoriteSubstance && (
                            <p className="flex items-center gap-1.5 text-muted-foreground">
                              <Heart className="h-3 w-3" />
                              <span>{friend.favoriteSubstance}</span>
                            </p>
                          )}
                          {friend.currentProject && (
                            <p className="flex items-center gap-1.5 text-muted-foreground">
                              <Sparkles className="h-3 w-3" />
                              <span className="truncate">{friend.currentProject}</span>
                            </p>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="py-12">
              <CardContent className="flex flex-col items-center text-center space-y-4">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                  <Users className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">No friends yet</h3>
                  <p className="text-muted-foreground text-sm max-w-sm">
                    Search for users to connect with and start sharing your experiences.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="pending" className="space-y-4 mt-6">
          {pendingLoading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <Card key={i}>
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-muted animate-pulse" />
                    <div className="space-y-2 flex-1">
                      <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                      <div className="h-3 w-32 bg-muted animate-pulse rounded" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : pendingRequests && pendingRequests.length > 0 ? (
            <div className="space-y-4">
              {pendingRequests.map((request) => {
                const { name, initials } = getUserDisplay(request.requester);
                const requester = request.requester;
                return (
                  <Card key={request.id} data-testid={`card-pending-${request.id}`}>
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={requester.profileImageUrl || undefined} className="object-cover" />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{name}</p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Wants to connect
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => respondMutation.mutate({ requestId: request.id, status: "accepted" })}
                            disabled={respondMutation.isPending}
                            data-testid={`button-accept-${request.id}`}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => respondMutation.mutate({ requestId: request.id, status: "rejected" })}
                            disabled={respondMutation.isPending}
                            data-testid={`button-reject-${request.id}`}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      {(requester.bio || requester.favoriteSubstance || requester.currentProject) && (
                        <div className="space-y-1.5 pt-2 border-t text-sm">
                          {requester.bio && (
                            <p className="text-muted-foreground line-clamp-2">{requester.bio}</p>
                          )}
                          {requester.favoriteSubstance && (
                            <p className="flex items-center gap-1.5 text-muted-foreground">
                              <Heart className="h-3 w-3" />
                              <span>{requester.favoriteSubstance}</span>
                            </p>
                          )}
                          {requester.currentProject && (
                            <p className="flex items-center gap-1.5 text-muted-foreground">
                              <Sparkles className="h-3 w-3" />
                              <span className="truncate">{requester.currentProject}</span>
                            </p>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="py-12">
              <CardContent className="flex flex-col items-center text-center space-y-4">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                  <Clock className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">No pending requests</h3>
                  <p className="text-muted-foreground text-sm max-w-sm">
                    Friend requests you receive will appear here.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="sent" className="space-y-4 mt-6">
          {sentLoading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <Card key={i}>
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-muted animate-pulse" />
                    <div className="space-y-2 flex-1">
                      <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                      <div className="h-3 w-32 bg-muted animate-pulse rounded" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : sentRequests && sentRequests.length > 0 ? (
            <div className="space-y-4">
              {sentRequests.map((request) => {
                const { name, initials } = getUserDisplay(request.addressee);
                return (
                  <Card key={request.id} data-testid={`card-sent-${request.id}`}>
                    <CardContent className="p-4 flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={request.addressee.profileImageUrl || undefined} className="object-cover" />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{name}</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Send className="h-3 w-3" />
                          Request sent
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => cancelRequestMutation.mutate(request.id)}
                        disabled={cancelRequestMutation.isPending}
                        data-testid={`button-cancel-${request.id}`}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Cancel
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="py-12">
              <CardContent className="flex flex-col items-center text-center space-y-4">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                  <Send className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">No sent requests</h3>
                  <p className="text-muted-foreground text-sm max-w-sm">
                    Friend requests you send will appear here until they're accepted.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="search" className="space-y-4 mt-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Find Friends</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  data-testid="input-search-users"
                />
              </div>

              {searchQuery.length >= 2 && (
                <>
                  {searchLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center gap-3 p-2">
                          <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
                          <div className="space-y-1 flex-1">
                            <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                            <div className="h-3 w-32 bg-muted animate-pulse rounded" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : searchResults && searchResults.length > 0 ? (
                    <div className="space-y-2">
                      {searchResults.map((user) => {
                        const { name, initials } = getUserDisplay(user);
                        return (
                          <div
                            key={user.id}
                            className="flex items-center gap-3 p-3 rounded-md hover-elevate"
                            data-testid={`search-result-${user.id}`}
                          >
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={user.profileImageUrl || undefined} className="object-cover" />
                              <AvatarFallback className="bg-primary/10 text-primary text-sm">
                                {initials}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{name}</p>
                              <p className="text-xs text-muted-foreground truncate">{user.email || ""}</p>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => sendRequestMutation.mutate(user.id)}
                              disabled={sendRequestMutation.isPending}
                              data-testid={`button-add-${user.id}`}
                            >
                              <UserPlus className="h-4 w-4" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground text-sm py-4">
                      No users found matching "{searchQuery}"
                    </p>
                  )}
                </>
              )}

              {searchQuery.length > 0 && searchQuery.length < 2 && (
                <p className="text-center text-muted-foreground text-sm py-4">
                  Enter at least 2 characters to search
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
