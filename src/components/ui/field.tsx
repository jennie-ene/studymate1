"use client";

import { forwardRef, useId, useState } from "react";
import { CircleAlert, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

const control =
  "block w-full rounded-lg border bg-white px-3 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 " +
  "transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 " +
  "disabled:bg-slate-50 disabled:text-slate-500";

function stateClass(error?: string | null) {
  return error ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500/20" : "border-slate-300 hover:border-slate-400";
}

interface FieldShellProps {
  id: string;
  label: string;
  hint?: string;
  error?: string | null;
  optional?: boolean;
  hideLabel?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function FieldShell({ id, label, hint, error, optional, hideLabel, children, className }: FieldShellProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={id} className={cn("block text-sm font-medium text-slate-700", hideLabel && "sr-only")}>
        {label}
        {optional && <span className="ml-1 font-normal text-slate-400">(optional)</span>}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="flex items-start gap-1.5 text-sm text-rose-600">
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-sm text-slate-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

function describedBy(id: string, error?: string | null, hint?: string) {
  return error ? `${id}-error` : hint ? `${id}-hint` : undefined;
}

type InputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "id"> & {
  label: string;
  hint?: string;
  error?: string | null;
  optional?: boolean;
  hideLabel?: boolean;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  wrapperClassName?: string;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, optional, hideLabel, leading, trailing, className, wrapperClassName, ...props },
  ref,
) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} optional={optional} hideLabel={hideLabel} className={wrapperClassName}>
      <div className="relative">
        {leading && <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">{leading}</span>}
        <input
          ref={ref}
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, error, hint)}
          className={cn(control, "h-10", stateClass(error), !!leading && "pl-9", !!trailing && "pr-10", className)}
          {...props}
        />
        {trailing && <span className="absolute inset-y-0 right-1 flex items-center">{trailing}</span>}
      </div>
    </FieldShell>
  );
});

export const PasswordInput = forwardRef<HTMLInputElement, Omit<InputProps, "type" | "trailing">>(function PasswordInput(props, ref) {
  const [visible, setVisible] = useState(false);
  return (
    <Input
      ref={ref}
      type={visible ? "text" : "password"}
      {...props}
      trailing={
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-700"
        >
          {visible ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
        </button>
      }
    />
  );
});

type TextareaProps = Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "id"> & {
  label: string;
  hint?: string;
  error?: string | null;
  optional?: boolean;
  hideLabel?: boolean;
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, hint, error, optional, hideLabel, className, ...props },
  ref,
) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} optional={optional} hideLabel={hideLabel}>
      <textarea
        ref={ref}
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, hint)}
        className={cn(control, "py-2.5 leading-relaxed", stateClass(error), className)}
        {...props}
      />
    </FieldShell>
  );
});

type SelectProps = Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "id"> & {
  label: string;
  hint?: string;
  error?: string | null;
  optional?: boolean;
  hideLabel?: boolean;
  wrapperClassName?: string;
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, hint, error, optional, hideLabel, className, wrapperClassName, children, ...props },
  ref,
) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} optional={optional} hideLabel={hideLabel} className={wrapperClassName}>
      <select
        ref={ref}
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, hint)}
        className={cn(control, "h-10 pr-8", stateClass(error), className)}
        {...props}
      >
        {children}
      </select>
    </FieldShell>
  );
});

/** Accessible segmented control (radio group) used for priority, status and view toggles. */
export function Segmented<T extends string>({
  label,
  value,
  onChange,
  options,
  hideLabel,
  size = "md",
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; icon?: React.ReactNode }[];
  hideLabel?: boolean;
  size?: "sm" | "md";
}) {
  const id = useId();
  return (
    <div className="space-y-1.5">
      <span id={id} className={cn("block text-sm font-medium text-slate-700", hideLabel && "sr-only")}>
        {label}
      </span>
      <div role="radiogroup" aria-labelledby={id} className="inline-flex w-full rounded-lg bg-slate-100 p-1 sm:w-auto">
        {options.map((o) => {
          const active = o.value === value;
          return (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(o.value)}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 font-medium transition-colors sm:flex-none",
                size === "sm" ? "h-7 text-xs" : "h-8 text-sm",
                active ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900",
              )}
            >
              {o.icon}
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
