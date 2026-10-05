const PIJLERS = [
  {
    titel: "Nooit meer een boete",
    beschrijving: "Je APK en onderhoud in één overzicht, met tijdige meldingen.",
  },
  {
    titel: "Kenteken erin, klaar",
    beschrijving: "Merk, model en APK-datum worden automatisch opgehaald via RDW.",
  },
  {
    titel: "Bewijs bij verkoop",
    beschrijving: "Volledige onderhoudshistorie als rapport, verhoogt je verkoopprijs.",
  },
];

export function AuthBranding() {
  return (
    <div className="relative hidden h-full flex-col justify-between overflow-hidden bg-linear-to-br from-primary-700 via-primary-600 to-primary-500 p-10 text-white lg:flex">
      {/* subtiele achtergrond-decoratie */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -right-24 h-80 w-80 rounded-full bg-white/10 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-black/10 blur-3xl"
      />

      <div className="relative">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15 backdrop-blur-sm">
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

        <h1 className="mt-16 max-w-md text-3xl font-semibold leading-tight text-balance">
          Hou je auto op orde, zonder eraan te hoeven denken.
        </h1>
        <p className="mt-4 max-w-sm text-sm text-white/75">
          APK, onderhoud en kosten van al je auto&apos;s op één plek — wij
          sturen een seintje voordat het te laat is.
        </p>
      </div>

      <div className="relative space-y-5">
        {PIJLERS.map((pijler) => (
          <div key={pijler.titel} className="flex gap-3">
            <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/15">
              <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5">
                <path
                  d="M5 13l4 4L19 7"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium">{pijler.titel}</p>
              <p className="text-sm text-white/70">{pijler.beschrijving}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
