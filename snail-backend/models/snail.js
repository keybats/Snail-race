const mongoose = require('mongoose')

const snailSchema = mongoose.Schema({
  name: String,
  character: String,
  wins: Number,
  stats: {
    speed: Number,
    concentration: Number,
    adrenalin: Number,
    confidence: Number,
    competitiveness: Number,
    perseverance: Number
  }

})

snailSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject.__v
  }
})

module.exports = mongoose.model('Snail', snailSchema)