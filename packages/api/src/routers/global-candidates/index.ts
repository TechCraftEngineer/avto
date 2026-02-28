import { attachToVacancy } from "./attach-to-vacancy";
import { get } from "./get";
import { list } from "./list";
import { updateStatus } from "./update-status";
import { updateTags } from "./update-tags";

export const globalCandidatesRouter = {
  list,
  get,
  attachToVacancy,
  updateStatus,
  updateTags,
};
