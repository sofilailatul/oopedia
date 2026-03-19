export default function ContentCard({
  title,
  status = "unlocked", // locked | unlocked | in_progress | completed
  children,
  className = "",
}) {
  const isLocked = status === "locked";

  return (
    <section
      className={`
        rounded-3xl border p-6 transition-all shadow-sm
        ${isLocked 
          ? "bg-slate-50 border-slate-200/60 opacity-60 pointer-events-none select-none"
          : "bg-white border-slate-200/60 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)]"}
        ${className}
      `}
    >
      {title && (
        <header className="mb-4">
          <h2
            className={`text-sm md:text-base font-bold tracking-tight ${
              isLocked ? "text-slate-400" : "text-slate-900"
            }`}
          >
            {title}
          </h2>
        </header>
      )}

      <div
        className={`
          prose max-w-none text-xs md:text-[13px] text-justify
          prose-p:my-2 prose-p:leading-relaxed
          prose-li:my-1 prose-li:leading-relaxed
          prose-strong:font-bold
          prose-headings:font-bold prose-headings:tracking-tight
          space-y-4
          ${isLocked
            ? "text-slate-400 prose-strong:text-slate-400 prose-headings:text-slate-400"
            : "text-slate-600 prose-strong:text-slate-900 prose-headings:text-slate-900"}
        `}
      >
        {children}
      </div>
      {isLocked && (
        <div className="absolute inset-0 flex justify-center">
        </div>
      )}
    </section>
  );
}
