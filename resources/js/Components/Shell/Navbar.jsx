import { Link, usePage } from '@inertiajs/react';
import Icons from '@/icons'; 

export default function Navbar({ onMenuClick }) {
  const { auth } = usePage().props;

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="flex items-center justify-between h-16 px-4">
        {/* Left: Menu button & Logo */}
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
          >
            <Icons.Menu className="w-5 h-5" />
          </button>
          
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">OP</span>
            </div>
            <span className="font-bold text-xl hidden sm:block">OOPedia</span>
          </Link>
        </div>

        {/* Right: Notifications & User menu */}
        <div className="flex items-center gap-3">
          {/* Notifications */}
          <button className="p-2 rounded-lg hover:bg-gray-100 relative">
            <Icons.Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {/* User Menu */}
          <div className="flex items-center gap-2 pl-3 border-l">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium">{auth?.user?.name || 'Guest'}</p>
              <p className="text-xs text-gray-500 capitalize">{auth?.user?.role || 'Tamu'}</p>
            </div>
            
            <button className="p-2 rounded-lg hover:bg-gray-100">
              <Icons.User className="w-5 h-5" />
            </button>
          </div>

          {/* Logout (jika sudah login) */}
          {auth?.user && (
            <Link
              href="/logout"
              method="post"
              as="button"
              className="p-2 rounded-lg hover:bg-red-50 text-red-600"
            >
              <Icons.Logout className="w-5 h-5" />
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}