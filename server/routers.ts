import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { getAudioTracks, searchAudioTracks, createAudioTrack, updateAudioTrack, deleteAudioTrack, getAudioTrackById, updateAudioTrackPlays, addFavorite, removeFavorite, isFavorite, getFavoriteTracks, recordPlayback, getRecentlyPlayed, getTopTracks, getUserStatistics, getPlaybackHistory, getListeningPatternsByDay, getListeningPatternsByWeek, getListeningPatternsByMonth, getGenrePreferences, getTopGenresByPeriod, createPlaylist, getPlaylists, getPlaylistById, updatePlaylist, deletePlaylist, addTrackToPlaylist, removeTrackFromPlaylist, getPlaylistTracks, reorderPlaylistTracks, getPlaylistTrackCount } from "./db";
import { storagePut } from "./storage";
import { nanoid } from "nanoid";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  audio: router({
    list: protectedProcedure
      .input(z.object({ limit: z.number().default(50), offset: z.number().default(0) }))
      .query(({ ctx, input }) => getAudioTracks(ctx.user.id, input.limit, input.offset)),
    search: protectedProcedure
      .input(z.object({ query: z.string(), limit: z.number().default(50) }))
      .query(({ ctx, input }) => searchAudioTracks(ctx.user.id, input.query, input.limit)),
    create: protectedProcedure
      .input(z.object({
        title: z.string(),
        artist: z.string(),
        album: z.string().optional(),
        duration: z.number(),
        fileUrl: z.string(),
        fileKey: z.string(),
        genre: z.string().optional(),
        description: z.string().optional(),
      }))
      .mutation(({ ctx, input }) =>
        createAudioTrack({ ...input, userId: ctx.user.id })
      ),
    recordPlay: protectedProcedure
      .input(z.object({ trackId: z.number() }))
      .mutation(({ input }) => updateAudioTrackPlays(input.trackId)),
    update: protectedProcedure
      .input(z.object({
        trackId: z.number(),
        title: z.string().min(1).optional(),
        artist: z.string().min(1).optional(),
        album: z.string().nullable().optional(),
        genre: z.string().nullable().optional(),
        description: z.string().nullable().optional(),
      }))
      .mutation(({ ctx, input }) => {
        const { trackId, ...updates } = input;
        return updateAudioTrack(trackId, ctx.user.id, updates);
      }),
    delete: protectedProcedure
      .input(z.object({ trackId: z.number() }))
      .mutation(({ ctx, input }) => deleteAudioTrack(input.trackId, ctx.user.id)),
    getById: protectedProcedure
      .input(z.object({ trackId: z.number() }))
      .query(({ ctx, input }) => getAudioTrackById(input.trackId, ctx.user.id)),
    upload: protectedProcedure
      .input(z.object({
        file: z.instanceof(File),
        title: z.string().min(1),
        artist: z.string().min(1),
        album: z.string().optional(),
        genre: z.string().optional(),
        description: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const fileBuffer = await input.file.arrayBuffer();
        const fileKey = `audio/${ctx.user.id}/${nanoid()}-${input.file.name}`;
        
        const { url } = await storagePut(
          fileKey,
          Buffer.from(fileBuffer),
          input.file.type
        );

        const duration = 0;
        return createAudioTrack({
          userId: ctx.user.id,
          title: input.title,
          artist: input.artist,
          album: input.album,
          duration,
          fileUrl: url,
          fileKey,
          genre: input.genre,
          description: input.description,
        });
      }),
  }),

  favorites: router({
    add: protectedProcedure
      .input(z.object({ trackId: z.number() }))
      .mutation(({ ctx, input }) => addFavorite(ctx.user.id, input.trackId)),
    remove: protectedProcedure
      .input(z.object({ trackId: z.number() }))
      .mutation(({ ctx, input }) => removeFavorite(ctx.user.id, input.trackId)),
    check: protectedProcedure
      .input(z.object({ trackId: z.number() }))
      .query(({ ctx, input }) => isFavorite(ctx.user.id, input.trackId)),
    list: protectedProcedure
      .input(z.object({ limit: z.number().default(50), offset: z.number().default(0) }))
      .query(({ ctx, input }) => getFavoriteTracks(ctx.user.id, input.limit, input.offset)),
  }),

  history: router({
    record: protectedProcedure
      .input(z.object({ trackId: z.number() }))
      .mutation(({ ctx, input }) => recordPlayback(ctx.user.id, input.trackId)),
    recentlyPlayed: protectedProcedure
      .input(z.object({ limit: z.number().default(10) }))
      .query(({ ctx, input }) => getRecentlyPlayed(ctx.user.id, input.limit)),
    topTracks: protectedProcedure
      .input(z.object({ limit: z.number().default(10) }))
      .query(({ ctx, input }) => getTopTracks(ctx.user.id, input.limit)),
    statistics: protectedProcedure
      .query(({ ctx }) => getUserStatistics(ctx.user.id)),
    list: protectedProcedure
      .input(z.object({ limit: z.number().default(50), offset: z.number().default(0) }))
      .query(({ ctx, input }) => getPlaybackHistory(ctx.user.id, input.limit, input.offset)),
    listeningPatternsByDay: protectedProcedure
      .input(z.object({ daysBack: z.number().default(30) }))
      .query(({ ctx, input }) => getListeningPatternsByDay(ctx.user.id, input.daysBack)),
    listeningPatternsByWeek: protectedProcedure
      .input(z.object({ weeksBack: z.number().default(12) }))
      .query(({ ctx, input }) => getListeningPatternsByWeek(ctx.user.id, input.weeksBack)),
    listeningPatternsByMonth: protectedProcedure
      .input(z.object({ monthsBack: z.number().default(12) }))
      .query(({ ctx, input }) => getListeningPatternsByMonth(ctx.user.id, input.monthsBack)),
    genrePreferences: protectedProcedure
      .input(z.object({ limit: z.number().default(10) }))
      .query(({ ctx, input }) => getGenrePreferences(ctx.user.id, input.limit)),
    topGenresByPeriod: protectedProcedure
      .input(z.object({ period: z.enum(["day", "week", "month"]).default("month") }))
      .query(({ ctx, input }) => getTopGenresByPeriod(ctx.user.id, input.period)),
  }),

  playlist: router({
    list: protectedProcedure
      .input(z.object({ limit: z.number().default(50), offset: z.number().default(0) }))
      .query(({ ctx, input }) => getPlaylists(ctx.user.id, input.limit, input.offset)),
    get: protectedProcedure
      .input(z.object({ playlistId: z.number() }))
      .query(({ ctx, input }) => getPlaylistById(input.playlistId, ctx.user.id)),
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        isPublic: z.boolean().default(false),
      }))
      .mutation(({ ctx, input }) =>
        createPlaylist({ ...input, userId: ctx.user.id, isPublic: input.isPublic ? 1 : 0 })
      ),
    update: protectedProcedure
      .input(z.object({
        playlistId: z.number(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        isPublic: z.boolean().optional(),
      }))
      .mutation(({ ctx, input }) => {
        const { playlistId, ...updates } = input;
        const dbUpdates: Record<string, unknown> = {};
        if (updates.name) dbUpdates.name = updates.name;
        if (updates.description !== undefined) dbUpdates.description = updates.description;
        if (updates.isPublic !== undefined) dbUpdates.isPublic = updates.isPublic ? 1 : 0;
        return updatePlaylist(playlistId, ctx.user.id, dbUpdates);
      }),
    delete: protectedProcedure
      .input(z.object({ playlistId: z.number() }))
      .mutation(({ ctx, input }) => deletePlaylist(input.playlistId, ctx.user.id)),
    getTracks: protectedProcedure
      .input(z.object({ playlistId: z.number() }))
      .query(({ input }) => getPlaylistTracks(input.playlistId)),
    addTrack: protectedProcedure
      .input(z.object({ playlistId: z.number(), trackId: z.number() }))
      .mutation(({ input }) => addTrackToPlaylist(input.playlistId, input.trackId)),
    removeTrack: protectedProcedure
      .input(z.object({ playlistId: z.number(), trackId: z.number() }))
      .mutation(({ input }) => removeTrackFromPlaylist(input.playlistId, input.trackId)),
    reorderTracks: protectedProcedure
      .input(z.object({ playlistId: z.number(), trackIds: z.array(z.number()) }))
      .mutation(({ input }) => reorderPlaylistTracks(input.playlistId, input.trackIds)),
    trackCount: protectedProcedure
      .input(z.object({ playlistId: z.number() }))
      .query(({ input }) => getPlaylistTrackCount(input.playlistId)),
    uploadCover: protectedProcedure
      .input(z.object({
        playlistId: z.number(),
        imageData: z.string(), // base64 encoded image
        mimeType: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Validate mime type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(input.mimeType)) {
          throw new Error('Invalid image type. Allowed: JPEG, PNG, GIF, WEBP');
        }
        
        // Decode base64 and upload to S3
        const buffer = Buffer.from(input.imageData, 'base64');
        const extension = input.mimeType.split('/')[1];
        const fileKey = `playlist-covers/${ctx.user.id}/${input.playlistId}-${nanoid()}.${extension}`;
        
        const { url } = await storagePut(fileKey, buffer, input.mimeType);
        
        // Update playlist with cover URL
        await updatePlaylist(input.playlistId, ctx.user.id, { coverUrl: url });
        
        return { coverUrl: url };
      }),
  }),
});

export type AppRouter = typeof appRouter;
