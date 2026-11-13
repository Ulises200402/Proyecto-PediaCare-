# Plan de implementación: completar los requisitos del PDF de PediaCare+

**Fecha**: 2026-11-13 | **Especificación**: [spec.md](./spec.md)

## Resumen

Restaurar el esquema MySQL y la migración faltantes para limitar intentos de inicio de sesión, añadir
registros de auditoría seguros y pruebas específicas del backend/frontend, y completar la
documentación y la evidencia de Wireshark. Conservar React/Vite, los tres servicios Flask, MySQL, el
contrato actual de la API y la política de datos ficticios. MySQL y el equipo de cinco integrantes son
excepciones al PDF original aprobadas por el profesor.

## Contexto técnico

**Lenguaje/Versión**: Python 3.11, JavaScript/React 19

**Dependencias principales**: Flask, PyMySQL, pytest, Vite y Vitest; añadir React Testing Library,
jsdom y Playwright para las pruebas requeridas de componentes y navegador

**Almacenamiento**: esquema MySQL compartido en `db/pedia_care.sql`

**Pruebas**: `npm test` en la raíz (pruebas de Node, pytest y Vitest); pruebas E2E de la API con
MySQL habilitadas explícitamente; pruebas del navegador con Playwright

**Plataforma objetivo**: entorno de desarrollo Windows; aplicación web local y servicios Flask

**Objetivos de rendimiento**: ninguna regresión medible en el comportamiento actual de las
solicitudes; los registros de auditoría no deben incluir cargas útiles de solicitudes ni generar
consultas adicionales a la base de datos

**Restricciones**: solo cambios SQL aditivos; no usar datos reales de pacientes; el nombre de la base
de pruebas debe terminar en `_test`; las pruebas E2E con base de datos están deshabilitadas salvo que
se habiliten explícitamente; durante la planificación no se detectó la interfaz de línea de comandos
de Docker ni un servicio MySQL/MariaDB local, y no se pudo acceder a los puertos 3306 y 3307.

**Evidencia inicial**: antes de los cambios, `npm test` pasó: 26 pruebas de Node, 12 de pytest y 2
de Vitest. Está disponible Node.js 24.16.0. Inicialmente no estaban disponibles Docker ni
Playwright; se añadió Playwright y se instaló Chromium. No se encontró un servicio MySQL/MariaDB
local y no se pudo acceder a los puertos 3306 y 3307.

**Entradas de diseño**: diagrama de arquitectura existente en `docs/architecture-diagram.md`,
contrato de la API en `docs/openapi.json`, esquema actual en `db/pedia_care.sql` y documentación de
servicios y pruebas en `README.md` y `backend/README.md`. No había topología del proyecto ni grafo de
conocimiento.

## Verificación de la constitución

- **I. Conservar el comportamiento existente**: PASS — los contratos de los servicios y los flujos
  de usuario no cambian; el SQL es aditivo y la migración no toca registros de la aplicación.
- **II. Proteger los datos de pacientes y cuentas**: PASS — las pruebas usan valores ficticios; los
  registros de auditoría no incluyen tokens, cuerpos ni datos clínicos; la captura existente en
  texto claro no se reutiliza como prueba TLS.
- **III. Verificar el comportamiento mediante pruebas**: PASS — se añaden pruebas de regresión, por
  rol, E2E con base de datos, de componentes y de navegador. Las pruebas E2E de MySQL deben estar
  protegidas por habilitación explícita y un nombre de base que termine en `_test`.
- **IV. Mantener los cambios trazables y comprensibles**: PASS — cada tarea se vincula con la tabla
  REQ siguiente; se actualizan el README y la documentación de Wireshark con evidencia verificable.
- **V. Preferir cambios pequeños y confiables**: PASS — se reutilizan pytest, Vitest, los clientes
  de prueba actuales de Flask y los patrones existentes de la API; solo se añaden las dependencias de
  prueba que requiere la consigna.
- **Excepciones aprobadas**: PASS — se documenta, sin tergiversarla, la aprobación del profesor para
  MySQL y un equipo de cinco integrantes.

## Guías aplicadas

- Ninguna guía de migración proporcionada corresponde a este trabajo: los frameworks de origen y
  destino no cambian, y la guía disponible de Struts a Spring no está relacionada.
- Seguir las convenciones existentes del repositorio para Flask, PyMySQL, Vitest y la nomenclatura SQL.

