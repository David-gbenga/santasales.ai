"use client";

import { useId, useState, useSyncExternalStore, type ReactNode } from "react";
import { requestUpload } from "@/app/admin/content-actions";
import type { FormState, UploadPurpose } from "@/lib/admin/content-schemas";

export const inputClass =
  "mt-2 block w-full rounded-md border border-ink/25 bg-white px-4 py-3 text-base text-ink placeholder:text-ink-muted/70 focus-visible:border-ink aria-[invalid=true]:border-berry";

/** A labelled field with its error underneath; the input gets aria-invalid/aria-describedby. */
export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: (props: {
    id: string;
    "aria-invalid": boolean;
    "aria-describedby"?: string;
    autoComplete: "off";
  }) => ReactNode;
}) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hint ? hintId : "", error ? errorId : ""].filter(Boolean).join(" ") || undefined;
  return (
    <div>
      <label htmlFor={id} className="block font-medium">
        {label}
      </label>
      {hint && (
        <p id={hintId} className="mt-1 text-sm text-ink-muted">
          {hint}
        </p>
      )}
      {children({ id, "aria-invalid": Boolean(error), "aria-describedby": describedBy, autoComplete: "off" })}
      {error && (
        <p id={errorId} className="mt-1 text-sm font-medium text-berry">
          {error}
        </p>
      )}
    </div>
  );
}

export function Checkbox({ name, label, defaultChecked }: { name: string; label: string; defaultChecked: boolean }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 font-medium">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="size-5 accent-ink" />
      {label}
    </label>
  );
}

const noopSubscribe = () => () => {};

/** Save button plus the form-level message. */
export function SaveBar({
  state,
  label,
  uploading,
  pending,
}: {
  state: FormState;
  label: string;
  uploading: boolean;
  pending: boolean;
}) {
  // False in the server HTML and until hydration, so a click can’t fall back
  // to a plain browser submit before the form is wired up.
  const interactive = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
  return (
    <div className="flex flex-wrap items-center gap-4 border-t border-line-snow pt-6">
      <button
        type="submit"
        disabled={!interactive || pending || uploading}
        className="inline-flex min-h-12 items-center rounded-full bg-ink px-7 font-semibold text-snow hover:bg-night-raised disabled:cursor-wait disabled:opacity-70"
      >
        {pending ? "Saving…" : uploading ? "Waiting for upload…" : label}
      </button>
      <p role="status" aria-live="polite" className={state.status === "error" ? "font-medium text-berry" : "text-ink-muted"}>
        {state.message}
      </p>
    </div>
  );
}

type UploadStatus = { kind: "idle" } | { kind: "uploading" } | { kind: "done"; name: string } | { kind: "error"; message: string };

/**
 * File picker that uploads straight to Supabase Storage through a signed
 * URL from `requestUpload`, then puts the stored path in a hidden input for
 * the form's save action. Optionally also takes a pasted https image link.
 */
export function UploadField({
  name,
  purpose,
  label,
  hint,
  accept,
  initialValue,
  initialPreview,
  error,
  allowUrl = false,
  onChange,
  onBusyChange,
}: {
  name: string;
  purpose: UploadPurpose;
  label: string;
  hint: string;
  accept: string;
  initialValue: string;
  /** Image URL to show for the current value, if it's an image. */
  initialPreview: string | null;
  error?: string;
  allowUrl?: boolean;
  onChange?: (value: string, previewUrl: string | null) => void;
  onBusyChange?: (busy: boolean) => void;
}) {
  const id = useId();
  const [value, setValue] = useState(initialValue);
  const [preview, setPreview] = useState(initialPreview);
  const [status, setStatus] = useState<UploadStatus>({ kind: "idle" });
  const isImage = purpose !== "product-file";

  function set(next: string, nextPreview: string | null) {
    setValue(next);
    setPreview(nextPreview);
    onChange?.(next, nextPreview);
  }

  async function upload(file: File) {
    setStatus({ kind: "uploading" });
    onBusyChange?.(true);
    try {
      const ticket = await requestUpload({
        purpose,
        filename: file.name,
        contentType: file.type,
        size: file.size,
      });
      if (!ticket.ok) throw new Error(ticket.error);
      const res = await fetch(ticket.signedUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!res.ok) throw new Error("The upload didn't finish. Try again.");
      set(ticket.path, ticket.publicUrl);
      setStatus({ kind: "done", name: file.name });
    } catch (err) {
      setStatus({ kind: "error", message: err instanceof Error ? err.message : "The upload failed." });
    } finally {
      onBusyChange?.(false);
    }
  }

  return (
    <div>
      <label htmlFor={id} className="block font-medium">
        {label}
      </label>
      <p className="mt-1 text-sm text-ink-muted">{hint}</p>
      <input type="hidden" name={name} value={value} />
      <div className="mt-3 flex flex-wrap items-start gap-4">
        {isImage && preview && (
          // eslint-disable-next-line @next/next/no-img-element -- admin preview of an uploaded image
          <img
            src={preview}
            alt=""
            width={112}
            height={112}
            className="size-28 rounded-md border border-line-snow bg-white object-contain"
          />
        )}
        <div className="min-w-0 flex-1">
          <input
            id={id}
            type="file"
            accept={accept}
            aria-invalid={Boolean(error)}
            disabled={status.kind === "uploading"}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void upload(file);
            }}
            className="block w-full text-sm file:mr-3 file:min-h-10 file:rounded-full file:border-0 file:bg-ink file:px-4 file:font-semibold file:text-snow"
          />
          <p role="status" aria-live="polite" className="mt-2 text-sm">
            {status.kind === "uploading" && <span className="text-ink-muted">Uploading…</span>}
            {status.kind === "done" && <span className="text-pine">Uploaded {status.name}. Save to use it.</span>}
            {status.kind === "error" && <span className="font-medium text-berry">{status.message}</span>}
            {status.kind === "idle" && value && !isImage && (
              <span className="text-ink-muted">Current file: {value.split("/").pop()}</span>
            )}
          </p>
          {error && status.kind !== "done" && <p className="text-sm font-medium text-berry">{error}</p>}
        </div>
      </div>
      {allowUrl && (
        <div className="mt-3">
          <label htmlFor={`${id}-url`} className="block text-sm font-medium">
            Or paste an image link (https://)
          </label>
          <input
            id={`${id}-url`}
            type="url"
            inputMode="url"
            placeholder="https://…"
            defaultValue={/^https:\/\//.test(initialValue) ? initialValue : ""}
            onChange={(e) => {
              const url = e.target.value.trim();
              if (/^https:\/\/\S+$/.test(url)) set(url, url);
            }}
            className={inputClass}
          />
        </div>
      )}
    </div>
  );
}
