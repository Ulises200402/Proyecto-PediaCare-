# Servicios Flask de PediaCare+

El backend activo es un conjunto de tres procesos Flask independientes que comparten MySQL y el contrato HTTP consumido por React:

| Servicio | Puerto | Responsabilidad |
|---|---:|---|
| `services.identity` | 3001 | Registro, autenticación, pacientes y tutores |
| `services.clinical` | 3002 | Consultas, medicación, recordatorios y vacunas |
| `services.coordination` | 3003 | Turnos, notificaciones y salud |

Cada servicio valida el mismo JWT, controla rol y estado de cuenta, y utiliza las mismas credenciales MySQL desde `backend/.env`. No se guarda información clínica en memoria entre servicios. Para iniciar todo el proyecto se recomienda `npm run dev` desde la raíz.

## Preparación

```powershell
python -m pip install -r requirements.txt
Copy-Item .env.example .env
```

Configurar en `.env` MySQL, `APP_ENV=development`, un `JWT_SECRET`, los códigos de habilitación del dueño y `CORS_ORIGINS`. En desarrollo se permite una clave sencilla como `1234` y se muestra una advertencia; no usarla con datos reales ni fuera del entorno local. En otros entornos se exige una clave de al menos 32 caracteres. Nunca guardar `.env` en el repositorio. Antes de iniciar una base nueva, ejecutar `../db/pedia_care.sql`. Para una base existente que ya contiene el esquema actual, ejecutar `../db/migrations/004_login_throttle.sql` una sola vez.

Para usar una clave robusta, generar y guardar una aleatoria desde PowerShell en la raíz del repositorio:

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

Hacerlo una sola vez. Si Windows tiene otra variable `JWT_SECRET` definida, prevalecerá sobre la del archivo `.env`; en ese caso, quitarla de la terminal actual con `Remove-Item Env:JWT_SECRET`.

Iniciar un proceso individual desde esta carpeta:

```powershell
python -m services.identity.app
python -m services.clinical.app
python -m services.coordination.app
```

## Contratos y validación

La referencia completa de endpoints, request/response y autenticación está en `../docs/openapi.json`. Swagger UI se publica en `/api/docs` en el servicio de identidad. Todos los endpoints de negocio aceptan el contrato existente `/api/*`; los códigos de confirmación de edición/eliminación viajan en `X-Registration-Code`.

Los SQL se ejecutan con parámetros; no registrar credenciales, tokens ni datos clínicos. El login bloquea temporalmente una cuenta o una IP con cinco fallos en una ventana de 15 minutos. Los identificadores usados para limitar intentos se almacenan como hashes.

Los servicios implementan Application Factory (`common/app.py`), políticas de acceso mediante Strategy (`common/access.py`) y notificaciones transaccionales mediante Observer (`common/events.py`). La prueba del flujo TLS/Wireshark está documentada en `../docs/wireshark-lab.md`; no se incluyen capturas simuladas.

## Pruebas

Desde la raíz, `npm test` ejecuta la suite heredada, pruebas de unidad y HTTP de Flask, y tests del cliente React. Las pruebas Flask no necesitan credenciales ni una base activa; las pruebas de integración con MySQL deben ejecutarse contra una base ficticia aislada.

`src/` y `test/` son el backend Express anterior. Se conservan para comparar comportamiento y ejecutar pruebas de regresión; no se inician desde `npm run dev`.
