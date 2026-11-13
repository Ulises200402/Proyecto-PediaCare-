# Especificación de funcionalidades: completar los requisitos del trabajo integrador

> Regida por: `./constitution.md` (principios acordados para esta implementación)

**Rama de funcionalidad**: `completion-pdf-requirements`
**Creada**: 2026-03-17
**Estado**: Borrador para implementación
**Entrada**: Solicitud del usuario para restaurar la definición faltante de la tabla `login_throttle` e implementar los demás requisitos aplicables del PDF de la consigna de Programación II.

## Alcance inicial

- **Método de análisis**: Se revisaron el PDF de la consigna de tres páginas, los archivos README actuales, los servicios y pruebas de Flask, la configuración de pruebas del frontend, el esquema MySQL y los metadatos disponibles de la captura de Wireshark.
- **Total de elementos identificados**: Siete secciones de la consigna, además de cinco escenarios de prueba sugeridos y las restricciones de entrega.
- **Elementos dentro del alcance**: Requisitos de base de datos aún pendientes o con evidencia insuficiente, registros de seguridad, pruebas del backend/frontend, evidencia de Wireshark y documentación del proyecto. Se conservan las funcionalidades existentes, los servicios Flask, el uso de MySQL, la interfaz React, la lógica de limitación de intentos de inicio de sesión y los tres patrones de diseño implementados.
- **Excepciones aprobadas**: El profesor aceptó MySQL en lugar de MongoDB y un equipo de cinco integrantes en lugar del límite de cuatro indicado en el PDF. La declaración de contribuciones del equipo debe describir una distribución equitativa del trabajo, según lo solicitado por el usuario.
- **Riesgo de la evidencia**: La captura existente se inspeccionó únicamente mediante sus metadatos de protocolo. Contiene tráfico HTTP y MySQL, pero no tramas TLS; por ello, no demuestra tráfico HTTPS protegido y no debe presentarse como evidencia TLS. No inspeccionar ni publicar sus cargas útiles; usar datos ficticios en cualquier captura de reemplazo.

## Escenarios de usuario y pruebas

### Historia de usuario 1: una instalación nueva o existente puede usar la limitación de intentos de inicio de sesión (Prioridad: P1)

Como persona encargada de configurar PediaCare+, necesito las definiciones de base de datos que requiere la lógica existente de bloqueo de inicio de sesión, para que los intentos se contabilicen y los bloqueos temporales funcionen de manera consistente tanto después de una instalación nueva como de una actualización.

**Por qué tiene esta prioridad**: Sin la tabla, la ruta de inicio de sesión puede fallar en ejecución aunque exista el código de limitación de intentos.

**Prueba independiente**: Aplicar el esquema inicial a una base de pruebas MySQL vacía y la migración a una base de pruebas anterior a la migración; en ambos casos, verificar la estructura de la tabla y probar mediante la API un inicio de sesión bloqueado.

**Escenarios de aceptación**:

1. **Dado** una base de pruebas nueva, **cuando** se aplique el esquema inicial, **entonces** existirá la tabla requerida para limitar intentos, con las columnas y la clave que usa el servicio.
2. **Dado** un esquema existente compatible que no tenga la tabla de limitación, **cuando** se aplique la migración numerada, **entonces** se creará la tabla sin eliminar ni reescribir registros de la aplicación.
3. **Dado** un bloqueo activo para una cuenta o dirección IP ficticia, **cuando** se intente iniciar sesión, **entonces** la API lo rechazará con la respuesta de bloqueo temporal documentada.

### Historia de usuario 2: el acceso a los datos de pacientes es auditable y limitado por rol (Prioridad: P1)

Como paciente, tutor o profesional de la salud, necesito que el backend aplique y pruebe los permisos por rol, y registre los accesos autenticados pertinentes sin incluir credenciales ni datos clínicos en los registros.

**Por qué tiene esta prioridad**: Los registros de pacientes son confidenciales, y ocultar opciones en la interfaz por sí solo no aplica la autorización.

**Prueba independiente**: Enviar solicitudes permitidas y denegadas a la API para cada rol pertinente usando usuarios ficticios; inspeccionar los registros de auditoría capturados y confirmar que no contengan tokens, contraseñas ni datos clínicos.

**Escenarios de aceptación**:

1. **Dado** un token de tutor, **cuando** el tutor solicite un paciente fuera de su ámbito, **entonces** el backend denegará el acceso.
2. **Dado** un rol profesional, **cuando** solicite una operación permitida, **entonces** el backend devolverá la respuesta esperada; una operación no permitida será rechazada.
3. **Dada** una solicitud autenticada, **cuando** se complete la respuesta, **entonces** el registro de auditoría identificará al actor, la acción o ruta de la API y el resultado, sin registrar cuerpos de solicitudes, tokens, contraseñas ni datos clínicos innecesarios.

