import "./globals.css";
import { Inter } from "next/font/google";
import NextAuthProvider from "./next-auth-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Momento Chat",
  description: "Nextjs chat application using Momento",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={"h-full"}>
      <body className={inter.className + " h-full"}>
        <NextAuthProvider>{children}</NextAuthProvider>
      </body>
    </html>
  );
}
