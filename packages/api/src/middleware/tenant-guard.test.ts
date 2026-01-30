/**
 * Property-Based Tests for Tenant Data Isolation
 *
 * Feature: candidate-prequalification
 * Property 9: Tenant Data Isolation
 *
 * *For any* data query with workspaceId parameter, the result set SHALL contain
 * ONLY records where record.workspaceId equals the query workspaceId.
 * No cross-tenant data leakage is permitted.
 *
 * **Validates: Requirements 5.3, 5.4, 7.1, 7.2**
 *
 * This property is MANDATORY for MVP sign-off as it enforces
 * tenant data isolation security.
 */

import { describe, expect, it } from "bun:test";
import type { DbClient, WorkspaceRepository } from "@qbs-autonaim/db";
import * as fc from "fast-check";
import type { AuditLogger } from "../services/audit-logger";
import {
  TenantGuard,
  TenantIsolationError,
  type TenantOperation,
  type TenantVerificationParams,
} from "./tenant-guard";

// All possible tenant operations
const ALL_OPERATIONS: TenantOperation[] = [
  "session_create",
  "session_read",
  "session_update",
  "resume_upload",
  "dialogue_message",
  "evaluation_read",
  "evaluation_create",
  "widget_config_read",
  "widget_config_update",
  "analytics_read",
  "analytics_export",
  "custom_domain_read",
  "custom_domain_update",
  "candidate_data_read",
  "candidate_data_export",
];

// Arbitrary for generating workspace IDs (UUID-like strings)
const workspaceIdArb = fc.uuid();

// Arbitrary for generating user IDs
const userIdArb = fc.uuid();

// Arbitrary for generating tenant operations
const operationArb = fc.constantFrom(...ALL_OPERATIONS);

// Arbitrary for generating IP addresses
const ipAddressArb = fc.oneof(fc.ipV4(), fc.constant(undefined));

// Arbitrary for generating user agents
const userAgentArb = fc.oneof(
  fc.string({ minLength: 1, maxLength: 100 }),
  fc.constant(undefined),
);

// Arbitrary for generating verification params
const verificationParamsArb = fc.record({
  workspaceId: workspaceIdArb,
  userId: fc.option(userIdArb, { nil: undefined }),
  operation: operationArb,
  resourceId: fc.option(fc.uuid(), { nil: undefined }),
  ipAddress: ipAddressArb,
  userAgent: userAgentArb,
});

// Mock workspace repository for testing
class MockWorkspaceRepository {
  private workspaces: Map<string, { id: string }> = new Map();
  private accessMap: Map<string, { role: string }> = new Map();

  addWorkspace(id: string): void {
    this.workspaces.set(id, { id });
  }

  grantAccess(
    workspaceId: string,
    userId: string,
    role: string = "member",
  ): void {
    this.accessMap.set(`${workspaceId}:${userId}`, { role });
  }

  async findById(id: string): Promise<{ id: string } | null> {
    return this.workspaces.get(id) ?? null;
  }

  async checkAccess(
    workspaceId: string,
    userId: string,
  ): Promise<{ role: string } | null> {
    return this.accessMap.get(`${workspaceId}:${userId}`) ?? null;
  }
}

// Mock audit logger for testing
class MockAuditLogger {
  public logs: Array<{
    userId: string;
    action: string;
    resourceType: string;
    resourceId: string;
    metadata?: Record<string, unknown>;
  }> = [];

