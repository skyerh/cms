class Response {
  constructor(status, body) {
    this.statusCode = status
    this.headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
      'Access-Control-Allow-Methods': 'GET,PUT,POST,DELETE,PATCH,OPTIONS',
    }
    this.body = JSON.stringify(body)
  }
}

function success(res, data) {
  res.status(200).json(data)
}

function fail(res, errObj) {
  console.log(errObj)

  let body
  if (errObj.status) { // 正确结构
    body = {
      error: errObj,
    }
  } else if (errObj.code) { // 原IOT返回的结构
    body = {
      error: {
        status: 403,
        code: 103001,
        title: 'From iot',
        message: JSON.stringify(errObj), // ApiError() 的所有内容
      },
    }
  } else { // 500
    body = {
      error: {
        status: 500,
        code: 100000,
        title: 'Unknown Error',
        message: 'The request can\'t be processed due to unknown server error. Please contact the admin for further support.',
      },
    }
  }
  const { status } = body.error
  res.status(status).json(body)
}


module.exports = {
  success,
  fail,
}
