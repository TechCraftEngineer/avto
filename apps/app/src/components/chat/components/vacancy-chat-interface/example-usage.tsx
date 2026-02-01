/**
 * Example usage of VacancyChatInterface component
 *
 * This file demonstrates how to integrate the VacancyChatInterface
 * into a page or component.
 */

import type { VacancyDocument } from "~/hooks/use-vacancy-chat";
import { VacancyChatInterface } from "./index";

/**
 * Example 1: Basic usage with workspace ID
 */
export function BasicExample({
  workspaceId,
  orgSlug,
  workspaceSlug,
}: {
  workspaceId: string;
  orgSlug: string;
  workspaceSlug: string;
}) {
  return (
    <VacancyChatInterface
      workspaceId={workspaceId}
      orgSlug={orgSlug}
      workspaceSlug={workspaceSlug}
    />
  );
}

/**
 * Example 2: With initial document
 */
export function WithInitialDocumentExample({
  workspaceId,
  orgSlug,
  workspaceSlug,
}: {
  workspaceId: string;
  orgSlug: string;
  workspaceSlug: string;
}) {
  const initialDocument: VacancyDocument = {
    title: "Senior TypeScript Developer",
    description: "We are looking for an experienced developer...",
  };

  return (
    <VacancyChatInterface
      workspaceId={workspaceId}
      orgSlug={orgSlug}
      workspaceSlug={workspaceSlug}
      initialDocument={initialDocument}
    />
  );
}

/**
 * Example 3: With save handler
 */
export function WithSaveHandlerExample({
  workspaceId,
  orgSlug,
  workspaceSlug,
  onNavigate,
}: {
  workspaceId: string;
  orgSlug: string;
  workspaceSlug: string;
  onNavigate: (vacancyId: string) => void;
}) {
  const handleSave = async (document: VacancyDocument) => {
    // Call your API to save the vacancy
    const response = await fetch("/api/vacancy/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        workspaceId,
        ...document,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to save vacancy");
    }

    const { id } = await response.json();
    onNavigate(id);
  };

  return (
    <VacancyChatInterface
      workspaceId={workspaceId}
      orgSlug={orgSlug}
      workspaceSlug={workspaceSlug}
      onSave={handleSave}
    />
  );
}

/**
 * Example 4: Full page integration
 */
export function FullPageExample({
  workspaceId,
  orgSlug,
  workspaceSlug,
}: {
  workspaceId: string;
  orgSlug: string;
  workspaceSlug: string;
}) {
  const handleSave = async (document: VacancyDocument) => {
    const response = await fetch("/api/vacancy/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        workspaceId,
        ...document,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to save vacancy");
    }

    const { id } = await response.json();

    // Navigate to the vacancy page
    window.location.href = `/orgs/${orgSlug}/workspaces/${workspaceSlug}/vacancies/${id}`;
  };

  return (
    <div className="h-screen">
      <VacancyChatInterface
        workspaceId={workspaceId}
        orgSlug={orgSlug}
        workspaceSlug={workspaceSlug}
        onSave={handleSave}
      />
    </div>
  );
}
