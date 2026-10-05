"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { GoogleButton } from "@/components/ui/GoogleButton";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [wachtwoord, setWachtwoord] = useState("");
  const [onthoudMij, setOnthoudMij] = useState(true);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email || !wachtwoord) {
      setError("Vul je e-mailadres en wachtwoord in.");
      return;
    }

    setLoading(true);
    // TODO: vervangen door supabase.auth.signInWithPassword({ email, password: wachtwoord })
    await new Promise((r) => setTimeout(r, 900));
    console.log("login (stub)", { email, wachtwoord, onthoudMij });
    setLoading(false);
  }

  async function handleGoogle() {
    setGoogleLoading(true);
    // TODO: vervangen door supabase.auth.signInWithOAuth({ provider: "google" })
    await new Promise((r) => setTimeout(r, 900));
    console.log("google login (stub)");
    setGoogleLoading(false);
  }

  return (
    <div>
      {/* Logo alleen zichtbaar op mobiel — desktop heeft het linkerpaneel */}
      <div className="mb-8 flex items-center gap-2 lg:hidden">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-500 text-white">
          <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
            <path
              d="M4 15h16M6 15l1.2-5.2A2 2 0 0 1 9.14 8.3h5.72a2 2 0 0 1 1.94 1.5L18 15M7 18.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm10 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Z"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <span className="text-lg font-semibold tracking-tight">OnderhoudChecker</span>
      </div>

      <h2 className="text-2xl font-semibold tracking-tight text-foreground">
        Welkom terug
      </h2>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Log in om je auto&apos;s en onderhoud te beheren.
      </p>

      <div className="mt-7">
        <GoogleButton label="Doorgaan met Google" onClick={handleGoogle} loading={googleLoading} />
      </div>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs font-medium text-muted-foreground">of met e-mail</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-foreground">
            E-mailadres
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="jij@voorbeeld.nl"
            className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-500/15"
          />
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor="wachtwoord" className="block text-sm font-medium text-foreground">
              Wachtwoord
            </label>
            <Link
              href="/wachtwoord-vergeten"
              className="text-sm font-medium text-primary-500 hover:text-primary-600"
            >
              Vergeten?
            </Link>
          </div>
          <PasswordInput
            id="wachtwoord"
            autoComplete="current-password"
            value={wachtwoord}
            onChange={(e) => setWachtwoord(e.target.value)}
            placeholder="••••••••"
          />
        </div>

        <label className="flex select-none items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={onthoudMij}
            onChange={(e) => setOnthoudMij(e.target.checked)}
            className="h-4 w-4 rounded border-border text-primary-500 focus:ring-primary-500/30"
          />
          Onthoud mij op dit apparaat
        </label>

        {error && (
          <p className="rounded-lg bg-danger-500/10 px-3.5 py-2.5 text-sm text-danger-500">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-500 px-3.5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading && (
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 animate-spin">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" className="opacity-25" />
              <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </svg>
          )}
          Inloggen
        </button>
      </form>

      <p className="mt-7 text-center text-sm text-muted-foreground">
        Nog geen account?{" "}
        <Link href="/registreren" className="font-medium text-primary-500 hover:text-primary-600">
          Maak er gratis een aan
        </Link>
      </p>
    </div>
  );
}
