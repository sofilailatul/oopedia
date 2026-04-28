import { Link } from "@inertiajs/react";

export default function PublicLayout({ children }) {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Top bar logo */}
      <div className="absolute left-10 top-8 flex items-center gap-3">
        <Link href={route("welcome")} className="flex items-center gap-3">
            <span className="w-36 font-bold italic text-white text-[28px] tracking-[2.80px] leading-7 [font-family:'Poppins-BoldItalic',Helvetica]">
              OOpedia
              <span className="font-bold italic text-primary text-[28px] tracking-[2.80px] leading-7 [font-family:'Poppins-BoldItalic',Helvetica]">
                .
              </span>
            </span>
        </Link>
      </div>

      <div className="min-h-screen flex items-center justify-center px-6">
        {children}
      </div>
    </div>
  );
}
