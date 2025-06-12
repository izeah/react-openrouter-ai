import { Send } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { db, type Chat, type Message } from "../db/dexie";
import { useNavigate } from "react-router-dom";

const HomePage: React.FC<{
  setCurrentRouteChatId: React.Dispatch<React.SetStateAction<string | null>>;
}> = ({ setCurrentRouteChatId }) => {
  const navigate = useNavigate(); // Inisialisasi useNavigate untuk navigasi
  const [initialPrompt, setInitialPrompt] = useState(""); // State untuk textarea di layar selamat datang

  // Array untuk teks sambutan acak
  const greetings = [
    "Aku siap kapanpun kamu siap!",
    "Apa yang bisa kubantu hari ini?",
    "Siap atasi masalah kamu!",
    "Mau curhat? boleh 😁",
    "Beri aku kejutan ✨",
  ];
  const [welcomeGreeting, setWelcomeGreeting] = useState("");

  useEffect(() => {
    setCurrentRouteChatId(null); // Setel chatId saat ini ke null ketika HomePage dimuat
    setWelcomeGreeting(greetings[Math.floor(Math.random() * greetings.length)]);
  }, []);

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

    setInitialPrompt(""); // Kosongkan textarea setelah submit
    navigate(`/c/${newChatId}`, { state: { chatIdToAutoProcess: newChatId } }); // Navigasi ke halaman chat baru
  };

  return (
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
  );
};

export default HomePage;
