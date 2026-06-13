import { useEffect, useState } from "react";
import type { PlaceDetail } from "@/services/placeService";
import PlaceReviews from "@/components/PlaceReviews";

type PlaceModalProps = {
  place: PlaceDetail | null;
  open: boolean;
  onClose: () => void;
  onAddToFavorites: (place: PlaceDetail) => void;
  onRemoveFromFavorites: (place: PlaceDetail) => void;
  isFavorite: boolean;
  favoriteUpdating?: boolean;
};

type Tab = "overview" | "reviews";

export default function PlaceModal({
  place,
  open,
  onClose,
  onAddToFavorites,
  onRemoveFromFavorites,
  isFavorite,
  favoriteUpdating = false,
}: PlaceModalProps) {
  const [tab, setTab] = useState<Tab>("overview");

  useEffect(() => {
    if (open) {
      setTab("overview");
    }
  }, [open, place?.id]);

  if (!open || !place) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
      <div className="flex max-h-[90dvh] w-full max-w-3xl flex-col overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-xl">
        {place.coverImage ? (
          <img
            src={place.coverImage}
            alt={place.name}
            decoding="async"
            className="h-64 w-full shrink-0 object-cover"
          />
        ) : (
          <div className="flex h-64 w-full shrink-0 items-center justify-center bg-slate-100 text-sm text-slate-500">
            No image
          </div>
        )}

        <div
          className="
            min-h-0
            flex-1
            overflow-y-auto
            overscroll-contain
            p-6
            [scrollbar-gutter:stable]
            [-webkit-overflow-scrolling:touch]
          "
        >
          <p className="text-sm text-slate-500">
            {place.province} · {place.region}
          </p>

          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
            {place.name}
          </h2>

          <div className="mt-6 rounded-full bg-slate-100 p-1">
            <div className="grid grid-cols-2 gap-1">
              <button
                type="button"
                onClick={() => setTab("overview")}
                className={`rounded-full px-4 py-2 text-sm transition-colors ${
                  tab === "overview"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Tổng quan
              </button>

              <button
                type="button"
                onClick={() => setTab("reviews")}
                className={`rounded-full px-4 py-2 text-sm transition-colors ${
                  tab === "reviews"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Đánh giá
              </button>
            </div>
          </div>

          {tab === "overview" && (
            <>
              <p className="mt-5 text-sm leading-7 text-slate-600">
                {place.shortDescription}
              </p>

              {place.attractions.length > 0 && (
                <section className="mt-6">
                  <h3 className="text-lg font-semibold text-slate-900">
                    Địa danh nổi bật
                  </h3>

                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {place.attractions.map((item, index) => (
                      <div
                        key={`${item.name}-${index}`}
                        className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 shadow-sm"
                      >
                        {item.image && (
                          <img
                            src={item.image}
                            alt={item.name}
                            loading="lazy"
                            decoding="async"
                            className="h-32 w-full object-cover"
                          />
                        )}

                        <div className="p-4">
                          <p className="font-semibold text-slate-900">
                            {item.name}
                          </p>

                          <p className="mt-1 text-sm text-slate-500">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {place.foods.length > 0 && (
                <section className="mt-6">
                  <h3 className="text-lg font-semibold text-slate-900">
                    Món ăn nên thử
                  </h3>

                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {place.foods.map((item, index) => (
                      <div
                        key={`${item.name}-${index}`}
                        className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 shadow-sm"
                      >
                        {item.image && (
                          <img
                            src={item.image}
                            alt={item.name}
                            loading="lazy"
                            decoding="async"
                            className="h-32 w-full object-cover"
                          />
                        )}

                        <div className="p-4">
                          <p className="font-semibold text-slate-900">
                            {item.name}
                          </p>

                          <p className="mt-1 text-sm text-slate-500">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}

          {tab === "reviews" && <PlaceReviews placeId={place.id} />}
        </div>

        <div className="flex shrink-0 flex-col gap-3 border-t border-slate-200 bg-white p-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            className="rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-100"
            onClick={onClose}
          >
            Đóng
          </button>

          <button
            type="button"
            disabled={favoriteUpdating}
            className={`rounded-2xl px-4 py-2 text-sm font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
              isFavorite
                ? "bg-red-500 hover:bg-red-600"
                : "bg-slate-950 hover:bg-slate-800"
            }`}
            onClick={() =>
              isFavorite
                ? onRemoveFromFavorites(place)
                : onAddToFavorites(place)
            }
          >
            {favoriteUpdating
              ? "Đang xử lý..."
              : isFavorite
                ? "Xóa khỏi địa điểm yêu thích"
                : "Thêm vào danh sách địa điểm yêu thích"}
          </button>
        </div>
      </div>
    </div>
  );
}