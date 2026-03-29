import { useState, useEffect, useRef } from "react";
import { router } from "@inertiajs/react";
import AppLayout from "@/Layouts/AppLayout";
import Button from "@/Components/Button";
import Icons from "@/icons";
import axios from "axios";

// ─── Reading progress bar (sticky top) ───────────────────────────────────────
function ReadingProgressBar() {
  const [pct, setPct] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const scrollTop = window.scrollY;
      const docH = document.documentElement.scrollHeight - window.innerHeight;
      setPct(docH > 0 ? Math.min((scrollTop / docH) * 100, 100) : 0);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-0.5 bg-transparent pointer-events-none">
      <div
        className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-100"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

// ─── Success Modal ────────────────────────────────────────────────────────────
function SuccessModal({ progressData, onNext, onBack }) {
  const hasPractice = progressData.has_practice;
  const hasNext =
    progressData.next_step === "practice" ||
    (progressData.next_step === "completed" && progressData.next_unlocked_material_id);

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* Top gradient accent */}
        <div className="h-1.5 bg-gradient-to-r from-emerald-400 to-teal-400" />

        <div className="p-7">
          {/* Icon */}
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center">
              <Icons.CheckCircle className="w-8 h-8 text-emerald-500" />
            </div>
          </div>

          <h3 className="text-lg font-extrabold text-slate-900 text-center tracking-tight">
            Materi Selesai! 🎉
          </h3>
          <p className="text-sm text-slate-500 text-center mt-1 leading-relaxed">
            {progressData.message || "Kamu sudah menyelesaikan membaca materi ini."}
          </p>

          {/* Progress checklist */}
          <div className="mt-5 space-y-2 bg-slate-50 rounded-2xl p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 font-medium text-slate-700">
                <Icons.Materials className="w-4 h-4 text-slate-400" />
                Baca Materi
              </span>
              <span className="text-emerald-600 font-bold text-xs flex items-center gap-1">
                <Icons.Check className="w-3.5 h-3.5" /> Selesai
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 font-medium text-slate-700">
                <Icons.Practice className="w-4 h-4 text-slate-400" />
                Latihan Soal
              </span>
              <span
                className={`font-bold text-xs flex items-center gap-1 ${
                  !hasPractice
                    ? "text-slate-400"
                    : progressData.practice_done
                      ? "text-emerald-600"
                      : "text-amber-500"
                }`}
              >
                {!hasPractice
                  ? "Belum tersedia"
                  : progressData.practice_done
                    ? (<><Icons.Check className="w-3.5 h-3.5" /> Selesai</>)
                    : "Belum"}
              </span>
            </div>
          </div>

          {progressData.quiz_available && (
            <p className="mt-3 text-[11px] text-slate-400 text-center">
              💡 Ada quiz tersedia setelah kamu selesai latihan soal
            </p>
          )}

          {/* Actions */}
          <div className="mt-6 flex flex-col gap-2">
            {hasNext && (
              <Button onClick={onNext} color="gray" size="sm" className="w-full">
                {progressData.next_step === "practice"
                  ? "Lanjut ke Latihan Soal →"
                  : "Lanjut Materi Berikutnya →"}
              </Button>
            )}
            <Button onClick={onBack} variant="outline" color="gray" size="sm" className="w-full">
              Kembali ke Daftar Materi
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Section Content Block ────────────────────────────────────────────────────
function ContentBlock({ content, index }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
      {/* Section label */}
      {content.title && (
        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
            <span className="text-[10px] font-extrabold text-indigo-600">{String(index + 1).padStart(2, "0")}</span>
          </div>
          <h2 className="text-sm font-bold text-slate-900 tracking-tight">{content.title}</h2>
        </div>
      )}

      <div className="px-6 py-5">
        {/* Image */}
        {content.image_path && (
          <div className="mb-5 rounded-xl overflow-hidden bg-slate-50 border border-slate-100 flex justify-center">
            <img
              src={
                content.image_path.startsWith('http') 
                  ? content.image_path 
                  : (content.image_path.startsWith('/storage/') 
                      ? content.image_path 
                      : `/storage/${content.image_path}`)
              }
              alt={content.title || "Gambar materi"}
              className="w-full max-h-96 object-contain"
              onError={(e) => {
                e.target.onerror = null;
                e.target.style.display = 'none';
                console.error("Gagal memuat gambar:", e.target.src);
              }}
            />
          </div>
        )}

        {/* Plain text content */}
        <div className="space-y-2">
          {(content.content_text ?? "")
            .split("\n")
            .filter((line) => line.trim() !== "")
            .map((line, i) => (
              <p key={i} className="text-[11px] text-slate-600 leading-relaxed">
                {line}
              </p>
            ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Show({ material }) {
  const [hasReachedBottom, setHasReachedBottom] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [progressData, setProgressData] = useState(null);
  const [error, setError] = useState(null);
  const scrollTimeoutRef = useRef(null);

  const progress = material.progress ?? {};
  const alreadyRead = progress.read_at != null;

  // ── Scroll detection ──────────────────────────────────────────────────────
  useEffect(() => {
    if (alreadyRead) { setHasReachedBottom(true); return; }

    const handleScroll = () => {
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = setTimeout(() => {
        const isAtBottom =
          window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 100;
        if (isAtBottom && !hasReachedBottom) setHasReachedBottom(true);
      }, 300);
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, [hasReachedBottom, alreadyRead]);

  // ── Finish reading ────────────────────────────────────────────────────────
  const handleFinishReading = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await axios.post(
        `/materi/${material.id}/finish-read`,
        {},
        { headers: { Accept: "application/json", "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest" }, timeout: 10000 }
      );
      if (res.data?.success) {
        setProgressData(res.data.data);
        setShowSuccessModal(true);
        router.reload({ only: ["material"] });
      } else {
        throw new Error(res.data?.message || "Gagal menyimpan progress");
      }
    } catch (err) {
      const msg = err.response?.data?.message
        ?? (err.request ? "Tidak dapat terhubung ke server." : err.message)
        ?? "Terjadi kesalahan";
      setError(msg);
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNavigateNext = () => {
    if (!progressData) return;
    if (progressData.next_step === "practice") { router.visit("/daftar-latihan-soal"); return; }
    if (progressData.next_step === "quiz") { router.visit("/quizzes"); return; }
    if (progressData.next_step === "completed" && progressData.next_unlocked_material_id) {
      router.visit(`/materi/${progressData.next_unlocked_material_id}`); return;
    }
    router.visit("/materi");
  };

  return (
    <AppLayout
      title="Materi"
      label={material.material_name}
      backHref="/materi"
      backLabel="Daftar Materi"
    >
      {/* Sticky reading progress */}
      <ReadingProgressBar />

      <div className=" mx-auto px-2 py-6 space-y-4">

        {/* ── Material Header ───────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {/* Gradient accent top */}
          <div className="h-1 bg-gradient-to-r from-indigo-500 to-violet-500" />

          <div className="p-6">
            {/* Meta chips */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {material.order_number && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-bold uppercase tracking-widest">
                  Materi #{String(material.order_number).padStart(2, "0")}
                </span>
              )}
              {alreadyRead ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold uppercase tracking-widest border border-emerald-200">
                  <Icons.CheckCircle className="w-3 h-3" /> Sudah Dibaca
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[10px] font-bold uppercase tracking-widest border border-amber-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  Sedang Membaca
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight leading-tight">
              {material.material_name}
            </h1>

            {/* Description */}
            {material.description && (
              <p className="text-[12px] text-slate-500 mt-2 leading-relaxed">{material.description}</p>
            )}

            {/* Author + read date */}
            <div className="flex flex-wrap items-center gap-3 mt-4">
              {material.author && (
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center">
                    <Icons.User className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                  <span className="text-xs text-slate-500 font-medium">{material.author}</span>
                </div>
              )}
              {progress.read_at && (
                <p className="text-[11px] text-emerald-600 font-medium">
                  ✓ Diselesaikan pada{" "}
                  {new Date(progress.read_at).toLocaleDateString("id-ID", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ── Error toast ───────────────────────────────────────────────── */}
        {error && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl px-5 py-3.5">
            <Icons.Error className="w-4 h-4 text-red-500 shrink-0" />
            <p className="text-sm text-red-700 font-medium">{error}</p>
          </div>
        )}

        {/* ── Content Sections ──────────────────────────────────────────── */}
        {material.contents && material.contents.length > 0 ? (
          material.contents.map((content, i) => (
            <ContentBlock key={content.id} content={content} index={i} />
          ))
        ) : (
          <div className="bg-white rounded-2xl border border-slate-100 p-10 flex flex-col items-center text-center shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
              <Icons.Materials className="w-7 h-7 text-slate-300" />
            </div>
            <p className="text-sm font-bold text-slate-500">Konten belum tersedia</p>
            <p className="text-xs text-slate-400 mt-1">Dosen belum menambahkan konten untuk materi ini</p>
          </div>
        )}

        {/* bottom spacer so FAB doesn't overlap last content */}
        <div className="h-20" />
      </div>

      {/* ── Floating Action Button ─────────────────────────────────────── */}
      {hasReachedBottom && !alreadyRead && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40">
          <button
            onClick={handleFinishReading}
            disabled={isSubmitting}
            className={`
              inline-flex items-center gap-2.5 px-6 py-3.5 rounded-full text-sm font-bold shadow-lg shadow-emerald-500/30
              transition-all duration-300 hover:scale-105 active:scale-95
              ${isSubmitting
                ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                : "bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:shadow-emerald-500/40 hover:shadow-xl"
              }
            `}
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Menyimpan...
              </>
            ) : (
              <>
                <Icons.Check className="w-4 h-4" />
                Selesai Membaca
              </>
            )}
          </button>
        </div>
      )}

      {/* ── Success Modal ──────────────────────────────────────────────── */}
      {showSuccessModal && progressData && (
        <SuccessModal
          progressData={progressData}
          onNext={handleNavigateNext}
          onBack={() => { setShowSuccessModal(false); router.visit("/materi"); }}
        />
      )}
    </AppLayout>
  );
}
