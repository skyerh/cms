const apiErrorNames = require('./apiErrorNames.js')

/**
 * defined error format
 */
class ApiError extends Error {
  constructor(errorName, data) {
    super()
    const errorInfo = apiErrorNames.getErrorInfo(errorName, data)
    this.code = errorInfo.code
    this.status = errorInfo.status
    this.title = errorInfo.title
    this.message = errorInfo.message
  }
}

class apiError {
  constructor(status, code, title, message) {
    this.status = status
    this.code = code
    this.title = title
    this.message = message
  }
}

module.exports = ApiError
