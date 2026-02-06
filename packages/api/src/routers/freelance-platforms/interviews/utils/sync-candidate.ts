import { eq } from "@qbs-autonaim/db";
import { response as responseTable } from "@qbs-autonaim/db/schema";
import { ContactCandidateSyncService } from "../../../../services/contact-candidate-sync.service";
import type { Database } from "../../../../types/database";

interface FreelancerInfo {
  name: string;
  email?: string;
  platformProfileUrl?: string;
  phone?: string;
  telegram?: string;
}

export async function syncCandidateToGlobalPool(
  db: Database,
  responseId: string,
  organizationId: string,
  freelancerInfo: FreelancerInfo,
) {
  try {
    const candidateSync = new ContactCandidateSyncService(db);
    const contactData =
      ContactCandidateSyncService.extractContactsFromFreelancerInfo(
        freelancerInfo,
      );
    const syncResult = await candidateSync.syncCandidateFromContacts({
      ...contactData,
      organizationId,
      source: "APPLICANT",
      originalSource: "WEB_LINK",
    });

    if (syncResult.hasContacts) {
      await db
        .update(responseTable)
        .set({ globalCandidateId: syncResult.candidateId })
        .where(eq(responseTable.id, responseId));
    }
  } catch (error) {
    console.error("Ошибка при создании кандидата в глобальном пуле:", error);
    // Не прерываем основной поток - отклик уже создан
  }
}
