import { useEffect, useState } from "react";
import ListingCard from "../components/listings/ListingCard";
import { fetchListingsPage } from "../lib/listings";
import type { Listing } from "../types/listing";

const PAGE_SIZE = 6;

export default function BrowseListingsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [listings, setListings] = useState<Listing[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const pageCount = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);

  useEffect(() => {
    let ignore = false;

    async function loadListings() {
      setIsLoading(true);
      const result = await fetchListingsPage({
        page: currentPage,
        pageSize: PAGE_SIZE,
        search: searchQuery,
      });

      if (ignore) {
        return;
      }

      setListings(result.data);
      setTotalCount(result.count);
      setError(result.error);
      setIsLoading(false);
    }

    void loadListings();

    return () => {
      ignore = true;
    };
  }, [currentPage, searchQuery]);

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Разгледай офертите</h1>
          <p className="text-sm text-zinc-600">Търси и разглеждай налични имоти за продажба и наем.</p>
        </div>

        <label className="w-full max-w-sm space-y-1 text-sm" htmlFor="listing-search">
          <span className="text-zinc-600">Търсене</span>
          <input
            className="w-full rounded border border-zinc-300 bg-white px-3 py-2 outline-none ring-zinc-900 focus:ring"
            id="listing-search"
            placeholder="Търси по заглавие, квартал, град или област"
            value={searchQuery}
            onChange={(event) => {
              setSearchQuery(event.target.value);
              setPage(1);
            }}
          />
        </label>
      </div>

      {isLoading ? <p className="text-sm text-zinc-600">Зареждане на офертите...</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {!isLoading && !error && listings.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      ) : null}

      {!isLoading && !error && listings.length === 0 ? (
        <p className="rounded border border-dashed border-zinc-300 bg-white p-4 text-sm text-zinc-600">
          Няма намерени оферти за търсените критерии.
        </p>
      ) : null}

      <div className="flex items-center justify-between text-sm">
        <p className="text-zinc-600">
          Страница {currentPage} от {pageCount}
        </p>
        <div className="flex gap-2">
          <button
            className="rounded border border-zinc-300 bg-white px-3 py-1 disabled:cursor-not-allowed disabled:opacity-50"
            type="button"
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Назад
          </button>
          <button
            className="rounded border border-zinc-300 bg-white px-3 py-1 disabled:cursor-not-allowed disabled:opacity-50"
            type="button"
            onClick={() => setPage((prev) => Math.min(pageCount, prev + 1))}
            disabled={currentPage === pageCount}
          >
            Напред
          </button>
        </div>
      </div>
    </section>
  );
}
