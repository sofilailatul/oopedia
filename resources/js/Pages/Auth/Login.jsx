import Checkbox from "@/Components/Checkbox";
import InputError from "@/Components/InputError";
import Button from "@/Components/Button";
import TextInput from "@/Components/TextInput";
import { Head, Link, useForm } from "@inertiajs/react";
import AuthLayout from "@/Layouts/AuthLayout";

export default function Login({ status }) {
  const { data, setData, post, processing, errors } = useForm({
    email: "",
    password: "",
    remember: false,
  });

  const submit = (e) => {
    e.preventDefault();
    post("/login"); // backend redirect ke /dashboard
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

              {status && (
                <div className="w-full rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                  {status}
                </div>
              )}

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
                  <Button color="blue" variant="solid" size="lg">
                    {processing ? "Loading..." : "Masuk Ke Akun"}
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
    </AuthLayout>
  );
}
