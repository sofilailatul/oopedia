import React from "react";
import Sidebar from "@/components/shell/sidebar/Sidebar";
import Navbar from "@/components/shell/Navbar";

export default function AdminLayout({ children, title = "Dashboard" }) {
  return (
    <div className="flex min-h-screen bg-sky-50">
      <Sidebar />
      <div className="flex-1">
        <Navbar title={title} />
        <main className="px-6 py-6">{children}</main>
      </div>
    </div>
  );
}
