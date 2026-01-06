import { and, eq, like, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, audioTracks, InsertAudioTrack } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getAudioTracks(userId: number, limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get audio tracks: database not available");
    return [];
  }

  return db
    .select()
    .from(audioTracks)
    .where(eq(audioTracks.userId, userId))
    .limit(limit)
    .offset(offset);
}

export async function searchAudioTracks(userId: number, query: string, limit = 50) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot search audio tracks: database not available");
    return [];
  }

  return db
    .select()
    .from(audioTracks)
    .where(
      and(
        eq(audioTracks.userId, userId),
        or(
          like(audioTracks.title, `%${query}%`),
          like(audioTracks.artist, `%${query}%`),
          like(audioTracks.album, `%${query}%`)
        )
      )
    )
    .limit(limit);
}

export async function createAudioTrack(track: InsertAudioTrack) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create audio track: database not available");
    return null;
  }

  return db.insert(audioTracks).values(track);
}

export async function updateAudioTrackPlays(trackId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update audio track plays: database not available");
    return null;
  }

  const { sql } = await import("drizzle-orm");
  return db
    .update(audioTracks)
    .set({ plays: sql`${audioTracks.plays} + 1` })
    .where(eq(audioTracks.id, trackId));
}
