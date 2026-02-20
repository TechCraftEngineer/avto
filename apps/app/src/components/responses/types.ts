import type { RouterOutputs } from "@qbs-autonaim/api";

export type ResponseItem =
  RouterOutputs["vacancy"]["responses"]["listWorkspace"]["responses"][0];

export type ResponseStatus =
  | "NEW"
  | "EVALUATED"
  | "INTERVIEW"
  | "COMPLETED"
  | "SKIPPED";
