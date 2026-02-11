import AppShell from '@/Components/Shell/AppShell'
import Sidebar from '@/Components/Shell/Sidebar'
import Navbar from '@/Components/Shell/Navbar'
import { usePage } from '@inertiajs/react'
import { Head } from '@inertiajs/react'
import { PopupProvider } from '@/Components/PopUp/PopupProvider' 
import InertiaErrorPopup from '@/Components/PopUp/InertiaErrorPopup'

function normalizeRole(authUser) {
  if (authUser?.role) return authUser.role
  const roles = authUser?.roles
  if (Array.isArray(roles) && roles.length) {
    if (typeof roles[0] === 'string') return roles[0]
    if (roles[0]?.name) return roles[0].name
  }
  return 'tamu'
}

export default function AppLayout({ children, label = 'Dashboard', title = 'Dashboard', fullHeight = true }) {
  const { auth } = usePage().props
  const role = normalizeRole(auth?.user)

  const roleLabel =
    role === 'mahasiswa' ? 'mahasiswa'
      : role === 'dosen' ? 'dosen'
        : role === 'superadmin' ? 'superadmin'
          : 'tamu'

  return (
    <>
      <Head title={`${label}`} />

      <PopupProvider>
        <InertiaErrorPopup />

        <AppShell sidebar={<Sidebar />} navbar={<Navbar title={title} />} fullHeight={fullHeight}>
          {children}
        </AppShell>
      </PopupProvider>
    </>
  );
}
