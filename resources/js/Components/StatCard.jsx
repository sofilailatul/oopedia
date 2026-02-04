export default function StatCard({
  icon: Icon,
  iconBg = 'bg-gray-100',
  iconColor = 'text-gray-600',
  label,
  value,
  className = '',
}) {
  return (
    <div className={`bg-white rounded-[15px] border border-[#9fc4ff] p-4 ${className}`}>
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 ${iconBg} rounded-lg flex items-center justify-center`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
        <div>
          <p className="text-[12px] text-gray-900 font-semibold">{label}</p>
          <p className="text-[12px] text-gray-600 font-medium">{value}</p>
        </div>
      </div>
    </div>
  );
}
