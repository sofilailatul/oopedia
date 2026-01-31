import { usePage } from "@inertiajs/react";
import { MdClose } from "react-icons/md"; 
import NavItem from "./NavItem";
import { getNavConfig } from "@/Config/navigation";
import { useState } from "react";
import { cn } from "@/Lib/utils";
import Icons from "@/icons";

export default function Sidebar({ isOpen, onClose }) {
  const { auth } = usePage().props;
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  const role = auth?.user?.role || 'guest';
  const navItems = getNavConfig(role);

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:sticky top-0 left-0 h-screen w-64 bg-white border-r border-gray-200 z-50 transition-transform lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b lg:hidden">
            <span className="font-bold text-lg">Menu</span>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <Icons.Close className="w-5 h-5" />   
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map((item, index) => (
              <NavItem
                key={index}
                item={item}
                onClick={() => item.requiresAuth && setShowAuthModal(true)}
              />
            ))}
          </nav>
        </div>
      </aside>

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold mb-2">Login Required</h3>
            <p className="text-gray-600 mb-4">
              Anda harus login untuk mengakses fitur ini
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowAuthModal(false)}
                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Batal
              </button>
              <a
                href="/login"
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-center"
              >
                Login
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}