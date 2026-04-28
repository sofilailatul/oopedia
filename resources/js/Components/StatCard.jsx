export default function StatCard({
  icon: Icon,
  iconBg = 'bg-gray-100',
  iconColor = 'text-gray-600',
  gradientFrom = 'from-gray-50',
  label,
  value,
  className = '',
}) {
  return (
    <div className={`bg-white rounded-[2rem] px-6 py-5 border border-slate-200/60 shadow-sm transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] group relative overflow-hidden flex flex-col justify-between  ${className}`}>
      <div className={`absolute top-0 right-0 w-24 h- bg-gradient-to-bl ${gradientFrom} to-transparent rounded-bl-full -z-10 opacity-50 group-hover:scale-110 transition-transform duration-500`}></div>
      <div className="flex justify-between items-start mb-2">
        <div className={`w-9 h-9 rounded-xl ${iconBg} ${iconColor} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
          {Icon && <Icon className="w-4.5 h-4.5" />}
        </div>
      </div>
      <div>
        <p className="text-xl font-black text-slate-900 tracking-tight">{value}</p>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
      </div>
    </div>
  );
}
