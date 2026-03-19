export default function Button({
  as: Component = "button",
  children,
  color = "green",
  variant = "solid", // solid | outline | ghost
  size = "md",
  leftIcon,
  rightIcon,
  className = "",
  disabled = false,
  ...props
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-300 focus:outline-none focus:ring-4 disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]";

  const sizes = {
    sm: "px-4 py-2 text-xs",
    md: "px-5 py-2.5 text-sm",
    lg: "px-7 py-3.5 text-sm",
  };

  const colors = {
    green: {
      solid: "bg-green-600 text-white hover:bg-green-700 focus:ring-green-100 shadow-sm hover:shadow-green-600/30 hover:shadow-lg hover:border-transparent",
      outline: "border border-green-600 text-green-600 hover:bg-green-50 focus:ring-green-100",
      ghost: "text-green-600 hover:bg-green-50 focus:ring-green-100",
    },
    yellow: {
      solid: "bg-yellow-400 text-yellow-900 hover:bg-yellow-500 focus:ring-yellow-100 shadow-sm hover:shadow-yellow-400/40 hover:shadow-lg hover:border-transparent",
      outline: "border border-yellow-400 text-yellow-700 hover:bg-yellow-50 focus:ring-yellow-100",
      ghost: "text-yellow-600 hover:bg-yellow-50 focus:ring-yellow-100",
    },
    blue: {
      solid: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-100 shadow-sm hover:shadow-blue-600/30 hover:shadow-lg hover:border-transparent",
      outline: "border border-blue-600 text-blue-600 hover:bg-blue-50 focus:ring-blue-100",
      ghost: "text-blue-600 hover:bg-blue-50 focus:ring-blue-100",
    },
    red: {
      solid: "bg-red-500 text-white hover:bg-red-600 focus:ring-red-100 shadow-sm hover:shadow-red-500/30 hover:shadow-lg hover:border-transparent",
      outline: "border border-red-500 text-red-500 hover:bg-red-50 focus:ring-red-100",
      ghost: "text-red-500 hover:bg-red-50 focus:ring-red-100",
    },
    gray: {
      solid: "bg-slate-800 text-white hover:bg-slate-900 focus:ring-slate-200 shadow-sm hover:shadow-slate-800/30 hover:shadow-lg hover:border-transparent",
      outline: "border border-slate-300 text-slate-600 hover:border-slate-400 hover:bg-slate-50 focus:ring-slate-100",
      ghost: "text-slate-500 hover:bg-slate-100 focus:ring-slate-100",
    },
  };

  // Alias grey -> gray untuk mengakomodasi penulisan "grey"
  colors.grey = colors.gray;

  const safeColor = colors[color] ? color : "green";
  const safeVariant = colors[safeColor][variant] ? variant : "solid";

  return (
    <Component
      disabled={disabled}
      className={`
        ${base}
        ${sizes[size]}
        ${!disabled ? colors[safeColor][safeVariant] : "bg-slate-100 border border-transparent text-slate-400 shadow-none hover:shadow-none hover:translate-y-0 active:scale-100"}
        ${className}
      `}
      {...props}
    >
      {leftIcon && <span className="text-[1.1em]">{leftIcon}</span>}
      {children}
      {rightIcon && <span className="text-[1.1em]">{rightIcon}</span>}
    </Component>
  );
}
