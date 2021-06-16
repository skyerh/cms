/**
 * defined API error names
 */
const apiErrorNames = {}
// 400
apiErrorNames.VALIDATION_ERROR = 'VALIDATION_ERROR'
apiErrorNames.STEP_IS_MISSING = 'STEP_IS_MISSING'
apiErrorNames.X_CLIENT_ID_IS_MISSING = 'X_CLIENT_ID_IS_MISSING'
apiErrorNames.X_KEY_HASH_IS_MISSING = 'X_KEY_HASH_IS_MISSING'
apiErrorNames.EMAIL_IS_MISSING = 'EMAIL_IS_MISSING'
apiErrorNames.PASSWORD_IS_MISSING = 'PASSWORD_IS_MISSING'
apiErrorNames.DEVICE_INFO_IS_MISSING = 'DEVICE_INFO_IS_MISSING'
apiErrorNames.INVALID_EMAIL_FORMAT = 'INVALID_EMAIL_FORMAT'

// 500
apiErrorNames.UNKNOWN_ERROR = 'UNKNOWN_ERROR'

const returnError = (errorName, data) => {
  const errorObj = {
    // ===============================================================================
    // ============================= 400 =============================================
    // ===============================================================================
    VALIDATION_ERROR: {
      status: 400,
      code: 100001,
      title: 'Invalid parameter',
      message: `Data validation error. ${data.errMsg}`,
    },
    STEP_IS_MISSING: {
      status: 400,
      code: 100002,
      title: 'startSteps',
      message: `The CMS JSON is missing the key: ${data.missingStep}.`,
    },
    // ===============================================================================
    // ============================= 500 =============================================
    // ===============================================================================
    UNKNOWN_ERROR: {
      status: 500,
      code: 100000,
      title: 'Unknown error',
      message: data.errMsg || 'The request can\'t be processed due to unknown server error. Please contact the admin for further support.',
    },
  }
  return errorObj[errorName]
}

apiErrorNames.getErrorInfo = (errorName, data = {}) => {
  let errorInfo
  if (errorName) {
    errorInfo = returnError(errorName, data)
  }
  if (!errorInfo) {
    errorInfo = returnError('UNKNOWN_ERROR')
  }
  return errorInfo
}

module.exports = apiErrorNames
