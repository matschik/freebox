# Freebox for Node.js

> Simple authentication and secure requests to your Freebox OS server

- Node.js 24+ (ESM-first)
- Native `fetch` for HTTP (no Axios dependency)
- Written in TypeScript with generated typings
- Bundled with tsdown (ESM + CJS + `.d.ts`)

Official Freebox OS API documentation: https://dev.freebox.fr/sdk/os

## Install

```sh
pnpm add freebox
# or npm install freebox
```

## Quick start

### Register your app (local network only)

You must be on the Freebox local network to register an app. Visit https://mafreebox.freebox.fr to confirm.

```js
import {FreeboxRegister} from 'freebox';

const freeboxRegister = new FreeboxRegister({
	app_id: 'fbx.my_amazing_app',
	app_name: 'My Amazing App',
	app_version: '1.0.0',
	device_name: 'My cool PC',
});

// Obtaining an app_token & everything you need
// following the guide at https://dev.freebox.fr/sdk/os/login/
const access = await freeboxRegister.register();
console.log(access);
```

<p align="center">
  <br>
    <img src="freebox.gif" width="500">
    <br>
    <i>Freebox server LCD screen to authorize your app access.</i>
	<br>
  <br>
</p>

### Login & request your Freebox server

```js
import {Freebox} from 'freebox';

const freebox = new Freebox({
	app_token: 'etCEF2aytGPLWm1KZM0vIW/ziZOU58v/0qv9jUiJcedjadjaRZ/bflWSKy6HODORGUo6',
	app_id: 'fbx.my_amazing_app',
	api_domain: 'r42bhm9p.fbxos.fr',
	https_port: 35023,
	api_base_url: '/api/',
	api_version: '6.0',
});

// Open a session
await freebox.login();

// Get the current Wi-Fi global configuration
const response = await freebox.request({
	method: 'GET',
	url: 'wifi/config',
});

console.log(response.data);

// Close the current session
await freebox.logout();
```

## API (overview)

- `new FreeboxRegister(appIdentity?)`
  - `.register(options?)` → returns `{ app_token, app_id, api_domain, https_port, api_base_url, api_version }`
  - `.discovery()` → reads API info from the Freebox
  - `.requestAuthorization()` / `.getAuthorizationStatus(trackId)` / `.trackAuthorizationProgress(trackId)`
- `new Freebox(appRegistered)`
  - `.login(challenge?)` → resolves `{ session_token, permissions }`
  - `.logout()`
  - `.request(requestConfig)` → thin wrapper over native `fetch` with Axios-like response shape

All public APIs are fully typed. Hover in your editor or read the generated `dist/index.d.ts` for details.

## Development

```sh
pnpm build    # tsdown build (ESM + CJS + types)
pnpm test     # vitest
pnpm lint     # oxlint (voidzero)
pnpm format   # oxfmt (voidzero)
```

## License

[MIT License](LICENSE) Copyright (c) 2019-2025 Mathieu Schimmerling.
