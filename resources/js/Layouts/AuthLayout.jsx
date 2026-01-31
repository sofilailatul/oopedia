import { Link } from "@inertiajs/react";
import { GradientBackground } from "react-bits";

export default function AuthLayout({ children }) {
  return (
    <GradientBackground
      colors={["#020617", "#020617", "#0f172a", "#020617"]}
      animate
      className="min-h-screen"
    >
      {/* Top-left brand */}
      <div className="absolute left-10 top-8 flex items-center gap-3">
        <Link href={route("welcome")} className="flex items-center gap-3">
          <img src="/images/logo.png" alt="Oopedia" className="h-10 w-auto" />
          <span className="text-white text-xl font-semibold tracking-wide">
            Oopedia<span className="text-blue-400">.</span>
          </span>
        </Link>
      </div>

      {/* Center card */}
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
          {children}
        </div>
      </div>
    </GradientBackground>
  );
}
