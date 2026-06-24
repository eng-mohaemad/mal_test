import { signOut } from "./actions";

export default function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-screen flex-col bg-[#c2d1e6]">
      <header className="flex items-center justify-between border-b border-black/10 bg-[#c2d1e6] px-6 py-4">
        <div className="flex items-center gap-2">
          {/* ponytail: hotlink avoids adding an image asset */}
          <img
            src="https://framerusercontent.com/images/hO9rVnJbUc0TOTWHuWKw73gUlTw.png"
            alt="Mal logo"
            width={28}
            height={28}
            className="h-7 w-7"
          />
          <span className="text-lg font-bold tracking-tight text-black">Mal</span>
        </div>
        <form action={signOut}>
          <button
            type="submit"
            className="rounded-[199px] border border-black/20 px-4 py-1.5 text-sm font-medium text-black transition-colors hover:bg-black/5"
          >
            Sign out
          </button>
        </form>
      </header>
      <main className="flex-1 px-6 py-8">{children}</main>
    </div>
  );
}
