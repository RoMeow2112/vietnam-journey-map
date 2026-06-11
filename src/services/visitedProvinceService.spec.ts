/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getMyVisitedProvinces, markProvinceVisited } from "./visitedProvinceService";
import { supabase } from "@/lib/supabase";

// Mock supabase
vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
    },
    from: vi.fn(),
  },
}));

describe("visitedProvinceService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("getMyVisitedProvinces", () => {
    it("should return empty array when no user session", async () => {
      (supabase.auth.getSession as any).mockResolvedValueOnce({
        data: { session: null },
      });

      const result = await getMyVisitedProvinces();

      expect(result).toEqual([]);
    });

    it("should fetch visited provinces for authenticated user", async () => {
      const mockProvinces = [
        {
          id: "1",
          user_id: "user123",
          province_key: "hanoi",
          province_name: "Hà Nội",
          visited_at: "2024-01-01T00:00:00Z",
        },
        {
          id: "2",
          user_id: "user123",
          province_key: "ho-chi-minh",
          province_name: "Thành phố Hồ Chí Minh",
          visited_at: "2024-01-02T00:00:00Z",
        },
      ];

      (supabase.auth.getSession as any).mockResolvedValueOnce({
        data: { session: { user: { id: "user123" } } },
      });

      const mockSelect = vi.fn().mockReturnValueOnce({
        eq: vi.fn().mockReturnValueOnce({
          order: vi.fn().mockResolvedValueOnce({
            data: mockProvinces,
            error: null,
          }),
        }),
      });

      (supabase.from as any).mockReturnValueOnce({
        select: mockSelect,
      });

      const result = await getMyVisitedProvinces();

      expect(result).toEqual(mockProvinces);
      expect(supabase.from).toHaveBeenCalledWith("user_visited_provinces");
    });

    it("should throw error on database failure", async () => {
      (supabase.auth.getSession as any).mockResolvedValueOnce({
        data: { session: { user: { id: "user123" } } },
      });

      const mockError = new Error("Database error");
      const mockSelect = vi.fn().mockReturnValueOnce({
        eq: vi.fn().mockReturnValueOnce({
          order: vi.fn().mockResolvedValueOnce({
            data: null,
            error: mockError,
          }),
        }),
      });

      (supabase.from as any).mockReturnValueOnce({
        select: mockSelect,
      });

      await expect(getMyVisitedProvinces()).rejects.toThrow("Database error");
    });

    it("should order provinces by visited_at descending", async () => {
      (supabase.auth.getSession as any).mockResolvedValueOnce({
        data: { session: { user: { id: "user123" } } },
      });

      const mockOrderCall = vi.fn().mockResolvedValueOnce({
        data: [],
        error: null,
      });

      const mockEqCall = vi.fn().mockReturnValueOnce({
        order: mockOrderCall,
      });

      const mockSelectCall = vi.fn().mockReturnValueOnce({
        eq: mockEqCall,
      });

      (supabase.from as any).mockReturnValueOnce({
        select: mockSelectCall,
      });

      await getMyVisitedProvinces();

      expect(mockOrderCall).toHaveBeenCalledWith("visited_at", {
        ascending: false,
      });
    });
  });

  describe("markProvinceVisited", () => {
    it("should throw error when user not authenticated", async () => {
      (supabase.auth.getSession as any).mockResolvedValueOnce({
        data: { session: null },
      });

      await expect(
        markProvinceVisited("hanoi", "Hà Nội")
      ).rejects.toThrow("AUTH_REQUIRED");
    });

    it("should mark province as visited", async () => {
      const mockResult = {
        id: "1",
        user_id: "user123",
        province_key: "hanoi",
        province_name: "Hà Nội",
        visited_at: "2024-01-01T00:00:00Z",
      };

      (supabase.auth.getSession as any).mockResolvedValueOnce({
        data: { session: { user: { id: "user123" } } },
      });

      const mockSingle = vi.fn().mockResolvedValueOnce({
        data: mockResult,
        error: null,
      });

      const mockSelect = vi.fn().mockReturnValueOnce({
        single: mockSingle,
      });

      const mockUpsert = vi.fn().mockReturnValueOnce({
        select: mockSelect,
      });

      (supabase.from as any).mockReturnValueOnce({
        upsert: mockUpsert,
      });

      // Mock window.dispatchEvent
      global.window.dispatchEvent = vi.fn();

      const result = await markProvinceVisited("hanoi", "Hà Nội");

      expect(result).toEqual(mockResult);
      expect(supabase.from).toHaveBeenCalledWith("user_visited_provinces");
      expect(mockUpsert).toHaveBeenCalledWith(
        {
          user_id: "user123",
          province_key: "hanoi",
          province_name: "Hà Nội",
        },
        {
          onConflict: "user_id,province_key",
        }
      );
    });

    it("should dispatch visited-provinces-updated event", async () => {
      const mockResult = {
        id: "1",
        user_id: "user123",
        province_key: "hanoi",
        province_name: "Hà Nội",
        visited_at: "2024-01-01T00:00:00Z",
      };

      (supabase.auth.getSession as any).mockResolvedValueOnce({
        data: { session: { user: { id: "user123" } } },
      });

      const mockSingle = vi.fn().mockResolvedValueOnce({
        data: mockResult,
        error: null,
      });

      const mockSelect = vi.fn().mockReturnValueOnce({
        single: mockSingle,
      });

      const mockUpsert = vi.fn().mockReturnValueOnce({
        select: mockSelect,
      });

      (supabase.from as any).mockReturnValueOnce({
        upsert: mockUpsert,
      });

      const dispatchEventSpy = vi.spyOn(window, "dispatchEvent");

      await markProvinceVisited("hanoi", "Hà Nội");

      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "visited-provinces-updated",
        })
      );

      dispatchEventSpy.mockRestore();
    });

    it("should throw error when upsert fails", async () => {
      (supabase.auth.getSession as any).mockResolvedValueOnce({
        data: { session: { user: { id: "user123" } } },
      });

      const mockError = new Error("Upsert failed");
      const mockSingle = vi
        .fn()
        .mockResolvedValueOnce({ data: null, error: mockError });

      const mockSelect = vi.fn().mockReturnValueOnce({
        single: mockSingle,
      });

      const mockUpsert = vi.fn().mockReturnValueOnce({
        select: mockSelect,
      });

      (supabase.from as any).mockReturnValueOnce({
        upsert: mockUpsert,
      });

      await expect(
        markProvinceVisited("hanoi", "Hà Nội")
      ).rejects.toThrow("Upsert failed");
    });

    it("should handle province with special characters", async () => {
      const mockResult = {
        id: "1",
        user_id: "user123",
        province_key: "ho-chi-minh",
        province_name: "Thành phố Hồ Chí Minh",
        visited_at: "2024-01-01T00:00:00Z",
      };

      (supabase.auth.getSession as any).mockResolvedValueOnce({
        data: { session: { user: { id: "user123" } } },
      });

      const mockSingle = vi.fn().mockResolvedValueOnce({
        data: mockResult,
        error: null,
      });

      const mockSelect = vi.fn().mockReturnValueOnce({
        single: mockSingle,
      });

      const mockUpsert = vi.fn().mockReturnValueOnce({
        select: mockSelect,
      });

      (supabase.from as any).mockReturnValueOnce({
        upsert: mockUpsert,
      });

      global.window.dispatchEvent = vi.fn();

      const result = await markProvinceVisited(
        "ho-chi-minh",
        "Thành phố Hồ Chí Minh"
      );

      expect(result.province_name).toBe("Thành phố Hồ Chí Minh");
      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          province_name: "Thành phố Hồ Chí Minh",
        }),
        expect.any(Object)
      );
    });
  });
});
