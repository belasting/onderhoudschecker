function scoreWachtwoord(pw: string) {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return Math.min(score, 4);
}

const LABELS = ["Erg zwak", "Zwak", "Redelijk", "Sterk", "Erg sterk"];
const COLORS = [
  "bg-danger-500",
  "bg-danger-500",
  "bg-warning-500",
  "bg-success-500",
  "bg-success-500",
];

export function PasswordStrength({ wachtwoord }: { wachtwoord: string }) {
  const score = scoreWachtwoord(wachtwoord);
  if (!wachtwoord) return null;

  return (
    <div className="mt-2">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i < score ? COLORS[score] : "bg-border"
            }`}
          />
        ))}
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{LABELS[score]}</p>
    </div>
  );
}
