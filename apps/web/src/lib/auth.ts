import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { connectDB } from "@/lib/db";
import { env } from "@/config/env";

// TODO: Import User model once authentication flow is implemented.

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  secret: env.auth.secret(),
  providers: [
    GoogleProvider({
      clientId:     env.google.clientId(),
      clientSecret: env.google.clientSecret(),
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email:    { label: "Email",    type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // TODO: Implement credential validation against MongoDB User model.
        await connectDB();

        if (!credentials?.email || !credentials?.password) return null;

        // Placeholder — replace with real DB lookup + bcrypt.compare
        console.warn("CredentialsProvider.authorize: not yet implemented");
        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id   = user.id;
        token.role = (user as { role?: string }).role ?? "user";
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as { id?: string }).id     = token.id as string;
        (session.user as { role?: string }).role  = token.role as string;
      }
      return session;
    },
  },
  pages: {
    signIn:  "/login",
    signOut: "/login",
    error:   "/login",
  },
};
