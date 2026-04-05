import type { RealtimeDB } from "@/core/db";
import { firebaseRealtimeDb } from "@/infra/firebaseDb";
import { memoryDb } from "@/infra/memoryDb";

const provider = process.env.NEXT_PUBLIC_DB_PROVIDER;

export const dbClient: RealtimeDB =
  provider === "memory" ? memoryDb : firebaseRealtimeDb;
