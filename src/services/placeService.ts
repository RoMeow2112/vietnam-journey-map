export type PlaceMarker = {
  id: string;
  name: string;
  province: string;
  region: string;
  map_key: string;
  mapKey?: string;
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
  cover_image?: string;
  shortDescription: string;
  short_description?: string;
  attractions: PlaceContentItem[];
  attractions_json?: PlaceContentItem[];
  foods: PlaceContentItem[];
  foods_json?: PlaceContentItem[];
  isActive: boolean;
  is_active?: boolean;
};

type RawPlace = Partial<PlaceMarker & PlaceDetail>;

type PlacesResponse = {
  success: boolean;
  message?: string;
  places?: RawPlace[];
};

type PlaceDetailResponse = {
  success: boolean;
  message?: string;
  place?: RawPlace;
};

const API_URL = import.meta.env.VITE_APPS_SCRIPT_URL as string | undefined;

function assertApiUrl() {
  if (!API_URL) {
    throw new Error("Missing VITE_APPS_SCRIPT_URL");
  }
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

function normalizeMapKey(place: RawPlace) {
  return String(place.map_key || place.mapKey || "");
}

function normalizeContentItems(value: unknown): PlaceContentItem[] {
  if (!Array.isArray(value)) return [];

  return value.map((item) => ({
    name: String(item?.name || ""),
    image: String(item?.image || ""),
    description: String(item?.description || ""),
  }));
}

function normalizePlaceMarker(place: RawPlace): PlaceMarker {
  const mapKey = normalizeMapKey(place);

  return {
    id: String(place.id || ""),
    name: String(place.name || ""),
    province: String(place.province || ""),
    region: String(place.region || ""),
    map_key: mapKey,
    mapKey,
    lat: Number(place.lat),
    lng: Number(place.lng),
  };
}

function normalizePlaceDetail(place: RawPlace): PlaceDetail {
  const mapKey = normalizeMapKey(place);
  const coverImage = String(place.coverImage || place.cover_image || "");
  const shortDescription = String(
    place.shortDescription || place.short_description || "",
  );

  const attractions = normalizeContentItems(
    place.attractions || place.attractions_json,
  );

  const foods = normalizeContentItems(place.foods || place.foods_json);

  const isActive =
    place.isActive === true ||
    place.is_active === true ||
    String(place.isActive || place.is_active).toUpperCase() === "TRUE";

  return {
    id: String(place.id || ""),
    name: String(place.name || ""),
    province: String(place.province || ""),
    region: String(place.region || ""),

    mapKey,
    map_key: mapKey,

    lat: Number(place.lat),
    lng: Number(place.lng),

    coverImage,
    cover_image: coverImage,

    shortDescription,
    short_description: shortDescription,

    attractions,
    attractions_json: attractions,

    foods,
    foods_json: foods,

    isActive,
    is_active: isActive,
  };
}

function debugLog(label: string, value: unknown) {
  if (import.meta.env.DEV) {
    console.log(label, value);
  }
}

export async function getPlaceMarkers(): Promise<PlaceMarker[]> {
  assertApiUrl();

  const url = `${API_URL}?action=places`;

  debugLog("🔥 [getPlaceMarkers] URL:", url);

  const res = await fetch(url);

  debugLog("🔥 [getPlaceMarkers] HTTP status:", res.status);

  if (!res.ok) {
    throw new Error("Cannot load places");
  }

  const data = (await res.json()) as PlacesResponse;

  debugLog("🔥 [getPlaceMarkers] RAW API DATA:", data);

  if (!data.success) {
    throw new Error(data.message || "Cannot load places");
  }

  const normalized = (data.places || []).map(normalizePlaceMarker);

  debugLog("🔥 [getPlaceMarkers] NORMALIZED:", normalized);

  const validPlaces = normalized.filter((place) =>
    isValidCoordinate(place.lat, place.lng),
  );

  debugLog("🔥 [getPlaceMarkers] VALID PLACES:", validPlaces);

  return validPlaces;
}

export async function getPlacesByRegion(
  mapKey: string,
): Promise<PlaceMarker[]> {
  assertApiUrl();

  const url = `${API_URL}?action=placesByRegion&map_key=${encodeURIComponent(
    mapKey,
  )}`;

  debugLog("🔥 [getPlacesByRegion] URL:", url);

  const res = await fetch(url);

  debugLog("🔥 [getPlacesByRegion] HTTP status:", res.status);

  if (!res.ok) {
    throw new Error("Cannot load places by region");
  }

  const data = (await res.json()) as PlacesResponse;

  debugLog("🔥 [getPlacesByRegion] RAW API DATA:", data);

  if (!data.success) {
    throw new Error(data.message || "Cannot load places by region");
  }

  const normalized = (data.places || []).map(normalizePlaceMarker);

  debugLog("🔥 [getPlacesByRegion] NORMALIZED:", normalized);

  return normalized.filter((place) => isValidCoordinate(place.lat, place.lng));
}

export async function getPlaceDetail(id: string): Promise<PlaceDetail> {
  assertApiUrl();

  const url = `${API_URL}?action=placeDetail&id=${encodeURIComponent(id)}`;

  debugLog("🔥 [getPlaceDetail] URL:", url);

  const res = await fetch(url);

  debugLog("🔥 [getPlaceDetail] HTTP status:", res.status);

  if (!res.ok) {
    throw new Error("Cannot load place detail");
  }

  const data = (await res.json()) as PlaceDetailResponse;

  debugLog("🔥 [getPlaceDetail] RAW API DATA:", data);

  if (!data.success || !data.place) {
    throw new Error(data.message || "Cannot load place detail");
  }

  const normalized = normalizePlaceDetail(data.place);

  debugLog("🔥 [getPlaceDetail] NORMALIZED:", normalized);

  return normalized;
}