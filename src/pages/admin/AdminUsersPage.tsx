import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchAdminUsers, type AdminUser } from "../../lib/admin";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function loadUsers() {
      setIsLoading(true);
      const result = await fetchAdminUsers();
      if (ignore) {
        return;
      }

      setUsers(result.data);
      setError(result.error);
      setIsLoading(false);
    }

    void loadUsers();

    return () => {
      ignore = true;
    };
  }, []);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Админ: Потребители</h1>
        <Link className="text-sm font-medium underline" to="/admin">
          Обратно към админ панела
        </Link>
      </div>

      {isLoading ? <p className="text-sm text-zinc-600">Зареждане на потребителите...</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {!isLoading && !error ? (
        <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-2 py-2">Име</th>
                <th className="px-2 py-2">Имейл</th>
                <th className="px-2 py-2">Телефон</th>
                <th className="px-2 py-2">Регистриран на</th>
                <th className="px-2 py-2">Роля</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-t border-zinc-100">
                  <td className="px-2 py-2">{user.name || "-"}</td>
                  <td className="px-2 py-2">{user.email}</td>
                  <td className="px-2 py-2">{user.phone || "-"}</td>
                  <td className="px-2 py-2">{new Date(user.createdAt).toLocaleString("bg-BG")}</td>
                  <td className="px-2 py-2">{user.role === "admin" ? "Админ" : "Потребител"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
