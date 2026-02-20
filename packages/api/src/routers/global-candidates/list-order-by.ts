import { asc, desc, type SQL } from "@qbs-autonaim/db";
import {
  candidateOrganization,
  globalCandidate,
} from "@qbs-autonaim/db/schema";
import { lastActivityExpr } from "./list-filter-conditions";
import type { ListInput } from "./list-schema";

export function buildOrderBy(input: ListInput): SQL[] {
  const orderDir = input.sortOrder === "asc" ? asc : desc;
  const byId = desc(candidateOrganization.id);

  switch (input.sortBy) {
    case "createdAt":
      return [orderDir(candidateOrganization.createdAt), byId];
    case "updatedAt":
      return [orderDir(candidateOrganization.updatedAt), byId];
    case "fullName":
      return [orderDir(globalCandidate.fullName), byId];
    default:
      return [orderDir(lastActivityExpr()), byId];
  }
}
