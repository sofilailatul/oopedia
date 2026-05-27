import React from 'react';
import AppShell from '@/Components/Shell/AppShell';
import Sidebar from '@/Components/Shell/Sidebar';
import Navbar from '@/Components/Shell/Navbar';
import { usePage, Head } from '@inertiajs/react';
import InertiaErrorPopup from '@/Components/PopUp/InertiaErrorPopup';

function normalizeRole(authUser) {
  if (authUser?.role) return authUser.role
  const roles = authUser?.roles
  if (Array.isArray(roles) && roles.length) {
    if (typeof roles[0] === 'string') return roles[0]
    if (roles[0]?.name) return roles[0].name
  }
  return 'tamu'
}

export default function AppLayout({
  children,
  label = 'Dashboard',
  title = 'Dashboard',
  fullHeight = true,
  backHref = '',
  backLabel = 'Kembali',
  onBackClick,
}) {
  const page = usePage()
  const { auth } = page.props
  const { url } = page
  const role = normalizeRole(auth?.user)
  const [mobileSidebarOpen, setMobileSidebarOpen] = React.useState(false)

  React.useEffect(() => {
    setMobileSidebarOpen(false)
  }, [url])

  const roleLabel =
    role === 'mahasiswa' ? 'mahasiswa'
      : role === 'dosen' ? 'dosen'
        : role === 'superadmin' ? 'superadmin'
          : 'tamu'

  return (
    <>
      <Head title={`${label}`} />
      <AppShell
        sidebar={
          <Sidebar
            mobileOpen={mobileSidebarOpen}
            onCloseMobile={() => setMobileSidebarOpen(false)}
          />
        }
        navbar={
          <Navbar
            title={title}
            backHref={backHref}
            backLabel={backLabel}
            onBackClick={onBackClick}
            onMenuClick={() => setMobileSidebarOpen(true)}
          />
        }
        fullHeight={fullHeight}
      >
        {children}
        <InertiaErrorPopup />
      </AppShell>
    </>
  );
}
