"use client";

import { useState, forwardRef, type InputHTMLAttributes } from "react";

type Props = InputHTMLAttributes<HTMLInputElement>;

export const PasswordInput = forwardRef<HTMLInputElement, Props>(
  function PasswordInput(props, ref) {
    const [visible, setVisible] = useState(false);

    return (
      <div className="relative">
        <input
          {...props}
          ref={ref}
          type={visible ? "text" : "password"}
          className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 pr-11 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-500/15"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          tabIndex={-1}
          aria-label={visible ? "Wachtwoord verbergen" : "Wachtwoord tonen"}
          className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground hover:text-foreground"
        >
          {visible ? (
            <svg viewBox="0 0 24 24" fill="none" className="h-4.5 w-4.5">
              <path
                d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.3 5.3A10.7 10.7 0 0 1 12 5c5 0 9 4 10 7-.4 1.1-1.1 2.3-2.1 3.4M6.6 6.7C4.6 8 3.2 9.9 2 12c1 3 5 7 10 7 1.2 0 2.4-.2 3.4-.6"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" className="h-4.5 w-4.5">
              <path
                d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7Z"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.75" />
            </svg>
          )}
        </button>
      </div>
    );
  }
);
