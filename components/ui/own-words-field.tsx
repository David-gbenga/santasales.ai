"use client";

import { useId } from "react";

export type Idea = { label: string; text: string };

type OwnWordsFieldProps = {
  name: string;
  label: string;
  hint: string;
  placeholder: string;
  ideas: readonly Idea[];
  max: number;
  value: string;
  onChange: (value: string) => void;
};

const fieldClass =
  "mt-2 block w-full rounded-md border border-ink/25 bg-white px-4 py-3 text-base text-ink placeholder:text-ink-muted/70 focus-visible:border-ink";

/**
 * Free-text "describe it in your own words" box with tap-to-add idea chips.
 * Used by the card and lyrics forms.
 */
export function OwnWordsField({
  name,
  label,
  hint,
  placeholder,
  ideas,
  max,
  value,
  onChange,
}: OwnWordsFieldProps) {
  const id = useId();
  const hintId = useId();

  function addIdea(text: string) {
    const joined = value.trim() ? `${value.trim()} ${text}` : text;
    onChange(joined.slice(0, max));
    document.getElementById(id)?.focus();
  }

  return (
    <div>
      <label htmlFor={id} className="block font-medium">
        {label} <span className="font-normal text-ink-muted">(optional, but it helps)</span>
      </label>
      <p id={hintId} className="mt-1 text-sm text-ink-muted">
        {hint}
      </p>
      <textarea
        id={id}
        name={name}
        rows={5}
        maxLength={max}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-describedby={hintId}
        placeholder={placeholder}
        className={fieldClass}
      />
      <div className="mt-2 flex flex-wrap items-start justify-between gap-2">
        <div role="group" aria-label="Ideas to add" className="flex flex-wrap gap-2">
          {ideas.map((idea) => (
            <button
              key={idea.label}
              type="button"
              onClick={() => addIdea(idea.text)}
              className="min-h-9 rounded-full border border-ink/25 bg-white px-3 text-sm font-medium text-ink transition-colors hover:border-ink"
            >
              + {idea.label}
            </button>
          ))}
        </div>
        <p className="shrink-0 text-sm tabular-nums text-ink-muted">
          {value.length}/{max}
        </p>
      </div>
    </div>
  );
}
