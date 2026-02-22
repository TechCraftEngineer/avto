import type { RouterRecord } from "@orpc/server";

import { create } from "./create";
import { deleteItem } from "./delete";
import { get } from "./get";
import { list } from "./list";
import { update } from "./update";

export const interviewScenariosRouter = {
  list,
  get,
  create,
  update,
  delete: deleteItem,
} satisfies RouterRecord;
