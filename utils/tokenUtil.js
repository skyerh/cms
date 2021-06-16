const Jwt = require('jsonwebtoken');

const
  { GoogleAuth } = require('google-auth-library'),
  { URL } = require('url'),
  auth = new GoogleAuth()

exports.idTokenGet = async (target) => {
  try {
    const targetAudience = new URL(`${target}`)
    console.log(`[idTokenGet] url: ${target}`)
    const client = await auth.getIdTokenClient(targetAudience)
    return (await client.getRequestHeaders()).Authorization
  } catch (err) {
    console.error(`[idTokenGet] error: ${err}`)
  }
  return null
}

/**
 * JWT解密
 */
exports.decodeJwt = async (jwtToken) => {
  let decoded;
  try {
    decoded = Jwt.decode(jwtToken);
  } catch (error) {
    console.log("decodeJwt ERROR: " + JSON.stringify(error, null, 2));  //jwt异常
  }
  return decoded;
}