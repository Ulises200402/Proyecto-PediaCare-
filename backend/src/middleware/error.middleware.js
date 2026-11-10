export function errorHandler(error, request, response, next) {
  if (response.headersSent) return next(error)

  const statusCode = Number.isInteger(error.statusCode) ? error.statusCode : 500
  if (statusCode >= 500) {
  console.error('API request failed:', {
    code: error.code,
    message: error.message,
    sqlMessage: error.sqlMessage,
    stack: error.stack
  })
}

  return response.status(statusCode).json({
    error: statusCode === 503
      ? error.message
      : statusCode >= 500
        ? 'Error interno del servidor.'
        : error.message,
  })
}