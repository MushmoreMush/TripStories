import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Target, CheckCircle, Clock, Sparkles, Star } from "lucide-react";

interface Challenge {
  id: number;
  title: string;
  description: string;
  category: string;
  points: number;
  weekStart: string;
  weekEnd: string;
}

interface ChallengeProgress {
  id: number;
  challengeId: number;
  progress: number;
  completed: boolean;
  completedAt: string | null;
  challenge: Challenge;
}

const categoryColors: Record<string, string> = {
  integration: "bg-purple-100 text-purple-800",
  mindfulness: "bg-blue-100 text-blue-800",
  journaling: "bg-green-100 text-green-800",
  social: "bg-orange-100 text-orange-800",
  wellness: "bg-pink-100 text-pink-800",
};

export default function Challenges() {
  const queryClient = useQueryClient();

  const { data: challenges = [] } = useQuery<Challenge[]>({
    queryKey: ["/api/challenges"],
  });

  const { data: progress = [] } = useQuery<ChallengeProgress[]>({
    queryKey: ["/api/challenges/progress"],
  });

  const { data: customBadges = [] } = useQuery({
    queryKey: ["/api/custom-badges"],
  });

  const { data: milestones = [] } = useQuery({
    queryKey: ["/api/milestones/upcoming"],
  });

  const celebrateMilestone = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/milestones/${id}/celebrate`, {
        method: "POST",
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/milestones/upcoming"] });
    },
  });

  const getProgressForChallenge = (challengeId: number) => {
    return progress.find((p) => p.challengeId === challengeId);
  };

  const activeProgress = progress.filter((p) => !p.completed);
  const completedProgress = progress.filter((p) => p.completed);
  const totalPoints = completedProgress.reduce(
    (sum, p) => sum + (p.challenge?.points || 0),
    0
  );

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
        <Trophy className="h-8 w-8" />
        Challenges & Achievements
      </h1>

      {/* Stats Overview */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold">{totalPoints}</p>
              <p className="text-sm text-muted-foreground">Total Points</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold">{completedProgress.length}</p>
              <p className="text-sm text-muted-foreground">Completed</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold">{customBadges.length}</p>
              <p className="text-sm text-muted-foreground">Custom Badges</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="current" className="space-y-6">
        <TabsList>
          <TabsTrigger value="current">This Week</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="milestones">Milestones</TabsTrigger>
          <TabsTrigger value="badges">My Badges</TabsTrigger>
        </TabsList>

        {/* Current Challenges */}
        <TabsContent value="current" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Weekly Challenges
              </CardTitle>
              <CardDescription>
                Complete these integration-focused challenges to earn points and build better habits.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {challenges.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No challenges available this week.</p>
                  <p className="text-sm">Check back soon for new challenges!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {challenges.map((challenge) => {
                    const prog = getProgressForChallenge(challenge.id);
                    const progressPercent = prog
                      ? Math.min((prog.progress / challenge.points) * 100, 100)
                      : 0;
                    const isComplete = prog?.completed;

                    return (
                      <div
                        key={challenge.id}
                        className={`p-4 border rounded-lg ${
                          isComplete ? "bg-green-50 border-green-200" : ""
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">{challenge.title}</h3>
                              {isComplete && (
                                <CheckCircle className="h-5 w-5 text-green-500" />
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {challenge.description}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={categoryColors[challenge.category] || "bg-gray-100"}>
                              {challenge.category}
                            </Badge>
                            <Badge variant="outline">
                              <Star className="h-3 w-3 mr-1" />
                              {challenge.points} pts
                            </Badge>
                          </div>
                        </div>
                        <div className="mt-3">
                          <div className="flex justify-between text-sm mb-1">
                            <span>Progress</span>
                            <span>{prog?.progress || 0} / {challenge.points}</span>
                          </div>
                          <Progress value={progressPercent} className="h-2" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Completed Challenges */}
        <TabsContent value="completed" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Completed Challenges
              </CardTitle>
            </CardHeader>
            <CardContent>
              {completedProgress.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No completed challenges yet. Start with the weekly challenges!
                </p>
              ) : (
                <div className="space-y-3">
                  {completedProgress.map((prog) => (
                    <div
                      key={prog.id}
                      className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <div>
                          <p className="font-medium">{prog.challenge?.title}</p>
                          <p className="text-sm text-muted-foreground">
                            Completed{" "}
                            {prog.completedAt &&
                              new Date(prog.completedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline">
                        +{prog.challenge?.points} pts
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Milestones */}
        <TabsContent value="milestones" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Upcoming Milestones
              </CardTitle>
              <CardDescription>
                Celebrate your journey anniversaries and achievements
              </CardDescription>
            </CardHeader>
            <CardContent>
              {milestones.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No upcoming milestones. Keep journaling to unlock celebrations!
                </p>
              ) : (
                <div className="space-y-4">
                  {milestones.map((milestone: any) => (
                    <div
                      key={milestone.id}
                      className="p-4 border rounded-lg bg-gradient-to-r from-purple-50 to-pink-50"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold">{milestone.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {milestone.description}
                          </p>
                          <p className="text-sm mt-2 flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {new Date(milestone.date).toLocaleDateString()}
                          </p>
                        </div>
                        <Button
                          onClick={() => celebrateMilestone.mutate(milestone.id)}
                          variant="outline"
                          size="sm"
                        >
                          <Sparkles className="h-4 w-4 mr-2" />
                          Celebrate!
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Custom Badges */}
        <TabsContent value="badges" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                My Custom Badges
              </CardTitle>
              <CardDescription>
                Personal achievements you've created to mark your journey
              </CardDescription>
            </CardHeader>
            <CardContent>
              {customBadges.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No custom badges yet.</p>
                  <p className="text-sm">Create badges to celebrate personal milestones!</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {customBadges.map((badge: any) => (
                    <div
                      key={badge.id}
                      className="p-4 border rounded-lg text-center"
                      style={{ borderColor: badge.color }}
                    >
                      <div
                        className="w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center text-2xl"
                        style={{ backgroundColor: badge.color + "20" }}
                      >
                        {badge.icon}
                      </div>
                      <p className="font-medium">{badge.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {badge.description}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
