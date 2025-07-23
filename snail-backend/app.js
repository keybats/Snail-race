const express = require('express')
const mongoose = require('mongoose')
const config = require('./utils/config.js')
const logger = require('./utils/logger.js')
const accountsRouter = require('./controllers/accounts.js')
const snailsRouter = require('./controllers/snails.js')
const Snail = require('./models/snail.js')

const app = express()

const delayInMinutes = 1

let isRaceInProgress = false
let intervalID
let haveRacesStarted = false
let racingSnails = []
let winners = []
let previousTime = Date.now()
let timeDifference = 0
let timer = 60 * 1000 * delayInMinutes
let timerID
let raceLenght = 50
let weather = "clear"
const weatherList = ["clear", "hurricane", "peanuts"]

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
app.use('/api/snails', snailsRouter.router)

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
      return { ...request.body, id: request.body.info.id }
    }
    else {
      return snail
    }
  })
  response.json(updatedSnails)
})

 app.get('/api/state', async (request, response) => {
  const state = {
    ongoing: isRaceInProgress,
    deltaTime: timeDifference,
    RaceTimer: timer,
    RaceLength: raceLenght,
    weather: weather
  }
  response.json(state)
})

const CheckForWin = async (snails) => {
  const positions = snails.map(snail => snail.position)
  if (Math.max(...positions) >= raceLenght) {
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
    setInterval(BetweenRaces, 1000 * 2)
    timer = 1000 * 60 * delayInMinutes
    previousTime = Date.now()
    if (num === 1) {
      logger.info('win')
      const winner = snails.filter(snail => snail.position === Math.max(...positions))
      const winnerStats = winner[0].info
      const updatedWinner = { ...winnerStats._doc, wins: (winnerStats.wins + 1)}
      await Snail.findByIdAndUpdate(winner[0].info.id, updatedWinner, { new: true })
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
  const rawSpeed = snail.info.stats.speed
  let actualSpeed = rawSpeed * (snail.position * snail.info.stats.adrenalin / 300 + 1) 
  let position
  let message = 'Huh? Something went wrong'
  let alteredStats = snail.info
  const name = snail.info.name
  const chance = Math.random()
  if(weather === "hurricane" && chance < 0.1) {
    position = snail.position + Math.floor((Math.random() - 0.5) * 22)
    if (snail.position < position) {
      message = `${name} was picked up by the winds and blown forward`
      if (position > raceLenght - 1) {
        position = raceLenght - 1
      }
    }
    else if (snail.position > position) {
      message = `${name} was picked up by the winds and blown back`
    }
    else {
      message = `the wind is to strong for ${name} to move`
    }
  }
  else if (weather === "peanuts" && chance < 0.1) {
    const statTypes = Object.keys(snail.info.stats)
    const chosenType = statTypes[Math.floor(Math.random() * statTypes.length)]
    console.log('chosen type: ', chosenType)

    if (Math.random() > 0.5 /*snail.allergy*/ ) {
      message = `a peanut fell on ${name} and caused an allergic reaction`
      position = snail.position
      const previousValue = alteredStats.stats[chosenType]
      const modification = previousValue < 0 
        ? 1.1
        : 0.9

      alteredStats.stats[chosenType] *= modification

      message += `. Their ${chosenType} stat was dercreased by ${previousValue - alteredStats.stats[chosenType]}`

    }
    else {
      message = `${name} ate a fallen peanut and enjoyed it`
      position = snail.position
      const previousValue = alteredStats.stats[chosenType]
      const modification = alteredStats.stats[chosenType] < 0
        ? 0.9
        : 1.1

      alteredStats.stats[chosenType] *= modification

      message += `. Their ${chosenType} stat was increased by ${alteredStats.stats[chosenType] - previousValue}`
    }
  }  
  else if (chance < 0.5 - 0.04 * snail.info.stats.concentration) {
    position = snail.position
    message = `${name} retreated into their shell!` 
  }
  else if (chance < 0.75 - 0.04 * snail.info.stats.concentration) {
    position = snail.position + actualSpeed / 2
    message = `${name} is distracted.`
  }
  else if (chance > 1 - 0.04 * snail.info.stats.concentration) {
    position = snail.position + 2 * actualSpeed
    message = `${name} is determined!`
  }
  else {
    position = snail.position + actualSpeed
    message = `${name} continues on.`
  }

  if (position < 0) {
    position = 0
  }

  snailsRouter.updateFunction(alteredStats, alteredStats.id)

  return (

    {
      previousPosition: snail.position, //before the snails position is updated.
      position: position,
      message: message,
      info: alteredStats
    }

  )
}

const BetweenRaces = () => {
  timeDifference = Date.now() - previousTime
  previousTime = Date.now()
  timer -= timeDifference
}

const OnTick = async () => {
  logger.info('ticking')
  racingSnails = racingSnails.map(snail => SnailMove(snail))
  winners = await CheckForWin(racingSnails)
}

const StartRace = async () => {
  clearInterval(timerID)
  weather = weatherList[Math.floor(Math.random() * weatherList.length)]
  const allSnails = await Snail.find({})
  racingSnails = allSnails.map(snail => {
    return (
      {
        previousPosition: 0,
        position: 0,
        message: 'getting ready',
        info: snail
      }
    )
  })
  isRaceInProgress = true
  intervalID = setInterval(OnTick, 1000 * 3)
  
}

if (!haveRacesStarted) {
  StartRace()
  haveRacesStarted = true
}

module.exports = app