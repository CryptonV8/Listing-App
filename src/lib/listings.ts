import { isSupabaseConfigured, supabase, supabaseConfigErrorMessage } from "./supabase";
import type { Listing, ListingDetails, ListingFormValues, ListingPhoto, ListingSeller } from "../types/listing";

const BUCKET = "listing-photos";

type ListingRow = {
  id: string;
  owner_id: string;
  title: string;
  description: string;
  price: number;
  location: string;
  created_at: string;
  updated_at: string;
  listing_photos?: Array<{
    id: string;
    storage_path: string;
    display_order: number;
    created_at: string;
  }>;
};

function toPublicImageUrl(path: string) {
  if (!isSupabaseConfigured) {
    return "";
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

function normalizePhotos(
  photos: Array<{ id: string; storage_path: string; display_order: number; created_at: string }> | undefined,
): ListingPhoto[] {
  if (!photos || photos.length === 0) {
    return [];
  }

  return [...photos]
    .sort((a, b) => a.display_order - b.display_order)
    .map((photo) => ({
      id: photo.id,
      storagePath: photo.storage_path,
      displayOrder: photo.display_order,
      createdAt: photo.created_at,
      imageUrl: toPublicImageUrl(photo.storage_path),
    }));
}

function mapRowToListing(row: ListingRow): Listing {
  const photos = normalizePhotos(row.listing_photos);

  return {
    id: row.id,
    ownerId: row.owner_id,
    title: row.title,
    description: row.description,
    price: Number(row.price),
    location: row.location,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    coverImageUrl: photos[0]?.imageUrl ?? null,
  };
}

function normalizeError(error: unknown, fallbackMessage: string) {
  if (error instanceof Error) {
    return error.message;
  }
  return fallbackMessage;
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, timeoutMessage: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(timeoutMessage));
    }, timeoutMs);

    promise.then(
      (value) => {
        clearTimeout(timeoutId);
        resolve(value);
      },
      (error) => {
        clearTimeout(timeoutId);
        reject(error);
      },
    );
  });
}

function sanitizeFileName(fileName: string) {
  return fileName.toLowerCase().replace(/[^a-z0-9.-]/g, "-");
}

function isAuthTokenLockError(message: string | undefined) {
  if (!message) {
    return false;
  }

  return message.includes("auth-token") && message.includes("lock:sb-") && message.includes("stole");
}

function delay(timeoutMs: number) {
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      resolve();
    }, timeoutMs);
  });
}

function createUuidFallback() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (character) => {
    const randomValue = (Math.random() * 16) | 0;
    const uuidValue = character === "x" ? randomValue : (randomValue & 0x3) | 0x8;
    return uuidValue.toString(16);
  });
}

export async function fetchListingsPage(options: {
  page: number;
  pageSize: number;
  search?: string;
  ownerId?: string;
}) {
  if (!isSupabaseConfigured) {
    return { data: [] as Listing[], count: 0, error: supabaseConfigErrorMessage };
  }

  const start = (options.page - 1) * options.pageSize;
  const end = start + options.pageSize - 1;

  let query = supabase
    .from("listings")
    .select(
      "id, owner_id, title, description, price, location, created_at, updated_at, listing_photos(id, storage_path, display_order, created_at)",
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range(start, end);

  if (options.ownerId) {
    query = query.eq("owner_id", options.ownerId);
  }

  const normalizedSearch = options.search?.trim();
  if (normalizedSearch) {
    query = query.or(`title.ilike.%${normalizedSearch}%,location.ilike.%${normalizedSearch}%`);
  }

  const { data, count, error } = await query;

  if (error) {
    return { data: [] as Listing[], count: 0, error: error.message };
  }

  return {
    data: (data ?? []).map((row) => mapRowToListing(row as ListingRow)),
    count: count ?? 0,
    error: null,
  };
}

export async function fetchLatestListings(limit: number) {
  if (!isSupabaseConfigured) {
    return { data: [] as Listing[], error: supabaseConfigErrorMessage };
  }

  const { data, error } = await supabase
    .from("listings")
    .select("id, owner_id, title, description, price, location, created_at, updated_at, listing_photos(id, storage_path, display_order, created_at)")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    return { data: [] as Listing[], error: error.message };
  }

  return {
    data: (data ?? []).map((row) => mapRowToListing(row as ListingRow)),
    error: null,
  };
}

export async function fetchListingDetails(listingId: string) {
  if (!isSupabaseConfigured) {
    return { data: null as ListingDetails | null, error: supabaseConfigErrorMessage };
  }

  const { data: listingRow, error: listingError } = await supabase
    .from("listings")
    .select("id, owner_id, title, description, price, location, created_at, updated_at, listing_photos(id, storage_path, display_order, created_at)")
    .eq("id", listingId)
    .single();

  if (listingError || !listingRow) {
    return { data: null as ListingDetails | null, error: listingError?.message ?? "Офертата не е намерена." };
  }

  const { data: sellerRow } = await supabase
    .from("user_profiles")
    .select("id, name, email, phone")
    .eq("id", listingRow.owner_id)
    .maybeSingle();

  const seller: ListingSeller | null = sellerRow
    ? {
        id: sellerRow.id,
        name: sellerRow.name,
        email: sellerRow.email,
        phone: sellerRow.phone,
      }
    : null;

  const mapped = mapRowToListing(listingRow as ListingRow);
  const photos = normalizePhotos((listingRow as ListingRow).listing_photos);

  return {
    data: {
      ...mapped,
      photos,
      seller,
    },
    error: null,
  };
}

