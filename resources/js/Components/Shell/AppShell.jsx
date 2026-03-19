export default function AppShell({ sidebar, navbar, children, fullHeight = true }) {
  return (
    <div
      className={[
        fullHeight ? "h-screen overflow-hidden" : "",
        "w-full flex bg-slate-50",
      ].join(" ")}
    >
      {sidebar}

      <div className="flex-1 w-full min-h-0 overflow-y-auto p-4">
        <div className="mb-5">{navbar}</div>
        {children}
      </div>
    </div>
  )
}
