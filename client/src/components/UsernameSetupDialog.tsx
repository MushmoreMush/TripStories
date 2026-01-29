import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { User as UserIcon, Sparkles } from "lucide-react";
import type { User } from "@shared/schema";

interface UsernameSetupDialogProps {
  user: User;
  open: boolean;
  onComplete: () => void;
}

export function UsernameSetupDialog({ user, open, onComplete }: UsernameSetupDialogProps) {
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");

  const validateUsername = (value: string) => {
    if (value.length < 3) {
      return "Username must be at least 3 characters";
    }
    if (value.length > 30) {
      return "Username must be 30 characters or less";
    }
    if (!/^[a-zA-Z0-9_]+$/.test(value)) {
      return "Only letters, numbers, and underscores allowed";
    }
    return "";
  };

  const updateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PATCH", "/api/profile", { username });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Username set successfully!" });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      onComplete();
    },
    onError: (error: any) => {
      const message = error?.message || "Failed to set username";
      if (message.includes("taken")) {
        setError("This username is already taken. Try another!");
      } else {
        setError(message);
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateUsername(username);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError("");
    updateMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader className="text-center pb-2">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <DialogTitle className="text-2xl">Choose Your Username</DialogTitle>
          <DialogDescription className="text-center">
            This is what other users will see. Your email and real name stay private.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username" className="flex items-center gap-2">
              <UserIcon className="h-4 w-4" />
              Username
            </Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""));
                setError("");
              }}
              placeholder="your_username"
              autoFocus
              data-testid="input-setup-username"
            />
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Only lowercase letters, numbers, and underscores. 3-30 characters.
            </p>
          </div>
          <Button 
            type="submit" 
            className="w-full"
            disabled={!username || updateMutation.isPending}
            data-testid="button-set-username"
          >
            {updateMutation.isPending ? "Setting up..." : "Set Username"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
