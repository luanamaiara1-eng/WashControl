import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { config } from "./config.js";

export interface AuthedRequest extends Request {
  userId?: string;
}

/** Verifies the Supabase access token the frontend sends and attaches the business's user_id. */
export function requireSupabaseAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "Missing Authorization header" });
  }

  try {
    const payload = jwt.verify(token, config.supabaseJwtSecret) as jwt.JwtPayload;
    if (!payload.sub) throw new Error("Token has no subject");
    req.userId = payload.sub;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}
