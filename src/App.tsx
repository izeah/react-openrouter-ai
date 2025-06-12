import React, { useState, useEffect } from "react";
import { Sidebar } from "./components/Sidebar";
import { Eye, EyeOff, MessageSquarePlus, PanelLeftOpen } from "lucide-react";
import { db } from "./db/dexie";
import { useLiveQuery } from "dexie-react-hooks";
import {
  BrowserRouter,
  Link,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import HomePage from "./pages/HomePage";
import ChatPage from "./pages/ChatPage";

const MODEL_OPTIONS = [
  {
    value: "deepseek/deepseek-r1-0528-qwen3-8b:free",
    label: "DeepSeek R1 Qwen3-8B",
  },
  {
    value: "openai/gpt-3.5-turbo",
    label: "OpenAI GPT-3.5 Turbo",
  },
  {
    value: "meta-llama/llama-3-70b-instruct",
    label: "Llama-3 70B",
  },
  {
    value: "qwen/qwen3-235b-a22b:free",
    label: "Qwen3 235B",
  },
];

const AppLayout: React.FC = () => {
  const location = useLocation();
  const [selectedModel, setSelectedModel] = useState(MODEL_OPTIONS[0].value);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [currentRouteChatId, setCurrentRouteChatId] = useState<string | null>(
    null
  );

  const [isShowApiKey, setIsShowApiKey] = useState<boolean>(false);
  const [apiKey, setApiKey] = useState<string>(
    localStorage.getItem("openrouter_api_key") || ""
  );
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState<boolean>(!apiKey);

  const [showToast, setShowToast] = useState(false);

  const handleSetApiKey = () => {
    if (apiKey.trim() !== "") {
      localStorage.setItem("openrouter_api_key", apiKey);
      setIsApiKeyModalOpen(false);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 5000);
    } else {
      // Idealnya ini perlu UI kustom jika aplikasi production
      alert("API Key tidak boleh kosong.");
    }
  };

  const handleCloseSidebar = () => {
    if (
      isSidebarOpen &&
      typeof window !== "undefined" &&
      window.innerWidth < 768
    ) {
      setIsSidebarOpen(false);
    }
  };

  const chats = useLiveQuery(
    () => db.chats.orderBy("createdAt").reverse().toArray(),
    []
  );

  useEffect(() => {
    const handleSidebar = () => {
      if (typeof window !== "undefined") {
        if (window.innerWidth < 768) {
          setIsSidebarOpen(false);
        } else {
          setIsSidebarOpen(true);
        }
      }
    };

    // Tambahkan event listener untuk resize
    window.addEventListener("resize", handleSidebar);
    // Panggil fungsi untuk set awal sidebar
    handleSidebar();
    // Bersihkan event listener saat komponen unmount
    return () => {
      window.removeEventListener("resize", handleSidebar);
    };
  }, []);

  // Dapatkan chatId saat ini dari URL untuk menyorot item sidebar yang aktif
  useEffect(() => {
    const pathParts = location.pathname.split("/");
    if (pathParts.length === 3 && pathParts[1] === "c")
      setCurrentRouteChatId(pathParts[2]);
  }, [location.pathname]);

  // Prioritas ESC: modal API Key > sidebar
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isApiKeyModalOpen) {
          setIsApiKeyModalOpen(false);
        } else if (
          isSidebarOpen &&
          typeof window !== "undefined" &&
          window.innerWidth < 768
        ) {
          setIsSidebarOpen(false);
        }
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isApiKeyModalOpen, isSidebarOpen]);

  return (
    <div className="flex h-screen bg-brand-light font-sans">
      <Sidebar
        isOpen={isSidebarOpen}
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        toggleApiKeyModal={() => setIsApiKeyModalOpen(!isApiKeyModalOpen)}
        chats={chats || []}
        currentRouteChatId={currentRouteChatId}
      />
      <div
        className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out
                  ${
                    isSidebarOpen
                      ? "max-sm:bg-brand-darker max-sm:opacity-30 md:ml-64 lg:ml-72"
                      : "md:ml-0"
                  }`}
        onClick={handleCloseSidebar}
      >
        <div
          className={`absolute top-3 left-1/2 -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 transform transition-all duration-500 ease-in-out ${
            showToast
              ? "translate-y-0 opacity-100 scale-100"
              : "-translate-y-4 opacity-0 scale-95"
          }`}
          style={{ minWidth: 220, zIndex: 9999 }}
        >
          <svg
            className="w-5 h-5 text-white"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
          <span className="font-semibold">API Key berhasil diganti!</span>
        </div>
        <header className="p-3 sm:p-4 shadow-md flex flex-col sm:flex-row items-center print:hidden z-30">
          <div className="flex items-center justify-between sm:justify-normal w-full sm:w-auto">
            <div className="flex items-center">
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
              <Link
                to="/"
                className={`${
                  isSidebarOpen ? "invisible" : ""
                } text-brand-darker hover:text-brand-dark focus:outline-none hidden md:block`}
                aria-label="Toggle sidebar"
              >
                <div className="p-2 transition-colors hover:bg-brand-light rounded-md duration-150">
                  <MessageSquarePlus size={28} />
                </div>
              </Link>
            </div>
            <span
              className={`text-xl font-semibold text-brand-darker ${
                isSidebarOpen ? "absolute ml-auto" : "ml-2"
              }`}
            >
              OpenRouter Chat
            </span>
            <Link
              to="/"
              className={`text-brand-darker hover:text-brand-dark focus:outline-none block sm:hidden`}
              aria-label="Toggle sidebar"
            >
              <div className="p-2 transition-colors hover:bg-brand-light rounded-md duration-150">
                <MessageSquarePlus size={28} />
              </div>
            </Link>
          </div>
          <div className="flex-1 flex justify-end w-full sm:w-auto">
            <div className="model-selector flex flex-col sm:flex-row items-center gap-1 sm:gap-2 w-full sm:w-auto">
              <label
                htmlFor="model-select"
                className="text-xs text-brand-dark font-medium sm:mb-0 mb-1"
              >
                Model
              </label>
              <select
                id="model-select"
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="p-2 rounded-md border border-brand-accent bg-white text-brand-darker text-xs focus:ring-2 focus:ring-brand-dark focus:border-transparent outline-none min-w-[120px] max-w-[180px] shadow-sm hover:border-brand-dark transition"
              >
                {MODEL_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </header>
        {/* Area konten utama yang dirender berdasarkan rute */}
        <Routes>
          <Route
            path="/"
            element={<HomePage setCurrentRouteChatId={setCurrentRouteChatId} />}
          />
          <Route
            path="/c/:chatId"
            element={<ChatPage apiKey={apiKey} isSidebarOpen={isSidebarOpen} />}
          />
          {/* Rute fallback atau halaman 404 bisa ditambahkan di sini */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>

      {isApiKeyModalOpen && (
        <div
          className="fixed inset-0 bg-brand-dark bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setIsApiKeyModalOpen(false)}
        >
          <div
            className="bg-brand-light p-6 sm:p-8 rounded-lg shadow-xl w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-semibold text-brand-darker mb-4">
              Masukkan API Key OpenRouter
            </h2>
            <p className="text-sm text-brand-dark mb-4">
              API Key Anda akan disimpan di Local Storage browser Anda. Anda
              bisa mendapatkan API Key dari{" "}
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
            <div className="flex flex-row gap-2 items-center justify-center">
              <input
                type={isShowApiKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-or-v1-..."
                className="w-full p-3 border border-brand-accent rounded-md mb-6 focus:ring-2 focus:ring-brand-dark focus:border-transparent outline-none"
              />
              <button
                type="button"
                onClick={() => setIsShowApiKey(!isShowApiKey)}
                className="p-3 mb-6 text-brand-dark hover:text-brand-darker focus:outline-none"
                tabIndex={-1}
                aria-label="Show or hide API key"
              >
                {isShowApiKey ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <button
              onClick={handleSetApiKey}
              className="w-full bg-brand-dark hover:bg-brand-darker text-white font-semibold py-3 px-4 rounded-md transition duration-150"
            >
              Simpan API Key
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Komponen App utama hanya merender BrowserRouter dan AppLayout
const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
};

export default App;
