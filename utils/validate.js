const
  Ajv = require('ajv').default,
  ajv = new Ajv(),
  ApiError = require('../error/apiError'),
  apiErrorNames = require('../error/apiErrorNames')

class validation {
  /**
   * use AJV to validate the user's json schema
   * @param {Object} jsonSchema used to validate data
   * @param {Object} data used to be validated
   * @memberof validation
   */
  static validate(jsonSchema, data) {
    const validating = ajv.compile(jsonSchema)
    const valid = validating(data)
    if (!valid) {
      throw new ApiError(apiErrorNames.VALIDATION_ERROR, {
        errMsg: ajv.errorsText(validating.errors),
      })
    } else {
      return null
    }
  }

  static deviceId(token, data) {
    if (!data.deviceId) {
      throw new ApiError(apiErrorNames.NOT_FOUND, 'payload data something missing')
    }
    if (!token || !token.data || !token.data.devices || token.data.devices.length === 0) {
      throw new ApiError(apiErrorNames.TOKEN_IS_INVALID, 'token data something missing')
    }
    if (token.data.devices.includes(data.deviceId) === false) {
      throw new ApiError(apiErrorNames.TOKEN_IS_INVALID, 'deviceId is invalid.')
    }
  }

  static devices(token, data) {
    if (!data.devices || data.devices.length === 0) {
      throw new ApiError(apiErrorNames.NOT_FOUND, 'payload data something missing')
    }
    if (!token || !token.data || !token.data.devices || token.data.devices.length === 0) {
      console.log(token)
      throw new ApiError(apiErrorNames.TOKEN_IS_INVALID, 'token data something missing')
    }
    data.devices.forEach((item) => {
      if (token.data.devices.includes(item) === false) {
        throw new ApiError(apiErrorNames.TOKEN_IS_INVALID, 'deviceId is invalid.')
      }
    })
  }
}

module.exports = validation
