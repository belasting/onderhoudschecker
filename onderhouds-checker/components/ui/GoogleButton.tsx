"use client";

type Props = {
  onClick?: () => void;
  label: string;
  loading?: boolean;
};

export function GoogleButton({ onClick, label, loading }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="flex w-full items-center justify-center gap-2.5 rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm font-medium text-foreground transition hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-60"
    >
      <svg viewBox="0 0 24 24" className="h-4.5 w-4.5">
        <path
          fill="#4285F4"
          d="M23.5 12.27c0-.82-.07-1.6-.2-2.36H12v4.47h6.46c-.28 1.5-1.13 2.77-2.4 3.62v3h3.88c2.27-2.09 3.56-5.17 3.56-8.73Z"
        />
        <path
          fill="#34A853"
          d="M12 24c3.24 0 5.96-1.07 7.94-2.9l-3.88-3c-1.08.72-2.45 1.15-4.06 1.15-3.13 0-5.78-2.11-6.73-4.96H1.27v3.1A12 12 0 0 0 12 24Z"
        />
        <path
          fill="#FBBC05"
          d="M5.27 14.29a7.2 7.2 0 0 1 0-4.58v-3.1H1.27a12 12 0 0 0 0 10.78l4-3.1Z"
        />
        <path
          fill="#EA4335"
          d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.69 1.27 6.6l4 3.1c.95-2.85 3.6-4.95 6.73-4.95Z"
        />
      </svg>
      {label}
    </button>
  );
}
