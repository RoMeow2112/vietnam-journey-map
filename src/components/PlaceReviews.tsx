import { useEffect, useMemo, useState } from "react";
import { ImagePlus, Star, Trash2, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import {
  adminDeleteReviewWithMedia,
  deleteReviewWithMedia,
  getPlaceReviews,
  getReviewUserEmail,
  type PlaceReview,
  type ReviewMediaItem,
  uploadReviewMedia,
  upsertPlaceReview,
} from "@/services/reviewService";

type PlaceReviewsProps = {
  placeId: string;
};

export default function PlaceReviews({ placeId }: PlaceReviewsProps) {
  const [reviews, setReviews] = useState<PlaceReview[]>([]);
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState("");
  const [files, setFiles] = useState<File[]>([]);

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const averageRating = useMemo(() => {
    if (reviews.length === 0) return 0;
    return reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
  }, [reviews]);

  async function loadAuth() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const user = session?.user;

    if (!user) {
      setCurrentUserId(null);
      setIsAdmin(false);
      return;
    }

    setCurrentUserId(user.id);

    const { data } = await supabase
      .from("profiles")
      .select("role,is_active")
      .eq("id", user.id)
      .maybeSingle();

    setIsAdmin(data?.role === "admin" && data?.is_active === true);
  }

  async function loadReviews() {
    setLoading(true);

    const { data, error } = await getPlaceReviews(placeId);

    if (error) {
      console.error(error);
      setReviews([]);
    } else {
      setReviews((data || []) as unknown as PlaceReview[]);
    }

    setLoading(false);
  }

  function handleSelectFiles(selectedFiles: FileList | null) {
    if (!selectedFiles) return;

    const nextFiles = Array.from(selectedFiles);
    const mergedFiles = [...files, ...nextFiles].slice(0, 3);

    setFiles(mergedFiles);
  }

  function removeSelectedFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function submitReview() {
    if (!currentUserId) {
      alert("Vui lòng đăng nhập để đánh giá.");
      return;
    }

    if (!content.trim()) {
      alert("Vui lòng nhập nội dung đánh giá.");
      return;
    }

    setSubmitting(true);

    try {
      const media =
        files.length > 0
          ? await uploadReviewMedia({
              files,
              userId: currentUserId,
              placeId,
            })
          : [];

      const { error } = await upsertPlaceReview({
        place_id: placeId,
        user_id: currentUserId,
        rating,
        content: content.trim(),
        media_urls: media,
      });

      if (error) throw error;

      setContent("");
      setRating(5);
      setFiles([]);

      await loadReviews();
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Không gửi được đánh giá.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(review: PlaceReview) {
    const ok = confirm("Xoá đánh giá này?");
    if (!ok) return;

    try {
      if (isAdmin && review.user_id !== currentUserId) {
        await adminDeleteReviewWithMedia(review);
      } else {
        await deleteReviewWithMedia(review);
      }

      await loadReviews();
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Không xoá được review.");
    }
  }

  useEffect(() => {
    loadAuth();
    loadReviews();
  }, [placeId]);

  return (
    <div className="space-y-5">
      <div className="rounded-2xl bg-slate-50 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500">Đánh giá trung bình</p>

            <div className="mt-1 flex items-center gap-2">
              <span className="text-3xl font-bold text-slate-900">
                {averageRating ? averageRating.toFixed(1) : "0.0"}
              </span>
              <Star className="h-6 w-6 fill-yellow-400 text-yellow-400" />
            </div>
          </div>

          <div className="text-right">
            <p className="text-sm text-slate-500">Tổng đánh giá</p>
            <p className="mt-1 text-3xl font-bold text-slate-900">
              {reviews.length}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border p-4">
        <h3 className="mb-3 font-semibold text-slate-900">
          Viết đánh giá của bạn
        </h3>

        <div className="mb-3 flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              className="p-1"
            >
              <Star
                className={
                  star <= rating
                    ? "h-6 w-6 fill-yellow-400 text-yellow-400"
                    : "h-6 w-6 text-slate-300"
                }
              />
            </button>
          ))}
        </div>

        <textarea
          className="min-h-[100px] w-full rounded-xl border p-3 text-sm outline-none focus:border-emerald-500"
          placeholder="Chia sẻ cảm nhận của bạn về địa điểm này..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />

        <div className="mt-3">
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed p-4 text-sm text-slate-500 hover:border-emerald-500 hover:text-emerald-600">
            <ImagePlus className="h-5 w-5" />
            Upload ảnh/video dưới 10s, tối đa 3 file

            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime"
              multiple
              className="hidden"
              onChange={(e) => handleSelectFiles(e.target.files)}
            />
          </label>

          {files.length > 0 && (
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              {files.map((file, index) => (
                <div
                  key={`${file.name}-${index}`}
                  className="relative overflow-hidden rounded-xl border bg-slate-50"
                >
                  {file.type.startsWith("image/") ? (
                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      className="h-28 w-full object-cover"
                    />
                  ) : (
                    <video
                      src={URL.createObjectURL(file)}
                      className="h-28 w-full object-cover"
                      muted
                      controls
                    />
                  )}

                  <button
                    type="button"
                    onClick={() => removeSelectedFile(index)}
                    className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>

                  <div className="p-2 text-xs text-slate-500">
                    <p className="truncate">{file.name}</p>
                    <p>{(file.size / 1024 / 1024).toFixed(2)}MB</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={submitReview}
          disabled={submitting}
          className="mt-3 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          {submitting ? "Đang gửi..." : "Gửi đánh giá"}
        </button>
      </div>

      <div className="space-y-3">
        <h3 className="font-semibold text-slate-900">Review từ cộng đồng</h3>

        {loading && <p className="text-sm text-slate-500">Đang tải...</p>}

        {!loading && reviews.length === 0 && (
          <div className="rounded-xl border border-dashed p-4 text-sm text-slate-500">
            Chưa có đánh giá nào.
          </div>
        )}

        {reviews.map((review) => {
          const canDelete = review.user_id === currentUserId || isAdmin;

          return (
            <div key={review.id} className="rounded-2xl border p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-slate-900">
                    {getReviewUserEmail(review)}
                  </p>

                  <div className="mt-1 flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={
                          star <= review.rating
                            ? "h-4 w-4 fill-yellow-400 text-yellow-400"
                            : "h-4 w-4 text-slate-300"
                        }
                      />
                    ))}
                  </div>
                </div>

                {canDelete && (
                  <button
                    type="button"
                    onClick={() => handleDelete(review)}
                    className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                    title={isAdmin ? "Admin xoá review spam" : "Xoá review"}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>

              {review.content && (
                <p className="mt-3 text-sm leading-relaxed text-slate-600">
                  {review.content}
                </p>
              )}

              {review.media_urls?.length > 0 && (
                <ReviewMediaGrid media={review.media_urls} />
              )}

              <p className="mt-3 text-xs text-slate-400">
                {new Date(review.created_at).toLocaleString()}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ReviewMediaGrid({ media }: { media: ReviewMediaItem[] }) {
  return (
    <div className="mt-3 grid gap-3 md:grid-cols-3">
      {media.map((item) => (
        <div key={item.path} className="overflow-hidden rounded-xl border">
          {item.type === "image" ? (
            <img
              src={item.url}
              alt={item.name}
              className="h-32 w-full object-cover"
            />
          ) : (
            <video
              src={item.url}
              className="h-32 w-full object-cover"
              controls
            />
          )}

          <div className="p-2 text-xs text-slate-500">
            <p className="truncate">{item.name}</p>
          </div>
        </div>
      ))}
    </div>
  );
}