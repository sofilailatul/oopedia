export default function AppShell({ sidebar, navbar, children, fullHeight = true }) {
  return (
    <div
      className={[
        fullHeight ? "h-screen overflow-hidden" : "",
        "w-full flex bg-slate-100 p-4 gap-4",
      ].join(" ")}
    >
      {sidebar}

      <div className="flex-1 w-full min-h-0 overflow-y-auto custom-scrollbar">
        <div className="mb-4">{navbar}</div>
        {children}
      </div>
    </div>
  )
}
