import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchListingDetails } from "../lib/listings";
import type { ListingDetails } from "../types/listing";

const fallbackImage =
  "https://images.unsplash.com/photo-1523217582562-09d0def993a6?auto=format&fit=crop&w=1200&q=80";

export default function ListingDetailsPage() {
  const { id } = useParams();
  const [listing, setListing] = useState<ListingDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const listingId = id;

    if (!listingId) {
      setError("Listing not found.");
      setIsLoading(false);
      return;
    }

    let ignore = false;

    async function load() {
      setIsLoading(true);
      const result = await fetchListingDetails(listingId);
      if (ignore) {
        return;
      }

      setListing(result.data);
      setError(result.error);
      setIsLoading(false);
      setActiveIndex(0);
    }

    void load();

    return () => {
      ignore = true;
    };
  }, [id]);

  const images = useMemo(() => {
    if (!listing || listing.photos.length === 0) {
      return [fallbackImage];
    }

    return listing.photos.map((photo) => photo.imageUrl);
  }, [listing]);

  const currentImage = images[Math.min(activeIndex, images.length - 1)] ?? fallbackImage;

  if (isLoading) {
    return <p className="text-sm text-zinc-600">Loading listing...</p>;
  }

  if (!listing || error) {
    return (
      <section className="space-y-3">
        <h1 className="text-2xl font-semibold tracking-tight">Listing Not Found</h1>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <Link className="text-sm font-medium underline" to="/listings">
          Back to browse
        </Link>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="space-y-3">
        <img className="h-80 w-full rounded-2xl border border-zinc-200 object-cover shadow-sm" src={currentImage} alt={listing.title} />
        {images.length > 1 ? (
          <div className="flex items-center justify-between gap-3">
            <button
              className="rounded border border-zinc-300 bg-white px-3 py-1 text-sm"
              type="button"
              onClick={() => setActiveIndex((prev) => (prev - 1 + images.length) % images.length)}
            >
              Previous photo
            </button>
            <p className="text-xs text-zinc-500">
              Photo {Math.min(activeIndex + 1, images.length)} of {images.length}
            </p>
            <button
              className="rounded border border-zinc-300 bg-white px-3 py-1 text-sm"
              type="button"
              onClick={() => setActiveIndex((prev) => (prev + 1) % images.length)}
            >
              Next photo
            </button>
          </div>
        ) : null}
      </div>

      <div className="space-y-2 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight">{listing.title}</h1>
        <p className="text-sm text-zinc-600">{listing.location}</p>
        <p className="text-lg font-semibold">${listing.price}</p>
        <p className="text-sm text-zinc-700">{listing.description}</p>
        <p className="text-xs text-zinc-500">Created {new Date(listing.createdAt).toLocaleString()}</p>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h2 className="mb-2 text-lg font-semibold">Seller contacts</h2>
        {listing.seller ? (
          <div className="space-y-1 text-sm text-zinc-700">
            <p>Name: {listing.seller.name || "Unknown"}</p>
            <p>Email: {listing.seller.email}</p>
            <p>Phone: {listing.seller.phone ?? "Not provided"}</p>
          </div>
        ) : (
          <p className="text-sm text-zinc-600">Seller profile is not available.</p>
        )}
      </div>
    </section>
  );
}
