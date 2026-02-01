"use client";

import { getInitials } from "@qbs-autonaim/shared/utils";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  Checkbox,
  Label,
  Textarea,
} from "@qbs-autonaim/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Lock, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { getAvatarUrl } from "~/lib/avatar";
import { useTRPC } from "~/trpc/react";

interface CommentsSectionProps {
  candidateId: string;
  workspaceId: string;
}

export function CommentsSection({
  candidateId,
  workspaceId,
}: CommentsSectionProps) {
  const [newComment, setNewComment] = useState("");
  const [isPrivate, setIsPrivate] = useState(true);
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { data: comments, isLoading } = useQuery({
    ...trpc.candidates.listComments.queryOptions({
      workspaceId,
      candidateId,
    }),
    enabled: !!workspaceId && !!candidateId,
  });

  const { mutate: addComment, isPending: isAddingComment } = useMutation(
    trpc.candidates.addComment.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.candidates.listComments.queryKey(),
        });
        setNewComment("");
        toast.success("Комментарий добавлен");
      },
      onError: () => {
        toast.error("Не удалось добавить комментарий");
      },
    }),
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    addComment({
      workspaceId,
      candidateId,
      content: newComment.trim(),
      isPrivate,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-3">
        <Textarea
          placeholder="Добавить заметку о кандидате…"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          onKeyDown={handleKeyDown}
          className="min-h-[100px] resize-none"
          disabled={isAddingComment}
          autoComplete="off"
        />
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Checkbox
              id="private-comment"
              checked={isPrivate}
              onCheckedChange={(checked) => setIsPrivate(checked === true)}
            />
            <Label
              htmlFor="private-comment"
              className="text-sm font-normal cursor-pointer flex items-center gap-1.5"
            >
              <Lock className="h-3.5 w-3.5 text-muted-foreground" />
              Приватная заметка
            </Label>
          </div>
          <Button
            type="submit"
            size="sm"
            disabled={!newComment.trim() || isAddingComment}
            className="gap-2"
          >
            <Send className="h-4 w-4" />
            {isAddingComment ? "Сохранение…" : "Добавить"}
          </Button>
        </div>
      </form>

      <div className="space-y-3 pt-3 border-t">
        {isLoading ? (
          <div className="text-sm text-muted-foreground text-center py-8">
            Загрузка…
          </div>
        ) : comments && comments.length > 0 ? (
          comments.map((comment) => (
            <div
              key={comment.id}
              className="p-3 rounded-lg bg-muted/50 space-y-2"
            >
              <div className="flex items-start gap-3">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarImage
                    src={getAvatarUrl(comment.authorAvatar, comment.author)}
                    alt={comment.author}
                  />
                  <AvatarFallback className="text-xs bg-primary/10 text-primary">
                    {getInitials(comment.author)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium">
                      {comment.author}
                    </span>
                    {comment.isPrivate && (
                      <Lock
                        className="h-3 w-3 text-muted-foreground"
                        aria-label="Приватная заметка"
                      />
                    )}
                    <span className="text-xs text-muted-foreground">
                      {new Date(comment.createdAt).toLocaleDateString("ru-RU", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-foreground whitespace-pre-wrap break-words">
                    {comment.content}
                  </p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-sm text-muted-foreground text-center py-8">
            Пока нет заметок
          </div>
        )}
      </div>
    </div>
  );
}
