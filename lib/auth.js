import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import db from "@/lib/db";

export const authOptions = {
  // Selalu percaya host dari request yang sedang jalan (domain Vercel-mu),
  // bukan hanya NEXTAUTH_URL. Ini yang bikin logout tidak "nyasar" ke
  // localhost kalau NEXTAUTH_URL di env production kebetulan salah.
  trustHost: true,
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60 // 8 jam
  },
  pages: {
    signIn: "/login"
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email dan password wajib diisi");
        }

        const email = credentials.email.toLowerCase().trim();

        const user = await db.find("users", (u) => u.email === email);

        if (!user || !user.isActive) {
          throw new Error("Akun tidak ditemukan atau nonaktif");
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) {
          throw new Error("Password salah");
        }

        const department = user.departmentId
          ? await db.find("departments", (d) => d.id === user.departmentId)
          : null;

        // Jangan pernah expose password ke client
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          departmentId: user.departmentId,
          department: department?.name ?? null,
          departmentName: department?.name ?? null,
          position: user.position
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.departmentId = user.departmentId;
        token.department = user.department;
        token.departmentName = user.departmentName;
        token.position = user.position;
      }
      // Dipicu oleh client lewat useSession().update({ name, email }) setelah
      // ganti email/username berhasil di Settings — supaya JWT (dan tampilan
      // nama/email di sidebar & topbar) langsung ikut berubah tanpa perlu
      // logout-login ulang.
      if (trigger === "update" && session) {
        if (session.name) token.name = session.name;
        if (session.email) token.email = session.email;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.name = token.name;
      session.user.email = token.email;
      session.user.role = token.role;
      session.user.departmentId = token.departmentId;
      session.user.department = token.department;
      session.user.departmentName = token.departmentName;
      session.user.position = token.position;
      return session;
    },
    // Paksa semua redirect (termasuk setelah signOut) tetap di domain yang
    // sedang diakses, bukan ikut NEXTAUTH_URL yang mungkin salah di Vercel.
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      try {
        if (new URL(url).origin === baseUrl) return url;
      } catch {
        // url tidak valid, abaikan dan fallback ke baseUrl
      }
      return baseUrl;
    }
  }
};
