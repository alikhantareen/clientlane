import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";
import { compare } from "bcryptjs";

const prisma = new PrismaClient();

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const user = await prisma.user.findUnique({ where: { email: credentials.email } });
        if (!user || !user.password_hash) return null;
        
        // Check if user's email is verified
        if (!(user as any).email_verified) {
          throw new Error("Please verify your email before logging in. Check your email for the verification code.");
        }
        
        const isValid = await compare(credentials.password, user.password_hash);
        if (!isValid) return null;
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async session({ session, token }) {
      if (session.user && token) {
        (session.user as any).id = token.sub;
        (session.user as any).role = token.role;
      }
      return session;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.role = (user as any).role;
      }
      
      // If no role is set (e.g., first-time Google login), fetch from database
      if (!token.role && token.sub) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
          select: { role: true }
        });
        if (dbUser) {
          token.role = dbUser.role;
        }
      }
      
      return token;
    },
    async signIn({ user, account, profile }) {
      // For Google OAuth users, set a default role if they don't have one
      if (account?.provider === "google" && user.email) {
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email },
          select: { id: true, role: true }
        });
        
        // If user exists but has no role, or if it's a new user from Google
        if (existingUser && !existingUser.role) {
          await prisma.user.update({
            where: { email: user.email },
            data: { role: "client" } // Default role for Google users
          });
        }
      }

      // Update last_seen_at when user signs in
      if (user.id) {
        try {
          await prisma.user.update({
            where: { id: user.id },
            data: { last_seen_at: new Date() }
          });
        } catch (error) {
          console.error("Error updating last_seen_at:", error);
        }
      }

      return true;
    },
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST }; 