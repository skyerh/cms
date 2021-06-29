module.exports = {
  datastore: {
    projectId: process.env.projectId ? process.env.projectId : 'dynalink-iot-dev',
    kindFlow: { namespace: 'cms', kind: 'Flow' },
  },
}
