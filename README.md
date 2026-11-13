# PediaCare+

Aplicación universitaria para centralizar el seguimiento y la administración de pacientes pediátricos. El proyecto busca reunir en un mismo lugar la información clínica, las consultas, la medicación y los recordatorios que hoy suelen gestionarse por separado.

## Equipo

- Julieta Escudero
- Ignacio Lucero
- Benjamín Martínez
- Ulises Ibañez
- Lautaro Altamirano

## Alcance del sistema

La aplicación está pensada para tres tipos de usuarios:

- **Médico:** registra pacientes y consultas, consulta el historial y revisa información crítica como alergias y enfermedades crónicas.
- **Enfermero:** carga medicación, dosis y horarios, y registra las dosis administradas.
- **Padre/Madre:** usa una cuenta personal para consultar la información de sus hijos, gestionar turnos y recibir notificaciones.

El paciente es un registro del sistema, no un usuario ni un actor con inicio de sesión. Cada paciente se vincula directamente con uno o dos tutores: `id_tutor_1` obligatorio e `id_tutor_2` opcional. No se comparte la cuenta entre padre y madre.

## Necesidad de enfermería y solución

El seguimiento de tratamientos pediátricos requiere coordinar medicación, dosis, horarios y
administraciones entre profesionales, además de mantener informadas a las familias. Cuando esos
datos se gestionan por separado, es más difícil reconocer una dosis pendiente, registrar una
administración omitida o identificar quién debe realizar el seguimiento.

PediaCare+ reúne los planes de medicación y sus recordatorios en la ficha del paciente. Enfermería
puede registrar planes, consultar dosis pendientes y dejar constancia de las dosis administradas u
omitidas. Los recordatorios activos se asignan entre enfermeros procurando equilibrar la carga, y
los cambios relevantes pueden generar notificaciones dentro de la aplicación para los tutores.
La herramienta organiza el registro y la comunicación; no reemplaza el criterio profesional ni
debe usarse para tomar decisiones clínicas.

## Estado actual

- El frontend ofrece login y registro conectados a la API. El registro cambia sus campos según el rol; la sesión se mantiene en `sessionStorage` y el dashboard carga los pacientes permitidos.
- Los botones de acceso demo muestran datos ficticios locales, no llaman a la API y son de solo lectura. Para probar operaciones persistidas, hay que iniciar sesión con una cuenta real de la base de prueba.
- **Familia:** Resumen, Mis hijos, Turnos, Historial clínico y Notificaciones.
- **Médico:** Resumen, Pacientes, Agenda, Consultas, Recordatorios e Indicadores.
- **Enfermería:** Resumen, Medicación, Recordatorios, Pacientes y Administraciones; sus recordatorios se asignan entre enfermeros activos procurando equilibrar la carga.
- La API protegida está implementada en tres servicios Flask separados: identidad y pacientes, clínica, y turnos y notificaciones. Los tres conservan el contrato `/api` que consume React y usan MySQL.
- Los avisos se muestran dentro de la aplicación. Las solicitudes de turno quedan pendientes de confirmación profesional; no se envían correos ni SMS.
- Usuarios y pacientes tienen DNI único por tabla. Las altas nuevas lo requieren y las búsquedas de pacientes usan nombre o DNI; los IDs quedan como referencias internas.
- El esquema inicial está en `db/pedia_care.sql`; incluye `login_throttle`. Los datos ficticios están en `db/pedia_care_datos_prueba.sql` y se pueden quitar con `db/pedia_care_borrar_datos_prueba.sql`.
- Para bases existentes, `db/migrations/004_login_throttle.sql` crea de forma idempotente la tabla requerida por el bloqueo de inicio de sesión sin modificar los registros de la aplicación.
- Es un prototipo educativo. Usar únicamente datos ficticios: no cargar información personal ni clínica real, ni utilizarlo para tomar decisiones de atención.

## Estructura

```text
backend/services/  Servicios Flask activos y funciones compartidas
backend/src/       Backend Express anterior, conservado como referencia
backend/test/      Pruebas Node.js del backend anterior
backend/tests/     Pruebas Python de los servicios Flask
db/                Esquema y scripts de datos ficticios para MySQL
docs/              OpenAPI y documentación del proyecto
frontend/public/   Logotipos, iconos y otros archivos estáticos
frontend/src/      Aplicación React, vistas, datos demo y cliente API
.github/           Configuración de GitHub y artefactos de modernización
```

