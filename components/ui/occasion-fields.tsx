"use client";

import { useId } from "react";
import { OCCASIONS, OCCASION_KEYS, type Occasion } from "@/lib/occasions";

const selectClass =
  "mt-2 block w-full rounded-md border border-ink/25 bg-white px-4 py-3 text-base text-ink focus-visible:border-ink";

/** Occasion picker shared by the card and song forms. */
export function OccasionField({
  value,
  onChange,
  noun,
}: {
  value: Occasion;
  onChange: (occasion: Occasion) => void;
  noun: "card" | "song";
}) {
  const id = useId();
  return (
    <div className="mt-4">
      <label htmlFor={id} className="block font-medium">
        What&rsquo;s the {noun} for?
      </label>
      <select
        id={id}
        name="occasion"
        value={value}
        onChange={(e) => onChange(e.target.value as Occasion)}
        className={selectClass}
      >
        {OCCASION_KEYS.map((key) => (
          <option key={key} value={key}>
            {OCCASIONS[key].label}
          </option>
        ))}
      </select>
    </div>
  );
}

/** "Send anonymously" checkbox: keeps the sender's name off everything the recipient sees. */
export function AnonymousField({
  checked,
  onChange,
  noun,
}: {
  checked: boolean;
  onChange: (anonymous: boolean) => void;
  noun: "card" | "song";
}) {
  const hintId = useId();
  return (
    <div className="rounded-md border border-ink/15 bg-white p-4">
      <label className="flex cursor-pointer items-start gap-3 font-medium">
        <input
          type="checkbox"
          name="anonymous"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          aria-describedby={hintId}
          className="mt-1 size-5 shrink-0 accent-ink"
        />
        Send anonymously
      </label>
      <p id={hintId} className="mt-1 pl-8 text-sm text-ink-muted">
        {checked
          ? `Your name won’t appear on the ${noun} or its gift page. We only use it for your order.`
          : `Keep your name off the ${noun} and its gift page, so they have to guess who sent it.`}
      </p>
    </div>
  );
}
