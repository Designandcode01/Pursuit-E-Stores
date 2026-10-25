import { CircleCheck, CircleX, Info } from "lucide-react";

export function AdminFlash({
  params,
}: {
  params: Record<string, string | string[] | undefined>;
}) {
  const value = (key: string) => {
    const raw = params[key];
    return Array.isArray(raw) ? raw[0] : raw;
  };

  const messages: { tone: "success" | "error" | "info"; text: string }[] = [];

  if (value("saved")) messages.push({ tone: "success", text: "Changes saved successfully." });
  if (value("updated")) messages.push({ tone: "success", text: "Update applied." });
  if (value("deleted")) messages.push({ tone: "success", text: "Item deleted." });
  if (value("created")) messages.push({ tone: "success", text: "Created successfully." });

  const error = value("error");
  if (error === "in-use") {
    messages.push({
      tone: "error",
      text: "That category still has products. Move or delete them first.",
    });
  } else if (error === "missing") {
    messages.push({ tone: "error", text: "Something was missing from the request." });
  } else if (error === "invalid") {
    messages.push({ tone: "error", text: "That action is not allowed." });
  } else if (error) {
    messages.push({ tone: "error", text: error });
  }

  if (messages.length === 0) return null;

  return (
    <div className="space-y-2" role="status">
      {messages.map((message, index) => {
        const Icon =
          message.tone === "success" ? CircleCheck : message.tone === "error" ? CircleX : Info;
        return (
          <div
            key={`${message.tone}-${index}`}
            className={
              message.tone === "success"
                ? "flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
                : message.tone === "error"
                  ? "flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
                  : "flex items-start gap-2 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800"
            }
          >
            <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            <span>{message.text}</span>
          </div>
        );
      })}
    </div>
  );
}