export async function createListing(ownerId: string, values: ListingFormValues) {
  if (!isSupabaseConfigured) {
    return { id: null as string | null, error: supabaseConfigErrorMessage };
  }

  const listingId = globalThis.crypto?.randomUUID?.() ?? createUuidFallback();

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const insertResult = await withTimeout(
        supabase.from("listings").upsert(
          {
            id: listingId,
            owner_id: ownerId,
            title: values.title,
            description: values.description,
            price: values.price,
            location: values.location,
          },
          { onConflict: "id" },
        ),
        20_000,
        "Сървърът не отговаря (timeout) при създаване на офертата. Опитай пак.",
      );

      const { error } = insertResult;
      if (!error) {
        return { id: listingId, error: null };
      }

      if (attempt === 0 && isAuthTokenLockError(error.message)) {
        await delay(300);
        continue;
      }

      console.error("createListing insert error:", error);
      return { id: null as string | null, error: error.message ?? "Офертата не можа да бъде създадена." };
    } catch (caughtError) {
      const message = normalizeError(caughtError, "Офертата не можа да бъде създадена.");

      if (attempt === 0 && isAuthTokenLockError(message)) {
        await delay(300);
        continue;
      }

      console.error("createListing unexpected error:", caughtError);
      return { id: null as string | null, error: message };
    }
  }

  return { id: null as string | null, error: "Офертата не можа да бъде създадена." };
}

export async function updateListing(listingId: string, ownerId: string, values: ListingFormValues) {
  if (!isSupabaseConfigured) {
    return { error: supabaseConfigErrorMessage };
  }

  const { error } = await supabase
    .from("listings")
    .update({
      title: values.title,
      description: values.description,
      price: values.price,
      location: values.location,
    })
    .eq("id", listingId)
    .eq("owner_id", ownerId);

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}

export async function uploadListingPhotos(options: {
  listingId: string;
  ownerId: string;
  files: File[];
  startOrder?: number;
}) {
  if (!isSupabaseConfigured) {
    return { error: supabaseConfigErrorMessage, photos: [] as ListingPhoto[] };
  }

  if (options.files.length === 0) {
    return { error: null, photos: [] as ListingPhoto[] };
  }

  const uploadedRows: Array<{ listing_id: string; storage_path: string; display_order: number }> = [];

  for (let index = 0; index < options.files.length; index += 1) {
    const file = options.files[index];
    const filePath = `${options.ownerId}/${options.listingId}/${Date.now()}-${index}-${sanitizeFileName(file.name)}`;

    const uploadResult = await withTimeout(
      supabase.storage.from(BUCKET).upload(filePath, file, {
        cacheControl: "3600",
        contentType: file.type || "application/octet-stream",
        upsert: true,
      }),
      60_000,
      "Сървърът не отговаря (timeout) при качване на снимките. Опитай пак.",
    );

    if (uploadResult.error) {
      console.error("uploadListingPhotos storage error:", uploadResult.error);
      return { error: uploadResult.error.message, photos: [] as ListingPhoto[] };
    }

    uploadedRows.push({
      listing_id: options.listingId,
      storage_path: filePath,
      display_order: (options.startOrder ?? 0) + index,
    });
  }

  const insertPhotosResult = await withTimeout(
    supabase
      .from("listing_photos")
      .insert(uploadedRows)
      .select("id, storage_path, display_order, created_at"),
    20_000,
    "Сървърът не отговаря (timeout) при запис на снимките към офертата. Опитай пак.",
  );

  const { data, error } = insertPhotosResult;

  if (error) {
    console.error("uploadListingPhotos db error:", error);
    return { error: error.message, photos: [] as ListingPhoto[] };
  }

  return {
    error: null,
    photos: normalizePhotos(data ?? []),
  };
}

export async function deleteListingPhotos(photos: ListingPhoto[]) {
  if (!isSupabaseConfigured) {
    return { error: supabaseConfigErrorMessage };
  }

  if (photos.length === 0) {
    return { error: null };
  }

  const paths = photos.map((photo) => photo.storagePath);
  const ids = photos.map((photo) => photo.id);

  const storageResult = await supabase.storage.from(BUCKET).remove(paths);
  if (storageResult.error) {
    return { error: storageResult.error.message };
  }

  const { error } = await supabase.from("listing_photos").delete().in("id", ids);
  if (error) {
    return { error: error.message };
  }

  return { error: null };
}

export async function deleteListingWithAssets(listingId: string, ownerId: string) {
  if (!isSupabaseConfigured) {
    return { error: supabaseConfigErrorMessage };
  }

  try {
    const { data: photos, error: photoError } = await supabase
      .from("listing_photos")
      .select("id, storage_path, display_order, created_at")
      .eq("listing_id", listingId);

    if (photoError) {
      return { error: photoError.message };
    }

    const normalized = normalizePhotos(photos ?? []);
    const deletePhotosResult = await deleteListingPhotos(normalized);
    if (deletePhotosResult.error) {
      return { error: deletePhotosResult.error };
    }

    const { error: listingDeleteError } = await supabase
      .from("listings")
      .delete()
      .eq("id", listingId)
      .eq("owner_id", ownerId);

    if (listingDeleteError) {
      return { error: listingDeleteError.message };
    }

    return { error: null };
  } catch (error) {
    return { error: normalizeError(error, "Офертата не можа да бъде изтрита.") };
  }
}