  async logAccess(params: {
    userId: string;
    action: string;
    resourceType: string;
    resourceId: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    this.logs.push(params);
  }
}

// Type aliases for test mocks
type MockRepo = WorkspaceRepository;
type MockLogger = AuditLogger;
type MockDb = DbClient;

describe("Tenant Data Isolation", () => {
  /**
   * Property 9: Tenant Data Isolation
   *
   * *For any* data query with workspaceId parameter, the result set SHALL contain
   * ONLY records where record.workspaceId equals the query workspaceId.
   * No cross-tenant data leakage is permitted.
   *
   * **Validates: Requirements 5.3, 5.4, 7.1, 7.2**
   */
  describe("Property 9: Tenant Data Isolation", () => {
    it("verifyResourceOwnership rejects mismatched workspace IDs", () => {
      fc.assert(
        fc.property(
          workspaceIdArb,
          workspaceIdArb,
          (resourceWorkspaceId, requestedWorkspaceId) => {
            // Skip if IDs happen to match (rare but possible)
            if (resourceWorkspaceId === requestedWorkspaceId) {
              return true;
            }

            const mockRepo = new MockWorkspaceRepository();
            const mockLogger = new MockAuditLogger();
            const guard = new TenantGuard(
              mockRepo as unknown as MockRepo,
              mockLogger as unknown as MockLogger,
              {} as MockDb,
            );

            // Should throw TenantIsolationError for mismatched IDs
            expect(() => {
              guard.verifyResourceOwnership(
                resourceWorkspaceId,
                requestedWorkspaceId,
              );
            }).toThrow(TenantIsolationError);

            try {
              guard.verifyResourceOwnership(
                resourceWorkspaceId,
                requestedWorkspaceId,
              );
            } catch (error) {
              expect(error).toBeInstanceOf(TenantIsolationError);
              expect((error as TenantIsolationError).code).toBe(
                "TENANT_MISMATCH",
              );
            }
          },
        ),
        { numRuns: 100 },
      );
    });

    it("verifyResourceOwnership accepts matching workspace IDs", () => {
      fc.assert(
        fc.property(workspaceIdArb, (workspaceId) => {
          const mockRepo = new MockWorkspaceRepository();
          const mockLogger = new MockAuditLogger();
          const guard = new TenantGuard(
            mockRepo as unknown as MockRepo,
            mockLogger as unknown as MockLogger,
            {} as MockDb,
          );

          // Should not throw for matching IDs
          expect(() => {
            guard.verifyResourceOwnership(workspaceId, workspaceId);
          }).not.toThrow();
        }),
        { numRuns: 100 },
      );
    });

    it("verifyAccess rejects non-existent workspaces", async () => {
      await fc.assert(
        fc.asyncProperty(verificationParamsArb, async (params) => {
          const mockRepo = new MockWorkspaceRepository();
          const mockLogger = new MockAuditLogger();
          const guard = new TenantGuard(
            mockRepo as unknown as MockRepo,
            mockLogger as unknown as MockLogger,
            {} as MockDb,
          );

          // Workspace doesn't exist, should throw
          await expect(guard.verifyAccess(params)).rejects.toThrow(
            TenantIsolationError,
          );

          try {
            await guard.verifyAccess(params);
          } catch (error) {
            expect(error).toBeInstanceOf(TenantIsolationError);
            expect((error as TenantIsolationError).code).toBe(
              "WORKSPACE_NOT_FOUND",
            );
          }
        }),
        { numRuns: 100 },
      );
    });

    it("verifyAccess rejects users without workspace access", async () => {
      await fc.assert(
        fc.asyncProperty(
          workspaceIdArb,
          userIdArb,
          operationArb,
          async (workspaceId, userId, operation) => {
            const mockRepo = new MockWorkspaceRepository();
            const mockLogger = new MockAuditLogger();
            const guard = new TenantGuard(
              mockRepo as unknown as MockRepo,
              mockLogger as unknown as MockLogger,
              {} as MockDb,
            );

            // Add workspace but don't grant access
            mockRepo.addWorkspace(workspaceId);

            const params: TenantVerificationParams = {
              workspaceId,
              userId,
              operation,
            };

            // Should throw ACCESS_DENIED
            await expect(guard.verifyAccess(params)).rejects.toThrow(
              TenantIsolationError,
            );

            try {
              await guard.verifyAccess(params);
            } catch (error) {
              expect(error).toBeInstanceOf(TenantIsolationError);
              expect((error as TenantIsolationError).code).toBe(
                "ACCESS_DENIED",
              );
            }
          },
        ),
        { numRuns: 100 },
      );
    });

    it("verifyAccess allows users with workspace access", async () => {
      await fc.assert(
        fc.asyncProperty(
          workspaceIdArb,
          userIdArb,
          operationArb,
          async (workspaceId, userId, operation) => {
            const mockRepo = new MockWorkspaceRepository();
            const mockLogger = new MockAuditLogger();
            const guard = new TenantGuard(
              mockRepo as unknown as MockRepo,
              mockLogger as unknown as MockLogger,
              {} as MockDb,
            );

            // Add workspace and grant access
            mockRepo.addWorkspace(workspaceId);
            mockRepo.grantAccess(workspaceId, userId, "member");

            const params: TenantVerificationParams = {
              workspaceId,
              userId,
              operation,
            };

            // Should succeed
            const result = await guard.verifyAccess(params);

            expect(result.verified).toBe(true);
            expect(result.workspaceId).toBe(workspaceId);
            expect(result.userId).toBe(userId);
            expect(result.role).toBe("member");
          },
        ),
        { numRuns: 100 },
      );
    });

    it("verifyAccess allows public operations without userId for existing workspaces", async () => {
      await fc.assert(
        fc.asyncProperty(
          workspaceIdArb,
          operationArb,
          async (workspaceId, operation) => {
            const mockRepo = new MockWorkspaceRepository();
            const mockLogger = new MockAuditLogger();
            const guard = new TenantGuard(
              mockRepo as unknown as MockRepo,
              mockLogger as unknown as MockLogger,
              {} as MockDb,
            );

            // Add workspace
            mockRepo.addWorkspace(workspaceId);

            const params: TenantVerificationParams = {
              workspaceId,
              operation,
              // No userId - public operation
            };

            // Should succeed for public operations
            const result = await guard.verifyAccess(params);

            expect(result.verified).toBe(true);
            expect(result.workspaceId).toBe(workspaceId);
            expect(result.userId).toBeUndefined();
          },
        ),
        { numRuns: 100 },
      );
    });

    it("createTenantFilter always returns the exact workspaceId provided", () => {
      fc.assert(
        fc.property(workspaceIdArb, (workspaceId) => {
          const mockRepo = new MockWorkspaceRepository();
          const mockLogger = new MockAuditLogger();
          const guard = new TenantGuard(
            mockRepo as unknown as MockRepo,
            mockLogger as unknown as MockLogger,
            {} as MockDb,
          );

          const filter = guard.createTenantFilter(workspaceId);

          expect(filter.workspaceId).toBe(workspaceId);
        }),
        { numRuns: 100 },
      );
    });

    it("audit logs are created for all access attempts", async () => {
      await fc.assert(
        fc.asyncProperty(
          workspaceIdArb,
          userIdArb,
          operationArb,
          async (workspaceId, userId, operation) => {
            const mockRepo = new MockWorkspaceRepository();
            const mockLogger = new MockAuditLogger();
            const guard = new TenantGuard(
              mockRepo as unknown as MockRepo,
              mockLogger as unknown as MockLogger,
              {} as MockDb,
            );

            // Add workspace and grant access
            mockRepo.addWorkspace(workspaceId);
            mockRepo.grantAccess(workspaceId, userId);

            const params: TenantVerificationParams = {
              workspaceId,
              userId,
              operation,
            };

            await guard.verifyAccess(params);

            // Should have logged the access
            expect(mockLogger.logs.length).toBeGreaterThan(0);

            const lastLog = mockLogger.logs[mockLogger.logs.length - 1];
            expect(lastLog?.userId).toBe(userId);
            expect(lastLog?.metadata?.workspaceId).toBe(workspaceId);
            expect(lastLog?.metadata?.operation).toBe(operation);
            expect(lastLog?.metadata?.success).toBe(true);
          },
        ),
        { numRuns: 100 },
      );
    });

    it("audit logs are created for failed access attempts", async () => {
      await fc.assert(
        fc.asyncProperty(
          workspaceIdArb,
          userIdArb,
          operationArb,
          async (workspaceId, userId, operation) => {
            const mockRepo = new MockWorkspaceRepository();
            const mockLogger = new MockAuditLogger();
            const guard = new TenantGuard(
              mockRepo as unknown as MockRepo,
              mockLogger as unknown as MockLogger,
              {} as MockDb,
            );

            // Add workspace but don't grant access
            mockRepo.addWorkspace(workspaceId);

            const params: TenantVerificationParams = {
              workspaceId,
              userId,
              operation,
            };

            try {
              await guard.verifyAccess(params);
            } catch {
              // Expected to fail
            }

            // Should have logged the failed access
            expect(mockLogger.logs.length).toBeGreaterThan(0);

            const lastLog = mockLogger.logs[mockLogger.logs.length - 1];
            expect(lastLog?.userId).toBe(userId);
            expect(lastLog?.metadata?.workspaceId).toBe(workspaceId);
            expect(lastLog?.metadata?.operation).toBe(operation);
            expect(lastLog?.metadata?.success).toBe(false);
            expect(lastLog?.metadata?.reason).toBe("access_denied");
          },
        ),
        { numRuns: 100 },
      );
    });

    it("invalid workspaceId is rejected with proper error", async () => {
      const invalidWorkspaceIds = ["", null, undefined];

      for (const invalidId of invalidWorkspaceIds) {
        const mockRepo = new MockWorkspaceRepository();
        const mockLogger = new MockAuditLogger();
        const guard = new TenantGuard(
          mockRepo as unknown as MockRepo,
          mockLogger as unknown as MockLogger,
          {} as MockDb,
        );

        const params = {
          workspaceId: invalidId as string,
          operation: "session_read" as TenantOperation,
        };

        await expect(guard.verifyAccess(params)).rejects.toThrow(
          TenantIsolationError,
        );

        try {
          await guard.verifyAccess(params);
        } catch (error) {
          expect(error).toBeInstanceOf(TenantIsolationError);
          expect((error as TenantIsolationError).code).toBe(
            "INVALID_WORKSPACE_ID",
          );
        }
      }
    });

    it("cross-tenant access is always denied regardless of operation type", async () => {
      await fc.assert(
        fc.asyncProperty(
          workspaceIdArb,
          workspaceIdArb,
          userIdArb,
          operationArb,
          async (workspace1, workspace2, userId, operation) => {
            // Skip if workspaces happen to match
            if (workspace1 === workspace2) {
              return true;
            }

            const mockRepo = new MockWorkspaceRepository();
            const mockLogger = new MockAuditLogger();
            const guard = new TenantGuard(
              mockRepo as unknown as MockRepo,
              mockLogger as unknown as MockLogger,
              {} as MockDb,
            );

            // Add both workspaces
            mockRepo.addWorkspace(workspace1);
            mockRepo.addWorkspace(workspace2);

            // Grant access only to workspace1
            mockRepo.grantAccess(workspace1, userId);

            // Try to access workspace2 - should fail
            const params: TenantVerificationParams = {
              workspaceId: workspace2,
              userId,
              operation,
            };

            await expect(guard.verifyAccess(params)).rejects.toThrow(
              TenantIsolationError,
            );

            try {
              await guard.verifyAccess(params);
            } catch (error) {
              expect(error).toBeInstanceOf(TenantIsolationError);
              expect((error as TenantIsolationError).code).toBe(
                "ACCESS_DENIED",
              );
            }
          },
        ),
        { numRuns: 100 },
      );
    });
  });
});
