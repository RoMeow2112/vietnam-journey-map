import { useEffect, useRef, useState } from "react";
import maplibregl, {
  type GeoJSONSource,
  type Map,
  type MapLayerMouseEvent,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  getPlaceDetail,
  getPlacesByRegion,
  type PlaceDetail,
  type PlaceMarker,
} from "@/services/placeService";
import PlaceModal from "@/components/PlaceModal";

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

type PlacesGeoJsonProperties = {
  id: string;
  name: string;
  province: string;
  region: string;
  map_key: string;
};

type PlacesGeoJson = GeoJSON.FeatureCollection<
  GeoJSON.Point,
  PlacesGeoJsonProperties
>;

const REGION_SOURCE_ID = "regions";
const REGION_FILL_LAYER_ID = "region-fill";
const REGION_LINE_LAYER_ID = "region-line";
const REGION_GLOW_LAYER_ID = "region-glow";

const PLACES_SOURCE_ID = "places";
const CLUSTER_LAYER_ID = "places-cluster";
const CLUSTER_COUNT_LAYER_ID = "places-cluster-count";
const PLACE_DOT_LAYER_ID = "places-dot";
const PLACE_LABEL_LAYER_ID = "places-label";

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

function getBoundsFromGeometry(geometry: RegionGeometry) {
  const bounds = new maplibregl.LngLatBounds();

  const addCoordinate = (coord: GeoJSON.Position) => {
    const [lng, lat] = coord;

    if (Number.isFinite(lng) && Number.isFinite(lat)) {
      bounds.extend([lng, lat]);
    }
  };

  if (geometry.type === "Polygon") {
    geometry.coordinates.forEach((ring) => {
      ring.forEach(addCoordinate);
    });
  }

  if (geometry.type === "MultiPolygon") {
    geometry.coordinates.forEach((polygon) => {
      polygon.forEach((ring) => {
        ring.forEach(addCoordinate);
      });
    });
  }

  return bounds;
}

