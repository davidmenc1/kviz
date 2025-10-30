import { initTRPC, TRPCError } from "@trpc/server";
import { prisma } from "./prisma/db";

type Context = {
  admin: {
    id: string;
    username: string;
  } | null;
};

const t = initTRPC.context<Context>().create();

async function getAdminFromSession(
  sessionId: string | null
): Promise<Context["admin"]> {
  if (!sessionId) {
    return null;
  }

  const session = await prisma.session.findFirst({
    where: {
      id: sessionId,
      expiresAt: {
        gt: new Date(),
      },
    },
    include: {
      admin: true,
    },
  });

  if (!session) {
    return null;
  }

  return {
    id: session.admin.id,
    username: session.admin.username,
  };
}

export async function createContext(opts: { req: Request }): Promise<Context> {
  const { req } = opts;
  // Extract session ID from Authorization header (Bearer token)
  const authHeader = req.headers.get("authorization");
  const sessionId = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;

  const admin = await getAdminFromSession(sessionId);

  return {
    admin,
  };
}

export const router = t.router;
export const publicProcedure = t.procedure;

const isAdmin = t.middleware(async ({ ctx, next }) => {
  if (!ctx.admin) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be logged in as an admin",
    });
  }

  return next({
    ctx: {
      ...ctx,
      admin: ctx.admin, // Type narrowing - admin is now definitely not null
    },
  });
});

export const adminProcedure = t.procedure.use(isAdmin);
