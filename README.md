React Holochain Hook
=========================

Provides React apps with easy access to [Holochain](https://holochain.org/) using the `useHolochain()` hook.

Encapsulates [hc-web-client](https://github.com/holochain/hc-web-client) in a [React Context](https://reactjs.org/docs/context.html), provides sensible connection status information, some automation and a few convenience functions. ♓️ 🦄🌈

[![npm version](https://img.shields.io/npm/v/react-holochain-hook.svg?style=flat-square)](https://www.npmjs.com/package/react-holochain-hook) [![npm downloads](https://img.shields.io/npm/dm/react-holochain-hook.svg?style=flat-square)](https://www.npmjs.com/package/react-holochain-hook) [![gzip size](https://flat.badgen.net/bundlephobia/minzip/react-holochain-hook)](https://bundlephobia.com/result?p=react-holochain-hook)

## Installation

Install it with yarn:

```
yarn add react-holochain-hook
```

Or with npm:

```
npm i react-holochain-hook --save
```

## Usage

### Setting up

```js
import { 
  ProvideHolochain, 
  useHolochain, 
  CONNECTION_STATUS 
  } from 'react-holochain-hook'

```

```js
const Connected = () => {
  const hc = useHolochain()
  const [connected, setConnected] = useState("Not connected")

  useEffect(() => {
    if (hc.status === CONNECTION_STATUS.CONNECTED) {
      setConnected("✅ Connected")
    }
  }, [hc.status])

  return connected
}

function App() {
  return (
    <div className="App">
      <ProvideHolochain options={{ url: 'ws://localhost:10003' }}>
        <Connected />
      </ProvideHolochain>
    </div>
  );
}
```

### Talk to Holochain, display data in React component

```js
import { useEffect, useState } from 'react'
```


```js
const CronutCounting = () => {
  const hc = useHolochain()
  const [cronutCount, setCronutCount] = useState(0)

  useEffect(() => {
    if (hc.status === CONNECTION_STATUS.CONNECTED) {
      try {
        hc.connection.callZome(
          'instance_id',
          'my_cronut_zome',
          'count_cronuts')()
          .then((result) => {
            const obj = JSON.parse(result)
            if (obj.Ok) {
              setCronutCount(obj.Ok)
            }
          })
      } catch (err) {
        console.log("Unable to count cronuts.")
      }
    }
  }, [hc.connection, hc.status,])

  return <div>{cronutCount} cronuts counted. 🍩🍩</div>
}
```


## API

### ProvideHolochain

Encapsulates [hc-web-client](https://github.com/holochain/hc-web-client) using a React Context, making holochain connection available throughout the application. 

Auto connects to Holochain when application starts. 

#### In development (`process.env.NODE_ENV === 'development'`):
- Attempt connection at `ws://localhost:3401`.
- Override port number by setting `process.env.REACT_APP_WSPORT`
- Manually set url by providing `options` prop.

#### In production
- Attempt to fetch connection settings from conductor at the auto generated `/_dna_connections.json`
- Manually set url by providing `options` prop.

Props: 
* `options` {Object}: (OPTIONAL) Client options that are also forwarded to `hc-web-client` and `rpc-websockets`.
  * `url`{String}: Websocket url to access Holochain.
  * `timeout` {Number}: Connection timeout in milliseconds. Defaults to `5000`.
  * `wsClient` {Object}: Client options that are also forwarded to `ws`.
    * `autoconnect` {Boolean}: Client autoconnect upon Client class instantiation. Defaults to `true`.
    * `reconnect` {Boolean}: Whether client should reconnect automatically once the connection is down. Defaults to `true`.
    * `reconnect_interval` {Number}: Time between adjacent reconnects. Defaults to `2000`.
    * `max_reconnects` {Number}: Maximum number of times the client should try to reconnect. Defaults to `5`. `0` means unlimited.

### useHolochain

Gives access to holochain connection, connection status, etc.

Returns object containing:
* `options` {Object}: Options for current connection (READ ONLY) 
* `connect` {Function}: Connect manually to Holochain using the same options as described for `ProvideHolochain`. Use only when `status` is `NOT_CONNECTED`or `CONNECT_FAILED`.
* `connection` {Any}: Exposes the underlying `hc-web-client` connection object with the `call`, and `callZome` functions. See [hc-web-client](https://github.com/holochain/hc-web-client) for details.
* `status` {Number}: Connection status using the values specified by `CONNECTION_STATUS`
* `setMeta(key, value)` {Function}: Convenience funtion to save connection related metadata during the lifespan of the connection.
* `meta`{Object}: Metadata object in the form of key/value pairs.

```
export const CONNECTION_STATUS = {
  NOT_CONNECTED: 0,
  CONNECTING: 1,
  CONNECTED: 2,
  ATTEMPTING_RECONNECT: 3,
  CONNECT_FAILED: 4
}
```

## Contributing

Yes, please do! Raise an issue or post a pull request. Let's make working with Holochain a breeze!

## TODO

- Add TypeScript types

## License

MIT