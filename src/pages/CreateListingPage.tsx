import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { createListing, uploadListingPhotos } from "../lib/listings";

export default function CreateListingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [location, setLocation] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!user) {
      setError("You need to be logged in.");
      return;
    }

    const parsedPrice = Number(price);
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      setError("Price must be a valid number.");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    const createResult = await createListing(user.id, {
      title,
      description,
      price: parsedPrice,
      location,
    });

    if (!createResult.id || createResult.error) {
      setError(createResult.error ?? "Could not create listing.");
      setIsSubmitting(false);
      return;
    }

    const uploadResult = await uploadListingPhotos({
      listingId: createResult.id,
      ownerId: user.id,
      files,
    });

    if (uploadResult.error) {
      setError(uploadResult.error);
      setIsSubmitting(false);
      return;
    }

    navigate("/my-listings", { replace: true });
  };

  return (
    <section className="mx-auto max-w-xl space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Create Listing</h1>
      <p className="text-sm text-zinc-600">Publish a new listing and upload cover/gallery photos.</p>

      <form className="space-y-3 rounded border border-zinc-200 bg-white p-4" onSubmit={handleSubmit}>
        <input
          className="w-full rounded border border-zinc-300 px-3 py-2"
          placeholder="Title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          required
        />
        <input
          className="w-full rounded border border-zinc-300 px-3 py-2"
          placeholder="Price"
          type="number"
          min="0"
          step="0.01"
          value={price}
          onChange={(event) => setPrice(event.target.value)}
          required
        />
        <input
          className="w-full rounded border border-zinc-300 px-3 py-2"
          placeholder="Location"
          value={location}
          onChange={(event) => setLocation(event.target.value)}
          required
        />
        <textarea
          className="min-h-28 w-full rounded border border-zinc-300 px-3 py-2"
          placeholder="Description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          required
        />

        <label className="block rounded border border-dashed border-zinc-300 p-3 text-sm text-zinc-600">
          <span className="mb-2 block font-medium text-zinc-700">Listing photos (multiple)</span>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={(event) => setFiles(Array.from(event.target.files ?? []))}
          />
          {files.length > 0 ? <p className="mt-2 text-xs">Selected: {files.length} files</p> : null}
        </label>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <button
          className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Saving listing..." : "Create listing"}
        </button>
      </form>

      <Link className="text-sm font-medium underline" to="/my-listings">
        Back to my listings
      </Link>
    </section>
  );
}
