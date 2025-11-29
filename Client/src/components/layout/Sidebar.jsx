import { NavLink, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { closeSidebar } from "../store/uiSlice";
import { useState, useEffect } from "react";
import { supabase } from "@/supabaseClient";
import {
  FiHome,
  FiList,
  FiTrendingUp,
  FiBarChart2,
  FiMessageCircle,
  FiShoppingBag,
  FiSettings,
  FiX,
} from "react-icons/fi";

const menu = [
  { to: "/home", label: "Home", icon: <FiHome /> },
  { to: "/meals", label: "Meals", icon: <FiList /> },
  { to: "/tracker", label: "Tracker", icon: <FiTrendingUp /> },
  { to: "/progress", label: "Progress", icon: <FiBarChart2 /> },
  { to: "/subscriptions", label: "Subscriptions", icon: <FiShoppingBag /> },
  { to: "/coaching", label: "Coaching", icon: <FiMessageCircle /> },
  { to: "/orders", label: "Orders", icon: <FiShoppingBag /> },
  { to: "/settings", label: "Settings", icon: <FiSettings /> },
];

export default function Sidebar() {
  const sidebarOpen = useSelector((state) => state.ui.sidebarOpen);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Get current user
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Get profile data
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('id', user.id)
          .single();
        
        setUser({
          name: profile?.full_name || 'User',
          email: user.email
        });
      }
    };
    getCurrentUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <>
      {/* Overlay for mobile/tablet */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => dispatch(closeSidebar())}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 h-screen bg-white shadow-xl flex flex-col z-40 border-r transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } w-64`}
      >
        <div className="p-6 text-2xl font-bold border-b flex items-center justify-between">
          <span className="text-yamifit-accent">
            Yami<span className="text-yamifit-primary">Fit</span>
          </span>
          <button
            onClick={() => dispatch(closeSidebar())}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <FiX className="text-gray-600" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          {menu.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() =>
                window.innerWidth < 1024 && dispatch(closeSidebar())
              }
              className={({ isActive }) =>
                `flex items-center gap-3 px-6 py-3.5 text-gray-700 hover:bg-green-50 transition-all relative ${
                  isActive
                    ? "bg-green-50 text-green-700 font-semibold before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-green-600"
                    : ""
                }`
              }
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-6 border-t bg-gray-50">
          <p className="text-sm font-medium text-gray-700 mb-1">
            {user?.name || 'Loading...'}
          </p>
          <p className="text-xs text-gray-500 mb-3">
            {user?.email || ''}
          </p>
          <button 
            onClick={handleLogout}
            className="w-full py-2.5 px-4 text-sm text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors font-medium"
          >
            Logout
          </button>
        </div>
      </div>
    </>
  );
}
