import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/lib/auth";
import ProtectedRoute from "@/components/ProtectedRoute";
import Login from "@/pages/auth/Login";
import Home from "@/pages/home/Home";
import StudentList from "@/pages/students/StudentList";
import StudentProfile from "@/pages/students/StudentProfile";
import AddStudent from "@/pages/students/AddStudent";
import RoomList from "@/pages/rooms/RoomList";
import RoomDetail from "@/pages/rooms/RoomDetail";
import StaffList from "@/pages/staff/StaffList";
import StaffProfile from "@/pages/staff/StaffProfile";
import Schedules from "@/pages/schedule/Schedules";
import Paperwork from "@/pages/paperwork/Paperwork";
import Reporting from "@/pages/reporting/Reporting";
import ParentPortal from "@/pages/parent/ParentPortal";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Admin / Staff routes */}
        <Route path="/home" element={<ProtectedRoute allowedRoles={["admin", "staff"]}><Home /></ProtectedRoute>} />
        <Route path="/students" element={<ProtectedRoute allowedRoles={["admin", "staff"]}><StudentList /></ProtectedRoute>} />
        <Route path="/students/add" element={<ProtectedRoute allowedRoles={["admin"]}><AddStudent /></ProtectedRoute>} />
        <Route path="/students/:id" element={<ProtectedRoute allowedRoles={["admin", "staff"]}><StudentProfile /></ProtectedRoute>} />
        <Route path="/rooms" element={<ProtectedRoute allowedRoles={["admin", "staff"]}><RoomList /></ProtectedRoute>} />
        <Route path="/rooms/:id" element={<ProtectedRoute allowedRoles={["admin", "staff"]}><RoomDetail /></ProtectedRoute>} />
        <Route path="/staff" element={<ProtectedRoute allowedRoles={["admin"]}><StaffList /></ProtectedRoute>} />
        <Route path="/staff/:id" element={<ProtectedRoute allowedRoles={["admin"]}><StaffProfile /></ProtectedRoute>} />
        <Route path="/schedule" element={<ProtectedRoute allowedRoles={["admin", "staff"]}><Schedules /></ProtectedRoute>} />
        <Route path="/paperwork" element={<ProtectedRoute allowedRoles={["admin"]}><Paperwork /></ProtectedRoute>} />
        <Route path="/reporting" element={<ProtectedRoute allowedRoles={["admin"]}><Reporting /></ProtectedRoute>} />
        <Route path="/reporting/attendance" element={<ProtectedRoute allowedRoles={["admin"]}><Reporting /></ProtectedRoute>} />

        {/* Parent route */}
        <Route path="/parent" element={<ProtectedRoute allowedRoles={["parent"]}><ParentPortal /></ProtectedRoute>} />

        {/* Catch-all */}
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </AuthProvider>
  );
}
