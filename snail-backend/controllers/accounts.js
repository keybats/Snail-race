const accountsRouter = require('express').Router()
const Account = require('../models/account')
const logger = require('../utils/logger')



accountsRouter.put('/', async (request, response) => {

  const updatedAccount = await Account.findOneAndUpdate({name: request.body.name}, request.body, {new: true})
  
  return response.json(updatedAccount)
})

accountsRouter.get('/', async (request, response) => {
  const accountList = await Account.find({})
  response.json(accountList)
})

accountsRouter.post('/',  async (request, response) => {

  const SameNameAccount = await Account.findOne({name: request.body.name})

  if(SameNameAccount) {
    try {
      const savedAccount = await SameNameAccount.save()

      return response.json(savedAccount)  
    } 
    catch (error) {
      logger.error(error.message)
    }
  }
  else {
    const newAccount = new Account({
      name: request.body.name,
      tokens: 5
    })
    try {
      const savedAccount = await newAccount.save()
      return response.json(savedAccount)  
    } 
    catch (error) {
      logger.error(error.message)
    }
  }
})

module.exports = accountsRouter