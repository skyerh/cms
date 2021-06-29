const
  developmentEnv = require('./development.js'),
  productionEnv = require('./production.js')

module.exports = {
  development: developmentEnv,
  production: productionEnv,
}[process.env.NODE_ENV || 'development']
