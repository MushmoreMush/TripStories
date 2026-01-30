import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Send, ArrowLeft } from "lucide-react";

interface Conversation {
  partner: {
    id: string;
    firstName: string;
    lastName: string;
    username?: string;
  };
  lastMessage: {
    content: string;
    createdAt: string;
  };
  unreadCount: number;
}

interface Message {
  id: number;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
  sender: { firstName: string; lastName: string };
}

export default function Messages() {
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const queryClient = useQueryClient();

  const { data: conversations = [] } = useQuery<Conversation[]>({
    queryKey: ["/api/messages/conversations"],
  });

  const { data: messages = [] } = useQuery<Message[]>({
    queryKey: ["/api/messages", selectedFriendId],
    enabled: !!selectedFriendId,
  });

  const { data: friends = [] } = useQuery<any[]>({
    queryKey: ["/api/friends"],
  });

  const sendMessage = useMutation({
    mutationFn: async (data: { receiverId: string; content: string }) => {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages", selectedFriendId] });
      queryClient.invalidateQueries({ queryKey: ["/api/messages/conversations"] });
      setNewMessage("");
    },
  });

  const handleSend = () => {
    if (newMessage.trim() && selectedFriendId) {
      sendMessage.mutate({ receiverId: selectedFriendId, content: newMessage });
    }
  };

  const selectedConversation = conversations.find(c => c.partner.id === selectedFriendId);

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
        <MessageCircle className="h-8 w-8" />
        Messages
      </h1>

      <div className="grid md:grid-cols-3 gap-4 h-[600px]">
        {/* Conversations List */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Conversations</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px]">
              {conversations.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  <p>No conversations yet</p>
                  <p className="text-sm mt-2">Start chatting with a friend!</p>
                </div>
              ) : (
                conversations.map((conv) => (
                  <div
                    key={conv.partner.id}
                    className={`p-4 border-b cursor-pointer hover:bg-muted transition-colors ${
                      selectedFriendId === conv.partner.id ? "bg-muted" : ""
                    }`}
                    onClick={() => setSelectedFriendId(conv.partner.id)}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>
                          {conv.partner.firstName?.[0]}{conv.partner.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium truncate">
                            {conv.partner.firstName} {conv.partner.lastName}
                          </p>
                          {conv.unreadCount > 0 && (
                            <Badge variant="default" className="ml-2">
                              {conv.unreadCount}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {conv.lastMessage?.content}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}

              {/* Show friends to start new conversations */}
              {conversations.length === 0 && friends.length > 0 && (
                <div className="p-4">
                  <p className="text-sm font-medium mb-2">Your Friends</p>
                  {friends.map((friend) => (
                    <div
                      key={friend.id}
                      className="p-2 rounded cursor-pointer hover:bg-muted"
                      onClick={() => setSelectedFriendId(friend.id)}
                    >
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {friend.firstName?.[0]}{friend.lastName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">
                          {friend.firstName} {friend.lastName}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Chat Area */}
        <Card className="md:col-span-2">
          {selectedFriendId ? (
            <>
              <CardHeader className="border-b">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden"
                    onClick={() => setSelectedFriendId(null)}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <Avatar>
                    <AvatarFallback>
                      {selectedConversation?.partner.firstName?.[0]}
                      {selectedConversation?.partner.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <CardTitle className="text-lg">
                    {selectedConversation?.partner.firstName || "Friend"}{" "}
                    {selectedConversation?.partner.lastName}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-0 flex flex-col h-[480px]">
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${
                          msg.senderId !== selectedFriendId ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg px-4 py-2 ${
                            msg.senderId !== selectedFriendId
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                        >
                          <p>{msg.content}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {new Date(msg.createdAt).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                <div className="p-4 border-t flex gap-2">
                  <Input
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  />
                  <Button onClick={handleSend} disabled={!newMessage.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </>
          ) : (
            <CardContent className="h-full flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select a conversation to start chatting</p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
