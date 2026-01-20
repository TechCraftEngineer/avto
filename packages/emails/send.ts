import { render } from "@react-email/render";
import nodemailer from "nodemailer";
import type Mail from "nodemailer/lib/mailer";
import type { ReactNode } from "react";
import { Resend } from "resend";

import { env } from "./env";

export const resend: Resend | null = env.RESEND_API_KEY
  ? new Resend(env.RESEND_API_KEY)
  : null;

export interface Emails {
  react: ReactNode;
  subject: string;
  to: string[];
  from?: string;
}

export type EmailHtml = {
  html: string;
  subject: string;
  to: string[];
  from?: string;
};
export const sendEmail = async (email: Emails): Promise<void> => {
  if (env.EMAIL_SANDBOX_ENABLED) {
    const htmlContent = await render(email.react);
    if (!htmlContent) {
      console.error("Ошибка рендеринга email шаблона: render вернул undefined");
      throw new Error("Не удалось отрендерить email шаблон");
    }
    const mailOptions: Mail.Options = {
      from: email.from ?? env.EMAIL_FROM,
      to: email.to,
      html: htmlContent,
      subject: email.subject,
    };
    const transporter = nodemailer.createTransport({
      host: env.EMAIL_SANDBOX_HOST,
      secure: false,
      port: 2500,
    });
    await transporter.sendMail(mailOptions);
    return;
  }
  if (!resend) {
    console.log(
      "Resend is not configured. You need to add a RESEND_API_KEY in your .env file for emails to work.",
    );
    return Promise.resolve();
  }
  await resend.emails.send({
    to: email.to,
    from: email.from ?? env.EMAIL_FROM,
    subject: email.subject,
    react: email.react,
  });
};

export const sendEmailHtml = async (email: EmailHtml): Promise<void> => {
  if (!resend) {
    console.log(
      "Resend is not configured. You need to add a RESEND_API_KEY in your .env file for emails to work.",
    );
    return Promise.resolve();
  }
  await resend.emails.send({
    to: email.to,
    from: email.from ?? env.EMAIL_FROM,
    subject: email.subject,
    html: email.html,
  });
};
