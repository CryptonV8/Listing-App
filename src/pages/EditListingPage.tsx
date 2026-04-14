import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { deleteListingPhotos, fetchListingDetails, updateListing, uploadListingPhotos } from "../lib/listings";
import type { ListingPhoto } from "../types/listing";

export default function EditListingPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [location, setLocation] = useState("");
  const [existingPhotos, setExistingPhotos] = useState<ListingPhoto[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [removePhotoIds, setRemovePhotoIds] = useState<string[]>([]);
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const removablePhotos = useMemo(
    () => existingPhotos.filter((photo) => removePhotoIds.includes(photo.id)),
    [existingPhotos, removePhotoIds],
  );

  const visiblePhotos = useMemo(
    () => existingPhotos.filter((photo) => !removePhotoIds.includes(photo.id)),
    [existingPhotos, removePhotoIds],
  );

  useEffect(() => {
    const listingId = id;

    if (!listingId) {
      setError("Listing not found.");
      setIsLoading(false);
      return;
    }

    let ignore = false;

    async function loadListing() {
      setIsLoading(true);
      const result = await fetchListingDetails(listingId);

      if (ignore) {
        return;
      }

      if (!result.data || result.error) {
        setError(result.error ?? "Listing not found.");
        setIsLoading(false);
        return;
      }

      setOwnerId(result.data.ownerId);
      setTitle(result.data.title);
      setDescription(result.data.description);
      setPrice(String(result.data.price));
      setLocation(result.data.location);
      setExistingPhotos(result.data.photos);
      setError(null);
      setIsLoading(false);
    }

    void loadListing();

    return () => {
      ignore = true;
    };
  }, [id]);

  const toggleRemovePhoto = (photoId: string) => {
    setRemovePhotoIds((prev) =>
      prev.includes(photoId) ? prev.filter((idToKeep) => idToKeep !== photoId) : [...prev, photoId],
    );
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!id || !user) {
      setError("Unauthorized.");
      return;
    }

    const parsedPrice = Number(price);
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      setError("Price must be a valid number.");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    const updateResult = await updateListing(id, user.id, {
      title,
      description,
      price: parsedPrice,
      location,
    });

    if (updateResult.error) {
      setError(updateResult.error);
      setIsSubmitting(false);
      return;
    }

    if (removablePhotos.length > 0) {
      const deletePhotosResult = await deleteListingPhotos(removablePhotos);
      if (deletePhotosResult.error) {
        setError(deletePhotosResult.error);
        setIsSubmitting(false);
        return;
      }
    }

    if (files.length > 0) {
      const uploadResult = await uploadListingPhotos({
        listingId: id,
        ownerId: user.id,
        files,
        startOrder: visiblePhotos.length,
      });

      if (uploadResult.error) {
        setError(uploadResult.error);
        setIsSubmitting(false);
        return;
      }
    }

    navigate("/my-listings", { replace: true });
  };

  if (isLoading) {
    return <p className="text-sm text-zinc-600">Loading listing...</p>;
  }

  if (error && !ownerId) {
    return (
      <section className="space-y-3">
        <h1 className="text-2xl font-semibold tracking-tight">Listing not found</h1>
        <p className="text-sm text-red-600">{error}</p>
        <Link className="text-sm font-medium underline" to="/my-listings">
          Back to my listings
        </Link>
      </section>
    );
  }

  if (ownerId !== user?.id) {
    return (
      <section className="space-y-3">
        <h1 className="text-2xl font-semibold tracking-tight">Not allowed</h1>
        <p className="text-sm text-zinc-600">You can only edit your own listings.</p>
        <Link className="text-sm font-medium underline" to="/my-listings">
          Back to my listings
        </Link>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-xl space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Edit Listing</h1>
      <p className="text-sm text-zinc-600">Update listing details and manage listing photos.</p>

      {visiblePhotos.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 rounded border border-zinc-200 bg-white p-3">
          {visiblePhotos.map((photo) => (
            <div key={photo.id} className="space-y-2">
              <img className="h-24 w-full rounded object-cover" src={photo.imageUrl} alt="Listing" />
              <button
                className="text-xs font-medium text-red-700 underline"
                type="button"
                onClick={() => toggleRemovePhoto(photo.id)}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      ) : null}

      {removablePhotos.length > 0 ? (
        <p className="text-xs text-zinc-500">{removablePhotos.length} photo(s) marked for removal.</p>
      ) : null}

      <form className="space-y-3 rounded border border-zinc-200 bg-white p-4" onSubmit={handleSubmit}>
        <input
          className="w-full rounded border border-zinc-300 px-3 py-2"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          required
        />
        <input
          className="w-full rounded border border-zinc-300 px-3 py-2"
          type="number"
          min="0"
          step="0.01"
          value={price}
          onChange={(event) => setPrice(event.target.value)}
          required
        />
        <input
          className="w-full rounded border border-zinc-300 px-3 py-2"
          value={location}
          onChange={(event) => setLocation(event.target.value)}
          required
        />
        <textarea
          className="min-h-28 w-full rounded border border-zinc-300 px-3 py-2"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          required
        />

        <label className="block rounded border border-dashed border-zinc-300 p-3 text-sm text-zinc-600">
          <span className="mb-2 block font-medium text-zinc-700">Upload additional photos</span>
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
          {isSubmitting ? "Saving changes..." : "Save changes"}
        </button>
      </form>
    </section>
  );
}