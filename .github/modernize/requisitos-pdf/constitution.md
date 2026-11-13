<!--
Informe de impacto de sincronización
Cambio de versión: ninguna -> 1.0.0 (constitución inicial específica del proyecto para esta entrega).
Principios modificados: ninguno.
Secciones añadidas: cinco principios fundamentales, restricciones adicionales, flujo de desarrollo y gobernanza.
Secciones eliminadas: tecnologías objetivo (modo UPGRADE; se conserva la pila existente).
Plantillas que requieren actualización: verificación de la constitución en el plan de implementación (pendiente); especificación de funcionalidades (revisada); plantilla de tareas (pendiente).
Pendientes de seguimiento: confirmar con el equipo del proyecto la fecha formal de ratificación.
-->

# Constitución de entrega de PediaCare+

## Modo de migración

**Modo**: UPGRADE

**Justificación**: Este trabajo completa los requisitos del repositorio existente de PediaCare+. Conserva
el producto actual, el contrato de la API, la interfaz React, los servicios Flask y la base de datos MySQL aprobada.

## Principios fundamentales

### I. Conservar el comportamiento existente

Los cambios DEBEN limitarse a las brechas de requisitos aprobadas y conservar el comportamiento visible
para los usuarios, los contratos de la API y los datos almacenados. Los cambios de base de datos DEBEN
ser aditivos y no destructivos; las migraciones NO DEBEN eliminar ni reescribir registros existentes.

### II. Proteger los datos de pacientes y cuentas

Las pruebas y demostraciones DEBEN usar datos ficticios. Los registros NO DEBEN contener contraseñas,
tokens, encabezados de autorización, cuerpos de solicitudes ni información clínica innecesaria. Toda
acción protegida DEBE ser autorizada por el backend, independientemente de su visibilidad en el frontend.

### III. Verificar el comportamiento mediante pruebas

Cada cambio de comportamiento DEBE contar con una prueba de regresión específica. Las pruebas del
backend y frontend DEBEN usar datos ficticios deterministas. Toda prueba de extremo a extremo que use
una base de datos DEBE requerir habilitación explícita y negarse a conectar si la base configurada no
está claramente identificada como base de pruebas.

### IV. Mantener los cambios trazables y comprensibles

Cada tarea de implementación DEBE corresponder a uno o más requisitos de la especificación. La
documentación DEBE explicar la necesidad del usuario, la responsabilidad de cada servicio, los
permisos, los controles de seguridad y la elección de patrones de diseño, de forma que quienes revisen
el proyecto puedan contrastarlos con el código.

### V. Preferir cambios pequeños y confiables

Usar los patrones y las dependencias existentes en el repositorio cuando sea práctico. Añadir
abstracciones o dependencias únicamente cuando permitan cumplir un requisito directamente. Los errores
y la evidencia no verificada DEBEN informarse con precisión, no presentarse como trabajo completado.

## Restricciones adicionales

- El profesor aprobó MySQL en lugar de MongoDB para este proyecto.
- El profesor aprobó un equipo de cinco integrantes, aunque el PDF original limite el equipo a cuatro.
- La declaración de contribuciones del equipo DEBE describir un trabajo compartido equitativamente y
  NO DEBE inventar asignaciones individuales.
- El producto es un prototipo educativo y NO DEBE usarse con información real de pacientes.
- Una captura de red solo se acepta como evidencia de seguridad si usa datos ficticios y demuestra el
  flujo HTTPS/TLS documentado sin exponer credenciales ni información clínica.

## Flujo de desarrollo

- Revisar el código fuente, las pruebas y la documentación actual pertinentes antes de cambiar el comportamiento.
- Añadir o actualizar pruebas específicas junto con los cambios de implementación; ejecutar primero la prueba pertinente más acotada.
- Ejecutar los comandos de compilación, análisis estático y pruebas del repositorio después de cada conjunto coherente de cambios.
- Durante la validación, aplicar actualizaciones del esquema solo a una base de pruebas nueva o seleccionada explícitamente.
- Informar explícitamente las pruebas que usen base de datos y se hayan omitido, así como la falta de evidencia de Wireshark.

## Gobernanza

Esta constitución rige el trabajo de cumplimiento de requisitos descrito en la especificación de
funcionalidades enlazada. Las modificaciones requieren una justificación documentada, el acuerdo
explícito del equipo del proyecto y la actualización de la versión semántica y la fecha de la última
modificación. Los incrementos MINOR añaden o modifican sustancialmente un principio; PATCH aclara la
redacción sin cambiar las obligaciones; MAJOR cambia o elimina una obligación existente. Las
revisiones DEBEN comprobar la trazabilidad de requisitos, la evidencia de pruebas, la seguridad de los
datos y la coherencia de la documentación. La aprobación de MySQL y de un equipo de cinco integrantes
se registra como una excepción específica del proyecto a la consigna original, no como una modificación
de la consigna.

**Versión**: 1.0.0 | **Ratificada**: PENDIENTE(FECHA_DE_RATIFICACIÓN): confirmar con el equipo del proyecto | **Última modificación**: 2026-11-13
