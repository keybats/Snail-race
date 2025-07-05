const racingSnailsRouter = require('express').Router()

racingSnailsRouter.get('/api/racing-snails', async (request, response) => {
    if (racingSnails) {
    response.json(racingSnails)
  } 
  else {
    response.status(404).end()
  }
}) 

racingSnailsRouter.post('/api/racing-snails', async (request, response) => {
  racingSnails = await request.body 
  response.json(racingSnails)
})

// racingSnailsRouter.put('/api/racing-snails/:id', async (request, response) => {
//   const updatedSnails = racingSnails.map(snail => {
//     if (snail.id === request.params.id) {
//       return { ...request.body, id: request.body.stats.id }
//     }
//     else {
//       return snail
//     }
//   })
// })

module.exports = racingSnailsRouter