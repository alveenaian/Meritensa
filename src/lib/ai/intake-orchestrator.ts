import { Case, Message } from "@prisma/client";

type CaseWithMessages = Case & {
  messages: Message[];
};

export function determineIntakeStep(caseRecord: CaseWithMessages): string {
  const messageCount = caseRecord.messages.length;

  // Initial greeting
  if (messageCount === 0) {
    return "initial";
  }

  // Get the last few messages to understand context
  const recentMessages = caseRecord.messages.slice(-10);
  const lastAssistantMessage = recentMessages
    .filter((m) => m.role === "ASSISTANT")
    .pop();

  // If we have a summary, we're done with intake
  if (caseRecord.summary) {
    return "complete";
  }

  // Check if specific information is missing
  if (!caseRecord.incidentDate && messageCount > 2) {
    return "timeline";
  }

  if (!caseRecord.defendantName && messageCount > 4) {
    return "defendant";
  }

  if (!caseRecord.state && messageCount > 6) {
    return "jurisdiction";
  }

  if (!caseRecord.estimatedDamages && messageCount > 8) {
    return "damages";
  }

  // If we have basic info and enough conversation, generate summary
  if (
    messageCount > 10 &&
    caseRecord.incidentDate &&
    caseRecord.defendantName
  ) {
    return "summary";
  }

  // Default to follow-up questions
  if (messageCount <= 2) {
    return "followup_story";
  }

  return "evidence";
}
