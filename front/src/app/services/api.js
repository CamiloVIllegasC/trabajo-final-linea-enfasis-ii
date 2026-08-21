const API_BASE_URL = "http://localhost:3000/api";

// Helper para manejar respuestas
async function handleResponse(response) {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Error en la petición");
  }
  return data;
}

// Helper para obtener el token
function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// API de autenticación
export const authAPI = {
  login: async (credentials) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });
    return handleResponse(response);
  },

  register: async (data) => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  getCurrentUser: async () => {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
};

// API de doctores
export const doctorsAPI = {
  getAll: async (specialty) => {
    const url = specialty
      ? `${API_BASE_URL}/doctores?specialty=${specialty}`
      : `${API_BASE_URL}/doctores`;
    const response = await fetch(url, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  getById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/doctor/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  getAvailability: async (doctorId, date) => {
    const url = `${API_BASE_URL}/doctor/${doctorId}/available?date=${date}`;

    const response = await fetch(url, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Agregar horario a un doctor
  addSchedule: async (doctorId, schedule) => {
    const response = await fetch(`${API_BASE_URL}/doctor/${doctorId}/horario`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(schedule),
    });
    return handleResponse(response);
  },
};

// API de citas
export const appointmentsAPI = {
  getAllAppointments: async () => {
    const response = await fetch(`${API_BASE_URL}/admin/citas`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  getMyAppointments: async () => {
    const response = await fetch(`${API_BASE_URL}/citas/me`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  getAppointmentsDoctor: async (doctorId) => {
    const response = await fetch(`${API_BASE_URL}/doctor/${doctorId}/citas`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  create: async (appointmentData) => {
    const response = await fetch(`${API_BASE_URL}/citas`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(appointmentData),
    });
    return handleResponse(response);
  },

  cancel: async (id) => {
    const response = await fetch(`${API_BASE_URL}/cita/${id}/cancel`, {
      method: "PUT",
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
};

// API de administración
export const adminAPI = {
  getDashboardData: async () => {
    const response = await fetch(`${API_BASE_URL}/dashboard`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  getAllUsers: async () => {
    const response = await fetch(`${API_BASE_URL}/users`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  createUser: async (userData) => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(userData),
    });
    return handleResponse(response);
  },

  deleteUser: async (id) => {
    const response = await fetch(`${API_BASE_URL}/admin/users/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  getAllAppointments: async () => {
    const response = await fetch(`${API_BASE_URL}/admin/appointments`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Especialidades
  getAllSpecialties: async () => {
    const response = await fetch(`${API_BASE_URL}/especialidades`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  createSpecialty: async (specialtyData) => {
    const response = await fetch(`${API_BASE_URL}/especialidades`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(specialtyData),
    });
    return handleResponse(response);
  },

  assignSpecialtyToDoctor: async (doctorId, specialtyId) => {
    const response = await fetch(
      `${API_BASE_URL}/doctor/${doctorId}/especialidad`,
      {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ specialtyId }),
      },
    );
    return handleResponse(response);
  },

  desactivarUsuario: async (userId) => {
    const response = await fetch(`${API_BASE_URL}/auth/desactivar/${userId}`, {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify({ userId }),
    });
    return handleResponse(response);
  },
};
