import {Freebox} from '../index.js';

const freebox = new Freebox({
	app_token: 'QCVnxU9vNicWINUKmTwnH2A0BtgOecZgrn+ZHO6kpK2k5RFE5eF4tPp5O7CqkZjh',
	app_id: 'fbx.my_amazing_app',
	api_domain: 'zqpmz16x.fbxos.fr',
	https_port: 58_628,
	api_base_url: '/api/',
	api_version: '6.0',
});

// Open a session
// https://dev.freebox.fr/sdk/os/login/
await freebox.login();

// Get the current Wi-Fi global configuration
// https://dev.freebox.fr/sdk/os/wifi
const wifiConfigResponse = await freebox.request({
	method: 'GET',
	url: 'wifi/config',
});

console.log(wifiConfigResponse.data);

// Close the current session
// https://dev.freebox.fr/sdk/os/login/#closing-the-current-session
await freebox.logout();