### Historia de usuario 3: el equipo puede validar flujos completos del backend y el comportamiento del frontend (Prioridad: P1)

Como desarrollador o revisor, necesito pruebas reproducibles para los flujos importantes de la API y los componentes React, de modo que se puedan comprobar la autenticación, la autorización, la validación y el comportamiento de la interfaz según el rol antes de la entrega.

**Por qué tiene esta prioridad**: La consigna exige explícitamente pruebas unitarias del backend, pruebas de extremo a extremo del backend, pruebas del frontend y datos ficticios de prueba.

**Prueba independiente**: Ejecutar la suite unitaria del backend, al menos dos flujos HTTP de extremo a extremo contra una base de pruebas aislada y la suite de React Testing Library o Jest.

**Escenarios de aceptación**:

1. **Dada** una base de pruebas MySQL dedicada, **cuando** se ejecute la suite E2E del backend, **entonces** pasarán al menos dos flujos HTTP visibles para el usuario, con registros ficticios, y la suite no podrá conectarse a una base que no esté identificada explícitamente como base de pruebas.
2. **Dados** datos de registro no válidos o duplicados, **cuando** la API los reciba, **entonces** la validación los rechazará sin guardar una cuenta no válida.
3. **Dado** un formulario de registro React, **cuando** cambie el rol de cuenta seleccionado o se envíen datos no válidos, **entonces** el componente mostrará los campos correspondientes al rol y mensajes de validación accesibles.

### Historia de usuario 4: la documentación entregada explica la solución y su evidencia (Prioridad: P2)

Como evaluador, necesito que la documentación del repositorio explique la necesidad de enfermería, la responsabilidad de los servicios, los permisos, la seguridad, los patrones de diseño, la configuración y la evidencia segura del análisis de red.

**Por qué tiene esta prioridad**: La documentación completa es un entregable obligatorio y permite comprender y verificar la implementación.

**Prueba independiente**: Comparar el README y los documentos enlazados con cada tema requerido; luego, seguir la práctica de Wireshark con datos ficticios y verificar que la evidencia contenga tráfico TLS, no credenciales ni información clínica en texto claro.

**Escenarios de aceptación**:

1. **Dado** el README, **cuando** un revisor busque el caso de uso de enfermería, los servicios, los permisos por rol, la seguridad y los patrones de diseño, **entonces** cada tema se explicará junto con su propósito e idoneidad.
2. **Dada** la composición aprobada del equipo, **cuando** el README describa las contribuciones, **entonces** enumerará a los cinco integrantes existentes e indicará que el trabajo se compartió equitativamente, sin inventar responsabilidades individuales.
3. **Dada** una captura de Wireshark, **cuando** se entregue como evidencia, **entonces** demostrará el flujo de prueba HTTPS/TLS documentado y contendrá únicamente datos ficticios, sin credenciales, tokens ni información real de pacientes expuestos.

### Casos límite

- Una migración se ejecuta más de una vez o sobre un esquema que ya contiene la tabla de limitación.
- La base de datos no está disponible o tiene un nombre que no la identifica explícitamente como base de pruebas cuando se habilitan las pruebas E2E.
- Una solicitud autenticada falla con una respuesta 4xx o 5xx; aun así, el evento de auditoría debe evitar datos confidenciales.
- Una solicitud usa un rol no válido, un paciente fuera del ámbito del solicitante o datos de cuenta duplicados.
- Una captura contiene tráfico HTTP/MySQL sin cifrar, credenciales o registros no ficticios; no debe usarse como evidencia ni publicarse.
- Las excepciones aprobadas por el profesor para MySQL y un equipo de cinco integrantes deben describirse como aprobaciones, no presentarse como si fueran el texto literal del PDF original.

## Requisitos

### Requisitos funcionales

### Requisitos funcionales

