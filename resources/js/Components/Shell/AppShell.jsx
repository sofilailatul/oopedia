export default function AppShell({ sidebar, navbar, children }) {
  return (
    <div className="min-h-screen bg-sky-50 flex">
      <aside className="w-[280px] bg-sky-100 px-6 py-6">
        {sidebar}
      </aside>

      <div className="flex-1 p-6">
        <div className="mb-6">{navbar}</div>
        {children}
      </div>
    </div>
  )
}
