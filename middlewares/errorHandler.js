module.exports = (err, req, res) => {
  const response = {}
  response.code = err.code || -1
  response.errorName = err.errorName || err.name || 'UnknownError'
  response.message = err.message || 'unknown error'
  res.status(response.status || 400).json(response)
}
