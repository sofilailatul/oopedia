import React, { useMemo, useState } from "react";
import AppLayout from "@/Layouts/AppLayout";
import Button from "@/Components/Button";
import Card from "@/Components/Card";
import { Link } from "@inertiajs/react";

export default function MateriIndex({ materials = [] }) {
    const [tab, setTab] = useState("all");

    const tabs = [
        { key: "all", label: "Semua Materi" },
        { key: "in_progress", label: "Progress" },
        { key: "locked", label: "Terkunci" },
        { key: "completed", label: "Selesai" },
    ];

    const ui = {
        completed: {
            label: "Selesai",
            badge: "bg-green-100 text-green-700",
            buttonColor: "green",
        },
        in_progress: {
            label: "Progress",
            badge: "bg-blue-100 text-blue-700",
            buttonColor: "blue",
        },
        unlocked: {
            label: "Belum Mulai",
            badge: "bg-yellow-100 text-yellow-800",
            buttonColor: "yellow",
        },
        locked: {
            label: "Terkunci",
            badge: "bg-gray-200 text-gray-600",
            buttonColor: "gray",
        },
    };

    const filtered = useMemo(() => {
        if (tab === "all") return materials;
        return materials.filter((m) => (m.progress ?? "locked") === tab);
    }, [materials, tab]);

    return (
        <AppLayout title="Daftar Materi" label="Daftar Materi">
            <div className="max-w-7xl space-y-6">
                {/* Tabs */}
                <div className="flex justify-center gap-8 border-b">
                    {tabs.map((t) => (
                        <button
                            key={t.key}
                            onClick={() => setTab(t.key)}
                            className={`pb-2 text-[13px] font-medium ${
                                tab === t.key
                                    ? "border-b-2 border-blue-700 text-blue-700"
                                    : "text-gray-400"
                            }`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* Grid */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {filtered.map((m) => {
                        const progress = m.progress ?? "locked";
                        const conf = ui[progress] ?? ui.unlocked;
                        const isLocked = progress === "locked";

                        return (
                            <Card
                                key={m.id}
                                className={
                                    isLocked ? "bg-gray-100 opacity-70" : ""
                                }
                            >
                                {/* Status */}
                                <span
                                    className={`inline-flex w-fit items-center px-3 py-1 rounded-full text-[11px] font-semibold ${conf.badge}`}
                                >
                                    {conf.label}
                                </span>

                                {/* Title */}
                                <h3 className="text-[13px] font-bold text-gray-900 line-clamp-2">
                                    {m.material_name}
                                </h3>

                                {/* Author */}
                                <div className="text-[12px] text-gray-600">
                                    {m.author ?? "Dosen"}
                                </div>

                                {/* Action */}
                                <Link href={`/materi/${m.id}`} className="pt-2">
                                    <Button
                                        className="w-full"
                                        color={conf.buttonColor}
                                        disabled={isLocked}
                                    >
                                        {isLocked
                                            ? "Terkunci"
                                            : progress === "in_progress"
                                              ? "Lanjutkan"
                                              : progress === "completed"
                                                ? "Lihat"
                                                : "Baca Materi"}
                                    </Button>
                                </Link>
                            </Card>
                        );
                    })}
                </div>
            </div>
        </AppLayout>
    );
}
