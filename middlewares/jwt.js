const
  jsonWebToken = require('jsonwebtoken'),
  ApiError = require('../error/apiError'),
  apiErrorNames = require('../error/apiErrorNames'),
  config = require('../config/index.js'),
  jwt = {}

jwt.verify = async (req, res, next) => {
  try {
    const authorization = req.get('authorization')
    if (!authorization) {
      throw new ApiError(apiErrorNames.USER_AUTH_NEEDED)
    }
    const token = authorization.replace('Bearer ', '')
    req.token = jsonWebToken.verify(token, config.server.JWTSecretKey)
    if (!req.token) {
      throw new ApiError(apiErrorNames.TOKEN_IS_INVALID)
    }
    next()
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      const expireErr = new ApiError(apiErrorNames.TOKEN_IS_EXPIRED)
      next(expireErr)
    }
    next(err)
  }
}

module.exports = jwt.verify
