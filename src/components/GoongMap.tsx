import { useCallback, useEffect, useRef, useState } from "react";
import maplibregl, {
  type GeoJSONSource,
  type Map,
  type MapLayerMouseEvent,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

import {
  CheckCircle2,
  Info,
  LocateFixed,
  MapPinned,
  Trash2,
  X,
} from "lucide-react";

import {
  getPlaceDetail,
  getPlacesByRegion,
  type PlaceDetail,
  type PlaceMarker,
} from "@/services/placeService";
import { supabase } from "@/lib/supabase";
import PlaceModal from "@/components/PlaceModal";
import LoginRequiredModal from "@/components/LoginRequiredModal";

type RegionProperties = {
  name?: string;
  map_key?: string;
};

type RegionGeometry = GeoJSON.Polygon | GeoJSON.MultiPolygon;

type RegionFeature = GeoJSON.Feature<RegionGeometry, RegionProperties>;

type RegionGeoJson = GeoJSON.FeatureCollection<
  RegionGeometry,
  RegionProperties
>;

type PendingVisitedRegion = {
  key: string;
  name: string;
};

type UserLocation = {
  lng: number;
  lat: number;
};

type FavoritePlace = {
  id: string;
  name: string;
  province: string;
  region: string;
  createdAt: string;
};

type FavoritePlaceQueryRow = {
  place_id: string;
  created_at: string;
  places:
    | {
        id: string;
        name: string;
        province: string;
        region: string;
      }
    | Array<{
        id: string;
        name: string;
        province: string;
        region: string;
      }>
    | null;
};

type UserLocationGeoJson = GeoJSON.FeatureCollection<
  GeoJSON.Point,
  {
    type: "user-location";
  }
>;

const REGION_SOURCE_ID = "regions";
const REGION_FILL_LAYER_ID = "region-fill";
const REGION_LINE_LAYER_ID = "region-line";
const REGION_GLOW_LAYER_ID = "region-glow";

const USER_LOCATION_SOURCE_ID = "user-location";
const USER_LOCATION_PULSE_LAYER_ID = "user-location-pulse";
const USER_LOCATION_DOT_LAYER_ID = "user-location-dot";

const VN_FIT_BOUNDS: [[number, number], [number, number]] = [
  [101.5, 7.5],
  [111.5, 24.5],
];

const BLANK_VN_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {},
  layers: [
    {
      id: "white-background",
      type: "background",
      paint: {
        "background-color": "#ffffff",
      },
    },
  ],
};

function emptyUserLocationGeoJson(): UserLocationGeoJson {
  return {
    type: "FeatureCollection",
    features: [],
  };
}

function userLocationToGeoJson(
  location: UserLocation | null,
): UserLocationGeoJson {
  if (!location) return emptyUserLocationGeoJson();

  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: {
          type: "user-location",
        },
        geometry: {
          type: "Point",
          coordinates: [location.lng, location.lat],
        },
      },
    ],
  };
}

function clearActiveRegion(map: Map, geojson: RegionGeoJson) {
  geojson.features.forEach((feature) => {
    const key = feature.properties?.map_key;

    if (!key) return;

    map.setFeatureState(
      {
        source: REGION_SOURCE_ID,
        id: key,
      },
      {
        active: false,
        hover: false,
      },
    );
  });
}

function lockMap(map: Map) {
  map.scrollZoom.disable();
  map.boxZoom.disable();
  map.dragPan.disable();
  map.dragRotate.disable();
  map.doubleClickZoom.disable();
  map.keyboard.disable();
  map.touchZoomRotate.disable();
}

function debugVisitedKeyMatch(geojson: RegionGeoJson, provinceKeys: string[]) {
  const geojsonKeys = geojson.features
    .map((feature) => feature.properties?.map_key)
    .filter(Boolean) as string[];

  const geojsonKeySet = new Set(geojsonKeys);

  const matchedKeys = provinceKeys.filter((key) => geojsonKeySet.has(key));
  const missingKeys = provinceKeys.filter((key) => !geojsonKeySet.has(key));

  console.groupCollapsed("[GoongMap] visited province highlight debug");
  console.log("DB province_key:", provinceKeys);
  console.log("GeoJSON map_key:", geojsonKeys);
  console.log("Matched keys:", matchedKeys);
  console.log("Missing keys:", missingKeys);

  if (missingKeys.length > 0) {
    console.warn(
      "[GoongMap] Một số province_key trong DB không khớp với map_key trong GeoJSON:",
      missingKeys,
    );
  }

  console.groupEnd();
}

function getVisitedFillColorExpression(provinceKeys: string[]): maplibregl.ExpressionSpecification {
  return [
    "case",
    ["in", ["get", "map_key"], ["literal", provinceKeys]],
    "#07ad1e",
    ["boolean", ["feature-state", "active"], false],
    "#0ab922",
    ["boolean", ["feature-state", "hover"], false],
    "#289c0b",
    "#d1fae5",
  ] as maplibregl.ExpressionSpecification;
}

