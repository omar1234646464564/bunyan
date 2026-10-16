import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export type MessageData = {
  id: string;
  body: string;
  createdAt: Date | string;
  senderId: string;
  sender: { name: string; role: string };
};

export function MessageThread({
  messages,
  currentUserId,
  platformLabel,
}: {
  messages: MessageData[];
  currentUserId: string;
  platformLabel?: string;
}) {
  if (messages.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-zinc-400">
        لا توجد رسائل بعد.
      </p>
    );
  }

  return (
    <div className="max-h-96 space-y-3 overflow-y-auto py-2">
      {messages.map((message) => {
        const mine = message.senderId === currentUserId;
        const displayName =
          platformLabel && message.sender.role === "ADMIN"
            ? platformLabel
            : message.sender.name;
        return (
          <div
            key={message.id}
            className={cn("flex", mine ? "justify-start" : "justify-end")}
          >
            <div
              className={cn(
                "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm",
                mine
                  ? "bg-teal-700 text-white"
                  : "bg-zinc-100 text-zinc-800",
              )}
            >
              <p className="whitespace-pre-line">{message.body}</p>
              <p
                className={cn(
                  "mt-1 text-[10px]",
                  mine ? "text-teal-100" : "text-zinc-400",
                )}
              >
                {displayName} · {formatDate(message.createdAt)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
