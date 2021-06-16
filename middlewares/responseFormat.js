module.exports = (req, res) => {
  const response = {}
  response.code = 0
  response.message = 'success'
  response.result = req.response
  res.status(response.status || 200).json(response)
}
