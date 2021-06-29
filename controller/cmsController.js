const
  needle = require('needle'),
  evaluate = require('static-eval'),
  { parse } = require('esprima'),
  Traversal = require('@marilyn.m/object-traversal'),
  pointer = require('json-pointer'),
  fs = require('fs-extra'),
  { idTokenGet } = require('../utils/tokenUtil'),
  DatastoreModel = require('../model/datastoreModel'),
  datastoreModel = new DatastoreModel(),
  ApiError = require('../error/apiError'),
  apiErrorNames = require('../error/apiErrorNames'),
  crypto = require('../utils/crypto'),
  resp = require('../middlewares/httpResponse'),
  validate = require('../utils/validate')

const completedCheck = (json, nextStepId) => {
  const traversal = new Traversal(json.steps)
  const stepArr = traversal.where('nextStepId', nextStepId).value()
  let completed = true
  stepArr.forEach((item) => {
    if (typeof item === 'object') {
      if (item.completed === false) {
        completed = false
      }
    }
  })
  return completed
}

const switchStep = (json, step) => {
  let nextStepId = null
  if (step.switch && step.switch.length > 0) {
    step.switch.some((item) => {
      const ast = parse(item.condition).body[0].expression
      if (evaluate(ast, json) === true) {
        ({ nextStepId } = item)
        return true
      }
      return false
    })
  }
  return nextStepId
}

const eventProcedure = async (json, step, completed) => {
  const
    { method } = step,
    { query } = step,
    { body } = step,
    { url } = step,
    timestamp = new Date().getTime()

  console.log(timestamp)
  console.log(step.timestamp)
  console.log(step.timestamp + step.ttl)
  console.log(timestamp > (step.timestamp + step.ttl))
  if (completed === true && step.ongoing === false) {
    const token = await idTokenGet(url)
    if (token == null) {
      console.log(`${step.id} token not found.`)
      return null
    }

    const options = {
      headers: {
        Authorization: token,
      },
      json: true,
    }

    if (method.toLowerCase() === 'get') {
      await needle('get', url, query, options)
    } else {
      await needle('post', url, body, options)
    }

    step.ongoing = true
    if (!step.timestamp) {
      step.timestamp = timestamp
    }
    step.timestamp = new Date().getTime()
    await datastoreModel.cmsSave(json)
  } else if (completed === true && timestamp > (step.timestamp + step.ttl)) {
    step.output = step.default
    step.completed = true
    await datastoreModel.cmsSave(json)
  }
  return null
}

const programProcedure = async (json, step, completed) => {
  const
    { method } = step,
    { query } = step,
    { body } = step,
    { url } = step

  console.log('here')
  if (completed === true) {
    let output

    console.log(url)
    const token = await idTokenGet(url)
    if (token == null) {
      console.log(`${step.id} token not found.`)
      return null
    }

    const options = {
      headers: {
        Authorization: token,
      },
      json: true,
    }

    if (method.toLowerCase() === 'get') {
      output = await needle('get', url, query, options)
    } else {
      output = await needle('post', url, body, options)
    }

    step.output = output.body
    step.completed = true
    await datastoreModel.cmsSave(json)
  }
  return null
}

const httpProcedure = async (json, step, completed) => {
  const
    { method } = step,
    { query } = step,
    { body } = step

  let { url } = step,
    output

  if (completed === true) {
    // check if url is pointer
    if (pointer.has(json, url) === true) {
      url = pointer(json, url)
    }

    if (method.toLowerCase() === 'get') {
      output = await needle('get', url, query, { json: true })
    } else {
      output = await needle('post', url, body, { json: true })
    }

    step.output = output.body
    step.completed = true
    await datastoreModel.cmsSave(json)
  }
}

const tagProcedure = async (json, step, completed) => {
  if (completed === true) {
    // check the swtch conditions
    console.log(step.id)
    const nextStepId = switchStep(json, step)
    if (nextStepId) {
      step.nextStepId = nextStepId
    }
    step.completed = true
    await datastoreModel.cmsSave(json)
  }
}

