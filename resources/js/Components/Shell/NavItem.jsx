import { Link, usePage } from "@inertiajs/react";
import { cn } from "@/Lib/utils";

export default function NavItem({ item, onClick }) {
  const { url } = usePage();
  const isActive = url.startsWith(item.href);

  const handleClick = (e) => {
    if (item.requiresAuth) {
      e.preventDefault();
      onClick?.();
    }
  };

  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={handleClick}
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
        isActive
          ? "bg-blue-50 text-blue-600 font-medium"
          : "text-gray-700 hover:bg-gray-50"
      )}
    >
      <Icon className="w-5 h-5 flex-shrink-0" />
      <span>{item.name}</span>
    </Link>
  );
}