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

- El frontend contiene una maqueta visual estática de inicio de sesión. Los campos y el botón no autentican ni envían datos.
- El backend Express expone `GET /api/health` para comprobar que el servidor está activo.
- La base MySQL, el modelo de datos y los endpoints del dominio todavía no están implementados.
- Los turnos y las preferencias de canales de notificación deberán contemplarse al definir el modelo, ya que aún no tienen entidades propias confirmadas.

No cargar datos clínicos reales en esta versión del proyecto.

## Estructura

```text
backend/
	src/
		controllers/   Lógica de las solicitudes HTTP
		routes/        Rutas de la API
		app.js         Configuración de Express
		server.js      Inicio del servidor
frontend/
	public/          Archivos estáticos
	src/             Interfaz React y estilos
package.json       Comandos de desarrollo del proyecto
README.md
```

El frontend y el backend son paquetes independientes y mantienen sus propias dependencias. La raíz solo coordina los comandos comunes.

## Requisitos

- Node.js compatible con Vite 8 (Node.js 20.19+ o 22.12+).
- npm.

## Instalación y ejecución

Desde PowerShell, en la carpeta raíz del repositorio:

```powershell
npm install
npm --prefix frontend install
npm --prefix backend install
npm run dev
```

`npm run dev` inicia el frontend y el backend en paralelo. Vite muestra su URL en la terminal, normalmente `http://localhost:5173`; si ese puerto está ocupado, selecciona otro. La API queda disponible en `http://localhost:3000`.

Para ejecutar solo una parte:

```powershell
npm run dev:frontend
npm run dev:backend
```

Para verificar la API, abrir `http://localhost:3000/api/health`. La respuesta actual es:

```json
{ "status": "ok", "service": "pediacare-api" }
```

## Comandos útiles

Desde la raíz:

```powershell
npm run build
npm run lint
```

El build y lint de la raíz se delegan al frontend.

## Tecnologías

- **Frontend:** React, Vite y Lucide.
- **Backend:** Node.js y Express.
- **Base de datos prevista:** MySQL. La persistencia se incorporará cuando esté definido el esquema.

La estructura separa la interfaz, las rutas HTTP y los controladores para favorecer el desacoplamiento, la cohesión y la testeabilidad. El acceso a datos se agregará detrás de una capa propia cuando se implemente la base.
