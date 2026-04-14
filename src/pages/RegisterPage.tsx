import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RegisterPage() {
  const [name, setName] = useState("New User");
  const [email, setEmail] = useState("newuser@example.com");
  const [password, setPassword] = useState("pass123");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const result = await register(name, email, password);
    if (result.error) {
      setError(result.error);
      setIsSubmitting(false);
      return;
    }

    navigate("/my-listings", { replace: true });
  };

  return (
    <section className="mx-auto max-w-md space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Register</h1>
      <form className="space-y-3 rounded border border-zinc-200 bg-white p-4" onSubmit={handleSubmit}>
        <label className="space-y-1 text-sm" htmlFor="register-name">
          <span className="text-zinc-600">Name</span>
          <input
            className="w-full rounded border border-zinc-300 px-3 py-2 outline-none ring-zinc-900 focus:ring"
            id="register-name"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
        </label>

        <label className="space-y-1 text-sm" htmlFor="register-email">
          <span className="text-zinc-600">Email</span>
          <input
            className="w-full rounded border border-zinc-300 px-3 py-2 outline-none ring-zinc-900 focus:ring"
            id="register-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>

        <label className="space-y-1 text-sm" htmlFor="register-password">
          <span className="text-zinc-600">Password</span>
          <input
            className="w-full rounded border border-zinc-300 px-3 py-2 outline-none ring-zinc-900 focus:ring"
            id="register-password"
            type="password"
            minLength={6}
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
          {isSubmitting ? "Creating account..." : "Create account"}
        </button>
      </form>

      <p className="text-sm text-zinc-600">
        Already have an account? <Link className="underline" to="/login">Login</Link>
      </p>
    </section>
  );
}