En resumen, `backend/services/` contiene la API Flask activa, `backend/src/` el backend Express heredado, `frontend/src/` la interfaz, `db/` los scripts MySQL y `docs/` el contrato OpenAPI y la documentación del proyecto. El diagrama está disponible directamente en [docs/architecture-diagram.md](docs/architecture-diagram.md).

El directorio `backend/src/` conserva la implementación Express anterior como referencia y para pruebas de regresión; `npm run dev` no la inicia como servidor. Los servicios activos están en `backend/services/`.

## Requisitos

- Node.js compatible con Vite 8 (Node.js 20.19+ o 22.12+).
- npm.
- Python 3.11 o superior.
- MySQL 8.0.16 o superior (para que se apliquen las restricciones `CHECK` del esquema).

## Instalación y ejecución

Desde PowerShell, en la carpeta raíz del repositorio:

```powershell
# 1. Instalar dependencias de Node.js (la raíz, el frontend y el baseline heredado)
npm install
npm --prefix frontend install
npm --prefix backend install

# 2. Instalar los servicios Flask
python -m pip install -r backend\requirements.txt

# 3. Crear la configuración local (si todavía no existe)
Copy-Item backend/.env.example backend/.env
```

Completar `backend/.env` con los datos de conexión a MySQL, los códigos de habilitación y `JWT_SECRET`. La plantilla propone el puerto `3307`; si MySQL escucha en el puerto habitual `3306`, cambiar `DB_PORT` para que coincida. `APP_ENV=development` permite usar una clave corta como `1234` solo en desarrollo y muestra una advertencia al iniciar; no usarla con datos reales ni fuera del entorno local. En otros entornos se exige una clave de al menos 32 caracteres. `CORS_ORIGINS` debe incluir el origen de la web. No compartir ni subir `.env`. Los servicios Flask escuchan en `127.0.0.1:3001`, `:3002` y `:3003`.

Si se necesita una clave robusta, se puede generar y guardar una localmente desde PowerShell:

```powershell
$bytes = New-Object byte[] 32
$rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
$rng.GetBytes($bytes)
$secret = -join ($bytes | ForEach-Object { $_.ToString('x2') })
(Get-Content backend/.env) -replace '^JWT_SECRET=.*$', "JWT_SECRET=$secret" |
  Set-Content backend/.env -Encoding ascii
$rng.Dispose()
Remove-Variable secret, bytes
```

Ejecutar esto una sola vez al preparar el archivo. Si `JWT_SECRET` también está definido como variable de entorno de Windows, esa variable tiene prioridad sobre `backend/.env`; quitarla de la terminal actual con `Remove-Item Env:JWT_SECRET` para que se use el valor del archivo.

```powershell
# 4. En una instalación nueva, crear el esquema ejecutando db/pedia_care.sql
#    desde MySQL Workbench o tu cliente MySQL preferido.
#    Para una base existente, aplicar solo db/migrations/004_login_throttle.sql
#    seleccionando primero la base pedia_care; no volver a ejecutar el esquema inicial.
# 5. (Opcional) En una base nueva y sin datos, cargar los datos ficticios
#    ejecutando db/pedia_care_datos_prueba.sql una sola vez.

# 6. Iniciar React y los tres servicios Flask
npm run dev
```

`npm run dev` inicia Vite en `http://localhost:5173` y los tres servicios Flask. El HTTPS de Vite es opcional: solo se activa si existen ambos certificados en `frontend/.certs/localhost-key.pem` y `frontend/.certs/localhost.pem`. Las API Flask siguen usando HTTP local detrás del proxy.

No subir `backend/.env` al repositorio. `db/pedia_care.sql` es un esquema inicial, no una
actualización automática: no volver a ejecutarlo sobre una base existente con datos. Para la
actualización de `login_throttle`, respaldar la base y ejecutar una sola vez
`db/migrations/004_login_throttle.sql` en la base `pedia_care`.

Para ejecutar solo una parte:

```powershell
npm run dev:frontend
npm run dev:backend
```

La verificación del servicio y de MySQL está disponible en `http://localhost:3003/api/health` y `http://localhost:3003/api/health/database`. La documentación Swagger se sirve en `http://localhost:3001/api/docs`; mediante el proxy del frontend también está disponible en `http://localhost:5173/api/docs`. La especificación está en `docs/openapi.json`.