function getVisitedFillOpacityExpression(provinceKeys: string[]): maplibregl.ExpressionSpecification {
  return [
    "case",
    ["in", ["get", "map_key"], ["literal", provinceKeys]],
    0.96,
    ["boolean", ["feature-state", "active"], false],
    0.86,
    ["boolean", ["feature-state", "hover"], false],
    0.5,
    0.18,
  ] as maplibregl.ExpressionSpecification;
}

function getVisitedLineColorExpression(provinceKeys: string[]): maplibregl.ExpressionSpecification {
  return [
    "case",
    ["in", ["get", "map_key"], ["literal", provinceKeys]],
    "#02990a",
    ["boolean", ["feature-state", "active"], false],
    "#02740b",
    ["boolean", ["feature-state", "hover"], false],
    "#0da00d",
    "#10b981",
  ] as maplibregl.ExpressionSpecification;
}

function getVisitedLineWidthExpression(provinceKeys: string[]): maplibregl.ExpressionSpecification {
  return [
    "case",
    ["in", ["get", "map_key"], ["literal", provinceKeys]],
    2.5,
    ["boolean", ["feature-state", "active"], false],
    2.8,
    ["boolean", ["feature-state", "hover"], false],
    2,
    1,
  ] as maplibregl.ExpressionSpecification;
}

function getVisitedGlowColorExpression(provinceKeys: string[]): maplibregl.ExpressionSpecification {
  return [
    "case",
    ["in", ["get", "map_key"], ["literal", provinceKeys]],
    "#02c902",
    ["boolean", ["feature-state", "active"], false],
    "#288d00",
    ["boolean", ["feature-state", "hover"], false],
    "#fbbf24",
    "#22c55e",
  ] as maplibregl.ExpressionSpecification;
}

function getVisitedGlowWidthExpression(provinceKeys: string[]): maplibregl.ExpressionSpecification {
  return [
    "case",
    ["in", ["get", "map_key"], ["literal", provinceKeys]],
    4.5,
    ["boolean", ["feature-state", "active"], false],
    4,
    ["boolean", ["feature-state", "hover"], false],
    3,
    0,
  ] as maplibregl.ExpressionSpecification;
}

function getVisitedGlowOpacityExpression(provinceKeys: string[]): maplibregl.ExpressionSpecification {
  return [
    "case",
    ["in", ["get", "map_key"], ["literal", provinceKeys]],
    1,
    ["boolean", ["feature-state", "active"], false],
    0.95,
    ["boolean", ["feature-state", "hover"], false],
    0.65,
    0,
  ] as maplibregl.ExpressionSpecification;
}