## Pasos de implementación

### Fase 1: Configuración inicial

#### Paso 1.1: [Transversal] Añadir infraestructura de pruebas del frontend
- **Requisitos**: REQ-005, REQ-007
- **Entradas de diseño**: `frontend/package.json`, `frontend/vite.config.js`, pruebas actuales del cliente de la API.
- **Descripción**: Añadir React Testing Library y jsdom a Vitest, añadir Playwright para pruebas del
  navegador, integrar los nuevos comandos de prueba en el comando de pruebas existente de la raíz y
  mantener las pruebas del navegador aisladas de MySQL simulando las respuestas de la API en el navegador.

**Tareas**
- [x] T001 [Plan:1.1] Añadir React Testing Library, jsdom y la configuración de pruebas de Vitest en `frontend/package.json` y `frontend/vite.config.js`.
- [x] T002 [Plan:1.1] Añadir la configuración de Playwright y un comando de pruebas del navegador con Vite, e integrarlo en el flujo canónico de pruebas de la raíz en `frontend/e2e/` y `package.json`.

### Fase 2: Base de datos y protección del inicio de sesión

#### Paso 2.1: [Transversal] Restaurar el esquema de limitación de intentos de inicio de sesión
- **Requisitos**: REQ-001, REQ-002
- **Entradas de diseño**: instrucciones SQL existentes y uso de `login_throttle` en `backend/services/identity/app.py`.
- **Descripción**: Añadir la tabla al SQL de instalación nueva con los nombres y tipos exactos de las
  columnas que usa el servicio de inicio de sesión, y crear una migración numerada e idempotente para
  instalaciones existentes. Conservar el esquema y los registros existentes.

#### Paso 2.2: [US1] Verificar la limitación de intentos
- **Requisitos**: REQ-003, REQ-006
- **Entradas de diseño**: `_locked`, `_record_login_failure` y `login` en
  `backend/services/identity/app.py`.
- **Descripción**: Añadir pruebas específicas para la respuesta de bloqueo, el registro de fallos,
  los ámbitos de cuenta/IP con hash y el comportamiento de recuperación, evitando credenciales reales
  y el acceso a MySQL en las pruebas unitarias.

**Tareas**
- [x] T003 [US1] [Plan:2.1] Añadir la creación de `login_throttle` a `db/pedia_care.sql` con campos y claves que coincidan con `backend/services/identity/app.py`.
- [x] T004 [US1] [Plan:2.1] Crear `db/migrations/004_login_throttle.sql`, idempotente para bases existentes y sin modificar datos de la aplicación.
- [x] T005 [US1] [Plan:2.2] Añadir pruebas específicas de bloqueo en `backend/tests/test_login_throttle.py` para inicio de sesión bloqueado, registro de fallos, ámbitos con hash y semántica de reinicio.

### Fase 3: Historia de usuario 2 — acceso con roles y rendición de cuentas

#### Paso 3.1: [US2] Añadir registros mínimos de auditoría para accesos autenticados
- **Requisitos**: REQ-004
- **Entradas de diseño**: fábrica compartida de aplicaciones Flask en `backend/services/common/app.py` e
  identidad autenticada establecida por `backend/services/common/security.py`.
- **Descripción**: Registrar el ID del actor, el rol, la ruta de la API, el método y el estado después
  de las solicitudes autenticadas. No registrar rutas que contengan identificadores de recursos,
  cadenas de consulta, encabezados, cuerpos de solicitudes ni datos clínicos. Conservar el
  comportamiento actual de los encabezados de seguridad.

#### Paso 3.2: [US2] Verificar los roles y la privacidad de los registros
- **Requisitos**: REQ-004, REQ-006
- **Entradas de diseño**: pruebas actuales con `test_client` de Flask y aplicación compartida de permisos por rol.
- **Descripción**: Cubrir una solicitud permitida y otra denegada; comprobar que los datos de
  auditoría sean útiles y que no aparezcan tokens, contraseñas, cuerpos de solicitudes ni datos de pacientes.

**Tareas**
- [x] T006 [US2] [Plan:3.1] Añadir registros de auditoría de solicitudes autenticadas en `backend/services/common/app.py` sin incluir ID de recursos ni datos de solicitudes.
- [x] T007 [US2] [Plan:3.2] Añadir pruebas de ocultamiento de datos de auditoría y autorización permitida/denegada por rol en `backend/tests/test_shared_patterns.py` y `backend/tests/test_service_endpoints.py`.

