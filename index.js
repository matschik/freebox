import https from 'node:https';
import {createHmac} from 'node:crypto';
import axios from 'axios';

const FREEBOX_LOCAL_URL = 'https://mafreebox.freebox.fr';

// HTTPS Access: https://dev.freebox.fr/sdk/os/#https-access
const FREEBOX_ROOT_CA = `
-----BEGIN CERTIFICATE-----
MIIFmjCCA4KgAwIBAgIJAKLyz15lYOrYMA0GCSqGSIb3DQEBCwUAMFoxCzAJBgNV
BAYTAkZSMQ8wDQYDVQQIDAZGcmFuY2UxDjAMBgNVBAcMBVBhcmlzMRAwDgYDVQQK
DAdGcmVlYm94MRgwFgYDVQQDDA9GcmVlYm94IFJvb3QgQ0EwHhcNMTUwNzMwMTUw
OTIwWhcNMzUwNzI1MTUwOTIwWjBaMQswCQYDVQQGEwJGUjEPMA0GA1UECAwGRnJh
bmNlMQ4wDAYDVQQHDAVQYXJpczEQMA4GA1UECgwHRnJlZWJveDEYMBYGA1UEAwwP
RnJlZWJveCBSb290IENBMIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEA
xqYIvq8538SH6BJ99jDlOPoyDBrlwKEp879oYplicTC2/p0X66R/ft0en1uSQadC
sL/JTyfgyJAgI1Dq2Y5EYVT/7G6GBtVH6Bxa713mM+I/v0JlTGFalgMqamMuIRDQ
tdyvqEIs8DcfGB/1l2A8UhKOFbHQsMcigxOe9ZodMhtVNn0mUyG+9Zgu1e/YMhsS
iG4Kqap6TGtk80yruS1mMWVSgLOq9F5BGD4rlNlWLo0C3R10mFCpqvsFU+g4kYoA
dTxaIpi1pgng3CGLE0FXgwstJz8RBaZObYEslEYKDzmer5zrU1pVHiwkjsgwbnuy
WtM1Xry3Jxc7N/i1rxFmN/4l/Tcb1F7x4yVZmrzbQVptKSmyTEvPvpzqzdxVWuYi
qIFSe/njl8dX9v5hjbMo4CeLuXIRE4nSq2A7GBm4j9Zb6/l2WIBpnCKtwUVlroKw
NBgB6zHg5WI9nWGuy3ozpP4zyxqXhaTgrQcDDIG/SQS1GOXKGdkCcSa+VkJ0jTf5
od7PxBn9/TuN0yYdgQK3YDjD9F9+CLp8QZK1bnPdVGywPfL1iztngF9J6JohTyL/
VMvpWfS/X6R4Y3p8/eSio4BNuPvm9r0xp6IMpW92V8SYL0N6TQQxzZYgkLV7TbQI
Hw6v64yMbbF0YS9VjS0sFpZcFERVQiodRu7nYNC1jy8CAwEAAaNjMGEwHQYDVR0O
BBYEFD2erMkECujilR0BuER09FdsYIebMB8GA1UdIwQYMBaAFD2erMkECujilR0B
uER09FdsYIebMA8GA1UdEwEB/wQFMAMBAf8wDgYDVR0PAQH/BAQDAgGGMA0GCSqG
SIb3DQEBCwUAA4ICAQAZ2Nx8mWIWckNY8X2t/ymmCbcKxGw8Hn3BfTDcUWQ7GLRf
MGzTqxGSLBQ5tENaclbtTpNrqPv2k6LY0VjfrKoTSS8JfXkm6+FUtyXpsGK8MrLL
hZ/YdADTfbbWOjjD0VaPUoglvo2N4n7rOuRxVYIij11fL/wl3OUZ7GHLgL3qXSz0
+RGW+1oZo8HQ7pb6RwLfv42Gf+2gyNBckM7VVh9R19UkLCsHFqhFBbUmqwJgNA2/
3twgV6Y26qlyHXXODUfV3arLCwFoNB+IIrde1E/JoOry9oKvF8DZTo/Qm6o2KsdZ
dxs/YcIUsCvKX8WCKtH6la/kFCUcXIb8f1u+Y4pjj3PBmKI/1+Rs9GqB0kt1otyx
Q6bqxqBSgsrkuhCfRxwjbfBgmXjIZ/a4muY5uMI0gbl9zbMFEJHDojhH6TUB5qd0
JJlI61gldaT5Ci1aLbvVcJtdeGhElf7pOE9JrXINpP3NOJJaUSueAvxyj/WWoo0v
4KO7njox8F6jCHALNDLdTsX0FTGmUZ/s/QfJry3VNwyjCyWDy1ra4KWoqt6U7SzM
d5jENIZChM8TnDXJzqc+mu00cI3icn9bV9flYCXLTIsprB21wVSMh0XeBGylKxeB
S27oDfFq04XSox7JM9HdTt2hLK96x1T7FpFrBTnALzb7vHv9MhXqAT90fPR/8A==
-----END CERTIFICATE-----
`;

