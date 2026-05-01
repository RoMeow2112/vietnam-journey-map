import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, MapPin, XCircle } from "lucide-react";
import { getPlaceMarkers, type PlaceMarker } from "@/services/placeService";

type ProvinceFeature = {
  properties?: {
    name?: string;
    map_key?: string;
  };
};

type ProvinceGeoJson = {
  features: ProvinceFeature[];
};

type DashboardPlace = PlaceMarker & {
  mapKey?: string;
  map_key?: string;
  coverImage?: string;
  cover_image?: string;
  shortDescription?: string;
  short_description?: string;
  isActive?: boolean;
  is_active?: boolean;
};

const GEOJSON_URL = "/data/vietnam-provinces.geojson";

function isMissing(value: unknown) {
  return value === undefined || value === null || String(value).trim() === "";
}

function getMapKey(place: DashboardPlace) {
  return place.map_key || place.mapKey || "";
}

function getCoverImage(place: DashboardPlace) {
  return place.cover_image || place.coverImage || "";
}

function getShortDescription(place: DashboardPlace) {
  return place.short_description || place.shortDescription || "";
}

function getIsActive(place: DashboardPlace) {
  return place.is_active ?? place.isActive ?? true;
}

export default function DataDashboard() {
  const [places, setPlaces] = useState<DashboardPlace[]>([]);
  const [provinces, setProvinces] = useState<ProvinceFeature[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);

        const [placeData, geojsonRes] = await Promise.all([
          getPlaceMarkers(),
          fetch(GEOJSON_URL),
        ]);

        const geojson = (await geojsonRes.json()) as ProvinceGeoJson;

        setPlaces(placeData as DashboardPlace[]);
        setProvinces(geojson.features || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const stats = useMemo(() => {
    const geoMapKeys = provinces
      .map((item) => item.properties?.map_key)
      .filter(Boolean) as string[];

    const geoMapKeySet = new Set(geoMapKeys);

    const placeMapKeys = places.map(getMapKey).filter(Boolean);
    const placeMapKeySet = new Set(placeMapKeys);

    const provincesWithData = geoMapKeys.filter((key) =>
      placeMapKeySet.has(key),
    );

    const provincesWithoutData = provinces.filter((province) => {
      const key = province.properties?.map_key;
      return key && !placeMapKeySet.has(key);
    });

    const invalidMapKeyPlaces = places.filter((place) => {
      const key = getMapKey(place);
      return !key || !geoMapKeySet.has(key);
    });

    const missingLatLngPlaces = places.filter(
      (place) =>
        typeof place.lat !== "number" ||
        typeof place.lng !== "number" ||
        Number.isNaN(place.lat) ||
        Number.isNaN(place.lng),
    );

    const missingContentPlaces = places.filter(
      (place) =>
        isMissing(getCoverImage(place)) ||
        isMissing(getShortDescription(place)),
    );

    const inactivePlaces = places.filter((place) => getIsActive(place) === false);

    return {
      totalPlaces: places.length,
      totalProvinces: geoMapKeys.length,
      provincesWithData,
      provincesWithoutData,
      invalidMapKeyPlaces,
      missingLatLngPlaces,
      missingContentPlaces,
      inactivePlaces,
    };
  }, [places, provinces]);

  if (loading) {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        Đang tải dữ liệu...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Data Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">
          Kiểm tra chất lượng dữ liệu từ Google Sheet / Supabase.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          title="Tổng địa điểm"
          value={stats.totalPlaces}
          icon={<MapPin className="h-5 w-5" />}
        />

        <StatCard
          title="Tỉnh đã có data"
          value={stats.provincesWithData.length}
          subText={`/ ${stats.totalProvinces} tỉnh`}
          icon={<CheckCircle2 className="h-5 w-5" />}
        />

        <StatCard
          title="Tỉnh chưa có data"
          value={stats.provincesWithoutData.length}
          icon={<AlertTriangle className="h-5 w-5" />}
        />

        <StatCard
          title="Data lỗi"
          value={
            stats.invalidMapKeyPlaces.length +
            stats.missingLatLngPlaces.length +
            stats.missingContentPlaces.length +
            stats.inactivePlaces.length
          }
          icon={<XCircle className="h-5 w-5" />}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <IssueSection
          title="Danh sách map_key bị sai"
          items={stats.invalidMapKeyPlaces.map((place) => ({
            title: place.name,
            description: `map_key: ${getMapKey(place) || "EMPTY"}`,
          }))}
        />

        <IssueSection
          title="Địa điểm thiếu lat/lng"
          items={stats.missingLatLngPlaces.map((place) => ({
            title: place.name,
            description: `lat: ${String(place.lat)} · lng: ${String(place.lng)}`,
          }))}
        />

        <IssueSection
          title="Địa điểm thiếu image/description"
          items={stats.missingContentPlaces.map((place) => ({
            title: place.name,
            description: [
              isMissing(getCoverImage(place)) ? "missing image" : "",
              isMissing(getShortDescription(place))
                ? "missing description"
                : "",
            ]
              .filter(Boolean)
              .join(" · "),
          }))}
        />

        <IssueSection
          title="Địa điểm inactive"
          items={stats.inactivePlaces.map((place) => ({
            title: place.name,
            description: place.province,
          }))}
        />
      </div>

      <IssueSection
        title="Tỉnh chưa có data"
        items={stats.provincesWithoutData.map((province) => ({
          title: province.properties?.name || "Unknown",
          description: `map_key: ${province.properties?.map_key || "EMPTY"}`,
        }))}
      />
    </div>
  );
}

function StatCard({
  title,
  value,
  subText,
  icon,
}: {
  title: string;
  value: number;
  subText?: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="rounded-xl bg-emerald-50 p-2 text-emerald-600 w-fit">
        {icon}
      </div>

      <p className="mt-4 text-sm text-slate-500">{title}</p>

      <div className="mt-1 flex items-end gap-1">
        <p className="text-3xl font-bold text-slate-900">{value}</p>
        {subText && <p className="mb-1 text-sm text-slate-500">{subText}</p>}
      </div>
    </div>
  );
}

function IssueSection({
  title,
  items,
}: {
  title: string;
  items: {
    title: string;
    description: string;
  }[];
}) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-slate-900">{title}</h2>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
          {items.length}
        </span>
      </div>

      <div className="mt-4 max-h-[320px] space-y-2 overflow-y-auto">
        {items.length === 0 ? (
          <div className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700">
            Không có lỗi.
          </div>
        ) : (
          items.map((item, index) => (
            <div key={`${item.title}-${index}`} className="rounded-xl border p-3">
              <p className="font-medium text-slate-900">{item.title}</p>
              <p className="mt-1 text-xs text-slate-500">{item.description}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}