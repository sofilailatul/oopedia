import AppLayout from "@/Layouts/AppLayout";
import { useForm } from "@inertiajs/react";
import { useState } from "react";
import Icons from "@/icons";
import StatCard from "@/Components/StatCard";
import Card from "@/Components/Card";
import Button from "@/Components/Button";

export default function TamuDashboard({ auth, stats }) {
    const [showJoinModal, setShowJoinModal] = useState(false);
    const nama = auth.user?.name ?? auth.user?.nama ?? "Guest";

    const { data, setData, post, processing, errors, reset } = useForm({
        class_code: "",
    });

    const handleJoinClass = (e) => {
        e.preventDefault();
        post("/classes/join", {
            onSuccess: () => {
                setShowJoinModal(false);
                reset();
            },
        });
    };

    return (
        <AppLayout title="Dashboard Tamu">
            <div className="p-1">
                <div className=" gap-6 mb-6 items-stretch justify-center">
                    <div className="grid md:grid-cols-3 gap-6 mb-6">
                        <StatCard
                            icon={Icons.Materials}
                            iconBg="bg-blue-100"
                            iconColor="text-blue-600"
                            label="Total Materi"
                            value={stats?.total_materials ?? 0}
                        />

                        <StatCard
                            icon={Icons.Practice}
                            iconBg="bg-green-100"
                            iconColor="text-green-600"
                            label="Total Latihan Soal"
                            value={stats?.total_practices ?? 0}
                        />

                        <StatCard
                            icon={Icons.Lock}
                            iconBg="bg-purple-100"
                            iconColor="text-purple-600"
                            label="Total Quiz"
                            value={stats?.total_quizzes ?? 0}
                        />
                    </div>
                </div>

                {/* Welcome Card */}
                <Card
                    title={`Selamat Datang, ${nama}!`}
                    icon={Icons.Info}
                    iconBg="bg-yellow-100"
                    iconColor="text-yellow-600"
                    className=" flex flex-col items-center justify-center p-6 text-[15px]"
                >
                    <div className="flex flex-col space-y-4">
                        <p className="font-normal text-black text-[12px]">
                            Kamu belum join kelas. Masukkan kode kelas dari
                            dosen untuk mulai belajar!
                        </p>
                        <Button
                            color="blue"
                            size="lg"
                            onClick={() => setShowJoinModal(true)}
                            leftIcon={<Icons.Add className="w-4 h-4" />}
                        >
                            Join Kelas Sekarang
                        </Button>
                    </div>
                </Card>
            </div>

            {/* Join Class Modal */}
            {showJoinModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold">Join Kelas</h3>
                            <button
                                onClick={() => {
                                    setShowJoinModal(false);
                                    reset();
                                }}
                                className="p-1 hover:bg-gray-100 rounded"
                            >
                                <Icons.Close className="w-5 h-5" />
                            </button>
                        </div>

                        <p className="text-gray-600 mb-4">
                            Masukkan kode kelas dari dosen untuk mulai belajar
                        </p>

                        <form onSubmit={handleJoinClass} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Kode Kelas
                                </label>
                                <input
                                    type="text"
                                    value={data.class_code}
                                    onChange={(e) =>
                                        setData(
                                            "class_code",
                                            e.target.value.toUpperCase(),
                                        )
                                    }
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase text-center text-2xl font-bold tracking-wider"
                                    placeholder="ABC123"
                                    maxLength={10}
                                    required
                                />
                                {errors.class_code && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {errors.class_code}
                                    </p>
                                )}
                            </div>

                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    color="blue"
                                    size="md"
                                    className="flex-1"
                                    disabled={processing}
                                    onClick={() => {
                                        setShowJoinModal(false);
                                        reset();
                                    }}
                                >
                                    Batal
                                </Button>

                                <Button
                                    type="submit"
                                    variant="solid"
                                    color="blue"
                                    size="md"
                                    className="flex-1"
                                    disabled={processing}
                                >
                                    {processing ? "Loading..." : "Join"}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
