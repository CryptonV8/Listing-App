import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

type LocationState = {
  from?: string;
};

export default function LoginPage() {
  const [email, setEmail] = useState("steve@gmail.com");
  const [password, setPassword] = useState("pass123");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState | null;

  const redirectTo = state?.from ?? "/my-listings";

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const result = await login(email, password);
    if (result.error) {
      setError(result.error);
      setIsSubmitting(false);
      return;
    }

    navigate(redirectTo, { replace: true });
  };

  return (
    <section className="mx-auto max-w-md space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Login</h1>
      <form className="space-y-3 rounded border border-zinc-200 bg-white p-4" onSubmit={handleSubmit}>
        <label className="space-y-1 text-sm" htmlFor="login-email">
          <span className="text-zinc-600">Email</span>
          <input
            className="w-full rounded border border-zinc-300 px-3 py-2 outline-none ring-zinc-900 focus:ring"
            id="login-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>

        <label className="space-y-1 text-sm" htmlFor="login-password">
          <span className="text-zinc-600">Password</span>
          <input
            className="w-full rounded border border-zinc-300 px-3 py-2 outline-none ring-zinc-900 focus:ring"
            id="login-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <button
          className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Signing in..." : "Continue"}
        </button>
      </form>

      <p className="text-sm text-zinc-600">
        No account yet? <Link className="underline" to="/register">Register</Link>
      </p>
    </section>
  );
}
