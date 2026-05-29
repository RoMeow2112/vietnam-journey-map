import { adminSupabase, supabase } from "@/lib/supabase";

export const REVIEW_MEDIA_BUCKET = "review-media";

export type ReviewMediaType = "image" | "video";

export type ReviewMediaItem = {
  path: string;
  url: string;
  type: ReviewMediaType;
  name: string;
  size: number;
};

export type ReviewProfile =
  | {
      display_name: string | null;
    }
  | {
      display_name: string | null;
    }[]
  | null;

export type PlaceReview = {
  id: string;
  place_id: string;
  user_id: string;
  rating: number;
  content: string | null;
  media_urls: ReviewMediaItem[];
  created_at: string;
  updated_at?: string | null;
  deleted_at?: string | null;
  deleted_by?: string | null;
  profiles?: ReviewProfile;
};

export type AdminPlaceReview = PlaceReview & {
  user_name?: string;
  place_name?: string;
};

export type UpsertPlaceReviewPayload = {
  place_id: string;
  user_id: string;
  rating: number;
  content: string;
  media_urls?: ReviewMediaItem[];
};

export function getReviewUserEmail(review: PlaceReview) {
  const profile = Array.isArray(review.profiles)
    ? review.profiles[0]
    : review.profiles;

  return profile?.display_name || "Ẩn danh";
}

export function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";

    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);
      resolve(video.duration);
    };

    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      reject(new Error("Không đọc được thời lượng video."));
    };

    video.src = URL.createObjectURL(file);
  });
}

function getFileExtension(file: File) {
  const ext = file.name.split(".").pop();

  if (!ext) {
    if (file.type === "image/jpeg") return "jpg";
    if (file.type === "image/png") return "png";
    if (file.type === "image/webp") return "webp";
    if (file.type === "video/mp4") return "mp4";
    if (file.type === "video/webm") return "webm";
    if (file.type === "video/quicktime") return "mov";
  }

  return ext || "bin";
}

function isAllowedImage(file: File) {
  return ["image/jpeg", "image/png", "image/webp"].includes(file.type);
}

function isAllowedVideo(file: File) {
  return ["video/mp4", "video/webm", "video/quicktime"].includes(file.type);
}

export async function validateReviewFile(file: File) {
  const isImage = isAllowedImage(file);
  const isVideo = isAllowedVideo(file);

  if (!isImage && !isVideo) {
    throw new Error("Chỉ hỗ trợ ảnh JPG/PNG/WEBP hoặc video MP4/WEBM/MOV.");
  }

  if (file.size > 20 * 1024 * 1024) {
    throw new Error("File tối đa 20MB.");
  }

  if (isVideo) {
    const duration = await getVideoDuration(file);

    if (duration > 10) {
      throw new Error("Video phải dưới 10 giây.");
    }
  }
}

export async function uploadReviewMedia(params: {
  files: File[];
  userId: string;
  placeId: string;
}) {
  const { files, userId, placeId } = params;

  if (files.length > 3) {
    throw new Error("Tối đa 3 file cho mỗi đánh giá.");
  }

  const uploaded: ReviewMediaItem[] = [];

  for (const file of files) {
    await validateReviewFile(file);

    const isVideo = isAllowedVideo(file);
    const ext = getFileExtension(file);
    const path = `${userId}/${placeId}/${crypto.randomUUID()}.${ext}`;

    const { error } = await supabase.storage
      .from(REVIEW_MEDIA_BUCKET)
      .upload(path, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });

    if (error) throw error;

    const { data } = supabase.storage
      .from(REVIEW_MEDIA_BUCKET)
      .getPublicUrl(path);

    uploaded.push({
      path,
      url: data.publicUrl,
      type: isVideo ? "video" : "image",
      name: file.name,
      size: file.size,
    });
  }

  return uploaded;
}

export async function removeReviewMedia(media: ReviewMediaItem[]) {
  const paths = media.map((item) => item.path).filter(Boolean);

  if (paths.length === 0) {
    return { error: null };
  }

  return supabase.storage.from(REVIEW_MEDIA_BUCKET).remove(paths);
}

export async function adminRemoveReviewMedia(media: ReviewMediaItem[]) {
  const paths = media.map((item) => item.path).filter(Boolean);

  if (paths.length === 0) {
    return { error: null };
  }

  return adminSupabase.storage.from(REVIEW_MEDIA_BUCKET).remove(paths);
}

