import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";

export async function getAuthUser(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  if (!token) return null;

  try {
    const secret = process.env.JWT_SECRET || "default_secret";
    // jwt.verify throws if invalid
    const decoded = jwt.verify(token, secret);
    return decoded as any; 
  } catch (err) {
    return null;
  }
}
