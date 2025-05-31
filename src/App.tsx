import React, { useState, useEffect, useCallback } from "react";
import { Sidebar } from "./components/Sidebar";
import { ChatView } from "./components/ChatView";
import { MessageSquarePlus, PanelLeftOpen, Send } from "lucide-react";
import { db, type Chat, type Message } from "./db/dexie";
import { useLiveQuery } from "dexie-react-hooks";

const App: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string>(
    localStorage.getItem("openrouter_api_key") || ""
  );
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState<boolean>(!apiKey);
  const [initialPrompt, setInitialPrompt] = useState(""); // State untuk textarea di layar selamat datang
  const [chatToAutoProcess, setChatToAutoProcess] = useState<string | null>(
    null
  );

  // Array untuk teks sambutan acak
  const greetings = [
    "Aku siap kapanpun kamu siap!",
    "Apa yang bisa kubantu hari ini?",
    "Siap atasi masalah kamu!",
    "Mau curhat? boleh 😁",
    "Beri aku kejutan ✨",
  ];
  const [welcomeGreeting, setWelcomeGreeting] = useState("");

  const chats = useLiveQuery(
    () => db.chats.orderBy("createdAt").reverse().toArray(),
    []
  );

  useEffect(
    () => {
      if (typeof window !== "undefined" && window.innerWidth < 768) {
        setIsSidebarOpen(false);
      }
      // Automatically select the most recent chat if none is selected and chats exist
      // if (!currentChatId && chats && chats.length > 0) {
      //   setCurrentChatId(chats[0].id);
      // }
      // Setel teks sambutan acak jika tidak ada chat yang dipilih
      if (!currentChatId) {
        setWelcomeGreeting(
          greetings[Math.floor(Math.random() * greetings.length)]
        );
      }
    },
    // [chats, currentChatId]
    []
  );

  const handleSetApiKey = () => {
    if (apiKey.trim() !== "") {
      localStorage.setItem("openrouter_api_key", apiKey);
      setIsApiKeyModalOpen(false);
    } else {
      // Idealnya ini perlu UI kustom jika aplikasi production
      alert("API Key tidak boleh kosong.");
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInitialPrompt(event.target.value);
    event.target.style.height = "auto";
    event.target.style.height = `${Math.min(event.target.scrollHeight, 160)}px`; // Max height 160px (max-h-40)
  };

  // Fungsi baru untuk membuat chat dari layar selamat datang dengan pesan pertama
  const handleCreateChatFromWelcome = async (firstMessageContent: string) => {
    const trimmedContent = firstMessageContent.trim();
    if (!trimmedContent) return; // Jangan buat chat jika pesan kosong

    const newChatId = crypto.randomUUID();
    // Judul chat diambil dari 30 karakter pertama pesan
    const chatTitle =
      trimmedContent.substring(0, 30) +
      (trimmedContent.length > 30 ? "..." : "");

    const newChat: Chat = {
      id: newChatId,
      title: chatTitle,
      createdAt: Date.now(),
    };
    await db.chats.add(newChat); // Tambahkan chat baru ke DB

    const userMessage: Message = {
      // Buat pesan pertama pengguna
      id: crypto.randomUUID(),
      chatId: newChatId,
      role: "user",
      content: trimmedContent,
      timestamp: Date.now(),
    };
    await db.addMessage(userMessage); // Tambahkan pesan pertama ke DB

    setChatToAutoProcess(newChatId); // Tandai chat ini untuk diproses otomatis di ChatView
    setCurrentChatId(newChatId); // Set chat baru sebagai chat aktif
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setIsSidebarOpen(false); // Tutup sidebar di mobile
    }
    setInitialPrompt(""); // Kosongkan textarea setelah submit
  };

  const createNewChat = useCallback(async () => {
    // const newChatId = await db.createNewChat("Chat Baru");
    // setCurrentChatId(newChatId);
    // if (typeof window !== "undefined" && window.innerWidth < 768) {
    //   setIsSidebarOpen(false);
    // }
    // return newChatId;
    setCurrentChatId(null); // Reset current chat
    setInitialPrompt(""); // Kosongkan textarea
    setChatToAutoProcess(null); // Reset chat to auto process
    setWelcomeGreeting(greetings[Math.floor(Math.random() * greetings.length)]); // Setel teks sambutan acak baru
  }, []);

  const handleSelectChat = (chatId: string) => {
    setCurrentChatId(chatId);
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  const handleDeleteChat = async (chatId: string) => {
    await db.deleteChat(chatId);
    if (currentChatId === chatId) {
      const newChats = await db.chats.orderBy("createdAt").reverse().toArray();
      setCurrentChatId(newChats && newChats.length > 0 ? newChats[0].id : null);
    }
  };

  if (isApiKeyModalOpen) {
    return (
      <div className="fixed inset-0 bg-brand-dark bg-opacity-75 flex items-center justify-center z-50 p-4">
        <div className="bg-brand-light p-6 sm:p-8 rounded-lg shadow-xl w-full max-w-md">
          <h2 className="text-2xl font-semibold text-brand-darker mb-4">
            Masukkan API Key OpenRouter
          </h2>
          <p className="text-sm text-brand-dark mb-4">
            API Key Anda akan disimpan di Local Storage peramban Anda. Anda bisa
            mendapatkan API Key dari{" "}
            <a
              href="https://openrouter.ai/keys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              OpenRouter Keys
            </a>
            .
          </p>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-or-v1-..."
            className="w-full p-3 border border-brand-accent rounded-md mb-6 focus:ring-2 focus:ring-brand-dark focus:border-transparent outline-none"
          />
          <button
            onClick={handleSetApiKey}
            className="w-full bg-brand-dark hover:bg-brand-darker text-white font-semibold py-3 px-4 rounded-md transition duration-150"
          >
            Simpan API Key
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-brand-light font-sans">
      <Sidebar
        isOpen={isSidebarOpen}
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        chats={chats || []}
        currentChatId={currentChatId}
        onSelectChat={handleSelectChat}
        onCreateNewChat={createNewChat}
        onDeleteChat={handleDeleteChat}
      />
      <div
        className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out
                  ${isSidebarOpen ? "md:ml-64 lg:ml-72" : "md:ml-0"}`}
      >
        <header className="p-3 sm:p-4 shadow-md flex items-center print:hidden z-30">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={`${
              isSidebarOpen ? "invisible" : ""
            } text-brand-darker hover:text-brand-dark focus:outline-none`}
            aria-label="Toggle sidebar"
          >
            <div className="p-2 transition-colors hover:bg-brand-light rounded-md duration-150">
              <PanelLeftOpen size={28} />
            </div>
          </button>
          <button
            onClick={createNewChat}
            className={`${
              isSidebarOpen ? "invisible" : ""
            } text-brand-darker hover:text-brand-dark focus:outline-none hidden md:block`}
            aria-label="Toggle sidebar"
          >
            <div className="p-2 transition-colors hover:bg-brand-light rounded-md duration-150">
              <MessageSquarePlus size={28} />
            </div>
          </button>
          <div className="text-xl font-semibold text-brand-darker ml-auto">
            OpenRouter Chat
          </div>
        </header>
        {currentChatId ? (
          <ChatView
            chatId={currentChatId}
            apiKey={apiKey}
            isSidebarOpen={isSidebarOpen}
            chatToAutoProcess={chatToAutoProcess}
            setChatToAutoProcess={setChatToAutoProcess}
          />
        ) : (
          // Tampilan ketika tidak ada chat yang dipilih (layar selamat datang baru)
          <div className="flex-1 flex flex-col items-center justify-center text-brand-dark p-4 sm:p-8">
            <img
              src="https://placehold.co/100x100/E8DFCA/785A3E?text=🤖"
              alt="AI Icon"
              className="mb-6 rounded-full w-20 h-20 sm:w-24 sm:h-24"
            />
            <h2 className="text-2xl sm:text-3xl font-semibold mb-4 text-center">
              {welcomeGreeting || "Selamat Datang!"}
            </h2>
            {/* Menghapus teks: "Pilih chat dari sidebar atau buat chat baru untuk memulai." */}
            {/* Textarea dan tombol send untuk membuat chat baru */}
            <div className="w-full max-w-xl mt-6">
              <div className="flex items-end space-x-2 sm:space-x-3 bg-brand-medium p-3 rounded-lg shadow-md">
                <textarea
                  value={initialPrompt}
                  onChange={handleInputChange}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleCreateChatFromWelcome(initialPrompt);
                    }
                  }}
                  placeholder="Tanyakan apa saja"
                  className="flex-1 p-3 border border-brand-accent rounded-lg resize-none focus:ring-2 focus:ring-brand-dark focus:border-transparent outline-none min-h-[44px] max-h-40 overflow-y-auto bg-white text-brand-darker placeholder-brand-dark"
                  rows={1}
                />
                <button
                  onClick={() => {
                    handleCreateChatFromWelcome(initialPrompt);
                  }}
                  disabled={!initialPrompt.trim()} // Tombol disable jika textarea kosong
                  className="bg-brand-dark hover:bg-brand-darker text-white p-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 h-[44px] flex items-center justify-center"
                  aria-label="Kirim pesan dan buat chat baru"
                >
                  <Send size={24} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
