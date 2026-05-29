import { BrowserRouter, Routes, Route } from "react-router-dom";

import Index from "@/pages/Index";
import AdminGuard from "@/routes/AdminGuard";
import AdminLogin from "@/pages/admin/AdminLogin";
import AdminHome from "@/pages/admin/AdminHome";
import AdminLayout from "@/layouts/AdminLayout";
import AdminUsers from "@/pages/admin/AdminUsers";
import DataDashboard from "@/pages/admin/DataDashboard";
import UserLogin from "./pages/UserLogin";
import NotFound from "./pages/NotFound";
import AuthCallback from "./pages/AuthCallback";
import AdminReviews from "@/pages/admin/AdminReviews";

export default function App() {
  return (
   <BrowserRouter>
  <Routes>
    <Route path="/" element={<Index />} />

    <Route path="/login" element={<UserLogin />} />
    <Route path="/auth/callback" element={<AuthCallback />} />

    <Route path="/admin/login" element={<AdminLogin />} />

    <Route element={<AdminGuard />}>
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminHome />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="data-dashboard" element={<DataDashboard />} />
        <Route path="reviews" element={<AdminReviews />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Route>
  </Routes>
</BrowserRouter>
  );
}