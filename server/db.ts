import { and, eq, like, or, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, audioTracks, InsertAudioTrack, favorites, InsertFavorite, playbackHistory, InsertPlaybackHistory } from "../drizzle/schema";
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

export async function addFavorite(userId: number, trackId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot add favorite: database not available");
    return null;
  }

  try {
    return db.insert(favorites).values({ userId, trackId });
  } catch (error) {
    console.error("[Database] Error adding favorite:", error);
    return null;
  }
}

export async function removeFavorite(userId: number, trackId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot remove favorite: database not available");
    return null;
  }

  return db
    .delete(favorites)
    .where(and(eq(favorites.userId, userId), eq(favorites.trackId, trackId)));
}

export async function isFavorite(userId: number, trackId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot check favorite: database not available");
    return false;
  }

  const result = await db
    .select()
    .from(favorites)
    .where(and(eq(favorites.userId, userId), eq(favorites.trackId, trackId)))
    .limit(1);

  return result.length > 0;
}

export async function getFavoriteTracks(userId: number, limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get favorite tracks: database not available");
    return [];
  }

  return db
    .select({
      id: audioTracks.id,
      userId: audioTracks.userId,
      title: audioTracks.title,
      artist: audioTracks.artist,
      album: audioTracks.album,
      duration: audioTracks.duration,
      fileUrl: audioTracks.fileUrl,
      fileKey: audioTracks.fileKey,
      genre: audioTracks.genre,
      description: audioTracks.description,
      plays: audioTracks.plays,
      createdAt: audioTracks.createdAt,
      updatedAt: audioTracks.updatedAt,
    })
    .from(audioTracks)
    .innerJoin(favorites, eq(audioTracks.id, favorites.trackId))
    .where(eq(favorites.userId, userId))
    .orderBy(favorites.createdAt)
    .limit(limit)
    .offset(offset);
}

export async function getFavoriteCount(userId: number, trackId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get favorite count: database not available");
    return 0;
  }

  const result = await db
    .select()
    .from(favorites)
    .where(eq(favorites.trackId, trackId));

  return result.length;
}

export async function recordPlayback(userId: number, trackId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot record playback: database not available");
    return null;
  }

  try {
    return db.insert(playbackHistory).values({ userId, trackId });
  } catch (error) {
    console.error("[Database] Error recording playback:", error);
    return null;
  }
}

export async function getRecentlyPlayed(userId: number, limit = 10) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get recently played: database not available");
    return [];
  }

  return db
    .select({
      id: audioTracks.id,
      userId: audioTracks.userId,
      title: audioTracks.title,
      artist: audioTracks.artist,
      album: audioTracks.album,
      duration: audioTracks.duration,
      fileUrl: audioTracks.fileUrl,
      fileKey: audioTracks.fileKey,
      genre: audioTracks.genre,
      description: audioTracks.description,
      plays: audioTracks.plays,
      createdAt: audioTracks.createdAt,
      updatedAt: audioTracks.updatedAt,
      playedAt: playbackHistory.playedAt,
    })
    .from(playbackHistory)
    .innerJoin(audioTracks, eq(playbackHistory.trackId, audioTracks.id))
    .where(eq(playbackHistory.userId, userId))
    .orderBy(desc(playbackHistory.playedAt))
    .limit(limit);
}

export async function getTopTracks(userId: number, limit = 10) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get top tracks: database not available");
    return [];
  }

  const { sql } = await import("drizzle-orm");
  
  return db
    .select({
      id: audioTracks.id,
      userId: audioTracks.userId,
      title: audioTracks.title,
      artist: audioTracks.artist,
      album: audioTracks.album,
      duration: audioTracks.duration,
      fileUrl: audioTracks.fileUrl,
      fileKey: audioTracks.fileKey,
      genre: audioTracks.genre,
      description: audioTracks.description,
      plays: audioTracks.plays,
      createdAt: audioTracks.createdAt,
      updatedAt: audioTracks.updatedAt,
      playCount: sql<number>`COUNT(${playbackHistory.id})`.as("playCount"),
    })
    .from(audioTracks)
    .leftJoin(playbackHistory, and(
      eq(audioTracks.id, playbackHistory.trackId),
      eq(playbackHistory.userId, userId)
    ))
    .where(eq(audioTracks.userId, userId))
    .groupBy(audioTracks.id)
    .orderBy(sql`playCount DESC`)
    .limit(limit);
}

export async function getUserStatistics(userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user statistics: database not available");
    return { totalPlays: 0, uniqueTracks: 0, totalTracks: 0 };
  }

  const { sql } = await import("drizzle-orm");

  const playStats = await db
    .select({
      totalPlays: sql<number>`COUNT(${playbackHistory.id})`.as("totalPlays"),
      uniqueTracks: sql<number>`COUNT(DISTINCT ${playbackHistory.trackId})`.as("uniqueTracks"),
    })
    .from(playbackHistory)
    .where(eq(playbackHistory.userId, userId));

  const trackCount = await db
    .select()
    .from(audioTracks)
    .where(eq(audioTracks.userId, userId));

  return {
    totalPlays: playStats[0]?.totalPlays || 0,
    uniqueTracks: playStats[0]?.uniqueTracks || 0,
    totalTracks: trackCount.length,
  };
}

export async function getPlaybackHistory(userId: number, limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get playback history: database not available");
    return [];
  }

  return db
    .select({
      id: playbackHistory.id,
      userId: playbackHistory.userId,
      trackId: playbackHistory.trackId,
      playedAt: playbackHistory.playedAt,
      track: {
        id: audioTracks.id,
        title: audioTracks.title,
        artist: audioTracks.artist,
        album: audioTracks.album,
        duration: audioTracks.duration,
        fileUrl: audioTracks.fileUrl,
        genre: audioTracks.genre,
      },
    })
    .from(playbackHistory)
    .innerJoin(audioTracks, eq(playbackHistory.trackId, audioTracks.id))
    .where(eq(playbackHistory.userId, userId))
    .orderBy(desc(playbackHistory.playedAt))
    .limit(limit)
    .offset(offset);
}
