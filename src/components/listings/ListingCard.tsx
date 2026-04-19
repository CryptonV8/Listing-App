import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import type { Listing } from "../../types/listing";

type ListingCardProps = {
  listing: Listing;
  actions?: ReactNode;
};

const fallbackCover =
  "https://images.unsplash.com/photo-1523217582562-09d0def993a6?auto=format&fit=crop&w=1200&q=80";

export default function ListingCard({ listing, actions }: ListingCardProps) {
  return (
    <article className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <img className="h-44 w-full object-cover" src={listing.coverImageUrl ?? fallbackCover} alt={listing.title} />
      <div className="space-y-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-1 text-base font-semibold">{listing.title}</h3>
          <p className="text-sm font-semibold">{listing.price.toLocaleString("bg-BG")} лв.</p>
        </div>

        <p className="line-clamp-2 text-xs text-zinc-600">{listing.description}</p>
        <p className="text-xs text-zinc-600">{listing.location}</p>
        <p className="text-xs text-zinc-500">{new Date(listing.createdAt).toLocaleDateString()}</p>

        <Link className="inline-block text-sm font-medium underline" to={`/listing/${listing.id}`}>
          Виж подробности
        </Link>

        {actions ? <div className="flex items-center gap-3 text-sm">{actions}</div> : null}
      </div>
    </article>
  );
}