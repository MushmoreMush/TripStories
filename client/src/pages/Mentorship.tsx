import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, UserPlus, Check, X, MessageCircle } from "lucide-react";

const EXPERIENCE_LEVELS = [
  { value: "beginner", label: "Beginner (< 5 experiences)" },
  { value: "intermediate", label: "Intermediate (5-20 experiences)" },
  { value: "experienced", label: "Experienced (20+ experiences)" },
];

const SUBSTANCES = [
  "Psilocybin", "LSD", "DMT", "Ayahuasca", "MDMA", "Ketamine", "Cannabis"
];

export default function Mentorship() {
  const queryClient = useQueryClient();
  const [bio, setBio] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("");
  const [selectedSubstances, setSelectedSubstances] = useState<string[]>([]);
  const [isMentor, setIsMentor] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ["/api/mentorship/profile"],
    onSuccess: (data: any) => {
      if (data) {
        setBio(data.bio || "");
        setExperienceLevel(data.experienceLevel || "");
        setSelectedSubstances(data.substances || []);
        setIsMentor(data.isMentor || false);
      }
    },
  });

  const { data: mentors = [] } = useQuery({
    queryKey: ["/api/mentorship/mentors"],
  });

  const { data: connections = [] } = useQuery({
    queryKey: ["/api/mentorship/connections"],
  });

  const updateProfile = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/mentorship/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mentorship/profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/mentorship/mentors"] });
    },
  });

  const requestMentorship = useMutation({
    mutationFn: async (mentorId: string) => {
      const res = await fetch("/api/mentorship/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mentorId }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mentorship/connections"] });
    },
  });

  const respondToRequest = useMutation({
    mutationFn: async ({ id, accept }: { id: number; accept: boolean }) => {
      const res = await fetch(`/api/mentorship/${id}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accept }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mentorship/connections"] });
    },
  });

  const handleSaveProfile = () => {
    updateProfile.mutate({
      bio,
      experienceLevel,
      substances: selectedSubstances,
      isMentor,
      isAvailable: isMentor,
    });
  };

  const toggleSubstance = (substance: string) => {
    setSelectedSubstances(prev =>
      prev.includes(substance)
        ? prev.filter(s => s !== substance)
        : [...prev, substance]
    );
  };

  const pendingRequests = connections.filter((c: any) => c.status === "pending");
  const activeConnections = connections.filter((c: any) => c.status === "active");

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
        <Users className="h-8 w-8" />
        Mentorship Program
      </h1>

      <Tabs defaultValue="find" className="space-y-6">
        <TabsList>
          <TabsTrigger value="find">Find a Mentor</TabsTrigger>
          <TabsTrigger value="connections">
            My Connections
            {pendingRequests.length > 0 && (
              <Badge variant="destructive" className="ml-2">{pendingRequests.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="profile">My Profile</TabsTrigger>
        </TabsList>

        <TabsContent value="find" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Available Mentors</CardTitle>
              <CardDescription>
                Connect with experienced community members for guidance on your journey.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {mentors.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No mentors available at the moment. Check back later!
                </p>
              ) : (
                <div className="grid gap-4">
                  {mentors.map((mentor: any) => (
                    <div key={mentor.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex gap-4">
                          <Avatar className="h-12 w-12">
                            <AvatarFallback>
                              {mentor.user?.firstName?.[0]}{mentor.user?.lastName?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold">
                              {mentor.user?.firstName} {mentor.user?.lastName}
                            </h3>
                            <p className="text-sm text-muted-foreground capitalize">
                              {mentor.experienceLevel} level
                            </p>
                            {mentor.bio && (
                              <p className="text-sm mt-2">{mentor.bio}</p>
                            )}
                            {mentor.substances?.length > 0 && (
                              <div className="flex gap-1 mt-2 flex-wrap">
                                {mentor.substances.map((s: string) => (
                                  <Badge key={s} variant="outline" className="text-xs">
                                    {s}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        <Button
                          onClick={() => requestMentorship.mutate(mentor.userId)}
                          disabled={connections.some((c: any) =>
                            c.mentorId === mentor.userId || c.menteeId === mentor.userId
                          )}
                        >
                          <UserPlus className="h-4 w-4 mr-2" />
                          Request
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="connections" className="space-y-4">
          {/* Pending Requests */}
          {pendingRequests.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Pending Requests</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {pendingRequests.map((connection: any) => (
                  <div key={connection.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>
                          {connection.mentee?.firstName?.[0]}{connection.mentee?.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {connection.mentee?.firstName} {connection.mentee?.lastName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Wants you to be their mentor
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => respondToRequest.mutate({ id: connection.id, accept: true })}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => respondToRequest.mutate({ id: connection.id, accept: false })}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Active Connections */}
          <Card>
            <CardHeader>
              <CardTitle>Active Mentorships</CardTitle>
            </CardHeader>
            <CardContent>
              {activeConnections.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No active mentorship connections yet.
                </p>
              ) : (
                <div className="space-y-4">
                  {activeConnections.map((connection: any) => (
                    <div key={connection.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>
                            {connection.mentor?.firstName?.[0] || connection.mentee?.firstName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {connection.mentor?.firstName || connection.mentee?.firstName}{" "}
                            {connection.mentor?.lastName || connection.mentee?.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {connection.mentorId ? "Your Mentor" : "Your Mentee"}
                          </p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Message
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Mentorship Profile</CardTitle>
              <CardDescription>
                Set up your profile to connect with others or offer mentorship.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Become a Mentor</Label>
                  <p className="text-sm text-muted-foreground">
                    Offer guidance to newcomers in the community
                  </p>
                </div>
                <Switch checked={isMentor} onCheckedChange={setIsMentor} />
              </div>

              <div className="space-y-2">
                <Label>Experience Level</Label>
                <Select value={experienceLevel} onValueChange={setExperienceLevel}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your experience level" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPERIENCE_LEVELS.map((level) => (
                      <SelectItem key={level.value} value={level.value}>
                        {level.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Areas of Experience</Label>
                <div className="flex flex-wrap gap-2">
                  {SUBSTANCES.map((substance) => (
                    <Badge
                      key={substance}
                      variant={selectedSubstances.includes(substance) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleSubstance(substance)}
                    >
                      {substance}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Bio</Label>
                <Textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell others about your experience and what you can offer..."
                  rows={4}
                />
              </div>

              <Button onClick={handleSaveProfile} className="w-full">
                Save Profile
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
