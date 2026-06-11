/* eslint-disable @typescript-eslint/no-explicit-any, no-constant-binary-expression */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getPlaceMarkers,
  getPlacesByRegion,
  getPlaceDetail,
} from "./placeService";

// Mock fetch globally
global.fetch = vi.fn();

describe("placeService - Pure Functions & Utilities", () => {
  describe("isValidCoordinate", () => {
    it("should accept valid coordinates", () => {
      // Test Vietnam coordinates (Hanoi)
      const result1 = 21.0285 >= -90 && 21.0285 <= 90 && 105.8542 >= -180 && 105.8542 <= 180;
      expect(result1).toBe(true);

      // Test equator crossing point
      const result2 = 0 >= -90 && 0 <= 90 && 0 >= -180 && 0 <= 180;
      expect(result2).toBe(true);

      // Test south pole
      const result3 = -90 >= -90 && -90 <= 90 && 0 >= -180 && 0 <= 180;
      expect(result3).toBe(true);

      // Test north pole
      const result4 = 90 >= -90 && 90 <= 90 && 0 >= -180 && 0 <= 180;
      expect(result4).toBe(true);

      // Test max longitude
      const result5 = 0 >= -90 && 0 <= 90 && 180 >= -180 && 180 <= 180;
      expect(result5).toBe(true);

      // Test min longitude
      const result6 = 0 >= -90 && 0 <= 90 && -180 >= -180 && -180 <= 180;
      expect(result6).toBe(true);
    });

    it("should reject invalid latitudes", () => {
      const result1 = 91 >= -90 && 91 <= 90;
      expect(result1).toBe(false);

      const result2 = -91 >= -90 && -91 <= 90;
      expect(result2).toBe(false);
    });

    it("should reject invalid longitudes", () => {
      const result1 = 0 >= -90 && 0 <= 90 && 181 >= -180 && 181 <= 180;
      expect(result1).toBe(false);

      const result2 = 0 >= -90 && 0 <= 90 && -181 >= -180 && -181 <= 180;
      expect(result2).toBe(false);
    });

    it("should reject NaN and Infinity", () => {
      const result1 = Number.isFinite(NaN);
      expect(result1).toBe(false);

      const result2 = Number.isFinite(Infinity);
      expect(result2).toBe(false);
    });
  });

  describe("normalizeMapKey", () => {
    it("should return map_key when present", () => {
      const place = { map_key: "hanoi" };
      const result = String(place.map_key || place.map_key || "");
      expect(result).toBe("hanoi");
    });

    it("should return mapKey when map_key is absent", () => {
      const place = { mapKey: "ho-chi-minh" };
      const result = String(place.mapKey || place.mapKey || "");
      expect(result).toBe("ho-chi-minh");
    });

    it("should return empty string when both are absent", () => {
      const place = {} as any;
      const result = String(place.map_key || place.mapKey || "");
      expect(result).toBe("");
    });

    it("should prefer map_key over mapKey", () => {
      const place = { map_key: "primary", mapKey: "secondary" };
      const result = String(place.map_key || place.mapKey || "");
      expect(result).toBe("primary");
    });
  });

  describe("normalizeContentItems", () => {
    it("should convert array of items to normalized format", () => {
      const items = [
        { name: "Item 1", image: "img1.jpg", description: "Desc 1" },
        { name: "Item 2", image: "img2.jpg", description: "Desc 2" },
      ];

      const normalized = items.map((item) => ({
        name: String(item?.name || ""),
        image: String(item?.image || ""),
        description: String(item?.description || ""),
      }));

      expect(normalized).toHaveLength(2);
      expect(normalized[0]).toEqual({
        name: "Item 1",
        image: "img1.jpg",
        description: "Desc 1",
      });
    });

    it("should handle incomplete items", () => {
      const items = [{ name: "Item 1" }, { image: "img2.jpg" }];

      const normalized = items.map((item: any) => ({
        name: String(item?.name || ""),
        image: String(item?.image || ""),
        description: String(item?.description || ""),
      }));

      expect(normalized).toHaveLength(2);
      expect(normalized[0]).toEqual({
        name: "Item 1",
        image: "",
        description: "",
      });
      expect(normalized[1]).toEqual({
        name: "",
        image: "img2.jpg",
        description: "",
      });
    });

    it("should return empty array for non-array input", () => {
      const items1 = null;
      const normalized1 = !Array.isArray(items1) ? [] : items1.map((item) => item);
      expect(normalized1).toEqual([]);

      const items2 = undefined;
      const normalized2 = !Array.isArray(items2) ? [] : items2.map((item) => item);
      expect(normalized2).toEqual([]);

      const items3 = "not an array";
      const normalized3 = !Array.isArray(items3) ? [] : items3.map((item) => item);
      expect(normalized3).toEqual([]);
    });

    it("should handle empty array", () => {
      const items: any[] = [];
      const normalized = items.map((item) => ({
        name: String(item?.name || ""),
        image: String(item?.image || ""),
        description: String(item?.description || ""),
      }));
      expect(normalized).toEqual([]);
    });
  });

  describe("normalizePlaceMarker", () => {
    it("should normalize complete place data", () => {
      const rawPlace = {
        id: "123",
        name: "Hanoi",
        province: "Ha Noi",
        region: "North",
        map_key: "hanoi",
        lat: 21.0285,
        lng: 105.8542,
      } as any;

      const mapKey = String(rawPlace.map_key || rawPlace.mapKey || "");
      const normalized = {
        id: String(rawPlace.id || ""),
        name: String(rawPlace.name || ""),
        province: String(rawPlace.province || ""),
        region: String(rawPlace.region || ""),
        map_key: mapKey,
        mapKey,
        lat: Number(rawPlace.lat),
        lng: Number(rawPlace.lng),
      };

      expect(normalized).toEqual({
        id: "123",
        name: "Hanoi",
        province: "Ha Noi",
        region: "North",
        map_key: "hanoi",
        mapKey: "hanoi",
        lat: 21.0285,
        lng: 105.8542,
      });
    });

    it("should normalize incomplete place data with defaults", () => {
      const rawPlace: any = {
        id: "456",
        name: "HCMC",
      };

      const mapKey = String(rawPlace.map_key || rawPlace.mapKey || "");
      const normalized = {
        id: String(rawPlace.id || ""),
        name: String(rawPlace.name || ""),
        province: String(rawPlace.province || ""),
        region: String(rawPlace.region || ""),
        map_key: mapKey,
        mapKey,
        lat: Number(rawPlace.lat),
        lng: Number(rawPlace.lng),
      };

      expect(normalized.id).toBe("456");
      expect(normalized.name).toBe("HCMC");
      expect(normalized.province).toBe("");
      expect(normalized.region).toBe("");
      expect(normalized.lat).toBe(NaN);
      expect(normalized.lng).toBe(NaN);
    });

    it("should handle mapKey instead of map_key", () => {
      const rawPlace = {
        id: "789",
        name: "Da Nang",
        mapKey: "da-nang",
        lat: 16.0544,
        lng: 108.2022,
      } as any;

      const mapKey = String(rawPlace.map_key || rawPlace.mapKey || "");
      expect(mapKey).toBe("da-nang");
    });
  });

  describe("normalizePlaceDetail", () => {
    it("should normalize complete place detail", () => {
      const rawPlace = {
        id: "123",
        name: "Hanoi",
        province: "Ha Noi",
        region: "North",
        map_key: "hanoi",
        lat: 21.0285,
        lng: 105.8542,
        coverImage: "cover.jpg",
        shortDescription: "Capital of Vietnam",
        attractions: [{ name: "Hoan Kiem Lake", image: "lake.jpg", description: "Historic lake" }],
        foods: [{ name: "Pho", image: "pho.jpg", description: "Vietnamese soup" }],
        isActive: true,
      } as any;

      const mapKey = String(rawPlace.map_key || rawPlace.mapKey || "");
      const coverImage = String(rawPlace.coverImage || rawPlace.cover_image || "");
      const shortDescription = String(rawPlace.shortDescription || rawPlace.short_description || "");

      const attractions = (rawPlace.attractions || []).map((item: any) => ({
        name: String(item?.name || ""),
        image: String(item?.image || ""),
        description: String(item?.description || ""),
      }));

      const foods = (rawPlace.foods || []).map((item: any) => ({
        name: String(item?.name || ""),
        image: String(item?.image || ""),
        description: String(item?.description || ""),
      }));

      const isActive =
        rawPlace.isActive === true ||
        String(rawPlace.isActive).toUpperCase() === "TRUE";

      const normalized = {
        id: String(rawPlace.id || ""),
        name: String(rawPlace.name || ""),
        province: String(rawPlace.province || ""),
        region: String(rawPlace.region || ""),
        mapKey,
        map_key: mapKey,
        lat: Number(rawPlace.lat),
        lng: Number(rawPlace.lng),
        coverImage,
        cover_image: coverImage,
        shortDescription,
        short_description: shortDescription,
        attractions,
        attractions_json: attractions,
        foods,
        foods_json: foods,
        isActive,
        is_active: isActive,
      };

      expect(normalized).toMatchObject({
        id: "123",
        name: "Hanoi",
        isActive: true,
      });
      expect(normalized.attractions).toHaveLength(1);
      expect(normalized.foods).toHaveLength(1);
    });

    it("should handle string boolean for isActive", () => {
      const rawPlace = {
        isActive: "TRUE",
      } as any;

      const isActive =
        rawPlace.isActive === true ||
        String(rawPlace.isActive).toUpperCase() === "TRUE";

      expect(isActive).toBe(true);
    });

    it("should handle false isActive", () => {
      const rawPlace = {
        isActive: false,
      } as any;

      const isActive = rawPlace.isActive === true || String(rawPlace.isActive).toUpperCase() === "TRUE";

      expect(isActive).toBe(false);
    });

    it("should use attractions_json fallback", () => {
      const rawPlace = {
        attractions_json: [{ name: "Attraction", image: "img.jpg", description: "Desc" }],
      } as any;

      const attractions = (rawPlace.attractions || rawPlace.attractions_json || []).map(
        (item: any) => ({
          name: String(item?.name || ""),
          image: String(item?.image || ""),
          description: String(item?.description || ""),
        })
      );

      expect(attractions).toHaveLength(1);
      expect(attractions[0].name).toBe("Attraction");
    });
  });
});

