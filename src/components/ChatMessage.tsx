import React from "react";
import ReactMarkdown from "react-markdown";
// Menggunakan impor standar untuk remark-gfm
import remarkGfm from "remark-gfm";
import { CodeBlock } from "./CodeBlock";
import { format } from "date-fns";
import { id as IndonesianLocale } from "date-fns/locale"; // Ensure this is imported
import type { Message } from "../db/dexie";
import TypingIndicator from "./TypingIndicator";

// Message interface is defined in App.tsx (implicitly via db/dexie) and passed as prop
// export interface Message { ... }

interface ChatMessageProps {
  message: Message; // Message type comes from App.tsx's db/dexie import
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === "user";
  const messageTime = format(new Date(message.timestamp), "HH:mm", {
    locale: IndonesianLocale,
  });

  if (message.role === "system") {
    return (
      <div className="text-center text-xs text-gray-500 py-2 italic">
        {message.content}
      </div>
    );
  }

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} group`}>
      <div
        className={`flex items-end ${
          isUser
            ? "max-w-[85%] sm:max-w-[75%] md:max-w-[70%] flex-row-reverse"
            : "flex-row"
        } gap-x-2 sm:gap-x-3`}
      >
        {/* {!isUser && (
          <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-brand-accent flex items-center justify-center text-white font-semibold">
            <img
              src="https://placehold.co/40x40/A08C6D/FFFFFF?text=AI"
              alt="AI Avatar"
              className="rounded-full"
            />
          </div>
        )}
        {isUser && (
          <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-brand-dark flex items-center justify-center text-white font-semibold">
            <img
              src="https://placehold.co/40x40/4B3F30/FFFFFF?text=U"
              alt="User Avatar"
              className="rounded-full"
            />
          </div>
        )} */}
        <div
          className={`
            p-3 sm:p-4 rounded-xl shadow-md
            ${
              isUser
                ? "bg-brand-dark text-white"
                : "bg-brand-medium text-brand-darker"
            }
          `}
        >
          {!isUser && !message.content ? (
            <TypingIndicator />
          ) : (
            <>
              <article
                className={`prose prose-sm sm:prose-base max-w-none 
            prose-p:text-inherit prose-headings:text-inherit prose-strong:text-inherit 
            prose-em:text-inherit 
            prose-blockquote:border-l-brand-accent prose-blockquote:text-inherit
            prose-code:bg-gray-700 prose-code:text-gray-100 prose-code:p-1 prose-code:rounded-sm prose-code:font-mono prose-code:text-xs
            prose-table:border prose-th:border prose-td:border prose-th:p-2 prose-td:p-2
            ${
              isUser
                ? "prose-invert prose-a:text-blue-300 hover:prose-a:text-blue-200 prose-code:bg-gray-200 prose-code:text-gray-800"
                : "prose-a:text-blue-600 hover:prose-a:text-blue-500"
            }
          `}
              >
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code({
                      inline,
                      className,
                      children,
                      ...props
                    }: {
                      inline?: boolean;
                      className?: string;
                      children?: React.ReactNode;
                      [key: string]: any;
                    }) {
                      const match = /language-(\w+)(?::([\w.-]+))?/.exec(
                        className || ""
                      );
                      const language = match && match[1] ? match[1] : "";
                      const defaultFilename = language
                        ? `${language} snippet`
                        : "kode";
                      const filename =
                        match && match[2] ? match[2] : defaultFilename;

                      return !inline ? (
                        <CodeBlock
                          language={language}
                          filename={filename}
                          isUser={isUser}
                        >
                          {String(children).replace(/\n$/, "")}
                        </CodeBlock>
                      ) : (
                        <code
                          className={`${className || ""} text-xs`}
                          {...props}
                        >
                          {children}
                        </code>
                      );
                    },
                    pre: ({ children }) => <>{children}</>,
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              </article>
              <div
                className={`text-xs mt-2 ${
                  isUser
                    ? "text-gray-300 text-right"
                    : "text-gray-500 text-left"
                } opacity-0 group-hover:opacity-100 transition-opacity`}
              >
                {messageTime}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
