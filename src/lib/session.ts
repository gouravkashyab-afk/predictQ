import { SessionOptions } from "iron-session";

export interface SiweSessionData {
  address?: string;
  chainId?: number;
}

export const sessionOptions: SessionOptions = {
  password:
    process.env.SESSION_SECRET ||
    "predictiq-fallback-secret-32-chars-min!",
  cookieName: "siwe",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
};
