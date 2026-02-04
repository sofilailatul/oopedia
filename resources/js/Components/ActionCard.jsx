import { Link } from "@inertiajs/react";

export default function ActionCard({
  href,
  icon: Icon,
  iconBg = "bg-gray-100",
  iconColor = "text-gray-600",
  title,
  description,
  rightIcon: RightIcon, // opsional (default chevron)
  className = "",
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 p-4 rounded-lg hover:bg-gray-50 border border-[#9fc4ff] transition ${className}`}
    >
      <div className={`w-10 h-10 ${iconBg} rounded-lg flex items-center justify-center`}>
        {Icon && <Icon className={`w-5 h-5 ${iconColor}`} />}
      </div>

      <div className="flex-1">
        <p className="font-medium text-[12px] ">{title}</p>
        {description && <p className="text-[10px] text-gray-600">{description}</p>}
      </div>

      {RightIcon ? (
        <RightIcon className="w-5 h-5 text-gray-400" />
      ) : (
        <span className="w-5 h-5 text-gray-900">›</span>
      )}
    </Link>
  );
}
