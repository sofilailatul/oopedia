import { Link } from "@inertiajs/react";

export default function PublicLayout({ children }) {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Top bar logo */}
      <div className="absolute left-10 top-8 flex items-center gap-3">
        <Link href={route("welcome")} className="flex items-center gap-3">
          <img src="/images/logo.png" alt="Oopedia" className="h-10 w-auto" />
          <span className="text-xl font-semibold tracking-wide">
            Oopedia<span className="text-blue-400">.</span>
          </span>
        </Link>
      </div>

      <div className="min-h-screen flex items-center justify-center px-6">
        {children}
      </div>
    </div>
  );
}
