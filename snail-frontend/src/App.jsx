import { useState } from 'react'
//import snailService from './services/snails.js'
import racingService from './services/racingSnails.js'
import winnerService from './services/winners.js'
let winners = []

const Update = () => {
  winnerService
    .getWinners()
    .then(winnerList => {
      winners = winnerList
    })
  return racingService
    .getAll()
    .then(snails => snails)
} 

const App = () => {

  const [snailsInRace, setSnailsInRace] = useState(0)
  
  console.log(snailsInRace)


  let result = 'race in progress...'
  let track = 'something is wrong'

  
  console.log(snailsInRace.length)
  if (snailsInRace.length) {
    console.log(snailsInRace)
    track = snailsInRace.map(snail => { return snail.track.join(' ') }).join('\r\n')
  }
  if (winners.length === 1) {
    
    result = `${winners[0].stats.name} wins! \n they have won ${winners[0].stats.wins + 1} times.`
    //snailService.update(winners[0].stats.id, { ...winners[0].stats, wins: winners[0].stats.wins + 1 })
    winners = []
  }
  else if (winners.length > 1) {
    console.log(winners.map(winner => {winner.stats.name}).join(' and '))
    result = `it is a draw between these snails: ${winners.map(winner => {winner.stats.name}).join(' and ')}`
  }

  return (
    <div>
      <pre>{track}</pre>
      <p>{result}</p>

      <button onClick={() => {Update().then(snails => setSnailsInRace(snails))}}>Update</button>
    </div>
  )
}

export default App