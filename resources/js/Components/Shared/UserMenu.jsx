import { Link, usePage } from '@inertiajs/react'

export default function UserMenu({ roleLabel }) {
  const { auth } = usePage().props
  const user = auth?.user

  return (
    <div className="flex items-center gap-3 bg-white/10 rounded-full px-3 py-2">
      <div className="h-8 w-8 rounded-full bg-white/30" />
      <div className="text-sm font-semibold capitalize">{roleLabel}</div>

      {user ? (
        <>
          <div className="text-xs opacity-90">({user.name})</div>
          <Link className="ml-2 text-sm underline" href={route('profile.edit')}>
            Profil
          </Link>
          <Link
            href={route('logout')}
            method="post"
            as="button"
            className="ml-2 text-sm underline"
          >
            Logout
          </Link>
        </>
      ) : (
        <>
          <Link className="ml-2 text-sm underline" href={route('login')}>
            Login
          </Link>
        </>
      )}
    </div>
  )
}
