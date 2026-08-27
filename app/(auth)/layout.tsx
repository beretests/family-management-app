export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="flex min-h-screen min-w-0 items-center justify-center px-3 py-4 min-[360px]:px-4 sm:py-10">
      {children}
    </main>
  );
}
