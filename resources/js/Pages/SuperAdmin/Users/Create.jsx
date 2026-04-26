import React from "react";
import { useForm } from "@inertiajs/react";
import AppLayout from "@/Layouts/AppLayout";

export default function Create() {
	const { data, setData, post, processing, errors } = useForm({
		nama: "",
		email: "",
		password: "",
		role: "mahasiswa",
	});

	const handleSubmit = (e) => {
		e.preventDefault();
		post(route("superadmin.users.store"));
	};

	return (
		<AppLayout title="Tambah User">
			<div className="mb-6">
				<h1 className="text-2xl font-bold text-slate-900">Tambah User</h1>
				<p className="mt-1 text-sm text-slate-600">
					Buat akun baru untuk admin, dosen, mahasiswa, atau tamu.
				</p>
			</div>

			<form
				onSubmit={handleSubmit}
				className="max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
			>
				<div className="space-y-4">
					<div>
						<label className="block text-sm font-medium text-slate-700">Nama</label>
						<input
							type="text"
							value={data.nama}
							onChange={(e) => setData("nama", e.target.value)}
							className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
						/>
						{errors.nama && (
							<p className="mt-1 text-xs text-rose-600">{errors.nama}</p>
						)}
					</div>

					<div>
						<label className="block text-sm font-medium text-slate-700">Email</label>
						<input
							type="email"
							value={data.email}
							onChange={(e) => setData("email", e.target.value)}
							className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
						/>
						{errors.email && (
							<p className="mt-1 text-xs text-rose-600">{errors.email}</p>
						)}
					</div>

					<div>
						<label className="block text-sm font-medium text-slate-700">Password</label>
						<input
							type="password"
							value={data.password}
							onChange={(e) => setData("password", e.target.value)}
							className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
						/>
						{errors.password && (
							<p className="mt-1 text-xs text-rose-600">{errors.password}</p>
						)}
					</div>

					<div>
						<label className="block text-sm font-medium text-slate-700">Role</label>
						<select
							value={data.role}
							onChange={(e) => setData("role", e.target.value)}
							className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
						>
							<option value="superadmin">Superadmin</option>
							<option value="admin">Admin</option>
							<option value="dosen">Dosen</option>
							<option value="mahasiswa">Mahasiswa</option>
							<option value="tamu">Tamu</option>
						</select>
						{errors.role && (
							<p className="mt-1 text-xs text-rose-600">{errors.role}</p>
						)}
					</div>
				</div>

				<div className="mt-6 flex items-center gap-3">
					<button
						type="submit"
						disabled={processing}
						className="inline-flex items-center rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-700 disabled:opacity-60"
					>
						Simpan
					</button>
				</div>
			</form>
		</AppLayout>
	);
}
