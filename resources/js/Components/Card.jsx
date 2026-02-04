export default function Card({
  title,
  icon: Icon,
  iconBg = "bg-gray-100",
  iconColor = "text-gray-600",
  className = "",
  children,
}) {
  return (
    <div className={`bg-white rounded-lg border-[#9fc4ff] items-stretch p-6 ${className}`}>
      {(title || Icon) && (
        <div className="flex gap-3 mb-4 items-stretch">
          {Icon && (
            <div
              className={`w-8 h-8 ${iconBg} rounded-lg flex items-center justify-center`}
            >
              <Icon className={`w-5 h-5 ${iconColor}`} />
            </div>
          )}

          {title && (
            <h1 className="text-[12px] text-black font-bold justify-center flex items-center">
              {title}
            </h1>
          )}
        </div>
      )}

      {children}
    </div>
  );
}
