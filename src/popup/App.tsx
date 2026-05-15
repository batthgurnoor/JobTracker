import { useEffect, useState } from "react";
import type { User } from "firebase/auth";
import { onAuthStateChanged } from "firebase/auth";
import { getAuthInstance, isFirebaseConfigured } from "../lib/firebase";
import { JobPanel } from "./components/JobPanel";
import { SignInForm } from "./components/SignInForm";

const shell =
  "min-w-[22rem] max-w-md rounded-xl border border-slate-200/90 bg-white p-4 shadow-lg shadow-slate-900/[0.06] ring-1 ring-slate-900/[0.04]";

function App() {
  const [firebaseReady] = useState(() => isFirebaseConfigured());
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(firebaseReady);

  useEffect(() => {
    if (!firebaseReady) {
      return;
    }

    const auth = getAuthInstance();
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, [firebaseReady]);

  if (!firebaseReady) {
    return (
      <main className={shell}>
        <h1 className="mb-3 text-xl font-semibold tracking-tight text-slate-900">Job Tracker</h1>
        <p className="rounded-lg bg-amber-50 px-2 py-2 text-sm leading-relaxed text-amber-950 ring-1 ring-amber-900/10">
          Firebase is not configured yet. Copy <code className="font-mono text-xs">.env.example</code> to{" "}
          <code className="font-mono text-xs">.env</code>, add your Firebase web app keys, then run{" "}
          <code className="font-mono text-xs">npm run build</code> again before loading the extension.
        </p>
      </main>
    );
  }

  if (authLoading) {
    return (
      <main className={shell}>
        <h1 className="mb-2 text-xl font-semibold tracking-tight text-slate-900">Job Tracker</h1>
        <p className="text-sm text-slate-600">Checking your sign-in…</p>
      </main>
    );
  }

  return (
    <main className={shell}>
      <h1 className="mb-3 text-xl font-semibold tracking-tight text-slate-900">Job Tracker</h1>
      {user ? <JobPanel user={user} /> : <SignInForm />}
    </main>
  );
}

export default App;