const httpsAgentConfig = {ca: FREEBOX_ROOT_CA, rejectUnauthorized: false};

export class FreeboxRegister {
	constructor({
		app_id,
		app_name,
		app_version = '1.0.0',
		device_name = 'NodeJS',
	} = {}) {
		// Generate defaults required
		const suffixId = `_${Math.random().toString(36).slice(2, 9)}`;

		if (!app_name && !app_id) {
			app_name = `nodejs_app${suffixId}`;
			app_id = `fbx.${app_name}`;
		}

		if (app_name && !app_id) {
			app_id = `fbx.${app_name}${suffixId}`;
		}

		if (!app_name && app_id) {
			app_name = `${app_id}${suffixId}`;
		}

		this.appIdentity = {app_id, app_name, app_version, device_name};
		this.baseURL = FREEBOX_LOCAL_URL;
		this.baseAPIURL = null;
		this.axiosInstance = axios.create({
			httpsAgent: new https.Agent(httpsAgentConfig),
		});
	}

	async register({silent = false} = {}) {
		let discoveryResponse;
		try {
			discoveryResponse = await this.discovery();
		} catch (error) {
			console.error(
				'\u001B[31m%s\u001B[0m',
				`Error: You are probably not connected to your Freebox network (check "${FREEBOX_LOCAL_URL}").`,
			);
			throw error;
		}

		const {api_domain, https_port, api_base_url, api_version} =
			discoveryResponse.data;

		this.baseAPIURL = `${this.baseURL}${api_base_url}v${api_version
			.slice(0, 1)
			.trim()}`;

		const {data} = await this.requestAuthorization(this.appIdentity);
		const {app_token, track_id} = data.result;

		if (!silent) {
			console.info(
				'\u001B[36m%s\u001B[0m',
				`Please check your Freebox Server LCD screen and authorize application access to register your app.`,
			);
		}

		await this.getAuthorizationStatus(track_id);
		const access = {
			app_token,
			app_id: this.appIdentity.app_id,
			api_domain,
			https_port,
			api_base_url,
			api_version,
		};

		if (!silent) {
			console.info(
				'\u001B[32m%s\u001B[0m',
				`Your app has been granted access !\nSave safely those following informations secret to connect to your Freebox API:`,
			);
			console.info(access);
		}

		return access;
	}

	async request(requestConfig) {
		return this.axiosInstance.request(requestConfig);
	}

	async discovery() {
		return this.request({
			method: 'GET',
			baseURL: this.baseURL,
			url: 'api_version',
		});
	}

	// Require to be connected to local freebox URL
	async requestAuthorization() {
		return this.request({
			method: 'POST',
			baseURL: this.baseAPIURL,
			url: 'login/authorize',
			data: this.appIdentity,
		});
	}

	async getAuthorizationStatus(track_id) {
		const authorizationStatus = {
			unknown: 'The app_token is invalid or has been revoked',
			pending: 'The user has not confirmed the authorization request yet',
			timeout:
				'The user did not confirmed the authorization within the given time',
			granted: 'The app_token is valid and can be used to open a session',
			denied: 'The user denied the authorization request',
		};

		return new Promise((resolve, reject) => {
			const checkTrackAuthorizationProgress = async () => {
				try {
					const response = await this.trackAuthorizationProgress(track_id);
					const {status} = response.data.result;

					if (status === 'pending') {
						return true;
					}

					if (status === 'granted') {
						clearInterval(intervalTrackAuthorizationProgress);
						resolve(true);
					} else {
						clearInterval(intervalTrackAuthorizationProgress);
						const endStatus = response.data.result.status;
						const errorData = response.data;
						// @TODO
						reject(
							new Error(
								`${authorizationStatus[endStatus]}: \n ${JSON.stringify(
									errorData,
									null,
									2,
								)}`,
							),
						);
					}
				} catch (error) {
					clearInterval(intervalTrackAuthorizationProgress);
					reject(error);
				}
			};

			const intervalTrackAuthorizationProgress = setInterval(
				checkTrackAuthorizationProgress,
				2 * 1000,
			);
		});
	}

