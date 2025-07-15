const mongoose = require('mongoose')

const snailSchema = mongoose.Schema({
  name: String,
  speed: Number,
  concentration: Number,
  adrenalin: Number,
  character: String,
  wins: Number
})

snailSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject.__v
  }
})

module.exports = mongoose.model('Snail', snailSchema)