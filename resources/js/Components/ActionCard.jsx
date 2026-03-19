import { Link } from "@inertiajs/react";

export default function ActionCard({
  href,
  icon: Icon,
  iconBg = "bg-slate-50",
  iconColor = "text-slate-600",
  title,
  description,
  rightIcon: RightIcon, // opsional (default chevron)
  className = "",
}) {
  return (
    <Link
      href={href}
      className={`group flex flex-col sm:flex-row items-start sm:items-center gap-4 p-5 bg-white rounded-3xl border border-slate-200/60 shadow-sm hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-0.5 transition-all duration-300 ${className}`}
    >
      <div className={`w-12 h-12 shrink-0 ${iconBg} rounded-2xl flex items-center justify-center group-hover:scale-105 transition-transform duration-300`}>
        {Icon && <Icon className={`w-5 h-5 ${iconColor}`} />}
      </div>

      <div className="flex-1">
        <p className="font-bold text-sm text-slate-900 group-hover:text-blue-600 tracking-tight transition-colors">{title}</p>
        {description && <p className="text-[11px] font-medium text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">{description}</p>}
      </div>

      <div className="w-8 h-8 rounded-full bg-slate-50 shrink-0 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white text-slate-400 transition-colors duration-300 mt-2 sm:mt-0">
        {RightIcon ? (
          <RightIcon className="w-4 h-4" />
        ) : (
          <span className="w-4 h-4 flex items-center justify-center">›</span>
        )}
      </div>
    </Link>
  );
}
