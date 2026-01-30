import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Plus, Calendar, MapPin, UserPlus, FileText } from "lucide-react";

interface GroupExperience {
  id: number;
  title: string;
  description: string;
  date: string;
  setting: string;
  status: string;
  creator: {
    id: string;
    firstName: string;
    lastName: string;
  };
  participants: Array<{
    id: number;
    userId: string;
    role: string;
    reportId?: number;
    user: {
      firstName: string;
      lastName: string;
    };
  }>;
}

export default function GroupExperiences() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<GroupExperience | null>(null);
  const [inviteUserId, setInviteUserId] = useState("");

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [setting, setSetting] = useState("");

  const { data: groups = [] } = useQuery<GroupExperience[]>({
    queryKey: ["/api/groups"],
  });

  const { data: friends = [] } = useQuery({
    queryKey: ["/api/friends"],
  });

  const { data: myReports = [] } = useQuery({
    queryKey: ["/api/reports"],
  });

  const createGroup = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
      setIsCreateOpen(false);
      setTitle("");
      setDescription("");
      setDate("");
      setSetting("");
    },
  });

  const inviteToGroup = useMutation({
    mutationFn: async ({ groupId, inviteeId }: { groupId: number; inviteeId: string }) => {
      const res = await fetch(`/api/groups/${groupId}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteeId }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
      setInviteUserId("");
    },
  });

  const linkReport = useMutation({
    mutationFn: async ({ groupId, reportId }: { groupId: number; reportId: number }) => {
      const res = await fetch(`/api/groups/${groupId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
    },
  });

  const handleCreate = () => {
    if (title && date) {
      createGroup.mutate({ title, description, date, setting });
    }
  };

  const statusColors: Record<string, string> = {
    draft: "bg-gray-100 text-gray-800",
    active: "bg-blue-100 text-blue-800",
    completed: "bg-green-100 text-green-800",
  };

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Users className="h-8 w-8" />
          Group Experiences
        </h1>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Group
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Group Experience</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  placeholder="e.g., Weekend Retreat"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="datetime-local"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Setting</Label>
                <Input
                  placeholder="Where will this take place?"
                  value={setting}
                  onChange={(e) => setSetting(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Description (optional)</Label>
                <Textarea
                  placeholder="Describe the planned experience..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <Button onClick={handleCreate} className="w-full" disabled={!title || !date}>
                Create Group Experience
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {groups.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No Group Experiences Yet</h3>
            <p className="text-muted-foreground mb-4">
              Create a group to document shared experiences with friends.
            </p>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Group
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {groups.map((group) => (
            <Card key={group.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{group.title}</CardTitle>
                    <CardDescription className="flex items-center gap-4 mt-2">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(group.date).toLocaleDateString()}
                      </span>
                      {group.setting && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {group.setting}
                        </span>
                      )}
                    </CardDescription>
                  </div>
                  <Badge className={statusColors[group.status] || statusColors.draft}>
                    {group.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {group.description && (
                  <p className="text-sm text-muted-foreground">{group.description}</p>
                )}

                {/* Participants */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Participants ({group.participants.length})</h4>
                  <div className="flex flex-wrap gap-2">
                    {group.participants.map((participant) => (
                      <div
                        key={participant.id}
                        className="flex items-center gap-2 px-3 py-1 bg-muted rounded-full"
                      >
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs">
                            {participant.user.firstName?.[0]}
                            {participant.user.lastName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">
                          {participant.user.firstName} {participant.user.lastName}
                        </span>
                        {participant.role === "creator" && (
                          <Badge variant="outline" className="text-xs">Host</Badge>
                        )}
                        {participant.reportId && (
                          <FileText className="h-4 w-4 text-green-500" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  {/* Invite Friend */}
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <UserPlus className="h-4 w-4 mr-2" />
                        Invite Friend
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Invite to {group.title}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 pt-4">
                        <Select value={inviteUserId} onValueChange={setInviteUserId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a friend" />
                          </SelectTrigger>
                          <SelectContent>
                            {friends
                              .filter(
                                (f: any) =>
                                  !group.participants.some((p) => p.userId === f.id)
                              )
                              .map((friend: any) => (
                                <SelectItem key={friend.id} value={friend.id}>
                                  {friend.firstName} {friend.lastName}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                        <Button
                          onClick={() =>
                            inviteToGroup.mutate({ groupId: group.id, inviteeId: inviteUserId })
                          }
                          disabled={!inviteUserId}
                          className="w-full"
                        >
                          Send Invitation
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  {/* Link Report */}
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <FileText className="h-4 w-4 mr-2" />
                        Link Report
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Link Your Report</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 pt-4">
                        <p className="text-sm text-muted-foreground">
                          Select one of your reports to link to this group experience.
                        </p>
                        <div className="max-h-60 overflow-y-auto space-y-2">
                          {myReports.map((report: any) => (
                            <div
                              key={report.id}
                              className="p-3 border rounded cursor-pointer hover:bg-muted"
                              onClick={() =>
                                linkReport.mutate({ groupId: group.id, reportId: report.id })
                              }
                            >
                              <p className="font-medium">{report.substance}</p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(report.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
