/**
     * Current device locale
     */
export const DEVICE_LOCALE = 'sdk_deviceLanguage';
/**
  * Current device type  tablet, pc, server, iot, other

  */
export const DEVICE_TYPE = 'sdk_deviceType';
/**
  * Current device model
  */
export const DEVICE_MODEL = 'sdk_deviceModel';
/**
  * Current visitor city

  */
export const LOCATION_CITY = 'sdk_city';
/**
  * Current visitor region

  */
export const LOCATION_REGION = 'sdk_region';

/**
  * Current visitor country

  */
export const LOCATION_COUNTRY = 'sdk_country';

/**
  * Current visitor latitude

  */
export const LOCATION_LAT = 'sdk_lat';

/**
  * Current visitor longitude

  */
export const LOCATION_LONG = 'sdk_long';

/**
  * Device public ip

  */
export const IP = 'sdk_ip';

/**
  * OS name

  */
export const OS_NAME = 'sdk_osName';

/**
  * OS version name

  */
export const OS_VERSION_NAME = 'sdk_osVersionName';

/**
  * OS version code

  */
export const OS_VERSION_CODE = 'sdk_osVersionCode';

/**
  * Carrier operator
  */
export const CARRIER_NAME = 'sdk_carrierName';

/**
  * Internet connection type : 4G, 5G, Fiber

  */
export const INTERNET_CONNECTION = 'sdk_internetConnection';

/**
  * Customer app version name

  */
export const APP_VERSION_NAME = 'sdk_versionName';

/**
  * Customer app version code

  */
export const APP_VERSION_CODE = 'sdk_versionCode';

/**
  * Current customer app interface name

  */
export const INTERFACE_NAME = 'sdk_interfaceName';

/**
  * Flagship SDK client name

  */
export const FLAGSHIP_CLIENT = 'fs_client';

/**
  * Flagship SDK version name

  */
export const FLAGSHIP_VERSION = 'fs_version';

/**
  * Current visitor id

  */
export const FLAGSHIP_VISITOR = 'fs_users';

export const FLAGSHIP_CONTEXT:Record<string, string> = {
  [DEVICE_LOCALE]: 'string',
  [DEVICE_TYPE]: 'string',
  [DEVICE_MODEL]: 'string',
  [LOCATION_CITY]: 'string',
  [LOCATION_REGION]: 'string',
  [LOCATION_COUNTRY]: 'string',
  [LOCATION_LAT]: 'number',
  [LOCATION_LONG]: 'number',
  [IP]: 'string',
  [OS_NAME]: 'string',
  [OS_VERSION_NAME]: 'string',
  [OS_VERSION_CODE]: 'string',
  [CARRIER_NAME]: 'string',
  [INTERNET_CONNECTION]: 'string',
  [APP_VERSION_NAME]: 'string',
  [APP_VERSION_CODE]: 'string',
  [INTERFACE_NAME]: 'string',
  [FLAGSHIP_CLIENT]: 'string',
  [FLAGSHIP_VERSION]: 'string',
  [FLAGSHIP_VISITOR]: 'string'
};
