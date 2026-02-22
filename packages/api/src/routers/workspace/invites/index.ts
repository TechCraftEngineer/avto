
import { accept } from "./accept";
import { cancel } from "./cancel";
import { createLink } from "./create-link";
import { getByToken } from "./get-by-token";
import { getLink } from "./get-link";
import { list } from "./list";
import { pending } from "./pending";
import { resend } from "./resend";

export const invitesRouter = {
  list,
  createLink,
  getLink,
  getByToken,
  pending,
  accept,
  resend,
  cancel,
};
