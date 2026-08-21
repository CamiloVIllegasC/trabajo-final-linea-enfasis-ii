import { useAuth } from "../context/AuthContext.jsx";
import { Navbar } from "../components/Navbar.jsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Calendar, Clock, User } from "lucide-react";
import { appointmentsAPI } from "../services/api.js";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { formatoAMPM } from "../libs/formatoHora.js";


export function DoctorDashboard() {
  const { user } = useAuth();
  const [citas, setCitas] = useState([]);

  // Cargar citas doctor
  useEffect(() => {
    const loadCitas = async () => {
      try {
        const data = await appointmentsAPI.getAppointmentsDoctor(user?.doctorID);
        setCitas(data || []);
      } catch (err) {
        toast.error("Error al cargar tus citas");
        console.error('Error fetching appointments', err);
        setCitas([]);
      }
    };
    loadCitas();
  }, []);


  // Filtrar citas del doctor actual

  const upcomingAppointments = citas.filter(
    (apt) =>
      apt.status === "PENDING" &&
      new Date(apt.appointment_date) >= new Date(new Date().setHours(0, 0, 0, 0))
  );


  const todayAppointments = upcomingAppointments.filter(
    (apt) =>
      new Date(apt.appointment_date).toDateString() === new Date().toDateString()
  );

  const pastAppointments = citas.filter(
    (apt) => apt.status === "COMPLETED" || apt.status === "CANCELLED"
  );

  const completedAppointments = citas.filter(
    (apt) => apt.status === "COMPLETED"
  );

  

  const AppointmentCard = ({ appointment }) => (
    <Card className="mb-4">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="bg-blue-100 p-2 rounded-full">
              <User className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold">{appointment.patient_name}</h3>
              <p className="text-sm text-gray-600">Paciente</p>
            </div>
          </div>
          <Badge className={appointment.status === "PENDING" ? "bg-green-500" : "bg-gray-500"}>
            {appointment.status === "PENDING" ? "Programada" : appointment.status === "COMPLETED" ? "Completada" : "Cancelada"}
          </Badge>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span>
              {new Date(appointment.appointment_date).toLocaleDateString("es-ES", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-gray-400" />
            <span>{ formatoAMPM(appointment.appointment_time)}</span>
          </div>
        </div>

        {appointment.notes && (
          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              <strong>Notas del paciente:</strong> {appointment.reason}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Panel del Doctor</h1>
          <p className="text-gray-600 mt-2">Bienvenido, {user?.name}</p>
          {user?.specialty && (
            <p className="text-sm text-gray-500">Especialidad: {user.specialty}</p>
          )}
        </div>

        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">{todayAppointments.length}</CardTitle>
              <CardDescription>Citas Hoy</CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">{upcomingAppointments.length}</CardTitle>
              <CardDescription>Próximas Citas</CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">{completedAppointments.length}</CardTitle>
              <CardDescription>Citas Completadas</CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Lista de citas */}
        <Card>
          <CardHeader>
            <CardTitle>Mis Citas</CardTitle>
            <CardDescription>Gestiona tus consultas programadas</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="today" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="today">Hoy ({todayAppointments.length})</TabsTrigger>
                <TabsTrigger value="upcoming">
                  Próximas ({upcomingAppointments.length})
                </TabsTrigger>
                <TabsTrigger value="past">Historial ({pastAppointments.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="today">
                {todayAppointments.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No tienes citas programadas para hoy</p>
                  </div>
                ) : (
                  todayAppointments.map((appointment) => (
                    <AppointmentCard key={appointment.id} appointment={appointment} />
                  ))
                )}
              </TabsContent>

              <TabsContent value="upcoming">
                {upcomingAppointments.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No tienes citas próximas programadas</p>
                  </div>
                ) : (
                  upcomingAppointments.map((appointment) => (
                    <AppointmentCard key={appointment.id} appointment={appointment} />
                  ))
                )}
              </TabsContent>

              <TabsContent value="past">
                {pastAppointments.length === 0 ? (
                  <div className="text-center py-12">
                    <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No tienes citas en el historial</p>
                  </div>
                ) : (
                  pastAppointments.map((appointment) => (
                    <AppointmentCard key={appointment.id} appointment={appointment} />
                  ))
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}