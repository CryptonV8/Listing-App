import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `transition-colors ${isActive ? "text-black" : "text-zinc-500 hover:text-zinc-900"}`;

export default function Navbar() {
  const { isAuthenticated, logout, user } = useAuth();

  return (
    <header className="mb-8 rounded-2xl border border-zinc-200 bg-white/80 p-4 shadow-sm backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link className="text-lg font-bold tracking-tight" to="/">
          imotbg.org
        </Link>

        <nav className="flex flex-wrap items-center gap-4 text-sm font-medium">
          <NavLink className={navLinkClass} to="/" end>
            Начало
          </NavLink>
          <NavLink className={navLinkClass} to="/listings">
            Разгледай
          </NavLink>

          {isAuthenticated ? (
            <>
              <NavLink className={navLinkClass} to="/my-listings">
                Моите оферти
              </NavLink>
              <NavLink className={navLinkClass} to="/dashboard/create">
                Добави оферта
              </NavLink>
              <button
                className="rounded border border-zinc-300 px-3 py-1 text-xs text-zinc-700 hover:bg-zinc-100"
                type="button"
                onClick={() => {
                  void logout();
                }}
              >
                Изход
              </button>
            </>
          ) : (
            <>
              <NavLink className={navLinkClass} to="/login">
                Вход
              </NavLink>
              <NavLink className={navLinkClass} to="/register">
                Регистрация
              </NavLink>
            </>
          )}
        </nav>
      </div>

      {isAuthenticated && user ? (
        <p className="mt-3 text-xs text-zinc-500">
          Влязъл като {user.name ? `${user.name} · ` : ""}
          {user.email}
        </p>
      ) : null}
    </header>
  );
}
