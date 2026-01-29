import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useUpload } from "@/hooks/use-upload";
import { useWebSocket } from "@/hooks/useWebSocket";
import { Hash, Lightbulb, Heart, Send, MessageCircle, Users, Plus, Image, Video, Sparkles, Upload, X, Loader2, Wifi, WifiOff } from "lucide-react";
import type { Channel, ChannelMessageWithUser, User, FounderPostWithUser } from "@shared/schema";
import { format, formatDistanceToNow } from "date-fns";

const channelIcons: Record<string, typeof Hash> = {
  hash: Hash,
  lightbulb: Lightbulb,
  heart: Heart,
};

function ChannelIcon({ icon, className }: { icon: string | null; className?: string }) {
  const IconComponent = channelIcons[icon || "hash"] || Hash;
  return <IconComponent className={className} />;
}

function FounderPostCard({ post }: { post: FounderPostWithUser }) {
  const user = post.user;
  const initials = user.username?.[0]?.toUpperCase() || "?";
  
  return (
    <Card className="overflow-hidden" data-testid={`founder-post-${post.id}`}>
      <CardHeader className="p-4 pb-2">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user.profileImageUrl || undefined} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold">{user.username || "Founder"}</span>
              <Badge variant="secondary" className="text-xs">
                <Sparkles className="h-3 w-3 mr-1" />
                Founder
              </Badge>
            </div>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(post.createdAt!), { addSuffix: true })}
            </span>
          </div>
        </div>
      </CardHeader>
      
      <div className="aspect-square relative bg-muted">
        {post.mediaType === "video" ? (
          <video
            src={post.mediaUrl}
            controls
            className="w-full h-full object-cover"
            data-testid={`post-video-${post.id}`}
          />
        ) : (
          <img
            src={post.mediaUrl}
            alt={post.caption || "Post image"}
            className="w-full h-full object-cover"
            data-testid={`post-image-${post.id}`}
          />
        )}
      </div>
      
      {post.caption && (
        <CardContent className="p-4">
          <p className="text-sm whitespace-pre-wrap">{post.caption}</p>
        </CardContent>
      )}
    </Card>
  );
}

