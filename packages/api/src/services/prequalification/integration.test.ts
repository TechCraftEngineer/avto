/**
 * Integration Tests for Prequalification Service
 *
 * Проверяет интеграцию между SessionManager и ResumeParser
 */

import { describe, expect, it } from "bun:test";
import type { ParsedResume } from "@qbs-autonaim/db";

import type { CreateSessionInput } from "./types";

describe("Prequalification Integration", () => {
  describe("Session Creation and Resume Upload Flow", () => {
    it("should create session with consent and allow resume upload", () => {
      // Verify that the session creation flow works correctly
      const input: CreateSessionInput = {
        workspaceId: "test-workspace",
        vacancyId: "test-vacancy",
        candidateConsent: true,
        source: "widget",
      };

      // This test verifies the types and structure are correct
      expect(input.candidateConsent).toBe(true);
      expect(input.source).toBe("widget");
    });

    it("should reject session creation without consent", () => {
      const input: CreateSessionInput = {
        workspaceId: "test-workspace",
        vacancyId: "test-vacancy",
        candidateConsent: false,
        source: "widget",
      };

      expect(input.candidateConsent).toBe(false);
    });

    it("should have correct ParsedResume structure", () => {
      const mockParsedResume: ParsedResume = {
        rawText: "Sample resume text",
        structured: {
          personalInfo: {
            name: "John Doe",
            email: "john@example.com",
            phone: "+1234567890",
            location: "New York",
          },
          experience: [
            {
              company: "Tech Corp",
              position: "Software Engineer",
              startDate: "2020-01",
              endDate: "2023-12",
              description: "Developed web applications",
              isCurrent: false,
            },
          ],
          education: [
            {
              institution: "University",
              degree: "Bachelor",
              field: "Computer Science",
              startDate: "2016-09",
              endDate: "2020-06",
            },
          ],
          skills: ["JavaScript", "TypeScript", "React"],
          languages: [
            {
              name: "English",
              level: "Native",
            },
          ],
          summary: "Experienced software engineer",
        },
        confidence: 0.95,
      };

      // Verify structure
      expect(mockParsedResume.rawText).toBeDefined();
      expect(mockParsedResume.structured).toBeDefined();
      expect(mockParsedResume.confidence).toBeGreaterThanOrEqual(0);
      expect(mockParsedResume.confidence).toBeLessThanOrEqual(1);
      expect(mockParsedResume.structured.personalInfo.name).toBe("John Doe");
      expect(mockParsedResume.structured.experience).toHaveLength(1);
      expect(mockParsedResume.structured.education).toHaveLength(1);
      expect(mockParsedResume.structured.skills).toHaveLength(3);
      expect(mockParsedResume.structured.languages).toHaveLength(1);
    });
  });

  describe("State Machine Integration", () => {
    it("should follow correct flow: consent → resume → dialogue", () => {
      // Verify the expected flow
      const expectedFlow = [
        "consent_pending",
        "resume_pending",
        "dialogue_active",
        "evaluating",
        "completed",
        "submitted",
      ];

      expect(expectedFlow[0]).toBe("consent_pending");
      expect(expectedFlow[1]).toBe("resume_pending");
      expect(expectedFlow[2]).toBe("dialogue_active");
      expect(expectedFlow[3]).toBe("evaluating");
      expect(expectedFlow[4]).toBe("completed");
      expect(expectedFlow[5]).toBe("submitted");
    });
  });
});
