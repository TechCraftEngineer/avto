// Добавить в интерфейс SaveBasicResponseOptions:

export interface SaveBasicResponseOptions {
  /** URL профиля/резюме на платформе (HH resume URL, Kwork profile) */
  profileUrl?: string | null;
  /** Сопроводительное письмо кандидата */
  coverLetter?: string | null;
  /** URL фото кандидата из таблицы откликов */
  photoUrl?: string | null;
}

// В функции saveBasicResponse после сохранения отклика добавить обработку фото:

export async function saveBasicResponse(
  entityId: string,
  resumeId: string,
  profileUrl: string,
  candidateName: string,
  respondedAt?: Date,
  options?: SaveBasicResponseOptions,
): Promise<Result<{ id: string; isNew: boolean }>> {
  return tryCatch(async () => {
    // ... существующий код проверки и вставки ...

    const url = options?.profileUrl ?? profileUrl;

    const [inserted] = await db
      .insert(response)
      .values({
        entityType: "vacancy",
        entityId,
        candidateId: resumeId,
        resumeId,
        profileUrl: url || null,
        coverLetter: options?.coverLetter || null,
        candidateName,
        status: RESPONSE_STATUS.NEW,
        importSource: "HH",
        contacts: null,
        phone: null,
        respondedAt,
      })
      .onConflictDoNothing({
        target: [response.entityType, response.entityId, response.candidateId],
      })
      .returning({ id: response.id });

    if (inserted) {
      await logResponseEvent({
        db,
        responseId: inserted.id,
        eventType: "CREATED",
        newValue: { candidateName, entityId },
      });

      // Обработка фото, если передан photoUrl
      if (options?.photoUrl) {
        try {
          logger.info(`Downloading photo from ${options.photoUrl} for ${candidateName}`);
          
          // Скачиваем фото по URL
          const photoResult = await uploadAvatarFromUrl(options.photoUrl, resumeId);
          
          if (photoResult.success && photoResult.data) {
            // Обновляем запись отклика с photoFileId
            await db
              .update(response)
              .set({ photoFileId: photoResult.data })
              .where(eq(response.id, inserted.id));

            await logResponseEvent({
              db,
              responseId: inserted.id,
              eventType: "PHOTO_ADDED",
            });

            logger.info(`Photo saved for ${candidateName}, fileId: ${photoResult.data}`);
          }
        } catch (error) {
          // Не прерываем процесс, если фото не удалось загрузить
          logger.warn(`Failed to download photo for ${candidateName}: ${error}`);
        }
      }

      logger.info(`Basic info saved: ${candidateName}`);
      return { id: inserted.id, isNew: true };
    }

    // ... остальной код ...
  }, `Failed to save basic response for ${candidateName}`);
}
