import React from "react";
import { Link, router, usePage } from "@inertiajs/react";
import AppLayout from "@/Layouts/AppLayout";

export default function Show({ user }) {
	const { flash } = usePage().props;

	const handleRoleChange = (e) => {
		const value = e.target.value;
		router.put(
			route("superadmin.users.role", user.id),
			{ role: value },
			{ preserveScroll: true }
		);
	};

	return (
		<AppLayout title="Detail User">
			<div className="mb-6 flex items-center justify-between gap-4">
				<div>
					<h1 className="text-2xl font-bold text-slate-900">Detail User</h1>
					<p className="mt-1 text-sm text-slate-600">
						Lihat informasi akun dan ubah role user.
					</p>
				</div>
				<Link
						href={route("superadmin.users.edit", user.id)}
					className="inline-flex items-center rounded-lg bg-amber-500 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-amber-600"
				>
					Edit
				</Link>
			</div>

			{flash?.success && (
				<div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-800">
					{flash.success}
				</div>
			)}

			<div className="grid gap-6 md:grid-cols-2">
				<div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
					<h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
						Informasi Dasar
					</h2>

					<dl className="mt-4 space-y-3 text-sm">
						<div>
							<dt className="text-slate-500">Nama</dt>
							<dd className="font-medium text-slate-900">{user.nama}</dd>
						</div>
						<div>
							<dt className="text-slate-500">Email</dt>
							<dd className="font-medium text-slate-900">{user.email}</dd>
						</div>
						<div>
							<dt className="text-slate-500">Role</dt>
							<dd className="font-medium text-slate-900 capitalize">{user.role}</dd>
						</div>
						<div>
							<dt className="text-slate-500">Dibuat</dt>
							<dd className="font-medium text-slate-900">
								{user.created_at
									? new Date(user.created_at).toLocaleString("id-ID")
									: "-"}
							</dd>
						</div>
					</dl>
				</div>

				<div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
					<h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
						Aksi Cepat
					</h2>

					<div className="mt-4 space-y-4 text-sm">
						<div>
							<label className="block text-sm font-medium text-slate-700">
								Ubah Role
							</label>
							<select
								defaultValue={user.role}
								onChange={handleRoleChange}
								className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
							>
								<option value="superadmin">Superadmin</option>
								<option value="admin">Admin</option>
								<option value="dosen">Dosen</option>
								<option value="mahasiswa">Mahasiswa</option>
								<option value="tamu">Tamu</option>
							</select>
						</div>

						<p className="text-xs text-slate-500">
							Perubahan role akan langsung berlaku setelah dipilih. Gunakan
							dengan hati-hati.
						</p>
					</div>
				</div>
			</div>
		</AppLayout>
	);
}
