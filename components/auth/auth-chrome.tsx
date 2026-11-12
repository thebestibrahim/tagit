"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react";
import { Wordmark } from "@/components/ui/Wordmark";
import s from "./auth.module.css";

/**
 * The shell shared by the brand auth pages (register, login, forgot and reset
 * password): the dark room on the left and the paper the form sits on.
 */

export { s as authStyles };

export function AuthShell({
  room,
  caption,
  backHref = "/",
  backLabel = "Back to site",
  aside,
  wide,
  children,
}: {
  /** What stands in the room: the live certificate, or the seal. */
  room: React.ReactNode;
  /** One line under it, set in the display face. */
  caption: string;
  backHref?: string;
  backLabel?: string;
  /** The top-right of the paper, for the other way in ("Already approved? Sign in"). */
  aside?: React.ReactNode;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={s.shell}>
      <aside className={s.room}>
        <div className={s.roomInner}>
          <Link
            href="/"
            aria-label="Tagit home"
            style={{ alignSelf: "flex-start" }}
          >
            <Wordmark height={26} withIcon />
          </Link>
          <div className={s.roomStage}>{room}</div>
          <p className={s.roomCaption}>{caption}</p>
          <p className={s.roomFoot}>
            © {new Date().getFullYear()} Tagit. Identity for luxury goods.
          </p>
        </div>
      </aside>

      <main className={s.paper}>
        <div className={s.topbar}>
          <Link href="/" className={s.mobileMark} aria-label="Tagit home">
            <Wordmark height={22} withIcon />
          </Link>
          <Link href={backHref} className={`${s.topLink} ${s.backLink}`}>
            {backLabel}
          </Link>
          {aside && (
            <p className={s.topAside} style={{ margin: 0 }}>
              {aside}
            </p>
          )}
        </div>

        <div className={`${s.content} ${wide ? s.contentWide : ""}`}>
          {children}
        </div>
      </main>
    </div>
  );
}

/** A named group of fields. */
export function FieldGroup({
  legend,
  sub,
  children,
  ...rest
}: {
  legend: string;
  sub?: boolean;
  children: React.ReactNode;
} & React.FieldsetHTMLAttributes<HTMLFieldSetElement>) {
  return (
    <fieldset className={s.group} {...rest}>
      <legend className={sub ? `${s.label} ${s.subLegend}` : s.legend}>
        {legend}
      </legend>
      <div className={s.groupBody} style={sub ? { gap: 10 } : undefined}>
        {children}
      </div>
    </fieldset>
  );
}

export function AuthTitle({ children }: { children: React.ReactNode }) {
  return <h1 className={s.title}>{children}</h1>;
}

export function AuthLead({ children }: { children: React.ReactNode }) {
  return <p className={s.lead}>{children}</p>;
}

export function FormError({ children }: { children: React.ReactNode }) {
  if (!children) return null;
  return (
    <p role="alert" className={s.formError}>
      <AlertCircle size={16} aria-hidden />
      <span>{children}</span>
    </p>
  );
}

type InputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "id"> & {
  label: string;
  optional?: boolean;
  hint?: React.ReactNode;
  error?: string;
  /** Something to sit on the label's line, at the far end (e.g. "Forgot password?"). */
  labelAside?: React.ReactNode;
};

export function Field({
  label,
  optional,
  hint,
  error,
  labelAside,
  type = "text",
  className,
  ...rest
}: InputProps) {
  const id = useId();
  const [shown, setShown] = useState(false);
  const isPassword = type === "password";
  const describedBy =
    [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") ||
    undefined;

  return (
    <div className={s.field}>
      <div className={s.labelRow}>
        <label htmlFor={id} className={s.label}>
          {label}
          {optional && <span className={s.optional}> (optional)</span>}
        </label>
        {labelAside}
      </div>
      <div className={s.inputWrap}>
        <input
          id={id}
          type={isPassword && shown ? "text" : type}
          className={`${s.input} ${isPassword ? s.inputWithToggle : ""} ${className ?? ""}`}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          {...rest}
        />
        {isPassword && (
          <button
            type="button"
            className={s.reveal}
            onClick={() => setShown((v) => !v)}
            aria-label={shown ? "Hide password" : "Show password"}
            aria-pressed={shown}
          >
            {shown ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        )}
      </div>
      {hint && !error && (
        <p id={`${id}-hint`} className={s.hint}>
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className={s.fieldError}>
          {error}
        </p>
      )}
    </div>
  );
}

export function SubmitButton({
  loading,
  loadingLabel,
  disabled,
  children,
}: {
  loading: boolean;
  loadingLabel: string;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="submit"
      className={s.button}
      disabled={loading || disabled}
      aria-busy={loading || undefined}
    >
      {loading && <Loader2 size={16} className={s.spin} aria-hidden />}
      {loading ? loadingLabel : children}
    </button>
  );
}
