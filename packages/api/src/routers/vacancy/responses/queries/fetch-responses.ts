import type { DbClient, SQL } from "@qbs-autonaim/db";
import { eq } from "@qbs-autonaim/db";
import {
  responseScreening,
  response as responseTable,
} from "@qbs-autonaim/db/schema";

export const responseColumns = {
  id: true,
  entityId: true,
  candidateName: true,
  photoFileId: true,
  birthDate: true,
  globalCandidateId: true,
  status: true,
  hrSelectionStatus: true,
  contacts: true,
  profileUrl: true,
  profileData: true,
  resumeUrl: true,
  telegramUsername: true,
  phone: true,
  email: true,
  coverLetter: true,
  respondedAt: true,
  welcomeSentAt: true,
  createdAt: true,
  salaryExpectationsAmount: true,
  salaryExpectationsComment: true,
  skills: true,
  rating: true,
} as const;

export async function fetchResponsesWithScoreJoin(
  db: DbClient,
  whereCondition: SQL | undefined,
  orderByClause: SQL,
  limit: number,
  offset: number,
) {
  return await db
    .select({
      id: responseTable.id,
      entityId: responseTable.entityId,
      candidateName: responseTable.candidateName,
      photoFileId: responseTable.photoFileId,
      birthDate: responseTable.birthDate,
      globalCandidateId: responseTable.globalCandidateId,
      status: responseTable.status,
      hrSelectionStatus: responseTable.hrSelectionStatus,
      contacts: responseTable.contacts,
      profileUrl: responseTable.profileUrl,
      profileData: responseTable.profileData,
      resumeUrl: responseTable.resumeUrl,
      telegramUsername: responseTable.telegramUsername,
      phone: responseTable.phone,
      email: responseTable.email,
      coverLetter: responseTable.coverLetter,
      respondedAt: responseTable.respondedAt,
      welcomeSentAt: responseTable.welcomeSentAt,
      createdAt: responseTable.createdAt,
      salaryExpectationsAmount: responseTable.salaryExpectationsAmount,
      salaryExpectationsComment: responseTable.salaryExpectationsComment,
      skills: responseTable.skills,
      rating: responseTable.rating,
    })
    .from(responseTable)
    .leftJoin(
      responseScreening,
      eq(responseTable.id, responseScreening.responseId),
    )
    .where(whereCondition)
    .orderBy(orderByClause)
    .limit(limit)
    .offset(offset);
}

export async function fetchResponsesWithoutJoin(
  db: DbClient,
  whereCondition: SQL | undefined,
  orderByClause: SQL,
  limit: number,
  offset: number,
) {
  return await db.query.response.findMany({
    where: whereCondition,
    orderBy: [orderByClause],
    limit,
    offset,
    columns: responseColumns,
  });
}