### Fase 4: Historia de usuario 3 — pruebas reproducibles del backend y frontend

#### Paso 4.1: [US3] Añadir pruebas de extremo a extremo de la API con MySQL y controles de seguridad
- **Requisitos**: REQ-005, REQ-006
- **Entradas de diseño**: `backend/services/identity/app.py`, `backend/services/common/database.py`,
  el esquema existente y la configuración del cliente de pruebas.
- **Descripción**: Añadir al menos dos flujos HTTP de varios pasos contra una base de pruebas MySQL
  real y aislada. Usar registros ficticios únicos y limpiarlos. Exigir `PEDIACARE_E2E=1` y que el
  nombre de la base termine en `_test`; rechazar la ejecución si falta cualquiera de las condiciones.
  No contar pruebas simuladas como pruebas E2E con base de datos.

#### Paso 4.2: [US3] Probar el registro según el rol y el comportamiento del navegador
- **Requisitos**: REQ-005, REQ-007
- **Entradas de diseño**: `frontend/src/components/RegisterPage.jsx`, la configuración actual de Vitest y el servidor de pruebas de Playwright.
- **Descripción**: Añadir pruebas de componentes para los campos profesionales específicos de cada
  rol y los mensajes de formulario no válido; añadir pruebas de navegador con datos ficticios y
  respuestas de la API interceptadas. Verificar el ejecutor de pruebas del navegador y el intento de
  instalación independientemente de Docker.

**Tareas**
- [x] T008 [US3] [Plan:4.1] Añadir datos de preparación E2E de MySQL habilitados explícitamente y al menos dos flujos de varios pasos de la API de identidad en `backend/tests/test_api_e2e.py`, con protección de base `_test` y limpieza.
- [x] T009 [US3] [Plan:4.2] Añadir pruebas de React Testing Library para campos de registro específicos por rol y avisos de discrepancia de contraseña en `frontend/src/components/RegisterPage.test.jsx`.
- [x] T010 [US3] [Plan:4.2] Añadir un flujo de registro en el navegador, dependiente del rol, en `frontend/e2e/register.spec.js` con tráfico de API simulado y valores ficticios.

### Fase 5: Historia de usuario 4 — documentación completa de entrega y evidencia de red

#### Paso 5.1: [US4] Documentar la necesidad de enfermería, las responsabilidades, los patrones, los roles y las excepciones aprobadas
- **Requisitos**: REQ-008, REQ-009
- **Entradas de diseño**: archivos README existentes, diagrama de arquitectura, contrato OpenAPI y
  aprobaciones confirmadas del equipo.
- **Descripción**: Explicar el problema de enfermería y la respuesta de la aplicación; identificar la
  responsabilidad de cada servicio; proporcionar una matriz de roles y permisos; describir dónde se
  usan Factory, Strategy y Observer, qué problema resuelven y por qué son adecuados; documentar las
  aprobaciones de MySQL y de cinco integrantes, así como la distribución compartida del trabajo.

#### Paso 5.2: [US4] Proporcionar un procedimiento seguro de Wireshark y evidencia TLS
- **Requisitos**: REQ-010
- **Entradas de diseño**: configuración HTTPS existente de Vite y metadatos de la captura actual.
- **Descripción**: Crear una guía reproducible orientada a Windows para una solicitud ficticia a la
  API mediante la ruta HTTPS de Vite, con un filtro de captura limitado al puerto TLS público.
  Verificar únicamente los metadatos del protocolo y asegurarse de que la evidencia no contenga
  credenciales reales ni datos clínicos. No inspeccionar ni publicar la captura existente en texto claro.

**Tareas**
- [x] T011 [US4] [Plan:5.1] Actualizar `README.md` y `backend/README.md` con la necesidad de enfermería, la responsabilidad de los servicios, la matriz de roles, la justificación de los patrones, los registros seguros, el uso de la migración y las excepciones de equipo/base de datos aprobadas por el profesor.
- [x] T012 [US4] [Plan:5.2] Crear `docs/wireshark-lab.md` con un procedimiento seguro de prueba TLS y añadir una nueva captura verificada con datos ficticios solo si las herramientas de captura locales funcionan.

### Fase 6: Verificación final

