import {
  formatDate,
  getStatusLabel,
  HR_STATUS_CONFIG,
  type HRStatusKey,
  RESPONSE_STATUS_CONFIG,
  type StatusKey,
} from "~/lib/shared/response-configs";

export { getStatusLabel };

export const getStatusVariant = (status: string) => {
  return RESPONSE_STATUS_CONFIG[status as StatusKey]?.variant ?? "default";
};

export const getHrStatusLabel = (status: string | null) => {
  return status
    ? (HR_STATUS_CONFIG[status as HRStatusKey]?.label ?? status)
    : null;
};

export { formatDate };
