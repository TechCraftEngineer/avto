"use client";

import type { RouterOutputs } from "@qbs-autonaim/api";
import { useState } from "react";
import { InterviewChat } from "./interview-chat";

interface WebChatClientProps {
  chatData: RouterOutputs["webChat"]["getByToken"];
}

export function WebChatClient({ chatData }: WebChatClientProps) {
  const [candidateName, setCandidateName] = useState(
    chatData.candidateData?.candidateName || "",
  );
  const [isNameFormVisible, setIsNameFormVisible] = useState(
    !chatData.candidateData?.candidateName,
  );

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsNameFormVisible(false);
  };

  if (isNameFormVisible) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6 rounded-lg border p-8">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold">Добро пожаловать!</h1>
            <p className="text-muted-foreground">
              Пожалуйста, введите ваше имя, чтобы начать чат
            </p>
          </div>

          <form onSubmit={handleNameSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium mb-2"
              >
                Имя
              </label>
              <input
                type="text"
                id="name"
                value={candidateName}
                onChange={(e) => setCandidateName(e.target.value)}
                placeholder="Введите ваше имя"
                required
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>

            <button
              type="submit"
              disabled={!candidateName.trim()}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 w-full"
            >
              Начать чат
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Chat Header */}
      <div className="border-b bg-background p-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-xl font-semibold mb-1">
            {chatData.entityData.title}
          </h1>
          <p className="text-sm text-muted-foreground">
            {chatData.candidateData?.candidateName || candidateName}
          </p>
        </div>
      </div>

      {/* Chat Content */}
      <div className="flex-1">
        <InterviewChat
          conversationId={chatData.webChatLink.id}
          apiEndpoint="/api/web-chat/stream"
          className="h-full"
          token={chatData.webChatLink.token}
        />
      </div>
    </div>
  );
}