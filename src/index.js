/* eslint-disable react/prop-types */
import React, { createContext, useContext, useEffect, useState } from 'react'
import { connect as hcConnect } from '@holochain/hc-web-client'

var CONDUCTOR_CONFIG = '/_dna_connections.json'

export const CONNECTION_STATUS = {
  NOT_CONNECTED: 0,
  CONNECTING: 1,
  CONNECTED: 2,
  ATTEMPTING_RECONNECT: 3,
  CONNECT_FAILED: 4
}

const OPTION_DEFAULTS = {
  wsClient: {
    reconnect_interval: 2000,
    max_reconnects: 5
  }
}

export const getHcOptions = async (options) => {
  options = options || {}
  let url
  if (process.env.NODE_ENV === 'development') {
    const port = process.env.REACT_APP_WSPORT || 3401
    url = `ws://localhost:${port}`
  } else {
    try {
      const data = await fetch(CONDUCTOR_CONFIG)
      const json = data.json()
      url = `ws://localhost:${json.dna_interface.driver.port}`
    } catch (err) {
      console.error(err)
    }
  }
  options = {
    url: url,
    ...OPTION_DEFAULTS,
    ...options,
    wsClient: {
      ...OPTION_DEFAULTS.wsClient,
      ...options.wsClient
    }
  }
  return options
}

const useProvideHolochain = (optionsOverride) => {
  const [options, setOptions] = useState(null)
  const [connection, setConnection] = useState(null)
  const [status, setStatus] = useState(CONNECTION_STATUS.NOT_CONNECTED)
  const [meta, _setMeta] = useState({})

  useEffect(() => {
    getHcOptions(optionsOverride).then((options) => setOptions(options))
  }, [optionsOverride])

  const connect = async () => {
    setStatus(CONNECTION_STATUS.CONNECTING)
    try {
      reset()
      await fetch(wsToHttp(options.url), { mode: 'no-cors' }) // Check if server is online
      const conn = await hcConnect(options) // Then connect ws
      conn.ws.on('close', onClose)
      conn.ws.on('open', onOpen)
      conn.ws.on('error', onError)
      setConnection(conn)
      setStatus(CONNECTION_STATUS.CONNECTED)
    } catch (err) {
      console.error(err)
      setStatus(CONNECTION_STATUS.CONNECT_FAILED)
    }
  }

  const reset = () => {
    connection && connection.close()
    meta !== {} && setMeta({})
  }

  const onOpen = async () => setStatus(CONNECTION_STATUS.CONNECTED)

  const onClose = () => {
    reset()
    setStatus(CONNECTION_STATUS.NOT_CONNECTED)
  }

  // Possibly bad assumption: Error means connection error
  let reconnectAttempts = 0
  const onError = () => {
    reconnectAttempts++
    if (reconnectAttempts === options.wsClient.max_reconnects - 1) {
      setStatus(CONNECTION_STATUS.CONNECT_FAILED)
      return
    }
    setStatus(CONNECTION_STATUS.ATTEMPTING_RECONNECT)
  }

  const setMeta = (key, value) => {
    if (meta[key] === value) {
      return
    }
    _setMeta({ [key]: value, ...meta })
  }

  return {
    options,
    connect,
    connection,
    status,
    meta,
    setMeta
  }
}

const wsToHttp = (url) => {
  url = url.replace('wss', 'https')
  url = url.replace('ws', 'http')
  return url
}

const hcContext = createContext()

export const ProvideHolochain = (props) => {
  const hc = useProvideHolochain(props.options)

  useEffect(() => {
    if (!hc.connection &&
      hc.status === CONNECTION_STATUS.NOT_CONNECTED &&
      hc.options
    ) {
      hc.connect()
    }
  }, [hc])

  return React.createElement(hcContext.Provider, {
    value: hc
  }, props.children);
}

export const useHolochain = () => {
  return useContext(hcContext)
}
