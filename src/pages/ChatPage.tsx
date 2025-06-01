import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ChatView } from "../components/ChatView";
import { db } from "../db/dexie";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

// Komponen wrapper untuk ChatView yang mengambil chatId dari URL params
const ChatPage: React.FC<{
  apiKey: string;
  isSidebarOpen: boolean;
}> = ({ apiKey, isSidebarOpen }) => {
  const { chatId } = useParams<{ chatId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isValidChat, setIsValidChat] = useState(false);

  useEffect(() => {
    let isMounted = true; // Untuk menangani unmount selama operasi async

    if (!chatId) {
      // Kasus ini seharusnya jarang terjadi jika rute Anda adalah /c/:chatId
      // Namun sebagai pengaman:
      if (isMounted) {
        alert("Error: ID Chat tidak valid.");
        navigate("/", { replace: true });
      }
      return;
    }

    setIsLoading(true);
    setIsValidChat(false); // Reset validitas saat chatId berubah

    db.chats
      .get(chatId)
      .then((chat) => {
        if (isMounted) {
          if (chat) {
            setIsValidChat(true);
          } else {
            // Chat tidak ditemukan
            setIsValidChat(false);
            alert(`Error: Chat dengan ID "${chatId}" tidak ditemukan.`);
            navigate("/", { replace: true });
          }
        }
      })
      .catch((error) => {
        console.error("Error mengambil data chat:", error);
        if (isMounted) {
          setIsValidChat(false);
          alert(`Error: Terjadi masalah saat memuat chat.`);
          navigate("/", { replace: true });
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    // Fungsi cleanup untuk useEffect
    return () => {
      isMounted = false;
    };
  }, [chatId, navigate]); // Jalankan efek ini ketika chatId atau navigate berubah

  if (isLoading) {
    // Tampilkan indikator loading saat data chat sedang diperiksa
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="flex flex-col items-center">
          <Loader2 size={48} className="text-brand-dark animate-spin mb-4" />
          <p className="text-brand-dark">Memuat chat...</p>
        </div>
      </div>
    );
  }

  if (!isValidChat) {
    // Jika chat tidak valid dan tidak sedang loading, pengguna seharusnya sudah diarahkan.
    // Render null atau komponen Navigate untuk memastikan.
    return null;
    // Atau, jika ingin lebih eksplisit: return <Navigate to="/" replace />;
    // Namun, useEffect di atas sudah menangani navigasi.
  }

  return (
    <ChatView
      chatId={chatId!}
      apiKey={apiKey}
      isSidebarOpen={isSidebarOpen}
      chatToAutoProcess={location.state?.chatIdToAutoProcess || null}
    />
  );
};

export default ChatPage;
