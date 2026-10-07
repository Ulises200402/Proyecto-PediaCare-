# PediaCare API

API con Express, separada del frontend Vite y preparada para MySQL.

## Desarrollo

Desde esta carpeta:

```powershell
npm install
npm run dev
```

El endpoint `GET http://localhost:3000/api/health` verifica que el servidor responde. El puerto puede cambiarse con la variable de entorno `PORT`.

Para conectar MySQL, copiar `.env.example` como `.env`, completar las credenciales locales y ejecutar el esquema `../db/pedia_care.sql`. `GET /api/health/database` prueba la conexión sin exponer credenciales.

En desarrollo, si `JWT_SECRET` falta, se genera una clave temporal en memoria para esa ejecución; al reiniciar la API, los tokens anteriores dejan de servir. En producción se requiere `JWT_SECRET` persistente de al menos 32 caracteres. No compartir ni subir el archivo `.env`.

## Endpoints implementados

- `POST /api/auth/login`: recibe `{ "email": "...", "password": "..." }` y devuelve un JWT de una hora.
- `POST /api/auth/register`: crea cuentas de los tres roles; los perfiles clínicos requieren `MEDICO_REGISTRATION_CODE` o `ENFERMERO_REGISTRATION_CODE` configurado en el entorno.
- `GET /api/auth/me`: requiere token Bearer y devuelve el usuario vigente.
- `GET /api/patients` y `GET /api/patients/:patientId`: requieren token. Padres/madres solo ven pacientes vinculados como tutores; profesionales pueden consultar pacientes.
- `POST /api/patients`: requiere rol `MEDICO`; crea paciente e historia clínica dentro de una transacción.

El formulario registra cuentas familiares directamente; médico y enfermería requieren código de habilitación. Para alta local, ejecutar `npm run user:create` desde la raíz. El comando solicita el perfil, oculta la contraseña, la guarda con bcrypt y crea el usuario y su perfil dentro de una transacción. Los controladores siguientes serán turnos, consultas y medicación con autorización por rol.

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