	async trackAuthorizationProgress(track_id) {
		if (
			!track_id ||
			(typeof track_id !== 'string' && typeof track_id !== 'number')
		) {
			throw new Error('track_id must be a string or a number not null');
		}

		return this.request({
			method: 'GET',
			baseURL: this.baseAPIURL,
			url: `login/authorize/${track_id}`,
		});
	}
}

export class Freebox {
	constructor({
		app_token,
		api_domain = FREEBOX_LOCAL_URL,
		https_port,
		api_base_url = '/api/',
		api_version,
		app_id,
		app_version, // Optional to open session
	}) {
		const validationErrors = [];

		if (typeof api_domain !== 'string' || api_domain.length === 0) {
			validationErrors.push(`api_domain must be a string not empty.`);
		}

		if (typeof app_token !== 'string' || app_token.length === 0) {
			validationErrors.push(
				`app_token is required and must be a string not empty.`,
			);
		}

		if (typeof api_base_url !== 'string' || api_base_url.length === 0) {
			validationErrors.push(
				`api_base_url is required and must be a string not empty`,
			);
		}

		if (typeof api_version !== 'string' || api_version.length === 0) {
			validationErrors.push(
				`api_version is required and must be a string not empty`,
			);
		}

		if (typeof app_id !== 'string' || app_id.length === 0) {
			validationErrors.push(
				`app_id is required and must be a string not empty`,
			);
		}

		if (validationErrors.length > 0) {
			throw new Error(
				`Validation errors in Freebox constructor args: \n ${JSON.stringify(
					validationErrors,
					null,
					2,
				)}`,
			);
		}

		this.baseAPIURL = `https://${api_domain}${
			https_port ? ':' + https_port : ''
		}${api_base_url}v${api_version.split('.').shift().trim()}`;

		this.appToken = app_token;
		this.appVersion = app_version;
		this.appId = app_id;
		this.headers = {};

		this.axiosInstanceCache = null;
	}

	_getAxiosInstance(updateCache = false) {
		if (this.axiosInstanceCache && !updateCache) {
			return this.axiosInstanceCache;
		}

		// Secure HTTPS configuration
		// https://engineering.circle.com/https-authorized-certs-with-node-js-315e548354a2
		const axiosConfig = {
			baseURL: this.baseAPIURL,
			headers: this.headers,
		};

		if (axiosConfig.baseURL.includes('https://')) {
			axiosConfig.httpsAgent = new https.Agent(httpsAgentConfig);
		}

		const axiosInstance = axios.create(axiosConfig);
		this.axiosInstanceCache = axiosInstance;
		return axiosInstance;
	}

	async request(requestConfig) {
		let response;
		try {
			response = await this._getAxiosInstance().request(requestConfig);
		} catch (error) {
			if (!error.response) {
				throw error;
			}

			const {status, data} = error.response;
			const {
				error_code,
				result: {challenge},
			} = data;
			const isTokenExpired =
				status === 403 &&
				error_code === 'auth_required' &&
				this.headers['X-Fbx-App-Auth'];

			if (!isTokenExpired) {
				throw error;
			}

			// Token has expired, we need to login
			await this.login(challenge);

			// Execute once again the initial request
			response = await this._getAxiosInstance().request(requestConfig);
		}

		return response;
	}

	async login(challenge) {
		if (!challenge) {
			const challengeResponse = await this.getChallenge();
			challenge = challengeResponse.data.result.challenge;
		}

		const sessionStart = {
			app_id: this.appId,
			app_version: typeof this.appVersion === 'string' ? this.appVersion : null, // Optional
			password: createHmac('sha1', this.appToken)
				.update(challenge)
				.digest('hex'),
		};
		const openSessionResponse = await this.openSession(sessionStart);
		const {session_token, permissions} = openSessionResponse.data.result;
		this.headers['X-Fbx-App-Auth'] = session_token;
		this._getAxiosInstance(true); // Must update axios instance cache
		return {session_token, permissions};
	}

	async openSession(sessionStart) {
		return this.request({
			method: 'POST',
			url: 'login/session',
			data: sessionStart,
		});
	}

	async getChallenge() {
		return this.request({
			method: 'GET',
			url: 'login',
		});
	}

	async logout() {
		return this.request({
			method: 'POST',
			url: 'login/logout',
		});
	}
}
