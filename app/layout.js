import "./globals.css";
import AuthProvider from "@/components/AuthProvider";

export const metadata = {
  title: "SS3O Staff Administration",
  description: "Sistem Administrasi & Monitoring Jobdesk Staff SS3O",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg"
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
