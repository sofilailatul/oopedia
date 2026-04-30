import React, { useState } from "react";
import { Link, router, usePage, useForm } from "@inertiajs/react";
import AppLayout from "@/Layouts/AppLayout";
import Card from "@/Components/Card";
import Button from "@/Components/Button";
import Dropdown from "@/Components/Dropdown";
import Field from "@/Components/Field";
import Modal from "@/Components/Modal";
import StatusModal from "@/Components/StatusModal";

export default function Index({ users, filters }) {
  const { flash } = usePage().props;

  const [modalState, setModalState] = useState({
    isOpen: false,
    type: null, // 'create', 'edit', 'show'
    user: null,
  });

  const [statusModal, setStatusModal] = useState({
    isOpen: false,
    type: "success", // 'success', 'error', 'confirm'
    title: "",
    message: "",
    userToDelete: null,
    onConfirm: null,
    confirmText: null,
  });

  const handleResetPassword = (user) => {
    setStatusModal({
        isOpen: true,
        type: "confirm",
        title: "Reset Password",
        message: `Reset password "${user.nama}" ke password default?`,
        userToDelete: null,
        confirmText: "Ya, Reset",
        onConfirm: () => {
            router.post(
                route("superadmin.users.resetPassword", user.id),
                {},
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        setStatusModal({
                            isOpen: true,
                            type: "success",
                            title: "Berhasil",
                            message: `Password "${user.nama}" berhasil direset ke: password123`,
                            userToDelete: null,
                        });
                    },
                },
            );
        },
    });
};

  const { data, setData, post, put, processing, errors, reset, clearErrors } =
    useForm({
      nama: "",
      email: "",
      password: "",
      role: "mahasiswa",
    });

  const openModal = (type, user = null) => {
    clearErrors();
    if (type === "create") {
      reset();
      setData({ nama: "", email: "", password: "", role: "mahasiswa" });
    } else if (type === "edit" || type === "show") {
      setData({
        nama: user.nama || "",
        email: user.email || "",
        password: "",
        role: user.role || "mahasiswa",
      });
    }
    setModalState({ isOpen: true, type, user });
  };

  const closeModal = () => {
    setModalState({ isOpen: false, type: null, user: null });
    reset();
    clearErrors();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (modalState.type === "create") {
      post(route("superadmin.users.store"), {
        onSuccess: () => closeModal(),
        preserveScroll: true,
      });
    } else if (modalState.type === "edit") {
      put(route("superadmin.users.update", modalState.user.id), {
        onSuccess: () => closeModal(),
        preserveScroll: true,
      });
    }
  };

  const handleRoleChange = (e) => {
    if (!modalState.user) return;
    const value = e.target.value;
    router.put(
      route("superadmin.users.role", modalState.user.id),
      { role: value },
      {
        preserveScroll: true,
        onSuccess: () => {
          setModalState((prev) => ({
            ...prev,
            user: { ...prev.user, role: value },
          }));
        },
      },
    );
  };

  const handleFilterChange = (key, value) => {
    router.get(
      route("superadmin.users.index"),
      { ...filters, [key]: value || undefined, page: undefined },
      { preserveScroll: true, preserveState: true, replace: true },
    );
  };

  const confirmDelete = (user) => {
    setStatusModal({
      isOpen: true,
      type: "confirm",
      title: "Konfirmasi Hapus User",
      message: `Apakah Anda yakin ingin menghapus user "${user.nama}"? Tindakan ini tidak dapat dibatalkan.`,
      userToDelete: user,
      confirmText: "Hapus",
      onConfirm: executeDelete,
    });
  };

  const executeDelete = () => {
    if (!statusModal.userToDelete) return;

    router.delete(
      route("superadmin.users.destroy", statusModal.userToDelete.id),
      {
        preserveScroll: true,
        onSuccess: () => {
          setStatusModal({
            isOpen: true,
            type: "success",
            title: "Berhasil",
            message: `User "${statusModal.userToDelete.nama}" telah berhasil dihapus.`,
            userToDelete: null,
          });
        },
        onError: () => {
          setStatusModal({
            isOpen: true,
            type: "error",
            title: "Gagal Menghapus",
            message:
              "Terjadi kesalahan saat menghapus user. Silakan coba lagi.",
            userToDelete: null,
          });
        },
      },
    );
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
                Atur akun superadmin, dosen, mahasiswa, dan tamu dalam satu
                tempat.
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-medium text-slate-600">
                {totalUsers} user terdaftar
              </span>
              <Button
                onClick={() => openModal("create")}
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
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Daftar User
              </h2>
              <p className="text-[11px] text-slate-500">
                Filter berdasarkan nama, email, atau role.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Field
                placeholder="Cari nama atau email..."
                defaultValue={filters?.search || ""}
                onBlur={(e) => handleFilterChange("search", e.target.value)}
                className="mb-0 w-64"
                inputClassName="bg-white/80"
              />

              <Dropdown>
                <Dropdown.Trigger>
                  <div className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-300 bg-white/80 px-3 py-2 text-sm text-slate-800 hover:border-slate-400 focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-200 transition-all">
                    <span className="font-medium">
                      {filters?.role
                        ? filters.role.charAt(0).toUpperCase() +
                          filters.role.slice(1)
                        : "Semua Role"}
                    </span>
                    <span className="text-slate-400 text-[10px]">▼</span>
                  </div>
                </Dropdown.Trigger>
                <Dropdown.Content width="full">
                  <Dropdown.Item
                    onClick={() => handleFilterChange("role", "")}
                    className={
                      !filters?.role
                        ? "bg-sky-50 text-sky-700 font-semibold"
                        : ""
                    }
                  >
                    Semua Role
                  </Dropdown.Item>
                  <Dropdown.Item
                    onClick={() => handleFilterChange("role", "superadmin")}
                    className={
                      filters?.role === "superadmin"
                        ? "bg-sky-50 text-sky-700 font-semibold"
                        : ""
                    }
                  >
                    Superadmin
                  </Dropdown.Item>
                  <Dropdown.Item
                    onClick={() => handleFilterChange("role", "dosen")}
                    className={
                      filters?.role === "dosen"
                        ? "bg-sky-50 text-sky-700 font-semibold"
                        : ""
                    }
                  >
                    Dosen
                  </Dropdown.Item>
                  <Dropdown.Item
                    onClick={() => handleFilterChange("role", "mahasiswa")}
                    className={
                      filters?.role === "mahasiswa"
                        ? "bg-sky-50 text-sky-700 font-semibold"
                        : ""
                    }
                  >
                    Mahasiswa
                  </Dropdown.Item>
                  <Dropdown.Item
                    onClick={() => handleFilterChange("role", "tamu")}
                    className={
                      filters?.role === "tamu"
                        ? "bg-sky-50 text-sky-700 font-semibold"
                        : ""
                    }
                  >
                    Tamu
                  </Dropdown.Item>
                </Dropdown.Content>
              </Dropdown>
            </div>
          </div>

          <div className="overflow-x-auto rounded-3xl border border-slate-200/80 bg-white shadow-sm">
            <table className="min-w-full text-left text-sm text-slate-600">
              <thead className="border-b border-slate-200 bg-slate-50/50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Bergabung</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/80">
                {users?.data?.length ? (
                  users.data.map((user) => (
                    <tr
                      key={user.id}
                      className="group transition-all hover:bg-slate-50/80"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-100 to-indigo-100 font-bold text-sky-700 ring-2 ring-white shadow-sm">
                            {user.nama.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[13px] font-semibold text-slate-900 group-hover:text-sky-600 transition-colors">
                              {user.nama}
                            </span>
                            <span className="text-[11px] text-slate-500">
                              {user.email}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            user.role === "superadmin"
                              ? "bg-purple-100 text-purple-700 ring-1 ring-inset ring-purple-600/10"
                              : user.role === "dosen"
                                ? "bg-sky-100 text-sky-700 ring-1 ring-inset ring-sky-600/10"
                                : user.role === "mahasiswa"
                                  ? "bg-emerald-100 text-emerald-700 ring-1 ring-inset ring-emerald-600/10"
                                  : "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-600/10"
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-[12px] font-medium text-slate-500">
                        {user.created_at
                          ? new Date(user.created_at).toLocaleDateString(
                              "id-ID",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              },
                            )
                          : "-"}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100 lg:opacity-100">
                          <Button
                            onClick={() => openModal("show", user)}
                            variant="ghost"
                            color="gray"
                            size="sm"
                            className="h-8 w-8 !p-0 rounded-full bg-white"
                            title="Detail"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                              />
                            </svg>
                          </Button>
                          <Button
                            onClick={() => openModal("edit", user)}
                            variant="ghost"
                            color="yellow"
                            size="sm"
                            className="h-8 w-8 !p-0 rounded-full bg-white"
                            title="Edit"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                              />
                            </svg>
                          </Button>
                          <Button
                            variant="ghost"
                            color="red"
                            size="sm"
                            className="h-8 w-8 !p-0 rounded-full bg-white"
                            onClick={() => confirmDelete(user)}
                            title="Hapus"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      className="px-6 py-8 text-center text-sm text-slate-500"
                      colSpan={4}
                    >
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
                onClick={() =>
                  link.url && router.visit(link.url, { preserveScroll: true })
                }
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

      {/* Modal Create/Edit */}
      <Modal
        show={
          modalState.isOpen &&
          (modalState.type === "create" || modalState.type === "edit")
        }
        onClose={closeModal}
        maxWidth="md"
      >
        <form onSubmit={handleSubmit} className="p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4">
            {modalState.type === "create" ? "Tambah User Baru" : "Edit User"}
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Nama
              </label>
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
              <label className="block text-sm font-medium text-slate-700">
                Email
              </label>
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
              <label className="block text-sm font-medium text-slate-700">
                Password {modalState.type === "edit" && "(opsional)"}
              </label>
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
              <label className="block text-sm font-medium text-slate-700">
                Role
              </label>
              <Dropdown>
                <Dropdown.Trigger>
                  <div className="mt-1 flex w-full cursor-pointer items-center justify-between rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 hover:border-slate-400 focus-within:border-sky-500 focus-within:ring-1 focus-within:ring-sky-500 transition-all">
                    <span className="capitalize">{data.role}</span>
                    <span className="text-slate-400 text-[10px]">▼</span>
                  </div>
                </Dropdown.Trigger>
                <Dropdown.Content width="full">
                  {["superadmin", "admin", "dosen", "mahasiswa", "tamu"].map(
                    (r) => (
                      <Dropdown.Item
                        key={r}
                        onClick={() => setData("role", r)}
                        className={
                          data.role === r
                            ? "bg-sky-50 text-sky-700 font-semibold"
                            : ""
                        }
                      >
                        <span className="capitalize">{r}</span>
                      </Dropdown.Item>
                    ),
                  )}
                </Dropdown.Content>
              </Dropdown>
              {errors.role && (
                <p className="mt-1 text-xs text-rose-600">{errors.role}</p>
              )}
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              color="gray"
              onClick={closeModal}
            >
              Batal
            </Button>
            <Button type="submit" color="blue" disabled={processing}>
              Simpan
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Show */}
      <Modal
        show={modalState.isOpen && modalState.type === "show"}
        onClose={closeModal}
        maxWidth="sm"
      >
        {modalState.user && (
          <div className="p-6">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Detail User</h2>
              <Button
                type="button"
                variant="ghost"
                color="gray"
                size="sm"
                onClick={closeModal}
                className="h-8 w-8 !p-0 rounded-full"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </Button>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-100 to-indigo-100 text-xl font-bold text-sky-700 ring-4 ring-slate-50">
                  {modalState.user.nama.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {modalState.user.nama}
                  </h3>
                  <p className="text-sm text-slate-500">
                    {modalState.user.email}
                  </p>
                </div>
              </div>

			  <div className="flex justify-between items-center border-t border-slate-200/60 pt-3">
				<dt className="text-slate-500">Password</dt>
				<dd>
					<Button
					size="sm"
					color="blue"
					variant="ghost"
					onClick={() => handleResetPassword(modalState.user)}
					>
					Reset Password
					</Button>
				</dd>
				</div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <dl className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Role</dt>
                    <dd className="font-medium capitalize text-slate-900">
                      {modalState.user.role}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Bergabung</dt>
                    <dd className="font-medium text-slate-900">
                      {modalState.user.created_at
                        ? new Date(
                            modalState.user.created_at,
                          ).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })
                        : "-"}
                    </dd>
                  </div>
                  <div className="flex justify-between border-t border-slate-200/60 pt-3">
                    <dt className="text-slate-500">Kelas</dt>
                    <dd className="font-medium text-slate-900 text-right max-w-[60%]">
                      {modalState.user.classes?.length > 0 ? (
                        modalState.user.classes
                          .map((c) => c.class_name)
                          .join(", ")
                      ) : (
                        <span className="text-slate-400 italic">
                          Tidak ada kelas
                        </span>
                      )}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Konfirmasi & Status */}
      <StatusModal
        show={statusModal.isOpen}
        type={statusModal.type}
        title={statusModal.title}
        message={statusModal.message}
        onClose={() => setStatusModal((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={
          statusModal.onConfirm
            ? statusModal.onConfirm
            : () => setStatusModal((prev) => ({ ...prev, isOpen: false }))
        }
        onCancel={() => setStatusModal((prev) => ({ ...prev, isOpen: false }))}
        confirmText={statusModal.confirmText || "OK"}
        cancelText="Batal"
      />
    </AppLayout>
  );
}
