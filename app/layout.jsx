import "./globals.css";
import { AppProvider } from "@/lib/store";

export const metadata = {
  title: "IDEALAUNCH | Discover Ideas. Build the Future.",
  description: "IDEALAUNCH - Discover startup ideas and build the future.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
