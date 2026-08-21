import { useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext.jsx";
import { Navbar } from "../components/Navbar.jsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Calendar, Users, Clock, Plus } from "lucide-react";
import { appointmentsAPI } from "../services/api.js";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { formatoAMPM } from "../libs/formatoHora.js";


export function PatientDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [citas, setCitas] = useState([]);

  // Cargar citas paciente
  useEffect(() => {
    const loadCitas = async () => {
      try {
        const data = await appointmentsAPI.getMyAppointments();
        setCitas(data || []);
      } catch (err) {
        toast.error("Error al cargar tus citas");
        console.error('Error fetching appointments', err);
        setCitas([]);
      }
    };
    loadCitas();
  }, []);

  // Filtrar citas del usuario actual  
  const upcomingAppointments = citas.filter(
    (apt) => apt.status === "PENDING"
  );



  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Panel de Paciente</h1>
          <p className="text-gray-600 mt-2">Bienvenido, {user?.name}</p>
        </div>

        {/* Acciones rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/patient/doctors")}>
            <CardHeader>
              <Users className="h-8 w-8 text-blue-600 mb-2" />
              <CardTitle>Ver Doctores</CardTitle>
              <CardDescription>Busca doctores por especialidad</CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/patient/create-appointment")}>
            <CardHeader>
              <Plus className="h-8 w-8 text-green-600 mb-2" />
              <CardTitle>Nueva Cita</CardTitle>
              <CardDescription>Agenda una cita médica</CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/patient/appointments")}>
            <CardHeader>
              <Calendar className="h-8 w-8 text-purple-600 mb-2" />
              <CardTitle>Mis Citas</CardTitle>
              <CardDescription>Ver y gestionar tus citas</CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Próximas citas */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Próximas Citas</CardTitle>
                <CardDescription>Tus citas programadas más recientes</CardDescription>
              </div>
              <Button variant="outline" onClick={() => navigate("/patient/appointments")}>
                Ver todas
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {upcomingAppointments.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">No tienes citas programadas</p>
                <Button onClick={() => navigate("/patient/create-appointment")}>
                  Agendar una cita
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingAppointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="bg-blue-100 p-3 rounded-full">
                        <Clock className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{appointment.doctorName}</h3>
                        <p className="text-sm text-gray-600">{appointment.specialty}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(appointment.appointment_date).toLocaleDateString("es-ES", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}{" "}
                          - { formatoAMPM(appointment.appointment_time)}
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => navigate("/patient/appointments")}>
                      Ver detalles
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}