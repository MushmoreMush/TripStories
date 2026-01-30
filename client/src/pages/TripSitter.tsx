import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Shield, Clock, Phone, AlertTriangle, CheckCircle, Play, Square } from "lucide-react";

const SUBSTANCES = [
  "Psilocybin", "LSD", "DMT", "Ayahuasca", "MDMA", "Ketamine",
  "Mescaline", "2C-B", "Salvia", "Cannabis", "Other"
];

export default function TripSitter() {
  const queryClient = useQueryClient();
  const [duration, setDuration] = useState("360");
  const [interval, setInterval] = useState("30");
  const [substance, setSubstance] = useState("");
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [nextCheckIn, setNextCheckIn] = useState<number | null>(null);

  const { data: activeSession } = useQuery({
    queryKey: ["/api/trip-sitter/active"],
  });

  const { data: emergencyContacts = [] } = useQuery({
    queryKey: ["/api/emergency-contacts"],
  });

  const startSession = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/trip-sitter/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trip-sitter/active"] });
    },
  });

  const checkIn = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/trip-sitter/checkin", { method: "POST" });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trip-sitter/active"] });
    },
  });

  const endSession = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/trip-sitter/end", { method: "POST" });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trip-sitter/active"] });
    },
  });

  // Timer effect
  useEffect(() => {
    if (!activeSession) return;

    const updateTimers = () => {
      const start = new Date(activeSession.startTime).getTime();
      const now = Date.now();
      const elapsed = now - start;
      const totalDuration = activeSession.expectedDuration * 60 * 1000;
      const remaining = Math.max(0, totalDuration - elapsed);
      setTimeRemaining(remaining);

      const lastCheckIn = activeSession.lastCheckIn
        ? new Date(activeSession.lastCheckIn).getTime()
        : start;
      const checkInInterval = activeSession.checkInInterval * 60 * 1000;
      const nextCheck = Math.max(0, checkInInterval - (now - lastCheckIn));
      setNextCheckIn(nextCheck);
    };

    updateTimers();
    const timer = setInterval(updateTimers, 1000);
    return () => clearInterval(timer);
  }, [activeSession]);

  const formatTime = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  const handleStart = () => {
    startSession.mutate({
      startTime: new Date().toISOString(),
      expectedDuration: parseInt(duration),
      checkInInterval: parseInt(interval),
      substance,
      emergencyContactId: emergencyContacts[0]?.id,
    });
  };

  const progress = activeSession && timeRemaining !== null
    ? ((activeSession.expectedDuration * 60 * 1000 - timeRemaining) / (activeSession.expectedDuration * 60 * 1000)) * 100
    : 0;

  const isCheckInOverdue = nextCheckIn !== null && nextCheckIn === 0;

  return (
    <div className="container mx-auto py-6 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
        <Shield className="h-8 w-8" />
        Trip Sitter Mode
      </h1>

      {activeSession ? (
        <div className="space-y-6">
          {/* Active Session Card */}
          <Card className={isCheckInOverdue ? "border-yellow-500" : ""}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
                Session Active
              </CardTitle>
              <CardDescription>
                {activeSession.substance && `Substance: ${activeSession.substance}`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Progress */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Session Progress</span>
                  <span>{timeRemaining !== null ? formatTime(timeRemaining) : "--"} remaining</span>
                </div>
                <Progress value={progress} className="h-3" />
              </div>

              {/* Check-in Alert */}
              {isCheckInOverdue ? (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Check-in Overdue!</AlertTitle>
                  <AlertDescription>
                    Please check in to confirm you're doing okay.
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert>
                  <Clock className="h-4 w-4" />
                  <AlertTitle>Next Check-in</AlertTitle>
                  <AlertDescription>
                    {nextCheckIn !== null ? formatTime(nextCheckIn) : "--"}
                  </AlertDescription>
                </Alert>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4">
                <Button
                  onClick={() => checkIn.mutate()}
                  className="flex-1"
                  size="lg"
                  variant={isCheckInOverdue ? "default" : "outline"}
                >
                  <CheckCircle className="h-5 w-5 mr-2" />
                  I'm Okay
                </Button>
                <Button
                  onClick={() => endSession.mutate()}
                  variant="outline"
                  size="lg"
                >
                  <Square className="h-5 w-5 mr-2" />
                  End Session
                </Button>
              </div>

              {/* Emergency Contact */}
              {emergencyContacts[0] && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground mb-2">Emergency Contact</p>
                  <Button variant="outline" className="w-full" asChild>
                    <a href={`tel:${emergencyContacts[0].phone}`}>
                      <Phone className="h-4 w-4 mr-2" />
                      Call {emergencyContacts[0].name}
                    </a>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Setup Card */}
          <Card>
            <CardHeader>
              <CardTitle>Start a Session</CardTitle>
              <CardDescription>
                Trip Sitter mode will remind you to check in periodically during your experience.
                If you don't check in, your emergency contact can be notified.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label>Substance (optional)</Label>
                  <Select value={substance} onValueChange={setSubstance}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select substance" />
                    </SelectTrigger>
                    <SelectContent>
                      {SUBSTANCES.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Expected Duration (minutes)</Label>
                  <Select value={duration} onValueChange={setDuration}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="120">2 hours</SelectItem>
                      <SelectItem value="240">4 hours</SelectItem>
                      <SelectItem value="360">6 hours</SelectItem>
                      <SelectItem value="480">8 hours</SelectItem>
                      <SelectItem value="720">12 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Check-in Interval (minutes)</Label>
                  <Select value={interval} onValueChange={setInterval}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">Every 15 minutes</SelectItem>
                      <SelectItem value="30">Every 30 minutes</SelectItem>
                      <SelectItem value="60">Every hour</SelectItem>
                      <SelectItem value="120">Every 2 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button onClick={handleStart} className="w-full" size="lg">
                <Play className="h-5 w-5 mr-2" />
                Start Session
              </Button>
            </CardContent>
          </Card>

          {/* Emergency Contacts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Emergency Contacts
              </CardTitle>
            </CardHeader>
            <CardContent>
              {emergencyContacts.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  No emergency contacts set up. Add one in Settings for enhanced safety.
                </p>
              ) : (
                <div className="space-y-2">
                  {emergencyContacts.map((contact: any) => (
                    <div key={contact.id} className="flex items-center justify-between p-3 bg-muted rounded">
                      <div>
                        <p className="font-medium">{contact.name}</p>
                        <p className="text-sm text-muted-foreground">{contact.phone}</p>
                      </div>
                      {contact.isPrimary && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">Primary</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
