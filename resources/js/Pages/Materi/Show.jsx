import { useState, useEffect, useRef } from "react";
import { router } from "@inertiajs/react";
import AppLayout from "@/Layouts/AppLayout";
import ContentCard from "@/Components/ContentCard";
import axios from "axios";
import Button from "@/Components/Button";
import BackToListHeader from "@/Components/Shared/BackToListHeader";

export default function Show({ material }) {
    const [hasReachedBottom, setHasReachedBottom] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [progressData, setProgressData] = useState(null);
    const [error, setError] = useState(null);
    const scrollTimeoutRef = useRef(null);

    const progress = material.progress ?? {};
    const alreadyRead = progress.read_at != null;

    useEffect(() => {
        if (alreadyRead) {
            setHasReachedBottom(true);
            return;
        }

        const handleScroll = () => {
            if (scrollTimeoutRef.current)
                clearTimeout(scrollTimeoutRef.current);

            scrollTimeoutRef.current = setTimeout(() => {
                const scrollTop =
                    window.scrollY || document.documentElement.scrollTop;
                const windowHeight = window.innerHeight;
                const documentHeight = document.documentElement.scrollHeight;

                const isAtBottom =
                    scrollTop + windowHeight >= documentHeight - 100;

                if (isAtBottom && !hasReachedBottom) {
                    setHasReachedBottom(true);
                }
            }, 300);
        };

        window.addEventListener("scroll", handleScroll);
        handleScroll();

        return () => {
            window.removeEventListener("scroll", handleScroll);
            if (scrollTimeoutRef.current)
                clearTimeout(scrollTimeoutRef.current);
        };
    }, [hasReachedBottom, alreadyRead]);

    const handleFinishReading = async () => {
        if (isSubmitting) return;

        setIsSubmitting(true);
        setError(null);

        try {
            const response = await axios.post(
                `/materi/${material.id}/finish-read`,
                {},
                {
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json",
                        "X-Requested-With": "XMLHttpRequest",
                    },
                    timeout: 10000,
                },
            );

            if (response.data?.success) {
                setProgressData(response.data.data);
                setShowSuccessModal(true);
                router.reload({ only: ["material"] });
            } else {
                throw new Error(
                    response.data?.message || "Gagal menyimpan progress",
                );
            }
        } catch (err) {
            let msg = "Terjadi kesalahan saat menyimpan progress";

            if (err.response) {
                msg = err.response.data?.message || msg;
            } else if (err.request) {
                msg =
                    "Tidak dapat terhubung ke server. Periksa koneksi internet Anda.";
            } else {
                msg = err.message || msg;
            }

            setError(msg);
            setTimeout(() => setError(null), 5000);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleNavigateNext = () => {
        if (!progressData) return;

        const nextStep = progressData.next_step;

        if (nextStep === "practice") {
            router.visit(`/daftar-latihan-soal`);
            return;
        }
        if (nextStep === "quiz") {
            router.visit("/quizzes");
            return;
        }
        if (
            nextStep === "completed" &&
            progressData.next_unlocked_material_id
        ) {
            router.visit(`/materi/${progressData.next_unlocked_material_id}`);
            return;
        }

        router.visit("/materi");
    };

    const handleBackToList = () => {
        setShowSuccessModal(false);
        router.visit("/materi");
    };

    return (
        <AppLayout title="Materi" label={`Materi | ${material.material_name}`}>
            <div className="mx-auto space-y-4">
                <BackToListHeader href="/materi" label="Kembali ke Daftar Materi" />

                {/* Header */}
                <ContentCard className="border-[#9fc4ff]" title={null}>
                    <div className="flex items-start justify-between gap-4 space-y-4">
                        <div className="space-y-4">
                            <h1 className="text-lg font-bold text-gray-900">
                                {material.material_name}
                            </h1>
                            {material.description && (
                                <p className="text-sm text-gray-600 mt-2">
                                    {material.description}
                                </p>
                            )}

                            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mt-3">
                                <span>
                                    👤 <strong>{material.author}</strong>
                                </span>
                                <span>•</span>
                                <span>📋 Materi {material.order_number}</span>
                            </div>

                            {progress.read_at && (
                                <p className="text-[10px] text-blue-700">
                                    ✓ Anda sudah menyelesaikan membaca materi
                                    ini pada{" "}
                                    <strong>
                                        {new Date(
                                            progress.read_at,
                                        ).toLocaleDateString("id-ID", {
                                            weekday: "long",
                                            year: "numeric",
                                            month: "long",
                                            day: "numeric",
                                        })}
                                    </strong>
                                </p>
                            )}
                        </div>
                    </div>
                </ContentCard>

                {/* Error */}
                {error && (
                    <ContentCard
                        className="border-red-200 bg-red-50"
                        title={null}
                    >
                        <p className="text-sm text-red-700">{error}</p>
                    </ContentCard>
                )}

                {/* Contents */}
                <div className="space-y-4">
                    {material.contents && material.contents.length > 0 ? (
                        material.contents.map((content) => (
                            <ContentCard
                                key={content.id}
                                title={content.title || ""}
                                className="border-[#9fc4ff]"
                            >
                                {content.image_path && (
                                    <img
                                        src={`/storage/${content.image_path}`}
                                        alt={content.title || "Gambar materi"}
                                        className="w-[500px] items-center max-h-auto rounded-lg shadow-sm mb-4"
                                    />
                                )}

                                <div
                                    className="text-gray-700 leading-relaxed"
                                    dangerouslySetInnerHTML={{
                                        __html: content.content_text,
                                    }}
                                />
                            </ContentCard>
                        ))
                    ) : (
                        <ContentCard
                            title="Konten"
                            className="border-[#9fc4ff]"
                        >
                            <p className="text-gray-500 italic">
                                Konten materi belum tersedia.
                            </p>
                        </ContentCard>
                    )}
                </div>

                {/* Floating Button */}
                {hasReachedBottom && !alreadyRead && (
                    <div className="fixed bottom-8 right-8 z-50">
                        <Button
                            onClick={handleFinishReading}
                            disabled={isSubmitting}
                            color={isSubmitting ? "gray" : "green"}
                            variant="solid"
                            size="lg"
                            leftIcon={
                                isSubmitting ? (
                                    <svg
                                        className="animate-spin h-5 w-5"
                                        viewBox="0 0 24 24"
                                    >
                                        <circle
                                            className="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                            fill="none"
                                        />
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                        />
                                    </svg>
                                ) : (
                                    <svg
                                        className="h-5 w-5"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M5 13l4 4L19 7"
                                        />
                                    </svg>
                                )
                            }
                            className="rounded-full shadow-2xl transition-transform duration-200 hover:scale-105 active:scale-95"
                        >
                            {isSubmitting ? "Menyimpan..." : "Selesai Membaca"}
                        </Button>
                    </div>
                )}

                {/* Success Modal */}
                {showSuccessModal && progressData && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
                            <div className="p-8">
                                <div className="text-center mb-6">
                                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <svg
                                            className="w-10 h-10 text-green-600"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth="3"
                                                d="M5 13l4 4L19 7"
                                            />
                                        </svg>
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                                        Selamat!
                                    </h3>
                                    <p className="text-gray-600 text-sm">
                                        {progressData.message ||
                                            "Anda telah menyelesaikan membaca materi ini."}
                                    </p>
                                </div>

                                <div className="bg-gray-50 rounded-lg p-5 mb-6">
                                    <h4 className="font-semibold text-sm text-gray-900 mb-3">
                                        Progress Pembelajaran:
                                    </h4>
                                    <div className="space-y-3 text-sm">
                                        <div className="flex items-center justify-between">
                                            <span className="text-gray-700 text-sm">
                                                📖 Baca Materi
                                            </span>
                                            <span className="text-green-600 text-sm font-semibold">
                                                ✓ Selesai
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-gray-700 text-sm">
                                                ✏️ Latihan Soal
                                            </span>
                                            <span
                                                className={
                                                    progressData.practice_done
                                                        ? "text-green-600 text-sm font-semibold"
                                                        : "text-gray-400 text-sm"
                                                }
                                            >
                                                {progressData.practice_done
                                                    ? "✓ Selesai"
                                                    : "○ Belum"}
                                            </span>
                                        </div>
                                    </div>

                                    {progressData.quiz_available && (
                                        <div className="mt-4 pt-4 border-t border-gray-200">
                                            <p className="text-xs text-gray-500">
                                                💡 Ada quiz yang tersedia
                                                setelah Anda menyelesaikan
                                                latihan soal
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-3 space-x-3 items-center text-center">
                                    {progressData.next_step === "practice" && (
                                        <Button
                                            onClick={handleNavigateNext}
                                            size="sm"
                                        >
                                            Lanjut ke Latihan Soal
                                        </Button>
                                    )}

                                    {progressData.next_step === "completed" &&
                                        progressData.next_unlocked_material_id && (
                                            <Button
                                                onClick={handleNavigateNext}
                                                size="sm"
                                            >
                                                🎯 Lanjut ke Materi Berikutnya
                                            </Button>
                                        )}
                                    <Button
                                        onClick={handleBackToList}
                                        variant="outline"
                                        size="sm"
                                    >
                                        Kembali ke Daftar Materi
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
