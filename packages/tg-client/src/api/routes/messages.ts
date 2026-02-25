import { Long } from "@mtcute/core";
import { Hono } from "hono";
import { botManager } from "../../bot-manager";
import { withFloodWaitRetry } from "../../utils/flood-wait";
import {
  sendMessageByPhoneSchema,
  sendMessageByUsernameSchema,
  sendMessageSchema,
  sendPersonalMessageByUsernameSchema,
} from "../schemas";
import { cleanUsername, handleError } from "../utils";

type LongType = InstanceType<typeof Long>;
type InputPeer =
  | { _: "inputPeerChannel"; channelId: number; accessHash: LongType }
  | { _: "inputPeerChat"; chatId: number }
  | { _: "inputPeerUser"; userId: number; accessHash: LongType };

const messages = new Hono();

messages.post("/send", async (c) => {
  try {
    const body = await c.req.json();
    const result = sendMessageSchema.safeParse(body);

    if (!result.success) {
      return c.json(
        { error: "Invalid request data", details: result.error.issues },
        400,
      );
    }

    const { workspaceId, chatId, text } = result.data;

    const client = botManager.getClient(workspaceId);
    if (!client) {
      return c.json(
        { error: `Bot not running for workspace ${workspaceId}` },
        404,
      );
    }

    // chatId is a numeric ID - we need to construct InputPeer directly
    // because resolvePeer only works with usernames
    let peer: InputPeer | undefined;

    // Try to get chat/user info from Telegram
    try {
      const chats = await client.call({
        _: "messages.getChats",
        id: [chatId],
      });

      if (chats.chats && chats.chats.length > 0) {
        const chat = chats.chats[0];
        if (chat && chat._ === "chat") {
          peer = {
            _: "inputPeerChat",
            chatId: chat.id,
          };
        } else if (chat && chat._ === "channel" && "accessHash" in chat) {
          peer = {
            _: "inputPeerChannel",
            channelId: chat.id,
            accessHash: chat.accessHash || Long.ZERO,
          };
        }
      }
    } catch {
      // If getChats fails, try as user
      try {
        const users = await client.call({
          _: "users.getUsers",
          id: [
            {
              _: "inputUser",
              userId: chatId,
              accessHash: Long.ZERO,
            },
          ],
        });
        if (users && users.length > 0) {
          const user = users[0];
          if (
            user &&
            user._ === "user" &&
            "accessHash" in user &&
            user.accessHash
          ) {
            peer = {
              _: "inputPeerUser",
              userId: user.id,
              accessHash: user.accessHash,
            };
          }
        }
      } catch {
        // Ignore user lookup errors
      }
    }

    if (!peer) {
      return c.json({ error: `Chat ${chatId} not found` }, 404);
    }

    const messageResult = await withFloodWaitRetry(() =>
      client.sendText(peer, text),
    );

    return c.json({
      success: true,
      messageId: messageResult.id.toString(),
      chatId: messageResult.chat.id.toString(),
      senderId: messageResult.sender.id.toString(),
    });
  } catch (error) {
    return c.json({ error: handleError(error, "Failed to send message") }, 500);
  }
});

messages.post("/send-personal-by-username", async (c) => {
  try {
    const body = await c.req.json();
    const result = sendPersonalMessageByUsernameSchema.safeParse(body);
    if (!result.success) {
      return c.json(
        { error: "Invalid request data", details: result.error.issues },
        400,
      );
    }

    const { userId, username, text } = result.data;
    const client = botManager.getClientForUser(userId);
    if (!client) {
      return c.json(
        { error: `Personal bot not running for user ${userId}` },
        404,
      );
    }
    const cleanedUsername = cleanUsername(username);
    const messageResult = await withFloodWaitRetry(() =>
      client.sendText(cleanedUsername, text),
    );

    return c.json({
      success: true,
      messageId: messageResult.id.toString(),
      chatId: messageResult.chat.id.toString(),
      senderId: messageResult.sender.id.toString(),
    });
  } catch (error) {
    return c.json({ error: handleError(error, "Failed to send message") }, 500);
  }
});

