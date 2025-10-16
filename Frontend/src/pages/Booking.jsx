import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axiosInstance from '../utils/axiosInstance';
import useAuthStore from '../store/useAuthStore';
import LoadingSpinner from '../components/LoadingSpinner';

const Booking = () => {
    const { serviceId } = useParams();
    const navigate = useNavigate();
    const { user, isLoggedIn } = useAuthStore();

    const [service, setService] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [formData, setFormData] = useState({
        address: '',
        hireAt: '',
        note: ''
    });

    useEffect(() => {
        if (!isLoggedIn) {
            navigate('/login');
            return;
        }

        if (!serviceId || isNaN(serviceId)) {
            setError('ID dịch vụ không hợp lệ.');
            setIsLoading(false);
            return;
        }

        fetchService();
    }, [serviceId, isLoggedIn, navigate]);

    const fetchService = async () => {
        try {
            setIsLoading(true);
            setError('');

            const response = await axiosInstance.get(`/services/${serviceId}`);

            if (response.data.code === 1000) {
                setService(response.data.result);
            } else {
                setError('Không thể tải thông tin dịch vụ. Dịch vụ có thể không tồn tại.');
            }
        } catch (error) {
            if (error.response?.status === 404) {
                setError('Dịch vụ không tồn tại hoặc đã bị xóa.');
            } else if (error.response?.status === 403) {
                setError('Bạn không có quyền truy cập dịch vụ này.');
            } else {
                setError('Không thể tải thông tin dịch vụ. Vui lòng thử lại sau.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError('');
        setSuccess('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');
        setSuccess('');

        // Validate form data
        if (!formData.address.trim()) {
            setError('Vui lòng nhập địa chỉ thực hiện dịch vụ.');
            setIsSubmitting(false);
            return;
        }

        if (!formData.hireAt) {
            setError('Vui lòng chọn thời gian thực hiện dịch vụ.');
            setIsSubmitting(false);
            return;
        }

        // Check if selected time is in the future
        const selectedTime = new Date(formData.hireAt);
        const now = new Date();
        if (selectedTime <= now) {
            setError('Thời gian thực hiện dịch vụ phải là thời gian trong tương lai.');
            setIsSubmitting(false);
            return;
        }

        try {
            // Check if user is logged in and has valid token
            if (!isLoggedIn || !user) {
                setError('Vui lòng đăng nhập để đặt dịch vụ.');
                toast.error('Vui lòng đăng nhập để đặt dịch vụ.');
                setTimeout(() => {
                    navigate('/login');
                }, 2000);
                return;
            }

            const bookingData = {
                serviceId: parseInt(serviceId),
                hireAt: new Date(formData.hireAt).toISOString(), // Convert to ISO 8601 format
                address: formData.address.trim(),
                note: formData.note.trim() || "string" // Use "string" as default if empty
            };


            const response = await axiosInstance.post('/bookings', bookingData);

            if (response.data.code === 1000) {
                const successMessage = response.data.result || 'Đặt dịch vụ thành công! Chúng tôi sẽ liên hệ lại sớm nhất.';
                setSuccess(successMessage);
                toast.success(successMessage);

                // Navigate to booking history after 3 seconds
                setTimeout(() => {
                    navigate('/booking-history');
                }, 3000);
            } else {
                const errorMessage = response.data.message || 'Đặt dịch vụ thất bại. Vui lòng thử lại.';
                setError(errorMessage);
                toast.error(errorMessage);
            }
        } catch (error) {
            let errorMessage = 'Đặt dịch vụ thất bại. Vui lòng thử lại.';

            if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.response?.status === 401) {
                errorMessage = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
                setTimeout(() => {
                    navigate('/login');
                }, 2000);
            } else if (error.response?.status === 403) {
                errorMessage = 'Bạn không có quyền thực hiện hành động này. Vui lòng kiểm tra lại tài khoản.';
            } else if (error.response?.status === 400) {
                errorMessage = 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin.';
            } else if (error.response?.status === 500) {
                errorMessage = 'Lỗi máy chủ. Vui lòng thử lại sau.';
            }

            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };


    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (error && !service) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
                    <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                        <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                    </div>
                    <h1 className="text-xl font-bold text-gray-900 mb-2">Không thể tải trang đặt lịch</h1>
                    <p className="text-red-600 mb-6">{error}</p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <button
                            onClick={() => navigate(-1)}
                            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            Quay lại
                        </button>
                        <button
                            onClick={() => navigate('/services')}
                            className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
                        >
                            Xem dịch vụ
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Service Info */}
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h1 className="text-2xl font-bold text-gray-900 mb-4">Thông tin dịch vụ</h1>

                        <img
                            src={service.imageUrl || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop'}
                            alt={service.name}
                            className="w-full h-64 object-cover rounded-lg mb-4"
                            loading="lazy"
                        />

                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                                    {service.category}
                                </span>
                                <div className="flex items-center">
                                    {service.averageRating && service.averageRating > 0 ? (
                                        <>
                                            <svg className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                                                <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                                            </svg>
                                            <span className="ml-1 text-sm text-gray-600">{service.averageRating.toFixed(1)}</span>
                                        </>
                                    ) : (
                                        <span className="ml-1 text-sm text-gray-500">Chưa có đánh giá</span>
                                    )}
                                </div>
                            </div>

                            <h2 className="text-xl font-semibold text-gray-900">{service.name}</h2>
                            <p className="text-gray-600">{service.description}</p>

                            <div className="flex items-center justify-between">
                                <div className="text-sm text-gray-500">
                                    <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Theo dự án
                                </div>
                                <div className="text-2xl font-bold text-primary-600">
                                    {service.price.toLocaleString('vi-VN')}đ
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Booking Form */}
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h1 className="text-2xl font-bold text-gray-900 mb-6">Đặt dịch vụ</h1>

                        {success && (
                            <div className="mb-6 rounded-md bg-green-50 p-4">
                                <div className="text-sm text-green-700">{success}</div>
                            </div>
                        )}

                        {error && (
                            <div className="mb-6 rounded-md bg-red-50 p-4">
                                <div className="text-sm text-red-700">{error}</div>
                            </div>
                        )}

                        {/* Customer Info Display */}
                        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                            <h3 className="text-lg font-semibold text-gray-900 mb-3">Thông tin khách hàng</h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Họ và tên:</span>
                                    <span className="font-medium text-gray-900">{user?.fullname}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Email:</span>
                                    <span className="font-medium text-gray-900">{user?.email}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Số điện thoại:</span>
                                    <span className="font-medium text-gray-900">{user?.phoneNumber}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Vai trò:</span>
                                    <span className="font-medium text-gray-900">
                                        {useAuthStore.getState().getRoleName()}
                                    </span>
                                </div>
                            </div>

                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                                    Địa chỉ thực hiện dịch vụ *
                                </label>
                                <textarea
                                    name="address"
                                    id="address"
                                    rows={3}
                                    value={formData.address}
                                    onChange={handleChange}
                                    className="block w-full px-4 py-3 text-lg border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:outline-none transition-colors duration-200"
                                    placeholder="Nhập địa chỉ chi tiết nơi thực hiện dịch vụ..."
                                    required
                                />
                                <p className="mt-1 text-sm text-gray-500">
                                    Ví dụ: 123 Đường ABC, Phường XYZ, Quận 1, TP.HCM
                                </p>
                            </div>

                            <div>
                                <label htmlFor="hireAt" className="block text-sm font-medium text-gray-700 mb-2">
                                    Thời gian thực hiện dịch vụ *
                                </label>
                                <input
                                    type="datetime-local"
                                    name="hireAt"
                                    id="hireAt"
                                    value={formData.hireAt}
                                    onChange={handleChange}
                                    min={new Date().toISOString().slice(0, 16)}
                                    className="block w-full px-4 py-3 text-lg border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:outline-none transition-colors duration-200"
                                    required
                                />
                                <p className="mt-1 text-sm text-gray-500">
                                    Chọn ngày và giờ phù hợp để thực hiện dịch vụ. Thời gian phải là trong tương lai.
                                </p>
                            </div>

                            <div>
                                <label htmlFor="note" className="block text-sm font-medium text-gray-700 mb-2">
                                    Ghi chú thêm
                                </label>
                                <textarea
                                    name="note"
                                    id="note"
                                    rows={3}
                                    value={formData.note}
                                    onChange={handleChange}
                                    className="block w-full px-4 py-3 text-lg border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:outline-none transition-colors duration-200"
                                    placeholder="Nhập ghi chú thêm về yêu cầu dịch vụ (không bắt buộc)..."
                                />
                            </div>

                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h3 className="text-lg font-semibold text-gray-900 mb-3">Tóm tắt đơn hàng</h3>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">Dịch vụ:</span>
                                        <span className="font-medium text-gray-900">{service.name}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">Thời gian:</span>
                                        <span className="font-medium text-gray-900">
                                            {formData.hireAt ? new Date(formData.hireAt).toLocaleString('vi-VN') : 'Chưa chọn'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">Địa chỉ:</span>
                                        <span className="font-medium text-gray-900 text-right max-w-xs truncate">
                                            {formData.address || 'Chưa nhập'}
                                        </span>
                                    </div>
                                    <hr className="my-2" />
                                    <div className="flex justify-between items-center">
                                        <span className="text-lg font-semibold text-gray-900">Tổng cộng:</span>
                                        <span className="text-2xl font-bold text-primary-600">
                                            {service.price.toLocaleString('vi-VN')}đ
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting || !formData.address.trim() || !formData.hireAt}
                                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-4 px-6 text-lg rounded-xl transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 shadow-lg hover:shadow-xl disabled:transform-none"
                            >
                                {isSubmitting ? (
                                    <div className="flex items-center justify-center">
                                        <LoadingSpinner size="sm" />
                                        <span className="ml-2">Đang xử lý...</span>
                                    </div>
                                ) : (
                                    'Đặt dịch vụ'
                                )}
                            </button>

                            {(!formData.address.trim() || !formData.hireAt) && (
                                <p className="text-sm text-gray-500 text-center mt-2">
                                    Vui lòng điền đầy đủ thông tin bắt buộc để tiếp tục
                                </p>
                            )}
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Booking;
