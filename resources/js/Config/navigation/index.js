import Icons from '@/icons';

export const getNavConfig = (role) => {
  const configs = {
    guest: [
      { name: 'Dashboard', href: '/tamu/dashboard', icon: Icons.Dashboard },
      { name: 'Materi', href: '/tamu/materi', icon: Icons.Materials },
      { name: 'Latihan', href: '/tamu/latihan', icon: Icons.Practice },
      { name: 'Quiz', href: '/tamu/quiz', icon: Icons.Quiz },
      { name: 'Leaderboard', href: '/tamu/leaderboard', icon: Icons.Leaderboard, requiresAuth: true },
    ],
    
    mahasiswa: [
      { name: 'Dashboard', href: '/mahasiswa/dashboard', icon: Icons.Dashboard },
      { name: 'Materi', href: '/mahasiswa/materi', icon: Icons.Materials },
      { name: 'Latihan', href: '/mahasiswa/latihan', icon: Icons.Practice },
      { name: 'Quiz', href: '/mahasiswa/quiz', icon: Icons.Quiz },
      { name: 'Leaderboard', href: '/mahasiswa/leaderboard', icon: Icons.Leaderboard },
    ],
    
    dosen: [
      { name: 'Dashboard', href: '/dosen/dashboard', icon: Icons.Dashboard },
      { name: 'Kelas', href: '/dosen/kelas', icon: Icons.Class },
      { name: 'Materi', href: '/dosen/materi', icon: Icons.Materials },
      { name: 'Latihan', href: '/dosen/latihan', icon: Icons.Practice },
      { name: 'Quiz', href: '/dosen/quiz', icon: Icons.Quiz },
      { name: 'Progress', href: '/dosen/progress', icon: Icons.Progress },
      { name: 'Leaderboard', href: '/dosen/leaderboard', icon: Icons.Leaderboard },
    ],
    
    superadmin: [
      { name: 'Dashboard', href: '/superadmin/dashboard', icon: Icons.Dashboard },
      { name: 'Users', href: '/superadmin/users', icon: Icons.Users },
      { name: 'Kelas', href: '/superadmin/kelas', icon: Icons.Class },
    ],
  };

  return configs[role] || configs.guest;
};