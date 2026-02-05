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
        rounded-lg border p-5 transition
        ${isLocked 
          ? "bg-gray-100 border-gray-200 opacity-60 pointer-events-none select-none"
          : "bg-white border-[#9fc4ff]"}
        ${className}
      `}
    >
      {title && (
        <header className="mb-4">
          <h2
            className={`text-[12px] font-bold ${
              isLocked ? "text-gray-400" : "text-gray-900"
            }`}
          >
            {title}
          </h2>
        </header>
      )}

      <div
        className={`
          prose max-w-none text-[11px]
          prose-p:my-1 prose-p:leading-6
          prose-li:my-1 prose-li:leading-6
          prose-strong:font-semibold
          prose-headings:font-bold
          space-y-4
          ${isLocked
            ? "text-gray-400 prose-strong:text-gray-400 prose-headings:text-gray-400"
            : "text-gray-700 prose-strong:text-gray-900 prose-headings:text-gray-900"}
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
