import { useState } from "react";
import type { PlaceDetail } from "@/services/placeService";
import PlaceReviews from "@/components/PlaceReviews";

type PlaceModalProps = {
  place: PlaceDetail | null;
  open: boolean;
  onClose: () => void;
  onAddToJourney: (place: PlaceDetail) => void;
};

type Tab = "overview" | "reviews";

export default function PlaceModal({
  place,
  open,
  onClose,
  onAddToJourney,
}: PlaceModalProps) {
  const [tab, setTab] = useState<Tab>("overview");

  if (!open || !place) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-xl">
        {place.coverImage ? (
          <img
            src={place.coverImage}
            alt={place.name}
            className="h-64 w-full rounded-t-2xl object-cover"
          />
        ) : (
          <div className="flex h-64 w-full items-center justify-center rounded-t-2xl bg-slate-100 text-sm text-slate-500">
            No image
          </div>
        )}

        <div className="p-6">
          <p className="text-sm text-gray-500">
            {place.province} · {place.region}
          </p>

          <h2 className="text-2xl font-bold">{place.name}</h2>

          <div className="mt-5 grid grid-cols-2 rounded-xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setTab("overview")}
              className={
                tab === "overview"
                  ? "rounded-lg bg-white px-4 py-2 text-sm font-semibold shadow-sm"
                  : "rounded-lg px-4 py-2 text-sm font-medium text-slate-500"
              }
            >
              Tổng quan
            </button>

            <button
              type="button"
              onClick={() => setTab("reviews")}
              className={
                tab === "reviews"
                  ? "rounded-lg bg-white px-4 py-2 text-sm font-semibold shadow-sm"
                  : "rounded-lg px-4 py-2 text-sm font-medium text-slate-500"
              }
            >
              Đánh giá
            </button>
          </div>

          {tab === "overview" && (
            <>
              <p className="mt-5 text-sm leading-6 text-gray-600">
                {place.shortDescription}
              </p>

              {place.attractions.length > 0 && (
                <section className="mt-6">
                  <h3 className="font-semibold">Địa danh nổi bật</h3>

                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    {place.attractions.map((item) => (
                      <div
                        key={item.name}
                        className="overflow-hidden rounded-xl border"
                      >
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="h-32 w-full object-cover"
                          />
                        ) : null}

                        <div className="p-3">
                          <p className="font-medium">{item.name}</p>
                          <p className="mt-1 text-sm text-gray-500">
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
                  <h3 className="font-semibold">Món ăn nên thử</h3>

                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    {place.foods.map((item) => (
                      <div
                        key={item.name}
                        className="overflow-hidden rounded-xl border"
                      >
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="h-32 w-full object-cover"
                          />
                        ) : null}

                        <div className="p-3">
                          <p className="font-medium">{item.name}</p>
                          <p className="mt-1 text-sm text-gray-500">
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

          <div className="mt-6 flex justify-end gap-3">
            <button
              className="rounded-lg border px-4 py-2 text-sm"
              onClick={onClose}
            >
              Đóng
            </button>

            <button
              className="rounded-lg bg-black px-4 py-2 text-sm text-white"
              onClick={() => onAddToJourney(place)}
            >
              Add to Journey
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}