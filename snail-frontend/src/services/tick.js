import axios from "axios"

const baseUrl = 'api/tick'

const contactBackend = () => axios.post(baseUrl)

export default { contactBackend }