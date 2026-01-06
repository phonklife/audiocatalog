import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { getAudioTracks, searchAudioTracks, createAudioTrack, updateAudioTrackPlays } from "./db";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
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
  }),
});

export type AppRouter = typeof appRouter;
