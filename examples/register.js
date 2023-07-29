import {FreeboxRegister} from '../index.js';

const freeboxRegister = new FreeboxRegister({
	app_id: 'fbx.my_amazing_app',
	app_name: 'My Amazing App',
	app_version: '1.0.0',
	device_name: 'My cool PC',
});

// Obtaining an app_token & everything you need
// following the guide at https://dev.freebox.fr/sdk/os/login/
await freeboxRegister.register();
