import React from "react";
import AppLayout from "@/Layouts/AppLayout";

export default function Placeholder({ title, description }) {
  return (
    <AppLayout title={title || "SuperAdmin"}>
      <div className="mx-auto   rounded-2xl border border-dashed border-slate-300 bg-white/80 p-8 text-center shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">
          {title || "Halaman dalam pengembangan"}
        </h1>
        <p className="mt-4 text-sm text-slate-600">
          {description ||
            "Bagian ini untuk sementara belum diimplementasikan sepenuhnya. Silakan hubungi pengembang jika membutuhkan prioritas."}
        </p>
      </div>
    </AppLayout>
  );
}
