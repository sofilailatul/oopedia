import { Head, Link } from "@inertiajs/react";
import PublicLayout from "@/Layouts/PublicLayout";

export default function Welcome() {
  return (
    <PublicLayout>
      <Head title="Welcome" />

      <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        {/* LEFT TEXT */}
        <div>
          <h1 className="text-5xl md:text-6xl font-light leading-tight">
            Daftar sekarang <br />
            untuk menikmati <br />
            pengalaman belajar <br />
            yang personal di <span className="font-semibold">Oopedia</span>.
          </h1>
          <p className="mt-6 text-slate-300 max-w-md">
            Mulai dengan masuk atau buat akun baru untuk mendapatkan pengalaman belajar yang lebih personal.
          </p>
        </div>

        {/* RIGHT CARD CTA */}
        <div className="bg-white text-slate-900 rounded-2xl shadow-2xl p-8">
          <div className="flex justify-center mb-4">
            <img src="/images/logo.png" alt="Oopedia" className="h-14 w-auto" />
          </div>

          <h2 className="text-2xl font-semibold text-center">Mulai Sekarang</h2>
          <p className="text-center text-slate-500 mt-2">
            Masuk atau buat akun untuk lanjut.
          </p>

          <div className="mt-8 space-y-3">
            <Link
              href={route("login")}
              className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium"
            >
              Masuk
            </Link>

            <Link
              href={route("register")}
              className="block w-full text-center border border-slate-300 hover:bg-slate-50 py-3 rounded-lg font-medium"
            >
              Daftar Akun
            </Link>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
