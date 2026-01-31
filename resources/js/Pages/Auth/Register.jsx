import InputError from "@/Components/InputError";
import PrimaryButton from "@/Components/PrimaryButton";
import TextInput from "@/Components/TextInput";
import AuthLayout from "@/Layouts/AuthLayout";
import { Head, Link, useForm } from "@inertiajs/react";

export default function Register() {
  const { data, setData, post, processing, errors, reset } = useForm({
    name: "",
    email: "",
    password: "",
    password_confirmation: "",
  });

  const submit = (e) => {
    e.preventDefault();
    post(route("register"), { onFinish: () => reset("password", "password_confirmation") });
  };

  return (
    <AuthLayout>
      <Head title="Register" />

      <div className="flex justify-center mb-4">
        <img src="/images/logo.png" alt="Oopedia" className="h-14 w-auto" />
      </div>

      <h1 className="text-2xl font-semibold text-center text-slate-900">
        Buat Akun Kamu
      </h1>

      <form onSubmit={submit} className="mt-6 space-y-4">
        <div>
          <label className="text-sm text-slate-700">Name</label>
          <TextInput
            id="name"
            name="name"
            value={data.name}
            className="mt-1 block w-full rounded-lg"
            autoComplete="name"
            isFocused={true}
            onChange={(e) => setData("name", e.target.value)}
            required
          />
          <InputError message={errors.name} className="mt-2" />
        </div>

        <div>
          <label className="text-sm text-slate-700">Email</label>
          <TextInput
            id="email"
            type="email"
            name="email"
            value={data.email}
            className="mt-1 block w-full rounded-lg"
            autoComplete="username"
            onChange={(e) => setData("email", e.target.value)}
            required
          />
          <InputError message={errors.email} className="mt-2" />
        </div>

        <div>
          <label className="text-sm text-slate-700">Password</label>
          <TextInput
            id="password"
            type="password"
            name="password"
            value={data.password}
            className="mt-1 block w-full rounded-lg"
            autoComplete="new-password"
            onChange={(e) => setData("password", e.target.value)}
            required
          />
          <InputError message={errors.password} className="mt-2" />
        </div>

        <div>
          <label className="text-sm text-slate-700">Confirm Password</label>
          <TextInput
            id="password_confirmation"
            type="password"
            name="password_confirmation"
            value={data.password_confirmation}
            className="mt-1 block w-full rounded-lg"
            autoComplete="new-password"
            onChange={(e) => setData("password_confirmation", e.target.value)}
            required
          />
          <InputError message={errors.password_confirmation} className="mt-2" />
        </div>

        <PrimaryButton
          className="w-full justify-center py-3 rounded-lg bg-blue-600 hover:bg-blue-700"
          disabled={processing}
        >
          Daftar Akun
        </PrimaryButton>

        <p className="text-center text-sm text-slate-500">
          Already Have An Account?{" "}
          <Link href={route("login")} className="text-blue-600 hover:underline">
            Log In
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
