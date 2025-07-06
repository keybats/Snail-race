import axios from "axios"

const baseURL = '/api/accounts'

const login = (name) => {
  const request = axios.post(baseURL, {name: name})
  return request.then(request => {
    console.log(request.data)
    return request.data
  }) 
}

const update = (newAccount) => {
  const request = axios.put(baseURL, newAccount)
    return request.then(request => {
    return request.data
  }) 
}

export default {
  login,
  update
}