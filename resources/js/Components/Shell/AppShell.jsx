export default function AppShell({ sidebar, navbar, children, fullHeight = true }) {
  return (
    <div className={`${fullHeight ? "h-screen overflow-hidden" : ""} w-full bg-sky-50 flex`}>
      <aside className="bg-sky-100 px-6 py-4 shrink-0 overflow-y-auto">
        {sidebar}
      </aside>

      <div className="p-4 flex-1 w-full min-h-0 overflow-y-auto">
        <div className="mb-6">{navbar}</div>
        {children}
      </div>
    </div>
  )
}