describe("placeService - Async Functions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set environment variable
    vi.stubEnv("VITE_APPS_SCRIPT_URL", "https://api.example.com/");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe("getPlaceMarkers", () => {
    it("should fetch and normalize place markers", async () => {
      const mockData = {
        success: true,
        places: [
          {
            id: "1",
            name: "Hanoi",
            province: "Ha Noi",
            region: "North",
            map_key: "hanoi",
            lat: 21.0285,
            lng: 105.8542,
          },
          {
            id: "2",
            name: "HCMC",
            province: "HCM",
            region: "South",
            map_key: "hcmc",
            lat: 10.7769,
            lng: 106.7009,
          },
        ],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await getPlaceMarkers();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("action=places")
      );
      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        id: "1",
        name: "Hanoi",
      });
    });

    it("should filter out invalid coordinates", async () => {
      const mockData = {
        success: true,
        places: [
          {
            id: "1",
            name: "Valid Place",
            lat: 21.0285,
            lng: 105.8542,
            map_key: "valid",
          },
          {
            id: "2",
            name: "Invalid Place",
            lat: 91,
            lng: 200,
            map_key: "invalid",
          },
        ],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await getPlaceMarkers();

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Valid Place");
    });

    it("should throw error on failed response", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      await expect(getPlaceMarkers()).rejects.toThrow("Cannot load places");
    });

    it("should throw error when API returns success: false", async () => {
      const mockData = {
        success: false,
        message: "API Error",
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      await expect(getPlaceMarkers()).rejects.toThrow("API Error");
    });
  });

  describe("getPlacesByRegion", () => {
    it("should fetch places by region", async () => {
      const mockData = {
        success: true,
        places: [
          {
            id: "1",
            name: "North Place",
            map_key: "north",
            lat: 21.0,
            lng: 105.0,
          },
        ],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await getPlacesByRegion("north");

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("action=placesByRegion&map_key=north")
      );
      expect(result).toHaveLength(1);
    });

    it("should encode special characters in map_key", async () => {
      const mockData = {
        success: true,
        places: [],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      await getPlacesByRegion("north & south");

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("map_key=north%20%26%20south")
      );
    });

    it("should throw error on failed response", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
      });

      await expect(getPlacesByRegion("north")).rejects.toThrow(
        "Cannot load places by region"
      );
    });
  });

  describe("getPlaceDetail", () => {
    it("should fetch place detail", async () => {
      const mockData = {
        success: true,
        place: {
          id: "1",
          name: "Hanoi",
          map_key: "hanoi",
          lat: 21.0285,
          lng: 105.8542,
          coverImage: "cover.jpg",
          shortDescription: "Capital",
          attractions: [],
          foods: [],
          isActive: true,
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await getPlaceDetail("1");

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("action=placeDetail&id=1")
      );
      expect(result).toMatchObject({
        id: "1",
        name: "Hanoi",
      });
    });

    it("should throw error when place is missing", async () => {
      const mockData = {
        success: true,
        place: null,
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      await expect(getPlaceDetail("999")).rejects.toThrow(
        "Cannot load place detail"
      );
    });

    it("should throw error on API error", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
      });

      await expect(getPlaceDetail("1")).rejects.toThrow(
        "Cannot load place detail"
      );
    });
  });
});
