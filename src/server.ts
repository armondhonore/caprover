#!/usr/bin/env node

console.log('Captain Starting ...')

// Check if Captain is running as an installer or not.
import * as http from 'http'
import app, { initializeCaptainWithDelay } from './app'
import { AnyError } from './models/OtherTypes'
import CaptainManager from './user/system/CaptainManager'
import CaptainConstants from './utils/CaptainConstants'
import * as CaptainInstaller from './utils/CaptainInstaller'
import EnvVars from './utils/EnvVars'
import debugModule = require('debug')

const debug = debugModule('caprover:server')

function startServer() {
    if (CaptainConstants.isDebug) {
        console.log('***DEBUG BUILD***')
    }

    if (!EnvVars.IS_CAPTAIN_INSTANCE) {
        console.log('Installing Captain Service ...')
        CaptainInstaller.install()
        return
    }

    if (CaptainConstants.isNexlayerNative) {
        // Prime the salt + datastore encryption synchronously BEFORE we start
        // listening so the very first dashboard/API request can't race the
        // async init (the injector throws "Salt is not set" otherwise).
        try {
            CaptainManager.get().primeNexlayerNativeSaltSync()
        } catch (e) {
            console.error('Nexlayer-native salt prime failed (continuing): ' + e)
        }
    }

    initializeCaptainWithDelay()

    /**
     * Get port from environment and store in Express.
     */

    const port = CaptainConstants.serviceContainerPort3000
    app.set('port', port)

    /**
     * Create HTTP server.
     */

    const server = http.createServer(app)

    /**
     * Listen on provided port, on all network interfaces.
     */

    server.listen(port)
    server.on('error', onError)
    server.on('listening', onListening)

    /**
     * Event listener for HTTP server "error" event.
     */

    function onError(error: AnyError) {
        if (error.syscall !== 'listen') {
            throw error
        }

        const bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port

        // handle specific listen errors with friendly messages
        switch (error.code) {
            case 'EACCES':
                console.error(bind + ' requires elevated privileges')
                process.exit(1)
                break
            case 'EADDRINUSE':
                console.error(bind + ' is already in use')
                process.exit(1)
                break
            default:
                throw error
        }
    }

    /**
     * Event listener for HTTP server "listening" event.
     */

    function onListening() {
        const addr = server.address()
        const bind =
            typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr?.port
        debug('Listening on ' + bind)
    }
}

startServer()
