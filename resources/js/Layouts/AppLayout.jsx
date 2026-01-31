import AppShell from '@/Components/Shell/AppShell'
import Sidebar from '@/Components/Shell/Sidebar'
import Navbar from '@/Components/Shell/Navbar'
import { usePage } from '@inertiajs/react'

function normalizeRole(authUser) {
  if (authUser?.role) return authUser.role
  const roles = authUser?.roles
  if (Array.isArray(roles) && roles.length) {
    if (typeof roles[0] === 'string') return roles[0]
    if (roles[0]?.name) return roles[0].name
  }
  return 'tamu'
}

export default function AppLayout({ children, label = 'Dashboard' }) {
  const { auth } = usePage().props
  const role = normalizeRole(auth?.user)

  const roleLabel =
    role === 'mahasiswa' ? 'mahasiswa'
      : role === 'dosen' ? 'dosen'
        : role === 'superadmin' ? 'superadmin'
          : 'tamu'

  return (
    <AppShell
      sidebar={<Sidebar />}
      navbar={<Navbar label={label} roleLabel={roleLabel} />}
    >
      {children}
    </AppShell>
  )
}
