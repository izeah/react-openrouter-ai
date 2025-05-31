import React, { useState } from "react";
import { Copy, Check } from "lucide-react";

interface CodeBlockProps {
  language: string;
  filename: string;
  children: React.ReactNode;
  isUser: boolean;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({
  language,
  filename,
  children,
  isUser,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (typeof children === "string") {
      try {
        navigator.clipboard
          .writeText(children)
          .then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          })
          .catch((err) => {
            console.warn(
              "Gagal menyalin dengan navigator.clipboard, mencoba fallback:",
              err
            );
            fallbackCopyTextToClipboard(children);
          });
      } catch (error) {
        console.warn(
          "Navigator.clipboard tidak tersedia, mencoba fallback:",
          error
        );
        fallbackCopyTextToClipboard(children);
      }
    }
  };

  const fallbackCopyTextToClipboard = (text: string) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      const successful = document.execCommand("copy");
      if (successful) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } else {
        console.error("Fallback: Gagal menyalin teks");
      }
    } catch (err) {
      console.error("Fallback: Error saat menyalin teks", err);
    }
    document.body.removeChild(textArea);
  };

  return (
    <div
      className={`my-4 rounded-md overflow-hidden shadow-lg ${
        isUser ? "bg-gray-700" : "bg-gray-800"
      }`}
    >
      <div
        className={`flex justify-between items-center px-3 py-2 ${
          isUser ? "bg-gray-600 text-gray-200" : "bg-gray-700 text-gray-200"
        }`}
      >
        <span className="text-xs font-mono">
          {filename || language || "Kode"}
        </span>
        <button
          onClick={handleCopy}
          className={`p-1 rounded-md ${
            isUser ? "hover:bg-gray-500" : "hover:bg-gray-600"
          } transition-colors`}
          aria-label="Salin kode"
        >
          {copied ? (
            <Check size={16} className="text-green-400" />
          ) : (
            <Copy size={16} />
          )}
        </button>
      </div>
      <pre className="p-0 m-0 overflow-x-auto">
        <code
          className={`language-${
            language || ""
          } block p-3 text-sm text-gray-50 whitespace-pre-wrap break-all`}
        >
          {children}
        </code>
      </pre>
    </div>
  );
};
