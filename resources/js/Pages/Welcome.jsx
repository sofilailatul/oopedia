import { Head, Link } from "@inertiajs/react";
import PublicLayout from "@/Layouts/PublicLayout";
import Button from "@/Components/Button";

export default function Welcome() {
  return (
    <PublicLayout>
      <Head title="Welcome" />

      <div className="relative min-h-screen overflow-hidden">
        {/* BACKGROUND DECORATION */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 h-40 w-40 rounded-full bg-yellow-300/10 blur-3xl" />
          <div className="absolute bottom-20 right-10 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-yellow-200/10 blur-3xl" />
        </div>

        <div className="relative z-10 flex min-h-screen items-center justify-center px-6 py-16">
          <div className="mx-auto flex flex-col items-center gap-12 lg:flex-row lg:items-center lg:justify-between">
            
            {/* LEFT CONTENT */}
            <div className="max-w-2xl text-center lg:text-left text-white">

              <h1 className="mt-6 text-4xl font-bold leading-tight md:text-6xl">
                Belajar <span className="text-yellow-300">lebih santai</span>,
                <br />
                paham materi <span className="text-yellow-300">lebih cepat</span>.
              </h1>

              <p className="mt-6 max-w-xl text-base leading-7 text-white/75 md:text-lg">
                OOpedia bantu kamu belajar Pemrograman Berbasis Objek dengan
                materi bertahap, latihan soal adaptif, feedback instan, dan
                rekomendasi materi yang sesuai progres belajarmu.
              </p>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center lg:justify-start">
                <Link href={route("register")}>
                  <Button color="yellow" variant="solid" size="lg">
                    Mulai Belajar Sekarang
                  </Button>
                </Link>

                <Link href={route("login")}>
                  <Button color="yellow" variant="outline" size="lg">
                    Sudah Punya Akun
                  </Button>
                </Link>
              </div>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-sm text-white/70 lg:justify-start">
                <span className="rounded-full bg-white/10 px-4 py-2">
                  Materi bertahap
                </span>
                <span className="rounded-full bg-white/10 px-4 py-2">
                  Feedback instan
                </span>
                <span className="rounded-full bg-white/10 px-4 py-2">
                  Quiz adaptif
                </span>
                <span className="rounded-full bg-white/10 px-4 py-2">
                  Progress tracker
                </span>
              </div>
            </div>

            {/* RIGHT CONTENT */}
            <div className="w-full max-w-md">
              <div className="rounded-3xl border border-white/15 bg-white/10 p-6 text-white shadow-2xl backdrop-blur-md">
                <h2 className="text-2xl font-semibold">
                  Kenapa harus OOpedia?
                </h2>
                <p className="mt-2 text-white/70">
                  Karena belajar coding nggak harus selalu bikin stres.
                </p>

                <div className="mt-6 space-y-4">
                  <div className="rounded-2xl bg-white/10 p-4">
                    <h3 className="font-semibold text-yellow-300">
                      Belajar sesuai level kamu
                    </h3>
                    <p className="mt-1 text-sm text-white/75">
                      Sistem akan bantu menyesuaikan latihan berdasarkan hasil
                      belajarmu.
                    </p>
                  </div>

                  <div className="rounded-2xl bg-white/10 p-4">
                    <h3 className="font-semibold text-yellow-300">
                      Langsung tahu salahnya di mana
                    </h3>
                    <p className="mt-1 text-sm text-white/75">
                      Dapat feedback instan setelah mengerjakan soal, jadi
                      revisi konsep lebih cepat.
                    </p>
                  </div>

                  <div className="rounded-2xl bg-white/10 p-4">
                    <h3 className="font-semibold text-yellow-300">
                      Progress kamu lebih terarah
                    </h3>
                    <p className="mt-1 text-sm text-white/75">
                      Lihat progres belajar dan dapat rekomendasi materi yang
                      perlu dipelajari lagi.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}