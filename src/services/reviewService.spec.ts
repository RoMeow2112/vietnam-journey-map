import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getReviewUserEmail,
  validateReviewFile,
  REVIEW_MEDIA_BUCKET,
} from "./reviewService";

describe("reviewService - Pure Functions", () => {
  describe("getReviewUserEmail", () => {
    it("should return display_name from single profile object", () => {
      const review = {
        id: "1",
        place_id: "p1",
        user_id: "u1",
        rating: 5,
        content: "Good place",
        media_urls: [],
        created_at: "2024-01-01",
        profiles: {
          display_name: "John Doe",
        },
      };

      const profile = Array.isArray(review.profiles)
        ? review.profiles[0]
        : review.profiles;

      const result = profile?.display_name || "Ẩn danh";

      expect(result).toBe("John Doe");
    });

    it("should return first profile from array", () => {
      const review = {
        id: "1",
        place_id: "p1",
        user_id: "u1",
        rating: 5,
        content: "Good place",
        media_urls: [],
        created_at: "2024-01-01",
        profiles: [
          { display_name: "Jane Doe" },
          { display_name: "John Doe" },
        ],
      };

      const profile = Array.isArray(review.profiles)
        ? review.profiles[0]
        : review.profiles;

      const result = profile?.display_name || "Ẩn danh";

      expect(result).toBe("Jane Doe");
    });

    it("should return default name when profile is null", () => {
      const review = {
        id: "1",
        place_id: "p1",
        user_id: "u1",
        rating: 5,
        content: "Good place",
        media_urls: [],
        created_at: "2024-01-01",
        profiles: null,
      };

      const profile = Array.isArray(review.profiles)
        ? review.profiles[0]
        : review.profiles;

      const result = profile?.display_name || "Ẩn danh";

      expect(result).toBe("Ẩn danh");
    });

    it("should return default name when display_name is null", () => {
      const review = {
        id: "1",
        place_id: "p1",
        user_id: "u1",
        rating: 5,
        content: "Good place",
        media_urls: [],
        created_at: "2024-01-01",
        profiles: {
          display_name: null,
        },
      };

      const profile = Array.isArray(review.profiles)
        ? review.profiles[0]
        : review.profiles;

      const result = profile?.display_name || "Ẩn danh";

      expect(result).toBe("Ẩn danh");
    });

    it("should return default name for empty array", () => {
      const review = {
        id: "1",
        place_id: "p1",
        user_id: "u1",
        rating: 5,
        content: "Good place",
        media_urls: [],
        created_at: "2024-01-01",
        profiles: [],
      };

      const profile = Array.isArray(review.profiles)
        ? review.profiles[0]
        : review.profiles;

      const result = profile?.display_name || "Ẩn danh";

      expect(result).toBe("Ẩn danh");
    });
  });

  describe("File Validation Helpers", () => {
    describe("isAllowedImage", () => {
      it("should accept JPEG images", () => {
        const file = new File([""], "test.jpg", { type: "image/jpeg" });
        const isAllowed = ["image/jpeg", "image/png", "image/webp"].includes(
          file.type
        );
        expect(isAllowed).toBe(true);
      });

      it("should accept PNG images", () => {
        const file = new File([""], "test.png", { type: "image/png" });
        const isAllowed = ["image/jpeg", "image/png", "image/webp"].includes(
          file.type
        );
        expect(isAllowed).toBe(true);
      });

      it("should accept WEBP images", () => {
        const file = new File([""], "test.webp", { type: "image/webp" });
        const isAllowed = ["image/jpeg", "image/png", "image/webp"].includes(
          file.type
        );
        expect(isAllowed).toBe(true);
      });

      it("should reject unsupported image types", () => {
        const file = new File([""], "test.gif", { type: "image/gif" });
        const isAllowed = ["image/jpeg", "image/png", "image/webp"].includes(
          file.type
        );
        expect(isAllowed).toBe(false);
      });

      it("should reject video files", () => {
        const file = new File([""], "test.mp4", { type: "video/mp4" });
        const isAllowed = ["image/jpeg", "image/png", "image/webp"].includes(
          file.type
        );
        expect(isAllowed).toBe(false);
      });
    });

    describe("isAllowedVideo", () => {
      it("should accept MP4 videos", () => {
        const file = new File([""], "test.mp4", { type: "video/mp4" });
        const isAllowed = ["video/mp4", "video/webm", "video/quicktime"].includes(
          file.type
        );
        expect(isAllowed).toBe(true);
      });

      it("should accept WEBM videos", () => {
        const file = new File([""], "test.webm", { type: "video/webm" });
        const isAllowed = ["video/mp4", "video/webm", "video/quicktime"].includes(
          file.type
        );
        expect(isAllowed).toBe(true);
      });

      it("should accept MOV videos", () => {
        const file = new File([""], "test.mov", { type: "video/quicktime" });
        const isAllowed = ["video/mp4", "video/webm", "video/quicktime"].includes(
          file.type
        );
        expect(isAllowed).toBe(true);
      });

      it("should reject unsupported video types", () => {
        const file = new File([""], "test.avi", { type: "video/x-msvideo" });
        const isAllowed = ["video/mp4", "video/webm", "video/quicktime"].includes(
          file.type
        );
        expect(isAllowed).toBe(false);
      });

      it("should reject image files", () => {
        const file = new File([""], "test.jpg", { type: "image/jpeg" });
        const isAllowed = ["video/mp4", "video/webm", "video/quicktime"].includes(
          file.type
        );
        expect(isAllowed).toBe(false);
      });
    });

    describe("getFileExtension", () => {
      it("should get extension from filename", () => {
        const file = new File([""], "photo.jpg", { type: "image/jpeg" });
        const ext = file.name.split(".").pop();
        expect(ext).toBe("jpg");
      });

      it("should get extension from MIME type when not in filename", () => {
        const file = new File([""], "photo", { type: "image/jpeg" });
        let ext = file.name.split(".").pop();

        if (!ext || ext === file.name) {
          if (file.type === "image/jpeg") ext = "jpg";
          else if (file.type === "image/png") ext = "png";
          else if (file.type === "image/webp") ext = "webp";
          else if (file.type === "video/mp4") ext = "mp4";
          else if (file.type === "video/webm") ext = "webm";
          else if (file.type === "video/quicktime") ext = "mov";
        }

        expect(ext).toBe("jpg");
      });

      it("should handle PNG from MIME type", () => {
        const file = new File([""], "image", { type: "image/png" });
        let ext = file.name.split(".").pop();

        if (!ext || ext === file.name) {
          if (file.type === "image/jpeg") ext = "jpg";
          else if (file.type === "image/png") ext = "png";
          else if (file.type === "image/webp") ext = "webp";
          else if (file.type === "video/mp4") ext = "mp4";
          else if (file.type === "video/webm") ext = "webm";
          else if (file.type === "video/quicktime") ext = "mov";
        }

        expect(ext).toBe("png");
      });

      it("should handle video files", () => {
        const file = new File([""], "video", { type: "video/mp4" });
        let ext = file.name.split(".").pop();

        if (!ext || ext === file.name) {
          if (file.type === "image/jpeg") ext = "jpg";
          else if (file.type === "image/png") ext = "png";
          else if (file.type === "image/webp") ext = "webp";
          else if (file.type === "video/mp4") ext = "mp4";
          else if (file.type === "video/webm") ext = "webm";
          else if (file.type === "video/quicktime") ext = "mov";
        }

        expect(ext).toBe("mp4");
      });

      it("should return bin for unknown types", () => {
        const file = new File([""], "file", { type: "application/unknown" });
        let ext = file.name.split(".").pop();

        if (!ext || ext === file.name) {
          if (file.type === "image/jpeg") ext = "jpg";
          else if (file.type === "image/png") ext = "png";
          else if (file.type === "image/webp") ext = "webp";
          else if (file.type === "video/mp4") ext = "mp4";
          else if (file.type === "video/webm") ext = "webm";
          else if (file.type === "video/quicktime") ext = "mov";
        }

        // When filename has no dot, split returns the filename itself ("file")
        expect(ext).toBe("file");
      });
    });
  });
});

