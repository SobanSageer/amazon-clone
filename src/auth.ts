import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

class InvalidLogin extends CredentialsSignin {
  code = "invalid_login";
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/signin" },
  providers: [
    Credentials({
      id: "credentials",
      credentials: { email: {}, password: {} },
      async authorize(credentials) {
        const email = String(credentials.email ?? "").trim().toLowerCase();
        const password = String(credentials.password ?? "");
        if (!email || !password) throw new InvalidLogin();
        const user = await db.user.findUnique({ where: { email } });
        if (!user || !(await bcrypt.compare(password, user.passwordHash))) throw new InvalidLogin();
        return { id: user.id, name: user.name, email: user.email };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user?.id) token.uid = user.id;
      return token;
    },
    session({ session, token }) {
      if (token.uid && session.user) session.user.id = token.uid as string;
      return session;
    },
  },
});

export async function currentUser() {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) return null;
  return db.user.findUnique({ where: { id }, select: { id: true, name: true, email: true } });
}
