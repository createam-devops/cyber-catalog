"use client";

import AdminDashboard from "@/components/admin/AdminDashboard";
import AdminOnlyRoute from "@/components/AdminOnlyRoute";
import { AuthProvider } from "@/contexts/AuthContext";

export default function AdminPageClient() {
  return (
    <AuthProvider>
      <AdminOnlyRoute>
        <AdminDashboard />
      </AdminOnlyRoute>
    </AuthProvider>
  );
}
