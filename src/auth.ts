import { isAdminEmail } from "@/lib/admins";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";

const providers = [];

if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
  providers.push(
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  );
}

providers.push(
  Credentials({
    id: "farm-password",
    name: "Farm password",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      const email = String(credentials?.email ?? "")
        .trim()
        .toLowerCase();
      const password = String(credentials?.password ?? "");
      const expected = process.env.AUTH_DEV_PASSWORD;
      if (!expected || !email || !password) return null;
      if (!isAdminEmail(email) || password !== expected) return null;
      return { id: "admin", email, name: "Farm admin" };
    },
  }),
);

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers,
  pages: {
    signIn: "/admin/login",
    error: "/admin/login",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!isAdminEmail(user.email)) return false;
      if (account?.provider === "google") {
        const googleProfile = profile as { email_verified?: boolean } | undefined;
        if (googleProfile?.email_verified === false) return false;
      }
      return true;
    },
  },
});
