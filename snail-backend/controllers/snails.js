const snailsRouter = require('express').Router()
const Snail = require('../models/snail')
const logger = require('../utils/logger.js')

const UpdateSnail = async (newSnail, id) => {
  
  return savedSnail = await Snail.findByIdAndUpdate(id, newSnail, { new: true })
  
}

snailsRouter.delete('/api/snails/:id', async (request, response) => {
  await Snail.findByIdAndDelete(request.params.id)
  response.status(204).end()
})

snailsRouter.put('/:id', async (request, response) => {
  const savedSnail = await UpdateSnail(request.body, request.params.id)
  response.json(savedSnail)
})

snailsRouter.post('/', async (request, response) => {
  logger.info(request.body)

  const newSnail = await new Snail({
    name: request.body.name,
    character: request.body.character,
    wins: 0,
    stats: request.body.stats
  })

  try {
    response.json(newSnail.save())  
  } 
  catch (error) {
    logger.error(error.message)
  }

})

snailsRouter.get('/', async (request, response) => {
  const snailList = await Snail.find({})
  response.json(snailList)
})

snailsRouter.get('/:id', async (request, response) => {
  const snailToFind = await Snail.findById(request.params.id)
  if (snailToFind) {
    response.json(snailToFind)
  } 
  else {
    response.status(404).end()
  }
})




module.exports = { router: snailsRouter, updateFunction: UpdateSnail}
