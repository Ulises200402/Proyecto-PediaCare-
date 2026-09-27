# PediaCare API

API inicial con Express, separada del frontend Vite.

## Desarrollo

Desde esta carpeta:

```powershell
npm install
npm run dev
```

El endpoint `GET http://localhost:3000/api/health` verifica que el servidor responde. El puerto puede cambiarse con la variable de entorno `PORT`.

## Estructura

- `src/app.js`: configura Express y exporta la aplicación para facilitar pruebas.
- `src/server.js`: inicia el servidor HTTP.
- `src/routes/`: declara las rutas de la API.
- `src/controllers/`: implementa el comportamiento HTTP.

Las rutas de dominio y la persistencia se incorporarán después de validar el DDL y el alcance de turnos.