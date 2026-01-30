/**
 * Property-Based Tests for Session State Machine
 *
 * Feature: candidate-prequalification
 * Property 3: Session State Machine Transitions
 * Property 11: Consent Requirement Enforcement
 *
 * These tests are MANDATORY for MVP sign-off as they enforce
 * security and compliance requirements.
 */

import { describe, expect, it } from "bun:test";
import * as fc from "fast-check";

import {
  isValidStatusTransition,
  SESSION_STATUS_TRANSITIONS,
  type SessionStatus,
} from "./types";

// All possible session statuses
const ALL_STATUSES: SessionStatus[] = [
  "consent_pending",
  "resume_pending",
  "dialogue_active",
  "evaluating",
  "completed",
  "submitted",
  "expired",
];

// Arbitrary for generating random session statuses
const sessionStatusArb = fc.constantFrom(...ALL_STATUSES);

// Arbitrary for generating pairs of statuses
const statusPairArb = fc.tuple(sessionStatusArb, sessionStatusArb);

describe("Session State Machine", () => {
  /**
   * Property 3: Session State Machine Transitions
   *
   * *For any* PrequalificationSession, the status transitions SHALL follow the valid state machine:
   * - `consent_pending` → `resume_pending` (only after consent)
   * - `resume_pending` → `dialogue_active` (only after successful resume upload)
   * - `dialogue_active` → `evaluating` (only after sufficient dialogue)
   * - `evaluating` → `completed` (only after evaluation)
   * - `completed` → `submitted` (only if fitDecision is strong_fit or potential_fit)
   *
   * **Validates: Requirements 1.6, 2.4**
   */
  describe("Property 3: Session State Machine Transitions", () => {
    it("should only allow valid transitions as defined in the state machine", () => {
      fc.assert(
        fc.property(statusPairArb, ([fromStatus, toStatus]) => {
          const isValid = isValidStatusTransition(fromStatus, toStatus);
          const expectedValid =
            SESSION_STATUS_TRANSITIONS[fromStatus].includes(toStatus);

          expect(isValid).toBe(expectedValid);
        }),
        { numRuns: 100 },
      );
    });

    it("consent_pending can only transition to resume_pending or expired", () => {
      fc.assert(
        fc.property(sessionStatusArb, (toStatus) => {
          const isValid = isValidStatusTransition("consent_pending", toStatus);
          const expectedValid =
            toStatus === "resume_pending" || toStatus === "expired";

          expect(isValid).toBe(expectedValid);
        }),
        { numRuns: 100 },
      );
    });

    it("resume_pending can only transition to dialogue_active or expired", () => {
      fc.assert(
        fc.property(sessionStatusArb, (toStatus) => {
          const isValid = isValidStatusTransition("resume_pending", toStatus);
          const expectedValid =
            toStatus === "dialogue_active" || toStatus === "expired";

          expect(isValid).toBe(expectedValid);
        }),
        { numRuns: 100 },
      );
    });

    it("dialogue_active can only transition to evaluating or expired", () => {
      fc.assert(
        fc.property(sessionStatusArb, (toStatus) => {
          const isValid = isValidStatusTransition("dialogue_active", toStatus);
          const expectedValid =
            toStatus === "evaluating" || toStatus === "expired";

          expect(isValid).toBe(expectedValid);
        }),
        { numRuns: 100 },
      );
    });

    it("evaluating can only transition to completed or expired", () => {
      fc.assert(
        fc.property(sessionStatusArb, (toStatus) => {
          const isValid = isValidStatusTransition("evaluating", toStatus);
          const expectedValid =
            toStatus === "completed" || toStatus === "expired";

          expect(isValid).toBe(expectedValid);
        }),
        { numRuns: 100 },
      );
    });

    it("completed can only transition to submitted or expired", () => {
      fc.assert(
        fc.property(sessionStatusArb, (toStatus) => {
          const isValid = isValidStatusTransition("completed", toStatus);
          const expectedValid =
            toStatus === "submitted" || toStatus === "expired";

          expect(isValid).toBe(expectedValid);
        }),
        { numRuns: 100 },
      );
    });

    it("submitted is a terminal state with no valid transitions", () => {
      fc.assert(
        fc.property(sessionStatusArb, (toStatus) => {
          const isValid = isValidStatusTransition("submitted", toStatus);
          expect(isValid).toBe(false);
        }),
        { numRuns: 100 },
      );
    });

    it("expired is a terminal state with no valid transitions", () => {
      fc.assert(
        fc.property(sessionStatusArb, (toStatus) => {
          const isValid = isValidStatusTransition("expired", toStatus);
          expect(isValid).toBe(false);
        }),
        { numRuns: 100 },
      );
    });

    it("transitions follow a forward-only progression (no going back)", () => {
      // Define the expected order of statuses in the happy path
      const statusOrder: SessionStatus[] = [
        "consent_pending",
        "resume_pending",
        "dialogue_active",
        "evaluating",
        "completed",
        "submitted",
      ];

      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: statusOrder.length - 1 }),
          fc.integer({ min: 0, max: statusOrder.length - 1 }),
          (fromIdx, toIdx) => {
            const fromStatus = statusOrder.at(fromIdx);
            const toStatus = statusOrder.at(toIdx);

            if (!fromStatus || !toStatus) return;

            // If trying to go backwards (toIdx < fromIdx), it should be invalid
            // Exception: any status can go to expired
            if (toIdx < fromIdx) {
              const isValid = isValidStatusTransition(fromStatus, toStatus);
              expect(isValid).toBe(false);
            }
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Property 11: Consent Requirement Enforcement
   *
   * *For any* PrequalificationSession, the status SHALL NOT progress beyond
   * 'consent_pending' until consentGivenAt is set to a non-null timestamp.
   *
   * **Validates: Requirements 8.1**
   *
   * This property is tested at the type/logic level. The actual enforcement
   * is done in the SessionManager.createSession and SessionManager.updateSessionStatus
   * methods which check for consent before allowing transitions.
   */
  describe("Property 11: Consent Requirement Enforcement", () => {
    it("consent_pending must transition to resume_pending before any other non-terminal state", () => {
      // The only valid non-terminal transition from consent_pending is to resume_pending
      const nonTerminalStatuses: SessionStatus[] = [
        "resume_pending",
        "dialogue_active",
        "evaluating",
        "completed",
        "submitted",
      ];

      fc.assert(
        fc.property(fc.constantFrom(...nonTerminalStatuses), (toStatus) => {
          const isValid = isValidStatusTransition("consent_pending", toStatus);

          // Only resume_pending should be valid (which requires consent)
          if (toStatus === "resume_pending") {
            expect(isValid).toBe(true);
          } else {
            expect(isValid).toBe(false);
          }
        }),
        { numRuns: 100 },
      );
    });

    it("cannot skip consent_pending to reach dialogue_active directly", () => {
      const isValid = isValidStatusTransition(
        "consent_pending",
        "dialogue_active",
      );
      expect(isValid).toBe(false);
    });

    it("cannot skip consent_pending to reach evaluating directly", () => {
      const isValid = isValidStatusTransition("consent_pending", "evaluating");
      expect(isValid).toBe(false);
    });

    it("cannot skip consent_pending to reach completed directly", () => {
      const isValid = isValidStatusTransition("consent_pending", "completed");
      expect(isValid).toBe(false);
    });

    it("cannot skip consent_pending to reach submitted directly", () => {
      const isValid = isValidStatusTransition("consent_pending", "submitted");
      expect(isValid).toBe(false);
    });

    it("the only path from consent_pending to any advanced state goes through resume_pending", () => {
      // This property verifies that consent (represented by the transition to resume_pending)
      // is a mandatory step before any further progress
      const advancedStates: SessionStatus[] = [
        "dialogue_active",
        "evaluating",
        "completed",
        "submitted",
      ];

      fc.assert(
        fc.property(fc.constantFrom(...advancedStates), (targetState) => {
          // Direct transition from consent_pending to advanced state should be invalid
          const directTransition = isValidStatusTransition(
            "consent_pending",
            targetState,
          );
          expect(directTransition).toBe(false);

          // But transition from consent_pending to resume_pending should be valid
          const consentTransition = isValidStatusTransition(
            "consent_pending",
            "resume_pending",
          );
          expect(consentTransition).toBe(true);
        }),
        { numRuns: 100 },
      );
    });
  });
});
