import React, { useState, useEffect, useRef, useCallback } from "react";
import { Send, Loader2, AlertTriangle, Square } from "lucide-react";
import { ChatMessage } from "./ChatMessage";
import { db, type Message } from "../db/dexie";
import { useLiveQuery } from "dexie-react-hooks";

interface ChatViewProps {
  chatId: string;
  chatToAutoProcess: string | null;
  setChatToAutoProcess: (id: string | null) => void;
  apiKey: string;
  isSidebarOpen: boolean;
}

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

export const ChatView: React.FC<ChatViewProps> = ({
  chatId,
  chatToAutoProcess,
  setChatToAutoProcess,
  apiKey,
  isSidebarOpen,
}) => {
  const [userInput, setUserInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const messages = useLiveQuery(
    () => db.messages.where("chatId").equals(chatId).sortBy("timestamp"),
    [chatId],
    [] as Message[]
  );

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  useEffect(() => {
    setUserInput("");
    setIsSending(false);
    setIsThinking(false);
    setError(null);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    const textarea = document.getElementById(
      "userInputArea"
    ) as HTMLTextAreaElement;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `44px`; // Reset to base height
    }
  }, [chatId]);

  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setUserInput(event.target.value);
    event.target.style.height = "auto";
    event.target.style.height = `${Math.min(event.target.scrollHeight, 160)}px`; // Max height 160px (max-h-40)
  };

  // Fungsi inti untuk mengirim request ke API dan menangani stream
  const _initiateApiStream = useCallback(
    async (historyForApi: Array<{ role: string; content: string }>) => {
      if (!apiKey || isSending) {
        // Cek isSending di awal
        if (!apiKey) setError("API Key belum diatur.");
        return;
      }

      setIsSending(true);
      setIsThinking(true);
      setError(null);

      const assistantMessageId = crypto.randomUUID();
      let assistantMessageContent = "";

      const placeholderAssistantMessage: Message = {
        id: assistantMessageId,
        chatId,
        role: "assistant",
        content: "",
        timestamp: Date.now() + 1,
      };
      await db.addMessage(placeholderAssistantMessage);

      try {
        abortControllerRef.current = new AbortController();

        const response = await fetch(OPENROUTER_API_URL, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "deepseek/deepseek-r1-0528-qwen3-8b:free",
            messages: historyForApi,
            stream: true,
          }),
          signal: abortControllerRef.current.signal,
        });

        setIsThinking(false);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({
            detail: "Gagal memproses respons error dari server.",
          }));
          throw new Error(
            errorData.error?.message ||
              errorData.detail ||
              `Error HTTP: ${response.status} ${response.statusText}`
          );
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error("Gagal membaca respons stream dari server.");
        }

        const decoder = new TextDecoder();
        let buffer = "";
        let streamLoopShouldBreak = false;

        // eslint-disable-next-line no-constant-condition
        while (true) {
          if (streamLoopShouldBreak || !abortControllerRef.current) break;

          const { done, value } = await reader.read();
          if (done) {
            streamLoopShouldBreak = true;
            break;
          }

          buffer += decoder.decode(value, { stream: true });

          let EOL;
          while ((EOL = buffer.indexOf("\n")) >= 0) {
            if (streamLoopShouldBreak || !abortControllerRef.current) break;

            const line = buffer.slice(0, EOL).trim();
            buffer = buffer.slice(EOL + 1);

            if (line.startsWith("data: ")) {
              const jsonData = line.substring(6);
              if (jsonData === "[DONE]") {
                streamLoopShouldBreak = true;
                break;
              }
              try {
                const chunk = JSON.parse(jsonData);
                if (
                  chunk.choices &&
                  chunk.choices[0].delta &&
                  chunk.choices[0].delta.content
                ) {
                  assistantMessageContent += chunk.choices[0].delta.content;
                  if (abortControllerRef.current) {
                    await db.messages.update(assistantMessageId, {
                      content: assistantMessageContent,
                    });
                  }
                }
                if (chunk.choices && chunk.choices[0].finish_reason) {
                  streamLoopShouldBreak = true;
                  break;
                }
              } catch (e) {
                console.warn("Gagal parse JSON dari stream:", jsonData, e);
              }
            }
          }
        }

        if (abortControllerRef.current && assistantMessageContent) {
          await db.messages.update(assistantMessageId, {
            content: assistantMessageContent,
          });
        }
      } catch (err: any) {
        setIsThinking(false);
        if (err.name === "AbortError") {
          console.log("Streaming dihentikan oleh pengguna.");
          const finalContent = assistantMessageContent
            ? assistantMessageContent + "\n\n(Streaming dihentikan)"
            : "(Streaming dihentikan)";
          await db.messages.update(assistantMessageId, {
            content: finalContent,
          });
        } else {
          console.error("Error mengirim pesan:", err);
          const errorMessage =
            err.message || "Terjadi kesalahan saat mengirim pesan.";
          setError(errorMessage);
          await db.messages.update(assistantMessageId, {
            content: `Error: ${errorMessage}`,
          });
        }
      } finally {
        setIsSending(false);
        setIsThinking(false);
        abortControllerRef.current = null;
      }
    },
    [apiKey, chatId, isSending]
  );

  const handleSendMessage = useCallback(async () => {
    const userMessageContent = userInput.trim();
    if (
      userMessageContent === "" ||
      (isSending && abortControllerRef.current) ||
      !apiKey
    ) {
      if (!apiKey) setError("API Key belum diatur.");
      return;
    }

    const userMessage: Message = {
      id: crypto.randomUUID(),
      chatId,
      role: "user",
      content: userMessageContent,
      timestamp: Date.now(),
    };
    await db.addMessage(userMessage);

    // Update judul chat jika ini adalah pesan pertama dari pengguna di chat ini
    const currentMessagesInDb = await db.messages
      .where("chatId")
      .equals(chatId)
      .toArray();
    if (currentMessagesInDb.filter((m) => m.role === "user").length === 1) {
      const title =
        userMessageContent.substring(0, 30) +
        (userMessageContent.length > 30 ? "..." : "");
      await db.chats.update(chatId, { title: title });
    }

    setUserInput("");
    const textarea = document.getElementById(
      "userInputArea"
    ) as HTMLTextAreaElement;
    if (textarea) {
      textarea.style.height = "44px"; // Reset to base height after send
    }

    // Persiapkan history untuk API: semua pesan sebelum ini + pesan baru pengguna
    const historyForApi = currentMessagesInDb.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));
    _initiateApiStream(historyForApi);
  }, [userInput, chatId, apiKey, _initiateApiStream, isSending, messages]); // messages ditambahkan untuk potensi update title

  // useEffect untuk memproses chat baru secara otomatis
  useEffect(() => {
    if (
      chatId === chatToAutoProcess &&
      messages &&
      messages.length === 1 &&
      messages[0].role === "user"
    ) {
      if (!isSending && !isThinking) {
        console.log("Auto-processing first message for chat:", chatId);
        const firstUserMessage = messages[0];
        const historyForApi = [
          { role: "user" as const, content: firstUserMessage.content },
        ];
        _initiateApiStream(historyForApi);
        setChatToAutoProcess(null); // Hapus tanda setelah diproses
      }
    }
  }, [
    chatId,
    chatToAutoProcess,
    messages,
    isSending,
    isThinking,
    setChatToAutoProcess,
    _initiateApiStream,
    apiKey,
  ]); // apiKey ditambahkan karena _initiateApiStream bergantung padanya

  const handleStopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-brand-light overflow-hidden">
      <div className="flex-1 overflow-y-auto pt-4 sm:pt-6 pb-16 md:pb-16 space-y-4 px-12 sm:px-[25%] print:overflow-visible">
        {messages?.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}
        {isThinking &&
          (!messages ||
            messages.length === 0 ||
            (messages.length > 0 &&
              messages[messages.length - 1].role === "user")) && (
            <div className="flex items-start space-x-3 animate-pulse">
              <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-brand-accent flex items-center justify-center">
                <img
                  src="https://placehold.co/40x40/A08C6D/FFFFFF?text=AI"
                  alt="AI Avatar"
                  className="rounded-full"
                />
              </div>
              <div className="bg-brand-medium p-3 rounded-lg shadow max-w-xs sm:max-w-md lg:max-w-lg">
                <p className="text-sm sm:text-base text-brand-darker">
                  Sedang berpikir...
                </p>
              </div>
            </div>
          )}
        <div ref={messagesEndRef} />
      </div>

      {error && (
        <div className="p-3 bg-red-100 text-red-700 border-t border-red-200 flex items-center justify-between">
          <div className="flex items-center">
            <AlertTriangle size={20} className="mr-2 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-red-700 hover:text-red-900 p-1"
            aria-label="Tutup error"
          >
            &times;
          </button>
        </div>
      )}

      {isSending && abortControllerRef.current && (
        <div className="fixed right-0 left-0 bottom-24 flex items-center justify-center">
          <button
            onClick={handleStopStreaming}
            className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-md flex items-center transition duration-150"
          >
            <Square size={16} className="mr-2" /> Hentikan Generasi
          </button>
        </div>
      )}

      <div
        className={`fixed bottom-8 right-0 max-sm:px-4 sm:right-4 print:hidden z-10 
                  transition-all duration-300 ease-in-out 
                  ${
                    isSidebarOpen ? "md:left-56 lg:left-[288px]" : "md:left-0"
                  } left-0`}
        // Default (mobile): left-0 right-0 (full width).
        // Desktop (md+):
        // - Jika sidebar terbuka: md:left-64 (atau lg:left-72) hingga right-0.
        // - Jika sidebar tertutup: md:left-0 hingga right-0 (full width area konten).
      >
        {/* Wrapper untuk centering (mx-auto) dan lebar 50% (md:w-1/2) di dalam kontainer di atas */}
        <div className="w-full md:w-1/2 mx-auto bg-brand-light">
          <div className="flex items-end space-x-2 sm:space-x-3">
            <textarea
              id="userInputArea"
              value={userInput}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Tanyakan apa saja"
              className="flex-1 p-3 border border-brand-accent rounded-xl resize-none focus:ring-2 focus:ring-brand-dark focus:border-transparent outline-none min-h-[44px] max-h-40 overflow-y-auto bg-white text-brand-darker placeholder-brand-dark"
              rows={1}
              disabled={isSending && !!abortControllerRef.current}
            />
            <button
              onClick={handleSendMessage}
              disabled={
                (isSending && !!abortControllerRef.current) ||
                userInput.trim() === "" ||
                !apiKey
              }
              className="bg-brand-dark hover:bg-brand-darker text-white p-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 h-[44px] flex items-center justify-center"
              aria-label="Kirim pesan"
            >
              {isSending && !!abortControllerRef.current ? (
                <Loader2 size={24} className="animate-spin" />
              ) : (
                <Send size={24} />
              )}
            </button>
          </div>
        </div>
      </div>
      <div className="bg-brand-light text-brand-darker text-xs sm:text-sm px-3 py-2 text-center shadow-sm">
        OpenRouter Chat dapat membuat kesalahan. Periksa info penting.
      </div>
    </div>
  );
};
