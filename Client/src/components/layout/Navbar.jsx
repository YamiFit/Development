import { FiBell, FiMoon, FiSun, FiMenu } from "react-icons/fi";
import { useState } from "react";
import { openAddMeal, toggleSidebar } from "../store/uiSlice";
import { useDispatch } from "react-redux";

export default function Navbar() {
  const [dark, setDark] = useState(false);

  const dispatch = useDispatch();

  return (
    <div className="h-16 bg-white border-b flex items-center justify-between px-6 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        {/* Hamburger Menu */}
        <button
          onClick={() => dispatch(toggleSidebar())}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <FiMenu className="text-xl text-gray-700" />
        </button>

        {/* Search */}
        <input
          type="text"
          placeholder="Search meals, recipes..."
          className="w-80 px-4 py-2 rounded-full border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
        />
      </div>

      {/* Icons */}
      <div className="flex items-center gap-4 text-xl">
        <FiBell className="cursor-pointer hover:text-green-600 transition-colors" />
        {dark ? (
          <FiSun
            onClick={() => setDark(false)}
            className="cursor-pointer hover:text-yellow-600 transition-colors"
          />
        ) : (
          <FiMoon
            onClick={() => setDark(true)}
            className="cursor-pointer hover:text-blue-600 transition-colors"
          />
        )}
        <button
          onClick={() => dispatch(openAddMeal())}
          className="bg-green-600 text-white px-5 py-2.5 rounded-lg text-sm hover:bg-green-700 transition-colors font-medium shadow-sm"
        >
          + Add Meal
        </button>
      </div>
    </div>
  );
}
