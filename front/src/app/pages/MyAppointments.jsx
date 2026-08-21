import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext.jsx";
import { Navbar } from "../components/Navbar.jsx";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";
import { Calendar, Clock, X, Plus } from "lucide-react";
import { toast } from "sonner";
import { appointmentsAPI } from "../services/api.js";
import { formatoAMPM } from "../libs/formatoHora.js";

export function MyAppointments() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [userAppointments, setUserAppointments] = useState([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Cargar citas paciente
  useEffect(() => {
    const loadCitas = async () => {
      try {
        const data = await appointmentsAPI.getMyAppointments();
        setUserAppointments(data || []);
      } catch (err) {
        console.error('Error fetching appointments', err);
        setUserAppointments([]);
      }
    };
    loadCitas();
  }, [refreshTrigger]); // Recargar cuando se dispara el refresh

  
  const scheduledAppointments = userAppointments.filter((apt) => apt.status === "PENDING");
  const pastAppointments = userAppointments.filter(
    (apt) => apt.status === "COMPLETED" || apt.status === "CANCELLED"
  );

  const handleCancelClick = (appointmentId) => {
    setSelectedAppointment(appointmentId);
    setCancelDialogOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!selectedAppointment) return;

    try {
      await appointmentsAPI.cancel(selectedAppointment);
      toast.success("Cita cancelada exitosamente");
      setCancelDialogOpen(false);
      setSelectedAppointment(null);
      setRefreshTrigger(prev => prev + 1); // Dispara la recarga de citas
    } catch (error) {
      toast.error("Error al cancelar la cita");
      console.error(error);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "PENDING":
        return <Badge className="bg-green-500">Programada</Badge>;
      case "CANCELLED":
        return <Badge variant="destructive">Cancelada</Badge>;
      case "COMPLETED":
        return <Badge variant="secondary">Completada</Badge>;
      default:
        return null;
    }
  };

  const AppointmentCard = ({ appointment, showCancel }) => (
    <Card className="mb-4">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-lg">{appointment.doctor_name}</h3>
              {getStatusBadge(appointment.status)}
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
                  <strong>Notas:</strong> {appointment.notes}
                </p>
              </div>
            )}
          </div>

          {showCancel && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleCancelClick(appointment.id)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <X className="h-4 w-4 mr-1" />
              Cancelar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Mis Citas</h1>
            <p className="text-gray-600 mt-2">Gestiona tus citas médicas</p>
          </div>
          <Button onClick={() => navigate("/patient/create-appointment")}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Cita
          </Button>
        </div>

        <Tabs defaultValue="scheduled" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="scheduled">
              Programadas ({scheduledAppointments.length})
            </TabsTrigger>
            <TabsTrigger value="past">Historial ({pastAppointments.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="scheduled">
            {scheduledAppointments.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">No tienes citas programadas</p>
                  <Button onClick={() => navigate("/patient/create-appointment")}>
                    Agendar una cita
                  </Button>
                </CardContent>
              </Card>
            ) : (
              scheduledAppointments.map((appointment) => (
                <AppointmentCard
                  key={appointment.id}
                  appointment={appointment}
                  showCancel={true}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="past">
            {pastAppointments.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No tienes citas en el historial</p>
                </CardContent>
              </Card>
            ) : (
              pastAppointments.map((appointment) => (
                <AppointmentCard
                  key={appointment.id}
                  appointment={appointment}
                  showCancel={false}
                />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialog de confirmación de cancelación */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cancelar esta cita?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La cita será cancelada y el horario quedará
              disponible nuevamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No, mantener</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmCancel} className="bg-red-600 hover:bg-red-700">
              Sí, cancelar cita
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}