#### Paso 6.1: [Transversal] Ejecutar comprobaciones de calidad específicas y de todo el repositorio
- **Requisitos**: REQ-001 a REQ-010
- **Entradas de diseño**: todos los entregables anteriores.
- **Descripción**: Ejecutar comprobaciones de migración y análisis estático, pruebas de Python,
  `npm test` canónico, compilación del frontend y análisis estático. Intentar por separado las
  pruebas E2E con MySQL y la captura de Wireshark; informar la infraestructura no disponible como
  no verificada, nunca como aprobada.

**Tareas**
- [x] T013 [Plan:6.1] Ejecutar `python -m pytest backend/tests -q`, `npm test`, `npm run build` y `npm run lint`; registrar los resultados y las brechas del entorno en la respuesta final.
- [ ] T014 [Plan:6.1] Ejecutar los flujos E2E opcionales de MySQL contra una base aislada cuyo nombre termine en `_test`; BLOQUEADO porque no hay un servicio MySQL local ni interfaz de línea de comandos de Docker. La captura TLS se completó y verificó en T012.

## Estructura del proyecto

```text
db/
  pedia_care.sql
  migrations/
    004_login_throttle.sql
backend/
  services/common/app.py
  tests/
    test_login_throttle.py
    test_api_e2e.py
    test_shared_patterns.py
    test_service_endpoints.py
frontend/
  src/components/RegisterPage.test.jsx
  e2e/register.spec.js
  package.json
docs/
  wireshark-lab.md
README.md
backend/README.md
.github/modernize/requisitos-pdf/
  constitution.md
  spec.md
  requirements-checklist.md
  plan.md
  checkpoints/
```

## Estrategia de pruebas

- **appType**: API Flask y aplicación de página única React combinadas.
- **Recorridos críticos del usuario**:
  1. Los intentos de inicio de sesión no válidos se registran en ámbitos con hash; un ámbito bloqueado recibe HTTP 429.
  2. Un tutor puede acceder a un paciente dentro de su ámbito y no puede acceder a uno fuera de él.
  3. Una cuenta ficticia de padre o madre puede registrarse, iniciar sesión, recuperar su identidad actual y rechazar un registro duplicado en MySQL.
  4. El formulario de registro cambia los campos según el rol y muestra un aviso accesible cuando las contraseñas no coinciden.
  5. Una solicitud ficticia a la API mediante el proxy HTTPS del frontend genera tráfico TLS sin credenciales ni datos clínicos.
- **primaryValidationStack**: pytest para pruebas unitarias y de API; una base de pruebas MySQL real
  para E2E con base de datos; Vitest + React Testing Library para el comportamiento de componentes;
  Playwright para el comportamiento del navegador; `npm test` en la raíz como suite canónica sin base de datos.
- **fallbackMatrix**:
  - `infra-tier`: MySQL basado en Docker no está disponible en este entorno. La ejecución principal
    usa una base MySQL local aprovisionada manualmente cuyo nombre termina en `_test`; si no hay una
    disponible, las pruebas E2E con base de datos quedan **UNVERIFIED**. Se pueden ejecutar pruebas
    de Flask con dobles, pero no sustituyen las pruebas E2E.
  - `browser-tier`: Node.js 24.16.0 está disponible. Añadir Playwright e intentar instalar Chromium.
    Si falla la instalación del navegador, conservar los resultados de React Testing Library y de
    las pruebas de API, e informar el nivel de navegador como no verificado; registrar el error
    exacto de instalación.
- **Requisitos del entorno**: Node.js/npm; Python 3.11 con `backend/requirements.txt`; una base de
  pruebas MySQL 8 para las pruebas E2E habilitadas; Chromium de Playwright para las pruebas del
  navegador; Wireshark/dumpcap y permiso de captura de loopback para la evidencia TLS. Docker no es
  requisito si MySQL local se aprovisiona manualmente.
- **knownGaps**: Durante la planificación no se encontró un servicio MySQL y no se pudo acceder a
  los puertos 3306/3307. El esquema `DB_NAME` de `db/pedia_care.sql` está fijado en `pedia_care`,
  por lo que para aprovisionar una base de pruebas se debe importar un esquema exclusivo de pruebas
  revisado explícitamente. La captura existente contiene tráfico de protocolo HTTP y MySQL, sin
  tramas TLS; no es aceptable como evidencia TLS. Se verificó que la nueva captura local solo
  contiene TLS en el puerto filtrado entre el cliente y Vite.
