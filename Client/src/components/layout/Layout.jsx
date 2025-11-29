import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import { useSelector } from "react-redux";

export default function Layout({ children }) {
  const sidebarOpen = useSelector((state) => state.ui.sidebarOpen);

  return (
    <div className="flex min-h-screen bg-[#f5f9f4]">
      {/* Sidebar */}
      <Sidebar />

      {/* Content */}
      <div
        className={`flex-1 transition-all duration-300 ${
          sidebarOpen ? "lg:ml-64" : "ml-0"
        }`}
      >
        <Navbar />
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
