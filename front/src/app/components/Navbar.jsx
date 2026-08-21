import { useAuth } from "../context/AuthContext.jsx";
import { useNavigate } from "react-router";
import { Button } from "./ui/button";
import { Calendar, LogOut, User } from "lucide-react";

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const getDashboardPath = () => {
    if (!user) return "/login";
    return `/${user.role}`;
  };

  return (
    <nav className="border-b bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-2">
            <Calendar className="h-6 w-6 text-blue-600" />
            <span className="font-semibold text-xl">MediCitas</span>
          </div>

          {user && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4" />
                <span className="font-medium">{user.name}</span>
                <span className="text-gray-500">
                  ({user.role === "PATIENT" ? "Paciente" : user.role === "DOCTOR" ? "Doctor" : "ADMIN"})
                </span>
              </div>

              <Button variant="outline" size="sm" onClick={() => navigate(getDashboardPath())}>
                Dashboard
              </Button>

              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Salir
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}