export default function GoongMap() {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Map | null>(null);
  const geojsonRef = useRef<RegionGeoJson | null>(null);
  const cacheRef = useRef<Record<string, PlaceMarker[]>>({});
  const hoveredRegionRef = useRef<string | null>(null);

  const [activeRegionKey, setActiveRegionKey] = useState<string | null>(null);
  const [activeRegionName, setActiveRegionName] = useState("");
  const [regionPlaces, setRegionPlaces] = useState<PlaceMarker[]>([]);
  const [loadingRegion, setLoadingRegion] = useState(false);
  const [showRegionDetail, setShowRegionDetail] = useState(false);

  const [visitedProvinceKeys, setVisitedProvinceKeys] = useState<string[]>([]);
  const [confirmVisitedOpen, setConfirmVisitedOpen] = useState(false);
  const [markingVisited, setMarkingVisited] = useState(false);

  const [confirmRemoveVisitedOpen, setConfirmRemoveVisitedOpen] =
    useState(false);
  const [removingVisited, setRemovingVisited] = useState(false);

  const [pendingVisitedRegion, setPendingVisitedRegion] =
    useState<PendingVisitedRegion | null>(null);

  const [selectedPlace, setSelectedPlace] = useState<PlaceDetail | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loadingDetailId, setLoadingDetailId] = useState<string | null>(null);

  // One favorite list per authenticated account.
  const [favoritePlaceIds, setFavoritePlaceIds] = useState<string[]>([]);
  const [favoritePlaces, setFavoritePlaces] = useState<FavoritePlace[]>([]);
  const [loadingFavorites, setLoadingFavorites] = useState(false);
  const [pendingFavoritePlace, setPendingFavoritePlace] =
    useState<PlaceDetail | null>(null);
  const [favoriteUpdating, setFavoriteUpdating] = useState(false);

  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [pendingPlaceId, setPendingPlaceId] = useState<string | null>(null);

  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [locationPermissionDenied, setLocationPermissionDenied] =
    useState(false);

  const activeRegionVisited = activeRegionKey
    ? visitedProvinceKeys.includes(activeRegionKey)
    : false;

  async function isLoggedIn() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    return !!session?.user;
  }

  const setUserLocationOnMap = useCallback((location: UserLocation | null) => {
    const map = mapRef.current;

    if (!map) return;

    const source = map.getSource(USER_LOCATION_SOURCE_ID) as
      | GeoJSONSource
      | undefined;

    if (!source) return;

    source.setData(userLocationToGeoJson(location));
  }, []);

  const requestUserLocationIfLoggedIn = useCallback(async () => {
    const loggedIn = await isLoggedIn();

    if (!loggedIn) {
      setUserLocation(null);
      setUserLocationOnMap(null);
      return;
    }

    if (!navigator.geolocation) {
      console.warn("Browser does not support geolocation.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lng: position.coords.longitude,
          lat: position.coords.latitude,
        };

        setUserLocation(location);
        setLocationPermissionDenied(false);
        setUserLocationOnMap(location);
      },
      (error) => {
        console.warn("Geolocation error:", error);
        setUserLocation(null);
        setUserLocationOnMap(null);
        setLocationPermissionDenied(true);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      },
    );
  }, [setUserLocationOnMap]);

  const applyVisitedState = useCallback((provinceKeys: string[]) => {
    const map = mapRef.current;
    const geojson = geojsonRef.current;

    if (!map || !geojson) return;

    const source = map.getSource(REGION_SOURCE_ID);

    if (!source) return;

    debugVisitedKeyMatch(geojson, provinceKeys);

    const visitedSet = new Set(provinceKeys);

    geojson.features.forEach((feature) => {
      const key = feature.properties?.map_key;

      if (!key) return;

      map.setFeatureState(
        {
          source: REGION_SOURCE_ID,
          id: key,
        },
        {
          visited: visitedSet.has(key),
        },
      );
    });

    if (map.getLayer(REGION_FILL_LAYER_ID)) {
      map.setPaintProperty(
        REGION_FILL_LAYER_ID,
        "fill-color",
        getVisitedFillColorExpression(provinceKeys),
      );

      map.setPaintProperty(
        REGION_FILL_LAYER_ID,
        "fill-opacity",
        getVisitedFillOpacityExpression(provinceKeys),
      );
    }

    if (map.getLayer(REGION_LINE_LAYER_ID)) {
      map.setPaintProperty(
        REGION_LINE_LAYER_ID,
        "line-color",
        getVisitedLineColorExpression(provinceKeys),
      );

      map.setPaintProperty(
        REGION_LINE_LAYER_ID,
        "line-width",
        getVisitedLineWidthExpression(provinceKeys),
      );
    }

    if (map.getLayer(REGION_GLOW_LAYER_ID)) {
      map.setPaintProperty(
        REGION_GLOW_LAYER_ID,
        "line-color",
        getVisitedGlowColorExpression(provinceKeys),
      );

      map.setPaintProperty(
        REGION_GLOW_LAYER_ID,
        "line-width",
        getVisitedGlowWidthExpression(provinceKeys),
      );

      map.setPaintProperty(
        REGION_GLOW_LAYER_ID,
        "line-opacity",
        getVisitedGlowOpacityExpression(provinceKeys),
      );
    }
  }, []);

  const removeVisitedState = useCallback((provinceKey: string) => {
    const map = mapRef.current;

    if (!map) return;

    const source = map.getSource(REGION_SOURCE_ID);

    if (!source) return;

    map.setFeatureState(
      {
        source: REGION_SOURCE_ID,
        id: provinceKey,
      },
      {
        visited: false,
      },
    );
  }, []);

  const loadVisitedProvinces = useCallback(async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        setVisitedProvinceKeys([]);
        applyVisitedState([]);
        return;
      }

      const { data, error } = await supabase
        .from("user_visited_provinces")
        .select("province_key")
        .eq("user_id", session.user.id);

      if (error) throw error;

      const keys = (data || []).map((item) => item.province_key as string);

      setVisitedProvinceKeys(keys);
      applyVisitedState(keys);
    } catch (error) {
      console.error(error);
    }
  }, [applyVisitedState]);

  const loadFavoritePlaces = useCallback(async (userId?: string) => {
    setLoadingFavorites(true);

    try {
      let activeUserId = userId;

      if (!activeUserId) {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        activeUserId = session?.user?.id;
      }

      if (!activeUserId) {
        setFavoritePlaceIds([]);
        setFavoritePlaces([]);
        return;
      }

      // Step 1: Load every favorite place id of the current account.
      // This query is not related to the currently selected province.
      const { data: favoriteRows, error: favoriteError } = await supabase
        .from("user_favorite_places")
        .select("place_id, created_at")
        .eq("user_id", activeUserId)
        .order("created_at", { ascending: false });

      if (favoriteError) throw favoriteError;

      const rows = favoriteRows ?? [];
      const placeIds = rows.map((item) => item.place_id as string);

      if (placeIds.length === 0) {
        setFavoritePlaceIds([]);
        setFavoritePlaces([]);
        return;
      }

      // Step 2: Load full information for all favorite places.
      // Using .in() ensures the result contains favorites from every province.
      const { data: placeRows, error: placesError } = await supabase
        .from("places")
        .select("id, name, province, region")
        .in("id", placeIds);

      if (placesError) throw placesError;

      const placeById = new Map(
        (placeRows ?? []).map((place) => [place.id as string, place]),
      );

      const normalizedFavorites: FavoritePlace[] = rows.flatMap((item) => {
        const relatedPlace = placeById.get(item.place_id as string);

        if (!relatedPlace) return [];

        return [
          {
            id: relatedPlace.id as string,
            name: relatedPlace.name as string,
            province: relatedPlace.province as string,
            region: relatedPlace.region as string,
            createdAt: item.created_at as string,
          },
        ];
      });

      setFavoritePlaceIds(placeIds);
      setFavoritePlaces(normalizedFavorites);
    } catch (error) {
      console.error("Cannot load favorite places:", error);
      setFavoritePlaceIds([]);
      setFavoritePlaces([]);
    } finally {
      setLoadingFavorites(false);
    }
  }, []);

  async function openPlaceById(id: string) {
    try {
      setLoadingDetailId(id);

      const detail = await getPlaceDetail(id);

      setSelectedPlace(detail);
      setModalOpen(true);
    } catch (error: unknown) {
      console.error(error);
    } finally {
      setLoadingDetailId(null);
    }
  }

  async function requireLoginThenOpenPlace(id: string) {
    const loggedIn = await isLoggedIn();

    if (!loggedIn) {
      setPendingPlaceId(id);
      setLoginModalOpen(true);
      return;
    }

    await openPlaceById(id);
  }

  async function savePlaceToFavorites(place: PlaceDetail) {
    try {
      setFavoriteUpdating(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        setPendingFavoritePlace(place);
        setLoginModalOpen(true);
        return;
      }

      const { error } = await supabase.from("user_favorite_places").upsert(
        {
          user_id: session.user.id,
          place_id: place.id,
        },
        {
          onConflict: "user_id,place_id",
          ignoreDuplicates: true,
        },
      );

      if (error) throw error;

      setFavoritePlaceIds((currentIds) =>
        currentIds.includes(place.id) ? currentIds : [place.id, ...currentIds],
      );

      await loadFavoritePlaces(session.user.id);
      setPendingFavoritePlace(null);

      window.alert(`Đã thêm ${place.name} vào danh sách địa điểm yêu thích.`);
    } catch (error) {
      console.error("Cannot add place to favorites:", error);
      window.alert("Không thể thêm địa điểm vào danh sách yêu thích.");
    } finally {
      setFavoriteUpdating(false);
    }
  }

  async function removePlaceFromFavorites(place: PlaceDetail) {
    try {
      setFavoriteUpdating(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        setLoginModalOpen(true);
        return;
      }

      const { error } = await supabase
        .from("user_favorite_places")
        .delete()
        .eq("user_id", session.user.id)
        .eq("place_id", place.id);

      if (error) throw error;

      setFavoritePlaceIds((currentIds) =>
        currentIds.filter((placeId) => placeId !== place.id),
      );
      setFavoritePlaces((currentPlaces) =>
        currentPlaces.filter((favoritePlace) => favoritePlace.id !== place.id),
      );

      // Update local state only: remove exactly the selected place and keep
      // every other favorite item unchanged. Avoid reloading the whole list
      // here because an overlapping request can temporarily clear the UI.
      window.alert(`Đã xóa ${place.name} khỏi danh sách địa điểm yêu thích.`);
    } catch (error) {
      console.error("Cannot remove place from favorites:", error);
      window.alert("Không thể xóa địa điểm khỏi danh sách yêu thích.");
    } finally {
      setFavoriteUpdating(false);
    }
  }

  async function handleAddToFavorites(place: PlaceDetail) {
    const loggedIn = await isLoggedIn();

    if (!loggedIn) {
      setPendingFavoritePlace(place);
      setLoginModalOpen(true);
      return;
    }

    await savePlaceToFavorites(place);
  }

  async function handleRemoveFromFavorites(place: PlaceDetail) {
    const loggedIn = await isLoggedIn();

    if (!loggedIn) {
      setLoginModalOpen(true);
      return;
    }

    await removePlaceFromFavorites(place);
  }

  async function handleShowRegionDetail() {
    setShowRegionDetail(true);

    // Always reload the complete wishlist of the current account.
    // Do not filter by activeRegionKey or regionPlaces.
    await loadFavoritePlaces();
  }

  async function handleMarkVisited() {
    if (!activeRegionKey || !activeRegionName) return;

    if (activeRegionVisited) return;

    const loggedIn = await isLoggedIn();

    if (!loggedIn) {
      setPendingVisitedRegion({
        key: activeRegionKey,
        name: activeRegionName,
      });
      setLoginModalOpen(true);
      return;
    }

    setConfirmVisitedOpen(true);
  }

  async function confirmMarkVisited() {
    if (!activeRegionKey || !activeRegionName) return;

    try {
      setMarkingVisited(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        setLoginModalOpen(true);
        return;
      }

      const { error } = await supabase.from("user_visited_provinces").upsert(
        {
          user_id: session.user.id,
          province_key: activeRegionKey,
          province_name: activeRegionName,
        },
        {
          onConflict: "user_id,province_key",
        },
      );

      if (error) throw error;

      const nextVisitedProvinceKeys = visitedProvinceKeys.includes(
        activeRegionKey,
      )
        ? visitedProvinceKeys
        : [...visitedProvinceKeys, activeRegionKey];

      setVisitedProvinceKeys(nextVisitedProvinceKeys);
      applyVisitedState(nextVisitedProvinceKeys);

      window.dispatchEvent(new Event("visited-provinces-updated"));

      setConfirmVisitedOpen(false);
    } catch (error) {
      console.error(error);
    } finally {
      setMarkingVisited(false);
    }
  }

  function handleOpenRemoveVisitedConfirm() {
    if (!activeRegionKey || !activeRegionVisited) return;

    setConfirmRemoveVisitedOpen(true);
  }

  async function confirmRemoveVisited() {
    if (!activeRegionKey) return;

    try {
      setRemovingVisited(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        setLoginModalOpen(true);
        return;
      }

      const { error } = await supabase
        .from("user_visited_provinces")
        .delete()
        .eq("user_id", session.user.id)
        .eq("province_key", activeRegionKey);

      if (error) throw error;

      setVisitedProvinceKeys((prev) =>
        prev.filter((key) => key !== activeRegionKey),
      );

      removeVisitedState(activeRegionKey);

      window.dispatchEvent(new Event("visited-provinces-updated"));

      setConfirmRemoveVisitedOpen(false);
    } catch (error) {
      console.error(error);
    } finally {
      setRemovingVisited(false);
    }
  }

  function resetRegion() {
    const map = mapRef.current;
    const geojson = geojsonRef.current;

    if (!map || !geojson) return;

    clearActiveRegion(map, geojson);

    setActiveRegionKey(null);
    setActiveRegionName("");
    setRegionPlaces([]);
    setShowRegionDetail(false);
    setConfirmVisitedOpen(false);
    setConfirmRemoveVisitedOpen(false);
  }

  async function openPlace(place: PlaceMarker) {
    await requireLoginThenOpenPlace(place.id);
  }

  useEffect(() => {
    loadVisitedProvinces();
    loadFavoritePlaces();
    requestUserLocationIfLoggedIn();

    // Event listeners receive an Event object as their first argument.
    // Use wrappers so that Event is not accidentally passed as userId.
    const handleVisitedProvincesUpdated = () => {
      void loadVisitedProvinces();
    };

    const handleFavoritePlacesUpdated = () => {
      void loadFavoritePlaces();
    };

    window.addEventListener(
      "visited-provinces-updated",
      handleVisitedProvincesUpdated,
    );
    window.addEventListener(
      "favorite-places-updated",
      handleFavoritePlacesUpdated,
    );

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      // Clear only when the authenticated account changes, then load
      // the wishlist that belongs to the new account.
      setFavoritePlaceIds([]);
      setFavoritePlaces([]);

      void loadVisitedProvinces();
      void loadFavoritePlaces(session?.user?.id);
      void requestUserLocationIfLoggedIn();
    });

    return () => {
      window.removeEventListener(
        "visited-provinces-updated",
        handleVisitedProvincesUpdated,
      );
      window.removeEventListener(
        "favorite-places-updated",
        handleFavoritePlacesUpdated,
      );
      subscription.unsubscribe();
    };
  }, [loadVisitedProvinces, loadFavoritePlaces, requestUserLocationIfLoggedIn]);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: BLANK_VN_STYLE,
      center: [108, 16],
      zoom: 5,
      attributionControl: false,
      interactive: true,
    });

    mapRef.current = map;
    lockMap(map);

    map.on("load", async () => {
      const res = await fetch("/data/vietnam-provinces.geojson");
      const rawGeojson = (await res.json()) as RegionGeoJson;

      const geojson: RegionGeoJson = {
        ...rawGeojson,
        features: rawGeojson.features.map((feature) => ({
          ...feature,
          id: feature.properties?.map_key || feature.id,
        })),
      };

      geojsonRef.current = geojson;

      map.addSource(REGION_SOURCE_ID, {
        type: "geojson",
        data: geojson,
      });

      map.addLayer({
        id: REGION_FILL_LAYER_ID,
        type: "fill",
        source: REGION_SOURCE_ID,
        paint: {
          "fill-color": getVisitedFillColorExpression([]),
          "fill-opacity": getVisitedFillOpacityExpression([]),
        },
      });

      map.addLayer({
        id: REGION_GLOW_LAYER_ID,
        type: "line",
        source: REGION_SOURCE_ID,
        paint: {
          "line-color": getVisitedGlowColorExpression([]),
          "line-width": getVisitedGlowWidthExpression([]),
          "line-opacity": getVisitedGlowOpacityExpression([]),
          "line-blur": [
            "case",
            ["boolean", ["feature-state", "visited"], false],
            1.8,
            3,
          ],
        },
      });

      map.addLayer({
        id: REGION_LINE_LAYER_ID,
        type: "line",
        source: REGION_SOURCE_ID,
        paint: {
          "line-color": getVisitedLineColorExpression([]),
          "line-width": getVisitedLineWidthExpression([]),
          "line-opacity": [
            "case",
            ["boolean", ["feature-state", "active"], false],
            1,
            ["boolean", ["feature-state", "visited"], false],
            1,
            ["boolean", ["feature-state", "hover"], false],
            1,
            0.7,
          ],
        },
      });

      map.addSource(USER_LOCATION_SOURCE_ID, {
        type: "geojson",
        data: emptyUserLocationGeoJson(),
      });

      map.addLayer({
        id: USER_LOCATION_PULSE_LAYER_ID,
        type: "circle",
        source: USER_LOCATION_SOURCE_ID,
        paint: {
          "circle-color": "#2563eb",
          "circle-radius": 18,
          "circle-opacity": 0.18,
          "circle-stroke-color": "#2563eb",
          "circle-stroke-width": 2,
          "circle-stroke-opacity": 0.28,
        },
      });

      map.addLayer({
        id: USER_LOCATION_DOT_LAYER_ID,
        type: "circle",
        source: USER_LOCATION_SOURCE_ID,
        paint: {
          "circle-color": "#2563eb",
          "circle-radius": 7,
          "circle-opacity": 1,
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 4,
        },
      });

      map.fitBounds(VN_FIT_BOUNDS, {
        padding: 8,
        duration: 0,
      });

      const lockedZoom = map.getZoom();
      map.setMinZoom(lockedZoom);
      map.setMaxZoom(lockedZoom);

      await loadVisitedProvinces();
      await requestUserLocationIfLoggedIn();

      const popup = new maplibregl.Popup({
        closeButton: false,
        closeOnClick: false,
        offset: 8,
        className: "map-tooltip",
      });

      map.on("mousemove", REGION_FILL_LAYER_ID, (event: MapLayerMouseEvent) => {
        const feature = event.features?.[0];
        const key = feature?.properties?.map_key as string;
        const name = feature?.properties?.name as string;

        if (!key) return;

        map.getCanvas().style.cursor = "pointer";

        if (hoveredRegionRef.current === key) return;

        if (hoveredRegionRef.current) {
          map.setFeatureState(
            {
              source: REGION_SOURCE_ID,
              id: hoveredRegionRef.current,
            },
            {
              hover: false,
            },
          );
        }

        hoveredRegionRef.current = key;

        map.setFeatureState(
          {
            source: REGION_SOURCE_ID,
            id: key,
          },
          {
            hover: true,
          },
        );

        popup
          .setLngLat(event.lngLat)
          .setHTML(`<span>${name}</span>`)
          .addTo(map);
      });

      map.on("mouseleave", REGION_FILL_LAYER_ID, () => {
        map.getCanvas().style.cursor = "";
        popup.remove();

        if (hoveredRegionRef.current) {
          map.setFeatureState(
            {
              source: REGION_SOURCE_ID,
              id: hoveredRegionRef.current,
            },
            {
              hover: false,
            },
          );
        }

        hoveredRegionRef.current = null;
      });

      map.on(
        "click",
        REGION_FILL_LAYER_ID,
        async (event: MapLayerMouseEvent) => {
          const feature = event.features?.[0] as RegionFeature | undefined;

          if (!feature?.geometry) return;

          const key = feature.properties?.map_key;
          const name = feature.properties?.name || "";

          if (!key) return;

          clearActiveRegion(map, geojson);

          map.setFeatureState(
            {
              source: REGION_SOURCE_ID,
              id: key,
            },
            {
              active: true,
            },
          );

          setActiveRegionKey(key);
          setActiveRegionName(name);
          setLoadingRegion(true);
          setShowRegionDetail(false);
          setConfirmVisitedOpen(false);
          setConfirmRemoveVisitedOpen(false);

          try {
            const places =
              cacheRef.current[key] || (await getPlacesByRegion(key));

            cacheRef.current[key] = places;
            setRegionPlaces(places);
          } catch (error: unknown) {
            console.error(error);
            setRegionPlaces([]);
          } finally {
            setLoadingRegion(false);
          }
        },
      );
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  return (
    <div className="relative overflow-hidden bg-white">
      <div ref={mapContainerRef} className="h-[calc(100vh-76px)] w-full" />

      {userLocation && (
        <div className="absolute right-4 top-4 z-10 flex items-center gap-2 rounded-full border border-blue-200 bg-white/95 px-3 py-2 text-xs font-medium text-blue-700 shadow-sm backdrop-blur">
          <LocateFixed className="h-4 w-4" />
          Đã xác định vị trí của bạn
        </div>
      )}

      {!userLocation && locationPermissionDenied && (
        <div className="absolute right-4 top-4 z-10 max-w-[260px] rounded-xl border border-orange-200 bg-white/95 px-3 py-2 text-xs leading-5 text-orange-700 shadow-sm backdrop-blur">
          Bạn chưa cho phép truy cập vị trí hiện tại.
        </div>
      )}

      {activeRegionKey && (
        <div className="absolute left-4 top-4 z-10 w-[330px] rounded-2xl bg-[#1f1f1f] p-4 text-white shadow-[0_16px_40px_rgba(0,0,0,0.35)]">
          <button
            type="button"
            onClick={resetRegion}
            className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-white/70 transition hover:bg-white/20 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>

          <h3 className="pr-8 text-center text-lg font-semibold">
            {activeRegionName}
          </h3>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleShowRegionDetail}
              className="flex min-h-[92px] flex-col items-center justify-center gap-2 rounded-xl bg-white/5 px-3 py-3 text-center transition hover:bg-white/10 active:scale-[0.98]"
            >
              <Info className="h-7 w-7 text-white/75" />

              <span className="text-xs font-medium leading-4 text-white">
                Xem thông tin
                <br />
                chi tiết
              </span>
            </button>

            <button
              type="button"
              onClick={handleMarkVisited}
              disabled={activeRegionVisited}
              className="flex min-h-[92px] flex-col items-center justify-center gap-2 rounded-xl bg-white/5 px-3 py-3 text-center transition hover:bg-white/10 active:scale-[0.98] disabled:cursor-default disabled:bg-orange-500/25"
            >
              <CheckCircle2
                className={
                  activeRegionVisited
                    ? "h-7 w-7 text-orange-300"
                    : "h-7 w-7 text-white/75"
                }
              />

              <span className="text-xs font-medium leading-4 text-white">
                {activeRegionVisited ? (
                  <>
                    ✓ Đã đi
                    <br />
                    địa điểm này
                  </>
                ) : (
                  <>
                    Đã đi
                    <br />
                    địa điểm này
                  </>
                )}
              </span>
            </button>
          </div>

          {activeRegionVisited && (
            <button
              type="button"
              onClick={handleOpenRemoveVisitedConfirm}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2.5 text-sm font-medium text-red-200 transition hover:bg-red-500/20 active:scale-[0.98]"
            >
              <Trash2 className="h-4 w-4" />
              Bỏ đánh dấu đã đi
            </button>
          )}

          {showRegionDetail && (
            <div className="mt-4 space-y-4 rounded-xl bg-white p-3 text-slate-900">
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <MapPinned className="h-4 w-4 text-amber-500" />

                  <p className="text-sm font-semibold">Địa điểm yêu thích</p>
                </div>

                <p className="mb-3 text-xs text-slate-500">
                  {loadingFavorites
                    ? "Đang tải danh sách yêu thích..."
                    : `${favoritePlaces.length} địa điểm đã thêm vào danh sách yêu thích`}
                </p>

                <div className="max-h-[220px] space-y-2 overflow-y-auto pr-1">
                  {!loadingFavorites && favoritePlaces.length === 0 && (
                    <div className="rounded-xl border border-dashed p-4 text-sm leading-6 text-slate-500">
                      Bạn chưa thêm địa điểm nào vào danh sách yêu thích.
                    </div>
                  )}

                  {favoritePlaces.map((place) => (
                    <button
                      key={`favorite-${place.id}`}
                      type="button"
                      onClick={() => requireLoginThenOpenPlace(place.id)}
                      className="w-full rounded-xl border border-amber-200 bg-amber-50 p-3 text-left transition hover:border-amber-400 hover:bg-amber-100"
                    >
                      <p className="font-semibold text-slate-900">
                        {place.name}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {place.province} · {place.region}
                      </p>

                      {loadingDetailId === place.id && (
                        <p className="mt-1 text-xs text-amber-600">
                          Đang tải chi tiết...
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t border-slate-200 pt-4">
              <div className="mb-3 flex items-center gap-2">
                <MapPinned className="h-4 w-4 text-emerald-600" />

                <p className="text-sm font-semibold">Thông tin khu vực</p>
              </div>

              <p className="mb-3 text-xs text-slate-500">
                {loadingRegion
                  ? "Đang tải địa điểm..."
                  : `${regionPlaces.length} địa điểm trong khu vực này`}
              </p>

              <div className="max-h-[300px] space-y-2 overflow-y-auto pr-1">
                {!loadingRegion && regionPlaces.length === 0 && (
                  <div className="rounded-xl border border-dashed p-4 text-sm text-slate-500">
                    Chưa có địa điểm nào cho vùng này.
                  </div>
                )}

                {regionPlaces.map((place) => (
                  <button
                    key={place.id}
                    type="button"
                    onClick={() => openPlace(place)}
                    className="w-full rounded-xl border bg-white p-3 text-left transition hover:border-emerald-400 hover:bg-emerald-50"
                  >
                    <p className="font-semibold text-slate-900">
                      {place.name}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {place.province} · {place.region}
                    </p>

                    {loadingDetailId === place.id && (
                      <p className="mt-1 text-xs text-emerald-600">
                        Đang tải chi tiết...
                      </p>
                    )}
                  </button>
                ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {confirmVisitedOpen && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/20 px-4 backdrop-blur-sm">
          <div className="w-full max-w-[360px] rounded-2xl bg-white p-5 text-slate-900 shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
            <h3 className="text-lg font-semibold">
              Xác nhận địa điểm đã đi
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Bạn xác nhận đã đi{" "}
              <span className="font-semibold text-slate-900">
                {activeRegionName}
              </span>
              ?
            </p>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmVisitedOpen(false)}
                disabled={markingVisited}
                className="rounded-lg border px-4 py-2 text-sm font-medium transition hover:bg-slate-50 disabled:opacity-60"
              >
                Huỷ
              </button>

              <button
                type="button"
                onClick={confirmMarkVisited}
                disabled={markingVisited}
                className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:opacity-60"
              >
                {markingVisited ? "Đang lưu..." : "Xác nhận"}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmRemoveVisitedOpen && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/20 px-4 backdrop-blur-sm">
          <div className="w-full max-w-[360px] rounded-2xl bg-white p-5 text-slate-900 shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
            <h3 className="text-lg font-semibold">Bỏ đánh dấu đã đi</h3>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Bạn muốn xoá{" "}
              <span className="font-semibold text-slate-900">
                {activeRegionName}
              </span>{" "}
              khỏi danh sách tỉnh thành đã đi?
            </p>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmRemoveVisitedOpen(false)}
                disabled={removingVisited}
                className="rounded-lg border px-4 py-2 text-sm font-medium transition hover:bg-slate-50 disabled:opacity-60"
              >
                Huỷ
              </button>

              <button
                type="button"
                onClick={confirmRemoveVisited}
                disabled={removingVisited}
                className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600 disabled:opacity-60"
              >
                {removingVisited ? "Đang xoá..." : "Xoá"}
              </button>
            </div>
          </div>
        </div>
      )}

      <PlaceModal
        open={modalOpen}
        place={selectedPlace}
        onClose={() => setModalOpen(false)}
        onAddToFavorites={handleAddToFavorites}
        onRemoveFromFavorites={handleRemoveFromFavorites}
        isFavorite={
          selectedPlace ? favoritePlaceIds.includes(selectedPlace.id) : false
        }
        favoriteUpdating={favoriteUpdating}
      />

      <LoginRequiredModal
        open={loginModalOpen}
        onClose={() => {
          setLoginModalOpen(false);
          setPendingPlaceId(null);
          setPendingVisitedRegion(null);
          setPendingFavoritePlace(null);
        }}
        onLoginSuccess={async () => {
          setLoginModalOpen(false);

          await requestUserLocationIfLoggedIn();
          await loadFavoritePlaces();

          if (pendingFavoritePlace) {
            const placeToFavorite = pendingFavoritePlace;
            setPendingFavoritePlace(null);
            await savePlaceToFavorites(placeToFavorite);
            return;
          }

          if (pendingPlaceId) {
            await openPlaceById(pendingPlaceId);
            setPendingPlaceId(null);
            return;
          }

          if (pendingVisitedRegion) {
            setActiveRegionKey(pendingVisitedRegion.key);
            setActiveRegionName(pendingVisitedRegion.name);
            setPendingVisitedRegion(null);
            setConfirmVisitedOpen(true);
          }
        }}
      />
    </div>
  );
}