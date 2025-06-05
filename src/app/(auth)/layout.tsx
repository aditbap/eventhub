
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-start min-h-screen bg-background p-4 pt-8 sm:pt-10 md:pt-12">
      <div className="w-full max-w-md">
        {children}
      </div>
    </div>
  );
}
