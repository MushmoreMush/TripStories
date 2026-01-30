import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Settings as SettingsIcon, Moon, Bell, Shield, Phone, Plus, Trash2, Download } from "lucide-react";

export default function Settings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form states
  const [newContactName, setNewContactName] = useState("");
  const [newContactPhone, setNewContactPhone] = useState("");
  const [newContactRelationship, setNewContactRelationship] = useState("");

  const { data: settings } = useQuery({
    queryKey: ["/api/settings"],
  });

  const { data: emergencyContacts = [] } = useQuery({
    queryKey: ["/api/emergency-contacts"],
  });

  const updateSettings = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({ title: "Settings saved" });
    },
  });

  const addContact = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/emergency-contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/emergency-contacts"] });
      setNewContactName("");
      setNewContactPhone("");
      setNewContactRelationship("");
      toast({ title: "Contact added" });
    },
  });

  const deleteContact = useMutation({
    mutationFn: async (id: number) => {
      await fetch(`/api/emergency-contacts/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/emergency-contacts"] });
      toast({ title: "Contact removed" });
    },
  });

  const handleAddContact = () => {
    if (newContactName && newContactPhone) {
      addContact.mutate({
        name: newContactName,
        phone: newContactPhone,
        relationship: newContactRelationship,
        isPrimary: emergencyContacts.length === 0,
      });
    }
  };

  const exportCalendar = async () => {
    try {
      const res = await fetch("/api/export/calendar");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "trip-experiences.ics";
      a.click();
      toast({ title: "Calendar exported" });
    } catch (error) {
      toast({ title: "Export failed", variant: "destructive" });
    }
  };

  return (
    <div className="container mx-auto py-6 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
        <SettingsIcon className="h-8 w-8" />
        Settings
      </h1>

      <Tabs defaultValue="appearance" className="space-y-6">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="safety">Safety</TabsTrigger>
          <TabsTrigger value="export">Export</TabsTrigger>
        </TabsList>

        {/* Appearance Tab */}
        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Moon className="h-5 w-5" />
                Appearance
              </CardTitle>
              <CardDescription>Customize how the app looks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Dark Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Use dark theme for easier viewing at night
                  </p>
                </div>
                <Switch
                  checked={settings?.darkMode || false}
                  onCheckedChange={(checked) =>
                    updateSettings.mutate({ darkMode: checked })
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label>Offline Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable offline access to your reports
                  </p>
                </div>
                <Switch
                  checked={settings?.offlineEnabled !== false}
                  onCheckedChange={(checked) =>
                    updateSettings.mutate({ offlineEnabled: checked })
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label>Voice Input</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable voice-to-text for writing reports
                  </p>
                </div>
                <Switch
                  checked={settings?.voiceEnabled || false}
                  onCheckedChange={(checked) =>
                    updateSettings.mutate({ voiceEnabled: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
              </CardTitle>
              <CardDescription>Manage your notification preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Check-in Reminders</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified during Trip Sitter mode
                  </p>
                </div>
                <Switch
                  checked={settings?.notifications?.checkIn !== false}
                  onCheckedChange={(checked) =>
                    updateSettings.mutate({
                      notifications: { ...settings?.notifications, checkIn: checked },
                    })
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label>Integration Reminders</Label>
                  <p className="text-sm text-muted-foreground">
                    Reminders to reflect on past experiences
                  </p>
                </div>
                <Switch
                  checked={settings?.notifications?.integration !== false}
                  onCheckedChange={(checked) =>
                    updateSettings.mutate({
                      notifications: { ...settings?.notifications, integration: checked },
                    })
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label>Milestone Celebrations</Label>
                  <p className="text-sm text-muted-foreground">
                    Celebrate anniversaries and achievements
                  </p>
                </div>
                <Switch
                  checked={settings?.notifications?.milestones !== false}
                  onCheckedChange={(checked) =>
                    updateSettings.mutate({
                      notifications: { ...settings?.notifications, milestones: checked },
                    })
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label>Friend Activity</Label>
                  <p className="text-sm text-muted-foreground">
                    When friends share new reports or message you
                  </p>
                </div>
                <Switch
                  checked={settings?.notifications?.friends !== false}
                  onCheckedChange={(checked) =>
                    updateSettings.mutate({
                      notifications: { ...settings?.notifications, friends: checked },
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Safety Tab */}
        <TabsContent value="safety">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Emergency Contacts
              </CardTitle>
              <CardDescription>
                People who can be contacted during Trip Sitter mode
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Existing Contacts */}
              {emergencyContacts.map((contact: any) => (
                <div
                  key={contact.id}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                  <div>
                    <p className="font-medium">{contact.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {contact.phone}
                      {contact.relationship && ` - ${contact.relationship}`}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteContact.mutate(contact.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              {/* Add New Contact */}
              <div className="border-t pt-4 mt-4">
                <p className="font-medium mb-3">Add Contact</p>
                <div className="space-y-3">
                  <Input
                    placeholder="Name"
                    value={newContactName}
                    onChange={(e) => setNewContactName(e.target.value)}
                  />
                  <Input
                    placeholder="Phone number"
                    value={newContactPhone}
                    onChange={(e) => setNewContactPhone(e.target.value)}
                  />
                  <Input
                    placeholder="Relationship (optional)"
                    value={newContactRelationship}
                    onChange={(e) => setNewContactRelationship(e.target.value)}
                  />
                  <Button
                    onClick={handleAddContact}
                    disabled={!newContactName || !newContactPhone}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Contact
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Export Tab */}
        <TabsContent value="export">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Export Data
              </CardTitle>
              <CardDescription>Download your data in various formats</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 border rounded-lg">
                <h3 className="font-medium mb-2">Calendar Export</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Export your experiences to iCal format for calendar apps
                </p>
                <Button onClick={exportCalendar} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Download .ics File
                </Button>
              </div>

              <div className="p-4 border rounded-lg">
                <h3 className="font-medium mb-2">Therapist Export</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Generate a professional summary for healthcare providers
                </p>
                <Button variant="outline" asChild>
                  <a href="/api/export/therapist" download>
                    <Download className="h-4 w-4 mr-2" />
                    Download JSON Summary
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
