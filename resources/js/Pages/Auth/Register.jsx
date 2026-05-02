import { Head, Link, useForm, router } from "@inertiajs/react";
import InputError from "@/Components/InputError";
import Field from "@/Components/Field";
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
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

    if (
      lower.includes("verification link sent") ||
      lower.includes("verification-link-sent")
    ) {
      successMessage =
        "Kami telah mengirim tautan verifikasi ke email kamu. Silakan cek inbox atau folder spam.";
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
            "Akun kamu berhasil dibuat. Kalau diminta verifikasi email, silakan cek email kamu sebelum login.",
        });
      },
    });
  };

  return (
    <>
      <Head title="Register" />

      <div className="relative h-screen overflow-hidden bg-[#050a24]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(255,255,255,0.16)_0%,rgba(255,255,255,0)_45%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(99,102,241,0.10)_0%,rgba(99,102,241,0)_35%)]" />
        <div className="absolute top-16 left-12 h-40 w-40 rounded-full bg-blue-400/10 blur-3xl" />
        <div className="absolute bottom-10 right-10 h-56 w-56 rounded-full bg-white/10 blur-3xl" />

        <div className="relative z-10 grid h-screen grid-cols-1 overflow-hidden lg:grid-cols-2">
          {/* LEFT */}
          <div className="relative hidden h-full lg:block">
            <div className="absolute bottom-20 left-16 max-w-[580px] text-white">
              <span className="inline-block rounded-full border border-white/20 bg-white/10 px-4 py-2 text-[12px] text-white/80 backdrop-blur-sm">
                Yuk mulai perjalanan belajarmu dari sini
              </span>

              <h1 className="mt-6 text-6xl font-bold leading-[1.05]">
                Bikin akun,
                <br />
                mulai belajar,
                <br />
                dan naik level
                <br />
                bareng
                <br />
                <span className="text-blue-400">OOpedia.</span>
              </h1>

              <p className="mt-5 max-w-lg text-base leading-7 text-white/75">
                Dapatkan pengalaman belajar PBO yang lebih adaptif dengan materi
                bertahap, latihan soal, feedback instan, dan rekomendasi belajar.
              </p>
            </div>
          </div>

          {/* RIGHT */}
          <div className="relative flex h-full items-center justify-center px-6 py-8">
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
              className="relative z-10 w-full max-w-[560px]"
            >
              <div className="custom-scrollbar-soft max-h-[90vh] overflow-y-auto rounded-3xl border border-white/10 bg-white/5 p-8 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl">
                <div className="mb-8 flex flex-col items-center text-center">
                  <Logo className="mb-4 h-[72px] w-auto object-contain" />
                  <h1 className="text-3xl font-bold text-white">
                    Buat akun kamu
                  </h1>
                  <p className="mt-2 text-[12px] text-white/65">
                    Daftar sekarang untuk mulai belajar lebih terarah di OOpedia.
                  </p>
                </div>

                <form onSubmit={submit} className="space-y-5">
                  <Field
                    label="Nama lengkap"
                    name="nama"
                    value={data.nama}
                    onChange={(e) => setData("nama", e.target.value)}
                    error={errors.nama}
                    placeholder="Masukkan nama lengkap"
                    inputClassName="bg-white/5 text-white"
                    required
                  />

                  <Field
                    label="Email"
                    name="email"
                    type="email"
                    value={data.email}
                    onChange={(e) => setData("email", e.target.value)}
                    error={errors.email}
                    placeholder="nama@email.com"
                    inputClassName="bg-white/5 text-white"
                    required
                  />

                  <Field
                    label="Password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={data.password}
                    onChange={(e) => setData("password", e.target.value)}
                    error={errors.password}
                    placeholder="Masukkan password"
                    inputClassName="bg-white/5 text-white pr-12"
                    required
                  >
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-white/60 hover:bg-white/10"
                    >
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
                  </Field>

                  <Field
                    label="Konfirmasi password"
                    name="password_confirmation"
                    type={showConfirmPassword ? "text" : "password"}
                    value={data.password_confirmation}
                    onChange={(e) => setData("password_confirmation", e.target.value)}
                    error={errors.password_confirmation}
                    placeholder="Ulangi password"
                    inputClassName="bg-white/5 text-white pr-12"
                    required
                  >
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-white/60 hover:bg-white/10"
                    >
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
                  </Field>


                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={processing}
                      className="w-full rounded-xl bg-blue-600 py-3.5 font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {processing ? "Memproses..." : "Daftar Sekarang"}
                    </button>
                  </div>
                </form>

                <div className="mt-6 text-center text-[12px] text-white/65">
                  Sudah punya akun?{" "}
                  <Link
                    href="/login"
                    className="font-semibold text-blue-400 hover:underline"
                  >
                    Masuk di sini
                  </Link>
                </div>

                <div className="mt-4 text-center">
                  <Link
                    href="/"
                    className="text-[12px] text-white/45 transition hover:text-white/70"
                  >
                    ← Kembali ke beranda
                  </Link>
                </div>
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