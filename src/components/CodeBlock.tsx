import React, { useState } from "react";
import { Copy, Check } from "lucide-react";

const LANGUAGE_LABELS: Record<string, string> = {
  js: "JavaScript".toLowerCase(),
  javascript: "JavaScript".toLowerCase(),
  ts: "TypeScript".toLowerCase(),
  typescript: "TypeScript".toLowerCase(),
  py: "Python".toLowerCase(),
  python: "Python".toLowerCase(),
  java: "Java".toLowerCase(),
  c: "C".toLowerCase(),
  cpp: "C++".toLowerCase(),
  csharp: "C#".toLowerCase(),
  cs: "C#".toLowerCase(),
  go: "Go".toLowerCase(),
  php: "PHP".toLowerCase(),
  ruby: "Ruby".toLowerCase(),
  swift: "Swift".toLowerCase(),
  kotlin: "Kotlin".toLowerCase(),
  rust: "Rust".toLowerCase(),
  html: "HTML".toLowerCase(),
  css: "CSS".toLowerCase(),
  json: "JSON".toLowerCase(),
  sh: "Shell".toLowerCase(),
  bash: "Bash".toLowerCase(),
  sql: "SQL".toLowerCase(),
  dart: "Dart".toLowerCase(),
  scala: "Scala".toLowerCase(),
  r: "R".toLowerCase(),
  perl: "Perl".toLowerCase(),
  lua: "Lua".toLowerCase(),
  xml: "XML".toLowerCase(),
  yaml: "YAML".toLowerCase(),
  md: "Markdown".toLowerCase(),
  markdown: "Markdown".toLowerCase(),
  // ...tambahkan sesuai kebutuhan
};

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
            setTimeout(() => setCopied(false), 3000);
          })
          .catch((err) => {
            fallbackCopyTextToClipboard(children);
          });
      } catch (error) {
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
        setTimeout(() => setCopied(false), 3000);
      }
    } catch (err) {}
    document.body.removeChild(textArea);
  };

  // Mapping label bahasa
  const langLabel =
    LANGUAGE_LABELS[language?.toLowerCase?.()] ||
    (language ? language.charAt(0).toUpperCase() + language.slice(1) : "Kode");

  return (
    <div
      className={`my-6 rounded-2xl overflow-hidden shadow-lg border border-brand-accent bg-white`}
      style={{
        boxShadow: isUser
          ? "0 2px 16px 0 rgba(64, 64, 64, 0.10)"
          : "0 2px 16px 0 rgba(176, 137, 104, 0.10)",
      }}
    >
      <div className="flex justify-between items-center px-4 py-2 bg-brand-medium/80 border-b border-brand-accent rounded-t-2xl">
        <span className="text-xs font-semibold font-mono text-brand-darker tracking-wide">
          {langLabel}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-brand-light hover:bg-brand-accent/30 text-brand-darker text-xs font-medium transition-colors focus:outline-none"
          aria-label="Salin kode"
        >
          {copied ? (
            <>
              <Check size={16} className="text-green-500" />
              <span className="text-green-600 font-semibold">Disalin</span>
            </>
          ) : (
            <>
              <Copy size={16} />
              <span>Salin</span>
            </>
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