function CreatePostDialog({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{ objectPath: string; name: string; type: string } | null>(null);
  const [caption, setCaption] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { uploadFile, isUploading, progress, error: uploadError } = useUpload({
    onSuccess: (response) => {
      setUploadedFile({
        objectPath: response.objectPath,
        name: response.metadata.name,
        type: response.metadata.contentType,
      });
    },
  });
  
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    
    // Upload the file
    await uploadFile(file);
  };
  
  const clearFile = () => {
    setUploadedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };
  
  const mediaType = uploadedFile?.type.startsWith("video/") ? "video" : "image";
  
  const createPost = useMutation({
    mutationFn: async () => {
      if (!uploadedFile) throw new Error("No file uploaded");
      return apiRequest("POST", "/api/founder-posts", { 
        mediaUrl: uploadedFile.objectPath, 
        mediaType, 
        caption 
      });
    },
    onSuccess: () => {
      setOpen(false);
      setUploadedFile(null);
      setPreviewUrl(null);
      setCaption("");
      onSuccess();
    },
  });
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2" data-testid="button-create-post">
          <Plus className="h-4 w-4" />
          Create Post
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Post</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Upload Media</Label>
            {!uploadedFile ? (
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  data-testid="input-file-upload"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="gap-2"
                  data-testid="button-select-file"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Uploading... {progress}%
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      Select Image or Video
                    </>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  Supports images and videos up to 10MB
                </p>
              </div>
            ) : (
              <div className="relative">
                {previewUrl && (
                  <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                    {mediaType === "video" ? (
                      <video src={previewUrl} controls className="w-full h-full object-cover" />
                    ) : (
                      <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                    )}
                    <Button
                      size="icon"
                      variant="destructive"
                      className="absolute top-2 right-2 h-8 w-8"
                      onClick={clearFile}
                      data-testid="button-remove-file"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  {uploadedFile.name}
                </p>
              </div>
            )}
            {uploadError && (
              <p className="text-sm text-destructive">{uploadError.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="caption">Caption (optional)</Label>
            <Textarea
              id="caption"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Write a caption..."
              rows={3}
              data-testid="input-caption"
            />
          </div>
          
          <Button 
            onClick={() => createPost.mutate()}
            disabled={!uploadedFile || createPost.isPending}
            className="w-full"
            data-testid="button-submit-post"
          >
            {createPost.isPending ? "Posting..." : "Post"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function MessageBubble({ message, isOwn, showAvatar }: { 
  message: ChannelMessageWithUser; 
  isOwn: boolean;
  showAvatar: boolean;
}) {
  const user = message.user;
  const initials = user.username?.[0]?.toUpperCase() || "?";
  
  return (
    <div className={`flex gap-2 ${isOwn ? "flex-row-reverse" : ""}`}>
      {showAvatar ? (
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={user.profileImageUrl || undefined} />
          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
        </Avatar>
      ) : (
        <div className="w-8 flex-shrink-0" />
      )}
      <div className={`flex flex-col ${isOwn ? "items-end" : "items-start"} max-w-[75%]`}>
        {showAvatar && (
          <span className="text-xs text-muted-foreground mb-1">
            {user.username || "Anonymous"}
          </span>
        )}
        <div
          className={`rounded-2xl px-4 py-2 ${
            isOwn
              ? "bg-primary text-primary-foreground rounded-br-sm"
              : "bg-muted rounded-bl-sm"
          }`}
          data-testid={`message-bubble-${message.id}`}
        >
          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
        </div>
        <span className="text-xs text-muted-foreground mt-1">
          {format(new Date(message.createdAt!), "h:mm a")}
        </span>
      </div>
    </div>
  );
}

export default function Community() {
  const [selectedChannelId, setSelectedChannelId] = useState<number | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [showPosts, setShowPosts] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: currentUser } = useQuery<User>({
    queryKey: ["/api/auth/user"],
  });

  const { data: isFounderData } = useQuery<{ isFounder: boolean }>({
    queryKey: ["/api/auth/is-founder"],
  });
  const isFounder = isFounderData?.isFounder || false;

  const { data: founderPosts = [], isLoading: postsLoading } = useQuery<FounderPostWithUser[]>({
    queryKey: ["/api/founder-posts"],
  });

  const { data: channels = [], isLoading: channelsLoading } = useQuery<Channel[]>({
    queryKey: ["/api/channels"],
  });

  const { data: messages = [], isLoading: messagesLoading } = useQuery<ChannelMessageWithUser[]>({
    queryKey: ["/api/channels", selectedChannelId, "messages"],
    enabled: !!selectedChannelId,
    // No more polling - WebSocket handles real-time updates
  });

  // Handle new messages from WebSocket
  const handleNewMessage = useCallback((message: ChannelMessageWithUser) => {
    queryClient.setQueryData<ChannelMessageWithUser[]>(
      ["/api/channels", selectedChannelId, "messages"],
      (oldMessages = []) => [...oldMessages, message]
    );
  }, [selectedChannelId]);

  // WebSocket connection for real-time messages
  const { isConnected } = useWebSocket({
    userId: currentUser?.id,
    channelId: selectedChannelId,
    onNewMessage: handleNewMessage,
    enabled: !showPosts && !!selectedChannelId,
  });

  const sendMessage = useMutation({
    mutationFn: async (content: string) => {
      return apiRequest("POST", `/api/channels/${selectedChannelId}/messages`, { content });
    },
    onSuccess: () => {
      setMessageInput("");
      queryClient.invalidateQueries({ queryKey: ["/api/channels", selectedChannelId, "messages"] });
      inputRef.current?.focus();
    },
  });

  useEffect(() => {
    if (channels.length > 0 && !selectedChannelId) {
      setSelectedChannelId(channels[0].id);
    }
  }, [channels, selectedChannelId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const selectedChannel = channels.find((c) => c.id === selectedChannelId);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedChannelId) return;
    sendMessage.mutate(messageInput.trim());
  };

  const groupMessagesByDate = (messages: ChannelMessageWithUser[]) => {
    const groups: { date: string; messages: ChannelMessageWithUser[] }[] = [];
    let currentDate = "";

    messages.forEach((message) => {
      const messageDate = format(new Date(message.createdAt!), "MMMM d, yyyy");
      if (messageDate !== currentDate) {
        currentDate = messageDate;
        groups.push({ date: messageDate, messages: [] });
      }
      groups[groups.length - 1].messages.push(message);
    });

    return groups;
  };

  const shouldShowAvatar = (messages: ChannelMessageWithUser[], index: number) => {
    if (index === 0) return true;
    const prevMessage = messages[index - 1];
    const currentMessage = messages[index];
    return prevMessage.userId !== currentMessage.userId;
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between gap-3 p-4 border-b">
        <div className="flex items-center gap-3">
          <MessageCircle className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-xl font-semibold">Community</h1>
            <p className="text-sm text-muted-foreground">Connect with fellow travelers</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-muted rounded-md p-1">
            <Button
              variant={showPosts ? "default" : "ghost"}
              size="sm"
              onClick={() => setShowPosts(true)}
              data-testid="tab-posts"
            >
              Posts
            </Button>
            <Button
              variant={!showPosts ? "default" : "ghost"}
              size="sm"
              onClick={() => setShowPosts(false)}
              data-testid="tab-chat"
            >
              Chat
            </Button>
          </div>
          {isFounder && showPosts && (
            <CreatePostDialog onSuccess={() => queryClient.invalidateQueries({ queryKey: ["/api/founder-posts"] })} />
          )}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {showPosts ? (
          <ScrollArea className="flex-1 p-6">
            {postsLoading ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">Loading posts...</p>
              </div>
            ) : founderPosts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <Sparkles className="h-12 w-12 text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">No posts yet</p>
                <p className="text-sm text-muted-foreground/70">Check back later for updates from the founder!</p>
              </div>
            ) : (
              <div className="max-w-lg mx-auto space-y-6">
                {founderPosts.map((post) => (
                  <FounderPostCard key={post.id} post={post} />
                ))}
              </div>
            )}
          </ScrollArea>
        ) : (
          <>
            <div className="w-48 min-w-[180px] border-r flex flex-col bg-muted/30">
              <div className="p-3 border-b">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>Channels</span>
                </div>
              </div>
              <ScrollArea className="flex-1">
                <div className="p-2 space-y-1">
                  {channelsLoading ? (
                    <div className="p-4 text-center text-muted-foreground text-sm">
                      Loading channels...
                    </div>
                  ) : (
                    channels.map((channel) => (
                      <button
                        key={channel.id}
                        onClick={() => setSelectedChannelId(channel.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition-colors hover-elevate ${
                          selectedChannelId === channel.id
                            ? "bg-primary/10 text-primary"
                            : "text-foreground"
                        }`}
                        data-testid={`channel-button-${channel.id}`}
                      >
                        <ChannelIcon icon={channel.icon} className="h-4 w-4 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{channel.name}</div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>

            <div className="flex-1 flex flex-col">
          {selectedChannel ? (
            <>
              <div className="p-4 border-b bg-background">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ChannelIcon icon={selectedChannel.icon} className="h-5 w-5 text-primary" />
                    <h2 className="font-semibold">{selectedChannel.name}</h2>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground" title={isConnected ? "Connected - Real-time updates enabled" : "Connecting..."}>
                    {isConnected ? (
                      <Wifi className="h-3 w-3 text-green-500" />
                    ) : (
                      <WifiOff className="h-3 w-3 text-yellow-500" />
                    )}
                  </div>
                </div>
                {selectedChannel.description && (
                  <p className="text-sm text-muted-foreground mt-1">{selectedChannel.description}</p>
                )}
              </div>

              <ScrollArea className="flex-1 p-4">
                {messagesLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">Loading messages...</p>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <MessageCircle className="h-12 w-12 text-muted-foreground/50 mb-3" />
                    <p className="text-muted-foreground">No messages yet</p>
                    <p className="text-sm text-muted-foreground/70">Be the first to start the conversation!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {groupMessagesByDate(messages).map((group) => (
                      <div key={group.date}>
                        <div className="flex items-center justify-center my-4">
                          <Badge variant="secondary" className="text-xs font-normal">
                            {group.date}
                          </Badge>
                        </div>
                        <div className="space-y-3">
                          {group.messages.map((message, index) => (
                            <MessageBubble
                              key={message.id}
                              message={message}
                              isOwn={message.userId === currentUser?.id}
                              showAvatar={shouldShowAvatar(group.messages, index)}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </ScrollArea>

              <form onSubmit={handleSendMessage} className="p-4 border-t bg-background">
                <div className="flex gap-2">
                  <Input
                    ref={inputRef}
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1"
                    data-testid="input-message"
                    disabled={sendMessage.isPending}
                  />
                  <Button
                    type="submit"
                    size="icon"
                    disabled={!messageInput.trim() || sendMessage.isPending}
                    data-testid="button-send-message"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-muted-foreground">Select a channel to start chatting</p>
            </div>
          )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
