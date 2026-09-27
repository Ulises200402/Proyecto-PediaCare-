export function getHealth(request, response) {
  response.json({ status: 'ok', service: 'pediacare-api' })
}