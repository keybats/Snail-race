import { useState } from 'react'
import racingService from './services/racingSnails.js'
import winnerService from './services/winners.js'
import tickService from './services/tick.js'
import UserServices from './services/login.js'


let winners = []
let intervalling = false
let loggedIn = false
let owedTokens = 0
let gainedTokens = 0
let keyCounter = 0
let bettingTime = false
let timer = 0
let firstWinFrame = true


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
    const user = await UserServices.login(name)
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
  let track = 'press "start" to begin'
  let betsVisual= 'log in to bet'
  
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
    track = snailsInRace.map(snail => { return `${snail.track.join(' ')} ${snail.message}` }).join('\r\n')
    if (!intervalling) {
      intervalling = true
      
      setInterval(async () => { const newSnails = await Update()
        setSnailsInRace(newSnails) }, 1000 * 2)
    }
      

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
      UserServices.update(newUser)
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
    console.log(winners.map(winner => {winner.stats.name}).join(' and '))
    result = `it is a draw between these snails: ${winners.map(winner => {winner.stats.name}).join(' and ')}`
    timer++
  }
  else {
    if (timer !== 0 ) {
      const newUser = {name: user.name, tokens: user.tokens - owedTokens}
      UserServices.update(newUser)
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
      <p>{user.name}</p>
      <p>tokens: {user.tokens}</p>
      <br/>
      <pre>{track}</pre>
      <p>{result}</p>
      <p>{bettingResults}</p>

      <button onClick={async ()=> {setSnailsInRace( await Update())}}>Start</button>
      <br/>
      <br/>
      Username <input value={UsernameInput} onChange={handleUsernameInputChange}></input>
      <br/>
      <button onClick={async () => setUser( await Login(UsernameInput, user))}>Log in</button>
      <br/>
      <br/>
      <p>Betting</p>
      <pre>{betsVisual}</pre>
    </div>
  )
}

export default App