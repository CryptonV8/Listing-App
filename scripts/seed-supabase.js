import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const ENV_PATH = path.resolve(process.cwd(), ".env");
const BUCKET = "listing-photos";

const seedUsers = [
  { email: "steve@gmail.com", password: "pass123", name: "Steve" },
  { email: "maria@gmail.com", password: "pass123", name: "Maria" },
];

const listingTemplates = [
  {
    title: "Sunny Studio Apartment",
    description: "Compact studio in city center with great transport links.",
    price: 980,
    location: "Downtown",
  },
  {
    title: "Cozy Family House",
    description: "Three-bedroom house with backyard and private parking.",
    price: 2100,
    location: "Maple District",
  },
  {
    title: "Modern Loft",
    description: "Open-space loft with high ceilings and natural light.",
    price: 1650,
    location: "Riverside",
  },
  {
    title: "Lakeview Cabin",
    description: "Quiet cabin retreat with lake access and wood fireplace.",
    price: 1400,
    location: "North Lake",
  },
  {
    title: "Townhouse Near Park",
    description: "Two-floor townhouse close to schools and green park area.",
    price: 1850,
    location: "Green Park",
  },
];

const photoUrls = [
  "https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1560185007-cde436f6a4d0?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1430285561322-7808604715df?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1493666438817-866a91353ca9?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1499696010180-025ef6e1a8f9?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1460317442991-0ec209397118?auto=format&fit=crop&w=1200&q=80",
];

function readEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(".env file not found. Create .env with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY first.");
  }

  const raw = fs.readFileSync(filePath, "utf8");
  const lines = raw.split(/\r?\n/);
  const env = {};

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const eqIndex = trimmed.indexOf("=");
    if (eqIndex <= 0) {
      continue;
    }

    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim().replace(/^['\"]|['\"]$/g, "");
    env[key] = value;
  }

  return env;
}

function selectPhotos(seed, count) {
  const picked = [];
  for (let i = 0; i < count; i += 1) {
    picked.push(photoUrls[(seed + i) % photoUrls.length]);
  }
  return picked;
}

async function safeSignUp(client, email, password, name) {
  const { error } = await client.auth.signUp({
    email,
    password,
    options: {
      data: { name },
    },
  });

  if (error && !/already registered|already exists/i.test(error.message)) {
    throw error;
  }
}

async function clearExistingData(client, userId) {
  const prefix = `${userId}/`;

  const { data: files, error: listError } = await client.storage.from(BUCKET).list(prefix, {
    limit: 1000,
    sortBy: { column: "name", order: "asc" },
  });

  if (listError) {
    throw listError;
  }

  if (files && files.length > 0) {
    const removePaths = files.map((file) => `${prefix}${file.name}`);
    const { error: removeError } = await client.storage.from(BUCKET).remove(removePaths);
    if (removeError) {
      throw removeError;
    }
  }

  const { error: deleteListingsError } = await client.from("listings").delete().eq("owner_id", userId);
  if (deleteListingsError) {
    throw deleteListingsError;
  }
}

async function createListingWithPhotos(client, userId, template, listingIndex) {
  const { data: listing, error: listingError } = await client
    .from("listings")
    .insert({
      title: template.title,
      description: template.description,
      price: template.price,
      location: template.location,
      owner_id: userId,
    })
    .select("id")
    .single();

  if (listingError) {
    throw listingError;
  }

  const photosPerListing = listingIndex % 2 === 0 ? 2 : 3;
  const chosenUrls = selectPhotos(listingIndex, photosPerListing);

  for (let i = 0; i < chosenUrls.length; i += 1) {
    const photoUrl = chosenUrls[i];
    const response = await fetch(photoUrl);

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${photoUrl} (${response.status})`);
    }

    const contentType = response.headers.get("content-type") || "image/jpeg";
    const bytes = Buffer.from(await response.arrayBuffer());
    const filePath = `${userId}/${listing.id}/photo-${i + 1}.jpg`;

    const { error: uploadError } = await client.storage.from(BUCKET).upload(filePath, bytes, {
      contentType,
      upsert: true,
    });

    if (uploadError) {
      throw uploadError;
    }

    const { error: photoInsertError } = await client.from("listing_photos").insert({
      listing_id: listing.id,
      storage_path: filePath,
      display_order: i,
    });

    if (photoInsertError) {
      throw photoInsertError;
    }
  }
}

async function seedUser(url, anonKey, user) {
  const anonClient = createClient(url, anonKey);

  await safeSignUp(anonClient, user.email, user.password, user.name);

  const { data: signInData, error: signInError } = await anonClient.auth.signInWithPassword({
    email: user.email,
    password: user.password,
  });

  if (signInError || !signInData.user) {
    throw signInError || new Error(`Could not sign in user: ${user.email}`);
  }

  const userId = signInData.user.id;
  await clearExistingData(anonClient, userId);

  for (let i = 0; i < listingTemplates.length; i += 1) {
    const template = listingTemplates[i];
    await createListingWithPhotos(anonClient, userId, template, i);
  }

  await anonClient.auth.signOut();

  return {
    email: user.email,
    userId,
    listings: listingTemplates.length,
  };
}

async function main() {
  const env = readEnvFile(ENV_PATH);
  const supabaseUrl = env.VITE_SUPABASE_URL;
  const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env.");
  }

  const summaries = [];

  for (const user of seedUsers) {
    const summary = await seedUser(supabaseUrl, supabaseAnonKey, user);
    summaries.push(summary);
    console.log(`Seeded ${summary.email}: ${summary.listings} listings`);
  }

  console.log("Seeding complete.");
  for (const item of summaries) {
    console.log(`- ${item.email} (${item.userId})`);
  }
}

main().catch((error) => {
  console.error("Seed failed:", error.message || error);
  process.exit(1);
});
