import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Santiago Running Club",
  description: "La comunidad de corredores de Santiago, República Dominicana.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body style={{ margin: 0, padding: 0, background: '#0a0a0a' }}>{children}</body>
    </html>
  );
}