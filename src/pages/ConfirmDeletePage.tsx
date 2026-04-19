import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { deleteListingWithAssets, fetchListingDetails } from "../lib/listings";

export default function ConfirmDeletePage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const listingId = id;

    if (!listingId) {
      setError("Офертата не е намерена.");
      setIsLoading(false);
      return;
    }

    let ignore = false;

    async function loadListing(targetId: string) {
      setIsLoading(true);
      const result = await fetchListingDetails(targetId);
      if (ignore) {
        return;
      }

      if (!result.data || result.error) {
        setError(result.error ?? "Офертата не е намерена.");
        setIsLoading(false);
        return;
      }

      setTitle(result.data.title);
      setOwnerId(result.data.ownerId);
      setError(null);
      setIsLoading(false);
    }

    void loadListing(listingId);

    return () => {
      ignore = true;
    };
  }, [id]);

  const handleDelete = async () => {
    if (!id || !user) {
      setError("Нямаш права за това действие.");
      return;
    }

    setIsDeleting(true);
    setError(null);

    const result = await deleteListingWithAssets(id, user.id);
    if (result.error) {
      setError(result.error);
      setIsDeleting(false);
      return;
    }

    navigate("/my-listings", { replace: true });
  };

  if (isLoading) {
    return <p className="text-sm text-zinc-600">Зареждане на офертата...</p>;
  }

  if (error && !ownerId) {
    return (
      <section className="space-y-3">
        <h1 className="text-2xl font-semibold tracking-tight">Офертата не е намерена</h1>
        <p className="text-sm text-red-600">{error}</p>
        <Link className="text-sm font-medium underline" to="/my-listings">
          Обратно към моите оферти
        </Link>
      </section>
    );
  }

  if (ownerId !== user?.id) {
    return (
      <section className="space-y-3">
        <h1 className="text-2xl font-semibold tracking-tight">Нямаш достъп</h1>
        <p className="text-sm text-zinc-600">Можеш да изтриваш само собствените си оферти.</p>
        <Link className="text-sm font-medium underline" to="/my-listings">
          Обратно към моите оферти
        </Link>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-xl space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Потвърди изтриването</h1>
      <p className="text-sm text-zinc-700">
        Сигурен ли си, че искаш да изтриеш <span className="font-semibold">{title}</span>?
      </p>
      <p className="text-sm text-zinc-500">Това действие ще премахне и качените снимки от хранилището.</p>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="flex items-center gap-3">
        <button
          className="rounded bg-red-700 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
          type="button"
          onClick={() => {
            void handleDelete();
          }}
          disabled={isDeleting}
        >
          {isDeleting ? "Изтриване..." : "Потвърди изтриването"}
        </button>

        <Link className="rounded border border-zinc-300 px-4 py-2 text-sm font-medium" to="/my-listings">
          Отказ
        </Link>
      </div>
    </section>
  );
}