- **Estrategia de datos de prueba**: Generar un correo único `@example.test` en cada ejecución y
  usar únicamente nombres y valores sintéticos. Las pruebas E2E con base de datos requieren
  `PEDIACARE_E2E=1` y que `DB_NAME` termine en `_test`; usar un esquema dedicado, eliminar solo los
  registros creados por la prueba y detenerse ante errores de limpieza. Las pruebas del navegador
  interceptan solicitudes de la API y no guardan datos.
- **Criterios de aceptación**: Todos los comandos de pruebas unitarias, de componentes y de navegador,
  compilación y análisis estático terminan con código cero; pasan dos flujos E2E con base de datos
  si hay una base de pruebas protegida; de lo contrario, se informa que las pruebas E2E no se
  verificaron. La tarea de evidencia TLS solo pasa si los metadatos confirman TLS y no se capturaron
  credenciales ni datos clínicos en texto claro.
- **Expectativas de revisión de validación**: Comprobar códigos de salida y cantidades de pruebas;
  verificar migraciones únicamente contra un esquema de pruebas; confirmar la protección `_test`;
  inspeccionar las aserciones de auditoría sin volcar valores confidenciales capturados; verificar
  los metadatos del protocolo de la captura, no sus cargas útiles; no afirmar que pasaron pruebas no ejecutadas.
- **Recursos de pruebas heredados**: Las pruebas de Node y pytest descubiertas son pruebas unitarias
  o de rutas, y el frontend contiene pruebas del cliente de API con Vitest. No se encontró una suite
  E2E de navegador existente; no hay una migración E2E heredada.
- **Estrategia de dependencias externas**: MySQL es una dependencia real únicamente para pruebas
  E2E habilitadas explícitamente; no se usa un intermediario de mensajes ni una API externa. Las
  pruebas de Vitest simulan el módulo de API. Las pruebas de Playwright interceptan respuestas
  `/api/**`. Cada servicio Flask recibe pruebas básicas de inicio/API mediante su cliente de pruebas
  y la ruta OpenAPI. La ejecución de pruebas se coordina con `npm test` en la raíz; las E2E de base
  de datos usan la protección explícita del entorno.

## Seguimiento de complejidad

No se prevén incumplimientos de la constitución ni abstracciones adicionales en producción.

## Correspondencia de requisitos

| ID del requisito | Descripción | Elementos del plan | Evidencia de implementación |
|--------|-------------|------------|------------------------|
| REQ-001 | El esquema nuevo incluye la tabla para limitar intentos de inicio de sesión | 2.1 | `db/pedia_care.sql` |
| REQ-002 | Las bases existentes reciben una migración segura e idempotente | 2.1 | `db/migrations/004_login_throttle.sql`, `backend/README.md` |
| REQ-003 | Se prueban el bloqueo y el registro seguro de intentos fallidos | 2.2 | `backend/services/identity/app.py`, `backend/tests/test_login_throttle.py` |
| REQ-004 | Las operaciones autenticadas generan registros de auditoría que protegen la privacidad | 3.1, 3.2 | `backend/services/common/app.py`, `backend/tests/test_shared_patterns.py` |
| REQ-005 | El backend tiene dos flujos E2E de API protegidos | 1.1, 4.1 | `backend/tests/test_api_e2e.py`, `package.json` de la raíz |
| REQ-006 | La autenticación, el acceso por rol, la validación y los duplicados usan datos ficticios | 2.2, 3.2, 4.1 | `backend/tests/test_login_throttle.py`, `backend/tests/test_service_endpoints.py`, `backend/tests/test_api_e2e.py` |
| REQ-007 | Las pruebas del frontend cubren campos específicos por rol y mensajes de datos no válidos | 1.1, 4.2 | `frontend/src/components/RegisterPage.test.jsx`, `frontend/e2e/register.spec.js` |
| REQ-008 | Se documentan la necesidad de enfermería, las responsabilidades de los servicios, los roles, la seguridad y los patrones | 5.1 | `README.md`, `backend/README.md` |
| REQ-009 | Se documentan las excepciones aprobadas para MySQL y cinco integrantes, y la distribución equitativa del trabajo | 5.1 | `README.md` |
| REQ-010 | Se proporcionan un procedimiento seguro de Wireshark/TLS y evidencia | 5.2 | `docs/wireshark-lab.md`, nueva captura TLS si las herramientas locales lo permiten |
