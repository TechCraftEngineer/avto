import { eq } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import {
  session as sessionTable,
  user as userTable,
} from "@qbs-autonaim/db/schema";
import { NextResponse } from "next/server";
import { auth } from "~/auth/server";

/**
 * Возвращает session token и данные пользователя для расширения.
 * Вызывается со страницы приложения (cookies отправляются автоматически).
 * Используется для авторизации расширения «одной кнопкой».
 * Важно: передаём request.headers явно для корректной работы в Route Handler.
 */
export async function GET(request: Request) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });
  if (!session?.session?.id || !session?.user) {
    return NextResponse.json(
      { error: "Необходима авторизация" },
      { status: 401 },
    );
  }

  const sess = await db.query.session.findFirst({
    where: eq(sessionTable.id, session.session.id),
    columns: { token: true, expiresAt: true },
  });

  if (!sess || new Date(sess.expiresAt) < new Date()) {
    return NextResponse.json({ error: "Сессия истекла" }, { status: 401 });
  }

  const user = await db.query.user.findFirst({
    where: eq(userTable.id, session.user.id),
    columns: { id: true, email: true, lastActiveOrganizationId: true },
  });

  if (!user) {
    return NextResponse.json(
      { error: "Пользователь не найден" },
      { status: 404 },
    );
  }

  return NextResponse.json({
    token: sess.token,
    user: {
      id: user.id,
      email: user.email,
      organizationId: user.lastActiveOrganizationId ?? undefined,
    },
  });
}
