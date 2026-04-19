import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchAdminDashboardData, type AdminListing } from "../../lib/admin";

type DashboardData = {
  usersCount: number;
  listingsCount: number;
  photosCount: number;
  recentListings: AdminListing[];
};

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function load() {
      setIsLoading(true);
      const result = await fetchAdminDashboardData();
      if (ignore) {
        return;
      }

      setData(result.data);
      setError(result.error);
      setIsLoading(false);
    }

    void load();

    return () => {
      ignore = true;
    };
  }, []);

  return (
    <section className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Админ панел</h1>
        <div className="flex items-center gap-3 text-sm font-medium">
          <Link className="underline" to="/admin/listings">
            Управление на оферти
          </Link>
          <Link className="underline" to="/admin/users">
            Потребители
          </Link>
        </div>
      </div>

      {isLoading ? <p className="text-sm text-zinc-600">Зареждане на административните данни...</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {!isLoading && !error && data ? (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <article className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
              <p className="text-xs text-zinc-500">Общо потребители</p>
              <p className="mt-2 text-2xl font-semibold">{data.usersCount}</p>
            </article>
            <article className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
              <p className="text-xs text-zinc-500">Общо оферти</p>
              <p className="mt-2 text-2xl font-semibold">{data.listingsCount}</p>
            </article>
            <article className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
              <p className="text-xs text-zinc-500">Общо снимки</p>
              <p className="mt-2 text-2xl font-semibold">{data.photosCount}</p>
            </article>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Последни оферти</h2>
              <Link className="text-sm font-medium underline" to="/admin/listings">
                Виж всички
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="text-xs uppercase tracking-wide text-zinc-500">
                  <tr>
                    <th className="px-2 py-2">Заглавие</th>
                    <th className="px-2 py-2">Собственик</th>
                    <th className="px-2 py-2">Цена</th>
                    <th className="px-2 py-2">Локация</th>
                    <th className="px-2 py-2">Дата</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentListings.map((listing) => (
                    <tr key={listing.id} className="border-t border-zinc-100">
                      <td className="px-2 py-2">{listing.title}</td>
                      <td className="px-2 py-2">{listing.ownerName || listing.ownerEmail}</td>
                      <td className="px-2 py-2">{listing.price.toLocaleString("bg-BG")} лв.</td>
                      <td className="px-2 py-2">{listing.location}</td>
                      <td className="px-2 py-2">{new Date(listing.createdAt).toLocaleString("bg-BG")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}
    </section>
  );
}
