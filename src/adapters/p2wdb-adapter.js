/*
  Adapter library for interacting with the P2WDB
*/

// Public npm libraries.
const axios = require('axios')
const { Write, Read } = require('p2wdb/index')

// Local libraries
const config = require('../../config')

class P2wdbAdapter {
  constructor (localConfig = {}) {
    // Dependency injection
    this.bchjs = localConfig.bchjs
    if (!this.bchjs) {
      throw new Error('Must pass an instance of bch-js when instantiating p2wdb.js adapter.')
    }

    // Encapsulate dependencies
    this.axios = axios
    this.config = config
    this.Write = Write
    this.Read = Read

    // Allow the localConfig to overwrite the config file values.
    this.p2wdbURL = localConfig.p2wdbURL || config.p2wdbUrl
  }

  // Write some data to the P2WDB
  async write (inputObj = {}) {
    try {
      const { appId = 'test', data = {}, wif } = inputObj

      if (typeof wif !== 'string' || !wif) {
        throw new Error('wif input must be a private key starting with the letter L or K')
      }

      const p2write = this.instantiateWriteLib(wif)

      const result = await p2write.postEntry(data, appId)

      return result.hash
    } catch (err) {
      console.error('Error in p2wdb.js/write()')
      throw err
    }
  }

  // Instantiate the Write library with a WIF, handling the various config
  // settings.
  instantiateWriteLib (wif) {
    try {
      // Object used to configure the Write library.
      let configObj = {}

      if (this.config.useFullStackCash) {
        // Use web 2 infrastructure.
        // bch-js and FullStack.cash

        configObj = {
          wif,
          serverURL: this.p2wdbURL,
          restURL: this.bchjs.restURL,
          apiToken: this.bchjs.apiToken
        }
      } else {
        // Use web 3 infrastructure.
        // ipfs-bch-wallet-consumer and bch-consumer library

        configObj = {
          wif,
          serverURL: this.p2wdbURL,
          interface: 'consumer-api',
          restURL: this.config.consumerUrl
        }
      }

      const write = new this.Write(configObj)

      return write
    } catch (err) {
      console.error('Error in p2wdb-adapter.js/instantitateWriteLib()')
      throw err
    }
  }

  // Returns a promise that resolves to true or false, to indicate if the
  // WIF controls the required funds to write to the P2WDB.
  async checkForSufficientFunds (wif) {
    try {
      if (typeof wif !== 'string' || !wif) {
        throw new Error('invalid wif to check for funds')
      }

      // Instatiate the Write library
      const p2write = this.instantiateWriteLib(wif)

      return await p2write.checkForSufficientFunds()
    } catch (err) {
      console.error('Error in p2wdb.js/checkForSufficientFunds()')
      throw err
    }
  }
}

module.exports = P2wdbAdapter
