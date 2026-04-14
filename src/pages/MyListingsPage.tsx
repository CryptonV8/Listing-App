import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ListingCard from "../components/listings/ListingCard";
import { useAuth } from "../context/AuthContext";
import { fetchListingsPage } from "../lib/listings";
import type { Listing } from "../types/listing";

const PAGE_SIZE = 6;

export default function MyListingsPage() {
  const { user } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const pageCount = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);

  useEffect(() => {
    const currentUser = user;

    if (!currentUser) {
      setIsLoading(false);
      return;
    }

    let ignore = false;

    async function loadListings() {
      setIsLoading(true);
      const result = await fetchListingsPage({
        page: currentPage,
        pageSize: PAGE_SIZE,
        ownerId: currentUser.id,
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
  }, [currentPage, user]);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">My Listings</h1>
        <Link className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white" to="/dashboard/create">
          Add Listing
        </Link>
      </div>

      {isLoading ? <p className="text-sm text-zinc-600">Loading your listings...</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {!isLoading && !error && listings.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              actions={
                <>
                  <Link className="font-medium underline" to={`/dashboard/edit/${listing.id}`}>
                    Edit
                  </Link>
                  <Link className="font-medium text-red-700 underline" to={`/dashboard/delete/${listing.id}`}>
                    Delete
                  </Link>
                </>
              }
            />
          ))}
        </div>
      ) : null}

      {!isLoading && !error && listings.length === 0 ? (
        <p className="rounded border border-dashed border-zinc-300 bg-white p-4 text-sm text-zinc-600">
          You have no listings yet.
        </p>
      ) : null}

      <div className="flex items-center justify-between text-sm">
        <p className="text-zinc-600">
          Page {currentPage} of {pageCount}
        </p>
        <div className="flex gap-2">
          <button
            className="rounded border border-zinc-300 bg-white px-3 py-1 disabled:cursor-not-allowed disabled:opacity-50"
            type="button"
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          <button
            className="rounded border border-zinc-300 bg-white px-3 py-1 disabled:cursor-not-allowed disabled:opacity-50"
            type="button"
            onClick={() => setPage((prev) => Math.min(pageCount, prev + 1))}
            disabled={currentPage === pageCount}
          >
            Next
          </button>
        </div>
      </div>
    </section>
  );
}