Cuando MySQL esté iniciado, la respuesta de diagnóstico es:

```json
{ "status": "ok", "database": "connected" }
```

## API

Todas las respuestas de pacientes requieren `Authorization: Bearer <token>`. Los tokens vencen en una hora y se comprueba que la cuenta y su perfil sigan activos.

- `POST /api/auth/login`: valida `email` y `password`, devuelve el token y el usuario autenticado.
- `POST /api/auth/register`: crea cuentas `PADRE_MADRE`, `MEDICO` o `ENFERMERO`, con los datos de perfil correspondientes. Médico y enfermería requieren códigos de habilitación del servidor.
- `GET /api/auth/me`: devuelve la identidad asociada al token.
- `GET /api/patients`: médico y enfermero consultan pacientes; padre/madre recibe solamente pacientes donde figura como tutor.
- `GET /api/patients/:patientId`: consulta una ficha según el mismo alcance de acceso.
- `POST /api/patients`: solo médico; crea paciente e historia clínica en una única transacción. El cuerpo usa `nombre`, `fechaNacimiento`, `sexo`, `idTutor1` y opcionalmente `idTutor2`, `alergias` y `enfermedadesCronicas`.

Además, la API ofrece:

- `PUT /api/patients/:patientId` para actualizar fichas; `GET /api/patients/tutors` para listar tutores (médicos).
- Consultas: `GET/POST /api/consultations`, `PUT/DELETE /api/consultations/:consultationId` y métricas para médicos en `GET /api/consultations/metrics`. Las familias pueden leer el historial y las indicaciones destinadas a ellas.
- Turnos: profesionales disponibles en `GET /api/appointments/doctors`; las familias solicitan (`POST /api/appointments`) o cancelan (`PATCH /api/appointments/:appointmentId/cancel`) turnos; personal profesional consulta y cambia su estado. Las solicitudes quedan pendientes de confirmación.
- Medicación y recordatorios en `/api/clinical/medications` y `/api/clinical/reminders`; enfermería registra planes y administra/omite dosis. Los recordatorios se generan en una ventana móvil de 30 días y los planes duran como máximo 365 días.
- Vacunas en `/api/clinical/vaccines`; médico y enfermería pueden registrar, actualizar y eliminar registros según los permisos del servicio.
- Notificaciones en `/api/notifications`; familias gestionan sus preferencias con `/api/notifications/preferences`. Los avisos son solo dentro de la app; no hay correo ni SMS.

`db/pedia_care_datos_prueba.sql` contiene usuarios y registros clínicos sintéticos con DNI ficticios. Ejecutarlo una sola vez y únicamente sobre una base recién creada y sin datos; usa IDs fijos, no sirve para reiniciar una instalación y no debe ejecutarse sobre una base que contenga información a conservar.

La base de datos continúa en MySQL por autorización del profesor; no se requiere migrarla a MongoDB.
La migración `004_login_throttle.sql` se limita a crear la tabla de bloqueo y no reemplaza ni
actualiza los cambios históricos de DNI o recordatorios. Antes de aplicar cualquier script sobre
una instalación existente, verificar su esquema y realizar una copia de seguridad.

Las cuentas pueden crearse desde el formulario de registro. Las de médico/enfermería requieren códigos de habilitación del servidor. Para alta local también está `npm run user:create`. Las contraseñas se almacenan con bcrypt.

## Roles y permisos

| Rol | Accesos principales | Restricciones |
|---|---|---|
| Padre/Madre | Consultar únicamente pacientes donde figura como tutor; ver historial e indicaciones destinadas a la familia; solicitar o cancelar turnos propios; consultar notificaciones y administrar preferencias. | No crea ni modifica fichas, consultas, medicación, dosis o vacunas. |
| Médico | Consultar pacientes e historiales; crear pacientes; registrar y mantener consultas; consultar métricas; gestionar vacunas y estados de turnos. | Las operaciones protegidas requieren una cuenta activa y validación backend del rol. |
| Enfermería | Consultar pacientes; registrar planes de medicación; asignar recordatorios; registrar dosis administradas u omitidas; gestionar registros de vacunas; atender estados de turnos permitidos. | No crea ni modifica consultas médicas. Las rutas restringidas se validan en el backend. |

