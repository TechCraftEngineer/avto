// Реэкспортируем из lib для обратной совместимости
export {
  getInterviewStartData,
  identifyByPinCode,
  identifyByVacancy,
  saveMessage,
} from "@qbs-autonaim/lib/server";
export {
  addQuestionAnswer,
  getConversationMetadata,
  getQuestionCount,
  isInterviewCompleted,
  isInterviewStarted,
  markInterviewCompleted,
  updateConversationMetadata,
} from "./conversation-metadata";
export {
  analyzeAndGenerateNextQuestion,
  createInterviewScoring,
  getInterviewContext,
  type InterviewScoringResult,
  saveQuestionAnswer,
} from "./interview-service";
export {
  createPinCodeValidator,
  validatePinCodeSimple,
} from "./validate-pin-wrapper";
