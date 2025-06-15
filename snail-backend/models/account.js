const mongoose = require('mongoose')

const accountSchema = mongoose.Schema({
  name: String,
  tokens: Number
})

accountSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject.__v
  }
})

module.exports = mongoose.model('Account', accountSchema)