const startProcedure = async (json, step) => {
  // check if the previous step are all completed
  let completed = true
  if (Object.prototype.hasOwnProperty.call(step, 'completedCheck') === false
    || step.completedCheck === true) {
    console.log(`checking ${step.id} ${step.completedCheck ? step.completedCheck : true}`)
    completed = completedCheck(json, `/steps/${step.id}`)
  }

  switch (step.stepType) {
  case 'tag':
    await tagProcedure(json, step, completed)
    break
  case 'http':
    await httpProcedure(json, step, completed)
    break
  case 'program':
    await programProcedure(json, step, completed)
    break
  case 'event':
    await eventProcedure(json, step, completed)
    break
  default:
    tagProcedure(json, step, completed)
  }

  if (step.nextStepId && step.completed === true) {
    const promises = step.nextStepId.map((item) => {
      return startProcedure(json, pointer(json, item))
    })
    await Promise.all(promises)
  }
}

exports.cmsImport = async (req, res) => {
  const jsonSchema = {
    type: 'object',
    properties: {
      startStep: {
        type: 'string',
        minLength: 1,
      },
      endStep: {
        type: 'string',
        minLength: 1,
      },
    },
    required: ['startStep', 'endStep'],
  }

  try {
    const data = req.body
    let json = fs.readFileSync('./cms.json', { encoding: 'utf8', flag: 'r' })
    json = JSON.parse(json)
    validate.validate(jsonSchema, json)

    data.startStep = json.startStep
    data.endStep = json.endStep
    data.stepType = json.stepType
    data.steps = json.steps
    data.description = json.description
    data.name = json.name
    data.id = crypto.uuid()
    data.createdAt = new Date().toISOString()

    await datastoreModel.cmsCreate(data)

    resp.success(res, json)
  } catch (err) {
    resp.fail(res, err)
  }
}

exports.cmsStartNew = async (req, res) => {
  const jsonSchema = {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        minLength: 1,
      },
      version: {
        type: 'string',
        minLength: 1,
      },
      steps: {
        type: 'object',
      },
    },
    required: ['name', 'version'],
  }

  try {
    const data = req.body
    validate.validate(jsonSchema, data)
    const json = await datastoreModel.cmsFind(data)
    json.id = crypto.uuid()
    json.version = data.version

    await startProcedure(json, pointer(json, json.startStep))
    resp.success(res, json)
  } catch (err) {
    resp.fail(res, err)
  }
}

exports.cmsStart = async (req, res) => {
  const jsonSchema = {
    type: 'object',
    properties: {
      id: {
        type: 'string',
        minLength: 1,
      },
    },
    required: ['id'],
  }

  try {
    const data = req.body
    validate.validate(jsonSchema, data)
    const json = await datastoreModel.cmsGet(data)

    await startProcedure(json, pointer(json, json.startStep))
    resp.success(res, json)
  } catch (err) {
    resp.fail(res, err)
  }
}

exports.cmsList = async (req, res) => {
  const jsonSchema = {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        minLength: 1,
      },
    },
    required: ['name'],
  }

  try {
    const data = req.body
    validate.validate(jsonSchema, data)
    const json = await datastoreModel.cmsList(data)
    resp.success(res, json)
  } catch (err) {
    resp.fail(res, err)
  }
}

exports.cmsCallback = async (req, res) => {
  const jsonSchema = {
    type: 'object',
    properties: {
      id: {
        type: 'string',
        minLength: 1,
      },
      step: {
        type: 'string',
        minLength: 1,
      },
      output: {
        type: 'object',
      },
    },
    required: ['id', 'step'],
  }

  try {
    const data = req.body
    validate.validate(jsonSchema, data)
    const json = await datastoreModel.cmsGet(data)
    if (json.steps[data.step].completed === false) {
      json.steps[data.step].completed = true
      json.steps[data.step].output = data.output

      await startProcedure(json, pointer(json, json.startStep))
      resp.success(res, json)
    } else {
      throw new ApiError(apiErrorNames.STEP_IS_ALREADY_COMPLETED, data)
    }
  } catch (err) {
    resp.fail(res, err)
  }
}
