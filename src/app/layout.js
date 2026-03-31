import { IBM_Plex_Mono, Space_Grotesk } from "next/font/google";
import AntdProvider from "@/components/antd-provider";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata = {
  title: "Cardio Risk Studio",
  description: "Interactive cardio risk prediction console for the trained XGBoost model.",
};

const htmlClassName = [
  spaceGrotesk.variable,
  plexMono.variable,
  "h-full antialiased",
].join(" ");

const bodyClassName = "min-h-full";

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={htmlClassName}>
      <body className={bodyClassName}>
        <AntdProvider>{children}</AntdProvider>
      </body>
    </html>
  );
}
