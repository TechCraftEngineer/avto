import { and, eq } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import { webChatLink } from "@qbs-autonaim/db/schema";
import { getInterviewBaseUrl } from "@qbs-autonaim/server-utils";
import { generateSlug } from "../utils/slug-generator";

export interface WebChatLink {
  id: string;
  entityType: string;
  entityId: string;
  responseId: string | null;
  token: string;
  url: string;
  isActive: boolean;
  createdAt: Date;
  expiresAt: Date | null;
  metadata?: Record<string, unknown>;
}

export class WebChatLinkGenerator {
  private readonly baseUrl: string;

  constructor() {
    try {
      this.baseUrl = getInterviewBaseUrl();
    } catch {
      throw new Error(
        "Не удалось инициализировать WebChatLinkGenerator: отсутствует NEXT_PUBLIC_INTERVIEW_URL",
      );
    }
  }

  private async generateUniqueToken(): Promise<string> {
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      const token = generateSlug();
      
      const existing = await db.query.webChatLink.findFirst({
        where: eq(webChatLink.token, token),
      });

      if (!existing) {
        return token;
      }

      attempts++;
    }

    return `${generateSlug()}-${Date.now()}`;
  }

  async generateLink(
    entityType: string,
    entityId: string,
    responseId?: string,
    expiresAt?: Date,
    metadata?: Record<string, unknown>,
  ): Promise<WebChatLink> {
    const existingLink = await db.query.webChatLink.findFirst({
      where: responseId
        ? eq(webChatLink.responseId, responseId)
        : and(
            eq(webChatLink.entityType, entityType as any),
            eq(webChatLink.entityId, entityId),
            eq(webChatLink.responseId, null as any),
          ),
    });

    if (existingLink) {
      if (existingLink.isActive) {
        return {
          id: existingLink.id,
          entityType: existingLink.entityType,
          entityId: existingLink.entityId,
          responseId: existingLink.responseId,
          token: existingLink.token,
          url: this.buildUrl(existingLink.token),
          isActive: existingLink.isActive,
          createdAt: existingLink.createdAt,
          expiresAt: existingLink.expiresAt,
          metadata: existingLink.metadata || undefined,
        };
      } else {
        const updatedLink = await db
          .update(webChatLink)
          .set({ isActive: true, expiresAt })
          .where(eq(webChatLink.id, existingLink.id))
          .returning();

        if (updatedLink[0]) {
          return {
            id: updatedLink[0].id,
            entityType: updatedLink[0].entityType,
            entityId: updatedLink[0].entityId,
            responseId: updatedLink[0].responseId,
            token: updatedLink[0].token,
            url: this.buildUrl(updatedLink[0].token),
            isActive: updatedLink[0].isActive,
            createdAt: updatedLink[0].createdAt,
            expiresAt: updatedLink[0].expiresAt,
            metadata: updatedLink[0].metadata || undefined,
          };
        } else {
          throw new Error("Failed to update web chat link");
        }
      }
    }

    const token = await this.generateUniqueToken();

    const newLink = await db
      .insert(webChatLink)
      .values({
        entityType: entityType as any,
        entityId,
        responseId,
        token,
        isActive: true,
        expiresAt,
        metadata,
      })
      .returning();

    if (newLink[0]) {
      return {
        id: newLink[0].id,
        entityType: newLink[0].entityType,
        entityId: newLink[0].entityId,
        responseId: newLink[0].responseId,
        token: newLink[0].token,
        url: this.buildUrl(newLink[0].token),
        isActive: newLink[0].isActive,
        createdAt: newLink[0].createdAt,
        expiresAt: newLink[0].expiresAt,
        metadata: newLink[0].metadata || undefined,
      };
    } else {
      throw new Error("Failed to create web chat link");
    }
  }

  async validateToken(token: string): Promise<WebChatLink | null> {
    const link = await db.query.webChatLink.findFirst({
      where: and(eq(webChatLink.token, token), eq(webChatLink.isActive, true)),
    });

    if (!link) {
      return null;
    }

    if (link.expiresAt && link.expiresAt < new Date()) {
      return null;
    }

    return {
      id: link.id,
      entityType: link.entityType,
      entityId: link.entityId,
      responseId: link.responseId,
      token: link.token,
      url: this.buildUrl(link.token),
      isActive: link.isActive,
      createdAt: link.createdAt,
      expiresAt: link.expiresAt,
      metadata: link.metadata || undefined,
    };
  }

  async deactivateLink(token: string): Promise<boolean> {
    const result = await db
      .update(webChatLink)
      .set({ isActive: false })
      .where(eq(webChatLink.token, token))
      .returning();

    return result.length > 0;
  }

  private buildUrl(token: string): string {
    return `${this.baseUrl}/chat/${token}`;
  }

  async getLinkByResponseId(responseId: string): Promise<WebChatLink | null> {
    const link = await db.query.webChatLink.findFirst({
      where: eq(webChatLink.responseId, responseId),
    });

    if (!link) {
      return null;
    }

    return {
      id: link.id,
      entityType: link.entityType,
      entityId: link.entityId,
      responseId: link.responseId,
      token: link.token,
      url: this.buildUrl(link.token),
      isActive: link.isActive,
      createdAt: link.createdAt,
      expiresAt: link.expiresAt,
      metadata: link.metadata || undefined,
    };
  }

  async getUniversalLink(entityType: string, entityId: string): Promise<WebChatLink | null> {
    const link = await db.query.webChatLink.findFirst({
      where: and(
        eq(webChatLink.entityType, entityType as any),
        eq(webChatLink.entityId, entityId),
        eq(webChatLink.responseId, null as any),
      ),
    });

    if (!link) {
      return null;
    }

    return {
      id: link.id,
      entityType: link.entityType,
      entityId: link.entityId,
      responseId: link.responseId,
      token: link.token,
      url: this.buildUrl(link.token),
      isActive: link.isActive,
      createdAt: link.createdAt,
      expiresAt: link.expiresAt,
      metadata: link.metadata || undefined,
    };
  }
}
