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
- **Familia:** Resumen, Mis hijos, Turnos, Historial clínico y Notificaciones.
- **Médico:** Resumen, Pacientes, Agenda, Consultas e Indicadores.
- **Enfermería:** Resumen, Medicación, Recordatorios, Pacientes y Administraciones.
- El backend Express expone autenticación JWT (`/api/auth`) y endpoints protegidos de lectura/alta de pacientes (`/api/patients`), además de los chequeos `GET /api/health` y `GET /api/health/database`.
- El esquema MySQL está definido en `db/pedia_care.sql`; incluye usuarios y perfiles, pacientes, historias, consultas, medicación, recordatorios, notificaciones, turnos y vacunas.
- Todavía no hay endpoints para turnos, consultas, medicación, vacunas ni notificaciones. No cargar datos clínicos reales en esta versión del proyecto.

## Estructura

```text
backend/
	src/
		config/        Configuración y pool MySQL
		controllers/   Controladores de autenticación, salud y pacientes
		middleware/    Autenticación, permisos y errores HTTP
		repositories/  Consultas parametrizadas a MySQL
		routes/        Rutas de la API
		services/      Firma y verificación de JWT
		validators/    Validación de entradas
		cli/           Alta local de usuarios
	test/            Pruebas unitarias y HTTP
		app.js         Configuración de Express
		server.js      Inicio del servidor
	.env.example     Ejemplo de configuración local
frontend/
	public/          Archivos estáticos
	src/
		components/    Dashboards y componentes compartidos
		App.jsx        Portada y selector de vistas demo
		App.css        Estilos de pantallas
package.json       Comandos de desarrollo del proyecto
README.md
```

El frontend y el backend son paquetes independientes y mantienen sus propias dependencias. La raíz solo coordina los comandos comunes.

## Requisitos

- Node.js compatible con Vite 8 (Node.js 20.19+ o 22.12+).
- npm.
- MySQL 8.0.16 o superior (para que se apliquen las restricciones `CHECK` del esquema).

## Instalación y ejecución

Desde PowerShell, en la carpeta raíz del repositorio:

```powershell
# 1. Instalar dependencias del workspace, frontend y backend
npm install
npm --prefix frontend install
npm --prefix backend install

# 2. Configurar las variables de entorno de la base de datos
Copy-Item backend/.env.example backend/.env
```

Editar `backend/.env` con las credenciales de tu servidor MySQL local (`DB_USER`, `DB_PASSWORD`, etc.). El puerto de la API está configurado por defecto en `PORT=3001` para evitar conflictos con otros servicios locales.

```powershell
# 3. Inicializar la base de datos ejecutando el script SQL
# (puedes usar MySQL Workbench, la CLI de mysql o tu cliente preferido)
# mysql -u root -p < db/pedia_care.sql

# 4. Iniciar la aplicación completa (Frontend + Backend en paralelo)
npm run dev
```

`npm run dev` inicia el frontend (en `http://localhost:5173` con proxy automático hacia la API) y el backend (en `http://localhost:3001`) en paralelo.

Durante desarrollo, si falta `JWT_SECRET`, se usa una clave temporal en memoria que cambia al reiniciar la API. En producción es obligatorio configurar una clave persistente.

No subir `backend/.env` al repositorio. Si se modifica una estructura ya creada, preparar una migración; el script inicial no actualiza automáticamente tablas existentes.

Para ejecutar solo una parte:

```powershell
npm run dev:frontend
npm run dev:backend
```

Para verificar que el proceso de la API está activo, abrir `http://localhost:3000/api/health`. Para comprobar también MySQL, abrir `http://localhost:3000/api/health/database`.

Cuando MySQL esté iniciado, la respuesta de diagnóstico es:

```json
{ "status": "ok", "database": "connected" }
```

## API inicial

Todas las respuestas de pacientes requieren `Authorization: Bearer <token>`. Los tokens vencen en una hora y se comprueba que la cuenta y su perfil sigan activos.

- `POST /api/auth/login`: valida `email` y `password`, devuelve el token y el usuario autenticado.
- `POST /api/auth/register`: crea cuentas `PADRE_MADRE`, `MEDICO` o `ENFERMERO`, con los datos de perfil correspondientes. Médico y enfermería requieren códigos de habilitación del servidor.
- `GET /api/auth/me`: devuelve la identidad asociada al token.
- `GET /api/patients`: médico y enfermero consultan pacientes; padre/madre recibe solamente pacientes donde figura como tutor.
- `GET /api/patients/:patientId`: consulta una ficha según el mismo alcance de acceso.
- `POST /api/patients`: solo médico; crea paciente e historia clínica en una única transacción. El cuerpo usa `nombre`, `fechaNacimiento`, `sexo`, `idTutor1` y opcionalmente `idTutor2`, `alergias` y `enfermedadesCronicas`.

Las cuentas pueden crearse desde el formulario de registro. Las de médico/enfermería requieren un código que solo administra el servidor; no se permite elegir esos roles sin habilitación. Para alta local también está `npm run user:create`. Las contraseñas se almacenan con bcrypt. El próximo paso funcional es agregar endpoints de turnos y medicación con permisos por rol.

## Comandos útiles

Desde la raíz:

```powershell
npm run build
npm run lint
npm test
```

El build y lint se delegan al frontend; las pruebas usan el runner integrado de Node.js y no requieren MySQL.

## Tecnologías

- **Frontend:** React, Vite y Lucide.
- **Backend:** Node.js y Express.
- **Base de datos:** MySQL, usando un pool `mysql2` y configuración externa mediante `dotenv`.

La estructura separa la interfaz, las rutas HTTP, los controladores y los repositorios para favorecer el desacoplamiento, la cohesión y la testeabilidad.
