export type ListingPhoto = {
  id: string;
  storagePath: string;
  displayOrder: number;
  createdAt: string;
  imageUrl: string;
};

export type Listing = {
  id: string;
  ownerId: string;
  title: string;
  description: string;
  price: number;
  location: string;
  createdAt: string;
  updatedAt: string;
  coverImageUrl: string | null;
};

export type ListingSeller = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
};

export type ListingDetails = Listing & {
  photos: ListingPhoto[];
  seller: ListingSeller | null;
};

export type ListingFormValues = {
  title: string;
  description: string;
  price: number;
  location: string;
};
