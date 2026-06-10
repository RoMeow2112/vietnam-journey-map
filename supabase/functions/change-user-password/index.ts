// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
// deno-lint-ignore-file no-undef no-explicit-any
/// <reference lib="deno.ns" />

import { createClient } from "@supabase/functions-js";

type ChangePasswordBody = {
  userId?: string;
  newPassword?: string;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({
        error: "METHOD_NOT_ALLOWED",
        message: "Only POST is allowed.",
      }),
      {
        status: 405,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      },
    );
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(
        JSON.stringify({
          error: "MISSING_ENV",
          message:
            "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in Edge Function environment.",
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    const authHeader = req.headers.get("Authorization");

    if (!authHeader) {
      return new Response(
        JSON.stringify({
          error: "UNAUTHORIZED",
          message: "Missing Authorization header.",
        }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    const token = authHeader.replace("Bearer ", "").trim();

    if (!token) {
      return new Response(
        JSON.stringify({
          error: "UNAUTHORIZED",
          message: "Invalid Authorization token.",
        }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const {
      data: { user: caller },
      error: callerError,
    } = await supabaseAdmin.auth.getUser(token);

    if (callerError || !caller) {
      return new Response(
        JSON.stringify({
          error: "UNAUTHORIZED",
          message: "Invalid admin session.",
        }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    const { data: callerProfile, error: callerProfileError } =
      await supabaseAdmin
        .from("profiles")
        .select("id,email,role,is_active")
        .eq("id", caller.id)
        .maybeSingle();

    if (callerProfileError) {
      console.error("[callerProfileError]", callerProfileError);

      return new Response(
        JSON.stringify({
          error: "PROFILE_CHECK_FAILED",
          message: "Cannot verify admin profile.",
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    if (
      !callerProfile ||
      callerProfile.role !== "admin" ||
      callerProfile.is_active !== true
    ) {
      return new Response(
        JSON.stringify({
          error: "FORBIDDEN",
          message: "Only active admin can change user password.",
        }),
        {
          status: 403,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    let body: ChangePasswordBody;

    try {
      body = (await req.json()) as ChangePasswordBody;
    } catch (_error) {
      return new Response(
        JSON.stringify({
          error: "INVALID_BODY",
          message: "Invalid JSON body.",
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    const userId = body.userId?.trim();
    const newPassword = body.newPassword?.trim();

    if (!userId) {
      return new Response(
        JSON.stringify({
          error: "INVALID_USER_ID",
          message: "Missing userId.",
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    if (!newPassword || newPassword.length < 6) {
      return new Response(
        JSON.stringify({
          error: "INVALID_PASSWORD",
          message: "Mật khẩu tối thiểu 6 ký tự.",
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    if (userId === caller.id) {
      return new Response(
        JSON.stringify({
          error: "SELF_PASSWORD_CHANGE_BLOCKED",
          message: "Admin không thể đổi mật khẩu chính mình ở màn hình này.",
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    const { data: targetProfile, error: targetProfileError } =
      await supabaseAdmin
        .from("profiles")
        .select("id,email,display_name,role,is_active")
        .eq("id", userId)
        .maybeSingle();

    if (targetProfileError) {
      console.error("[targetProfileError]", targetProfileError);

      return new Response(
        JSON.stringify({
          error: "TARGET_PROFILE_CHECK_FAILED",
          message: "Cannot verify target user profile.",
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    if (!targetProfile) {
      return new Response(
        JSON.stringify({
          error: "TARGET_NOT_FOUND",
          message: "Không tìm thấy profile của user này.",
        }),
        {
          status: 404,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    if (targetProfile.role === "admin") {
      return new Response(
        JSON.stringify({
          error: "CANNOT_CHANGE_ADMIN_PASSWORD",
          message: "Không cho phép đổi mật khẩu của admin khác tại đây.",
        }),
        {
          status: 403,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    const { data: targetAuthUser, error: getTargetAuthError } =
      await supabaseAdmin.auth.admin.getUserById(userId);

    if (getTargetAuthError || !targetAuthUser?.user) {
      console.error("[getTargetAuthError]", getTargetAuthError);

      return new Response(
        JSON.stringify({
          error: "TARGET_AUTH_USER_NOT_FOUND",
          message:
            "User này không tồn tại trong Supabase Auth nên không thể đổi mật khẩu.",
        }),
        {
          status: 404,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    const { error: updateError } =
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: newPassword,
      });

    if (updateError) {
      console.error("[updateUserById error]", updateError);

      return new Response(
        JSON.stringify({
          error: "UPDATE_PASSWORD_FAILED",
          message: updateError.message || "Không đổi được mật khẩu.",
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    return new Response(
      JSON.stringify({
        ok: true,
        message: "Đổi mật khẩu thành công.",
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      },
    );
  } catch (error) {
    console.error("[change-user-password error]", error);

    return new Response(
      JSON.stringify({
        error: "INTERNAL_ERROR",
        message: "Unexpected server error.",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      },
    );
  }
});