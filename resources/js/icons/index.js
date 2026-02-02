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
  MdRefresh,
  MdArrowBack,
  MdArrowForward,
} from 'react-icons/md';

import {
  FaBookOpen,
  FaClipboardList,
  FaTrophy,
  FaUsers,
  FaGraduationCap,
  FaChartBar,
  FaBell,
  FaUser,
  FaSignOutAlt,
  FaClock,
  FaStar,
  FaUpload,
  FaDownload,
  FaCode,
  FaCheckCircle,
  FaTimesCircle,
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
  Refresh: MdRefresh,
  Back: MdArrowBack,
  Forward: MdArrowForward,
  
  // States
  Lock: MdLock,
  Unlock: MdLockOpen,
  Success: FaCheckCircle,
  Failed: FaTimesCircle,
  
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
  Code: FaCode,
  
  // Alerts
  Info: MdInfo,
  Warning: MdWarning,
  Error: MdError,
  CheckCircle: MdCheckCircle,
};

export default Icons;