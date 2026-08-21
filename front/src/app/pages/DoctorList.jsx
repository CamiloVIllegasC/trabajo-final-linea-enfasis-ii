import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Navbar } from "../components/Navbar.jsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Search, Calendar } from "lucide-react";
import { doctorsAPI, adminAPI } from "../services/api.js";
import { toast } from "sonner";

export function DoctorList() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("Todas");
  const [doctors, setDoctors] = useState([]);
  const [specialties, setSpecialties] = useState([]);

  useEffect(() => {
    const load = async () => {
      try { 
       const [d, s] = await Promise.all([
          doctorsAPI.getAll(),
          adminAPI.getAllSpecialties()
        ]);
        setDoctors(d);
        setSpecialties(s);
      } catch (error) {
        toast.error("Error al cargar datos");
        console.error(error);
      }
    };
    load();
  }, []); 

  
  // Filtrar doctores
  const filteredDoctors = doctors.filter((doctor) => {
    const matchesSearch = doctor.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSpecialty =
      selectedSpecialty === "Todas" || doctor.specialties.includes(selectedSpecialty);
    return matchesSearch && matchesSpecialty;
  });
  

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Doctores Disponibles</h1>
          <p className="text-gray-600 mt-2">Encuentra al especialista ideal para ti</p>
        </div>

        {/* Filtros */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por nombre..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={selectedSpecialty} onValueChange={setSelectedSpecialty}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por especialidad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todas">
                    Todas las especialidades
                  </SelectItem>
                  {specialties.map((specialty) => (
                    <SelectItem key={specialty.id} value={specialty.name}>
                      {specialty.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Lista de doctores */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDoctors.map((doctor) => (
            <Card key={doctor.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{doctor.name}</CardTitle>
                    <CardDescription>{doctor.specialties?.map((s) => s).join(', ')}</CardDescription>
                  </div>
                  
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 mb-4">
                  <p className="text-sm text-gray-600">
                    <strong>Email:</strong> {doctor.email}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Teléfono:</strong> {doctor.telefono}
                  </p>
                </div>
                <Button
                  className="w-full"
                  onClick={() => navigate("/patient/create-appointment", { state: { doctor } })}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Agendar Cita
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredDoctors.length === 0 && (
          <Card className="mt-6">
            <CardContent className="py-12 text-center">
              <p className="text-gray-600">No se encontraron doctores con los filtros seleccionados</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}