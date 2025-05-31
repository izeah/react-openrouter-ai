import Dexie, { type Table } from "dexie";

// Re-define interfaces here for clarity if this were a separate file,
// or ensure they are correctly imported/available from where they are defined (e.g., App.tsx or ChatMessage.tsx)
export interface Message {
  id: string;
  chatId: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
}

export interface Chat {
  id: string;
  title: string;
  createdAt: number;
}

export class MyDexie extends Dexie {
  chats!: Table<Chat, string>;
  messages!: Table<Message, string>;

  constructor() {
    super("ChatAppDB-OpenRouter");
    this.version(3).stores({
      chats: "id, title, createdAt",
      messages: "id, chatId, timestamp",
    });
  }

  async createNewChat(title: string = "Chat Baru"): Promise<string> {
    const newChatId = crypto.randomUUID();
    const newChat: Chat = {
      id: newChatId,
      title: title,
      createdAt: Date.now(),
    };
    await this.chats.add(newChat);
    return newChatId;
  }

  async addMessage(message: Message): Promise<string> {
    await this.messages.add(message);
    return message.id;
  }

  async deleteChat(chatId: string): Promise<void> {
    await this.transaction("rw", this.chats, this.messages, async () => {
      await this.messages.where("chatId").equals(chatId).delete();
      await this.chats.delete(chatId);
    });
  }
}

export const db = new MyDexie();
