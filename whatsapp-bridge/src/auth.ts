import type { NextFunction, Request, Response } from "express";
import { config } from "./config.js";
import { supabaseAdmin } from "./supabaseAdmin.js";

export interface AuthedRequest extends Request {
  userId?: string;
}

/**
 * Validates the Supabase access token against Supabase Auth.
 * This avoids relying on the project's legacy JWT secret, which can differ
 * from the current signing configuration.
 */
export async function requireSupabaseAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";

  if (!token) {
    return res.status(401).json({ error: "Missing Authorization header" });
  }

  try {
    const response = await fetch(`${config.supabaseUrl}/auth/v1/user`, {
      headers: {
        apikey: config.supabaseServiceRoleKey,
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    const user = (await response.json()) as { id?: string };
    if (!user.id) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    req.userId = user.id;
    return next();
  } catch (error) {
    console.error("Supabase token validation failed:", error);
    return res.status(502).json({ error: "Não foi possível validar a sessão no Supabase." });
  }
}

/** Use after requireSupabaseAuth to restrict a route to Super Admin users. */
export async function requireAdmin(req: AuthedRequest, res: Response, next: NextFunction) {
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", req.userId)
    .eq("role", "admin")
    .maybeSingle();

  if (error || !data) {
    return res.status(403).json({ error: "Acesso restrito ao Super Admin." });
  }

  next();
}
