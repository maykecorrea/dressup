import Image from "next/image";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-full grid grid-cols-1 lg:grid-cols-2">
      <div className="relative flex-1 hidden lg:block">
        <Image
          src="/img/f3.jpg"
          alt="Fashion model"
          layout="fill"
          objectFit="cover"
          className="opacity-90"
          data-ai-hint="fashion runway"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-background shadow-lg"></div>
      </div>
      <div className="flex items-center justify-center p-6 lg:p-12 bg-background">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    </div>
  );
}
