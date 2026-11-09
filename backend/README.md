# PediaCare API

API con Express, separada del frontend Vite y preparada para MySQL.

## Desarrollo

Desde esta carpeta:

```powershell
npm install
npm run dev
```

El endpoint `GET http://localhost:3001/api/health` verifica que el servidor responde. El puerto puede cambiarse con la variable de entorno `PORT`.

Para conectar MySQL, copiar `.env.example` como `.env`, completar las credenciales locales y ejecutar el esquema `../db/pedia_care.sql`. `GET /api/health/database` prueba la conexión sin exponer credenciales.

En desarrollo, si `JWT_SECRET` falta, se genera una clave temporal en memoria para esa ejecución; al reiniciar la API, los tokens anteriores dejan de servir. En producción se requiere `JWT_SECRET` persistente de al menos 32 caracteres. No compartir ni subir el archivo `.env`.

## Endpoints implementados

- `POST /api/auth/login`: recibe `{ "email": "...", "password": "..." }` y devuelve un JWT de una hora.
- `POST /api/auth/register`: crea cuentas de los tres roles; los perfiles clínicos requieren `MEDICO_REGISTRATION_CODE` o `ENFERMERO_REGISTRATION_CODE` configurado en el entorno.
- `GET /api/auth/me`: requiere token Bearer y devuelve el usuario vigente.
- `GET /api/patients` y `GET /api/patients/:patientId`: requieren token. Padres/madres solo ven pacientes vinculados como tutores; profesionales pueden consultar pacientes.
- `POST /api/patients`: requiere rol `MEDICO`; crea paciente e historia clínica dentro de una transacción.
- `PUT /api/patients/:patientId`: actualiza una ficha (rol `MEDICO`); `GET /api/patients/tutors` lista tutores (rol `MEDICO`).
- Consultas: `GET/POST /api/consultations`, `PUT/DELETE /api/consultations/:consultationId` y `GET /api/consultations/metrics`. Editar o eliminar requiere enviar `X-Registration-Code` con el código vigente del rol, que valida el servidor.
- Turnos: `GET/POST /api/appointments`, `GET /api/appointments/doctors`, `PATCH /api/appointments/:appointmentId/cancel` y `PATCH /api/appointments/:appointmentId/status`.
- Medicación y recordatorios: `GET/POST/PUT /api/clinical/medications`, `GET /api/clinical/reminders`, `GET /api/clinical/nurses`, `PATCH /api/clinical/reminders/:reminderId/assignment` y `PATCH /api/clinical/reminders/:reminderId/status`. Editar planes requiere `X-Registration-Code`; las dosis pendientes se distribuyen automáticamente entre enfermeros activos con menor carga y médicos/enfermería pueden ajustar la asignación.
- Vacunas: `GET/POST/PUT/DELETE /api/clinical/vaccines`. Editar o eliminar requiere `X-Registration-Code`.
- Notificaciones: `GET /api/notifications`, `PATCH /api/notifications/:notificationId/read` y preferencias `GET/PUT /api/notifications/preferences`.
- `GET /api/health` y `GET /api/health/database`: diagnóstico de API y MySQL.

El formulario registra cuentas familiares directamente; médico y enfermería requieren código de habilitación. Para alta local, ejecutar `npm run user:create` desde la raíz. El comando solicita el perfil, oculta la contraseña, la guarda con bcrypt y crea el usuario y su perfil dentro de una transacción.

El registro web y la herramienta CLI requieren DNI de 7 u 8 dígitos. Los pacientes también requieren DNI único; el buscador permite localizarlos por nombre o DNI, mientras los IDs se mantienen como claves internas.

Los recordatorios se generan en una ventana móvil de 30 días y se reparten entre enfermeros activos según sus dosis pendientes; enfermería ve sus asignaciones y las que no tengan responsable. Los planes de medicación pueden durar hasta un año. Las notificaciones funcionan solo dentro de la app; no hay envío de correo/SMS ni recuperación de cuenta en este prototipo. Usar únicamente datos ficticios.

Las notificaciones de consultas, medicación y vacunas se generan al registrar, actualizar o eliminar esos datos, y también al registrar dosis administradas u omitidas. Se respetan las preferencias de notificación de cada tutor. Los códigos de confirmación de cambios se verifican en el servidor con el código del rol correspondiente y nunca se guardan en la base de datos. El modo demo es de solo lectura y no valida códigos.

## Estructura

- `src/app.js`: configura Express y exporta la aplicación para facilitar pruebas.
- `src/server.js`: inicia el servidor HTTP.
- `src/config/database.js`: crea y exporta el pool de conexiones MySQL.
- `src/repositories/`: concentra consultas parametrizadas y transacciones.
- `src/middleware/`: valida JWT, permisos por rol y errores HTTP.
- `src/validators/`: valida payloads antes de persistirlos.
- `src/services/`: firma y verifica tokens de acceso.
- `src/routes/`: declara las rutas de la API.
- `src/controllers/`: coordina validación, repositorios y respuestas HTTP.
- `test/`: pruebas que no requieren una instancia MySQL.

Ejecutar `npm test` desde la raíz para correr las pruebas.