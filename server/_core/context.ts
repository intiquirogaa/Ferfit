import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import * as db from "../db";
import { createHash } from "crypto";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex").slice(0, 64);
}

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  console.log("========== createContext ==========");
  console.log("Authorization header:", opts.req.headers.authorization);

  let user: User | null = null;

  try {
    // Try Manus authentication first
    user = await sdk.authenticateRequest(opts.req);
    console.log("Usuario Manus:", user);

  } catch (error) {    
     console.log("Manus auth falló");
    // Try Clerk authentication as fallback
    try {
      const authHeader = opts.req.headers.authorization;
      if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
        const token = authHeader.slice(7);
        console.log("TOKEN:", token.substring(0,20));
        const hashedToken = hashToken(token);
        console.log("Authorization:", authHeader);
        console.log("Hashed:", hashedToken);
        let dbUser = await db.getUserByOpenId(hashedToken);
        console.log("dbUser:", dbUser);
        
        if (!dbUser) {
          // Create new user from Clerk token
          await db.upsertUser({
            openId: hashedToken,
            name: null,
            email: null,
            loginMethod: "clerk",
            lastSignedIn: new Date(),
          });
          dbUser = await db.getUserByOpenId(hashedToken);
        } else {
          // Update last signed in
          await db.upsertUser({
            openId: hashedToken,
            lastSignedIn: new Date(),
          });
        }
        
        user = dbUser || null;
      }
    } catch (e) {
      // Authentication is optional for public procedures.
      console.log(e);
    }
  }
  console.log("CTX USER:", user);

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
