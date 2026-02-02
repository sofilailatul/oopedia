import Icons from '@/icons';

export const getNavConfig = (role) => {
  const configs = {
    // TAMU - register tapi belum join kelas
    tamu: [
      {
        name: 'Dashboard',
        href: '/dashboard',
        icon: Icons.Dashboard,
      },
      {
        name: 'Materi',
        href: '/materials',
        icon: Icons.Materials,
      },
      {
        name: 'Latihan',
        href: '/practices',
        icon: Icons.Practice,
      },
      {
        name: 'Quiz',
        href: '/quizzes',
        icon: Icons.Quiz,
      },
      {
        name: 'Leaderboard',
        href: '#',
        icon: Icons.Leaderboard,
        requiresAuth: true, // Show modal "harus join kelas dulu"
      },
    ],
    
    // MAHASISWA - sudah join kelas
    mahasiswa: [
      {
        name: 'Dashboard',
        href: '/dashboard',
        icon: Icons.Dashboard,
      },
      {
        name: 'Materi',
        href: '/materials',
        icon: Icons.Materials,
      },
      {
        name: 'Latihan',
        href: '/practices',
        icon: Icons.Practice,
      },
      {
        name: 'Quiz',
        href: '/quizzes',
        icon: Icons.Quiz,
      },
      {
        name: 'Progress',
        href: '/progress',
        icon: Icons.Progress,
      },
      {
        name: 'Rekomendasi',
        href: '/recommendations',
        icon: Icons.Star,
      },
      {
        name: 'Leaderboard',
        href: '/leaderboard/combined',
        icon: Icons.Leaderboard,
      },
    ],
    
    // DOSEN
    dosen: [
      {
        name: 'Dashboard',
        href: '/dashboard',
        icon: Icons.Dashboard,
      },
      {
        name: 'Kelas',
        href: '/classes',
        icon: Icons.Class,
      },
      {
        name: 'Materi',
        href: '/materials',
        icon: Icons.Materials,
      },
      {
        name: 'Latihan',
        href: '/practices',
        icon: Icons.Practice,
      },
      {
        name: 'Quiz',
        href: '/quizzes',
        icon: Icons.Quiz,
      },
      {
        name: 'Leaderboard',
        href: '/leaderboard/combined',
        icon: Icons.Leaderboard,
      },
    ],
    
    // SUPERADMIN
    superadmin: [
      {
        name: 'Dashboard',
        href: '/dashboard',
        icon: Icons.Dashboard,
      },
      {
        name: 'Users',
        href: '/admin/users',
        icon: Icons.Users,
      },
      {
        name: 'Leaderboard',
        href: '/admin/leaderboard/combined',
        icon: Icons.Leaderboard,
      },
    ],
  };

  return configs[role] || configs.mahasiswa;
};






