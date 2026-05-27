export default function AppShell({ sidebar, navbar, children, fullHeight = true }) {
  return (
    <div
      className={[
        fullHeight ? "h-dvh overflow-hidden" : "",
        "w-full flex bg-slate-100 p-2 md:p-4 gap-2 md:gap-4",
      ].join(" ")}
    >
      {sidebar}

      <div className="flex-1 w-full min-w-0 min-h-0 overflow-y-auto custom-scrollbar">
        <div className="mb-3 md:mb-4">{navbar}</div>
        {children}
      </div>
    </div>
  )
}
