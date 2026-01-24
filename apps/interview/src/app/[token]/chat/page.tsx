import { redirect } from "next/navigation";
import { api } from "~/trpc/server";
import { WebChatClient } from "~/components/web-chat-client";

export default async function WebChatPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  try {
    const caller = await api();
    const chatData = await caller.webChat.getByToken({ token });

    return <WebChatClient chatData={chatData} />;
  } catch (error) {
    redirect("/");
  }
}
