import "./globals.css";

export const metadata = {
  title: "GeoSports",
  description: "Read the clue. Drop the pin. Score by distance.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
