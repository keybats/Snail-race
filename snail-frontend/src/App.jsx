import { useState } from 'react'

let winners = []
let autoRacing = false

const snails = [
  {
    name: 'Cornelious Cob',
    speed: 4,
    concentration: 1,
    character: 'C'
  },
  {
    name: 'Slimefoot',
    speed: 2,
    concentration: 6,
    character: '#'
  },
  {
    name: 'Sasha',
    speed: 3,
    concentration: 3,
    character: '>'
  }
]

//let isRaceOver = false

// const chars = {
//   empty: '.',
//   start: '=',
//   end: ';',
//   clear: '-'
// }

const CheckForWin = (snails) => {
  const positions = snails.map(snail => snail.position)
  if (Math.max(...positions) >= 25) {
    let num = 0
    positions.forEach(position => {
      if (position === Math.max(...positions)) {
        num++
      }
    })
    if (num === 1) {
      console.log('win')
      return snails.filter(snail => snail.position === Math.max(...positions))
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

  const chance = Math.random()
  console.log(snail.stats.name, chance)
  if (chance < 0.5 - 0.04 * snail.stats.concentration) {
    position = snail.position
  }
  else if (chance < 0.75 - 0.04 * snail.stats.concentration) {
    position = snail.position + snail.stats.speed / 2
  }
  else if (chance > 1 - 0.04 * snail.stats.concentration) {
    position = snail.position + 2 * snail.stats.speed
  }
  else {
    position = snail.position + snail.stats.speed
  }

  return (

    {
      track: UpdateTrack(position, snail.stats.character),
      position: position,
      stats: snail.stats
    }

  )
}

const Reset = (snails) => {
  
  winners = []
  return snails.map(snail => {
    return ({
      track: UpdateTrack(0, snail.stats.character),
      position: 0,
      stats: snail.stats
    })
  })
}

const UpdateTrack = (snailPosition, char) => {
  //autoRacing = false
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

const OnTick = (snails) => {
  const newSnails = snails.map(snail => SnailMove(snail))
  winners = CheckForWin(newSnails)
  return newSnails
}

// const AutoRace = (startSnails) => {
//   let currentSnails = startSnails 
//   setInterval(currentSnails = OnTick(currentSnails))
// }

// const OnRaceEnd = (snails) => {
//   save snails
//   +1 to wins and draws
// }

const App = () => {

  const [snailsInRace, setSnailsInRace] = useState(snails.map(snail => {
    return (
      {
        track: [],
        position: 0,
        stats: snail
      }
    )
  }))
  
  //console.log(winners.length)

  let result = 'race in progress...'
  let testVar = 'something is wrong'



  if (snailsInRace[0]) {
    testVar = snailsInRace.map(snail => { return snail.track.join(' ') }).join('\r\n')
  }
  if (winners.length === 1) {
    //console.log(winners[0].stats.name)
    result = `${winners[0].stats.name} wins!`
    autoRacing = false
  }
  else if (winners.length > 1) {
    console.log(winners[0].name)
    result = `it is a draw between these snails: ${winners.map(winner => {winner.stats.name}).join(', ')}`
    autoRacing = false
  }

  if (autoRacing) {
    setTimeout(setSnailsInRace, 2000, OnTick(snailsInRace))
  }

  return (
    <div>
      <pre>{testVar}</pre>

      <p>{result}</p>

      <button onClick={() => { 
        setSnailsInRace(Reset(snailsInRace))
        autoRacing = false
      }}>
        reset
      </button>
      <button onClick={() => setSnailsInRace(OnTick(snailsInRace))}>
        update
      </button>
      <button onClick={() => {
        autoRacing = !autoRacing
        setSnailsInRace(Reset(snailsInRace))
      }}>
        start auto race
      </button>
    </div>
  )
}

export default App