import { useState } from 'react'
import racingService from './services/racingSnails.js'
import winnerService from './services/winners.js'
import tickService from './services/tick.js'
import userServices from './services/login.js'
import stateServices from './services/state.js'


let winners = []
let intervalling = false
let loggedIn = false
let owedTokens = 0
let gainedTokens = 0
let keyCounter = 0
let bettingTime = false
let timer = 0
let firstWinFrame = true
let nextRaceTime = 0

const Race = ({track, result}) => {
  return <div>
      <pre>{track}</pre>
      <p>{result}</p>
  </div>
}

const Betting = ({results, visuals}) => {
  return <div>
    <h3>Betting</h3>
    <p>{results}</p>
    <pre>{visuals}</pre>
  </div>
}

const Timer = ({time, ongoing}) => {
  if (!ongoing) {
    return <p>about {Math.round(time/1000)} seconds until next race</p>
  }
  else {
    return <p></p>
  }
}

const User = ({tokens, name, login, input, inputHandler}) => {
  return <div>
      <p>{name}</p>
      <p>tokens: {tokens}</p>
      <button onClick={login}>Log in</button>
      <br/>
      Username <input value={input} onChange={inputHandler}></input>
  </div>
}

const CreateTrack = (snail) => {
  let newTrack = ['=']
  let limit = 25
  if (Math.floor(snail.position) + 1> 25) {
    limit = Math.floor(snail.position) + 1
  }
  for (let i = 0; i < limit; i++) {
    if (i < Math.floor(snail.position)) {
      newTrack = newTrack.concat('-')
    }
    else if (i === Math.floor(snail.position)) {
      newTrack = newTrack.concat(snail.stats.character)
    }
    else {
      newTrack = newTrack.concat('.')
    }
  }
  return newTrack.concat(';')
}

const ResetBets = (bets) => {
  return bets.map(bet => {return {snailName: bet.snailName, betCount: 0}})
}

const BetCase = (bets, button, userTokens) => {
  const htmlStats = bets.map(bet => {
    keyCounter++
    return <div key={ keyCounter }>
      <p>{ bet.snailName } { bet.betCount }</p>
      <button onClick={ () => button(ChangeBets(1, bet, bets, userTokens)) }>add</button>
      <button onClick={ () => button(ChangeBets(-1, bet, bets, userTokens)) }>remove</button>
    </div>
  })
  return htmlStats
}

const ChangeBets = (increase, snail, bets, userTokens) => {
  if ((increase > 0 && userTokens !== owedTokens) || (increase < 0 && snail.betCount > 0)) {
    console.log('changing bets')
    owedTokens += increase
    const newBets = bets.map(bet => {
      if (bet.snailName === snail.snailName) {
        return { snailName: bet.snailName, betCount: bet.betCount + increase }
      }
      else { return bet }
    })
    return newBets
  }
  else {
    return bets
  }

}

const Login = async (name, currentUser) => {
  console.log(loggedIn)
  if (!loggedIn) {
    loggedIn = true
    const user = await userServices.login(name)
    console.log(user)
    return user 
  }
  else {
    return currentUser
  }

}



const Update = async () => {
  console.log('ticking')
  winners = await winnerService.getWinners()
  const snails = await racingService.getAll()
  if (snails.length === 0) {
    console.log('yo')
    tickService.contactBackend()
  }
  const state = await stateServices.getState()
  nextRaceTime = state.RaceTimer 
  return snails
  
} 

const App = () => {

  const [snailsInRace, setSnailsInRace] = useState(0)
  const [UsernameInput, setUsernameInput] = useState('')
  const [user, setUser] = useState({
    name: 'not logged in',
    tokens: ''
  })
  const [bets, setBets] = useState(0)
  
  
  const handleUsernameInputChange = (event) => setUsernameInput(event.target.value)



  let result = 'race in progress...'
  let bettingResults = ''
  let track = 'loading...'
  let betsVisual = 'log in to bet'

  if (!intervalling) {
    intervalling = true

    setInterval(async () => {
      const newSnails = await Update()
      setSnailsInRace(newSnails)
    }, 1000 * 2)
  }

  if (snailsInRace.length) {

    if (bets === 0) {
      setBets(snailsInRace.map(snail => {
        const newBets = { snailName: snail.stats.name, betCount: 0}
        console.log(newBets)
        return newBets
      }))
    }
    else if (bettingTime && loggedIn) {
      betsVisual = BetCase(bets, setBets, user.tokens)
    }
    track = snailsInRace.map(snail => { return `${CreateTrack(snail).join(' ')} ${snail.message}` }).join('\r\n')

      

  }
  if (winners.length === 1) {
    if (firstWinFrame && loggedIn && bets !== 0) {
      gainedTokens = 0
      bets.map(bet => {
        if (bet.snailName === winners[0].stats.name) {
          gainedTokens += bet.betCount * 2
          
        }
      })
      
      const newUser = {name: user.name, tokens: user.tokens + gainedTokens}
      gainedTokens -= owedTokens
      userServices.update(newUser)
      setUser(newUser)
      setBets(ResetBets(bets))
      owedTokens = 0
      firstWinFrame = false
    }
    bettingResults = `you gained ${gainedTokens} tokens`
    result = `${winners[0].stats.name} wins! \n they have won ${winners[0].stats.wins + 1} times.`
    timer++
  }
  else if (winners.length > 1) {
    let winnerNames = []
    winners.forEach(winner => {
      winnerNames = winnerNames.concat(winner.stats.name)
    })
    result = `it is a draw between these snails: ${winnerNames.join(' and ')}`
    timer++
  }
  else {
    if (timer !== 0 ) {
      const newUser = {name: user.name, tokens: user.tokens - owedTokens}
      userServices.update(newUser)
      setUser({name: newUser.name, tokens: newUser.tokens})
      
    }
    bettingTime = false
    timer = 0
    firstWinFrame = true
    betsVisual = 'Bets locked in'

  }
  if (timer  === 1) {
    bettingTime = true
  }

  return (
    <div>
      <Race track={track} result={result}/>
      <Timer time={nextRaceTime} ongoing={!bettingTime} />
      <br/>
      <User name={user.name} tokens={user.tokens} login={async () => setUser( await Login(UsernameInput, user))} input={UsernameInput} inputHandler={handleUsernameInputChange}/>
      <Betting results={bettingResults} visuals={betsVisual}/>
    </div>
  )
}

export default App