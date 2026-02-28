import { ShieldCheck, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Message } from "@/types";

interface ChatMessageProps {
  message: Message;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "flex gap-3 items-start",
        isUser && "flex-row-reverse"
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-0.5",
          isUser
            ? "bg-stone-700"
            : "bg-amber-500/20 border border-amber-500/30"
        )}
      >
        {isUser ? (
          <User className="h-4 w-4 text-stone-300" />
        ) : (
          <ShieldCheck className="h-4 w-4 text-amber-400" />
        )}
      </div>

      {/* Bubble */}
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
          isUser
            ? "bg-stone-700 text-stone-100 rounded-tr-sm"
            : "bg-stone-800 border border-stone-700 text-stone-200 rounded-tl-sm"
        )}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>
      </div>
    </div>
  );
}
