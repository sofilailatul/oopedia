import React from "react";
import { Link, router, usePage } from "@inertiajs/react";
import AppLayout from "@/Layouts/AppLayout";
import Card from "@/Components/Card";
import Button from "@/Components/Button";

export default function Index({ users, filters }) {
	const { flash } = usePage().props;

	const handleFilterChange = (key, value) => {
		router.get(
			route("superadmin.users.index"),
			{ ...filters, [key]: value || undefined, page: undefined },
			{ preserveScroll: true, preserveState: true, replace: true }
		);
	};

	const handleDelete = (user) => {
		if (!window.confirm(`Hapus user "${user.nama}"?`)) return;

		router.delete(route("superadmin.users.destroy", user.id), {
			preserveScroll: true,
		});
	};

	const totalUsers = users?.total ?? users?.data?.length ?? 0;

	return (
		<AppLayout title="Kelola User" label="Kelola User">
			<div className="mx-auto max-w-7xl space-y-6 pb-8">
				<Card className="rounded-3xl border border-slate-200/80 bg-white/95">
					<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
						<div className="space-y-1">
							<p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-500">
								Manajemen User
							</p>
							<h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
								Kelola User
							</h1>
							<p className="text-xs text-slate-500">
								Atur akun superadmin, dosen, mahasiswa, dan tamu dalam satu tempat.
							</p>
						</div>
						<div className="flex flex-col items-end gap-2">
							<span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-medium text-slate-600">
								{totalUsers} user terdaftar
							</span>
							<Button
								as={Link}
								href={route("superadmin.users.create")}
								color="blue"
								variant="solid"
								size="sm"
								className="rounded-full"
							>
								+ Tambah User
							</Button>
						</div>
					</div>
				</Card>

				{flash?.success && (
					<div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-800">
						{flash.success}
					</div>
				)}
				{flash?.error && (
					<div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-800">
						{flash.error}
					</div>
				)}

				<Card className="rounded-3xl border border-slate-200/80 bg-slate-50/70">
					<div className="mb-4 flex flex-wrap items-center justify-between gap-3">
						<div>
							<h2 className="text-sm font-semibold text-slate-900">Daftar User</h2>
							<p className="text-[11px] text-slate-500">Filter berdasarkan nama, email, atau role.</p>
						</div>
					</div>
					<div className="mb-4 flex flex-wrap items-center gap-3">
						<input
							type="text"
							placeholder="Cari nama atau email..."
							defaultValue={filters?.search || ""}
							onBlur={(e) => handleFilterChange("search", e.target.value)}
							className="w-full max-w-xs rounded-xl border border-slate-300 bg-white/80 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
						/>

						<select
							defaultValue={filters?.role || ""}
							onChange={(e) => handleFilterChange("role", e.target.value)}
							className="rounded-xl border border-slate-300 bg-white/80 px-3 py-2 text-sm text-slate-800 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
						>
							<option value="">Semua Role</option>
							<option value="superadmin">Superadmin</option>
							<option value="admin">Admin</option>
							<option value="dosen">Dosen</option>
							<option value="mahasiswa">Mahasiswa</option>
							<option value="tamu">Tamu</option>
						</select>
					</div>

					<div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white/95 shadow-sm">
						<table className="min-w-full border-separate border-spacing-y-1 text-sm">
							<thead className="bg-slate-50 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
								<tr>
									<th className="px-4 py-3">Nama</th>
									<th className="px-4 py-3">Email</th>
									<th className="px-4 py-3">Role</th>
									<th className="px-4 py-3">Dibuat</th>
									<th className="px-4 py-3 text-right">Aksi</th>
								</tr>
							</thead>
							<tbody>
								{users?.data?.length ? (
									users.data.map((user) => (
										<tr key={user.id} className="rounded-xl border border-slate-100 bg-white shadow-[0_1px_0_rgba(15,23,42,0.03)] hover:border-sky-200 hover:shadow-[0_6px_18px_rgba(56,189,248,0.18)]">
											<td className="px-4 py-2 text-sm font-medium text-slate-900">
												{user.nama}
											</td>
											<td className="px-4 py-2 text-sm text-slate-700">
												{user.email}
											</td>
											<td className="px-4 py-2 text-sm capitalize text-slate-700">
												{user.role}
											</td>
											<td className="px-4 py-2 text-xs text-slate-500">
												{user.created_at
													? new Date(user.created_at).toLocaleDateString("id-ID")
													: "-"}
											</td>
											<td className="px-4 py-2 text-right text-xs">
												<div className="inline-flex items-center gap-1.5">
													<Link
														href={route("superadmin.users.show", user.id)}
														className="rounded-full border border-slate-200 px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:border-slate-300 hover:bg-slate-50"
													>
														Detail
													</Link>
													<Link
														href={route("superadmin.users.edit", user.id)}
														className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-800 hover:bg-amber-100"
													>
														Edit
													</Link>
													<button
														onClick={() => handleDelete(user)}
														className="rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] font-medium text-rose-700 hover:bg-rose-100"
													>
														Hapus
													</button>
												</div>
											</td>
										</tr>
									))
								) : (
									<tr>
										<td className="px-4 py-5 text-center text-sm text-slate-500" colSpan={5}>
											Belum ada user.
										</td>
									</tr>
								)}
							</tbody>
						</table>
					</div>
				</Card>

				{users?.links && (
					<div className="mt-4 flex flex-wrap gap-2">
						{users.links.map((link, idx) => (
							<button
								key={idx}
								disabled={!link.url}
								onClick={() => link.url && router.visit(link.url, { preserveScroll: true })}
								className={[
									"rounded-full px-3 py-1.5 text-[11px] font-medium",
									link.active
										? "bg-sky-600 text-white shadow-sm"
										: link.url
										? "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
										: "bg-slate-100 text-slate-400",
								].join(" ")}
								dangerouslySetInnerHTML={{ __html: link.label }}
							/>
						))}
					</div>
				)}
			</div>
		</AppLayout>
	);
}
