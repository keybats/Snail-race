import axios from 'axios'

const baseUrl = '/api/racing-snails'

const getAll = () => {
  const request = axios.get(baseUrl)
 
  return request.then(response => response.data)
}



const updateAll = (newObject) => {
  const request = axios.post(baseUrl, newObject)
  return request.then(response => response.data)
}

export default {getAll, updateAll}