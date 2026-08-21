import { useState } from "react";
import { useNavigate, useLocation } from "react-router";
import { Navbar } from "../components/Navbar.jsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Calendar } from "../components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { appointmentsAPI, doctorsAPI } from "../services/api";
import { useEffect } from "react";
import { toast } from "sonner";

export function CreateAppointment() {
  const navigate = useNavigate();
  const location = useLocation();
  const preselectedDoctor = location.state?.doctor;

  const [selectedDoctor, setSelectedDoctor] = useState(
    preselectedDoctor ? String(preselectedDoctor.id) : ""
  );
  const [selectedDate, setSelectedDate] = useState();
  const [selectedTime, setSelectedTime] = useState("");
  const [notes, setNotes] = useState("");
  const [availableSlots, setAvailableSlots] = useState([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setIsDatePickerOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedDoctor || !selectedDate || !selectedTime) {
      toast.error("Por favor completa todos los campos requeridos");
      return;
    }

    try {
      const appointmentDate = format(selectedDate, "yyyy-MM-dd");
      // Asegurar formato HH:MM:SS
      const appointmentTime = selectedTime && selectedTime.split(":").length === 2 ? `${selectedTime}:00` : selectedTime;

      await appointmentsAPI.create({
        doctorId: Number(selectedDoctor),
        appointmentDate,
        appointmentTime,
        reason: notes || "",
      });

      toast.success("Cita agendada exitosamente");
      navigate("/patient/appointments");
    } catch (error) {
      toast.error("Error al agendar la cita");
      console.error(error);
    }
  };

  const selectedDoctorInfo = doctors.find((d) => d.id === Number(selectedDoctor));

  // Cargar doctores al montar
  useEffect(() => {
    const loadDoctors = async () => {
      try {
        const data = await doctorsAPI.getAll();
        setDoctors(data || []);
      } catch (err) {
        console.error('Error fetching doctors', err);
        setDoctors([]);
      }
    };
    loadDoctors();
  }, []);

  // Cargar disponibilidad cuando cambia doctor o fecha
  useEffect(() => {
    setSelectedTime("");
    setAvailableSlots([]);
    setIsLoadingSlots(false);

    if (!selectedDoctor || !selectedDate) return;

    const loadAvailability = async () => {
      setIsLoadingSlots(true);
      try {
        const dateStr = format(selectedDate, "yyyy-MM-dd");
        const data = await doctorsAPI.getAvailability(Number(selectedDoctor), dateStr);        
        setAvailableSlots(data.availableSlots || []);
      } catch (err) {
        toast.error("Error al cargar horarios disponibles");
        console.error('Error fetching availability', err);
        setAvailableSlots([]);
      } finally {
        setIsLoadingSlots(false);
      }
    };

    loadAvailability();
  }, [selectedDoctor, selectedDate]);
  

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Agendar Nueva Cita</h1>
          <p className="text-gray-600 mt-2">Completa el formulario para agendar tu cita médica</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Información de la Cita</CardTitle>
            <CardDescription>Selecciona el doctor, fecha y hora disponible</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Selección de doctor */}
              <div className="space-y-2">
                <Label>Doctor *</Label>
                <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un doctor" />
                  </SelectTrigger>
                  <SelectContent>
                    {doctors.map((doctor) => (
                      <SelectItem key={doctor.id} value={String(doctor.id)}>
                        {doctor.name} - {doctor.specialties?.join(", ") || "Sin especialidad"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedDoctorInfo && (
                  <div className="p-3 bg-blue-50 rounded-lg text-sm">
                    <p>
                      <strong>Email:</strong> {selectedDoctorInfo.email}
                    </p>
                    <p>
                      <strong>Teléfono:</strong> {selectedDoctorInfo.telefono || "No disponible"}
                    </p>
                  </div>
                )}
              </div>

              {/* Selección de fecha */}
              <div className="space-y-2">
                <Label>Fecha *</Label>
                <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? (
                        format(selectedDate, "PPP", { locale: es })
                      ) : (
                        <span>Selecciona una fecha</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={handleDateSelect}
                      disabled={(date) => {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        return date < today;
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Selección de hora */}
              {selectedDate && (
                <div className="space-y-2">
                  <Label>Hora Disponible *</Label>
                  {isLoadingSlots ? (
                    <div className="flex items-center justify-center py-8">
                      <p className="text-sm text-muted-foreground">Cargando horarios disponibles...</p>
                    </div>
                  ) : availableSlots.length > 0 ? (
                    <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                      {availableSlots.map((time) => (
                        <Button
                          key={time}
                          type="button"
                          variant={selectedTime === time ? "default" : "outline"}
                          onClick={() => setSelectedTime(time)}
                          className="w-full"
                        >
                          {time}
                        </Button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        No hay horarios disponibles para la fecha seleccionada. Intenta con otra fecha.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Notas adicionales */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notas adicionales (opcional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Describe brevemente el motivo de la consulta o cualquier información relevante..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="flex gap-4">
                <Button type="button" variant="outline" onClick={() => navigate(-1)} className="flex-1">
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1">
                  Confirmar Cita
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}