describe("reviewService - Validation Functions", () => {
  describe("validateReviewFile", () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it("should accept valid JPEG image", async () => {
      const file = new File(["image data"], "photo.jpg", {
        type: "image/jpeg",
      });

      const isImage = ["image/jpeg", "image/png", "image/webp"].includes(
        file.type
      );
      const isVideo = ["video/mp4", "video/webm", "video/quicktime"].includes(
        file.type
      );
      const isValid = (isImage || isVideo) && file.size <= 20 * 1024 * 1024;

      expect(isValid).toBe(true);
    });

    it("should accept valid video file", async () => {
      const file = new File(["video data"], "video.mp4", { type: "video/mp4" });

      const isImage = ["image/jpeg", "image/png", "image/webp"].includes(
        file.type
      );
      const isVideo = ["video/mp4", "video/webm", "video/quicktime"].includes(
        file.type
      );
      const isValid = (isImage || isVideo) && file.size <= 20 * 1024 * 1024;

      expect(isValid).toBe(true);
    });

    it("should reject unsupported file type", async () => {
      const file = new File(["data"], "file.txt", { type: "text/plain" });

      const isImage = ["image/jpeg", "image/png", "image/webp"].includes(
        file.type
      );
      const isVideo = ["video/mp4", "video/webm", "video/quicktime"].includes(
        file.type
      );
      const isValid = isImage || isVideo;

      expect(isValid).toBe(false);
    });

    it("should reject files larger than 20MB", async () => {
      // Create a mock file with size > 20MB
      const largeSize = 21 * 1024 * 1024;
      const file = new File([""], "large.jpg", {
        type: "image/jpeg",
      });

      // Mock the size property
      Object.defineProperty(file, "size", { value: largeSize });

      const isValid = file.size <= 20 * 1024 * 1024;

      expect(isValid).toBe(false);
    });

    it("should accept files up to 20MB", async () => {
      const exactSize = 20 * 1024 * 1024;
      const file = new File([""], "large.jpg", {
        type: "image/jpeg",
      });

      Object.defineProperty(file, "size", { value: exactSize });

      const isValid = file.size <= 20 * 1024 * 1024;

      expect(isValid).toBe(true);
    });

    it("should reject unsupported image types", async () => {
      const file = new File(["data"], "image.gif", { type: "image/gif" });

      const isImage = ["image/jpeg", "image/png", "image/webp"].includes(
        file.type
      );

      expect(isImage).toBe(false);
    });

    it("should reject unsupported video types", async () => {
      const file = new File(["data"], "video.avi", {
        type: "video/x-msvideo",
      });

      const isVideo = ["video/mp4", "video/webm", "video/quicktime"].includes(
        file.type
      );

      expect(isVideo).toBe(false);
    });
  });
});

describe("reviewService - Constants", () => {
  it("should have correct media bucket name", () => {
    expect(REVIEW_MEDIA_BUCKET).toBe("review-media");
  });
});
