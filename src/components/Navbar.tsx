import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogIn, LogOut, Search, User, X } from "lucide-react";

import { supabase } from "@/lib/supabase";
import PlaceModal from "@/components/PlaceModal";
import type { PlaceDetail } from "@/services/placeService";

type AuthUser = {
  id: string;
  email?: string;
  display_name?: string | null;
  avatar_url?: string | null;
};

type Profile = {
  display_name: string | null;
  avatar_url: string | null;
};

type PlaceRow = {
  id: string;
  name: string;
  province: string;
  region: string;
  lat: number | null;
  lng: number | null;
  cover_image: string | null;
  short_description: string | null;
  attractions_json: unknown;
  foods_json: unknown;
  is_active: boolean | null;
  map_key: string | null;
};

type SearchPlace = PlaceDetail;

function normalizeSearchText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .trim();
}

function splitSearchTerms(value: string, preserveDiacritics = false) {
  const text = preserveDiacritics
    ? value.toLowerCase().normalize("NFC")
    : normalizeSearchText(value);

  return text
    .replace(
      preserveDiacritics
        ? /[^\p{L}\p{N}\s]+/gu
        : /[^a-z0-9\s]+/g,
      " ",
    )
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

function safeArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function mapPlaceRowToDetail(row: PlaceRow): PlaceDetail {
  return {
    id: row.id,
    name: row.name,
    province: row.province,
    region: row.region,
    lat: row.lat ?? 0,
    lng: row.lng ?? 0,
    coverImage: row.cover_image || "",
    shortDescription: row.short_description || "",
    attractions: safeArray(row.attractions_json),
    foods: safeArray(row.foods_json),
    isActive: row.is_active === true,
    mapKey: row.map_key || "",
  } as PlaceDetail;
}

function getSearchableText(place: SearchPlace, preserveDiacritics = false) {
  const attractionsText = Array.isArray(place.attractions)
    ? place.attractions
        .map((item) => `${item.name || ""} ${item.description || ""}`)
        .join(" ")
    : "";

  const foodsText = Array.isArray(place.foods)
    ? place.foods
        .map((item) => `${item.name || ""} ${item.description || ""}`)
        .join(" ")
    : "";

  const text = [
    place.name,
    place.province,
    place.region,
    attractionsText,
    foodsText,
  ]
    .filter(Boolean)
    .join(" ");

  return preserveDiacritics
    ? text.toLowerCase().normalize("NFC").trim()
    : normalizeSearchText(text);
}

export function Navbar() {
  const navigate = useNavigate();

  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [visitedProvinceCount, setVisitedProvinceCount] = useState(0);

  const [searchKeyword, setSearchKeyword] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [places, setPlaces] = useState<SearchPlace[]>([]);
  const [loadingPlaces, setLoadingPlaces] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<PlaceDetail | null>(null);
  const [placeModalOpen, setPlaceModalOpen] = useState(false);

  const totalProvinceCount = 63;
  const progressPercent =
    totalProvinceCount > 0
      ? (visitedProvinceCount / totalProvinceCount) * 100
      : 0;

  async function loadVisitedProvinceCount(userId?: string) {
    if (!userId) {
      setVisitedProvinceCount(0);
      return;
    }

    const { count, error } = await supabase
      .from("user_visited_provinces")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("user_id", userId);

    if (error) {
      console.error(error);
      return;
    }

    setVisitedProvinceCount(count || 0);
  }

  async function loadProfile(userId: string) {
    const { data, error } = await supabase
      .from("profiles")
      .select("display_name,avatar_url")
      .eq("id", userId)
      .maybeSingle<Profile>();

    if (error) {
      console.error(error);
      return null;
    }

    return data;
  }

  async function loadPlacesForSearch() {
    if (places.length > 0 || loadingPlaces) return;

    try {
      setLoadingPlaces(true);

      const { data, error } = await supabase
        .from("places")
        .select(
          "id,name,province,region,lat,lng,cover_image,short_description,attractions_json,foods_json,is_active,map_key",
        )
        .eq("is_active", true);

      if (error) throw error;

      const mappedPlaces = ((data || []) as PlaceRow[]).map(mapPlaceRowToDetail);

      setPlaces(mappedPlaces);
    } catch (error) {
      console.error("[loadPlacesForSearch error]", error);
    } finally {
      setLoadingPlaces(false);
    }
  }

  async function loadUser() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const sessionUser = session?.user;

    if (sessionUser) {
      const profile = await loadProfile(sessionUser.id);

      setUser({
        id: sessionUser.id,
        email: sessionUser.email,
        display_name:
          profile?.display_name ||
          sessionUser.user_metadata?.display_name ||
          sessionUser.user_metadata?.full_name ||
          sessionUser.user_metadata?.name ||
          null,
        avatar_url:
          profile?.avatar_url ||
          sessionUser.user_metadata?.avatar_url ||
          sessionUser.user_metadata?.picture ||
          null,
      });

      await loadVisitedProvinceCount(sessionUser.id);
    } else {
      setUser(null);
      setVisitedProvinceCount(0);
    }

    setLoading(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();

    setUser(null);
    setVisitedProvinceCount(0);

    navigate("/", {
      replace: true,
    });
  }

  function getUserDisplayName() {
    if (user?.display_name) return user.display_name;
    if (!user?.email) return "Guest";

    return user.email.split("@")[0];
  }

  function getUserInitial() {
    const name = getUserDisplayName();
    return name.charAt(0).toUpperCase();
  }

  function handleSelectPlace(place: SearchPlace) {
    setSelectedPlace(place);
    setPlaceModalOpen(true);
    setSearchKeyword("");
    setSearchFocused(false);
  }

  function clearSearch() {
    setSearchKeyword("");
  }

  const searchResults = useMemo(() => {
    const isAccentSearch = /[ăâđêôơưáàảãạấầẩẫậắằẳẵặếềểễệíìỉĩịóòỏõọốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵĂÂĐÊÔƠƯ]/.test(searchKeyword);
    const keyword = isAccentSearch
      ? searchKeyword.toLowerCase().trim()
      : normalizeSearchText(searchKeyword);

    if (keyword.length < 1) return [];

    const exactNameMatches = places.filter((place) => {
      const name = normalizeSearchText(place.name || "");
      return name === keyword;
    });

    if (exactNameMatches.length > 0) {
      return exactNameMatches.slice(0, 8);
    }

    const exactProvinceMatches = places.filter((place) => {
      const province = normalizeSearchText(place.province || "");
      return province === keyword;
    });

    if (exactProvinceMatches.length > 0) {
      return exactProvinceMatches.slice(0, 8);
    }

    const startsWithNameMatches = places.filter((place) => {
      const name = normalizeSearchText(place.name || "");
      return name.startsWith(keyword);
    });

    if (startsWithNameMatches.length > 0) {
      return startsWithNameMatches.slice(0, 8);
    }

    const startsWithProvinceMatches = places.filter((place) => {
      const province = normalizeSearchText(place.province || "");
      return province.startsWith(keyword);
    });

    const startsWithMatches = [...startsWithNameMatches, ...startsWithProvinceMatches];

    const searchTerms = splitSearchTerms(keyword, isAccentSearch);

    const includesMatches = places.filter((place) => {
      const searchableText = getSearchableText(place, isAccentSearch);
      const placeTerms = splitSearchTerms(searchableText, isAccentSearch);
      return searchTerms.every((term) => placeTerms.includes(term));
    });

    const uniqueMap = new Map<string, SearchPlace>();

    [...startsWithMatches, ...includesMatches].forEach((place) => {
      uniqueMap.set(place.id, place);
    });

    return Array.from(uniqueMap.values()).slice(0, 8);
  }, [places, searchKeyword]);

  const shouldShowSearchDropdown =
    searchFocused && searchKeyword.trim().length > 0;

  useEffect(() => {
    loadUser();

    const handleVisitedUpdated = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      await loadVisitedProvinceCount(session?.user?.id);
    };

    const handleProfileUpdated = () => {
      loadUser();
    };

    window.addEventListener(
      "visited-provinces-updated",
      handleVisitedUpdated,
    );

    window.addEventListener("profile-updated", handleProfileUpdated);

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const sessionUser = session?.user;

      if (sessionUser) {
        loadUser();
      } else {
        setUser(null);
        setVisitedProvinceCount(0);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();

      window.removeEventListener(
        "visited-provinces-updated",
        handleVisitedUpdated,
      );

      window.removeEventListener("profile-updated", handleProfileUpdated);
    };
  }, []);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border bg-white">
        <div className="mx-auto flex min-h-[76px] max-w-[1440px] items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <Link
            to={!loading && user ? "/profile" : "/"}
            className="flex min-w-0 shrink-0 items-center gap-3 rounded-xl transition hover:bg-slate-50 active:scale-[0.98]"
            title={!loading && user ? "Trang cá nhân" : "Vietnam Discovery"}
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-purple-500 text-base font-semibold text-white shadow-sm">
              {!loading && user?.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={getUserDisplayName()}
                  className="h-full w-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : !loading && user ? (
                getUserInitial()
              ) : (
                <User className="h-5 w-5" />
              )}
            </div>

            <div className="hidden min-w-0 sm:block">
              <div className="truncate text-base font-semibold text-foreground">
                {!loading && user ? getUserDisplayName() : "Vietnam Discovery"}
              </div>

              <div className="mt-0.5 text-xs text-muted-foreground">
                Hành trình khám phá Việt Nam
              </div>
            </div>
          </Link>

          <div className="relative max-w-xl flex-1">
            <div className="flex h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 transition focus-within:border-orange-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-orange-100">
              <Search className="h-4 w-4 shrink-0 text-slate-400" />

              <input
                value={searchKeyword}
                onFocus={() => {
                  setSearchFocused(true);
                  loadPlacesForSearch();
                }}
                onChange={(event) => {
                  setSearchKeyword(event.target.value);
                  loadPlacesForSearch();
                }}
                onBlur={() => {
                  window.setTimeout(() => {
                    setSearchFocused(false);
                  }, 180);
                }}
                placeholder="Tìm tỉnh thành, đồ ăn, đặc điểm..."
                className="h-full min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
              />

              {searchKeyword && (
                <button
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={clearSearch}
                  className="rounded-full p-1 text-slate-400 transition hover:bg-slate-200 hover:text-slate-700"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {shouldShowSearchDropdown && (
              <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
                {loadingPlaces && (
                  <div className="px-4 py-3 text-sm text-slate-500">
                    Đang tải dữ liệu tìm kiếm...
                  </div>
                )}

                {!loadingPlaces && searchResults.length === 0 && (
                  <div className="px-4 py-3 text-sm text-slate-500">
                    Không tìm thấy kết quả phù hợp.
                  </div>
                )}

                {!loadingPlaces &&
                  searchResults.map((place) => (
                    <button
                      key={place.id}
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => handleSelectPlace(place)}
                      className="block w-full border-b border-slate-100 px-4 py-3 text-left transition last:border-b-0 hover:bg-orange-50"
                    >
                      <div className="text-sm font-semibold text-slate-900">
                        {place.name}
                      </div>
                    </button>
                  ))}
              </div>
            )}
          </div>

          <div className="hidden shrink-0 items-center justify-center px-2 lg:flex">
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-2xl font-medium leading-none text-orange-500">
                  {visitedProvinceCount}/{totalProvinceCount}
                </div>

                <div className="mt-1.5 text-sm text-muted-foreground">
                  Tỉnh thành
                </div>
              </div>

              <div className="h-10 w-px bg-border" />

              <div className="text-center">
                <div className="text-2xl font-medium leading-none text-orange-500">
                  {progressPercent.toFixed(2)} %
                </div>

                <div className="mt-1.5 text-sm text-muted-foreground">
                  Việt Nam
                </div>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {!loading && !user && (
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 active:scale-[0.98]"
              >
                <LogIn className="h-4 w-4" />
                <span className="hidden sm:inline">Login</span>
              </Link>
            )}

            {!loading && user && (
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-white px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-slate-50 active:scale-[0.98]"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            )}
          </div>
        </div>

        <div className="border-t border-border bg-white px-4 py-3 lg:hidden">
          <div className="mx-auto max-w-[1440px]">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-medium text-foreground">
                Tỉnh thành đã đi
              </span>

              <span className="font-semibold text-orange-500">
                {visitedProvinceCount}/{totalProvinceCount}
              </span>
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-orange-500 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </header>

      <PlaceModal
        open={placeModalOpen}
        place={selectedPlace}
        onClose={() => {
          setPlaceModalOpen(false);
          setSelectedPlace(null);
        }}
        onAddToJourney={() => {
          setPlaceModalOpen(false);
          setSelectedPlace(null);
        }}
      />
    </>
  );
}