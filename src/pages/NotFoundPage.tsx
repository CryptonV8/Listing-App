import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <section className="mx-auto mt-12 max-w-md space-y-3 text-center">
      <h1 className="text-3xl font-semibold tracking-tight">404</h1>
      <p className="text-sm text-zinc-600">Страницата, която търсиш, не съществува.</p>
      <Link className="text-sm font-medium underline" to="/">
        Обратно към началото
      </Link>
    </section>
  );
}