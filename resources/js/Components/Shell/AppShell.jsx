export default function AppShell({ sidebar, navbar, children }) {
  return (
    <div className="min-h-screen w-full bg-sky-50 flex">
      <aside className="bg-sky-100 px-6 py-4 shrink-0">
        {sidebar}
      </aside>

      <div className="p-4 flex-1 w-full">
        <div className="mb-6">{navbar}</div>
        {children}
      </div>
    </div>
  )
}
