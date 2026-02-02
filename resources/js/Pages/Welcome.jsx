import { Head, Link } from "@inertiajs/react";
import PublicLayout from "@/Layouts/PublicLayout";
import Button from "@/Components/Button";

export default function Welcome() {
  return (
    <PublicLayout>
      <Head title="Welcome" />

      <div className="relative min-h-screen flex items-center justify-center">
        {/* CONTAINER UTAMA */}
        <div className="flex flex-col items-center text-center text-white px-6">
          {/* LOGO */}
          <img
            src="/images/logo.png"
            alt="Oopedia"
            className="mb-6 h-20 w-auto"
          />

          {/* HERO TEXT */}
          <p className="mb-12 text-white/90 text-[56px] leading-[1.1] italic font-light [font-family:'Poppins-LightItalic',Helvetica]">
            Daftar sekarang untuk 
            <br />
            menikmati pengalaman belajar yang
            <br />
            personal di
            <br />
            <span className="text-white/60">Oopedia.</span>
          </p>
          {/* SUBTITLE */}
          <p className="mt-2 max-w-sm text-white/70">
            Masuk atau buat akun untuk melanjutkan pengalaman belajar kamu.
          </p>

          {/* BUTTONS */}
          <div className="mt-8 flex space-x-4">
            <Link href={route("login")}>
              <Button
                color="yellow"
                variant="solid"
                size="lg"
              >
                Masuk
              </Button>
            </Link>

            <Link href={route("register")}>
              <Button
                color="yellow"
                variant="outline"
                size="lg"
              >
                Daftar Akun
              </Button>
            </Link>
          </div>

        </div>
      </div>
    </PublicLayout>
  );
}
