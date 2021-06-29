const
  cmsController = require('./controller/cmsController')

module.exports = {
  cmsStart: cmsController.cmsStart,
  cmsStartNew: cmsController.cmsStartNew,
  cmsImport: cmsController.cmsImport,
  cmsList: cmsController.cmsList,
  cmsCallback: cmsController.cmsCallback,
}
