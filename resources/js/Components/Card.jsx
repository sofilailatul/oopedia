export default function Card({
    title,
    icon: Icon,
    iconBg = "bg-gray-100",
    iconColor = "text-gray-600",
    className = "",
    children,
}) {
    return (
        <div
            className={`bg-white rounded-3xl border border-slate-200/60 p-3 md:p-6 shadow-sm transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col justify-between ${className}`}
        >
            {(title || Icon) && (
                <div className="flex gap-3 mb-4">
                    {Icon && (
                        <div
                            className={`w-10 h-10 ${iconBg} rounded-2xl flex items-center justify-center`}
                        >
                            <Icon className={`w-5 h-5 ${iconColor}`} />
                        </div>
                    )}

                    {title && (
                        <h1 className="text-sm text-slate-900 tracking-tight font-bold flex items-center">
                            {title}
                        </h1>
                    )}
                </div>
            )}

            {/* isi card */}
            <div className="flex flex-col flex-1 justify-between space-y-4">
                {children}
            </div>
        </div>
    );
}
