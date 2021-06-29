const
  { Datastore } = require('@google-cloud/datastore'),
  config = require('../config'),
  flowKind = config.datastore.kindFlow.kind

class DatastoreModel {
  constructor() {
    this.datastore = new Datastore({
      namespace: config.datastore.kindFlow.namespace,
    })
  }

  /**
   * create a cms record
   *
   * @param {*} data
   * @return {*} promise
   * @memberof DatastoreModel
   */
  async cmsCreate(data) {
    const key = this.datastore.key([flowKind, data.id])
    const flow = {
      name: data.name,
      description: data.description,
      stepType: data.stepType,
      startStep: data.startStep,
      endStep: data.endStep,
      steps: data.steps,
      version: '0',
      createdAt: data.createdAt,
    }
    const entiy = {
      key,
      data: flow,
    }
    const [result] = await this.datastore.insert(entiy)
    return result
  }

  /**
   * Get a cms record
   *
   * @param {*} data
   * @return {*} promise
   * @memberof DatastoreModel
   */
  async cmsGet(data) {
    console.log(data)
    const key = this.datastore.key([flowKind, data.id])
    const [result] = await this.datastore.get(key)
    console.log(result)
    return result
  }

  /**
   * Find the original cms flow
   *
   * @param {*} data
   * @return {*} promise
   * @memberof DatastoreModel
   */
  async cmsFind(data) {
    const query = this.datastore
      .createQuery(flowKind)
      .filter('name', '=', data.name)
      .filter('version', '=', '0')
    const [result] = await this.datastore.runQuery(query)
    return result[0]
  }

  /**
   * Update the cms flow
   *
   * @param {*} data
   * @memberof DatastoreModel
   */
  async cmsSave(data) {
    const key = this.datastore.key([flowKind, data.id])
    data.updatedAt = new Date().toISOString()
    const entity = {
      key,
      data,
    }
    await this.datastore.save(entity)
  }

  /**
   * List cms records by name
   *
   * @param {*} data
   * @return {*} promise
   * @memberof DatastoreModel
   */
  async cmsList(data) {
    const query = this.datastore
      .createQuery(flowKind)
      .filter('name', '=', data.name)
    const [result] = await this.datastore.runQuery(query)
    return result
  }
}

module.exports = DatastoreModel