- **REQ-001**: El esquema inicial de MySQL DEBE crear la tabla `login_throttle` con los campos, las restricciones de unicidad y los índices que requiere la implementación existente del bloqueo de inicio de sesión.
- **REQ-002**: Una migración numerada y no destructiva DEBE crear la misma tabla para instalaciones existentes, poder ejecutarse más de una vez de forma segura y documentarse junto con el procedimiento para realizar una copia de seguridad y aplicarla.
- **REQ-003**: El backend DEBE conservar el comportamiento de bloqueo de inicio de sesión para ámbitos de cuenta y dirección IP, devolver una respuesta de bloqueo temporal cuando un ámbito esté bloqueado y registrar los intentos fallidos sin guardar credenciales ni identificadores sin procesar.
- **REQ-004**: El acceso autenticado a los recursos pertinentes de la API DEBE generar un registro de auditoría con un identificador de actor no confidencial, rol, ruta/acción de la API, método HTTP y resultado; NO DEBE incluir cuerpos de solicitudes, encabezados de autorización, contraseñas, tokens ni datos clínicos innecesarios.
- **REQ-005**: Las pruebas del backend DEBEN cubrir al menos dos comportamientos unitarios independientes y al menos dos flujos HTTP de extremo a extremo con datos ficticios; las pruebas de extremo a extremo que usen MySQL DEBEN habilitarse explícitamente y negarse a ejecutarse si la base configurada no está identificada expresamente como base de pruebas.
- **REQ-006**: Las pruebas del backend DEBEN incluir acceso permitido y denegado según el rol, limitación de intentos de inicio de sesión, validación de entradas y registro duplicado, sin usar datos reales de pacientes ni cuentas.
- **REQ-007**: El frontend DEBE incluir pruebas de componentes React con React Testing Library o Jest, que cubran campos dependientes del rol y al menos un comportamiento de datos no válidos o mensajes de error.
- **REQ-008**: La documentación del repositorio DEBE explicar el problema y la solución de enfermería, las responsabilidades de los tres servicios activos, la matriz de roles y permisos, las medidas de seguridad y al menos tres patrones, indicando dónde se usan, qué problema resuelve cada uno y por qué es adecuado.
- **REQ-009**: La documentación del repositorio DEBE describir las excepciones aprobadas por el profesor para MySQL y un equipo de cinco integrantes, así como la distribución equitativa del trabajo solicitada por el usuario, sin inventar contribuciones individuales.
- **REQ-010**: La documentación de Wireshark DEBE proporcionar un procedimiento reproducible con datos ficticios y explicar los protocolos y las protecciones observados; la evidencia aceptable DEBE mostrar el flujo HTTPS/TLS sin credenciales, tokens ni datos clínicos reales expuestos.

### Entidades principales

- **Registro de limitación**: ámbito de cuenta/dirección IP con hash, cantidad y hora inicial de los intentos fallidos y vencimiento opcional del bloqueo temporal.
- **Evento de auditoría**: identificador y rol no confidenciales del actor, operación/ruta de la API, método, estado del resultado y fecha y hora.
- **Cuenta y paciente de prueba**: identidades y registros sintéticos restringidos a entornos de pruebas automatizadas.
- **Declaración de contribuciones del equipo**: lista de integrantes existentes y afirmación veraz de que el trabajo se distribuyó equitativamente.
- **Evidencia de red**: captura y breve explicación de un escenario HTTPS/TLS ficticio.

## Suposiciones

- La aprobación del profesor para usar MySQL y un equipo de hasta cinco integrantes es válida para esta entrega.
- El producto sigue siendo un prototipo educativo; las pruebas y demostraciones usan únicamente datos ficticios.
- Se debe conservar el comportamiento funcional existente de Flask y los contratos de la API, salvo que una prueba específica que falle demuestre que es necesario cambiar algo.
- Es posible que no haya un servidor MySQL en ejecución en el entorno de implementación. Las pruebas E2E con base de datos deben prepararse de forma segura, pero su resultado de ejecución debe informarse con honestidad.
- El archivo `.pcapng` existente no es aceptable como evidencia TLS porque los metadatos del protocolo muestran tráfico HTTP y MySQL, sin tramas TLS. No se deben examinar ni volver a publicar las cargas útiles de sus paquetes.

## Criterios de éxito

### Resultados medibles

- **SC-001**: Al aplicar el esquema inicial o la migración a su entorno de pruebas previsto, se crea la tabla de limitación completa y el flujo de inicio de sesión puede leerla y escribir en ella.
- **SC-002**: Pasan al menos dos flujos HTTP de extremo a extremo del backend y al menos dos pruebas significativas de componentes React con datos ficticios.
- **SC-003**: Todos los casos probados de roles y permisos devuelven el resultado esperado de autorización o denegación, incluida una solicitud denegada por intentar acceder a un paciente fuera del ámbito permitido.
- **SC-004**: Los registros de auditoría identifican las operaciones autenticadas y las pruebas confirman que no incluyen tokens, contraseñas, cuerpos de solicitudes ni datos clínicos.
- **SC-005**: El README y la documentación enlazada cubren todos los temas de entrega requeridos; el equipo de cinco integrantes y MySQL se identifican como excepciones aprobadas por el profesor.
- **SC-006**: Toda captura presentada como evidencia de seguridad muestra el flujo protegido por TLS documentado y no contiene credenciales, tokens ni datos reales de pacientes.
