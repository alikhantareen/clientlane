import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";

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
        if (!(user as any).emailVerified) {
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
      
      // For Google OAuth users without a role, set up the role and update the database
      // Only for NEW users (not existing users who might have client role)
      if (account?.provider === "google" && token.sub && !token.role) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.sub },
            select: { role: true, email: true }
          });
          
          if (dbUser && !dbUser.role) {
            // Only set freelancer role for new users who don't have any role
            // This prevents overriding existing client roles
            await prisma.user.update({
              where: { id: token.sub },
              data: { 
                role: "freelancer",
                emailVerified: new Date()
              }
            });
            token.role = "freelancer";
          } else if (dbUser) {
            token.role = dbUser.role;
          }
        } catch (error) {
          console.error("Error setting up Google OAuth user role:", error);
        }
      }
      
      // If no role is still set, fetch from database
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
      // For Google OAuth users, ensure proper setup
      if (account?.provider === "google" && user.email) {
        try {
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email },
            select: { id: true, role: true, emailVerified: true }
          });
          
          if (existingUser) {
            // Check if this Google account is already linked to the existing user
            const existingAccount = await prisma.account.findFirst({
              where: {
                userId: existingUser.id,
                provider: "google",
                providerAccountId: account.providerAccountId
              }
            });

            if (!existingAccount) {
              // This is a new Google account trying to link to existing user
              // We'll allow this linking to happen automatically
              console.log(`Linking Google account to existing user: ${user.email}`);
            }

            // Update existing user to ensure verification, but preserve their role
            await prisma.user.update({
              where: { email: user.email },
              data: { 
                emailVerified: new Date() // Google OAuth users have verified emails
                // Don't change the role - preserve existing role (client/freelancer)
              }
            });
          }
          // For new users, the PrismaAdapter will handle creation
          // We'll set the role in the JWT callback after user creation
        } catch (error) {
          console.error("Error handling Google OAuth user:", error);
          return false;
        }
      }

      // Update last_seen_at when user signs in (only for existing users)
      if (user.id) {
        try {
          // Check if user exists before updating
          const existingUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { id: true }
          });
          
          if (existingUser) {
            await prisma.user.update({
              where: { id: user.id },
              data: { last_seen_at: new Date() }
            });
          }
        } catch (error) {
          console.error("Error updating last_seen_at:", error);
        }
      }

      return true;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login", // Redirect to login page on errors
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST }; 