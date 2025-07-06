import axios from 'axios'

const baseUrl = '/api/state'

const isRaceOngoing = () => {
  const request = axios.get(baseUrl)
  return request.then(response => response.data)
}

export default { isRaceOngoing }
