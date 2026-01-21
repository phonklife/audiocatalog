import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { getAudioTracks, searchAudioTracks, createAudioTrack, updateAudioTrackPlays, addFavorite, removeFavorite, isFavorite, getFavoriteTracks } from "./db";
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
});

export type AppRouter = typeof appRouter;
