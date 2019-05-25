import { AxiosRequestConfig, AxiosResponse, AxiosError } from "axios";

declare module FreeboxNodeJS {
  interface AppIdentity {
    /**
    A unique `app_id` string.
    
    @default 'fbx.nodejs_app_{generatedId}'
		*/
    app_id?: string;

    /**
    A descriptive application name (will be displayed on lcd).
    
    @default 'nodejs_app_{generatedId}'
		*/
    app_name?: string;

    /**
    Your app version.
    
    @default '1.0.0'
		*/
    app_version?: string;

    /**
    The name of the device on which the app will be used.
    
    @default 'NodeJS'
		*/
    device_name?: string;
  }

  interface RegisterOptions {
    /**
    Prevent logging to console.
    
    @default  false
		*/
    silent?: boolean;
  }

  interface SessionStart {
    app_id: string;
    app_version?: string;
    password: string;
  }

  interface AppRegistered {
    /**
    Unique `app_token` provided after authorizing the app via `FreeboxRegister` class.
    This token has been associated with a set of default permissions.
		*/
    app_token: string;

    /**
    Same `app_id` used in TokenRequest to get the `app_token`.
		*/
    app_id: string;

    /**
    The domain to use in place of hardcoded Freebox IP.
    
    @default 'https://mafreebox.freebox.fr'
		*/
    api_domain?: string;

    /**
    Port to use for remote https access to the Freebox API.
		*/
    https_port?: number;

    /**
    The API root path on the HTTP server.
    
    @default '/api/'
		*/
    api_base_url?: string;

    /**
    The current API version on the Freebox.
		*/
    api_version: string;

    /**
    Same `app_version` used in TokenRequest (using `FreeboxRegister` class) to get the `app_token`.
		*/
    app_version?: string;
  }

  interface Session {
    session_token: string;
    permissions: Permissions;
  }

  interface Permissions {
    settings?: boolean; // Allow modifying the Freebox settings (reading settings is always allowed)
    contacts?: boolean; // Access to contact list
    calls?: boolean; // Access to call logs
    explorer?: boolean; // Access to filesystem
    downloader?: boolean; // Access to downloader
    parental?: boolean; // Access to parental control
    pvr?: boolean;
  }

  declare class FreeboxRegister {
    constructor(appIdentity?: AppIdentity);
    /**
		Register your app to the Freebox. It requires a manual input on Freebox LCD screen.
    @returns `Object` with all the informations needed to login and request your Freebox.
		*/
    register(options?: RegisterOptions): Access;
    request(requestConfig: AxiosRequestConfig): AxiosResponse;
    discovery(): AxiosResponse;
    requestAuthorization(): AxiosResponse;
    getAuthorizationStatus(track_id: number | string): boolean | AxiosError;
    trackAuthorizationProgress(track_id: number | string): AxiosResponse;
  }

  declare class Freebox {
    /**
    @returns Freebox instance
		*/
    constructor(appRegistered: AppRegistered);

    /**
    Requests the Freebox by passing an object `AxiosRequestConfig` (https://github.com/axios/axios#request-config).
    
    @returns `Object` AxiosResponse
		*/
    request(requestConfig: AxiosRequestConfig): AxiosResponse;

    /**
    Login to a Freebox by opening a session.
    
    @returns `Object` Session
		*/
    login(): Session;

    openSession(sessionStart: SessionStart): AxiosResponse;
    getChallenge(): AxiosResponse;

    /**
    Close the current session.
    
    @returns `Object` AxiosResponse
		*/
    logout(): AxiosResponse;
  }
}

export = FreeboxNodeJS;
