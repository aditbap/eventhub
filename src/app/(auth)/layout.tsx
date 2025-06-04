
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-start min-h-screen bg-background p-4 pt-12 sm:pt-16 md:pt-20">
      <div className="w-full max-w-md">
        {children}
      </div>
    </div>
  );
}
