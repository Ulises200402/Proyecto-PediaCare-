# Lista de verificación de calidad de requisitos

## Cobertura de identificadores de requisitos
- [x] Los requisitos usan identificadores secuenciales `REQ-XXX`.
- [x] Los identificadores son únicos.
- [x] Cada elemento se vincula con un requisito de la consigna o con una excepción aprobada explícitamente por el usuario.

## Facilidad de prueba
- [x] Los requisitos se pueden probar de forma independiente.
- [x] Los escenarios de aceptación usan resultados concretos de Dado/Cuando/Entonces.
- [x] Las pruebas de extremo a extremo con base de datos tienen un límite de seguridad explícito para la base de pruebas.

## Integridad
- [x] Se documentan el alcance inicial y las suposiciones.
- [x] Los escenarios de usuario están priorizados.
- [x] Se cubren la base de datos, la seguridad, las pruebas, la documentación y la evidencia de Wireshark.
- [x] Los criterios de éxito son medibles y verificables.

## Alineación con la constitución
- [x] Se creó una constitución específica del proyecto para esta entrega.
- [x] Se explicitan las excepciones aprobadas por el usuario: MySQL y un equipo de cinco integrantes.
- [x] El alcance incluye únicamente datos ficticios.

## Estado de la evidencia después de la implementación
- [x] Se confirmó la lógica existente de `login_throttle` en tiempo de ejecución en el servicio de identidad.
- [x] El esquema para instalaciones nuevas y una migración idempotente ahora definen `login_throttle`.
- [x] Se añadieron al repositorio de trabajo la migración faltante y la guía de Wireshark.
- [x] Los metadatos de la captura existente indican tráfico HTTP y MySQL, sin tramas TLS; no se inspeccionó la carga útil.
- [x] Se instalaron React Testing Library, jsdom, Playwright y Chromium; las pruebas de componentes y del navegador pasan.
- [x] Se verificó que una nueva captura de una solicitud HTTPS ficticia solo contiene TLS según el filtro de captura `5173`.
- [x] `npm test` pasa: 26 pruebas de Node, 16 de pytest, 4 de Vitest y 2 de Playwright.
- [x] `npm run build`, `npm run lint` y la compilación de bytecode de Python terminan correctamente; lint informa una advertencia preexistente de pureza sobre `Date.now`.
- [x] La comprobación de inicio pasa para Vite y los tres servicios Flask; cada ruta OpenAPI devuelve HTTP 200.
- [ ] Dos flujos de extremo a extremo con MySQL siguen sin verificarse: no hay interfaz de línea de comandos de Docker ni servicio MySQL escuchando en los puertos 3306/3307. La suite predeterminada omite ambos de forma segura y se verificó que la protección de la base `_test` rechaza `pedia_care`.
