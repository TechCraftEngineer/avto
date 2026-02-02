"use client";

import {
  Badge,
  Button,
  Input,
  ScrollArea,
  Separator,
  Textarea,
} from "@qbs-autonaim/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import { MessageSquare, Plus, Send, Tag as TagIcon, X } from "lucide-react";
import { useState } from "react";
import { toast } from "~/hooks/use-toast";
import { useWorkspace } from "~/hooks/use-workspace";
import { useTRPC } from "~/trpc/react";

interface NotesTagsTabProps {
  responseId: string;
}

export function NotesTagsTab({ responseId }: NotesTagsTabProps) {
  const { workspace } = useWorkspace();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [newTag, setNewTag] = useState("");
  const [newComment, setNewComment] = useState("");
  const [isPrivate, setIsPrivate] = useState(true);

  // Загрузка тегов
  const { data: tags, isLoading: tagsLoading } = useQuery({
    ...trpc.vacancy.responses.listTags.queryOptions({
      responseId,
      workspaceId: workspace?.id ?? "",
    }),
    enabled: !!workspace?.id,
  });

  // Загрузка комментариев
  const { data: comments, isLoading: commentsLoading } = useQuery({
    ...trpc.candidates.listComments.queryOptions({
      candidateId: responseId,
      workspaceId: workspace?.id ?? "",
    }),
    enabled: !!workspace?.id,
  });

  // Добавление тега
  const addTagMutation = useMutation(
    trpc.vacancy.responses.addTag.mutationOptions({
      onSuccess: () => {
        if (!workspace?.id) return;
        queryClient.invalidateQueries({
          queryKey: trpc.vacancy.responses.listTags.queryKey({
            responseId,
            workspaceId: workspace.id,
          }),
        });
        setNewTag("");
        toast("Тег добавлен");
      },
      onError: (error) => {
        toast.error(`Ошибка: ${error.message}`);
      },
    }),
  );

  // Удаление тега
  const removeTagMutation = useMutation(
    trpc.vacancy.responses.removeTag.mutationOptions({
      onSuccess: () => {
        if (!workspace?.id) return;
        queryClient.invalidateQueries({
          queryKey: trpc.vacancy.responses.listTags.queryKey({
            responseId,
            workspaceId: workspace.id,
          }),
        });
        toast("Тег удален");
      },
      onError: (error) => {
        toast.error(`Ошибка: ${error.message}`);
      },
    }),
  );

  // Добавление комментария
  const addCommentMutation = useMutation(
    trpc.candidates.addComment.mutationOptions({
      onSuccess: () => {
        if (!workspace?.id) return;
        queryClient.invalidateQueries({
          queryKey: trpc.candidates.listComments.queryKey({
            candidateId: responseId,
            workspaceId: workspace.id,
          }),
        });
        setNewComment("");
        toast("Комментарий добавлен");
      },
      onError: (error) => {
        toast.error(`Ошибка: ${error.message}`);
      },
    }),
  );

  const handleAddTag = () => {
    if (!newTag.trim() || !workspace?.id) return;
    addTagMutation.mutate({
      responseId,
      tag: newTag.trim(),
      workspaceId: workspace.id,
    });
  };

  const handleRemoveTag = (tag: string) => {
    if (!workspace?.id) return;
    removeTagMutation.mutate({
      responseId,
      tag,
      workspaceId: workspace.id,
    });
  };

  const handleAddComment = () => {
    if (!newComment.trim() || !workspace?.id) return;
    addCommentMutation.mutate({
      candidateId: responseId,
      content: newComment.trim(),
      isPrivate,
      workspaceId: workspace.id,
    });
  };

  return (
    <div className="space-y-6">
      {/* Теги */}
      <div>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <TagIcon className="h-4 w-4" />
          Теги
        </h3>

        {/* Добавление тега */}
        <div className="flex gap-2 mb-3">
          <Input
            placeholder="Добавить тег..."
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleAddTag();
              }
            }}
            maxLength={50}
            className="flex-1"
          />
          <Button
            size="sm"
            onClick={handleAddTag}
            disabled={!newTag.trim() || addTagMutation.isPending}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Список тегов */}
        {tagsLoading ? (
          <div className="flex gap-2 flex-wrap">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={`tag-skeleton-${index}-${Date.now()}`}
                className="h-6 w-20 bg-muted rounded-full animate-pulse"
              />
            ))}
          </div>
        ) : tags && tags.length > 0 ? (
          <div className="flex gap-2 flex-wrap">
            {tags.map((tag) => (
              <Badge
                key={tag.id}
                variant="secondary"
                className="gap-1 pr-1 cursor-pointer hover:bg-secondary/80"
              >
                {tag.tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag.tag)}
                  className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                  disabled={removeTagMutation.isPending}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Теги не добавлены</p>
        )}
      </div>

      <Separator />

      {/* Комментарии */}
      <div>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          Заметки рекрутера
        </h3>

        {/* Добавление комментария */}
        <div className="space-y-2 mb-4">
          <Textarea
            placeholder="Добавить заметку..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={3}
            className="resize-none"
          />
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
                className="rounded"
              />
              Приватная заметка (видна только команде)
            </label>
            <Button
              size="sm"
              onClick={handleAddComment}
              disabled={!newComment.trim() || addCommentMutation.isPending}
            >
              <Send className="h-4 w-4 mr-2" />
              Добавить
            </Button>
          </div>
        </div>

        {/* Список комментариев */}
        {commentsLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, index) => (
              <div
                key={`comment-skeleton-${index}-${Date.now()}`}
                className="p-4 border rounded-lg animate-pulse"
              >
                <div className="h-4 bg-muted rounded w-1/3 mb-2" />
                <div className="h-3 bg-muted rounded w-full" />
              </div>
            ))}
          </div>
        ) : comments && comments.length > 0 ? (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {comments.map((comment) => (
                <div key={comment.id} className="p-4 rounded-lg border bg-card">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      {comment.authorAvatar && (
                        <div
                          className="w-6 h-6 rounded-full bg-cover bg-center"
                          style={{
                            backgroundImage: `url(${comment.authorAvatar})`,
                          }}
                          role="img"
                          aria-label={comment.author}
                        />
                      )}
                      <span className="text-sm font-medium">
                        {comment.author}
                      </span>
                      {comment.isPrivate && (
                        <Badge variant="outline" className="text-xs">
                          Приватная
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(new Date(comment.createdAt), {
                        addSuffix: true,
                        locale: ru,
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-foreground whitespace-pre-wrap">
                    {comment.content}
                  </p>
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="rounded-lg border border-dashed bg-muted/20 text-center py-8 text-muted-foreground">
            <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Заметки пока не добавлены</p>
          </div>
        )}
      </div>
    </div>
  );
}
