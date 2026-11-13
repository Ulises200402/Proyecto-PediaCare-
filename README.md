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

## Estado actual

- El frontend ofrece login y registro conectados a la API. El registro cambia sus campos según el rol; la sesión se mantiene en `sessionStorage` y el dashboard carga los pacientes permitidos.
- Los botones de acceso demo muestran datos ficticios locales, no llaman a la API y son de solo lectura. Para probar operaciones persistidas, hay que iniciar sesión con una cuenta real de la base de prueba.
- **Familia:** Resumen, Mis hijos, Turnos, Historial clínico y Notificaciones.
- **Médico:** Resumen, Pacientes, Agenda, Consultas, Recordatorios e Indicadores.
- **Enfermería:** Resumen, Medicación, Recordatorios, Pacientes y Administraciones; sus recordatorios se asignan entre enfermeros activos procurando equilibrar la carga.
- La API protegida está implementada en tres servicios Flask separados: identidad y pacientes, clínica, y turnos y notificaciones. Los tres conservan el contrato `/api` que consume React y usan MySQL.
- Los avisos se muestran dentro de la aplicación. Las solicitudes de turno quedan pendientes de confirmación profesional; no se envían correos ni SMS.
- Usuarios y pacientes tienen DNI único por tabla. Las altas nuevas lo requieren y las búsquedas de pacientes usan nombre o DNI; los IDs quedan como referencias internas.
- El esquema inicial está en `db/pedia_care.sql`; los datos ficticios están en `db/pedia_care_datos_prueba.sql` y se pueden quitar con `db/pedia_care_borrar_datos_prueba.sql`. Actualmente no existe `db/migrations/` en el repositorio.
- El login implementa limitación de intentos mediante la tabla `login_throttle`, pero el esquema `db/pedia_care.sql` actual no crea esa tabla y no hay una migración disponible en el repositorio. Una base nueva creada solo con ese SQL puede devolver un error al iniciar sesión hasta que se agregue la tabla requerida.
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
.github/           Documentos de análisis, incluido el diagrama de arquitectura
```

En resumen, `backend/services/` contiene la API Flask activa, `backend/src/` el backend Express heredado, `frontend/src/` la interfaz, `db/` los scripts MySQL y `docs/` el contrato OpenAPI y otros documentos. El diagrama se encuentra en [.github/modernize/assessment/engines/facts/architecture-diagram.md](.github/modernize/assessment/engines/facts/architecture-diagram.md).

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
# 4. Crear el esquema ejecutando db/pedia_care.sql
#    desde MySQL Workbench o tu cliente MySQL preferido.
# 5. (Opcional) En una base nueva y sin datos, cargar los datos ficticios
#    ejecutando db/pedia_care_datos_prueba.sql una sola vez.

# 6. Iniciar React y los tres servicios Flask
npm run dev
```

`npm run dev` inicia Vite en `http://localhost:5173` y los tres servicios Flask. El HTTPS de Vite es opcional: solo se activa si existen ambos certificados en `frontend/.certs/localhost-key.pem` y `frontend/.certs/localhost.pem`. Las API Flask siguen usando HTTP local detrás del proxy.

No subir `backend/.env` al repositorio. `db/pedia_care.sql` es un esquema inicial, no una actualización automática: no volver a ejecutarlo sobre una base existente con datos. Como no hay scripts de migración en el checkout actual, cualquier actualización de una base existente debe planificarse y respaldarse aparte.

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

El encabezado de `db/pedia_care.sql` indica que el esquema incorpora cambios históricos de DNI y asignación de recordatorios. Sin embargo, esos archivos de migración ya no están presentes en este repositorio. Para bases existentes, no aplicar instrucciones de migración antiguas a ciegas: comparar el esquema y hacer una copia de seguridad antes de cualquier cambio.

Las cuentas pueden crearse desde el formulario de registro. Las de médico/enfermería requieren códigos de habilitación del servidor. Para alta local también está `npm run user:create`. Las contraseñas se almacenan con bcrypt.

## Seguridad, patrones y pruebas

- **Fuerza bruta:** el código de login consulta la tabla `login_throttle` y limita intentos por cuenta e IP usando hashes, con bloqueo de 15 minutos al alcanzar cinco fallos por cuenta o veinte por IP. Esa tabla no está incluida en el `db/pedia_care.sql` actual y tampoco hay una migración disponible; debe agregarse al esquema antes de depender de esta función en una instalación nueva.
- **Datos y credenciales:** todas las consultas usan parámetros PyMySQL; las contraseñas se hashean con bcrypt; JWT expira en una hora y consulta el estado de la cuenta en cada petición. Códigos, JWT y contraseñas se obtienen del entorno y no se registran.
- **CORS:** limitado a los orígenes enumerados en `CORS_ORIGINS`; no usar `*` en despliegues.
- **TLS:** Vite puede servir HTTPS local si se configuran los certificados indicados arriba. En este checkout no se incluye la guía de Wireshark ni una captura de tráfico.
- **Swagger/OpenAPI:** catálogo completo de rutas en [docs/openapi.json](docs/openapi.json), disponible mediante Swagger UI en `http://localhost:5173/api/docs` (o `https://localhost:5173/api/docs` con certificado local).
- **Patrones implementados:** Application Factory en `common/app.py` configura cada Flask independiente; Strategy en `common/access.py` selecciona la política de lectura por rol; Observer en `common/events.py` distribuye en la misma transacción los eventos de cambios clínicos a los tutores con preferencias habilitadas.
- **Limitación de datos:** usar exclusivamente datos ficticios. El prototipo no es un sistema clínico certificado y no debe guardar información real.

## Comandos útiles

Desde la raíz:

```powershell
npm run build
npm run lint
npm test
```

`npm test` ejecuta las pruebas heredadas de Express, las pruebas unitarias y HTTP de los servicios Flask y las pruebas del cliente React. Las pruebas nuevas de Flask no requieren una base MySQL activa.

## Tecnologías

- **Frontend:** React, Vite y Lucide.
- **Backend activo:** Python, Flask, PyMySQL, JWT y bcrypt.
- **Base de datos:** MySQL.

Los nombres del equipo permanecen como estaban. La consigna del PDF limita el equipo a cuatro integrantes; por decisión del usuario, el README conserva cinco, por lo que ese punto administrativo continúa pendiente.
