import { Link } from "@inertiajs/react";
import { GradientBackground } from "react-bits";

export default function TamuLayout({ children }) {
  return (
    <GradientBackground
      colors={["#020617", "#020617", "#0f172a", "#020617"]}
      animate
      className="min-h-screen"
    >
      {/* Top-left brand */}
      <div className="absolute left-10 top-8">
        <Link href="/">
          <div className="flex items-center gap-2">
            <img src="/images/logo.png" alt="Oopedia" className="h-10 w-auto"/>
            <span className="text-white font-semibold text-xl tracking-wide">
              Oopedia<span className="text-blue-400">.</span>
            </span>
          </div>
        </Link>
      </div>

      {/* Center content */}
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
          {children}
        </div>
      </div>
    </GradientBackground>
  );
}
