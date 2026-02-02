"use client";

import { Button } from "@qbs-autonaim/ui/button";
import { Card } from "@qbs-autonaim/ui/card";
import { Textarea } from "@qbs-autonaim/ui/textarea";
import { IconCheck, IconEdit, IconX } from "@tabler/icons-react";
import { useState } from "react";
import type { VacancyDocument } from "./types";

interface DocumentSectionProps {
  title: string;
  content: string;
  sectionKey?: keyof VacancyDocument;
  editingSection?: string | null;
  onEditSection?: (section: string | null) => void;
  onUpdateSection?: (section: keyof VacancyDocument, content: string) => void;
}

export function DocumentSection({
  title,
  content,
  sectionKey,
  editingSection,
  onEditSection,
  onUpdateSection,
}: DocumentSectionProps) {
  const [editContent, setEditContent] = useState(content);
  const isEditing = editingSection === sectionKey;
  const canEdit = !!sectionKey && !!onEditSection && !!onUpdateSection;

  const handleStartEdit = () => {
    if (canEdit) {
      setEditContent(content);
      onEditSection(sectionKey);
    }
  };

  const handleSave = () => {
    if (canEdit && sectionKey) {
      onUpdateSection(sectionKey, editContent);
      onEditSection(null);
    }
  };

  const handleCancel = () => {
    if (canEdit) {
      setEditContent(content);
      onEditSection(null);
    }
  };

  return (
    <Card className="group p-3 transition-all duration-300 md:p-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground md:text-sm">
          {title}
        </h2>
        {canEdit && !isEditing && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleStartEdit}
            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <IconEdit className="h-3 w-3" />
          </Button>
        )}
        {isEditing && (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSave}
              className="h-6 w-6 p-0 text-green-600 hover:text-green-700"
            >
              <IconCheck className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
            >
              <IconX className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>

      {isEditing ? (
        <Textarea
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          className="min-h-[100px] text-xs leading-relaxed md:text-sm resize-none"
          placeholder="Введите текст..."
          autoFocus
        />
      ) : (
        <div className="whitespace-pre-wrap text-xs leading-relaxed md:text-sm group">
          {content}
        </div>
      )}
    </Card>
  );
}

