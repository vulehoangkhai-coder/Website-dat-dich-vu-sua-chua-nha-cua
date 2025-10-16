import { Outlet } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import Navbar from './Navbar';
import 'react-toastify/dist/ReactToastify.css';

const Layout = () => {
    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <main className="flex-1">
                <Outlet />
            </main>
            <ToastContainer
                position="top-right"
                autoClose={4000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="light"
            />
        </div>
    );
};

export default Layout;
