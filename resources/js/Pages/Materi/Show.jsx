import { useState, useEffect, useRef, useMemo } from "react";
import { router } from "@inertiajs/react";
import AppLayout from "@/Layouts/AppLayout";
import Button from "@/Components/Button";
import Icons from "@/icons";
import React from "react";
import { useTour } from "@/Hooks/useTour";
import { FaQuestionCircle } from "react-icons/fa";

import axios from "axios";
// ─── Success Modal ────────────────────────────────────────────────────────────
function SuccessModal({ progressData, onNext, onBack }) {
  const hasPractice = progressData.has_practice;
  const hasNext =
    progressData.next_step === "practice" ||
    (progressData.next_step === "completed" &&
      progressData.next_unlocked_material_id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="h-1.5 bg-gradient-to-r from-emerald-400 to-teal-500" />
        <div className="p-7">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50">
            <Icons.CheckCircle className="h-8 w-8 text-emerald-500" />
          </div>

          <h3 className="text-center text-lg font-extrabold tracking-tight text-slate-900">
            Materi selesai 🎉
          </h3>
          <p className="mt-2 text-center text-xs leading-relaxed text-slate-500">
            {progressData.message ||
              "Kamu sudah menyelesaikan membaca materi ini."}
          </p>

          <div className="mt-5 space-y-3 rounded-2xl bg-slate-50 p-4">
              <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2 font-medium text-slate-700">
                <Icons.Materials className="h-4 w-4 text-slate-400" />
                Baca Materi
              </span>
                <span className="flex items-center text-emerald-600" aria-label="Baca materi tuntas">
                  <Icons.Check className="h-4 w-4" />
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2 font-medium text-slate-700">
                <Icons.Practice className="h-4 w-4 text-slate-400" />
                Latihan Soal
              </span>
              <span
                className={`flex items-center ${
                  !hasPractice
                    ? "text-slate-400"
                    : progressData.practice_done
                      ? "text-emerald-600"
                      : "text-amber-500"
                }`}
                aria-label={
                  !hasPractice
                    ? "Latihan soal tidak tersedia"
                    : progressData.practice_done
                      ? "Latihan soal tuntas"
                      : "Latihan soal proses"
                }
              >
                {!hasPractice
                  ? <Icons.Lock className="h-4 w-4" />
                  : progressData.practice_done
                    ? <Icons.Check className="h-4 w-4" />
                    : <Icons.Clock className="h-4 w-4" />}
              </span>
            </div>
          </div>

          {progressData.quiz_available && (
            <p className="mt-3 text-center text-[10px] text-slate-400">
              Quiz tersedia setelah latihan soal selesai
            </p>
          )}

          <div className="mt-6 flex flex-col gap-2">
            {hasNext && (
              <Button
                onClick={onNext}
                color="gray"
                size="sm"
                className="w-full"
              >
                {progressData.next_step === "practice"
                  ? "Lanjut ke Latihan Soal"
                  : "Lanjut Materi Berikutnya"}
              </Button>
            )}
            <Button
              onClick={onBack}
              variant="outline"
              color="gray"
              size="sm"
              className="w-full"
            >
              Kembali ke daftar materi
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Small helper blocks ──────────────────────────────────────────────────────
function InfoPill({ children }) {
  return (
    <span className="inline-flex items-center rounded-full bg-white/80 px-3 py-1 text-[10px] font-semibold text-slate-600 ring-1 ring-slate-200">
      {children}
    </span>
  );
}

function EmptyState() {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm md:p-10">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
        <Icons.Materials className="h-7 w-7 text-slate-300" />
      </div>
      <p className="text-xs font-bold text-slate-600">Konten belum tersedia</p>
      <p className="mt-1 text-[10px] text-slate-400">
        Dosen belum menambahkan konten untuk materi ini
      </p>
    </div>
  );
}

// ─── Sticky section nav ───────────────────────────────────────────────────────
function SectionNav({ contents, activeId, onSelectSection }) {
  if (!contents?.length) return null;

  return (
    <div id="tour-section-nav" className="sticky top-3 z-30 rounded-2xl border border-slate-200 bg-white/85 p-2 shadow-sm backdrop-blur">

      <div className="flex w-full justify-start gap-2 overflow-x-auto px-2 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
        {contents.map((content, i) => {
          const id = `section-${content.id}`;
          const active = activeId === id;

          return (
            <a
              key={content.id}
              href={`#${id}`}
              onClick={(e) => {
                e.preventDefault();
                onSelectSection?.(id);
              }}
              className={`whitespace-nowrap rounded-xl px-4 py-2 text-xs font-semibold transition ${
                active
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100"
              }`}
            >
              {content.title || `Bagian ${i + 1}`}
            </a>
          );
        })}
      </div>
    </div>
  );
}

// ─── Section block ────────────────────────────────────────────────────────────
function ContentBlock({ content, index }) {
  const sectionId = `section-${content.id}`;
  const variant = index % 3;

  return (
    <section
      id={sectionId}
      className="tour-content-block scroll-mt-28 rounded-3xl border border-slate-200 bg-white shadow-sm"
    >

      <div className="border-b border-slate-100 px-4 py-4 sm:px-8">
        <div className="flex items-center gap-4">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100">
            <span className="text-xs font-extrabold text-slate-600">
              {String(index + 1).padStart(2, "0")}
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-semibold tracking-tight text-slate-900">
              {content.title || `Bagian ${index + 1}`}
            </h2>
          </div>
        </div>
      </div>

      <div className="px-4 py-5 sm:px-6 sm:py-6 md:px-8">
        {content.image_path ? (
          <div
            className={`grid gap-4 ${
              variant === 1 ? "lg:grid-cols-[1.15fr_0.85fr]" : "lg:grid-cols-[0.9fr_1.1fr]"
            }`}
          >
            <div className={variant === 1 ? "lg:order-2" : ""}>
              <div className="space-y-6">
                {(content.content_text ?? "")
                  .split("\n")
                  .filter((line) => line.trim() !== "")
                  .map((line, i) => (
                    <p key={i} className="text-sm leading-relaxed text-slate-700 text-justify">
                      {line}
                    </p>
                  ))}
              </div>
            </div>

            <div className={variant === 1 ? "lg:order-1" : ""}>
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                <img
                  src={
                    content.image_path.startsWith("http")
                      ? content.image_path
                      : content.image_path.startsWith("/storage/")
                        ? content.image_path
                        : `/storage/${content.image_path}`
                  }
                  alt={content.title || "Gambar materi"}
                  className="h-full w-full object-contain"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.style.display = "none";
                  }}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {(content.content_text ?? "")
              .split("\n")
              .filter((line) => line.trim() !== "")
              .map((line, i) => (
                <p key={i} className="text-sm leading-relaxed text-slate-700 text-justify">
                  {line}
                </p>
              ))}
          </div>
        )}
      </div>
    </section>
  );
}


// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Show({ material }) {
  const [hasReachedBottom, setHasReachedBottom] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [progressData, setProgressData] = useState(null);
  const [error, setError] = useState(null);
  const [activeSection, setActiveSection] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);

  const { startTour, addSteps, next, back, cancel, complete } = useTour();

  useEffect(() => {
    addSteps([
      {
        id: 'nav',
        title: 'Navigasi Bagian',
        text: 'Kamu bisa berpindah antar bagian materi dengan cepat melalui menu navigasi ini.',
        attachTo: { element: '#tour-section-nav', on: 'bottom' },
        buttons: [
          { text: 'Kembali', action: back, classes: 'shepherd-button-secondary' },
          { text: 'Lanjut', action: next }
        ]
      },
      {
        id: 'content',
        title: 'Materi Belajar',
        text: 'Baca materi dengan teliti. Beberapa materi memiliki gambar untuk memudahkan pemahaman.',
        attachTo: { element: '.tour-content-block', on: 'top' },
        buttons: [
          { text: 'Kembali', action: back, classes: 'shepherd-button-secondary' },
          { text: 'Selesai', action: complete }
        ]
      }
    ]);
  }, []);

  const scrollTimeoutRef = useRef(null);
  const progress = material.progress ?? {};
  const alreadyRead = progress.read_at != null;

  const totalSections = material.contents?.length ?? 0;
  const selectedContent = useMemo(() => {
    if (!material.contents?.length) return null;

    if (selectedSection) {
      return material.contents.find((content) => `section-${content.id}` === selectedSection) ?? material.contents[0];
    }

    return material.contents[0];
  }, [material.contents, selectedSection]);

  useEffect(() => {
    if (alreadyRead) {
      setHasReachedBottom(true);
      return;
    }

    const handleScroll = () => {
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = setTimeout(() => {
        const isAtBottom =
          window.scrollY + window.innerHeight >=
          document.documentElement.scrollHeight - 100;

        if (isAtBottom && !hasReachedBottom) setHasReachedBottom(true);
      }, 200);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, [hasReachedBottom, alreadyRead]);

  useEffect(() => {
    if (!material.contents?.length) return;

    if (!selectedSection) {
      setSelectedSection(`section-${material.contents[0].id}`);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (visible?.target?.id) {
          setActiveSection(visible.target.id);
        }
      },
      {
        rootMargin: "-20% 0px -60% 0px",
        threshold: [0.2, 0.4, 0.7],
      }
    );

    material.contents.forEach((content) => {
      const el = document.getElementById(`section-${content.id}`);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [material.contents, selectedSection]);

  const handleFinishReading = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await axios.post(
        `/materi/${material.id}/finish-read`,
        {},
        {
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            "X-Requested-With": "XMLHttpRequest",
          },
          timeout: 10000,
        }
      );

      if (res.data?.success) {
        setProgressData(res.data.data);
        setShowSuccessModal(true);
        router.reload({ only: ["material"] });
      } else {
        throw new Error(res.data?.message || "Gagal menyimpan progress");
      }
    } catch (err) {
      const msg =
        err.response?.data?.message ??
        (err.request
          ? "Tidak dapat terhubung ke server."
          : err.message) ??
        "Terjadi kesalahan";

      setError(msg);
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNavigateNext = () => {
    if (!progressData) return;

    if (progressData.next_step === "practice") {
      router.visit("/daftar-latihan-soal");
      return;
    }

    if (progressData.next_step === "quiz") {
      router.visit("/quizzes");
      return;
    }

    if (
      progressData.next_step === "completed" &&
      progressData.next_unlocked_material_id
    ) {
      router.visit(`/materi/${progressData.next_unlocked_material_id}`);
      return;
    }

    router.visit("/materi");
  };

  return (
    <AppLayout
      title="Membaca Materi"
      label={material.material_name}
      backHref="/materi"
      backLabel="Daftar Materi"
    >
      <div className="flex justify-end mb-2 mr-4">
        <button
          onClick={startTour}
          className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <FaQuestionCircle className="text-indigo-500 h-4 w-4" />
          Panduan Belajar
        </button>
      </div>

      <div className="py-1">
        <div className="space-y-5">
          {/* Header */}
          <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-sky-50 shadow-sm">
            <div className="p-6 sm:p-8">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="mb-4 flex flex-wrap items-center gap-2">
                    {material.order_number && (
                      <InfoPill>
                        Materi {String(material.order_number).padStart(2, "0")}
                      </InfoPill>
                    )}

                    <InfoPill>{totalSections} bagian</InfoPill>

                    {alreadyRead ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-600 ring-1 ring-emerald-200">
                        <Icons.CheckCircle className="h-3.5 w-3.5" />
                        Sudah dipelajari
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-[11px] font-bold text-amber-600 ring-1 ring-amber-200">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                        Sedang dibaca
                      </span>
                    )}
                  </div>

                  <h1 className="max-w-4xl text-xl font-black tracking-tight text-slate-900 ">
                    {material.material_name}
                  </h1>


                  {material.description && (
                    <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-600">
                      {material.description}
                    </p>
                  )}

                  <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-500">
                    {material.author && (
                      <span className="inline-flex items-center gap-2">
                        <Icons.User className="h-4 w-4 text-slate-400" />
                        {material.author}
                      </span>
                    )}
                  </div>
                </div>

                <div className="hidden shrink-0 lg:block">
                  <div className="flex h-28 w-28 items-center justify-center rounded-[28px] bg-white shadow-sm ring-1 ring-slate-200">
                    <Icons.Materials className="h-12 w-12 text-indigo-500" />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-3.5">
              <Icons.Error className="h-4 w-4 shrink-0 text-red-500" />
              <p className="text-sm font-medium text-red-700">{error}</p>
            </div>
          )}

          {/* Nav */}
          <SectionNav
            contents={material.contents}
            activeId={selectedSection || activeSection}
            onSelectSection={setSelectedSection}
          />

          {/* Content */}
          {selectedContent ? (
            <div className="space-y-5">
              <ContentBlock
                key={selectedContent.id}
                content={selectedContent}
                index={material.contents.findIndex((content) => content.id === selectedContent.id)}
              />
            </div>
          ) : (
            <EmptyState />
          )}

          <div className="h-24" />
        </div>
      </div>

      {/* Floating CTA */}
      {hasReachedBottom && !alreadyRead && (
        <div className="fixed bottom-7 left-1/2 z-40 -translate-x-1/2">
          <button
            id="tour-finish-button"
            onClick={handleFinishReading}

            disabled={isSubmitting}
            className={`inline-flex items-center gap-2.5 rounded-full px-6 py-3.5 text-xs font-bold shadow-lg transition-all duration-300 ${
              isSubmitting
                ? "cursor-not-allowed bg-slate-200 text-slate-400"
                : "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-emerald-500/25 hover:-translate-y-0.5 hover:shadow-xl"
            }`}
          >
            {isSubmitting ? (
              <>
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
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
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Menyimpan...
              </>
            ) : (
              <>
                <Icons.Check className="h-4 w-4" />
                Selesai membaca
              </>
            )}
          </button>
        </div>
      )}

      {/* Success modal */}
      {showSuccessModal && progressData && (
        <SuccessModal
          progressData={progressData}
          onNext={handleNavigateNext}
          onBack={() => {
            setShowSuccessModal(false);
            router.visit("/materi");
          }}
        />
      )}
    </AppLayout>
  );
}