const
  evaluate = require('static-eval'),
  { parse } = require('esprima'),
  Traversal = require('@marilyn.m/object-traversal'),
  pointer = require('json-pointer'),
  fs = require('fs-extra'),
  ApiError = require('../error/apiError'),
  apiErrorNames = require('../error/apiErrorNames'),
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

const tagProcedure = (json, step, completed) => {
  // check the swtch conditions
  console.log(step.id)
  const nextStepId = switchStep(json, step)
  if (nextStepId) {
    step.nextStepId = nextStepId
  }

  if (step.stepType === 'tag' && completed === true) {
    step.completed = true
  }
}

const startProcedure = async (json, step) => {
  // check if the previous step are all completed
  let completed = true
  if (!step.noCompletedCheck || step.noCompletedCheck !== true) {
    completed = completedCheck(json, `/steps/${step.id}`)
  }

  switch (step.stepType) {
  case 'tag':
    tagProcedure(json, step, completed)
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

exports.cmsStart = async (req, res) => {
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
    let json = fs.readFileSync('./cms.json', { encoding: 'utf8', flag: 'r' })
    json = JSON.parse(json)
    validate.validate(jsonSchema, json)

    await startProcedure(json, pointer(json, json.startStep))
    resp.success(res, json)
  } catch (err) {
    resp.fail(res, err)
  }
}
