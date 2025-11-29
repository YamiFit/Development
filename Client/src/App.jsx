import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/context/LanguageContext";
import { Provider } from "react-redux";
import store from "@/components/store";
import LandingPage from "./pages/Home";
import DashboardHome from "@/components/pages/Home";
import Meals from "@/components/pages/Meals";
import Tracker from "@/components/pages/Tracker";
import Progress from "@/components/pages/Progress";
import Subscriptions from "@/components/pages/Subscriptions";
import Coaching from "@/components/pages/Coaching";
import Orders from "@/components/pages/Orders";
import Settings from "@/components/pages/Settings";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import { supabase } from "./supabaseClient";


const App = () => {
  async function loadUsers() {
  const { data, error } = await supabase.from("users").select("*");
  console.log(data);
}
  return (

    <LanguageProvider>
      <Provider store={store}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/home" element={<DashboardHome />} />
              <Route path="/meals" element={<Meals />} />
              <Route path="/tracker" element={<Tracker />} />
              <Route path="/progress" element={<Progress />} />
              <Route path="/subscriptions" element={<Subscriptions />} />
              <Route path="/coaching" element={<Coaching />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </Provider>
    </LanguageProvider>
  );
};

export default App;





