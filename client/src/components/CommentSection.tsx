import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle, Send, Trash2, Loader2, Reply, CornerDownRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { ThreadedComment, CommentWithUser, User } from "@shared/schema";

interface CommentSectionProps {
  reportId: number;
  currentUser: User | null;
}

function SingleComment({
  comment,
  currentUser,
  reportId,
  onReply,
  isReply = false,
}: {
  comment: CommentWithUser;
  currentUser: User | null;
  reportId: number;
  onReply?: (parentId: number) => void;
  isReply?: boolean;
}) {
  const { toast } = useToast();
  
  const deleteMutation = useMutation({
    mutationFn: async (commentId: number) => {
      await apiRequest("DELETE", `/api/comments/${commentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reports", reportId, "comments"] });
      toast({ title: "Comment deleted" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete comment", variant: "destructive" });
    },
  });

  const initials = comment.user?.username?.[0]?.toUpperCase() || "U";
  const name = comment.user?.username || "Anonymous";
  const isOwner = currentUser?.id === comment.userId;

  return (
    <div
      className={`flex gap-3 group ${isReply ? "pl-6 border-l-2 border-muted ml-4" : ""}`}
      data-testid={`comment-${comment.id}`}
    >
      <Avatar className={isReply ? "h-6 w-6" : "h-8 w-8"}>
        <AvatarImage
          src={comment.user?.profileImageUrl || undefined}
          alt={name}
          className="object-cover"
        />
        <AvatarFallback className="text-xs bg-primary/10 text-primary">
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`font-medium ${isReply ? "text-xs" : "text-sm"}`}>{name}</span>
          <span className="text-xs text-muted-foreground">
            {comment.createdAt
              ? formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })
              : "Just now"}
          </span>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {!isReply && currentUser && onReply && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2"
                onClick={() => onReply(comment.id)}
                data-testid={`button-reply-comment-${comment.id}`}
              >
                <Reply className="h-3 w-3 mr-1" />
                <span className="text-xs">Reply</span>
              </Button>
            )}
            {isOwner && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => deleteMutation.mutate(comment.id)}
                disabled={deleteMutation.isPending}
                data-testid={`button-delete-comment-${comment.id}`}
              >
                <Trash2 className="h-3 w-3 text-destructive" />
              </Button>
            )}
          </div>
        </div>
        <p className={`text-muted-foreground mt-0.5 ${isReply ? "text-xs" : "text-sm"}`}>
          {comment.content}
        </p>
      </div>
    </div>
  );
}

export function CommentSection({ reportId, currentUser }: CommentSectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState("");
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const { toast } = useToast();

  const { data: comments = [], isLoading } = useQuery<ThreadedComment[]>({
    queryKey: ["/api/reports", reportId, "comments"],
    queryFn: async () => {
      const res = await fetch(`/api/reports/${reportId}/comments`);
      if (!res.ok) throw new Error(`${res.status}: ${res.statusText}`);
      return res.json();
    },
    enabled: isOpen,
  });

  const createMutation = useMutation({
    mutationFn: async ({ content, parentId }: { content: string; parentId?: number }) => {
      await apiRequest("POST", `/api/reports/${reportId}/comments`, { 
        content,
        reportId,
        parentId: parentId || undefined,
      });
    },
    onSuccess: () => {
      setContent("");
      setReplyingTo(null);
      queryClient.invalidateQueries({ queryKey: ["/api/reports", reportId, "comments"] });
      toast({ title: replyingTo ? "Reply added" : "Comment added" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add comment", variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim()) {
      createMutation.mutate({ content: content.trim(), parentId: replyingTo || undefined });
    }
  };

  const handleReply = (parentId: number) => {
    setReplyingTo(parentId);
  };

  const cancelReply = () => {
    setReplyingTo(null);
    setContent("");
  };

  const replyingToComment = replyingTo 
    ? comments.find(c => c.id === replyingTo)
    : null;

  return (
    <div className="pt-3 border-t">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="text-muted-foreground"
        data-testid={`button-toggle-comments-${reportId}`}
      >
        <MessageCircle className="h-4 w-4 mr-2" />
        {isOpen ? "Hide Comments" : "Comments"}
      </Button>

      {isOpen && (
        <div className="mt-3 space-y-4">
          {currentUser && (
            <form onSubmit={handleSubmit} className="space-y-2">
              {replyingTo && replyingToComment && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                  <CornerDownRight className="h-3 w-3" />
                  <span>
                    Replying to {replyingToComment.user?.username || "Anonymous"}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-5 px-2 ml-auto"
                    onClick={cancelReply}
                  >
                    Cancel
                  </Button>
                </div>
              )}
              <div className="flex gap-2">
                <Textarea
                  placeholder={replyingTo ? "Write a reply..." : "Share your support or thoughts..."}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="min-h-[60px] resize-none flex-1"
                  data-testid={`textarea-comment-${reportId}`}
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={!content.trim() || createMutation.isPending}
                  data-testid={`button-submit-comment-${reportId}`}
                >
                  {createMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </form>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : comments.length > 0 ? (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="space-y-2">
                  <SingleComment
                    comment={comment}
                    currentUser={currentUser}
                    reportId={reportId}
                    onReply={handleReply}
                  />
                  {comment.replies && comment.replies.length > 0 && (
                    <div className="space-y-2 mt-2">
                      {comment.replies.map((reply) => (
                        <SingleComment
                          key={reply.id}
                          comment={reply}
                          currentUser={currentUser}
                          reportId={reportId}
                          isReply
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-2">
              No comments yet. Be the first to share your support.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
