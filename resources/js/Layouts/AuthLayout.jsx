import { Link } from "@inertiajs/react";

export default function AuthLayout({ children }) {
  return (
    <div className="relative h-screen w-full overflow-hidden bg-[#050a24]">
      <div className="absolute left-10 top-8 z-20 flex items-center gap-3">
        <Link href={route("welcome")} className="flex items-center gap-3">
          <span className="w-36 font-bold italic text-white text-[28px] tracking-[2.80px] leading-7 [font-family:'Poppins-BoldItalic',Helvetica]">
            OOpedia
            <span className="font-bold italic text-primary text-[28px] tracking-[2.80px] leading-7 [font-family:'Poppins-BoldItalic',Helvetica]">
              .
            </span>
          </span>
        </Link>
      </div>

      {children}
    </div>
  );
}