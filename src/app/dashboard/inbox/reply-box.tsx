"use client";

import { useActionState, useRef } from "react";
import { staffReply } from "../actions";

// Staff reply on WhatsApp. Sending also keeps Sara paused, so she does not answer over staff.
export function ReplyBox({ patientId, paused }: { patientId: string; paused: boolean }) {
  const form = useRef<HTMLFormElement>(null);
  const [error, send, pending] = useActionState(async (_: string | null, data: FormData) => {
    const error = await staffReply(patientId, data);
    if (!error) form.current?.reset();
    return error;
  }, null);

  return (
    <form ref={form} action={send} className="grid gap-2">
      <label htmlFor="reply" className="sr-only">Reply on WhatsApp</label>
      <div className="flex items-end gap-2">
        <textarea
          id="reply"
          name="text"
          rows={2}
          required
          maxLength={1500}
          dir="auto"
          placeholder={paused ? "Reply on WhatsApp" : "Replying takes the chat over from Sara"}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              form.current?.requestSubmit();
            }
          }}
          className="min-h-11 flex-1 resize-none rounded-[4px] border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <button disabled={pending} className="h-11 rounded-full bg-foreground px-5 text-[13px] font-medium text-background disabled:opacity-60">
          {pending ? "Sending" : "Send"}
        </button>
      </div>
      {error && <p role="alert" className="text-sm text-alert">{error}</p>}
    </form>
  );
}
