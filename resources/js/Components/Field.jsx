export default function Field({
    label,
    name,
    type = "text",
    value,
    onChange,
    error,
    placeholder,
    required = false,
    disabled = false,
    as = "input",
    rows = 4,
    className = "",
    inputClassName = "",
    labelClassName = "",
    children,
    ...props
}) {
    const isDark = inputClassName.includes("bg-white/5") || inputClassName.includes("text-white");

    const baseClass = `
        w-full rounded-xl border px-4 py-3 text-[12px] transition-all outline-none
        ${
            error
                ? "border-red-500 focus:ring-2 focus:ring-red-300"
                : isDark 
                    ? "border-white/15 bg-white/5 text-white placeholder:text-white/40 focus:border-yellow-300 focus:ring-4 focus:ring-yellow-300/10"
                    : "border-gray-300 bg-white focus:ring-2 focus:ring-blue-300"
        }
        ${disabled ? "bg-gray-100 cursor-not-allowed opacity-50" : ""}
        ${inputClassName}
    `;

    return (
        <div className={`space-y-2 ${className}`}>
            {label && (
                <label
                    htmlFor={name}
                    className={`block font-medium ${isDark ? "text-white/85" : "text-gray-700"} ${labelClassName}`}
                >
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}

            <div className="relative">
                {as === "textarea" ? (
                    <textarea
                        id={name}
                        name={name}
                        value={value}
                        onChange={onChange}
                        placeholder={placeholder}
                        required={required}
                        disabled={disabled}
                        rows={rows}
                        className={baseClass}
                        {...props}
                    />
                ) : as === "select" ? (
                    <select
                        id={name}
                        name={name}
                        value={value}
                        onChange={onChange}
                        required={required}
                        disabled={disabled}
                        className={baseClass}
                        {...props}
                    />
                ) : (
                    <input
                        id={name}
                        name={name}
                        type={type}
                        value={value}
                        onChange={onChange}
                        placeholder={placeholder}
                        required={required}
                        disabled={disabled}
                        className={baseClass}
                        {...props}
                    />
                )}
                {children}
            </div>

            {error && (
                <p className="mt-1 text-xs text-red-600">
                    {error}
                </p>
            )}
        </div>
    );
}