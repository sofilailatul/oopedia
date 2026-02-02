import React from "react";
import Sidebar from "@/components/shell/Sidebar";
import Header from "@/components/shell/Header";

export default function TamuLayout({ children, title = "Dashboard" }) {
  return (
    <div className="flex min-h-screen bg-sky-50">
      <Sidebar />

      <div className="flex-1">
        <Header title={title} />
        <main className="px-6 py-6">{children}</main>
      </div>
    </div>
  );
}
