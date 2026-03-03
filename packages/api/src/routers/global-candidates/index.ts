import { attachToVacancy } from "./attach-to-vacancy";
import { create } from "./create";
import { get } from "./get";
import { list } from "./list";
import { parseResume } from "./parse-resume";
import { updateStatus } from "./update-status";
import { updateTags } from "./update-tags";

export const globalCandidatesRouter = {
  list,
  get,
  attachToVacancy,
  create,
  parseResume,
  updateStatus,
  updateTags,
};
