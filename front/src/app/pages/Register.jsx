import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { useAuth } from "../context/AuthContext.jsx";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Calendar } from "lucide-react";
import { toast } from "sonner";
import { authAPI } from "../services/api.js";

export function Register() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "PATIENT",
    telefono: "",
  });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await authAPI.register(formData);    
      const redirectPath = '/login';
      navigate(redirectPath);
      toast.success("Cuenta creada exitosamente, ya puedes iniciar sesión");
    } catch (error) {
      toast.error("Error al crear la cuenta. Verifica tus datos.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-600 p-3 rounded-full">
              <Calendar className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl">Crear Cuenta</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre Completo</Label>
              <Input
                id="name"
                placeholder="Juan Pérez"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="555-0000"
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </div>

            <Input
              id="role"
              type="hidden"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: 'PATIENT' })}
            />

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creando cuenta..." : "Registrarse"}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm">
            <span className="text-gray-600">¿Ya tienes cuenta? </span>
            <Link to="/login" className="text-blue-600 hover:underline font-medium">
              Inicia sesión
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}