messages.post("/send-by-username", async (c) => {
  try {
    const body = await c.req.json();
    console.log("📥 /send-by-username received body:", JSON.stringify(body));

    const result = sendMessageByUsernameSchema.safeParse(body);
    if (!result.success) {
      console.error("❌ Validation failed:", result.error.issues);
      return c.json(
        { error: "Invalid request data", details: result.error.issues },
        400,
      );
    }

    const { workspaceId, username, text } = result.data;

    const client = botManager.getClient(workspaceId);
    if (!client) {
      console.error(`❌ Bot not running for workspace ${workspaceId}`);
      return c.json(
        { error: `Bot not running for workspace ${workspaceId}` },
        404,
      );
    }
    const cleanedUsername = cleanUsername(username);
    const messageResult = await withFloodWaitRetry(() =>
      client.sendText(cleanedUsername, text),
    );

    return c.json({
      success: true,
      messageId: messageResult.id.toString(),
      chatId: messageResult.chat.id.toString(),
      senderId: messageResult.sender.id.toString(),
    });
  } catch (error) {
    return c.json({ error: handleError(error, "Failed to send message") }, 500);
  }
});

messages.post("/send-by-phone", async (c) => {
  let userIdToDelete: number | undefined;

  try {
    const body = await c.req.json();
    const result = sendMessageByPhoneSchema.safeParse(body);

    if (!result.success) {
      return c.json(
        { error: "Invalid request data", details: result.error.issues },
        400,
      );
    }

    const { workspaceId, phone, text, firstName } = result.data;

    const client = botManager.getClient(workspaceId);
    if (!client) {
      return c.json(
        { error: `Bot not running for workspace ${workspaceId}` },
        404,
      );
    }

    if (!phone.startsWith("+")) {
      return c.json({ error: "Phone must be in international format" }, 400);
    }

    // Сначала пытаемся найти существующий контакт
    let inputPeer: InputPeer | undefined;
    try {
      const contacts = await client.call({
        _: "contacts.getContacts",
        hash: Long.ZERO,
      });
      if (contacts._ === "contacts.contacts") {
        const existingUser = contacts.users.find(
          (u) => u._ === "user" && u.phone === phone.replace(/\D/g, ""),
        );
        if (existingUser && existingUser._ === "user") {
          inputPeer = {
            _: "inputPeerUser" as const,
            userId: existingUser.id,
            accessHash: existingUser.accessHash || Long.ZERO,
          };
        }
      }
    } catch (err) {
      console.warn("Failed to check existing contacts:", err);
    }

    // Если контакт не найден, импортируем (с задержкой для снижения риска PEER_FLOOD)
    if (!inputPeer) {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const importResult = await client.call({
        _: "contacts.importContacts",
        contacts: [
          {
            _: "inputPhoneContact",
            clientId: Long.fromNumber(Date.now()),
            phone: phone,
            firstName: firstName || "Кандидат",
            lastName: "",
          },
        ],
      });

      if (!importResult.users || importResult.users.length === 0) {
        return c.json({ error: "User not found in Telegram" }, 404);
      }

      const user = importResult.users[0];
      if (!user || user._ !== "user") {
        return c.json({ error: "Failed to get user data" }, 500);
      }

      userIdToDelete = user.id;

      inputPeer = {
        _: "inputPeerUser" as const,
        userId: user.id,
        accessHash: user.accessHash || Long.ZERO,
      };
    }

    // Задержка перед отправкой сообщения
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const messageResult = await withFloodWaitRetry(() =>
      client.sendText(inputPeer, text),
    );

    return c.json({
      success: true,
      messageId: messageResult.id.toString(),
      chatId: messageResult.chat.id.toString(),
      senderId: messageResult.sender.id.toString(),
    });
  } catch (error) {
    return c.json({ error: handleError(error, "Failed to send message") }, 500);
  } finally {
    // Удаляем импортированный контакт после операции
    if (userIdToDelete) {
      try {
        const client = botManager.getClient((await c.req.json()).workspaceId);
        if (client) {
          await client.call({
            _: "contacts.deleteContacts",
            id: [
              {
                _: "inputUser",
                userId: userIdToDelete,
                accessHash: Long.ZERO,
              },
            ],
          });
          console.log(`🗑️ Контакт ${userIdToDelete} удален`);
        }
      } catch (deleteError) {
        console.warn("⚠️ Не удалось удалить контакт:", deleteError);
      }
    }
  }
});

export default messages;
