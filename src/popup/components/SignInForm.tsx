import { useState, type FormEvent } from "react";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { getAuthInstance } from "../../lib/firebase";
import { formatAuthError } from "../../lib/userFacingErrors";

type AuthMode = "signin" | "signup";

export function SignInForm() {
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [signupLoading, setSignupLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isBusy = loginLoading || signupLoading;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    const auth = getAuthInstance();
    const trimmedEmail = email.trim();

    if (mode === "signin") {
      setLoginLoading(true);
      try {
        await signInWithEmailAndPassword(auth, trimmedEmail, password);
      } catch (err) {
        setError(formatAuthError(err));
      } finally {
        setLoginLoading(false);
      }
      return;
    }

    setSignupLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, trimmedEmail, password);
    } catch (err) {
      setError(formatAuthError(err));
    } finally {
      setSignupLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex rounded-lg border border-slate-200 bg-slate-50/80 p-0.5 text-sm shadow-inner">
        <button
          type="button"
          className={`flex-1 rounded-md px-2 py-1.5 font-medium transition ${
            mode === "signin" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
          }`}
          onClick={() => {
            setMode("signin");
            setError(null);
          }}
          disabled={isBusy}
        >
          Sign in
        </button>
        <button
          type="button"
          className={`flex-1 rounded-md px-2 py-1.5 font-medium transition ${
            mode === "signup" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
          }`}
          onClick={() => {
            setMode("signup");
            setError(null);
          }}
          disabled={isBusy}
        >
          Create account
        </button>
      </div>

      <form className="space-y-2" onSubmit={handleSubmit}>
        <label className="block text-xs font-medium text-slate-600">
          Email
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            required
            disabled={isBusy}
          />
        </label>
        <label className="block text-xs font-medium text-slate-600">
          Password
          <input
            type="password"
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            required
            minLength={6}
            disabled={isBusy}
          />
        </label>

        {error ? (
          <p className="rounded-lg bg-red-50 px-2 py-1.5 text-sm text-red-700" role="alert">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isBusy}
          className="w-full rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {mode === "signin"
            ? loginLoading
              ? "Signing in..."
              : "Sign in"
            : signupLoading
              ? "Creating account..."
              : "Create account"}
        </button>
      </form>
    </div>
  );
}
