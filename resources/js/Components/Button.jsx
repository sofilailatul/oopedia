export default function Button({
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
    "inline-flex items-center justify-center gap-3 rounded-xl font-semibold transition focus:outline-none focus:ring-4 disabled:opacity-60 disabled:cursor-not-allowed";

  const sizes = {
    sm: "px-4 py-2 text-xs",
    md: "px-5 py-2.5 text-sm",
    lg: "px-6 py-3 text-sm",
  };

  const colors = {
    green: {
      solid: "bg-green-600 text-white hover:bg-green-700 focus:ring-green-100",
      outline:
        "border border-green-600 text-green-600 hover:bg-green-50 focus:ring-green-100",
      ghost: "text-green-600 hover:bg-green-50 focus:ring-green-100",
    },
    yellow: {
      solid:
        "bg-yellow-400 text-black hover:bg-yellow-500 focus:ring-yellow-100",
      outline:
        "border border-yellow-400 text-yellow-600 hover:bg-yellow-50 focus:ring-yellow-100",
      ghost: "text-yellow-600 hover:bg-yellow-50 focus:ring-yellow-100",
    },
    blue: {
      solid: "bg-blue-700 text-white hover:bg-blue-800 focus:ring-blue-100",
      outline:
        "border border-blue-700 text-blue-700 hover:bg-blue-50 focus:ring-blue-100",
      ghost: "text-blue-700 hover:bg-blue-50 focus:ring-blue-100",
    },
    red: {
      solid: "bg-red-500 text-white hover:bg-red-600 focus:ring-red-100",
      outline:
        "border border-red-500 text-red-500 hover:bg-red-50 focus:ring-red-100",
      ghost: "text-red-500 hover:bg-red-50 focus:ring-red-100",
    },
    gray: {
      solid:
        "bg-gray-400 text-gray-800 cursor-not-allowed focus:ring-gray-200",
      outline:
        "border border-gray-300 text-gray-500 cursor-not-allowed focus:ring-gray-200",
      ghost:
        "text-gray-400 cursor-not-allowed focus:ring-gray-200",
    },
  };

  const safeColor = colors[color] ? color : "green";
  const safeVariant = colors[safeColor][variant] ? variant : "solid";

  return (
    <button
      disabled={disabled}
      className={`
        ${base}
        ${sizes[size]}
        ${colors[safeColor][safeVariant]}
        ${disabled ? colors.gray.solid : ""}
        ${className}
      `}
      {...props}
    >
      {leftIcon && <span className="text-lg">{leftIcon}</span>}
      {children}
      {rightIcon && <span className="text-lg">{rightIcon}</span>}
    </button>
  );
}
