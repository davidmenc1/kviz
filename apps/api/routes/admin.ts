import z from "zod";
import { publicProcedure, adminProcedure, router } from "../trpc";
import { prisma } from "../prisma/db";
import { nanoid } from "nanoid";
import { TRPCError } from "@trpc/server";

export const adminRoutes = router({
  createAdmin: publicProcedure
    .input(
      z.object({
        username: z.string(),
        password: z.string(),
        inviteCode: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const admins = await prisma.admin.count();

      if (admins !== 0) {
        if (!input.inviteCode) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invite code is required",
          });
        }

        const inviteCode = await prisma.inviteCode.findFirst({
          where: {
            code: input.inviteCode,
          },
        });

        if (!inviteCode) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid invite code",
          });
        }
      }

      const admin = await prisma.admin.create({
        data: {
          id: nanoid(),
          username: input.username,
          password: await Bun.password.hash(input.password),
        },
      });

      const session = await prisma.session.create({
        data: {
          id: nanoid(),
          adminId: admin.id,
          expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
        },
      });

      return { admin, session };
    }),
  login: publicProcedure
    .input(
      z.object({
        username: z.string(),
        password: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const admin = await prisma.admin.findFirst({
        where: { username: input.username },
      });

      if (!admin) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid username or password",
        });
      }

      const isPasswordValid = await Bun.password.verify(
        input.password,
        admin.password
      );
      if (!isPasswordValid) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid username or password",
        });
      }

      const session = await prisma.session.create({
        data: {
          id: nanoid(),
          adminId: admin.id,
          expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
        },
      });

      return { admin, session };
    }),
  me: adminProcedure.query(async ({ ctx }) => {
    // ctx.admin is guaranteed to be non-null due to adminProcedure middleware
    const admin = await prisma.admin.findUnique({
      where: { id: ctx.admin.id },
      select: {
        id: true,
        username: true,
        createdAt: true,
      },
    });

    if (!admin) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Admin not found",
      });
    }

    return admin;
  }),
  logout: adminProcedure.mutation(async ({ ctx }) => {
    // Invalidate all sessions for this admin, or just the current one
    // For simplicity, we'll delete all expired sessions and let the client handle removing the token
    await prisma.session.deleteMany({
      where: {
        adminId: ctx.admin.id,
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    return { success: true };
  }),
  createInviteCode: adminProcedure
    .input(
      z.object({
        expiresInDays: z.number().min(1).max(365).default(30),
      })
    )
    .mutation(async ({ input }) => {
      // Generate a unique 8-character code
      let code: string;
      let existingCode;
      let attempts = 0;
      
      do {
        code = Math.random().toString(36).substring(2, 10).toUpperCase();
        existingCode = await prisma.inviteCode.findUnique({
          where: { code },
        });
        attempts++;
        if (attempts > 10) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to generate unique invite code",
          });
        }
      } while (existingCode);

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + input.expiresInDays);

      const inviteCode = await prisma.inviteCode.create({
        data: {
          id: nanoid(),
          code,
          expiresAt,
        },
      });

      return inviteCode;
    }),
  getInviteCodes: adminProcedure.query(async () => {
    const inviteCodes = await prisma.inviteCode.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return inviteCodes;
  }),
  deleteInviteCode: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await prisma.inviteCode.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),
});
