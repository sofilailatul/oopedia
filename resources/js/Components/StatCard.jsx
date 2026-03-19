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
    <div className={`bg-white rounded-3xl p-6 border border-slate-200/60 shadow-sm transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] group relative overflow-hidden flex flex-col justify-between min-h-[160px] ${className}`}>
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${gradientFrom} to-transparent rounded-bl-full -z-10 opacity-50 group-hover:scale-110 transition-transform duration-500`}></div>
      <div className="flex justify-between items-start mb-4">
        <div className={`w-12 h-12 rounded-2xl ${iconBg} ${iconColor} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
          {Icon && <Icon className="w-6 h-6" />}
        </div>
      </div>
      <div>
        <p className="text-3xl font-extrabold text-slate-900 mb-1 tracking-tight">{value}</p>
        <p className="text-sm font-medium text-slate-500">{label}</p>
      </div>
    </div>
  );
}
