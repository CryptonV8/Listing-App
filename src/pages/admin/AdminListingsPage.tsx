import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { adminDeleteListingWithAssets, fetchAdminListings, type AdminListing } from "../../lib/admin";

export default function AdminListingsPage() {
  const [listings, setListings] = useState<AdminListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function loadListings() {
    setIsLoading(true);
    const result = await fetchAdminListings();
    setListings(result.data);
    setError(result.error);
    setIsLoading(false);
  }

  useEffect(() => {
    void loadListings();
  }, []);

  async function handleDelete(listingId: string) {
    const isConfirmed = window.confirm("Сигурен ли си, че искаш да изтриеш тази оферта?");
    if (!isConfirmed) {
      return;
    }

    setDeletingId(listingId);
    setError(null);

    const result = await adminDeleteListingWithAssets(listingId);
    if (result.error) {
      setError(result.error);
      setDeletingId(null);
      return;
    }

    await loadListings();
    setDeletingId(null);
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Админ: Оферти</h1>
        <Link className="text-sm font-medium underline" to="/admin">
          Обратно към админ панела
        </Link>
      </div>

      {isLoading ? <p className="text-sm text-zinc-600">Зареждане на офертите...</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {!isLoading && !error ? (
        <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-2 py-2">Заглавие</th>
                <th className="px-2 py-2">Цена</th>
                <th className="px-2 py-2">Локация</th>
                <th className="px-2 py-2">Собственик</th>
                <th className="px-2 py-2">Дата</th>
                <th className="px-2 py-2">Действия</th>
              </tr>
            </thead>
            <tbody>
              {listings.map((listing) => (
                <tr key={listing.id} className="border-t border-zinc-100">
                  <td className="px-2 py-2">{listing.title}</td>
                  <td className="px-2 py-2">{listing.price.toLocaleString("bg-BG")} лв.</td>
                  <td className="px-2 py-2">{listing.location}</td>
                  <td className="px-2 py-2">{listing.ownerName || listing.ownerEmail}</td>
                  <td className="px-2 py-2">{new Date(listing.createdAt).toLocaleDateString("bg-BG")}</td>
                  <td className="px-2 py-2">
                    <div className="flex items-center gap-3">
                      <Link className="underline" to={`/listing/${listing.id}`}>
                        Преглед
                      </Link>
                      <Link className="underline" to={`/dashboard/edit/${listing.id}`}>
                        Редакция
                      </Link>
                      <button
                        className="font-medium text-red-700 underline disabled:opacity-50"
                        type="button"
                        onClick={() => {
                          void handleDelete(listing.id);
                        }}
                        disabled={deletingId === listing.id}
                      >
                        {deletingId === listing.id ? "Изтриване..." : "Изтриване"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
