
import { getKworkProject } from "./get-kwork-project";
import { processChat } from "./process-chat";

export const gigKworkRouter = {
  getProject: getKworkProject,
  processChat,
};
