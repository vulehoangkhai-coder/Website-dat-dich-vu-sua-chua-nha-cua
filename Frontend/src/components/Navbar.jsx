import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import useAuthStore from '../store/useAuthStore';

const Navbar = () => {
    const { user, isLoggedIn, logout, getRoleName } = useAuthStore();
    const navigate = useNavigate();
    const location = useLocation();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    const handleLogout = async () => {
        await logout();
        navigate('/');
        setIsMenuOpen(false);
        setIsDropdownOpen(false);
    };

    // Function to check if a link is active
    const isActive = (path) => {
        if (path === '/') {
            return location.pathname === '/';
        }
        return location.pathname.startsWith(path);
    };

    // Function to get link classes with active state
    const getLinkClasses = (path, isMobile = false) => {
        const baseClasses = isMobile
            ? "block px-3 py-2 rounded-md text-base font-medium transition-colors"
            : "px-3 py-2 rounded-md text-sm font-medium transition-colors";

        if (isActive(path)) {
            return `${baseClasses} text-primary-600 bg-primary-50`;
        }
        return `${baseClasses} text-gray-700 hover:text-primary-600`;
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const getRoleBasedLinks = () => {
        if (!isLoggedIn) return [];

        const role = user?.role;

        switch (role) {
            case 0: // CUSTOMER
                return [
                    { to: '/booking-history', label: 'Lịch sử đặt lịch' }
                ];
            case 1: // ADMIN
                return [
                    { to: '/admin/services', label: 'Quản lý dịch vụ' },
                    { to: '/admin/employees', label: 'Quản lý nhân viên' }
                ];
            case 2: // EMPLOYEE
                return [
                    { to: '/employee/bookings', label: 'Danh sách booking' }
                ];
            default:
                return [];
        }
    };

    const getUserMenuItems = () => {
        const role = user?.role;
        const baseItems = [
            { name: 'Hồ sơ', href: '/profile', icon: '👤' },
            { name: 'Đổi mật khẩu', href: '/change-password', icon: '🔒' }
        ];

        switch (role) {
            case 0: // CUSTOMER
                return [
                    ...baseItems
                ];
            case 1: // ADMIN
                return [
                    ...baseItems
                ];
            case 2: // EMPLOYEE
                return [
                    ...baseItems
                ];
            default:
                return baseItems;
        }
    };

    return (
        <nav className="bg-white shadow-lg sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex items-center">
                        <Link to="/" className="flex-shrink-0 flex items-center">
                            <div className="w-10 h-10 bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-xl">H</span>
                            </div>
                            <span className="ml-3 text-xl font-bold text-gray-900">HSMS</span>
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center space-x-8">
                        <Link
                            to="/"
                            className={getLinkClasses('/')}
                        >
                            Trang chủ
                        </Link>
                        <Link
                            to="/services"
                            className={getLinkClasses('/services')}
                        >
                            Dịch vụ
                        </Link>
                        <Link
                            to="/about"
                            className={getLinkClasses('/about')}
                        >
                            Về chúng tôi
                        </Link>
                        <Link
                            to="/contact"
                            className={getLinkClasses('/contact')}
                        >
                            Liên hệ
                        </Link>

                        {getRoleBasedLinks().map((link) => (
                            <Link
                                key={link.to}
                                to={link.to}
                                className={getLinkClasses(link.to)}
                            >
                                {link.label}
                            </Link>
                        ))}

                        {isLoggedIn ? (
                            <div className="relative" ref={dropdownRef}>
                                <button
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                    className="flex items-center space-x-2 hover:bg-gray-50 px-3 py-2 rounded-lg transition-colors"
                                >
                                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                                        <span className="text-primary-600 font-medium text-sm">
                                            {user?.fullname?.charAt(0)?.toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="text-sm text-left">
                                        <div className="font-medium text-gray-900">{user?.fullname}</div>
                                        <div className="text-gray-500">{getRoleName()}</div>
                                    </div>
                                    <svg
                                        className={`w-4 h-4 text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>

                                {/* Dropdown Menu */}
                                {isDropdownOpen && (
                                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                                        <div className="px-4 py-3 border-b border-gray-100">
                                            <div className="text-sm font-medium text-gray-900">{user?.fullname}</div>
                                            <div className="text-sm text-gray-500">{user?.email}</div>
                                        </div>

                                        {getUserMenuItems().map((item, index) => (
                                            <Link
                                                key={index}
                                                to={item.href}
                                                onClick={() => setIsDropdownOpen(false)}
                                                className={`flex items-center px-4 py-2 text-sm transition-colors ${isActive(item.href)
                                                        ? 'text-primary-600 bg-primary-50'
                                                        : 'text-gray-700 hover:bg-gray-50'
                                                    }`}
                                            >
                                                <span className="mr-3">{item.icon}</span>
                                                {item.name}
                                            </Link>
                                        ))}

                                        <div className="border-t border-gray-100 mt-2 pt-2">
                                            <button
                                                onClick={handleLogout}
                                                className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                            >
                                                <span className="mr-3">🚪</span>
                                                Đăng xuất
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center space-x-4">
                                <Link
                                    to="/login"
                                    className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                                >
                                    Đăng nhập
                                </Link>
                                <Link
                                    to="/register"
                                    className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                                >
                                    Đăng ký
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Mobile menu button */}
                    <div className="md:hidden flex items-center">
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="text-gray-700 hover:text-primary-600 focus:outline-none focus:text-primary-600"
                        >
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Mobile Navigation */}
                {isMenuOpen && (
                    <div className="md:hidden">
                        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-gray-200">
                            <Link
                                to="/"
                                className={getLinkClasses('/', true)}
                                onClick={() => setIsMenuOpen(false)}
                            >
                                Trang chủ
                            </Link>
                            <Link
                                to="/services"
                                className={getLinkClasses('/services', true)}
                                onClick={() => setIsMenuOpen(false)}
                            >
                                Dịch vụ
                            </Link>
                            <Link
                                to="/about"
                                className={getLinkClasses('/about', true)}
                                onClick={() => setIsMenuOpen(false)}
                            >
                                Về chúng tôi
                            </Link>
                            <Link
                                to="/contact"
                                className={getLinkClasses('/contact', true)}
                                onClick={() => setIsMenuOpen(false)}
                            >
                                Liên hệ
                            </Link>

                            {getRoleBasedLinks().map((link) => (
                                <Link
                                    key={link.to}
                                    to={link.to}
                                    className={getLinkClasses(link.to, true)}
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    {link.label}
                                </Link>
                            ))}

                            {isLoggedIn ? (
                                <div className="border-t border-gray-200 pt-4 pb-3">
                                    <div className="flex items-center px-3">
                                        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                                            <span className="text-primary-600 font-medium">
                                                {user?.fullname?.charAt(0)?.toUpperCase()}
                                            </span>
                                        </div>
                                        <div className="ml-3">
                                            <div className="text-base font-medium text-gray-800">{user?.fullname}</div>
                                            <div className="text-sm font-medium text-gray-500">{getRoleName()}</div>
                                        </div>
                                    </div>
                                    <div className="mt-3 px-2 space-y-1">
                                        {getUserMenuItems().map((item, index) => (
                                            <Link
                                                key={index}
                                                to={item.href}
                                                onClick={() => setIsMenuOpen(false)}
                                                className={`flex items-center px-3 py-2 rounded-md text-base font-medium transition-colors ${isActive(item.href)
                                                        ? 'text-primary-600 bg-primary-50'
                                                        : 'text-gray-700 hover:bg-gray-50'
                                                    }`}
                                            >
                                                <span className="mr-3">{item.icon}</span>
                                                {item.name}
                                            </Link>
                                        ))}
                                        <button
                                            onClick={handleLogout}
                                            className="flex items-center w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-50"
                                        >
                                            <span className="mr-3">🚪</span>
                                            Đăng xuất
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="border-t border-gray-200 pt-4 pb-3">
                                    <Link
                                        to="/login"
                                        className="text-gray-700 hover:text-primary-600 block px-3 py-2 rounded-md text-base font-medium"
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        Đăng nhập
                                    </Link>
                                    <Link
                                        to="/register"
                                        className="bg-primary-600 hover:bg-primary-700 text-white block px-3 py-2 rounded-md text-base font-medium mt-2"
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        Đăng ký
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
