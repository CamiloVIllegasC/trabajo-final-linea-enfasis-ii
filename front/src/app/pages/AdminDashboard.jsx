import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { Navbar } from "../components/Navbar.jsx";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { Badge } from "../components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  UserPlus,
  Calendar,
  Trash2,
  Filter,
  Plus,
  Stethoscope,
} from "lucide-react";
import { adminAPI, doctorsAPI, appointmentsAPI } from "../services/api.js";
import { toast } from "sonner";
import { formatoAMPM } from "../libs/formatoHora.js";

export function AdminDashboard() {
  const { user } = useAuth();
  const [doctors, setDoctors] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  // ventanas modales
  const [dialogOpen, setDialogOpen] = useState(false);
  const [specialtyDialogOpen, setSpecialtyDialogOpen] = useState(false);
  const [assignSpecialtyDialogOpen, setAssignSpecialtyDialogOpen] =
    useState(false);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);

  const [selectedDoctorFilter, setSelectedDoctorFilter] = useState("all");

  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    role: "PATIENT",
    specialty: "",
    telefono: "",
  });
  const [newSpecialty, setNewSpecialty] = useState({
    name: "",
    description: "",
  });
  const [assignSpecialtyData, setAssignSpecialtyData] = useState({
    doctorId: "",
    specialtyId: "",
  });
  const [newSchedule, setNewSchedule] = useState({
    doctorId: "",
    dayOfWeek: "MON",
    startTime: "09:00",
    endTime: "17:00",
  });

  const [dashboardData, setDashboardData] = useState({
    totalUsers: 0,
    totalAdmins: 0,
    totalDoctors: 0,
    totalPatients: 0,
    totalAppointments: 0,
  });

  // Cargar doctores, especialidades y usuarios del backend en paralelo
  useEffect(() => {
    const load = async () => {
      try {
        const [d, s, dashboard, users, appts] = await Promise.all([
          doctorsAPI.getAll(),
          adminAPI.getAllSpecialties(),
          adminAPI.getDashboardData(),
          adminAPI.getAllUsers(),
          appointmentsAPI.getAllAppointments(),
        ]);
        setDoctors(d || []);
        setSpecialties(s || []);
        setAllUsers(users || []);
        setAppointments(appts || []);
        setDashboardData(
          dashboard || {
            totalUsers: 0,
            totalAdmins: 0,
            totalDoctors: 0,
            totalPatients: 0,
            totalAppointments: 0,
          },
        );
      } catch (error) {
        toast.error("Error al cargar datos");
        console.error(error);
      }
    };
    load();
  }, []);

  const patients = allUsers.filter((u) => u.role === "PATIENT");
  const admins = allUsers.filter((u) => u.role === "ADMIN");

  // Filtrar citas por doctor
  const filteredAppointments =
    selectedDoctorFilter === "all"
      ? appointments
      : appointments.filter(
          (apt) => String(apt.doctor_id) === selectedDoctorFilter,
        );

  const handleCreateUser = async (e) => {
    e.preventDefault();

    try {
      await adminAPI.createUser(newUser);
      toast.success("Usuario creado exitosamente");
      setDialogOpen(false);
      // Refrescar usuarios, doctores y dashboard
      try {
        const [d, users, dashboard] = await Promise.all([
          doctorsAPI.getAll(),
          adminAPI.getAllUsers(),
          adminAPI.getDashboardData(),
        ]);
        setDoctors(d || []);
        setAllUsers(users || []);
        setDashboardData(
          dashboard || {
            totalUsers: 0,
            totalAdmins: 0,
            totalDoctors: 0,
            totalPatients: 0,
            totalAppointments: 0,
          },
        );
      } catch (err) {
        console.error("Error refreshing data after user creation", err);
      }

      setNewUser({
        name: "",
        email: "",
        password: "",
        role: "PATIENT",
        specialty: "",
        telefono: "",
      });
    } catch (error) {
      toast.error("Error al crear el usuario");
      console.error(error);
    }
  };

  const handleDeleteUser = async (userId) => {
    console.log(userId);
    try {
      await adminAPI.desactivarUsuario(userId);
      toast.success("Usuario eliminado exitosamente");
      try {
        const [d, users, dashboard] = await Promise.all([
          doctorsAPI.getAll(),
          adminAPI.getAllUsers(),
          adminAPI.getDashboardData(),
        ]);
        setDoctors(d || []);
        setAllUsers(users || []);
        setDashboardData(
          dashboard || {
            totalUsers: 0,
            totalAdmins: 0,
            totalDoctors: 0,
            totalPatients: 0,
            totalAppointments: 0,
          },
        );
      } catch (err) {
        console.error("Error refreshing data after user creation", err);
      }
    } catch (error) {
      toast.error("Error al eliminar el usuario");
      console.error(error);
    }
  };

  const handleCreateSpecialty = async (e) => {
    e.preventDefault();

    try {
      await adminAPI.createSpecialty(newSpecialty);

      toast.success("Especialidad creada exitosamente");
      setSpecialtyDialogOpen(false);
      // Refrescar especialidades
      try {
        const updatedSpecialties = await adminAPI.getAllSpecialties();
        setSpecialties(updatedSpecialties || []);
      } catch (err) {
        console.error("Error refreshing specialties after creation", err);
      }
      setNewSpecialty({
        name: "",
        description: "",
      });
    } catch (error) {
      toast.error("Error al crear la especialidad");
      console.error(error);
    }
  };

  const handleAssignSpecialty = async (e) => {
    e.preventDefault();

    if (!assignSpecialtyData.doctorId || !assignSpecialtyData.specialtyId) {
      toast.error("Por favor selecciona un doctor y una especialidad");
      return;
    }

    try {
      await adminAPI.assignSpecialtyToDoctor(
        assignSpecialtyData.doctorId,
        assignSpecialtyData.specialtyId,
      );
      toast.success("Especialidad asignada exitosamente");
      setAssignSpecialtyDialogOpen(false);
      setAssignSpecialtyData({
        doctorId: "",
        specialtyId: "",
      });

      try {
        const updatedUsers = await adminAPI.getAllUsers();
        setAllUsers(updatedUsers || []);
      } catch (err) {
        console.error("Error refreshing users after assignment", err);
      }
    } catch (error) {
      toast.error(error.message || "Error al asignar la especialidad");
      console.error(error);
    }
  };

  const handleAssignSchedule = async (e) => {
    e.preventDefault();

    if (
      !newSchedule.doctorId ||
      !newSchedule.dayOfWeek ||
      !newSchedule.startTime ||
      !newSchedule.endTime
    ) {
      toast.error("Por favor completa todos los campos del horario");
      return;
    }

    try {
      // El backend espera HH:MM:SS, los inputs de tipo time suelen devolver HH:MM
      const payload = {
        dayOfWeek: newSchedule.dayOfWeek,
        startTime: `${newSchedule.startTime}:00`,
        endTime: `${newSchedule.endTime}:00`,
      };

      await doctorsAPI.addSchedule(newSchedule.doctorId, payload);

      toast.success("Horario asignado exitosamente");
      setScheduleDialogOpen(false);
      setNewSchedule({
        doctorId: "",
        dayOfWeek: "MON",
        startTime: "09:00",
        endTime: "17:00",
      });
    } catch (error) {
      toast.error(error.message || "Error al asignar el horario");
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Panel de Administración
            </h1>
            <p className="text-gray-600 mt-2">Bienvenido, {user?.name}</p>
          </div>

          <div className="flex gap-2">
            <Dialog
              open={specialtyDialogOpen}
              onOpenChange={setSpecialtyDialogOpen}
            >
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Especialidad
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Crear Nueva Especialidad</DialogTitle>
                  <DialogDescription>
                    Completa el formulario para crear una nueva especialidad
                  </DialogDescription>
                </DialogHeader>

                <form
                  onSubmit={handleCreateSpecialty}
                  className="space-y-4 mt-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="specialtyName">
                      Nombre de la Especialidad
                    </Label>
                    <Input
                      id="specialtyName"
                      value={newSpecialty.name}
                      onChange={(e) =>
                        setNewSpecialty({
                          ...newSpecialty,
                          name: e.target.value,
                        })
                      }
                      placeholder="Ej: Oncología"
                      required
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setSpecialtyDialogOpen(false)}
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" className="flex-1">
                      Crear Especialidad
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>

            <Dialog
              open={scheduleDialogOpen}
              onOpenChange={setScheduleDialogOpen}
            >
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Calendar className="h-4 w-4 mr-2" />
                  Asignar Horario
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Asignar Horario a Doctor</DialogTitle>
                  <DialogDescription>
                    Define un día y rango horario para el doctor seleccionado
                  </DialogDescription>
                </DialogHeader>

                <form
                  onSubmit={handleAssignSchedule}
                  className="space-y-4 mt-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="scheduleDoctor">Doctor</Label>
                    <Select
                      value={newSchedule.doctorId}
                      onValueChange={(value) =>
                        setNewSchedule({ ...newSchedule, doctorId: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un doctor" />
                      </SelectTrigger>
                      <SelectContent>
                        {doctors.map((doctor) => (
                          <SelectItem key={doctor.id} value={String(doctor.id)}>
                            {doctor.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dayOfWeek">Día</Label>
                    <Select
                      value={newSchedule.dayOfWeek}
                      onValueChange={(value) =>
                        setNewSchedule({ ...newSchedule, dayOfWeek: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MON">Lunes</SelectItem>
                        <SelectItem value="TUE">Martes</SelectItem>
                        <SelectItem value="WED">Miércoles</SelectItem>
                        <SelectItem value="THU">Jueves</SelectItem>
                        <SelectItem value="FRI">Viernes</SelectItem>
                        <SelectItem value="SAT">Sábado</SelectItem>
                        <SelectItem value="SUN">Domingo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="startTime">Hora inicio</Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={newSchedule.startTime}
                      onChange={(e) =>
                        setNewSchedule({
                          ...newSchedule,
                          startTime: e.target.value,
                        })
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="endTime">Hora fin</Label>
                    <Input
                      id="endTime"
                      type="time"
                      value={newSchedule.endTime}
                      onChange={(e) =>
                        setNewSchedule({
                          ...newSchedule,
                          endTime: e.target.value,
                        })
                      }
                      required
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setScheduleDialogOpen(false)}
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" className="flex-1">
                      Asignar Horario
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>

            <Dialog
              open={assignSpecialtyDialogOpen}
              onOpenChange={setAssignSpecialtyDialogOpen}
            >
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Stethoscope className="h-4 w-4 mr-2" />
                  Asignar Especialidad
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Asignar Especialidad a Doctor</DialogTitle>
                  <DialogDescription>
                    Selecciona un doctor y la especialidad que deseas asignarle
                  </DialogDescription>
                </DialogHeader>

                <form
                  onSubmit={handleAssignSpecialty}
                  className="space-y-4 mt-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="doctorSelect">Doctor</Label>
                    <Select
                      value={assignSpecialtyData.doctorId}
                      onValueChange={(value) =>
                        setAssignSpecialtyData({
                          ...assignSpecialtyData,
                          doctorId: value,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un doctor" />
                      </SelectTrigger>
                      <SelectContent>
                        {doctors.map((doctor) => (
                          <SelectItem key={doctor.id} value={String(doctor.id)}>
                            {doctor.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="specialtySelect">Especialidad</Label>
                    <Select
                      value={assignSpecialtyData.specialtyId}
                      onValueChange={(value) =>
                        setAssignSpecialtyData({
                          ...assignSpecialtyData,
                          specialtyId: value,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una especialidad" />
                      </SelectTrigger>
                      <SelectContent>
                        {specialties.map((specialty) => (
                          <SelectItem
                            key={specialty.id}
                            value={String(specialty.id)}
                          >
                            {specialty.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setAssignSpecialtyDialogOpen(false)}
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" className="flex-1">
                      Asignar Especialidad
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Crear Usuario
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Crear Nuevo Usuario</DialogTitle>
                  <DialogDescription>
                    Completa el formulario para crear un nuevo usuario en el
                    sistema
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleCreateUser} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre Completo</Label>
                    <Input
                      id="name"
                      value={newUser.name}
                      onChange={(e) =>
                        setNewUser({ ...newUser, name: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newUser.email}
                      onChange={(e) =>
                        setNewUser({ ...newUser, email: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Teléfono</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={newUser.telefono}
                      onChange={(e) =>
                        setNewUser({ ...newUser, telefono: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Contraseña</Label>
                    <Input
                      id="password"
                      type="password"
                      value={newUser.password}
                      onChange={(e) =>
                        setNewUser({ ...newUser, password: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role">Rol</Label>
                    <Select
                      value={newUser.role}
                      onValueChange={(value) =>
                        setNewUser({ ...newUser, role: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PATIENT">Paciente</SelectItem>
                        <SelectItem value="DOCTOR">Doctor</SelectItem>
                        <SelectItem value="ADMIN">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setDialogOpen(false)}
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" className="flex-1">
                      Crear Usuario
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">
                {dashboardData.totalUsers}
              </CardTitle>
              <CardDescription>Total Usuarios</CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">
                {dashboardData.totalPatients}
              </CardTitle>
              <CardDescription>Pacientes</CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">
                {dashboardData.totalDoctors}
              </CardTitle>
              <CardDescription>Doctores</CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">
                {dashboardData.totalAppointments}
              </CardTitle>
              <CardDescription>Total Citas</CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Especialidades */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Especialidades Médicas</CardTitle>
            <CardDescription>
              Listado de especialidades disponibles en el sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {specialties.map((specialty) => (
                <Card key={specialty.id}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">
                      {specialty.name}
                    </CardTitle>
                    <CardDescription className="text-sm">
                      {specialty.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Gestión de usuarios */}
        <Card>
          <CardHeader>
            <CardTitle>Gestión de Usuarios</CardTitle>
            <CardDescription>
              Administra los usuarios del sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-6">
                <TabsTrigger value="all">
                  Todos ({dashboardData.totalUsers})
                </TabsTrigger>
                <TabsTrigger value="PATIENT">
                  Pacientes ({dashboardData.totalPatients})
                </TabsTrigger>
                <TabsTrigger value="DOCTOR">
                  Doctores ({dashboardData.totalDoctors})
                </TabsTrigger>
                <TabsTrigger value="ADMIN">
                  Admins ({dashboardData.totalAdmins})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all">
                <UserTable users={allUsers} onDelete={handleDeleteUser} />
              </TabsContent>

              <TabsContent value="PATIENT">
                <UserTable users={patients} onDelete={handleDeleteUser} />
              </TabsContent>

              <TabsContent value="DOCTOR">
                <UserTable
                  users={allUsers.filter((u) => u.role === "DOCTOR")}
                  onDelete={handleDeleteUser}
                />
              </TabsContent>

              <TabsContent value="ADMIN">
                <UserTable users={admins} onDelete={handleDeleteUser} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Citas del sistema */}
        <Card className="mt-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Todas las Citas</CardTitle>
                <CardDescription>
                  Visión general de las citas en el sistema
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <Select
                  value={selectedDoctorFilter}
                  onValueChange={setSelectedDoctorFilter}
                >
                  <SelectTrigger className="w-[250px]">
                    <SelectValue placeholder="Filtrar por doctor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los doctores</SelectItem>
                    {doctors.map((doctor) => (
                      <SelectItem key={doctor.id} value={String(doctor.id)}>
                        {doctor.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredAppointments.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">
                  No hay citas para el filtro seleccionado
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Doctor</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Hora</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAppointments.map((appointment) => (
                    <TableRow key={appointment.id}>
                      <TableCell className="font-medium">
                        {appointment.patient}
                      </TableCell>
                      <TableCell>{appointment.doctor}</TableCell>
                      <TableCell>
                        {new Date(appointment.date).toLocaleDateString("es-ES")}
                      </TableCell>
                      <TableCell>{formatoAMPM(appointment.time)}</TableCell>
                      <TableCell>
                        {appointment.status === "COMPLETED" && (
                          <Badge className="bg-green-500">Completada</Badge>
                        )}
                        {appointment.status === "CANCELLED" && (
                          <Badge variant="destructive">Cancelada</Badge>
                        )}
                        {appointment.status === "PENDING" && (
                          <Badge variant="secondary">Pendiente</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function UserTable({ users, onDelete }) {
  const getRoleBadge = (role) => {
    switch (role) {
      case "PATIENT":
        return <Badge variant="default">Paciente</Badge>;
      case "DOCTOR":
        return <Badge className="bg-purple-600">Doctor</Badge>;
      case "ADMIN":
        return <Badge className="bg-orange-600">Admin</Badge>;
      default:
        return null;
    }
  };

  const getSpecialtiesDisplay = (specialties) => {
    if (!specialties || specialties.length === 0) {
      return "No Aplica";
    }
    return specialties.join(", ");
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nombre</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Rol</TableHead>
          <TableHead>Especialidad</TableHead>
          <TableHead>Teléfono</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.id}>
            <TableCell className="font-medium">{user.name}</TableCell>
            <TableCell>{user.email}</TableCell>
            <TableCell>{getRoleBadge(user.role)}</TableCell>
            <TableCell>{getSpecialtiesDisplay(user.specialties)}</TableCell>
            <TableCell>{user.telefono || "-"}</TableCell>
            <TableCell className="text-right">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(user.id)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
