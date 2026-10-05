"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { PasswordStrength } from "@/components/ui/PasswordStrength";
import { GoogleButton } from "@/components/ui/GoogleButton";

export default function RegisterPage() {
  const [naam, setNaam] = useState("");
  const [email, setEmail] = useState("");
  const [wachtwoord, setWachtwoord] = useState("");
  const [bevestiging, setBevestiging] = useState("");
  const [akkoord, setAkkoord] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!naam || !email || !wachtwoord || !bevestiging) {
      setError("Vul alle velden in.");
      return;
    }
    if (wachtwoord.length < 8) {
      setError("Wachtwoord moet minimaal 8 tekens zijn.");
      return;
    }
    if (wachtwoord !== bevestiging) {
      setError("Wachtwoorden komen niet overeen.");
      return;
    }
    if (!akkoord) {
      setError("Ga akkoord met de voorwaarden om door te gaan.");
      return;
    }

    setLoading(true);
    // TODO: vervangen door supabase.auth.signUp({ email, password: wachtwoord, options: { data: { full_name: naam } } })
    await new Promise((r) => setTimeout(r, 900));
    console.log("registreren (stub)", { naam, email, wachtwoord });
    setLoading(false);
  }

  async function handleGoogle() {
    setGoogleLoading(true);
    // TODO: vervangen door supabase.auth.signInWithOAuth({ provider: "google" })
    await new Promise((r) => setTimeout(r, 900));
    console.log("google registreren (stub)");
    setGoogleLoading(false);
  }

  return (
    <div>
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
        Maak je account aan
      </h2>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Gratis, geen creditcard nodig. In 1 minuut je eerste auto toegevoegd.
      </p>

      <div className="mt-7">
        <GoogleButton label="Registreren met Google" onClick={handleGoogle} loading={googleLoading} />
      </div>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs font-medium text-muted-foreground">of met e-mail</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <label htmlFor="naam" className="mb-1.5 block text-sm font-medium text-foreground">
            Volledige naam
          </label>
          <input
            id="naam"
            type="text"
            autoComplete="name"
            value={naam}
            onChange={(e) => setNaam(e.target.value)}
            placeholder="Morad Ziuan"
            className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-500/15"
          />
        </div>

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
          <label htmlFor="wachtwoord" className="mb-1.5 block text-sm font-medium text-foreground">
            Wachtwoord
          </label>
          <PasswordInput
            id="wachtwoord"
            autoComplete="new-password"
            value={wachtwoord}
            onChange={(e) => setWachtwoord(e.target.value)}
            placeholder="Minimaal 8 tekens"
          />
          <PasswordStrength wachtwoord={wachtwoord} />
        </div>

        <div>
          <label htmlFor="bevestiging" className="mb-1.5 block text-sm font-medium text-foreground">
            Bevestig wachtwoord
          </label>
          <PasswordInput
            id="bevestiging"
            autoComplete="new-password"
            value={bevestiging}
            onChange={(e) => setBevestiging(e.target.value)}
            placeholder="••••••••"
          />
        </div>

        <label className="flex select-none items-start gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={akkoord}
            onChange={(e) => setAkkoord(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-border text-primary-500 focus:ring-primary-500/30"
          />
          <span>
            Ik ga akkoord met de{" "}
            <Link href="/voorwaarden" className="font-medium text-primary-500 hover:text-primary-600">
              voorwaarden
            </Link>{" "}
            en het{" "}
            <Link href="/privacy" className="font-medium text-primary-500 hover:text-primary-600">
              privacybeleid
            </Link>
            .
          </span>
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
          Account aanmaken
        </button>
      </form>

      <p className="mt-7 text-center text-sm text-muted-foreground">
        Heb je al een account?{" "}
        <Link href="/inloggen" className="font-medium text-primary-500 hover:text-primary-600">
          Log in
        </Link>
      </p>
    </div>
  );
}
