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

export function getTutors(token, search = "") {
  const query = search ? `?search=${encodeURIComponent(search)}` : ""
  return request(`/patients/tutors${query}`, {
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

export function updateConsultation(token, consultationId, consultation, registrationCode) {
  return request(`/consultations/${consultationId}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}`, "X-Registration-Code": registrationCode },
    body: JSON.stringify(consultation),
  })
}

export function deleteConsultation(token, consultationId, registrationCode) {
  return request(`/consultations/${consultationId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}`, "X-Registration-Code": registrationCode },
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

export function getAppointmentDoctors(token) {
  return request("/appointments/doctors", {
    headers: { Authorization: `Bearer ${token}` },
  })
}

export function requestAppointment(token, appointment) {
  return request("/appointments", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(appointment),
  })
}

export function cancelAppointment(token, appointmentId) {
  return request(`/appointments/${appointmentId}/cancel`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
  })
}

export function getMedications(token) {
  return request("/clinical/medications", {
    headers: { Authorization: `Bearer ${token}` },
  })
}

export function createMedication(token, medication) {
  return request("/clinical/medications", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(medication),
  })
}

export function updateMedication(token, medicationId, medication, registrationCode) {
  return request(`/clinical/medications/${medicationId}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}`, "X-Registration-Code": registrationCode },
    body: JSON.stringify(medication),
  })
}

export function getReminders(token) {
  return request("/clinical/reminders", {
    headers: { Authorization: `Bearer ${token}` },
  })
}

export function getNurses(token) {
  return request("/clinical/nurses", {
    headers: { Authorization: `Bearer ${token}` },
  })
}

export function assignReminder(token, reminderId, idEnfermeroAsignado) {
  return request(`/clinical/reminders/${reminderId}/assignment`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ idEnfermeroAsignado }),
  })
}

export function updateReminderStatus(token, reminderId, estado, observaciones) {
  return request(`/clinical/reminders/${reminderId}/status`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ estado, observaciones }),
  })
}

export function getVaccines(token) {
  return request("/clinical/vaccines", {
    headers: { Authorization: `Bearer ${token}` },
  })
}

export function createVaccine(token, vaccine) {
  return request("/clinical/vaccines", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(vaccine),
  })
}

export function updateVaccine(token, vaccineId, vaccine, registrationCode) {
  return request(`/clinical/vaccines/${vaccineId}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}`, "X-Registration-Code": registrationCode },
    body: JSON.stringify(vaccine),
  })
}

export function deleteVaccine(token, vaccineId, registrationCode) {
  return request(`/clinical/vaccines/${vaccineId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}`, "X-Registration-Code": registrationCode },
  })
}

export function getNotifications(token) {
  return request("/notifications", {
    headers: { Authorization: `Bearer ${token}` },
  })
}

export function markNotificationRead(token, notificationId) {
  return request(`/notifications/${notificationId}/read`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
  })
}

export function getNotificationPreferences(token) {
  return request("/notifications/preferences", {
    headers: { Authorization: `Bearer ${token}` },
  })
}

export function updateNotificationPreferences(token, preferences) {
  return request("/notifications/preferences", {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(preferences),
  })
}



export function register(account) {
  return request("/auth/register", {
    method: "POST",
    body: JSON.stringify(account),
  })
}
