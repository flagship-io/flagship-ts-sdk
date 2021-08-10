export enum FlagshipContext{
    /**
     * Current device locale

     */
     DEVICE_LOCALE = '{"key":"sdk_deviceLanguage", "type":"string"}',
     /**
      * Current device type  tablet, pc, server, iot, other

      */
     DEVICE_TYPE = '{"key":"sdk_deviceType", "type":"string"}',
     /**
      * Current device model

      */
     DEVICE_MODEL = '{"key":"sdk_deviceModel", "type":"string"}',
     /**
      * Current visitor city

      */
     LOCATION_CITY = '{"key":"sdk_city", "type":"string"}',
     /**
      * Current visitor region

      */
     LOCATION_REGION = '{"key":"sdk_region", "type":"string"}',

     /**
      * Current visitor country

      */
     LOCATION_COUNTRY = '{"key":"sdk_country", "type":"string"}',

     /**
      * Current visitor latitude

      */
     LOCATION_LAT = '{"key":"sdk_lat", "type":"float"}',

     /**
      * Current visitor longitude

      */
     LOCATION_LONG = '{"key":"sdk_long", "type":"float"}',

     /**
      * Device public ip

      */
     IP = '{"key":"sdk_ip", "type":"string"}',

     /**
      * OS name

      */
     OS_NAME = '{"key":"sdk_osName", "type":"string"}',

     /**
      * OS version name

      */
     OS_VERSION_NAME = '{"key":"sdk_osVersionName", "type":"string"}',

     /**
      * OS version code

      */
     OS_VERSION_CODE = '{"key":"sdk_osVersionCode", "type":"float"}',

     /**
      * Carrier operator

      */
     CARRIER_NAME = '{"key":"sdk_carrierName", "type":"string"}',

     /**
      * Internet connection type : 4G, 5G, Fiber

      */
     INTERNET_CONNECTION = '{"key":"sdk_internetConnection", "type":"string"}',

     /**
      * Customer app version name

      */
     APP_VERSION_NAME = '{"key":"sdk_versionName", "type":"string"}',

     /**
      * Customer app version code

      */
     APP_VERSION_CODE = '{"key":"sdk_versionCode", "type":"float"}',

     /**
      * Current customer app interface name

      */
     INTERFACE_NAME = '{"key":"sdk_interfaceName", "type":"string"}',

     /**
      * Flagship SDK client name

      */
     FLAGSHIP_CLIENT = '{"key":"fs_client", "type":"string"}',

     /**
      * Flagship SDK version name

      */
     FLAGSHIP_VERSION = '{"key":"fs_version", "type":"string"}',

     /**
      * Current visitor id

      */
     FLAGSHIP_VISITOR = '{"key":"fs_users", "type":"string"}',
}
