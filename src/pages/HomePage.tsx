import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ListingCard from "../components/listings/ListingCard";
import { fetchLatestListings } from "../lib/listings";
import type { Listing } from "../types/listing";

export default function HomePage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function loadLatest() {
      setIsLoading(true);
      const result = await fetchLatestListings(6);
      if (ignore) {
        return;
      }

      setListings(result.data);
      setError(result.error);
      setIsLoading(false);
    }

    void loadLatest();

    return () => {
      ignore = true;
    };
  }, []);

  return (
    <section className="space-y-8">
      <div className="space-y-4 rounded-3xl border border-zinc-200 bg-[radial-gradient(circle_at_20%_20%,#fef3c7_0%,#fff_45%,#e0f2fe_100%)] p-6 shadow-sm">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Welcome to Listings. Find your next place.</h1>
        <p className="max-w-2xl text-sm text-zinc-700">
          Browse the newest community listings or sign in to publish your own.
        </p>
        <Link className="inline-block rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white" to="/listings">
          Explore Listings
        </Link>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight">Latest Listings</h2>
          <Link className="text-sm font-medium underline" to="/listings">
            View all
          </Link>
        </div>

        {isLoading ? <p className="text-sm text-zinc-600">Loading latest listings...</p> : null}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        {!isLoading && !error ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
