import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../utils/axiosInstance';
import useAuthStore from '../store/useAuthStore';
import LoadingSpinner from '../components/LoadingSpinner';
import Avatar from '../components/Avatar';

const ServiceCard = ({ service }) => {
    const { user, isLoggedIn } = useAuthStore();

    return (
        <div className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden transform hover:-translate-y-2 border border-gray-100">
            <div className="relative overflow-hidden">
                <img
                    src={service.imageUrl || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop'}
                    alt={service.name}
                    className="w-full h-56 object-cover group-hover:scale-110 transition-transform duration-500"
                    loading="lazy"
                />
                <div className="absolute top-4 left-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white/90 backdrop-blur-sm text-primary-700 border border-primary-200">
                        {service.category}
                    </span>
                </div>
                <div className="absolute top-4 right-4">
                    <div className="flex items-center bg-white/90 backdrop-blur-sm rounded-full px-2 py-1">
                        {service.averageRating && service.averageRating > 0 ? (
                            <>
                                <svg className="w-4 h-4 text-yellow-400 fill-current mr-1" viewBox="0 0 20 20">
                                    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                                </svg>
                                <span className="text-sm font-medium text-gray-700">
                                    {service.averageRating.toFixed(1)}
                                </span>
                                {service.totalRatings > 0 && (
                                    <span className="text-xs text-gray-500 ml-1">
                                        ({service.totalRatings})
                                    </span>
                                )}
                            </>
                        ) : (
                            <span className="text-xs font-medium text-gray-500 px-1">
                                Chưa có đánh giá
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <div className="p-6">
                <Link to={`/services/${service.id}`} className="block">
                    <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-primary-600 transition-colors">
                        {service.name}
                    </h3>
                </Link>
                <p className="text-gray-600 mb-4 line-clamp-2 leading-relaxed">{service.description}</p>

                <div className="flex items-center justify-between mb-6">
                    <div className="text-right">
                        <div className="text-2xl font-bold text-primary-600">
                            {service.price.toLocaleString('vi-VN')}đ
                        </div>
                    </div>
                </div>

                {/* Hiển thị nút đặt dịch vụ cho Customer hoặc chưa đăng nhập */}
                {!isLoggedIn || user?.role === 0 ? (
                    <Link
                        to={!isLoggedIn ? "/login" : `/booking/${service.id}`}
                        className="w-full bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-semibold py-3 px-4 rounded-xl text-center block transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
                    >
                        Đặt dịch vụ ngay
                    </Link>
                ) : (
                    <div className="w-full bg-gray-100 text-gray-500 font-medium py-3 px-4 rounded-xl text-center">
                        Chỉ khách hàng mới có thể đặt dịch vụ
                    </div>
                )}
            </div>
        </div>
    );
};

const ServicesSection = () => {
    const [services, setServices] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    // Search & Filter States
    const [searchParams, setSearchParams] = useState({
        keyword: '',
        field: null, // 1: service name, 2: category, 3: search all fields
        fromPrice: '',
        toPrice: '',
        pageNumber: 1,
        pageSize: 6
    });

    // Pagination Info
    const [paginationInfo, setPaginationInfo] = useState({
        totalItems: 0,
        totalPages: 0,
        currentPage: 1
    });

    const [categories, setCategories] = useState([]);

    useEffect(() => {
        fetchServices();
    }, [searchParams.pageNumber]);

    const fetchServices = async () => {
        try {
            setIsLoading(true);
            setError('');

            // Build query parameters
            const params = new URLSearchParams();
            params.append('PageNumber', searchParams.pageNumber.toString());
            params.append('PageSize', searchParams.pageSize.toString());

            if (searchParams.keyword) {
                params.append('Keyword', searchParams.keyword);
                if (searchParams.field) {
                    params.append('Field', searchParams.field.toString());
                }
            }

            if (searchParams.fromPrice) {
                params.append('FromPrice', searchParams.fromPrice);
            }

            if (searchParams.toPrice) {
                params.append('ToPrice', searchParams.toPrice);
            }

            const response = await axiosInstance.get(`/services?${params.toString()}`);

            if (response.data.code === 1000) {
                const servicesData = response.data.result.items;

                // Fetch ratings for each service
                const servicesWithRatings = await Promise.all(
                    servicesData.map(async (service) => {
                        try {
                            const ratingResponse = await axiosInstance.get(`/services/${service.id}/rating`);
                            if (ratingResponse.data.code === 1000) {
                                return {
                                    ...service,
                                    averageRating: ratingResponse.data.result?.averageRating || 0,
                                    totalRatings: ratingResponse.data.result?.totalRatings || 0
                                };
                            }
                        } catch (error) {
                            console.warn(`Failed to fetch rating for service ${service.id}:`, error);
                        }
                        return {
                            ...service,
                            averageRating: service.averageRating || 0,
                            totalRatings: 0
                        };
                    })
                );

                setServices(servicesWithRatings);
                setPaginationInfo({
                    totalItems: response.data.result.totalItems,
                    totalPages: response.data.result.totalPages,
                    currentPage: response.data.result.page
                });

                // Extract categories from API data
                const uniqueCategories = [...new Set(servicesWithRatings.map(service => service.category))];
                setCategories(uniqueCategories);
            }
        } catch (error) {
            setError('Không thể tải danh sách dịch vụ. Vui lòng thử lại sau.');
        } finally {
            setIsLoading(false);
        }
    };


    const handleSearch = () => {
        setSearchParams(prev => ({ ...prev, pageNumber: 1 }));
        fetchServices();
    };

    const handlePageChange = (page) => {
        setSearchParams(prev => ({ ...prev, pageNumber: page }));
    };

    const handleClearFilters = () => {
        setSearchParams({
            keyword: '',
            field: null,
            fromPrice: '',
            toPrice: '',
            pageNumber: 1,
            pageSize: 6
        });
    };

    useEffect(() => {
        if (searchParams.keyword === '' && searchParams.fromPrice === '' && searchParams.toPrice === '') {
            fetchServices();
        }
    }, [searchParams.keyword, searchParams.fromPrice, searchParams.toPrice]);

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center mb-16">
                <div className="mb-4">
                    <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-primary-100 text-primary-700">
                        🛠️ Dịch vụ chuyên nghiệp
                    </span>
                </div>
                <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                    Dịch vụ của chúng tôi
                </h2>
                <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                    Tất cả các dịch vụ sửa chữa nhà cửa bạn cần với đội ngũ thợ lành nghề và công nghệ hiện đại
                </p>
            </div>

            {/* Search and Filter */}
            <div className="mb-12 bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
                    {/* Search Input */}
                    <div className="lg:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Tìm kiếm dịch vụ</label>
                        <div className="relative">
                            <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Nhập từ khóa tìm kiếm..."
                                value={searchParams.keyword}
                                onChange={(e) => setSearchParams(prev => ({ ...prev, keyword: e.target.value }))}
                                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-lg"
                            />
                        </div>
                    </div>

                    {/* Search Field */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Tìm kiếm theo</label>
                        <select
                            value={searchParams.field || ''}
                            onChange={(e) => setSearchParams(prev => ({ ...prev, field: e.target.value ? parseInt(e.target.value) : null }))}
                            className="w-full py-3 px-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-lg"
                        >
                            <option value="">Chọn trường tìm kiếm</option>
                            <option value="1">Tên dịch vụ</option>
                            <option value="2">Danh mục</option>
                            <option value="3">Tất cả</option>
                        </select>
                    </div>

                    {/* Price Range */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Khoảng giá</label>
                        <div className="flex gap-2">
                            <input
                                type="number"
                                placeholder="Từ"
                                value={searchParams.fromPrice}
                                onChange={(e) => setSearchParams(prev => ({ ...prev, fromPrice: e.target.value }))}
                                className="w-full py-3 px-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                            />
                            <input
                                type="number"
                                placeholder="Đến"
                                value={searchParams.toPrice}
                                onChange={(e) => setSearchParams(prev => ({ ...prev, toPrice: e.target.value }))}
                                className="w-full py-3 px-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                            />
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4">
                    <button
                        onClick={handleSearch}
                        className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-xl font-medium transition-colors flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        Tìm kiếm
                    </button>
                    <button
                        onClick={handleClearFilters}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-8 py-3 rounded-xl font-medium transition-colors flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Xóa bộ lọc
                    </button>
                </div>

                {/* Results Info */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-600">
                        Hiển thị <span className="font-semibold">{services.length}</span> trên tổng số <span className="font-semibold">{paginationInfo.totalItems}</span> dịch vụ
                        {searchParams.keyword && (
                            <span> - Kết quả tìm kiếm cho "<span className="font-semibold text-primary-600">{searchParams.keyword}</span>"</span>
                        )}
                    </p>
                </div>
            </div>

            {/* Services Grid */}
            {isLoading ? (
                <div className="flex justify-center py-20">
                    <div className="text-center">
                        <LoadingSpinner size="lg" />
                        <p className="mt-4 text-gray-600">Đang tải dịch vụ...</p>
                    </div>
                </div>
            ) : error ? (
                <div className="text-center py-20">
                    <div className="bg-red-50 rounded-xl p-8 max-w-md mx-auto">
                        <svg className="w-16 h-16 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        <div className="text-red-600 mb-6 font-medium">{error}</div>
                        <button
                            onClick={fetchServices}
                            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                        >
                            Thử lại
                        </button>
                    </div>
                </div>
            ) : services.length === 0 ? (
                <div className="text-center py-20">
                    <div className="bg-gray-50 rounded-xl p-8 max-w-md mx-auto">
                        <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-1.009-5.824-2.579C6.176 11.991 6 11.5 6 11c0-2.761 2.239-5 5-5s5 2.239 5 5c0 .5-.176.991-.176 1.421z" />
                        </svg>
                        <div className="text-gray-600 text-lg mb-4">Không tìm thấy dịch vụ nào</div>
                        <p className="text-gray-500">Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc</p>
                        <button
                            onClick={handleClearFilters}
                            className="mt-4 bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                        >
                            Xóa bộ lọc
                        </button>
                    </div>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {services.map(service => (
                            <ServiceCard key={service.id} service={service} />
                        ))}
                    </div>

                    {/* Pagination */}
                    {paginationInfo.totalPages > 1 && (
                        <div className="mt-12 flex justify-center">
                            <div className="flex items-center gap-2">
                                {/* Previous Button */}
                                <button
                                    onClick={() => handlePageChange(paginationInfo.currentPage - 1)}
                                    disabled={paginationInfo.currentPage === 1}
                                    className="px-4 py-2 rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>

                                {/* Page Numbers */}
                                {Array.from({ length: paginationInfo.totalPages }, (_, i) => i + 1).map(page => (
                                    <button
                                        key={page}
                                        onClick={() => handlePageChange(page)}
                                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${page === paginationInfo.currentPage
                                            ? 'bg-primary-600 text-white'
                                            : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                                            }`}
                                    >
                                        {page}
                                    </button>
                                ))}

                                {/* Next Button */}
                                <button
                                    onClick={() => handlePageChange(paginationInfo.currentPage + 1)}
                                    disabled={paginationInfo.currentPage === paginationInfo.totalPages}
                                    className="px-4 py-2 rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

const Home = () => {
    const { isLoggedIn, user } = useAuthStore();

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Hero Section */}
            <div className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 overflow-hidden">
                {/* Background Image */}
                <div className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30" style={{
                    backgroundImage: "url('https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1600&h=900&fit=crop')"
                }}></div>
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
                <div className="absolute inset-0 bg-gradient-to-br from-primary-600/60 via-primary-700/60 to-primary-800/60 opacity-1yy0"></div>
                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-24">
                    <div className="text-center">
                        <div className="mb-6">
                            <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-white/10 backdrop-blur-sm text-white border border-white/20">
                                🏠 Dịch vụ sửa chữa nhà cửa chuyên nghiệp
                            </span>
                        </div>
                        <h1 className="text-5xl md:text-7xl md:leading-normal font-bold text-white mb-6 leading-tight">
                            Sửa chữa nhà cửa
                            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-300">
                                Chuyên nghiệp
                            </span>
                        </h1>
                        <p className="text-xl md:text-2xl text-primary-100 mb-10 max-w-3xl mx-auto leading-relaxed">
                            Đội ngũ thợ lành nghề, uy tín, giá cả hợp lý. Sẵn sàng phục vụ 24/7 với chất lượng đảm bảo
                        </p>
                        {!isLoggedIn && (
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <Link
                                    to="/register"
                                    className="inline-flex items-center px-8 py-4 bg-white text-primary-700 rounded-xl font-bold text-lg hover:bg-gray-50 transition-all duration-200 transform hover:scale-105 shadow-xl"
                                >
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                    </svg>
                                    Đăng ký ngay
                                </Link>
                                <Link
                                    to="/login"
                                    className="inline-flex items-center px-8 py-4 border-2 border-white text-white rounded-xl font-bold text-lg hover:bg-white hover:text-primary-700 transition-all duration-200 transform hover:scale-105 backdrop-blur-sm"
                                >
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                                    </svg>
                                    Đăng nhập
                                </Link>
                            </div>
                        )}
                        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                            <div className="text-center">
                                <div className="text-3xl font-bold text-white mb-2">500+</div>
                                <div className="text-primary-200">Khách hàng hài lòng</div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-bold text-white mb-2">24/7</div>
                                <div className="text-primary-200">Hỗ trợ khách hàng</div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-bold text-white mb-2">100%</div>
                                <div className="text-primary-200">Bảo đảm chất lượng</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Services Section */}
            <ServicesSection />

            {/* Features Section */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <div className="mb-4">
                            <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-primary-100 text-primary-700">
                                ⭐ Tại sao chọn chúng tôi?
                            </span>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                            Điểm nổi bật
                        </h2>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                            Chúng tôi cam kết mang đến dịch vụ tốt nhất với những ưu điểm vượt trội
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
                            <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">Chất lượng đảm bảo</h3>
                            <p className="text-gray-600 text-center leading-relaxed">Đội ngũ thợ lành nghề với kinh nghiệm lâu năm, sử dụng vật liệu chất lượng cao</p>
                        </div>
                        <div className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
                            <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">Phục vụ 24/7</h3>
                            <p className="text-gray-600 text-center leading-relaxed">Sẵn sàng hỗ trợ mọi lúc mọi nơi, kể cả cuối tuần và ngày lễ</p>
                        </div>
                        <div className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
                            <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                </svg>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">Giá cả hợp lý</h3>
                            <p className="text-gray-600 text-center leading-relaxed">Báo giá minh bạch, không phát sinh chi phí, đảm bảo giá cạnh tranh nhất thị trường</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Testimonials Section */}
            <div className="bg-white py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <div className="mb-4">
                            <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-primary-100 text-primary-700">
                                💬 Đánh giá từ khách hàng
                            </span>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                            Khách hàng nói gì về chúng tôi
                        </h2>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                            Những phản hồi chân thực từ những khách hàng đã tin tưởng sử dụng dịch vụ
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="bg-gray-50 rounded-2xl p-8 hover:shadow-lg transition-shadow duration-300">
                            <div className="flex items-center mb-4">
                                {[...Array(5)].map((_, i) => (
                                    <svg key={i} className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                                        <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                                    </svg>
                                ))}
                            </div>
                            <p className="text-gray-700 mb-6 leading-relaxed">
                                "Dịch vụ sửa chữa rất chuyên nghiệp, thợ đến đúng giờ và làm việc rất cẩn thận.
                                Nhà tôi sau khi sửa chữa trông như mới hoàn toàn!"
                            </p>
                            <div className="flex items-center">
                                <Avatar
                                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&h=60&fit=crop&crop=face"
                                    alt="Customer"
                                    className="w-12 h-12 rounded-full mr-4"
                                />
                                <div>
                                    <div className="font-semibold text-gray-900">Anh Minh</div>
                                    <div className="text-sm text-gray-600">Quận 1, TP.HCM</div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gray-50 rounded-2xl p-8 hover:shadow-lg transition-shadow duration-300">
                            <div className="flex items-center mb-4">
                                {[...Array(5)].map((_, i) => (
                                    <svg key={i} className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                                        <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                                    </svg>
                                ))}
                            </div>
                            <p className="text-gray-700 mb-6 leading-relaxed">
                                "Giá cả rất hợp lý, không phát sinh chi phí như các công ty khác.
                                Đội ngũ thợ rất thân thiện và giải thích rõ ràng từng bước thi công."
                            </p>
                            <div className="flex items-center">
                                <Avatar
                                    src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=60&h=60&fit=crop&crop=face"
                                    alt="Customer"
                                    className="w-12 h-12 rounded-full mr-4"
                                />
                                <div>
                                    <div className="font-semibold text-gray-900">Chị Lan</div>
                                    <div className="text-sm text-gray-600">Quận 3, TP.HCM</div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gray-50 rounded-2xl p-8 hover:shadow-lg transition-shadow duration-300">
                            <div className="flex items-center mb-4">
                                {[...Array(5)].map((_, i) => (
                                    <svg key={i} className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                                        <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                                    </svg>
                                ))}
                            </div>
                            <p className="text-gray-700 mb-6 leading-relaxed">
                                "Thi công rất nhanh chóng và đúng tiến độ. Chất lượng công trình vượt ngoài mong đợi.
                                Sẽ giới thiệu cho bạn bè và gia đình sử dụng dịch vụ."
                            </p>
                            <div className="flex items-center">
                                <Avatar
                                    src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=60&h=60&fit=crop&crop=face"
                                    alt="Customer"
                                    className="w-12 h-12 rounded-full mr-4"
                                />
                                <div>
                                    <div className="font-semibold text-gray-900">Anh Tuấn</div>
                                    <div className="text-sm text-gray-600">Quận 7, TP.HCM</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Process Section */}
            <div className="bg-gradient-to-br from-primary-50 to-primary-100 py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <div className="mb-4">
                            <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-primary-200 text-primary-800">
                                🔄 Quy trình làm việc
                            </span>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                            4 bước đơn giản
                        </h2>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                            Quy trình làm việc chuyên nghiệp, đảm bảo chất lượng và tiến độ
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        <div className="text-center group">
                            <div className="w-20 h-20 bg-white rounded-2xl shadow-lg flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                                <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center text-white text-xl font-bold">1</div>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Tư vấn & Khảo sát</h3>
                            <p className="text-gray-600 leading-relaxed">
                                Tư vấn miễn phí và khảo sát hiện trạng để đưa ra giải pháp tối ưu nhất
                            </p>
                        </div>

                        <div className="text-center group">
                            <div className="w-20 h-20 bg-white rounded-2xl shadow-lg flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                                <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center text-white text-xl font-bold">2</div>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Báo giá & Ký hợp đồng</h3>
                            <p className="text-gray-600 leading-relaxed">
                                Báo giá chi tiết, minh bạch và ký kết hợp đồng rõ ràng
                            </p>
                        </div>

                        <div className="text-center group">
                            <div className="w-20 h-20 bg-white rounded-2xl shadow-lg flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                                <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center text-white text-xl font-bold">3</div>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Thi công & Giám sát</h3>
                            <p className="text-gray-600 leading-relaxed">
                                Thi công chuyên nghiệp với sự giám sát chất lượng liên tục
                            </p>
                        </div>

                        <div className="text-center group">
                            <div className="w-20 h-20 bg-white rounded-2xl shadow-lg flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                                <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center text-white text-xl font-bold">4</div>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Nghiệm thu & Bảo hành</h3>
                            <p className="text-gray-600 leading-relaxed">
                                Nghiệm thu kỹ lưỡng và cam kết bảo hành dài hạn
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* CTA Section */}
            <div className="bg-gradient-to-r from-primary-600 to-primary-700 py-20">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                        Sẵn sàng bắt đầu dự án?
                    </h2>
                    <p className="text-xl text-primary-100 mb-10 max-w-2xl mx-auto">
                        Liên hệ ngay để được tư vấn miễn phí và báo giá chi tiết cho dự án của bạn
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        {!isLoggedIn || user?.role === 0 ? (
                            <>
                                <Link
                                    to="/contact"
                                    className="inline-flex items-center px-8 py-4 bg-white text-primary-700 rounded-xl font-bold text-lg hover:bg-gray-50 transition-all duration-200 transform hover:scale-105 shadow-xl"
                                >
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                    </svg>
                                    Liên hệ ngay
                                </Link>
                                <Link
                                    to="/services"
                                    className="inline-flex items-center px-8 py-4 border-2 border-white text-white rounded-xl font-bold text-lg hover:bg-white hover:text-primary-700 transition-all duration-200 transform hover:scale-105 backdrop-blur-sm"
                                >
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                    Xem dịch vụ
                                </Link>
                            </>
                        ) : user?.role === 1 ? (
                            <div className="text-center">
                                <p className="text-primary-100 mb-4 text-lg">
                                    Bạn đang đăng nhập với tài khoản nhân viên
                                </p>
                                <Link
                                    to="/employee/booking-list"
                                    className="inline-flex items-center px-8 py-4 bg-white text-primary-700 rounded-xl font-bold text-lg hover:bg-gray-50 transition-all duration-200 transform hover:scale-105 shadow-xl"
                                >
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                    </svg>
                                    Xem danh sách booking
                                </Link>
                            </div>
                        ) : user?.role === 2 ? (
                            <div className="text-center">
                                <p className="text-primary-100 mb-4 text-lg">
                                    Bạn đang đăng nhập với tài khoản quản trị viên
                                </p>
                                <Link
                                    to="/admin/manage-employees"
                                    className="inline-flex items-center px-8 py-4 bg-white text-primary-700 rounded-xl font-bold text-lg hover:bg-gray-50 transition-all duration-200 transform hover:scale-105 shadow-xl"
                                >
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    Quản lý hệ thống
                                </Link>
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Home;
