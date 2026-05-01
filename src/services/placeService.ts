export type PlaceMarker = {
  id: string;
  name: string;
  province: string;
  region: string;
  map_key: string;
  lat: number;
  lng: number;
};

export type PlaceContentItem = {
  name: string;
  image: string;
  description: string;
};

export type PlaceDetail = {
  id: string;
  name: string;
  province: string;
  region: string;
  mapKey: string;
  map_key?: string;
  lat: number;
  lng: number;
  coverImage: string;
  shortDescription: string;
  attractions: PlaceContentItem[];
  foods: PlaceContentItem[];
  isActive: boolean;
};

type PlacesResponse = {
  success: boolean;
  message?: string;
  places?: PlaceMarker[];
};

type PlaceDetailResponse = {
  success: boolean;
  message?: string;
  place?: PlaceDetail;
};

const API_URL = import.meta.env.VITE_APPS_SCRIPT_URL as string | undefined;

function assertApiUrl() {
  if (!API_URL) throw new Error("Missing VITE_APPS_SCRIPT_URL");
}

function isValidCoordinate(lat: number, lng: number) {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

function normalizePlaceMarker(place: PlaceMarker): PlaceMarker {
  return {
    id: String(place.id),
    name: String(place.name),
    province: String(place.province || ""),
    region: String(place.region || ""),
    map_key: String(place.map_key || ""),
    lat: Number(place.lat),
    lng: Number(place.lng),
  };
}

export async function getPlaceMarkers(): Promise<PlaceMarker[]> {
  assertApiUrl();

  const res = await fetch(`${API_URL}?action=places`);
  if (!res.ok) throw new Error("Cannot load places");

  const data = (await res.json()) as PlacesResponse;
  if (!data.success) throw new Error(data.message || "Cannot load places");

  return (data.places || [])
    .map(normalizePlaceMarker)
    .filter((place) => isValidCoordinate(place.lat, place.lng));
}

export async function getPlacesByRegion(
  mapKey: string,
): Promise<PlaceMarker[]> {
  assertApiUrl();

  const res = await fetch(
    `${API_URL}?action=placesByRegion&map_key=${encodeURIComponent(mapKey)}`,
  );

  if (!res.ok) throw new Error("Cannot load places by region");

  const data = (await res.json()) as PlacesResponse;

  if (!data.success) {
    throw new Error(data.message || "Cannot load places by region");
  }

  return (data.places || [])
    .map(normalizePlaceMarker)
    .filter((place) => isValidCoordinate(place.lat, place.lng));
}

export async function getPlaceDetail(id: string): Promise<PlaceDetail> {
  assertApiUrl();

  const res = await fetch(
    `${API_URL}?action=placeDetail&id=${encodeURIComponent(id)}`,
  );

  if (!res.ok) throw new Error("Cannot load place detail");

  const data = (await res.json()) as PlaceDetailResponse;

  if (!data.success || !data.place) {
    throw new Error(data.message || "Cannot load place detail");
  }

  return data.place;
}