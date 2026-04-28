import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Checkbox from "@/Components/CheckboxCard";
import InputError from "@/Components/InputError";
import Field from "@/Components/Field";
import StatusModal from "@/Components/StatusModal";
import { Head, Link, useForm, router } from "@inertiajs/react";
import AuthLayout from "@/Layouts/AuthLayout";
import axios from "axios";

export default function Login({ status }) {
  const { data, setData, errors, clearErrors, setError } = useForm({
    email: "",
    password: "",
    remember: false,
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [modalState, setModalState] = useState({
    show: false,
    type: "success",
    title: "",
    message: "",
  });

  useEffect(() => {
    if (status) {
      let successMessage = status;
      const statusLower = status.toLowerCase();

      if (statusLower.includes("we have emailed")) {
        successMessage =
          "Tautan reset password sudah dikirim ke email kamu. Cek inbox atau folder spam ya.";
      } else if (statusLower.includes("password has been reset")) {
        successMessage =
          "Password berhasil diperbarui. Sekarang kamu bisa login lagi.";
      }

      setModalState({
        show: true,
        type: "success",
        title: "Berhasil",
        message: successMessage,
      });
    }
  }, [status]);

  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      let errorMessage = "Silakan periksa kembali email dan password kamu.";

      if (errors.email) {
        const emailErr = errors.email.toLowerCase();
        if (emailErr.includes("credentials do not match")) {
          errorMessage = "Email atau password yang kamu masukkan salah.";
        } else if (emailErr.includes("too many login attempts")) {
          errorMessage =
            "Terlalu banyak percobaan login. Silakan coba lagi beberapa saat.";
        } else {
          errorMessage = errors.email;
        }
      } else if (errors.password) {
        errorMessage = errors.password;
      }

      setModalState({
        show: true,
        type: "error",
        title: "Login Gagal",
        message: errorMessage,
      });
    }
  }, [errors]);

  const closeModal = () => {
    if (modalState.type === "success") {
      setModalState((prev) => ({ ...prev, show: false }));
      router.visit("/dashboard");
    } else {
      setModalState((prev) => ({ ...prev, show: false }));
      clearErrors();
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    clearErrors();
    setIsProcessing(true);

    try {
      await axios.post("/login", {
        email: data.email,
        password: data.password,
        remember: data.remember,
      });

      setIsProcessing(false);
      setModalState({
        show: true,
        type: "success",
        title: "Login Berhasil",
        message:
          "Selamat datang kembali di OOpedia. Klik OK untuk masuk ke dashboard.",
      });
    } catch (error) {
      setIsProcessing(false);

      if (error.response && error.response.status === 422) {
        const errs = error.response.data.errors;
        if (errs) {
          const newErrors = {};
          Object.keys(errs).forEach((key) => {
            newErrors[key] = errs[key][0];
          });
          setError(newErrors);
        }
      } else {
        setModalState({
          show: true,
          type: "error",
          title: "Login Gagal",
          message: "Terjadi kesalahan sistem. Silakan coba lagi.",
        });
      }
    }
  };

  return (
    <AuthLayout>
      <Head title="Login" />
      <div className="relative h-screen overflow-hidden bg-[#050a24]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(255,255,255,0.16)_0%,rgba(255,255,255,0)_45%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(255,208,0,0.10)_0%,rgba(255,208,0,0)_35%)]" />
        <div className="absolute top-16 left-12 h-40 w-40 rounded-full bg-yellow-300/10 blur-3xl" />
        <div className="absolute bottom-10 right-10 h-56 w-56 rounded-full bg-white/10 blur-3xl" />

        <div className="relative z-10 grid h-screen grid-cols-1 overflow-hidden lg:grid-cols-2">
        {/* LEFT PANEL */}
          <div className="relative hidden h-full lg:block">
            <div className="absolute bottom-20 left-16 max-w-[580px] text-white">
              <h1 className="mt-6 text-5xl font-semibold leading-[1.05]">
              Balik lagi,
              <br />
              lanjutkan progres
              <br />
              belajarmu di
              <br />
              <span className="text-yellow-300 font-bold text-7xl">OOpedia.</span>
            </h1>
          </div>
        </div>

        {/* RIGHT PANEL */}
          <div className="relative flex h-full items-center justify-center px-6 py-8">
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
              className="relative z-10 w-full max-w-[560px]"
            >
            <div className="custom-scrollbar-soft max-h-[90vh] overflow-y-auto rounded-3xl border border-white/10 bg-white/5 p-8 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl">
              <div className="mb-8 flex flex-col items-center text-center">
                <img
                  className="mb-4 h-[70px] w-auto object-contain"
                  alt="OOpedia logo"
                  src="/images/logo.png"
                />
                <h1 className="text-2xl font-bold text-white">
                  Masuk ke akun kamu
                </h1>
              </div>

              <form onSubmit={submit} className="space-y-5">
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
                  autoFocus
                  autoComplete="username"
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
                  autoComplete="current-password"
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


                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="w-full rounded-xl bg-yellow-400 py-3.5 font-semibold text-slate-900 transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isProcessing ? "Memproses..." : "Masuk Sekarang"}
                  </button>
                </div>
              </form>

              <p className="mt-6 text-center text-sm text-white/65">
                Belum punya akun?{" "}
                <Link
                  href="/register"
                  className="font-semibold text-yellow-300 hover:underline"
                >
                  Daftar sekarang
                </Link>
              </p>

              <div className="mt-4 text-center">
                <Link
                  href="/"
                  className="text-sm text-white/45 transition hover:text-white/70"
                >
                  ← Kembali ke beranda
                </Link>
              </div>
            </div>
          </motion.div>
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
      </div>
    </AuthLayout>
  );
}