import { createBrowserRouter, Navigate } from "react-router";
import { Login } from "./pages/Login.jsx";
import { Register } from "./pages/Register.jsx";
import { PatientDashboard } from "./pages/PatientDashboard.jsx";
import { DoctorDashboard } from "./pages/DoctorDashboard.jsx";
import { AdminDashboard } from "./pages/AdminDashboard.jsx";
import { DoctorList } from "./pages/DoctorList.jsx";
import { CreateAppointment } from "./pages/CreateAppointment.jsx";
import { MyAppointments } from "./pages/MyAppointments.jsx";
import { ProtectedRoute } from "./components/ProtectedRoute.jsx";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/login" replace />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/register",
    element: <Register />,
  },
  {
    path: "/patient",
    element: <ProtectedRoute allowedRoles={["PATIENT"]} />,
    children: [
      {
        index: true,
        element: <PatientDashboard />,
      },
      {
        path: "doctors",
        element: <DoctorList />,
      },
      {
        path: "create-appointment",
        element: <CreateAppointment />,
      },
      {
        path: "appointments",
        element: <MyAppointments />,
      },
    ],
  },
  {
    path: "/doctor",
    element: <ProtectedRoute allowedRoles={["DOCTOR"]} />,
    children: [
      {
        index: true,
        element: <DoctorDashboard />,
      },
    ],
  },
  {
    path: "/admin",
    element: <ProtectedRoute allowedRoles={["ADMIN"]} />,
    children: [
      {
        index: true,
        element: <AdminDashboard />,
      },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/login" replace />,
  },
]);