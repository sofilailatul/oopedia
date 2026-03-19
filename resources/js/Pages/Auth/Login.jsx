import { useState, useEffect } from "react";
import Checkbox from "@/Components/Checkbox";
import InputError from "@/Components/InputError";
import Button from "@/Components/Button";
import TextInput from "@/Components/TextInput";
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
        successMessage = "Kami telah mengirimkan tautan untuk mereset password ke email Anda.";
      } else if (statusLower.includes("password has been reset")) {
        successMessage = "Password Anda berhasil diperbarui. Silakan login.";
      } else if (statusLower.includes("success")) {
        // Fallback untuk pesan success umum
        successMessage = "Operasi berhasil dilakukan.";
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
      let errorMessage = "Silakan periksa kembali email dan password Anda.";
      
      if (errors.email) {
        const emailErr = errors.email.toLowerCase();
        if (emailErr.includes("credentials do not match")) {
          errorMessage = "Email atau password yang Anda masukkan salah.";
        } else if (emailErr.includes("too many login attempts")) {
          errorMessage = "Terlalu banyak percobaan login. Silakan coba lagi nanti.";
        } else {
          errorMessage = errors.email;
        }
      } else if (errors.password) {
        errorMessage = errors.password;
      }

      setModalState({
        show: true,
        type: "error",
        title: "Gagal Login",
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
        message: "Selamat datang kembali! Klik OK untuk melanjutkan ke dashboard.",
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
          title: "Gagal Login",
          message: "Terjadi kesalahan sistem. Silakan periksa koneksi Anda.",
        });
      }
    }
  };

  return (
    <AuthLayout>
      <Head title="Login" />
        {/* Card */}
        <div className="flex min-h-screen items-center justify-center px-4">
          <div className="flex w-full max-w-[700px] flex-col items-center justify-center gap-3 rounded-[20px] bg-white px-[70px] py-6">
            {/* Logo */}
            <div className="flex w-full flex-col items-center gap-[5px]">
              <img
                className="h-[77px] w-[55px] object-cover"
                alt="Oopedia logo"
                src="/images/logo.png"
              />
            </div>

            {/* Title + Form */}
            <div className="flex w-full flex-col gap-4">
              <h1 className="text-[#101828] text-xl font-semibold text-center">
                Masuk ke Akun Kamu
              </h1>

              <form onSubmit={submit} className="w-full space-y-3 items-center">
                {/* Email */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Email
                  </label>

                  <TextInput
                    type="email"
                    name="email"
                    value={data.email}
                    className="w-full"
                    autoComplete="username"
                    autoFocus
                    onChange={(e) => setData("email", e.target.value)}
                    required
                    placeholder="nama@email.com"
                  />

                  <InputError message={errors.email} className="mt-2" />
                </div>

                {/* Password */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Password
                  </label>

                  <TextInput
                    type="password"
                    name="password"
                    value={data.password}
                    className="w-full"
                    autoComplete="current-password"
                    onChange={(e) => setData("password", e.target.value)}
                    required
                    placeholder="••••••••"
                  />

                  <InputError message={errors.password} className="mt-2" />
                </div>

                {/* Remember + Forgot */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center">
                    <Checkbox
                      name="remember"
                      checked={data.remember}
                      onChange={(e) => setData("remember", e.target.checked)}
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Ingat saya
                    </span>
                  </label>

                  <Link
                    href="/forgot-password"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Lupa password?
                  </Link>
                </div>

                {/* Submit */}
                <div className="flex justify-center">
                  <Button color="blue" variant="solid" size="lg" disabled={isProcessing}>
                    {isProcessing ? "Loading..." : "Masuk Ke Akun"}
                  </Button>
                </div>
              </form>

              {/* Register */}
              <p className="mt-2 text-center text-sm text-gray-600">
                Belum punya akun?{" "}
                <Link
                  href="/register"
                  className="font-medium text-blue-600 hover:underline"
                >
                  Daftar sekarang
                </Link>
              </p>

              {/* Back */}
              <div className="mt-2 text-center">
                <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
                  ← Kembali ke Beranda
                </Link>
              </div>
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
    </AuthLayout>
  );
}
