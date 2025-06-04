import axios from 'axios'

const baseUrl = '/api/winners'

const getWinners = () => {
  const request = axios.get(baseUrl)
 
  return request.then(response => response.data)
}

export default {getWinners}