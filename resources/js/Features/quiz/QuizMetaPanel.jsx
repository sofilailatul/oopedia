import React from "react";
import { FaClock, FaCalendarAlt, FaTrophy, FaInfoCircle, FaBook } from "react-icons/fa";

function MetaItem({ label, value, icon, iconColor = "text-slate-600", bgColor = "bg-slate-100", truncate = true }) {
  return (
    <div className="w-full min-w-0 space-y-2">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
        {label}
      </p>
      <div className={`rounded-2xl border border-slate-200/80 px-4 py-3 text-sm font-medium shadow-sm backdrop-blur ${bgColor} text-slate-700`}>
        <div className={`flex ${truncate ? 'items-center' : 'items-start'} gap-3`}>
          {icon && (
            <div className={`flex shrink-0 h-8 w-8 items-center justify-center rounded-full ${iconColor.replace('text-', 'bg-').replace('-600', '-100')}`}>
              {React.cloneElement(icon, { className: `h-4 w-4 ${iconColor}` })}
            </div>
          )}
          <div className={`flex-1 ${truncate ? 'truncate' : 'whitespace-pre-wrap leading-relaxed'}`}>
            {value}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function QuizMetaPanel({
  duration,
  passingScore,
  startTime,
  endTime,
  description,
  materials = [],
  className: additionalClassName = "",
}) {
  const formatDateTime = (dateString) => {
    if (!dateString) return "Tidak ditentukan";
    try {
      const date = new Date(dateString);
      return date.toLocaleString('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className={`w-full rounded-3xl border border-slate-200/80 bg-slate-50/65 p-4 shadow-sm ${additionalClassName}`.trim()}>
      <div className="space-y-4 w-full">
        {description && (
          <div className="w-full">
            <MetaItem
              label="Deskripsi Kuis"
              value={description}
              icon={<FaInfoCircle />}
              iconColor="text-orange-600"
              bgColor="bg-orange-50/80"
              truncate={false}
            />
          </div>
        )}

        {/* Durasi and Materi Kuis - Side by Side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <MetaItem
            label="Durasi"
            value={duration ? `${duration} menit` : "Tidak ditentukan"}
            icon={<FaClock />}
            iconColor="text-blue-600"
            bgColor="bg-blue-50/80"
          />
          <MetaItem
            label="Materi Kuis"
            value={materials.length > 0 
              ? materials.map(m => typeof m === 'object' ? (m.material_name || m.name) : m).join(', ') 
              : "Belum ada materi"
            }
            icon={<FaBook />}
            iconColor="text-indigo-600"
            bgColor="bg-indigo-50/80"
            truncate={true}
          />
        </div>

        {/* Waktu Dimulai and Waktu Selesai - Side by Side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <MetaItem
            label="Waktu Dimulai"
            value={formatDateTime(startTime)}
            icon={<FaCalendarAlt />}
            iconColor="text-purple-600"
            bgColor="bg-purple-50/80"
          />
          <MetaItem
            label="Waktu Selesai"
            value={formatDateTime(endTime)}
            icon={<FaCalendarAlt />}
            iconColor="text-red-600"
            bgColor="bg-red-50/80"
          />
        </div>
      </div>
    </div>
  );
}