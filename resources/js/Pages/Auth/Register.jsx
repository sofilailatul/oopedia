import { Head, Link, useForm, router } from "@inertiajs/react";
import button from "@/Components/Button";
import Logo from "@/Components/ApplicationLogo";
import StatusModal from "@/Components/StatusModal";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function Register({ status }) {
  const { data, setData, post, processing, errors, reset } = useForm({
    nama: "",
    email: "",
    password: "",
    password_confirmation: "",
  });

  const [showPassword, setShowPassword] = useState(false);

  const [modalState, setModalState] = useState({
    show: false,
    type: "success",
    title: "",
    message: "",
  });

  useEffect(() => {
    if (!status) return;

    let successMessage = status;
    const lower = String(status).toLowerCase();

    if (lower.includes("verification link sent") || lower.includes("verification-link-sent")) {
      successMessage = "Kami telah mengirimkan tautan verifikasi ke email kamu. Silakan cek kotak masuk atau folder spam.";
    }

    setModalState({
      show: true,
      type: "success",
      title: "Pendaftaran Berhasil",
      message: successMessage,
    });
  }, [status]);

  useEffect(() => {
    if (Object.keys(errors).length === 0) return;

    let message = "Pendaftaran gagal. Silakan periksa kembali data yang kamu isi.";

    if (errors.email) {
      const emailErr = String(errors.email).toLowerCase();
      if (emailErr.includes("already been taken")) {
        message = "Email ini sudah terdaftar. Coba login atau gunakan email lain.";
      } else {
        message = errors.email;
      }
    } else if (errors.password) {
      message = errors.password;
    } else if (errors.nama) {
      message = errors.nama;
    }

    setModalState({
      show: true,
      type: "error",
      title: "Pendaftaran Gagal",
      message,
    });
  }, [errors]);

  const closeModal = () => {
    if (modalState.type === "success") {
      setModalState((prev) => ({ ...prev, show: false }));
      // Biasanya redirect ke halaman verifikasi email / login
      router.visit("/login");
    } else {
      setModalState((prev) => ({ ...prev, show: false }));
    }
  };

  const submit = (e) => {
    e.preventDefault();
    post("/register", {
      onSuccess: () => {
        reset("password", "password_confirmation");
        setModalState({
          show: true,
          type: "success",
          title: "Pendaftaran Berhasil",
          message:
            "Akun kamu berhasil dibuat. Jika diminta verifikasi email, silakan cek email kamu sebelum login.",
        });
      },
      onError: () => {
        // Pesan error akan di-handle oleh useEffect errors di atas
      },
    });
  };

  return (
    <>
      <Head title="Register" />

      <div className="min-h-screen w-full bg-white">
        <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
          {/* LEFT PANEL */}
          <div className="relative hidden lg:block overflow-hidden">
            {/* background */}
            <div className="absolute inset-0 bg-[#050a24]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(255,255,255,0.18)_0%,rgba(255,255,255,0)_45%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_70%,rgba(255,255,255,0.10)_0%,rgba(255,255,255,0)_55%)]" />

            {/* brand */}
            <div className="absolute left-20 top-16 inline-flex items-center gap-2">
              <div className="font-bold italic text-white text-[28px] tracking-[2.80px] leading-7 [font-family:'Poppins-BoldItalic',Helvetica]">
                Oopedia
              </div>
              <div className="font-bold italic text-primary text-[28px] tracking-[2.80px] leading-7 [font-family:'Poppins-BoldItalic',Helvetica]">
                .
              </div>
            </div>

            {/* hero text */}
            <div className="absolute left-20 bottom-20 max-w-[560px]">
              <p className="text-white/90 text-[64px] leading-[1.05] italic font-light [font-family:'Poppins-LightItalic',Helvetica]">
                Daftar sekarang
                <br />
                untuk menikmati
                <br />
                pengalaman
                <br />
                belajar yang
                <br />
                personal di
                <br />
                <span className="text-white/60">Oopedia.</span>
              </p>
            </div>
          </div>

          {/* RIGHT PANEL */}
          <div className="relative flex items-center justify-center bg-white px-6 py-12">
            {/* (opsional) brand kecil di mobile */}
            <div className="absolute left-6 top-6 inline-flex items-center gap-2 lg:hidden">
              <div className="font-bold italic text-[#050a24] text-[22px] tracking-[2.2px] leading-6 [font-family:'Poppins-BoldItalic',Helvetica]">
                Oopedia
              </div>
              <div className="font-bold italic text-primary text-[22px] tracking-[2.2px] leading-6 [font-family:'Poppins-BoldItalic',Helvetica]">
                .
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
              className="w-full max-w-[520px]"
            >
              {/* header */}
              <div className="mb-8 flex flex-col items-center text-center">
                <Logo className="h-[77px] w-[55px] object-cover" />
                <h1 className="text-3xl font-bold text-[#0f172a]">
                  Buat Akun Kamu
                </h1>
              </div>

              <form onSubmit={submit} className="space-y-6">
                {/* NAME */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Nama
                  </label>
                  <input
                    type="text"
                    value={data.nama}
                    onChange={(e) => setData("nama", e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    placeholder="Nama lengkap"
                    autoFocus
                    required
                  />
                  {errors.nama && (
                    <p className="mt-2 text-sm text-red-600">{errors.nama}</p>
                  )}
                </div>

                {/* EMAIL */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Email
                  </label>
                  <input
                    type="email"
                    value={data.email}
                    onChange={(e) => setData("email", e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    placeholder="nama@email.com"
                    required
                  />
                  {errors.email && (
                    <p className="mt-2 text-sm text-red-600">{errors.email}</p>
                  )}
                </div>

                {/* PASSWORD */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Password
                  </label>

                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={data.password}
                      onChange={(e) => setData("password", e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 pr-12 text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                      placeholder="Enter your password"
                      required
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                      aria-label="Toggle password visibility"
                    >
                      {/* eye icon */}
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    </button>
                  </div>

                  {errors.password && (
                    <p className="mt-2 text-sm text-red-600">{errors.password}</p>
                  )}
                </div>

                {/* CONFIRM PASSWORD */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Konfirmasi Password
                  </label>
                  <input
                    type="password"
                    value={data.password_confirmation}
                    onChange={(e) =>
                      setData("password_confirmation", e.target.value)
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    placeholder="Ulangi password"
                    required
                  />
                  {errors.password_confirmation && (
                    <p className="mt-2 text-sm text-red-600">
                      {errors.password_confirmation}
                    </p>
                  )}
                </div>

                {/* BUTTON */}
                <button
                  type="submit"
                  disabled={processing}
                  className="w-full rounded-xl bg-blue-600 py-3.5 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {processing ? "Loading..." : "Daftar Akun"}
                </button>
              </form>

              {/* FOOTER LINK */}
              <div className="mt-6 text-center text-sm text-slate-500">
                Already Have An Account ?{" "}
                <Link href="/login" className="font-semibold text-blue-600">
                  Log In
                </Link>
              </div>
            </motion.div>
        </div>
        </div>
      </div>

      <StatusModal
        show={modalState.show}
        type={modalState.type}
        title={modalState.title}
        message={modalState.message}
        onClose={closeModal}
        onConfirm={closeModal}
      />
    </>
  );
}