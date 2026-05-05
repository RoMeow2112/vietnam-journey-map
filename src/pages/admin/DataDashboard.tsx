import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, MapPin, XCircle } from "lucide-react";

type ProvinceFeature = {
  properties?: {
    name?: string;
    map_key?: string;
  };
};

type ProvinceGeoJson = {
  features: ProvinceFeature[];
};

type DashboardPlace = {
  id: string;
  name: string;
  province: string;
  region: string;
  map_key?: string;
  mapKey?: string;
  lat?: number;
  lng?: number;
  cover_image?: string;
  coverImage?: string;
  short_description?: string;
  shortDescription?: string;
  is_active?: boolean | string;
  isActive?: boolean | string;
};

const GEOJSON_URL = "/data/vietnam-provinces.geojson";
const API_URL = import.meta.env.VITE_APPS_SCRIPT_URL as string;

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
  const value = place.is_active ?? place.isActive ?? true;

  if (typeof value === "string") {
    return value.toLowerCase() === "true";
  }

  return value;
}

function getLat(place: DashboardPlace) {
  return Number(place.lat);
}

function getLng(place: DashboardPlace) {
  return Number(place.lng);
}

async function getRawPlaces(): Promise<DashboardPlace[]> {
  const response = await fetch(`${API_URL}?action=places`);
  const json = await response.json();

  if (!json.success) {
    throw new Error(json.message || "Cannot load places");
  }

  return json.places || [];
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
          getRawPlaces(),
          fetch(GEOJSON_URL),
        ]);

        const geojson = (await geojsonRes.json()) as ProvinceGeoJson;

        setPlaces(placeData);
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

    const missingLatLngPlaces = places.filter((place) => {
      const lat = getLat(place);
      const lng = getLng(place);

      return (
        Number.isNaN(lat) ||
        Number.isNaN(lng) ||
        lat === 0 ||
        lng === 0
      );
    });

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
      <div className="w-fit rounded-xl bg-emerald-50 p-2 text-emerald-600">
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