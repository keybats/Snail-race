import { useState } from 'react'

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

// const chars = {
//   empty: '.',
//   start: '=',
//   end: ';',
//   clear: '-'
// }







const UpdateTracks = (snails) => {
  const newTrack = snails.map(snail => {
    let track = ['=']
    for (let i = 0; i < 13; i++) {
      if (i < Math.floor(snail.position)) {
        track = track.concat('-')
      }
      else if (i === Math.floor(snail.position) ) {
        track = track.concat(snail.stats.character)
      }
      else {
        track = track.concat('.')
      }
      //console.log(track)
    }
    return (
      {
        track: track.concat(';'),
        position: snail.position,
        stats: snail.stats
      }
      
    )
  })
  return newTrack
}


//const raceStartPos = snails.map(snail => `${snail.name} =${snail.character}............;`) // 12 dots
  


const OnTick = (snails) => {
  const newPosition = snails.map(snail => {
    
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
        track: snail.track,
        position: position,
        stats: snail.stats
      }
      
    )
  })
  return UpdateTracks(newPosition) 
}



const App = () => {

  const [snailsInRace, setSnailsInRace] = useState(snails.map(snail => {
    return (
      {
        track: ['=', snail.character, '.', '.', '.', '.', '.', '.', '.', '.', '.', '.', '.', '.', ';'],
        position: 0,
        stats: snail
      }
    )
  }))



   

  let testVar = 'test in progress'

  if (snailsInRace[0]) {
    testVar = snailsInRace.map(snail => {return snail.track.join(' ')}).join('\r\n') 
  }

  return (
    <div>
      <pre>{testVar}</pre>
      <button onClick={() => setSnailsInRace(OnTick(snailsInRace))}>
        update
      </button>
    </div>
  )
}

export default App