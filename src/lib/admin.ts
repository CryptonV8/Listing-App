import { isSupabaseConfigured, supabase, supabaseConfigErrorMessage } from "./supabase";
import type { ListingFormValues } from "../types/listing";

export type AdminListing = {
  id: string;
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  title: string;
  price: number;
  location: string;
  createdAt: string;
};

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  createdAt: string;
  role: "admin" | "user";
};

function toRoleLabel(roles: Array<{ user_id: string; role: string }>, userId: string): "admin" | "user" {
  return roles.some((entry) => entry.user_id === userId && entry.role === "admin") ? "admin" : "user";
}

async function getProfilesMap(userIds: string[]) {
  if (userIds.length === 0) {
    return new Map<string, { name: string; email: string }>();
  }

  const { data } = await supabase
    .from("user_profiles")
    .select("id, name, email")
    .in("id", userIds);

  const map = new Map<string, { name: string; email: string }>();
  (data ?? []).forEach((profile) => {
    map.set(profile.id, {
      name: profile.name,
      email: profile.email,
    });
  });

  return map;
}

export async function fetchAdminDashboardData() {
  if (!isSupabaseConfigured) {
    return {
      data: null as null | {
        usersCount: number;
        listingsCount: number;
        photosCount: number;
        recentListings: AdminListing[];
      },
      error: supabaseConfigErrorMessage,
    };
  }

  const [{ count: usersCount }, { count: listingsCount }, { count: photosCount }, listingsResult] = await Promise.all([
    supabase.from("user_profiles").select("id", { count: "exact", head: true }),
    supabase.from("listings").select("id", { count: "exact", head: true }),
    supabase.from("listing_photos").select("id", { count: "exact", head: true }),
    supabase
      .from("listings")
      .select("id, owner_id, title, price, location, created_at")
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  if (listingsResult.error) {
    return { data: null, error: listingsResult.error.message };
  }

  const rows = listingsResult.data ?? [];
  const ownerIds = Array.from(new Set(rows.map((row) => row.owner_id)));
  const ownerProfiles = await getProfilesMap(ownerIds);

  const recentListings: AdminListing[] = rows.map((row) => {
    const owner = ownerProfiles.get(row.owner_id);
    return {
      id: row.id,
      ownerId: row.owner_id,
      ownerName: owner?.name || "-",
      ownerEmail: owner?.email || "-",
      title: row.title,
      price: Number(row.price),
      location: row.location,
      createdAt: row.created_at,
    };
  });

  return {
    data: {
      usersCount: usersCount ?? 0,
      listingsCount: listingsCount ?? 0,
      photosCount: photosCount ?? 0,
      recentListings,
    },
    error: null,
  };
}

export async function fetchAdminListings() {
  if (!isSupabaseConfigured) {
    return { data: [] as AdminListing[], error: supabaseConfigErrorMessage };
  }

  const { data, error } = await supabase
    .from("listings")
    .select("id, owner_id, title, price, location, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return { data: [] as AdminListing[], error: error.message };
  }

  const rows = data ?? [];
  const ownerIds = Array.from(new Set(rows.map((row) => row.owner_id)));
  const ownerProfiles = await getProfilesMap(ownerIds);

  const mapped: AdminListing[] = rows.map((row) => {
    const owner = ownerProfiles.get(row.owner_id);
    return {
      id: row.id,
      ownerId: row.owner_id,
      ownerName: owner?.name || "-",
      ownerEmail: owner?.email || "-",
      title: row.title,
      price: Number(row.price),
      location: row.location,
      createdAt: row.created_at,
    };
  });

  return { data: mapped, error: null };
}

export async function fetchAdminUsers() {
  if (!isSupabaseConfigured) {
    return { data: [] as AdminUser[], error: supabaseConfigErrorMessage };
  }

  const [profilesResult, rolesResult] = await Promise.all([
    supabase.from("user_profiles").select("id, name, email, phone, created_at").order("created_at", { ascending: false }),
    supabase.from("user_roles").select("user_id, role"),
  ]);

  if (profilesResult.error) {
    return { data: [] as AdminUser[], error: profilesResult.error.message };
  }

  if (rolesResult.error) {
    return { data: [] as AdminUser[], error: rolesResult.error.message };
  }

  const roles = rolesResult.data ?? [];

  const users: AdminUser[] = (profilesResult.data ?? []).map((profile) => ({
    id: profile.id,
    name: profile.name,
    email: profile.email,
    phone: profile.phone,
    createdAt: profile.created_at,
    role: toRoleLabel(roles, profile.id),
  }));

  return { data: users, error: null };
}

export async function adminUpdateListing(listingId: string, values: ListingFormValues) {
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
    .eq("id", listingId);

  return { error: error?.message ?? null };
}

export async function adminDeleteListingWithAssets(listingId: string) {
  if (!isSupabaseConfigured) {
    return { error: supabaseConfigErrorMessage };
  }

  const { data: photos, error: photosError } = await supabase
    .from("listing_photos")
    .select("storage_path")
    .eq("listing_id", listingId);

  if (photosError) {
    return { error: photosError.message };
  }

  const paths = (photos ?? []).map((photo) => photo.storage_path);
  if (paths.length > 0) {
    const storageResult = await supabase.storage.from("listing-photos").remove(paths);
    if (storageResult.error) {
      return { error: storageResult.error.message };
    }
  }

  const { error } = await supabase.from("listings").delete().eq("id", listingId);

  return { error: error?.message ?? null };
}
