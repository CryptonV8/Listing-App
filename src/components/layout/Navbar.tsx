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
          React Listings
        </Link>

        <nav className="flex flex-wrap items-center gap-4 text-sm font-medium">
          <NavLink className={navLinkClass} to="/" end>
            Home
          </NavLink>
          <NavLink className={navLinkClass} to="/listings">
            Browse
          </NavLink>

          {isAuthenticated ? (
            <>
              <NavLink className={navLinkClass} to="/my-listings">
                My Listings
              </NavLink>
              <NavLink className={navLinkClass} to="/dashboard/create">
                Create
              </NavLink>
              <button
                className="rounded border border-zinc-300 px-3 py-1 text-xs text-zinc-700 hover:bg-zinc-100"
                type="button"
                onClick={() => {
                  void logout();
                }}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink className={navLinkClass} to="/login">
                Login
              </NavLink>
              <NavLink className={navLinkClass} to="/register">
                Register
              </NavLink>
            </>
          )}
        </nav>
      </div>

      {isAuthenticated && user ? (
        <p className="mt-3 text-xs text-zinc-500">
          Signed in as {user.name ? `${user.name} · ` : ""}
          {user.email}
        </p>
      ) : null}
    </header>
  );
}
