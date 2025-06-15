const express = require('express')
const app = express()
require('dotenv').config()
const mongoose = require('mongoose')


const Snail = require('./models/snail')
const Account = require('./models/account')

app.use(express.json())
app.use(express.static('dist'))

let haveRacesStarted = false
let isRaceInProgress = false
//let endMinutes
let intervalID
const delayInMinutes = 1
mongoose.set('strictQuery', false)

app.get('/api/accounts', async (request, response) => {
  const accountList = await Account.find({})
  response.json(accountList)
})

app.post('/api/accounts',  async (request, response) => {
  console.log(request.body)
  const SameNameAccount = await Account.findOne({name: request.body.name})
  if(SameNameAccount) {
    try {
      console.log(SameNameAccount, 'exists')
      const savedNote = await SameNameAccount.save()
      return response.json(savedNote)  
    } 
    catch (error) {
      console.log(error.message)
    }
  }
  else {
    console.log('here')
    const newAccount = new Account({
      name: request.body.name,
      tokens: 5
    })
    try {
      const savedNote = await newAccount.save()
      return response.json(savedNote)  
    } 
    catch (error) {
      console.log(error.message)
    }
  }
})


app.get('/api/state', async (request, response) => {
  const state = {
    ongoing: isRaceInProgress
  }
  response.json(state)
})

app.post('/api/tick/', async (request, response) => {
  
  if (!haveRacesStarted) {
    StartRace()
    haveRacesStarted = true
  }
  response.status(200).end()
})

app.get('/api/snails', async (request, response) => {
  const snailList = await Snail.find({})
  response.json(snailList)
})

app.get('/api/snails/:id', async (request, response) => {
  const snailToFind = await Snail.findById(request.params.id)
  if (snailToFind) {
    response.json(snailToFind)
  } 
  else {
    response.status(404).end()
  }
})

app.post('/api/snails', async (request, response) => {
  console.log(request.body)

  const newSnail = await new Snail({
    name: request.body.name,
    speed: request.body.speed,
    concentration: request.body.concentration,
    character: request.body.character,
    wins: 0
  })

  try {
    response.json(newSnail.save())  
  } 
  catch (error) {
    console.log(error.message)
  }

})

app.put('/api/snails/:id', async (request, response) => {
  //console.log(request.body)
  const id = request.params.id
  const newSnail = 
  {
    name: request.body.name,
    speed: request.body.speed,
    concentration: request.body.concentration,
    character: request.body.character,
    wins: request.body.wins
  }
  
  console.log(newSnail)
  //const snail = await Snail.findById(request.params.id)
  if (!Snail) {
    return response.status(404).end()
  }
  console.log('here')
  savedSnail = await Snail.findByIdAndUpdate(id, newSnail, { new: true })
  console.log('after')
  response.json(savedSnail)
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
  console.log(request.body)
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

app.delete('/api/snails/:id', async (request, response) => {
  await Snail.findByIdAndDelete(request.params.id)
  response.status(204).end()
})

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
      console.log('win')
      const winner = snails.filter(snail => snail.position === Math.max(...positions))
      const winnerStats = winner[0].stats
      console.log(winnerStats)
      const updatedWinner = { ...winnerStats._doc, wins: (winnerStats.wins + 1)}
      await Snail.findByIdAndUpdate(winner[0].stats.id, updatedWinner, { new: true })
      console.log(updatedWinner)
      return winner
    }
    else {
      console.log('draw')
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
  //console.log(snail.stats.name, chance)
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

  //console.log(message, position)

  return (

    {
      track: UpdateTrack(position, snail.stats.character),
      position: position,
      message: message,
      stats: snail.stats
    }

  )
}

let racingSnails = []
let winners = []


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
  console.log('ticking')
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
const url = process.env.MONGODB_URI_SNAILS

console.log('connecting')
mongoose.connect(url)
  .then(() => {
    console.log('connected to MongoDB')
  })
  .catch(error => {
    console.log('error connecting to MongoDB:', error.message)
  })

const PORT = process.env.PORT || 3008
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})