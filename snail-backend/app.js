const express = require('express')
const mongoose = require('mongoose')
const config = require('./utils/config.js')
const logger = require('./utils/logger.js')
const accountsRouter = require('./controllers/accounts.js')
const snailsRouter = require('./controllers/snails.js')
const Snail = require('./models/snail.js')

const app = express()

let isRaceInProgress = false
let intervalID
const delayInMinutes = 1
let haveRacesStarted = false
let racingSnails = []
let winners = []

console.log('connecting')
mongoose.connect(config.MONGODB_URI)
  .then(() => {
    console.log('connected to MongoDB')
  })
  .catch(error => {
    console.log('error connecting to MongoDB:', error.message)
  })

mongoose.set('strictQuery', false)

app.use(express.json())
app.use(express.static('dist'))

app.use('/api/accounts', accountsRouter)
app.use('/api/snails', snailsRouter)

app.post('/api/tick/', async (request, response) => {
  
  if (!haveRacesStarted) {
    StartRace()
    haveRacesStarted = true
  }
  response.status(200).end()
})

app.get('/api/racing-snails', async (request, response) => {
    if (racingSnails) {
    response.json(racingSnails)
  } 
  else {
    response.status(404).end()
  }
}) 

app.get('/api/winners', async (request, response) => {
  if (winners) {
    response.json(winners)
  } 
  else {
    response.status(404).end()
  }
}) 

app.post('/api/racing-snails', async (request, response) => {
  racingSnails = await request.body 
  response.json(racingSnails)
})

app.put('/api/racing-snails/:id', async (request, response) => {
  const updatedSnails = racingSnails.map(snail => {
    if (snail.id === request.params.id) {
      return { ...request.body, id: request.body.stats.id }
    }
    else {
      return snail
    }
  })
})

// app.get('/api/state', async (request, response) => {
//   const state = {
//     ongoing: isRaceInProgress
//   }
//   response.json(state)
// })

const CheckForWin = async (snails) => {
  const positions = snails.map(snail => snail.position)
  if (Math.max(...positions) >= 25) {
    let num = 0
    positions.forEach(position => {
      if (position === Math.max(...positions)) {
        num++
      }
    })
    isRaceInProgress = false
    clearInterval(intervalID)
    const d = new Date()
    endMinutes = d.getMinutes()
    setTimeout(StartRace, 1000 * 60 * delayInMinutes)
    if (num === 1) {
      logger.info('win')
      const winner = snails.filter(snail => snail.position === Math.max(...positions))
      const winnerStats = winner[0].stats
      const updatedWinner = { ...winnerStats._doc, wins: (winnerStats.wins + 1)}
      await Snail.findByIdAndUpdate(winner[0].stats.id, updatedWinner, { new: true })
      logger.info(updatedWinner)
      return winner
    }
    else {
      logger.info('draw')
      return snails.filter(snail => snail.position === Math.max(...positions))
    }
  }
  return []
}

const SnailMove = (snail) => {
  let position
  let message = 'Huh? Something went wrong'
  const name = snail.stats.name
  const chance = Math.random()
  if (chance < 0.5 - 0.04 * snail.stats.concentration) {
    position = snail.position
    message = `${name} retreated into their shell!` 
  }
  else if (chance < 0.75 - 0.04 * snail.stats.concentration) {
    position = snail.position + snail.stats.speed / 2
    message = `${name} is distracted.`
  }
  else if (chance > 1 - 0.04 * snail.stats.concentration) {
    position = snail.position + 2 * snail.stats.speed
    message = `${name} is determined!`
  }
  else {
    position = snail.position + snail.stats.speed
    message = `${name} continues on.`
  }

  return (

    {
      track: UpdateTrack(position, snail.stats.character),
      position: position,
      message: message,
      stats: snail.stats
    }

  )
}




const UpdateTrack = (snailPosition, char) => {
  let track = ['=']
  for (let i = 0; i < 25; i++) {
    if (i < Math.floor(snailPosition)) {
      track = track.concat('-')
    }
    else if (i === Math.floor(snailPosition)) {
      track = track.concat(char)
    }
    else {
      track = track.concat('.')
    }
  }
  return track.concat(';')
}

const OnTick = async () => {
  logger.info('ticking')
  racingSnails = racingSnails.map(snail => SnailMove(snail))
  winners = await CheckForWin(racingSnails)
}

const StartRace = async () => {
  const allSnails = await Snail.find({})
  racingSnails = allSnails.map(snail => {
    return (
      {
        track: [],
        position: 0,
        message: 'getting ready',
        stats: snail
      }
    )
  })
  isRaceInProgress = true
  intervalID = setInterval(OnTick, 1000 * 2)
}

module.exports = app