function placesToGeoJson(places: PlaceMarker[]): PlacesGeoJson {
  return {
    type: "FeatureCollection",
    features: places.map((place) => ({
      type: "Feature",
      properties: {
        id: place.id,
        name: place.name,
        province: place.province,
        region: place.region,
        map_key: place.map_key,
      },
      geometry: {
        type: "Point",
        coordinates: [place.lng, place.lat],
      },
    })),
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
  const [selectedPlace, setSelectedPlace] = useState<PlaceDetail | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loadingDetailId, setLoadingDetailId] = useState<string | null>(null);

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
          "fill-color": [
            "case",
            ["boolean", ["feature-state", "active"], false],
            "#10b981",
            ["boolean", ["feature-state", "hover"], false],
            "#34d399",
            "#bbf7d0",
          ],
          "fill-opacity": [
            "case",
            ["boolean", ["feature-state", "active"], false],
            0.55,
            ["boolean", ["feature-state", "hover"], false],
            0.42,
            0.24,
          ],
        },
      });

      map.addLayer({
        id: REGION_GLOW_LAYER_ID,
        type: "line",
        source: REGION_SOURCE_ID,
        paint: {
          "line-color": [
            "case",
            ["boolean", ["feature-state", "active"], false],
            "#047857",
            ["boolean", ["feature-state", "hover"], false],
            "#10b981",
            "#22c55e",
          ],
          "line-width": [
            "case",
            ["boolean", ["feature-state", "active"], false],
            5,
            ["boolean", ["feature-state", "hover"], false],
            4,
            0,
          ],
          "line-opacity": [
            "case",
            ["boolean", ["feature-state", "active"], false],
            0.8,
            ["boolean", ["feature-state", "hover"], false],
            0.65,
            0,
          ],
          "line-blur": 3,
        },
      });

      map.addLayer({
        id: REGION_LINE_LAYER_ID,
        type: "line",
        source: REGION_SOURCE_ID,
        paint: {
          "line-color": "#059669",
          "line-width": 1.2,
          "line-opacity": 0.9,
        },
      });

      map.addSource(PLACES_SOURCE_ID, {
        type: "geojson",
        data: placesToGeoJson([]),
        cluster: true,
        clusterRadius: 48,
        clusterMaxZoom: 12,
      });

      map.addLayer({
        id: CLUSTER_LAYER_ID,
        type: "circle",
        source: PLACES_SOURCE_ID,
        filter: ["has", "point_count"],
        paint: {
          "circle-color": "#111827",
          "circle-radius": ["step", ["get", "point_count"], 18, 5, 24, 10, 30],
          "circle-opacity": 0.9,
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 3,
        },
      });

      map.addLayer({
        id: CLUSTER_COUNT_LAYER_ID,
        type: "symbol",
        source: PLACES_SOURCE_ID,
        filter: ["has", "point_count"],
        layout: {
          "text-field": ["get", "point_count_abbreviated"],
          "text-size": 12,
        },
        paint: {
          "text-color": "#ffffff",
        },
      });

      map.addLayer({
        id: PLACE_DOT_LAYER_ID,
        type: "circle",
        source: PLACES_SOURCE_ID,
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-color": "#111827",
          "circle-radius": 8,
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 3,
        },
      });

      map.addLayer({
        id: PLACE_LABEL_LAYER_ID,
        type: "symbol",
        source: PLACES_SOURCE_ID,
        filter: ["!", ["has", "point_count"]],
        layout: {
          "text-field": ["get", "name"],
          "text-size": 12,
          "text-offset": [0, 1.35],
          "text-anchor": "top",
        },
        paint: {
          "text-color": "#111827",
          "text-halo-color": "#ffffff",
          "text-halo-width": 1,
        },
      });

      map.fitBounds(VN_FIT_BOUNDS, {
        padding: 8,
        duration: 0,
      });

      const lockedZoom = map.getZoom();
      map.setMinZoom(lockedZoom);
      map.setMaxZoom(lockedZoom);

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

  // 🔥 Nếu vẫn đang hover cùng tỉnh → bỏ qua (KHÔNG update tooltip)
  if (hoveredRegionRef.current === key) return;

  // 🔄 reset vùng cũ
  if (hoveredRegionRef.current) {
    map.setFeatureState(
      { source: REGION_SOURCE_ID, id: hoveredRegionRef.current },
      { hover: false },
    );
  }

  hoveredRegionRef.current = key;

  map.setFeatureState(
    { source: REGION_SOURCE_ID, id: key },
    { hover: true },
  );

  // 🔥 Chỉ set + addTo khi đổi tỉnh
  popup.setLngLat(event.lngLat).setHTML(`<span>${name}</span>`).addTo(map);
});

      map.on("mouseleave", REGION_FILL_LAYER_ID, () => {
        map.getCanvas().style.cursor = "";
        popup.remove();

        if (hoveredRegionRef.current) {
          map.setFeatureState(
            { source: REGION_SOURCE_ID, id: hoveredRegionRef.current },
            { hover: false },
          );
        }

        hoveredRegionRef.current = null;
      });

      map.on("click", REGION_FILL_LAYER_ID, async (event: MapLayerMouseEvent) => {
        const feature = event.features?.[0] as RegionFeature | undefined;
        if (!feature?.geometry) return;

        const key = feature.properties?.map_key;
        const name = feature.properties?.name || "";

        if (!key) return;

        clearActiveRegion(map, geojson);

        map.setFeatureState(
          { source: REGION_SOURCE_ID, id: key },
          { active: true },
        );

        setActiveRegionKey(key);
        setActiveRegionName(name);
        setLoadingRegion(true);

        try {
          const places =
            cacheRef.current[key] || (await getPlacesByRegion(key));

          cacheRef.current[key] = places;
          setRegionPlaces(places);

          const source = map.getSource(PLACES_SOURCE_ID) as GeoJSONSource;
          source.setData(placesToGeoJson(places));
        } catch (error: unknown) {
          console.error(error);
          setRegionPlaces([]);
        } finally {
          setLoadingRegion(false);
        }
      });

      map.on("click", CLUSTER_LAYER_ID, async (event: MapLayerMouseEvent) => {
        const features = map.queryRenderedFeatures(event.point, {
          layers: [CLUSTER_LAYER_ID],
        });

        const cluster = features[0];
        const clusterId = cluster?.properties?.cluster_id;

        const source = map.getSource(PLACES_SOURCE_ID) as GeoJSONSource;

        if (typeof clusterId !== "number") return;

        const zoom = await source.getClusterExpansionZoom(clusterId);

        const geometry = cluster.geometry;

        if (geometry.type !== "Point") return;

        const [lng, lat] = geometry.coordinates;

        map.easeTo({
          center: [lng, lat],
          zoom,
        });
      });

      map.on("click", PLACE_DOT_LAYER_ID, async (event: MapLayerMouseEvent) => {
        const feature = event.features?.[0];
        const id = feature?.properties?.id;

        if (!id) return;

        try {
          setLoadingDetailId(String(id));
          const detail = await getPlaceDetail(String(id));
          setSelectedPlace(detail);
          setModalOpen(true);
        } catch (error: unknown) {
          console.error(error);
        } finally {
          setLoadingDetailId(null);
        }
      });

      map.on("mouseenter", CLUSTER_LAYER_ID, () => {
        map.getCanvas().style.cursor = "pointer";
      });

      map.on("mouseleave", CLUSTER_LAYER_ID, () => {
        map.getCanvas().style.cursor = "";
      });

      map.on("mouseenter", PLACE_DOT_LAYER_ID, () => {
        map.getCanvas().style.cursor = "pointer";
      });

      map.on("mouseleave", PLACE_DOT_LAYER_ID, () => {
        map.getCanvas().style.cursor = "";
      });
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  function resetRegion() {
    const map = mapRef.current;
    const geojson = geojsonRef.current;

    if (!map || !geojson) return;

    clearActiveRegion(map, geojson);

    const source = map.getSource(PLACES_SOURCE_ID) as GeoJSONSource | undefined;
    source?.setData(placesToGeoJson([]));

    setActiveRegionKey(null);
    setActiveRegionName("");
    setRegionPlaces([]);
  }

  async function openPlace(place: PlaceMarker) {
    try {
      setLoadingDetailId(place.id);
      const detail = await getPlaceDetail(place.id);
      setSelectedPlace(detail);
      setModalOpen(true);
    } catch (error: unknown) {
      console.error(error);
    } finally {
      setLoadingDetailId(null);
    }
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border bg-white shadow-sm">
      <div ref={mapContainerRef} className="h-[680px] w-full" />

      {activeRegionKey && (
        <div className="absolute left-4 top-4 z-10 w-[330px] rounded-2xl bg-white/95 p-4 shadow-xl backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
            Khu vực đang chọn
          </p>

          <h3 className="mt-1 text-xl font-bold text-slate-900">
            {activeRegionName}
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            {loadingRegion
              ? "Đang tải địa điểm..."
              : `${regionPlaces.length} địa điểm trong khu vực này`}
          </p>

          <div className="mt-4 max-h-[360px] space-y-2 overflow-y-auto pr-1">
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
                <p className="font-semibold text-slate-900">{place.name}</p>
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

          <button
            type="button"
            onClick={resetRegion}
            className="mt-4 w-full rounded-xl border px-3 py-2 text-sm font-medium hover:bg-slate-50"
          >
            Bỏ chọn vùng
          </button>
        </div>
      )}

      <PlaceModal
        open={modalOpen}
        place={selectedPlace}
        onClose={() => setModalOpen(false)}
        onAddToJourney={() => setModalOpen(false)}
      />
    </div>
  );
}