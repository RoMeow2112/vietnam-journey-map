import { useEffect, useMemo, useState } from "react";
import { Search, Star, Trash2 } from "lucide-react";
import {
  adminDeleteReviewWithMedia,
  getAdminReviews,
  type AdminPlaceReview,
} from "@/services/reviewService";
import { adminSupabase } from "@/lib/supabase";

export default function AdminReviews() {
  const [reviews, setReviews] = useState<AdminPlaceReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentAdminId, setCurrentAdminId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filteredReviews = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) return reviews;

    return reviews.filter((review) => {
      return (
        review.content?.toLowerCase().includes(keyword) ||
        review.user_name?.toLowerCase().includes(keyword) ||
        review.place_name?.toLowerCase().includes(keyword)
      );
    });
  }, [reviews, search]);

  const averageRating = useMemo(() => {
    if (reviews.length === 0) return 0;

    return (
      reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) /
      reviews.length
    );
  }, [reviews]);

  async function loadAdmin() {
    const {
      data: { session },
    } = await adminSupabase.auth.getSession();

    setCurrentAdminId(session?.user?.id || null);
  }

  async function loadReviews() {
    setLoading(true);

    const { data, error } = await getAdminReviews();

    if (error) {
      console.error(error);
      setReviews([]);
    } else {
      setReviews(data || []);
    }

    setLoading(false);
  }

  async function handleDelete(review: AdminPlaceReview) {
    if (!currentAdminId) {
      alert("Không tìm thấy admin hiện tại.");
      return;
    }

    const ok = confirm("Admin xoá mềm đánh giá này?");
    if (!ok) return;

    try {
      await adminDeleteReviewWithMedia(review, currentAdminId);
      await loadReviews();
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Không xoá được review.");
    }
  }

  useEffect(() => {
    loadAdmin();
    loadReviews();
  }, []);

  return (
    <div className="space-y-6">
      <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-xl">
        <h1 className="text-3xl font-semibold text-slate-900">Review Management</h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          Quản lý đánh giá cơ bản. User được review tự do, admin có quyền xoá mềm review spam hoặc không đúng sự thật.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Total Reviews" value={reviews.length} />
        <StatCard title="Average Rating" value={averageRating.toFixed(1)} />
        <StatCard
          title="Reviews With Media"
          value={reviews.filter((item) => item.media_urls?.length > 0).length}
        />
      </div>

      <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-xl">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Review List</h2>
            <p className="mt-1 text-sm text-slate-500">
              Tìm kiếm và quản lý nội dung review.
            </p>
          </div>

          <div className="relative w-full md:w-96">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search content, user, place..."
              className="w-full rounded-3xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-emerald-500 focus:bg-white"
            />
          </div>
        </div>

        {loading ? (
          <div className="rounded-3xl border border-dashed border-slate-200 p-6 text-sm text-slate-500">
            Loading reviews...
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 p-6 text-sm text-slate-500">
            Không có review nào.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-slate-600">
                <tr>
                  <th className="p-4">User</th>
                  <th className="p-4">Place</th>
                  <th className="p-4">Rating</th>
                  <th className="p-4">Content</th>
                  <th className="p-4">Media</th>
                  <th className="p-4">Created</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200">
                {filteredReviews.map((review) => (
                  <tr key={review.id} className="transition hover:bg-slate-50">
                    <td className="p-4 font-medium text-slate-900">
                      {review.user_name || "Ẩn danh"}
                    </td>

                    <td className="p-4 text-slate-600">
                      {review.place_name || review.place_id}
                    </td>

                    <td className="p-4">
                      <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
                        {review.rating}
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      </div>
                    </td>

                    <td className="max-w-[360px] p-4 text-slate-600">
                      <div className="line-clamp-3">{review.content || "-"}</div>
                    </td>

                    <td className="p-4 text-slate-600">{review.media_urls?.length || 0}</td>

                    <td className="p-4 text-slate-500">
                      {new Date(review.created_at).toLocaleString()}
                    </td>

                    <td className="p-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleDelete(review)}
                        className="inline-flex items-center gap-2 rounded-3xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-100"
                      >
                        <Trash2 className="h-4 w-4" />
                        Xoá mềm
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
}: {
  title: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className="text-sm text-slate-500">{title}</div>
      <div className="mt-1 text-3xl font-bold text-slate-900">{value}</div>
    </div>
  );
}