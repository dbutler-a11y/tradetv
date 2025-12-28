import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import Discord from "next-auth/providers/discord";
import prisma from "./prisma";
import type { NextAuthConfig } from "next-auth";

const config: NextAuthConfig = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    // Email/Password (for development)
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = credentials.email as string;

        // For demo purposes - in production, verify password hash
        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user) {
          // Create demo user if doesn't exist
          const newUser = await prisma.user.create({
            data: {
              email,
              name: email.split("@")[0],
            },
          });
          return {
            id: newUser.id,
            email: newUser.email,
            name: newUser.name,
            image: newUser.image,
          };
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
    // Google OAuth
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
    // Discord OAuth
    ...(process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET
      ? [
          Discord({
            clientId: process.env.DISCORD_CLIENT_ID,
            clientSecret: process.env.DISCORD_CLIENT_SECRET,
          }),
        ]
      : []),
  ],
  callbacks: {
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;

        // Fetch additional user data
        const user = await prisma.user.findUnique({
          where: { id: token.sub },
          select: {
            role: true,
            subscriptionTier: true,
            tradovateLinked: true,
            trader: {
              select: {
                id: true,
                displayName: true,
                verificationTier: true,
              },
            },
          },
        });

        if (user) {
          session.user.role = user.role;
          session.user.subscriptionTier = user.subscriptionTier;
          session.user.tradovateLinked = user.tradovateLinked;
          session.user.trader = user.trader;
        }
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
      }
      return token;
    },
  },
};

export const { handlers, signIn, signOut, auth } = NextAuth(config);
