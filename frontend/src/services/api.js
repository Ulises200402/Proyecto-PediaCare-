async function request(path, options = {}) {
  let response

  try {
    response = await fetch(`/api${path}`, {
      ...options,
      headers: {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...options.headers,
      },
    })
  } catch {
    throw new Error("No se pudo conectar con el servidor. Verificá que la API esté iniciada.")
  }

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    const error = new Error(payload.error || "Ocurrió un error al procesar la solicitud.")
    error.status = response.status
    error.details = payload.details
    throw error
  }

  return payload
}

export function login(credentials) {
  return request("/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  })
}

export function getCurrentUser(token) {
  return request("/auth/me", {
    headers: { Authorization: `Bearer ${token}` },
  })
}

export function getPatients(token) {
  return request("/patients", {
    headers: { Authorization: `Bearer ${token}` },
  })
}

export function createPatient(token, patient) {
  return request("/patients", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(patient),
  })
}

export function updatePatient(token, patientId, patient) {
  return request(`/patients/${patientId}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(patient),
  })
}

export function getTutors(token) {
  return request("/patients/tutors", {
    headers: { Authorization: `Bearer ${token}` },
  })
}

export function getConsultations(token) {
  return request("/consultations", {
    headers: { Authorization: `Bearer ${token}` },
  })
}

export function createConsultation(token, consultation) {
  return request("/consultations", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(consultation),
  })
}

export function updateConsultation(token, consultationId, consultation) {
  return request(`/consultations/${consultationId}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(consultation),
  })
}

export function deleteConsultation(token, consultationId) {
  return request(`/consultations/${consultationId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  })
}

export function getDoctorMetrics(token) {
  return request("/consultations/metrics", {
    headers: { Authorization: `Bearer ${token}` },
  })
}

export function getAppointments(token) {
  return request("/appointments", {
    headers: { Authorization: `Bearer ${token}` },
  })
}

export function updateAppointmentStatus(token, appointmentId, estado) {
  return request(`/appointments/${appointmentId}/status`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ estado }),
  })
}

export function register(account) {
  return request("/auth/register", {
    method: "POST",
    body: JSON.stringify(account),
  })
}

