export default function AppShell({ sidebar, navbar, children }) {
  return (
    <div className="min-h-screen bg-sky-50 flex">
      <aside className=" bg-sky-100 px-6 py-4">
        {sidebar}
      </aside>

      <div className="flex-1 p-4">
        <div className="mb-6">{navbar}</div>
        {children}
      </div>
    </div>
  )
}