El backend valida el JWT, el estado de la cuenta y el rol en cada operación protegida. El alcance de
pacientes también se aplica en las consultas de datos; ocultar una opción en React no reemplaza esa
autorización.

## Seguridad, patrones y pruebas

- **Fuerza bruta:** el login limita intentos por cuenta e IP usando hashes; bloquea durante 15 minutos al alcanzar cinco fallos por cuenta o veinte por IP, registra intentos fallidos sin guardar el identificador original y limpia el estado tras un acceso correcto.
- **Acceso y auditoría:** el backend exige JWT vigente, cuenta activa y rol permitido; el acceso de tutores se limita a sus pacientes. Los registros de auditoría identifican actor, rol, endpoint, método y resultado, sin incluir headers, parámetros, cuerpo, tokens, contraseñas ni datos clínicos.
- **Datos y credenciales:** las consultas MySQL usan parámetros PyMySQL; las contraseñas se hashean con bcrypt; los JWT vencen en una hora. Códigos, JWT y contraseñas se obtienen del entorno y no se registran.
- **CORS:** limitado a los orígenes enumerados en `CORS_ORIGINS`; no usar `*` en despliegues.
- **TLS/Wireshark:** Vite admite HTTPS local con certificados de desarrollo en `frontend/.certs/`. La guía [docs/wireshark-lab.md](docs/wireshark-lab.md) describe la captura reproducible con datos ficticios; la evidencia segura [docs/pedia-care-tls-api-ficticia.pcapng](docs/pedia-care-tls-api-ficticia.pcapng) fue verificada con 8 paquetes TLS y 0 paquetes HTTP. La captura preexistente `docs/PediaCare Prueba 1.pcapng` muestra protocolos HTTP y MySQL sin TLS según sus metadatos; no demuestra tráfico cifrado y no debe usarse como evidencia de seguridad. No se inspeccionan ni publican sus cargas útiles.
- **Swagger/OpenAPI:** catálogo completo de rutas en [docs/openapi.json](docs/openapi.json), disponible mediante Swagger UI en `http://localhost:5173/api/docs` (o `https://localhost:5173/api/docs` con certificado local).
- **Application Factory:** `backend/services/common/app.py#create_service` centraliza la creación y configuración compartida de cada servicio Flask. Evita duplicar CORS, seguridad, serialización y manejo de errores, manteniendo cada servicio independiente.
- **Strategy:** `backend/services/common/access.py#patient_access_filter` aplica reglas distintas de alcance de pacientes según el rol. Es adecuado porque los tutores ven solo a sus hijos mientras los profesionales consultan según sus permisos.
- **Observer:** `backend/services/common/events.py#NotificationEventBus` permite que los servicios publiquen cambios y que los observadores creen notificaciones dentro de la transacción correspondiente. Desacopla el origen del evento del almacenamiento de avisos.
- **Limitación de datos:** usar exclusivamente datos ficticios. El prototipo no es un sistema clínico certificado y no debe guardar información real.

## Comandos útiles

Desde la raíz:

```powershell
npm run build
npm run lint
npm test
```

`npm test` ejecuta las pruebas heredadas de Express, las pruebas unitarias y HTTP de los servicios Flask y las pruebas del cliente React. Las pruebas nuevas de Flask no requieren una base MySQL activa.

`npm test` también ejecuta los tests de componentes React y los escenarios de navegador Playwright.
Instalar Chromium una vez con `npm exec --prefix frontend -- playwright install chromium`.
Los dos flujos Flask que requieren persistencia MySQL se omiten por defecto. Para habilitarlos,
configurar `PEDIACARE_E2E=1` y `DB_NAME` con el nombre de una base de prueba que termine en `_test`;
los tests fallan de forma segura si el nombre no cumple esa condición. La provisión de esa base
debe hacerse en una instancia aislada y con datos ficticios.

## Tecnologías

- **Frontend:** React, Vite y Lucide.
- **Backend activo:** Python, Flask, PyMySQL, JWT y bcrypt.
- **Base de datos:** MySQL.

La composición de cinco integrantes y el uso de MySQL fueron autorizados por el profesor. La
consigna original del PDF indica cuatro integrantes y MongoDB; estas dos diferencias se documentan
como excepciones aprobadas, no como requisitos pendientes.
