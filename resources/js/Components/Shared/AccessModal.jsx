import { Link } from '@inertiajs/react'

export default function AccessModal({
  open,
  title,
  message,
  actionHref,
  actionLabel,
  onClose,
}) {
  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow">
        <div className="text-lg font-semibold mb-2">{title}</div>
        <div className="text-gray-600 mb-6">{message}</div>

        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-xl border">
            Tutup
          </button>

          {actionHref && (
            <Link
              href={actionHref}
              className="px-4 py-2 rounded-xl bg-blue-600 text-white"
            >
              {actionLabel ?? 'OK'}
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
