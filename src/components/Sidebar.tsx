import React from "react";
import {
  PlusCircle,
  MessageSquare,
  Trash2,
  ChevronDown,
  ChevronRight,
  PanelLeftClose,
} from "lucide-react";
// Chat interface is defined in App.tsx and passed as prop
import { db, type Chat } from "../db/dexie";
import { formatDistanceToNowStrict } from "date-fns";
import { id as IndonesianLocale } from "date-fns/locale";
import { Link, useNavigate } from "react-router-dom";

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
  chats: Chat[]; // Chat type comes from App.tsx's db/dexie import
  currentRouteChatId: string | null;
}

interface GroupedChats {
  [groupName: string]: Chat[];
}

const groupChatsByTime = (chats: Chat[]): GroupedChats => {
  const groups: GroupedChats = {
    "Hari Ini": [],
    Kemarin: [],
    "7 Hari Sebelumnya": [],
    "30 Hari Sebelumnya": [],
    "Lebih Lama": [],
  };

  const now = new Date();
  chats.forEach((chat) => {
    const chatDate = new Date(chat.createdAt);
    const diffDays =
      (new Date(now.getFullYear(), now.getMonth(), now.getDate()).valueOf() -
        new Date(
          chatDate.getFullYear(),
          chatDate.getMonth(),
          chatDate.getDate()
        ).valueOf()) /
      (1000 * 3600 * 24);

    if (diffDays === 0) groups["Hari Ini"].push(chat);
    else if (diffDays === 1) groups["Kemarin"].push(chat);
    else if (diffDays < 7) groups["7 Hari Sebelumnya"].push(chat);
    else if (diffDays < 30) groups["30 Hari Sebelumnya"].push(chat);
    else groups["Lebih Lama"].push(chat);
  });

  return Object.entries(groups).reduce((acc, [key, value]) => {
    if (value.length > 0) {
      acc[key] = value;
    }
    return acc;
  }, {} as GroupedChats);
};

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  toggleSidebar,
  chats,
  currentRouteChatId,
}) => {
  const navigate = useNavigate();
  const groupedChats = groupChatsByTime(chats);
  const [expandedGroups, setExpandedGroups] = React.useState<
    Record<string, boolean>
  >({
    "Hari Ini": true,
    Kemarin: true,
    "7 Hari Sebelumnya": true,
    "30 Hari Sebelumnya": true,
    "Lebih Lama": true,
  });

  const toggleGroup = (groupName: string) => {
    setExpandedGroups((prev) => ({ ...prev, [groupName]: !prev[groupName] }));
  };

  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [chatToDelete, setChatToDelete] = React.useState<Chat | null>(null);

  const handleDeleteChat = async (chatId: string) => {
    await db.deleteChat(chatId);
  };

  const handleDeleteClick = (chat: Chat, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setChatToDelete(chat);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (chatToDelete) {
      handleDeleteChat(chatToDelete.id);
      if (currentRouteChatId === chatToDelete.id) {
        navigate("/", { replace: true }); // Navigasi ke halaman utama jika chat yang dihapus adalah yang sedang aktif
      }
    }
    setShowDeleteConfirm(false);
    setChatToDelete(null);
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setChatToDelete(null);
  };

  return (
    <>
      <div
        className={`
          ${isOpen ? "translate-x-0" : "-translate-x-full"} 
          fixed inset-y-0 left-0 z-40 w-64 sm:w-72 bg-brand-medium text-brand-darker
          transform transition-transform duration-300 ease-in-out 
          flex flex-col print:hidden
          shadow-lg border-r border-brand-accent
        `}
      >
        <div className="p-4 flex justify-between items-center border-b border-brand-accent">
          <h1 className="text-xl font-semibold">Riwayat Chat</h1>
          {/* Tombol hamburger baru di header sidebar */}
          <button
            onClick={toggleSidebar} // Memanggil fungsi toggleSidebar dari App.tsx
            className="text-brand-darker hover:text-brand-dark focus:outline-none md:inline-flex" // Selalu tampil di sidebar header, tapi sidebar mungkin tersembunyi
            aria-label="Toggle sidebar"
          >
            {/* Ikon berubah berdasarkan state isOpen */}
            <div
              className={`${
                isOpen ? "" : "invisible"
              } p-2 transition-colors hover:bg-brand-light rounded-md duration-150`}
            >
              <PanelLeftClose size={28} />
            </div>
          </button>
        </div>
        <Link
          to="/"
          className="flex items-center w-auto text-left p-3 m-3 bg-brand-dark hover:bg-brand-darker text-white rounded-lg transition-colors duration-150"
        >
          <PlusCircle size={20} className="mr-2" />
          Buat Chat Baru
        </Link>
        <nav className="flex-1 overflow-y-auto p-2 space-y-1">
          {Object.keys(groupedChats).length === 0 && (
            <p className="p-4 text-sm text-center text-brand-dark">
              Belum ada riwayat chat.
            </p>
          )}
          {Object.entries(groupedChats).map(([groupName, groupChats]) => (
            <div key={groupName}>
              <button
                onClick={() => toggleGroup(groupName)}
                className="flex items-center justify-between w-auto p-2 text-sm font-semibold text-brand-dark hover:bg-brand-light rounded-md"
              >
                {groupName} ({groupChats.length})
                {expandedGroups[groupName] ? (
                  <ChevronDown size={18} />
                ) : (
                  <ChevronRight size={18} />
                )}
              </button>
              {/* Mengubah cara ul dirender untuk transisi */}
              <ul
                className={`
                    mt-1 ml-2 space-y-1 overflow-hidden transition-all ease-in-out
                    ${
                      expandedGroups[groupName]
                        ? "duration-500 max-h-[1000px] opacity-100 translate-y-0"
                        : "duration-300 max-h-0 opacity-0 -translate-y-10"
                    }
                  `}
                // max-h-[1000px] adalah nilai yang cukup besar, sesuaikan jika perlu
              >
                {groupChats.map((chat) => (
                  <li key={chat.id} className="flex flex-col">
                    <Link
                      to={`/c/${chat.id}`}
                      className={`
                          group flex items-center justify-between p-1 rounded-md cursor-pointer
                          transition-colors duration-150
                          ${
                            currentRouteChatId === chat.id
                              ? "bg-brand-accent text-white"
                              : "hover:bg-brand-light text-brand-darker"
                          }
                        `}
                    >
                      <div className="flex items-center overflow-hidden flex-1 min-w-0">
                        <MessageSquare
                          size={18}
                          className="mr-2 flex-shrink-0"
                        />
                        <span className="truncate text-sm">{chat.title}</span>
                      </div>
                      <button
                        onClick={(e) => handleDeleteClick(chat, e)}
                        className={`
                            ml-2 p-1 rounded opacity-0 group-hover:opacity-100
                            ${
                              currentRouteChatId === chat.id
                                ? "text-white hover:bg-red-400"
                                : "text-red-500 hover:bg-red-100"
                            }
                            focus:opacity-100 transition-opacity
                          `}
                        aria-label="Hapus chat"
                      >
                        <Trash2 size={16} />
                      </button>
                    </Link>
                    <p className="text-xs text-gray-500 ml-9">
                      {formatDistanceToNowStrict(new Date(chat.createdAt), {
                        addSuffix: true,
                        locale: IndonesianLocale,
                      })}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
        <div className="p-4 border-t border-brand-accent text-xs text-center text-brand-dark">
          Bertenaga AI
        </div>
      </div>

      {showDeleteConfirm && chatToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 p-4">
          <div className="bg-brand-light p-6 rounded-lg shadow-xl max-w-sm w-full">
            <h3 className="text-lg font-semibold text-brand-darker mb-4">
              Konfirmasi Hapus
            </h3>
            <p className="text-sm text-brand-dark mb-6">
              Apakah Anda yakin ingin menghapus chat: "{chatToDelete.title}"?
              Tindakan ini tidak dapat diurungkan.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 text-sm font-medium text-brand-dark bg-gray-200 hover:bg-gray-300 rounded-md"
              >
                Batal
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-md"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