export async function getPlaceReviews(placeId: string) {
  const { data: reviews, error } = await supabase
    .from("place_reviews")
    .select(`
      id,
      place_id,
      user_id,
      rating,
      content,
      media_urls,
      created_at,
      updated_at,
      deleted_at,
      deleted_by
    `)
    .eq("place_id", placeId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Load reviews error:", error);
    return { data: null, error };
  }

  const userIds = [
    ...new Set((reviews || []).map((item) => item.user_id).filter(Boolean)),
  ];

  if (userIds.length === 0) {
    return { data: reviews || [], error: null };
  }

  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select("id,display_name")
    .in("id", userIds);

  if (profileError) {
    console.error("Load review profiles error:", profileError);
    return { data: reviews || [], error: null };
  }

  const profileMap = new Map(
    (profiles || []).map((profile) => [
      String(profile.id),
      profile.display_name?.trim() || `User ${String(profile.id).slice(0, 8)}`,
    ]),
  );

  const reviewsWithProfiles = (reviews || []).map((review) => ({
    ...review,
    profiles: {
      display_name: profileMap.get(String(review.user_id)) || "Ẩn danh",
    },
  }));

  return {
    data: reviewsWithProfiles,
    error: null,
  };
}

export async function upsertPlaceReview(payload: UpsertPlaceReviewPayload) {
  return supabase.from("place_reviews").upsert(
    {
      ...payload,
      deleted_at: null,
      deleted_by: null,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "place_id,user_id",
    },
  );
}

export async function softDeletePlaceReview(reviewId: string, deletedBy: string) {
  return supabase
    .from("place_reviews")
    .update({
      deleted_at: new Date().toISOString(),
      deleted_by: deletedBy,
      updated_at: new Date().toISOString(),
    })
    .eq("id", reviewId)
    .is("deleted_at", null);
}

export async function adminSoftDeletePlaceReview(
  reviewId: string,
  deletedBy: string,
) {
  return adminSupabase
    .from("place_reviews")
    .update({
      deleted_at: new Date().toISOString(),
      deleted_by: deletedBy,
      updated_at: new Date().toISOString(),
    })
    .eq("id", reviewId)
    .is("deleted_at", null);
}

export async function deleteReviewWithMedia(
  review: PlaceReview,
  deletedBy: string,
) {
  const { error } = await softDeletePlaceReview(review.id, deletedBy);
  if (error) throw error;
}

export async function adminDeleteReviewWithMedia(
  review: PlaceReview,
  deletedBy: string,
) {
  const { error } = await adminSoftDeletePlaceReview(review.id, deletedBy);
  if (error) throw error;
}

export async function getAdminReviews() {
  const { data: reviews, error } = await adminSupabase
    .from("place_reviews")
    .select(`
      id,
      place_id,
      user_id,
      rating,
      content,
      media_urls,
      created_at,
      updated_at,
      deleted_at,
      deleted_by
    `)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    return { data: null, error };
  }

  const userIds = [
    ...new Set((reviews || []).map((item) => item.user_id).filter(Boolean)),
  ];

  const placeIds = [
    ...new Set((reviews || []).map((item) => item.place_id).filter(Boolean)),
  ];

  const [{ data: profiles }, { data: places }] = await Promise.all([
    userIds.length
      ? adminSupabase.from("profiles").select("id,display_name").in("id", userIds)
      : Promise.resolve({ data: [] }),

    placeIds.length
      ? adminSupabase.from("places").select("id,name,province").in("id", placeIds)
      : Promise.resolve({ data: [] }),
  ]);

  const profileMap = new Map(
    (profiles || []).map((profile) => [
      String(profile.id),
      profile.display_name?.trim() || `User ${String(profile.id).slice(0, 8)}`,
    ]),
  );

  const placeMap = new Map(
    (places || []).map((place) => [
      String(place.id),
      `${place.name}${place.province ? ` - ${place.province}` : ""}`,
    ]),
  );

  const normalizedReviews: AdminPlaceReview[] = (reviews || []).map((review) => ({
    ...review,
    user_name: profileMap.get(String(review.user_id)) || "Ẩn danh",
    place_name: placeMap.get(String(review.place_id)) || review.place_id,
  }));

  return {
    data: normalizedReviews,
    error: null,
  };
}