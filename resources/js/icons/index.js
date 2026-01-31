// resources/js/icons/index.js

import { 
  MdDashboard,
  MdBook,
  MdQuiz,
  MdLeaderboard,
  MdClass,
  MdPeople,
  MdLogout,
  MdMenu,
  MdNotifications,
  MdAccountCircle,
  MdClose,
  MdAdd,
  MdEdit,
  MdDelete,
  MdSave,
  MdCheck,
  MdPlayArrow,
  MdVisibility,
  MdLock,
  MdLockOpen,
  MdChevronRight,
  MdChevronLeft,
  MdSearch,
  MdFilterList,
  MdMoreVert,
  MdInfo,
  MdWarning,
  MdError,
  MdCheckCircle,
} from 'react-icons/md';

import {
  FaBookOpen,
  FaClipboardList,
  FaTrophy,
  FaUsers,
  FaGraduationCap,
  FaChartBar,
  FaBell,        // ✅ Bell dari FA
  FaUser,        // ✅ User dari FA
  FaSignOutAlt,  // ✅ Logout dari FA
  FaClock,
  FaStar,
  FaUpload,
  FaDownload,
} from 'react-icons/fa';

export const Icons = {
  // Navigation
  Dashboard: MdDashboard,
  Materials: FaBookOpen,
  Practice: FaClipboardList,
  Quiz: MdQuiz,
  Leaderboard: FaTrophy,
  Class: FaGraduationCap,
  Users: FaUsers,
  Progress: FaChartBar,
  
  // Actions
  Add: MdAdd,
  Edit: MdEdit,
  Delete: MdDelete,
  Save: MdSave,
  Check: MdCheck,
  Play: MdPlayArrow,
  View: MdVisibility,
  Upload: FaUpload,
  Download: FaDownload,
  Close: MdClose,
  
  // States
  Lock: MdLock,
  Unlock: MdLockOpen,
  
  // Navigation arrows
  ChevronRight: MdChevronRight,
  ChevronLeft: MdChevronLeft,
  Menu: MdMenu,
  
  // User & Auth
  Notification: FaBell,       
  Bell: FaBell,               
  Account: MdAccountCircle,
  User: FaUser,               
  Logout: FaSignOutAlt,       
  
  // Utility
  Search: MdSearch,
  Filter: MdFilterList,
  More: MdMoreVert,
  Clock: FaClock,
  Star: FaStar,
  
  // Alerts
  Info: MdInfo,
  Warning: MdWarning,
  Error: MdError,
  Success: MdCheckCircle,
};

export default Icons;