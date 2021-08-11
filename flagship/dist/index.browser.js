(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else {
		var a = factory();
		for(var i in a) (typeof exports === 'object' ? exports : root)[i] = a[i];
	}
})(self, function() {
return /******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "./node_modules/axios/index.js":
/*!*************************************!*\
  !*** ./node_modules/axios/index.js ***!
  \*************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

module.exports = __webpack_require__(/*! ./lib/axios */ "./node_modules/axios/lib/axios.js");

/***/ }),

/***/ "./node_modules/axios/lib/adapters/xhr.js":
/*!************************************************!*\
  !*** ./node_modules/axios/lib/adapters/xhr.js ***!
  \************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var utils = __webpack_require__(/*! ./../utils */ "./node_modules/axios/lib/utils.js");
var settle = __webpack_require__(/*! ./../core/settle */ "./node_modules/axios/lib/core/settle.js");
var cookies = __webpack_require__(/*! ./../helpers/cookies */ "./node_modules/axios/lib/helpers/cookies.js");
var buildURL = __webpack_require__(/*! ./../helpers/buildURL */ "./node_modules/axios/lib/helpers/buildURL.js");
var buildFullPath = __webpack_require__(/*! ../core/buildFullPath */ "./node_modules/axios/lib/core/buildFullPath.js");
var parseHeaders = __webpack_require__(/*! ./../helpers/parseHeaders */ "./node_modules/axios/lib/helpers/parseHeaders.js");
var isURLSameOrigin = __webpack_require__(/*! ./../helpers/isURLSameOrigin */ "./node_modules/axios/lib/helpers/isURLSameOrigin.js");
var createError = __webpack_require__(/*! ../core/createError */ "./node_modules/axios/lib/core/createError.js");

module.exports = function xhrAdapter(config) {
  return new Promise(function dispatchXhrRequest(resolve, reject) {
    var requestData = config.data;
    var requestHeaders = config.headers;

    if (utils.isFormData(requestData)) {
      delete requestHeaders['Content-Type']; // Let the browser set it
    }

    var request = new XMLHttpRequest();

    // HTTP basic authentication
    if (config.auth) {
      var username = config.auth.username || '';
      var password = config.auth.password ? unescape(encodeURIComponent(config.auth.password)) : '';
      requestHeaders.Authorization = 'Basic ' + btoa(username + ':' + password);
    }

    var fullPath = buildFullPath(config.baseURL, config.url);
    request.open(config.method.toUpperCase(), buildURL(fullPath, config.params, config.paramsSerializer), true);

    // Set the request timeout in MS
    request.timeout = config.timeout;

    // Listen for ready state
    request.onreadystatechange = function handleLoad() {
      if (!request || request.readyState !== 4) {
        return;
      }

      // The request errored out and we didn't get a response, this will be
      // handled by onerror instead
      // With one exception: request that using file: protocol, most browsers
      // will return status as 0 even though it's a successful request
      if (request.status === 0 && !(request.responseURL && request.responseURL.indexOf('file:') === 0)) {
        return;
      }

      // Prepare the response
      var responseHeaders = 'getAllResponseHeaders' in request ? parseHeaders(request.getAllResponseHeaders()) : null;
      var responseData = !config.responseType || config.responseType === 'text' ? request.responseText : request.response;
      var response = {
        data: responseData,
        status: request.status,
        statusText: request.statusText,
        headers: responseHeaders,
        config: config,
        request: request
      };

      settle(resolve, reject, response);

      // Clean up request
      request = null;
    };

    // Handle browser request cancellation (as opposed to a manual cancellation)
    request.onabort = function handleAbort() {
      if (!request) {
        return;
      }

      reject(createError('Request aborted', config, 'ECONNABORTED', request));

      // Clean up request
      request = null;
    };

    // Handle low level network errors
    request.onerror = function handleError() {
      // Real errors are hidden from us by the browser
      // onerror should only fire if it's a network error
      reject(createError('Network Error', config, null, request));

      // Clean up request
      request = null;
    };

    // Handle timeout
    request.ontimeout = function handleTimeout() {
      var timeoutErrorMessage = 'timeout of ' + config.timeout + 'ms exceeded';
      if (config.timeoutErrorMessage) {
        timeoutErrorMessage = config.timeoutErrorMessage;
      }
      reject(createError(timeoutErrorMessage, config, 'ECONNABORTED',
        request));

      // Clean up request
      request = null;
    };

    // Add xsrf header
    // This is only done if running in a standard browser environment.
    // Specifically not if we're in a web worker, or react-native.
    if (utils.isStandardBrowserEnv()) {
      // Add xsrf header
      var xsrfValue = (config.withCredentials || isURLSameOrigin(fullPath)) && config.xsrfCookieName ?
        cookies.read(config.xsrfCookieName) :
        undefined;

      if (xsrfValue) {
        requestHeaders[config.xsrfHeaderName] = xsrfValue;
      }
    }

    // Add headers to the request
    if ('setRequestHeader' in request) {
      utils.forEach(requestHeaders, function setRequestHeader(val, key) {
        if (typeof requestData === 'undefined' && key.toLowerCase() === 'content-type') {
          // Remove Content-Type if data is undefined
          delete requestHeaders[key];
        } else {
          // Otherwise add header to the request
          request.setRequestHeader(key, val);
        }
      });
    }

    // Add withCredentials to request if needed
    if (!utils.isUndefined(config.withCredentials)) {
      request.withCredentials = !!config.withCredentials;
    }

    // Add responseType to request if needed
    if (config.responseType) {
      try {
        request.responseType = config.responseType;
      } catch (e) {
        // Expected DOMException thrown by browsers not compatible XMLHttpRequest Level 2.
        // But, this can be suppressed for 'json' type as it can be parsed by default 'transformResponse' function.
        if (config.responseType !== 'json') {
          throw e;
        }
      }
    }

    // Handle progress if needed
    if (typeof config.onDownloadProgress === 'function') {
      request.addEventListener('progress', config.onDownloadProgress);
    }

    // Not all browsers support upload events
    if (typeof config.onUploadProgress === 'function' && request.upload) {
      request.upload.addEventListener('progress', config.onUploadProgress);
    }

    if (config.cancelToken) {
      // Handle cancellation
      config.cancelToken.promise.then(function onCanceled(cancel) {
        if (!request) {
          return;
        }

        request.abort();
        reject(cancel);
        // Clean up request
        request = null;
      });
    }

    if (!requestData) {
      requestData = null;
    }

    // Send the request
    request.send(requestData);
  });
};


/***/ }),

/***/ "./node_modules/axios/lib/axios.js":
/*!*****************************************!*\
  !*** ./node_modules/axios/lib/axios.js ***!
  \*****************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var utils = __webpack_require__(/*! ./utils */ "./node_modules/axios/lib/utils.js");
var bind = __webpack_require__(/*! ./helpers/bind */ "./node_modules/axios/lib/helpers/bind.js");
var Axios = __webpack_require__(/*! ./core/Axios */ "./node_modules/axios/lib/core/Axios.js");
var mergeConfig = __webpack_require__(/*! ./core/mergeConfig */ "./node_modules/axios/lib/core/mergeConfig.js");
var defaults = __webpack_require__(/*! ./defaults */ "./node_modules/axios/lib/defaults.js");

/**
 * Create an instance of Axios
 *
 * @param {Object} defaultConfig The default config for the instance
 * @return {Axios} A new instance of Axios
 */
function createInstance(defaultConfig) {
  var context = new Axios(defaultConfig);
  var instance = bind(Axios.prototype.request, context);

  // Copy axios.prototype to instance
  utils.extend(instance, Axios.prototype, context);

  // Copy context to instance
  utils.extend(instance, context);

  return instance;
}

// Create the default instance to be exported
var axios = createInstance(defaults);

// Expose Axios class to allow class inheritance
axios.Axios = Axios;

// Factory for creating new instances
axios.create = function create(instanceConfig) {
  return createInstance(mergeConfig(axios.defaults, instanceConfig));
};

// Expose Cancel & CancelToken
axios.Cancel = __webpack_require__(/*! ./cancel/Cancel */ "./node_modules/axios/lib/cancel/Cancel.js");
axios.CancelToken = __webpack_require__(/*! ./cancel/CancelToken */ "./node_modules/axios/lib/cancel/CancelToken.js");
axios.isCancel = __webpack_require__(/*! ./cancel/isCancel */ "./node_modules/axios/lib/cancel/isCancel.js");

// Expose all/spread
axios.all = function all(promises) {
  return Promise.all(promises);
};
axios.spread = __webpack_require__(/*! ./helpers/spread */ "./node_modules/axios/lib/helpers/spread.js");

// Expose isAxiosError
axios.isAxiosError = __webpack_require__(/*! ./helpers/isAxiosError */ "./node_modules/axios/lib/helpers/isAxiosError.js");

module.exports = axios;

// Allow use of default import syntax in TypeScript
module.exports.default = axios;


/***/ }),

/***/ "./node_modules/axios/lib/cancel/Cancel.js":
/*!*************************************************!*\
  !*** ./node_modules/axios/lib/cancel/Cancel.js ***!
  \*************************************************/
/***/ ((module) => {

"use strict";


/**
 * A `Cancel` is an object that is thrown when an operation is canceled.
 *
 * @class
 * @param {string=} message The message.
 */
function Cancel(message) {
  this.message = message;
}

Cancel.prototype.toString = function toString() {
  return 'Cancel' + (this.message ? ': ' + this.message : '');
};

Cancel.prototype.__CANCEL__ = true;

module.exports = Cancel;


/***/ }),

/***/ "./node_modules/axios/lib/cancel/CancelToken.js":
/*!******************************************************!*\
  !*** ./node_modules/axios/lib/cancel/CancelToken.js ***!
  \******************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var Cancel = __webpack_require__(/*! ./Cancel */ "./node_modules/axios/lib/cancel/Cancel.js");

/**
 * A `CancelToken` is an object that can be used to request cancellation of an operation.
 *
 * @class
 * @param {Function} executor The executor function.
 */
function CancelToken(executor) {
  if (typeof executor !== 'function') {
    throw new TypeError('executor must be a function.');
  }

  var resolvePromise;
  this.promise = new Promise(function promiseExecutor(resolve) {
    resolvePromise = resolve;
  });

  var token = this;
  executor(function cancel(message) {
    if (token.reason) {
      // Cancellation has already been requested
      return;
    }

    token.reason = new Cancel(message);
    resolvePromise(token.reason);
  });
}

/**
 * Throws a `Cancel` if cancellation has been requested.
 */
CancelToken.prototype.throwIfRequested = function throwIfRequested() {
  if (this.reason) {
    throw this.reason;
  }
};

/**
 * Returns an object that contains a new `CancelToken` and a function that, when called,
 * cancels the `CancelToken`.
 */
CancelToken.source = function source() {
  var cancel;
  var token = new CancelToken(function executor(c) {
    cancel = c;
  });
  return {
    token: token,
    cancel: cancel
  };
};

module.exports = CancelToken;


/***/ }),

/***/ "./node_modules/axios/lib/cancel/isCancel.js":
/*!***************************************************!*\
  !*** ./node_modules/axios/lib/cancel/isCancel.js ***!
  \***************************************************/
/***/ ((module) => {

"use strict";


module.exports = function isCancel(value) {
  return !!(value && value.__CANCEL__);
};


/***/ }),

/***/ "./node_modules/axios/lib/core/Axios.js":
/*!**********************************************!*\
  !*** ./node_modules/axios/lib/core/Axios.js ***!
  \**********************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var utils = __webpack_require__(/*! ./../utils */ "./node_modules/axios/lib/utils.js");
var buildURL = __webpack_require__(/*! ../helpers/buildURL */ "./node_modules/axios/lib/helpers/buildURL.js");
var InterceptorManager = __webpack_require__(/*! ./InterceptorManager */ "./node_modules/axios/lib/core/InterceptorManager.js");
var dispatchRequest = __webpack_require__(/*! ./dispatchRequest */ "./node_modules/axios/lib/core/dispatchRequest.js");
var mergeConfig = __webpack_require__(/*! ./mergeConfig */ "./node_modules/axios/lib/core/mergeConfig.js");

/**
 * Create a new instance of Axios
 *
 * @param {Object} instanceConfig The default config for the instance
 */
function Axios(instanceConfig) {
  this.defaults = instanceConfig;
  this.interceptors = {
    request: new InterceptorManager(),
    response: new InterceptorManager()
  };
}

/**
 * Dispatch a request
 *
 * @param {Object} config The config specific for this request (merged with this.defaults)
 */
Axios.prototype.request = function request(config) {
  /*eslint no-param-reassign:0*/
  // Allow for axios('example/url'[, config]) a la fetch API
  if (typeof config === 'string') {
    config = arguments[1] || {};
    config.url = arguments[0];
  } else {
    config = config || {};
  }

  config = mergeConfig(this.defaults, config);

  // Set config.method
  if (config.method) {
    config.method = config.method.toLowerCase();
  } else if (this.defaults.method) {
    config.method = this.defaults.method.toLowerCase();
  } else {
    config.method = 'get';
  }

  // Hook up interceptors middleware
  var chain = [dispatchRequest, undefined];
  var promise = Promise.resolve(config);

  this.interceptors.request.forEach(function unshiftRequestInterceptors(interceptor) {
    chain.unshift(interceptor.fulfilled, interceptor.rejected);
  });

  this.interceptors.response.forEach(function pushResponseInterceptors(interceptor) {
    chain.push(interceptor.fulfilled, interceptor.rejected);
  });

  while (chain.length) {
    promise = promise.then(chain.shift(), chain.shift());
  }

  return promise;
};

Axios.prototype.getUri = function getUri(config) {
  config = mergeConfig(this.defaults, config);
  return buildURL(config.url, config.params, config.paramsSerializer).replace(/^\?/, '');
};

// Provide aliases for supported request methods
utils.forEach(['delete', 'get', 'head', 'options'], function forEachMethodNoData(method) {
  /*eslint func-names:0*/
  Axios.prototype[method] = function(url, config) {
    return this.request(mergeConfig(config || {}, {
      method: method,
      url: url,
      data: (config || {}).data
    }));
  };
});

utils.forEach(['post', 'put', 'patch'], function forEachMethodWithData(method) {
  /*eslint func-names:0*/
  Axios.prototype[method] = function(url, data, config) {
    return this.request(mergeConfig(config || {}, {
      method: method,
      url: url,
      data: data
    }));
  };
});

module.exports = Axios;


/***/ }),

/***/ "./node_modules/axios/lib/core/InterceptorManager.js":
/*!***********************************************************!*\
  !*** ./node_modules/axios/lib/core/InterceptorManager.js ***!
  \***********************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var utils = __webpack_require__(/*! ./../utils */ "./node_modules/axios/lib/utils.js");

function InterceptorManager() {
  this.handlers = [];
}

/**
 * Add a new interceptor to the stack
 *
 * @param {Function} fulfilled The function to handle `then` for a `Promise`
 * @param {Function} rejected The function to handle `reject` for a `Promise`
 *
 * @return {Number} An ID used to remove interceptor later
 */
InterceptorManager.prototype.use = function use(fulfilled, rejected) {
  this.handlers.push({
    fulfilled: fulfilled,
    rejected: rejected
  });
  return this.handlers.length - 1;
};

/**
 * Remove an interceptor from the stack
 *
 * @param {Number} id The ID that was returned by `use`
 */
InterceptorManager.prototype.eject = function eject(id) {
  if (this.handlers[id]) {
    this.handlers[id] = null;
  }
};

/**
 * Iterate over all the registered interceptors
 *
 * This method is particularly useful for skipping over any
 * interceptors that may have become `null` calling `eject`.
 *
 * @param {Function} fn The function to call for each interceptor
 */
InterceptorManager.prototype.forEach = function forEach(fn) {
  utils.forEach(this.handlers, function forEachHandler(h) {
    if (h !== null) {
      fn(h);
    }
  });
};

module.exports = InterceptorManager;


/***/ }),

/***/ "./node_modules/axios/lib/core/buildFullPath.js":
/*!******************************************************!*\
  !*** ./node_modules/axios/lib/core/buildFullPath.js ***!
  \******************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var isAbsoluteURL = __webpack_require__(/*! ../helpers/isAbsoluteURL */ "./node_modules/axios/lib/helpers/isAbsoluteURL.js");
var combineURLs = __webpack_require__(/*! ../helpers/combineURLs */ "./node_modules/axios/lib/helpers/combineURLs.js");

/**
 * Creates a new URL by combining the baseURL with the requestedURL,
 * only when the requestedURL is not already an absolute URL.
 * If the requestURL is absolute, this function returns the requestedURL untouched.
 *
 * @param {string} baseURL The base URL
 * @param {string} requestedURL Absolute or relative URL to combine
 * @returns {string} The combined full path
 */
module.exports = function buildFullPath(baseURL, requestedURL) {
  if (baseURL && !isAbsoluteURL(requestedURL)) {
    return combineURLs(baseURL, requestedURL);
  }
  return requestedURL;
};


/***/ }),

/***/ "./node_modules/axios/lib/core/createError.js":
/*!****************************************************!*\
  !*** ./node_modules/axios/lib/core/createError.js ***!
  \****************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var enhanceError = __webpack_require__(/*! ./enhanceError */ "./node_modules/axios/lib/core/enhanceError.js");

/**
 * Create an Error with the specified message, config, error code, request and response.
 *
 * @param {string} message The error message.
 * @param {Object} config The config.
 * @param {string} [code] The error code (for example, 'ECONNABORTED').
 * @param {Object} [request] The request.
 * @param {Object} [response] The response.
 * @returns {Error} The created error.
 */
module.exports = function createError(message, config, code, request, response) {
  var error = new Error(message);
  return enhanceError(error, config, code, request, response);
};


/***/ }),

/***/ "./node_modules/axios/lib/core/dispatchRequest.js":
/*!********************************************************!*\
  !*** ./node_modules/axios/lib/core/dispatchRequest.js ***!
  \********************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var utils = __webpack_require__(/*! ./../utils */ "./node_modules/axios/lib/utils.js");
var transformData = __webpack_require__(/*! ./transformData */ "./node_modules/axios/lib/core/transformData.js");
var isCancel = __webpack_require__(/*! ../cancel/isCancel */ "./node_modules/axios/lib/cancel/isCancel.js");
var defaults = __webpack_require__(/*! ../defaults */ "./node_modules/axios/lib/defaults.js");

/**
 * Throws a `Cancel` if cancellation has been requested.
 */
function throwIfCancellationRequested(config) {
  if (config.cancelToken) {
    config.cancelToken.throwIfRequested();
  }
}

/**
 * Dispatch a request to the server using the configured adapter.
 *
 * @param {object} config The config that is to be used for the request
 * @returns {Promise} The Promise to be fulfilled
 */
module.exports = function dispatchRequest(config) {
  throwIfCancellationRequested(config);

  // Ensure headers exist
  config.headers = config.headers || {};

  // Transform request data
  config.data = transformData(
    config.data,
    config.headers,
    config.transformRequest
  );

  // Flatten headers
  config.headers = utils.merge(
    config.headers.common || {},
    config.headers[config.method] || {},
    config.headers
  );

  utils.forEach(
    ['delete', 'get', 'head', 'post', 'put', 'patch', 'common'],
    function cleanHeaderConfig(method) {
      delete config.headers[method];
    }
  );

  var adapter = config.adapter || defaults.adapter;

  return adapter(config).then(function onAdapterResolution(response) {
    throwIfCancellationRequested(config);

    // Transform response data
    response.data = transformData(
      response.data,
      response.headers,
      config.transformResponse
    );

    return response;
  }, function onAdapterRejection(reason) {
    if (!isCancel(reason)) {
      throwIfCancellationRequested(config);

      // Transform response data
      if (reason && reason.response) {
        reason.response.data = transformData(
          reason.response.data,
          reason.response.headers,
          config.transformResponse
        );
      }
    }

    return Promise.reject(reason);
  });
};


/***/ }),

/***/ "./node_modules/axios/lib/core/enhanceError.js":
/*!*****************************************************!*\
  !*** ./node_modules/axios/lib/core/enhanceError.js ***!
  \*****************************************************/
/***/ ((module) => {

"use strict";


/**
 * Update an Error with the specified config, error code, and response.
 *
 * @param {Error} error The error to update.
 * @param {Object} config The config.
 * @param {string} [code] The error code (for example, 'ECONNABORTED').
 * @param {Object} [request] The request.
 * @param {Object} [response] The response.
 * @returns {Error} The error.
 */
module.exports = function enhanceError(error, config, code, request, response) {
  error.config = config;
  if (code) {
    error.code = code;
  }

  error.request = request;
  error.response = response;
  error.isAxiosError = true;

  error.toJSON = function toJSON() {
    return {
      // Standard
      message: this.message,
      name: this.name,
      // Microsoft
      description: this.description,
      number: this.number,
      // Mozilla
      fileName: this.fileName,
      lineNumber: this.lineNumber,
      columnNumber: this.columnNumber,
      stack: this.stack,
      // Axios
      config: this.config,
      code: this.code
    };
  };
  return error;
};


/***/ }),

/***/ "./node_modules/axios/lib/core/mergeConfig.js":
/*!****************************************************!*\
  !*** ./node_modules/axios/lib/core/mergeConfig.js ***!
  \****************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var utils = __webpack_require__(/*! ../utils */ "./node_modules/axios/lib/utils.js");

/**
 * Config-specific merge-function which creates a new config-object
 * by merging two configuration objects together.
 *
 * @param {Object} config1
 * @param {Object} config2
 * @returns {Object} New object resulting from merging config2 to config1
 */
module.exports = function mergeConfig(config1, config2) {
  // eslint-disable-next-line no-param-reassign
  config2 = config2 || {};
  var config = {};

  var valueFromConfig2Keys = ['url', 'method', 'data'];
  var mergeDeepPropertiesKeys = ['headers', 'auth', 'proxy', 'params'];
  var defaultToConfig2Keys = [
    'baseURL', 'transformRequest', 'transformResponse', 'paramsSerializer',
    'timeout', 'timeoutMessage', 'withCredentials', 'adapter', 'responseType', 'xsrfCookieName',
    'xsrfHeaderName', 'onUploadProgress', 'onDownloadProgress', 'decompress',
    'maxContentLength', 'maxBodyLength', 'maxRedirects', 'transport', 'httpAgent',
    'httpsAgent', 'cancelToken', 'socketPath', 'responseEncoding'
  ];
  var directMergeKeys = ['validateStatus'];

  function getMergedValue(target, source) {
    if (utils.isPlainObject(target) && utils.isPlainObject(source)) {
      return utils.merge(target, source);
    } else if (utils.isPlainObject(source)) {
      return utils.merge({}, source);
    } else if (utils.isArray(source)) {
      return source.slice();
    }
    return source;
  }

  function mergeDeepProperties(prop) {
    if (!utils.isUndefined(config2[prop])) {
      config[prop] = getMergedValue(config1[prop], config2[prop]);
    } else if (!utils.isUndefined(config1[prop])) {
      config[prop] = getMergedValue(undefined, config1[prop]);
    }
  }

  utils.forEach(valueFromConfig2Keys, function valueFromConfig2(prop) {
    if (!utils.isUndefined(config2[prop])) {
      config[prop] = getMergedValue(undefined, config2[prop]);
    }
  });

  utils.forEach(mergeDeepPropertiesKeys, mergeDeepProperties);

  utils.forEach(defaultToConfig2Keys, function defaultToConfig2(prop) {
    if (!utils.isUndefined(config2[prop])) {
      config[prop] = getMergedValue(undefined, config2[prop]);
    } else if (!utils.isUndefined(config1[prop])) {
      config[prop] = getMergedValue(undefined, config1[prop]);
    }
  });

  utils.forEach(directMergeKeys, function merge(prop) {
    if (prop in config2) {
      config[prop] = getMergedValue(config1[prop], config2[prop]);
    } else if (prop in config1) {
      config[prop] = getMergedValue(undefined, config1[prop]);
    }
  });

  var axiosKeys = valueFromConfig2Keys
    .concat(mergeDeepPropertiesKeys)
    .concat(defaultToConfig2Keys)
    .concat(directMergeKeys);

  var otherKeys = Object
    .keys(config1)
    .concat(Object.keys(config2))
    .filter(function filterAxiosKeys(key) {
      return axiosKeys.indexOf(key) === -1;
    });

  utils.forEach(otherKeys, mergeDeepProperties);

  return config;
};


/***/ }),

/***/ "./node_modules/axios/lib/core/settle.js":
/*!***********************************************!*\
  !*** ./node_modules/axios/lib/core/settle.js ***!
  \***********************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var createError = __webpack_require__(/*! ./createError */ "./node_modules/axios/lib/core/createError.js");

/**
 * Resolve or reject a Promise based on response status.
 *
 * @param {Function} resolve A function that resolves the promise.
 * @param {Function} reject A function that rejects the promise.
 * @param {object} response The response.
 */
module.exports = function settle(resolve, reject, response) {
  var validateStatus = response.config.validateStatus;
  if (!response.status || !validateStatus || validateStatus(response.status)) {
    resolve(response);
  } else {
    reject(createError(
      'Request failed with status code ' + response.status,
      response.config,
      null,
      response.request,
      response
    ));
  }
};


/***/ }),

/***/ "./node_modules/axios/lib/core/transformData.js":
/*!******************************************************!*\
  !*** ./node_modules/axios/lib/core/transformData.js ***!
  \******************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var utils = __webpack_require__(/*! ./../utils */ "./node_modules/axios/lib/utils.js");

/**
 * Transform the data for a request or a response
 *
 * @param {Object|String} data The data to be transformed
 * @param {Array} headers The headers for the request or response
 * @param {Array|Function} fns A single function or Array of functions
 * @returns {*} The resulting transformed data
 */
module.exports = function transformData(data, headers, fns) {
  /*eslint no-param-reassign:0*/
  utils.forEach(fns, function transform(fn) {
    data = fn(data, headers);
  });

  return data;
};


/***/ }),

/***/ "./node_modules/axios/lib/defaults.js":
/*!********************************************!*\
  !*** ./node_modules/axios/lib/defaults.js ***!
  \********************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var utils = __webpack_require__(/*! ./utils */ "./node_modules/axios/lib/utils.js");
var normalizeHeaderName = __webpack_require__(/*! ./helpers/normalizeHeaderName */ "./node_modules/axios/lib/helpers/normalizeHeaderName.js");

var DEFAULT_CONTENT_TYPE = {
  'Content-Type': 'application/x-www-form-urlencoded'
};

function setContentTypeIfUnset(headers, value) {
  if (!utils.isUndefined(headers) && utils.isUndefined(headers['Content-Type'])) {
    headers['Content-Type'] = value;
  }
}

function getDefaultAdapter() {
  var adapter;
  if (typeof XMLHttpRequest !== 'undefined') {
    // For browsers use XHR adapter
    adapter = __webpack_require__(/*! ./adapters/xhr */ "./node_modules/axios/lib/adapters/xhr.js");
  } else if (typeof process !== 'undefined' && Object.prototype.toString.call(process) === '[object process]') {
    // For node use HTTP adapter
    adapter = __webpack_require__(/*! ./adapters/http */ "./node_modules/axios/lib/adapters/xhr.js");
  }
  return adapter;
}

var defaults = {
  adapter: getDefaultAdapter(),

  transformRequest: [function transformRequest(data, headers) {
    normalizeHeaderName(headers, 'Accept');
    normalizeHeaderName(headers, 'Content-Type');
    if (utils.isFormData(data) ||
      utils.isArrayBuffer(data) ||
      utils.isBuffer(data) ||
      utils.isStream(data) ||
      utils.isFile(data) ||
      utils.isBlob(data)
    ) {
      return data;
    }
    if (utils.isArrayBufferView(data)) {
      return data.buffer;
    }
    if (utils.isURLSearchParams(data)) {
      setContentTypeIfUnset(headers, 'application/x-www-form-urlencoded;charset=utf-8');
      return data.toString();
    }
    if (utils.isObject(data)) {
      setContentTypeIfUnset(headers, 'application/json;charset=utf-8');
      return JSON.stringify(data);
    }
    return data;
  }],

  transformResponse: [function transformResponse(data) {
    /*eslint no-param-reassign:0*/
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data);
      } catch (e) { /* Ignore */ }
    }
    return data;
  }],

  /**
   * A timeout in milliseconds to abort a request. If set to 0 (default) a
   * timeout is not created.
   */
  timeout: 0,

  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',

  maxContentLength: -1,
  maxBodyLength: -1,

  validateStatus: function validateStatus(status) {
    return status >= 200 && status < 300;
  }
};

defaults.headers = {
  common: {
    'Accept': 'application/json, text/plain, */*'
  }
};

utils.forEach(['delete', 'get', 'head'], function forEachMethodNoData(method) {
  defaults.headers[method] = {};
});

utils.forEach(['post', 'put', 'patch'], function forEachMethodWithData(method) {
  defaults.headers[method] = utils.merge(DEFAULT_CONTENT_TYPE);
});

module.exports = defaults;


/***/ }),

/***/ "./node_modules/axios/lib/helpers/bind.js":
/*!************************************************!*\
  !*** ./node_modules/axios/lib/helpers/bind.js ***!
  \************************************************/
/***/ ((module) => {

"use strict";


module.exports = function bind(fn, thisArg) {
  return function wrap() {
    var args = new Array(arguments.length);
    for (var i = 0; i < args.length; i++) {
      args[i] = arguments[i];
    }
    return fn.apply(thisArg, args);
  };
};


/***/ }),

/***/ "./node_modules/axios/lib/helpers/buildURL.js":
/*!****************************************************!*\
  !*** ./node_modules/axios/lib/helpers/buildURL.js ***!
  \****************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var utils = __webpack_require__(/*! ./../utils */ "./node_modules/axios/lib/utils.js");

function encode(val) {
  return encodeURIComponent(val).
    replace(/%3A/gi, ':').
    replace(/%24/g, '$').
    replace(/%2C/gi, ',').
    replace(/%20/g, '+').
    replace(/%5B/gi, '[').
    replace(/%5D/gi, ']');
}

/**
 * Build a URL by appending params to the end
 *
 * @param {string} url The base of the url (e.g., http://www.google.com)
 * @param {object} [params] The params to be appended
 * @returns {string} The formatted url
 */
module.exports = function buildURL(url, params, paramsSerializer) {
  /*eslint no-param-reassign:0*/
  if (!params) {
    return url;
  }

  var serializedParams;
  if (paramsSerializer) {
    serializedParams = paramsSerializer(params);
  } else if (utils.isURLSearchParams(params)) {
    serializedParams = params.toString();
  } else {
    var parts = [];

    utils.forEach(params, function serialize(val, key) {
      if (val === null || typeof val === 'undefined') {
        return;
      }

      if (utils.isArray(val)) {
        key = key + '[]';
      } else {
        val = [val];
      }

      utils.forEach(val, function parseValue(v) {
        if (utils.isDate(v)) {
          v = v.toISOString();
        } else if (utils.isObject(v)) {
          v = JSON.stringify(v);
        }
        parts.push(encode(key) + '=' + encode(v));
      });
    });

    serializedParams = parts.join('&');
  }

  if (serializedParams) {
    var hashmarkIndex = url.indexOf('#');
    if (hashmarkIndex !== -1) {
      url = url.slice(0, hashmarkIndex);
    }

    url += (url.indexOf('?') === -1 ? '?' : '&') + serializedParams;
  }

  return url;
};


/***/ }),

/***/ "./node_modules/axios/lib/helpers/combineURLs.js":
/*!*******************************************************!*\
  !*** ./node_modules/axios/lib/helpers/combineURLs.js ***!
  \*******************************************************/
/***/ ((module) => {

"use strict";


/**
 * Creates a new URL by combining the specified URLs
 *
 * @param {string} baseURL The base URL
 * @param {string} relativeURL The relative URL
 * @returns {string} The combined URL
 */
module.exports = function combineURLs(baseURL, relativeURL) {
  return relativeURL
    ? baseURL.replace(/\/+$/, '') + '/' + relativeURL.replace(/^\/+/, '')
    : baseURL;
};


/***/ }),

/***/ "./node_modules/axios/lib/helpers/cookies.js":
/*!***************************************************!*\
  !*** ./node_modules/axios/lib/helpers/cookies.js ***!
  \***************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var utils = __webpack_require__(/*! ./../utils */ "./node_modules/axios/lib/utils.js");

module.exports = (
  utils.isStandardBrowserEnv() ?

  // Standard browser envs support document.cookie
    (function standardBrowserEnv() {
      return {
        write: function write(name, value, expires, path, domain, secure) {
          var cookie = [];
          cookie.push(name + '=' + encodeURIComponent(value));

          if (utils.isNumber(expires)) {
            cookie.push('expires=' + new Date(expires).toGMTString());
          }

          if (utils.isString(path)) {
            cookie.push('path=' + path);
          }

          if (utils.isString(domain)) {
            cookie.push('domain=' + domain);
          }

          if (secure === true) {
            cookie.push('secure');
          }

          document.cookie = cookie.join('; ');
        },

        read: function read(name) {
          var match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
          return (match ? decodeURIComponent(match[3]) : null);
        },

        remove: function remove(name) {
          this.write(name, '', Date.now() - 86400000);
        }
      };
    })() :

  // Non standard browser env (web workers, react-native) lack needed support.
    (function nonStandardBrowserEnv() {
      return {
        write: function write() {},
        read: function read() { return null; },
        remove: function remove() {}
      };
    })()
);


/***/ }),

/***/ "./node_modules/axios/lib/helpers/isAbsoluteURL.js":
/*!*********************************************************!*\
  !*** ./node_modules/axios/lib/helpers/isAbsoluteURL.js ***!
  \*********************************************************/
/***/ ((module) => {

"use strict";


/**
 * Determines whether the specified URL is absolute
 *
 * @param {string} url The URL to test
 * @returns {boolean} True if the specified URL is absolute, otherwise false
 */
module.exports = function isAbsoluteURL(url) {
  // A URL is considered absolute if it begins with "<scheme>://" or "//" (protocol-relative URL).
  // RFC 3986 defines scheme name as a sequence of characters beginning with a letter and followed
  // by any combination of letters, digits, plus, period, or hyphen.
  return /^([a-z][a-z\d\+\-\.]*:)?\/\//i.test(url);
};


/***/ }),

/***/ "./node_modules/axios/lib/helpers/isAxiosError.js":
/*!********************************************************!*\
  !*** ./node_modules/axios/lib/helpers/isAxiosError.js ***!
  \********************************************************/
/***/ ((module) => {

"use strict";


/**
 * Determines whether the payload is an error thrown by Axios
 *
 * @param {*} payload The value to test
 * @returns {boolean} True if the payload is an error thrown by Axios, otherwise false
 */
module.exports = function isAxiosError(payload) {
  return (typeof payload === 'object') && (payload.isAxiosError === true);
};


/***/ }),

/***/ "./node_modules/axios/lib/helpers/isURLSameOrigin.js":
/*!***********************************************************!*\
  !*** ./node_modules/axios/lib/helpers/isURLSameOrigin.js ***!
  \***********************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var utils = __webpack_require__(/*! ./../utils */ "./node_modules/axios/lib/utils.js");

module.exports = (
  utils.isStandardBrowserEnv() ?

  // Standard browser envs have full support of the APIs needed to test
  // whether the request URL is of the same origin as current location.
    (function standardBrowserEnv() {
      var msie = /(msie|trident)/i.test(navigator.userAgent);
      var urlParsingNode = document.createElement('a');
      var originURL;

      /**
    * Parse a URL to discover it's components
    *
    * @param {String} url The URL to be parsed
    * @returns {Object}
    */
      function resolveURL(url) {
        var href = url;

        if (msie) {
        // IE needs attribute set twice to normalize properties
          urlParsingNode.setAttribute('href', href);
          href = urlParsingNode.href;
        }

        urlParsingNode.setAttribute('href', href);

        // urlParsingNode provides the UrlUtils interface - http://url.spec.whatwg.org/#urlutils
        return {
          href: urlParsingNode.href,
          protocol: urlParsingNode.protocol ? urlParsingNode.protocol.replace(/:$/, '') : '',
          host: urlParsingNode.host,
          search: urlParsingNode.search ? urlParsingNode.search.replace(/^\?/, '') : '',
          hash: urlParsingNode.hash ? urlParsingNode.hash.replace(/^#/, '') : '',
          hostname: urlParsingNode.hostname,
          port: urlParsingNode.port,
          pathname: (urlParsingNode.pathname.charAt(0) === '/') ?
            urlParsingNode.pathname :
            '/' + urlParsingNode.pathname
        };
      }

      originURL = resolveURL(window.location.href);

      /**
    * Determine if a URL shares the same origin as the current location
    *
    * @param {String} requestURL The URL to test
    * @returns {boolean} True if URL shares the same origin, otherwise false
    */
      return function isURLSameOrigin(requestURL) {
        var parsed = (utils.isString(requestURL)) ? resolveURL(requestURL) : requestURL;
        return (parsed.protocol === originURL.protocol &&
            parsed.host === originURL.host);
      };
    })() :

  // Non standard browser envs (web workers, react-native) lack needed support.
    (function nonStandardBrowserEnv() {
      return function isURLSameOrigin() {
        return true;
      };
    })()
);


/***/ }),

/***/ "./node_modules/axios/lib/helpers/normalizeHeaderName.js":
/*!***************************************************************!*\
  !*** ./node_modules/axios/lib/helpers/normalizeHeaderName.js ***!
  \***************************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var utils = __webpack_require__(/*! ../utils */ "./node_modules/axios/lib/utils.js");

module.exports = function normalizeHeaderName(headers, normalizedName) {
  utils.forEach(headers, function processHeader(value, name) {
    if (name !== normalizedName && name.toUpperCase() === normalizedName.toUpperCase()) {
      headers[normalizedName] = value;
      delete headers[name];
    }
  });
};


/***/ }),

/***/ "./node_modules/axios/lib/helpers/parseHeaders.js":
/*!********************************************************!*\
  !*** ./node_modules/axios/lib/helpers/parseHeaders.js ***!
  \********************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var utils = __webpack_require__(/*! ./../utils */ "./node_modules/axios/lib/utils.js");

// Headers whose duplicates are ignored by node
// c.f. https://nodejs.org/api/http.html#http_message_headers
var ignoreDuplicateOf = [
  'age', 'authorization', 'content-length', 'content-type', 'etag',
  'expires', 'from', 'host', 'if-modified-since', 'if-unmodified-since',
  'last-modified', 'location', 'max-forwards', 'proxy-authorization',
  'referer', 'retry-after', 'user-agent'
];

/**
 * Parse headers into an object
 *
 * ```
 * Date: Wed, 27 Aug 2014 08:58:49 GMT
 * Content-Type: application/json
 * Connection: keep-alive
 * Transfer-Encoding: chunked
 * ```
 *
 * @param {String} headers Headers needing to be parsed
 * @returns {Object} Headers parsed into an object
 */
module.exports = function parseHeaders(headers) {
  var parsed = {};
  var key;
  var val;
  var i;

  if (!headers) { return parsed; }

  utils.forEach(headers.split('\n'), function parser(line) {
    i = line.indexOf(':');
    key = utils.trim(line.substr(0, i)).toLowerCase();
    val = utils.trim(line.substr(i + 1));

    if (key) {
      if (parsed[key] && ignoreDuplicateOf.indexOf(key) >= 0) {
        return;
      }
      if (key === 'set-cookie') {
        parsed[key] = (parsed[key] ? parsed[key] : []).concat([val]);
      } else {
        parsed[key] = parsed[key] ? parsed[key] + ', ' + val : val;
      }
    }
  });

  return parsed;
};


/***/ }),

/***/ "./node_modules/axios/lib/helpers/spread.js":
/*!**************************************************!*\
  !*** ./node_modules/axios/lib/helpers/spread.js ***!
  \**************************************************/
/***/ ((module) => {

"use strict";


/**
 * Syntactic sugar for invoking a function and expanding an array for arguments.
 *
 * Common use case would be to use `Function.prototype.apply`.
 *
 *  ```js
 *  function f(x, y, z) {}
 *  var args = [1, 2, 3];
 *  f.apply(null, args);
 *  ```
 *
 * With `spread` this example can be re-written.
 *
 *  ```js
 *  spread(function(x, y, z) {})([1, 2, 3]);
 *  ```
 *
 * @param {Function} callback
 * @returns {Function}
 */
module.exports = function spread(callback) {
  return function wrap(arr) {
    return callback.apply(null, arr);
  };
};


/***/ }),

/***/ "./node_modules/axios/lib/utils.js":
/*!*****************************************!*\
  !*** ./node_modules/axios/lib/utils.js ***!
  \*****************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var bind = __webpack_require__(/*! ./helpers/bind */ "./node_modules/axios/lib/helpers/bind.js");

/*global toString:true*/

// utils is a library of generic helper functions non-specific to axios

var toString = Object.prototype.toString;

/**
 * Determine if a value is an Array
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is an Array, otherwise false
 */
function isArray(val) {
  return toString.call(val) === '[object Array]';
}

/**
 * Determine if a value is undefined
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if the value is undefined, otherwise false
 */
function isUndefined(val) {
  return typeof val === 'undefined';
}

/**
 * Determine if a value is a Buffer
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a Buffer, otherwise false
 */
function isBuffer(val) {
  return val !== null && !isUndefined(val) && val.constructor !== null && !isUndefined(val.constructor)
    && typeof val.constructor.isBuffer === 'function' && val.constructor.isBuffer(val);
}

/**
 * Determine if a value is an ArrayBuffer
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is an ArrayBuffer, otherwise false
 */
function isArrayBuffer(val) {
  return toString.call(val) === '[object ArrayBuffer]';
}

/**
 * Determine if a value is a FormData
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is an FormData, otherwise false
 */
function isFormData(val) {
  return (typeof FormData !== 'undefined') && (val instanceof FormData);
}

/**
 * Determine if a value is a view on an ArrayBuffer
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a view on an ArrayBuffer, otherwise false
 */
function isArrayBufferView(val) {
  var result;
  if ((typeof ArrayBuffer !== 'undefined') && (ArrayBuffer.isView)) {
    result = ArrayBuffer.isView(val);
  } else {
    result = (val) && (val.buffer) && (val.buffer instanceof ArrayBuffer);
  }
  return result;
}

/**
 * Determine if a value is a String
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a String, otherwise false
 */
function isString(val) {
  return typeof val === 'string';
}

/**
 * Determine if a value is a Number
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a Number, otherwise false
 */
function isNumber(val) {
  return typeof val === 'number';
}

/**
 * Determine if a value is an Object
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is an Object, otherwise false
 */
function isObject(val) {
  return val !== null && typeof val === 'object';
}

/**
 * Determine if a value is a plain Object
 *
 * @param {Object} val The value to test
 * @return {boolean} True if value is a plain Object, otherwise false
 */
function isPlainObject(val) {
  if (toString.call(val) !== '[object Object]') {
    return false;
  }

  var prototype = Object.getPrototypeOf(val);
  return prototype === null || prototype === Object.prototype;
}

/**
 * Determine if a value is a Date
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a Date, otherwise false
 */
function isDate(val) {
  return toString.call(val) === '[object Date]';
}

/**
 * Determine if a value is a File
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a File, otherwise false
 */
function isFile(val) {
  return toString.call(val) === '[object File]';
}

/**
 * Determine if a value is a Blob
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a Blob, otherwise false
 */
function isBlob(val) {
  return toString.call(val) === '[object Blob]';
}

/**
 * Determine if a value is a Function
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a Function, otherwise false
 */
function isFunction(val) {
  return toString.call(val) === '[object Function]';
}

/**
 * Determine if a value is a Stream
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a Stream, otherwise false
 */
function isStream(val) {
  return isObject(val) && isFunction(val.pipe);
}

/**
 * Determine if a value is a URLSearchParams object
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a URLSearchParams object, otherwise false
 */
function isURLSearchParams(val) {
  return typeof URLSearchParams !== 'undefined' && val instanceof URLSearchParams;
}

/**
 * Trim excess whitespace off the beginning and end of a string
 *
 * @param {String} str The String to trim
 * @returns {String} The String freed of excess whitespace
 */
function trim(str) {
  return str.replace(/^\s*/, '').replace(/\s*$/, '');
}

/**
 * Determine if we're running in a standard browser environment
 *
 * This allows axios to run in a web worker, and react-native.
 * Both environments support XMLHttpRequest, but not fully standard globals.
 *
 * web workers:
 *  typeof window -> undefined
 *  typeof document -> undefined
 *
 * react-native:
 *  navigator.product -> 'ReactNative'
 * nativescript
 *  navigator.product -> 'NativeScript' or 'NS'
 */
function isStandardBrowserEnv() {
  if (typeof navigator !== 'undefined' && (navigator.product === 'ReactNative' ||
                                           navigator.product === 'NativeScript' ||
                                           navigator.product === 'NS')) {
    return false;
  }
  return (
    typeof window !== 'undefined' &&
    typeof document !== 'undefined'
  );
}

/**
 * Iterate over an Array or an Object invoking a function for each item.
 *
 * If `obj` is an Array callback will be called passing
 * the value, index, and complete array for each item.
 *
 * If 'obj' is an Object callback will be called passing
 * the value, key, and complete object for each property.
 *
 * @param {Object|Array} obj The object to iterate
 * @param {Function} fn The callback to invoke for each item
 */
function forEach(obj, fn) {
  // Don't bother if no value provided
  if (obj === null || typeof obj === 'undefined') {
    return;
  }

  // Force an array if not already something iterable
  if (typeof obj !== 'object') {
    /*eslint no-param-reassign:0*/
    obj = [obj];
  }

  if (isArray(obj)) {
    // Iterate over array values
    for (var i = 0, l = obj.length; i < l; i++) {
      fn.call(null, obj[i], i, obj);
    }
  } else {
    // Iterate over object keys
    for (var key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        fn.call(null, obj[key], key, obj);
      }
    }
  }
}

/**
 * Accepts varargs expecting each argument to be an object, then
 * immutably merges the properties of each object and returns result.
 *
 * When multiple objects contain the same key the later object in
 * the arguments list will take precedence.
 *
 * Example:
 *
 * ```js
 * var result = merge({foo: 123}, {foo: 456});
 * console.log(result.foo); // outputs 456
 * ```
 *
 * @param {Object} obj1 Object to merge
 * @returns {Object} Result of all merge properties
 */
function merge(/* obj1, obj2, obj3, ... */) {
  var result = {};
  function assignValue(val, key) {
    if (isPlainObject(result[key]) && isPlainObject(val)) {
      result[key] = merge(result[key], val);
    } else if (isPlainObject(val)) {
      result[key] = merge({}, val);
    } else if (isArray(val)) {
      result[key] = val.slice();
    } else {
      result[key] = val;
    }
  }

  for (var i = 0, l = arguments.length; i < l; i++) {
    forEach(arguments[i], assignValue);
  }
  return result;
}

/**
 * Extends object a by mutably adding to it the properties of object b.
 *
 * @param {Object} a The object to be extended
 * @param {Object} b The object to copy properties from
 * @param {Object} thisArg The object to bind function to
 * @return {Object} The resulting value of object a
 */
function extend(a, b, thisArg) {
  forEach(b, function assignValue(val, key) {
    if (thisArg && typeof val === 'function') {
      a[key] = bind(val, thisArg);
    } else {
      a[key] = val;
    }
  });
  return a;
}

/**
 * Remove byte order marker. This catches EF BB BF (the UTF-8 BOM)
 *
 * @param {string} content with BOM
 * @return {string} content value without BOM
 */
function stripBOM(content) {
  if (content.charCodeAt(0) === 0xFEFF) {
    content = content.slice(1);
  }
  return content;
}

module.exports = {
  isArray: isArray,
  isArrayBuffer: isArrayBuffer,
  isBuffer: isBuffer,
  isFormData: isFormData,
  isArrayBufferView: isArrayBufferView,
  isString: isString,
  isNumber: isNumber,
  isObject: isObject,
  isPlainObject: isPlainObject,
  isUndefined: isUndefined,
  isDate: isDate,
  isFile: isFile,
  isBlob: isBlob,
  isFunction: isFunction,
  isStream: isStream,
  isURLSearchParams: isURLSearchParams,
  isStandardBrowserEnv: isStandardBrowserEnv,
  forEach: forEach,
  merge: merge,
  extend: extend,
  trim: trim,
  stripBOM: stripBOM
};


/***/ }),

/***/ "./src/api/TrackingManager.ts":
/*!************************************!*\
  !*** ./src/api/TrackingManager.ts ***!
  \************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "TrackingManager": () => (/* binding */ TrackingManager)
/* harmony export */ });
/* harmony import */ var _enum_FlagshipConstant__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../enum/FlagshipConstant */ "./src/enum/FlagshipConstant.ts");
/* harmony import */ var _utils_utils__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../utils/utils */ "./src/utils/utils.ts");
/* harmony import */ var _TrackingManagerAbstract__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./TrackingManagerAbstract */ "./src/api/TrackingManagerAbstract.ts");
var __extends = (undefined && undefined.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();



var TrackingManager = /** @class */ (function (_super) {
    __extends(TrackingManager, _super);
    function TrackingManager() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    TrackingManager.prototype.sendActive = function (visitor, modification) {
        var _a, _b;
        var _this = this;
        var headers = (_a = {},
            _a[_enum_FlagshipConstant__WEBPACK_IMPORTED_MODULE_0__.HEADER_X_API_KEY] = "" + this.config.apiKey,
            _a[_enum_FlagshipConstant__WEBPACK_IMPORTED_MODULE_0__.HEADER_X_SDK_CLIENT] = _enum_FlagshipConstant__WEBPACK_IMPORTED_MODULE_0__.SDK_LANGUAGE,
            _a[_enum_FlagshipConstant__WEBPACK_IMPORTED_MODULE_0__.HEADER_X_SDK_VERSION] = _enum_FlagshipConstant__WEBPACK_IMPORTED_MODULE_0__.SDK_VERSION,
            _a[_enum_FlagshipConstant__WEBPACK_IMPORTED_MODULE_0__.HEADER_CONTENT_TYPE] = _enum_FlagshipConstant__WEBPACK_IMPORTED_MODULE_0__.HEADER_APPLICATION_JSON,
            _a);
        var url = "" + _enum_FlagshipConstant__WEBPACK_IMPORTED_MODULE_0__.BASE_API_URL + _enum_FlagshipConstant__WEBPACK_IMPORTED_MODULE_0__.URL_ACTIVATE_MODIFICATION;
        var postData = (_b = {},
            _b[_enum_FlagshipConstant__WEBPACK_IMPORTED_MODULE_0__.VISITOR_ID_API_ITEM] = visitor.visitorId,
            _b[_enum_FlagshipConstant__WEBPACK_IMPORTED_MODULE_0__.VARIATION_ID_API_ITEM] = modification.variationId,
            _b[_enum_FlagshipConstant__WEBPACK_IMPORTED_MODULE_0__.VARIATION_GROUP_ID_API_ITEM] = modification.variationGroupId,
            _b[_enum_FlagshipConstant__WEBPACK_IMPORTED_MODULE_0__.CUSTOMER_ENV_ID_API_ITEM] = "" + this.config.envId,
            _b);
        if (visitor.visitorId && visitor.anonymousId) {
            postData[_enum_FlagshipConstant__WEBPACK_IMPORTED_MODULE_0__.VISITOR_ID_API_ITEM] = visitor.visitorId;
            postData[_enum_FlagshipConstant__WEBPACK_IMPORTED_MODULE_0__.ANONYMOUS_ID] = visitor.anonymousId;
        }
        else {
            postData[_enum_FlagshipConstant__WEBPACK_IMPORTED_MODULE_0__.VISITOR_ID_API_ITEM] = visitor.anonymousId || visitor.visitorId;
            postData[_enum_FlagshipConstant__WEBPACK_IMPORTED_MODULE_0__.ANONYMOUS_ID] = null;
        }
        return new Promise(function (resolve, reject) {
            _this.httpClient
                .postAsync(url, {
                headers: headers,
                timeout: _this.config.timeout,
                body: postData
            })
                .then(function () {
                resolve();
            })
                .catch(function (error) {
                (0,_utils_utils__WEBPACK_IMPORTED_MODULE_1__.logError)(_this.config, JSON.stringify(error), _enum_FlagshipConstant__WEBPACK_IMPORTED_MODULE_0__.PROCESS_SEND_ACTIVATE);
                reject(error);
            });
        });
    };
    TrackingManager.prototype.sendHit = function (hit) {
        var _a;
        var _this = this;
        var headers = (_a = {},
            _a[_enum_FlagshipConstant__WEBPACK_IMPORTED_MODULE_0__.HEADER_X_API_KEY] = "" + this.config.apiKey,
            _a[_enum_FlagshipConstant__WEBPACK_IMPORTED_MODULE_0__.HEADER_X_SDK_CLIENT] = _enum_FlagshipConstant__WEBPACK_IMPORTED_MODULE_0__.SDK_LANGUAGE,
            _a[_enum_FlagshipConstant__WEBPACK_IMPORTED_MODULE_0__.HEADER_X_SDK_VERSION] = _enum_FlagshipConstant__WEBPACK_IMPORTED_MODULE_0__.SDK_VERSION,
            _a[_enum_FlagshipConstant__WEBPACK_IMPORTED_MODULE_0__.HEADER_CONTENT_TYPE] = _enum_FlagshipConstant__WEBPACK_IMPORTED_MODULE_0__.HEADER_APPLICATION_JSON,
            _a);
        return new Promise(function (resolve, reject) {
            _this.httpClient
                .postAsync(_enum_FlagshipConstant__WEBPACK_IMPORTED_MODULE_0__.HIT_API_URL, {
                headers: headers,
                timeout: _this.config.timeout,
                body: hit.toApiKeys()
            })
                .then(function () {
                resolve();
            })
                .catch(function (error) {
                (0,_utils_utils__WEBPACK_IMPORTED_MODULE_1__.logError)(_this.config, JSON.stringify(error), _enum_FlagshipConstant__WEBPACK_IMPORTED_MODULE_0__.PROCESS_SEND_HIT);
                reject(error);
            });
        });
    };
    return TrackingManager;
}(_TrackingManagerAbstract__WEBPACK_IMPORTED_MODULE_2__.TrackingManagerAbstract));



/***/ }),

/***/ "./src/api/TrackingManagerAbstract.ts":
/*!********************************************!*\
  !*** ./src/api/TrackingManagerAbstract.ts ***!
  \********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "TrackingManagerAbstract": () => (/* binding */ TrackingManagerAbstract)
/* harmony export */ });
var TrackingManagerAbstract = /** @class */ (function () {
    function TrackingManagerAbstract(httpClient, config) {
        this._httpClient = httpClient;
        this._config = config;
    }
    Object.defineProperty(TrackingManagerAbstract.prototype, "httpClient", {
        get: function () {
            return this._httpClient;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(TrackingManagerAbstract.prototype, "config", {
        get: function () {
            return this._config;
        },
        enumerable: false,
        configurable: true
    });
    return TrackingManagerAbstract;
}());



/***/ }),

/***/ "./src/config/BucketingConfig.ts":
/*!***************************************!*\
  !*** ./src/config/BucketingConfig.ts ***!
  \***************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "BucketingConfig": () => (/* binding */ BucketingConfig)
/* harmony export */ });
/* harmony import */ var _enum_index__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../enum/index */ "./src/enum/index.ts");
/* harmony import */ var _FlagshipConfig__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./FlagshipConfig */ "./src/config/FlagshipConfig.ts");
var __extends = (undefined && undefined.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (undefined && undefined.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};


var BucketingConfig = /** @class */ (function (_super) {
    __extends(BucketingConfig, _super);
    function BucketingConfig(param) {
        var _this = _super.call(this, __assign(__assign({}, param), { decisionMode: _FlagshipConfig__WEBPACK_IMPORTED_MODULE_1__.DecisionMode.BUCKETING })) || this;
        if (param) {
            var pollingInterval = param.pollingInterval;
            _this.pollingInterval = pollingInterval !== null && pollingInterval !== void 0 ? pollingInterval : _enum_index__WEBPACK_IMPORTED_MODULE_0__.REQUEST_TIME_OUT;
        }
        else {
            _this.pollingInterval = _enum_index__WEBPACK_IMPORTED_MODULE_0__.REQUEST_TIME_OUT;
        }
        return _this;
    }
    return BucketingConfig;
}(_FlagshipConfig__WEBPACK_IMPORTED_MODULE_1__.FlagshipConfig));



/***/ }),

/***/ "./src/config/ConfigManager.ts":
/*!*************************************!*\
  !*** ./src/config/ConfigManager.ts ***!
  \*************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "ConfigManager": () => (/* binding */ ConfigManager)
/* harmony export */ });
var ConfigManager = /** @class */ (function () {
    function ConfigManager(config, decisionManager, trackingManager) {
        this._config = config;
        this._decisionManager = decisionManager;
        this._trackingManager = trackingManager;
    }
    Object.defineProperty(ConfigManager.prototype, "config", {
        get: function () {
            return this._config;
        },
        set: function (value) {
            this._config = value;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ConfigManager.prototype, "decisionManager", {
        get: function () {
            return this._decisionManager;
        },
        set: function (value) {
            this._decisionManager = value;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ConfigManager.prototype, "trackingManager", {
        get: function () {
            return this._trackingManager;
        },
        set: function (value) {
            this._trackingManager = value;
        },
        enumerable: false,
        configurable: true
    });
    return ConfigManager;
}());



/***/ }),

/***/ "./src/config/DecisionApiConfig.ts":
/*!*****************************************!*\
  !*** ./src/config/DecisionApiConfig.ts ***!
  \*****************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "DecisionApiConfig": () => (/* binding */ DecisionApiConfig)
/* harmony export */ });
/* harmony import */ var _FlagshipConfig__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./FlagshipConfig */ "./src/config/FlagshipConfig.ts");
var __extends = (undefined && undefined.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (undefined && undefined.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};

var DecisionApiConfig = /** @class */ (function (_super) {
    __extends(DecisionApiConfig, _super);
    function DecisionApiConfig(param) {
        return _super.call(this, __assign(__assign({}, param), { decisionMode: _FlagshipConfig__WEBPACK_IMPORTED_MODULE_0__.DecisionMode.DECISION_API })) || this;
    }
    return DecisionApiConfig;
}(_FlagshipConfig__WEBPACK_IMPORTED_MODULE_0__.FlagshipConfig));



/***/ }),

/***/ "./src/config/FlagshipConfig.ts":
/*!**************************************!*\
  !*** ./src/config/FlagshipConfig.ts ***!
  \**************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "DecisionMode": () => (/* binding */ DecisionMode),
/* harmony export */   "statusChangeError": () => (/* binding */ statusChangeError),
/* harmony export */   "FlagshipConfig": () => (/* binding */ FlagshipConfig)
/* harmony export */ });
/* harmony import */ var _enum_index__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../enum/index */ "./src/enum/index.ts");
/* harmony import */ var _utils_utils__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../utils/utils */ "./src/utils/utils.ts");


var DecisionMode;
(function (DecisionMode) {
    /**
     * Flagship SDK mode decision api
     */
    DecisionMode[DecisionMode["DECISION_API"] = 0] = "DECISION_API";
    /**
     * Flagship SDK mode bucketing
     */
    DecisionMode[DecisionMode["BUCKETING"] = 1] = "BUCKETING";
})(DecisionMode || (DecisionMode = {}));
var statusChangeError = 'statusChangedCallback must be a function';
var FlagshipConfig = /** @class */ (function () {
    function FlagshipConfig(param) {
        var envId = param.envId, apiKey = param.apiKey, timeout = param.timeout, logLevel = param.logLevel, logManager = param.logManager, statusChangedCallback = param.statusChangedCallback, fetchNow = param.fetchNow, decisionMode = param.decisionMode;
        this._envId = envId;
        this._apiKey = apiKey;
        this.logLevel = logLevel || _enum_index__WEBPACK_IMPORTED_MODULE_0__.LogLevel.ALL;
        this.timeout = timeout || _enum_index__WEBPACK_IMPORTED_MODULE_0__.REQUEST_TIME_OUT;
        this.fetchNow = typeof fetchNow === 'undefined' || fetchNow;
        this._decisionMode = decisionMode || DecisionMode.DECISION_API;
        if (logManager) {
            this.logManager = logManager;
        }
        this.statusChangedCallback = statusChangedCallback;
    }
    Object.defineProperty(FlagshipConfig.prototype, "envId", {
        get: function () {
            return this._envId;
        },
        set: function (value) {
            this._envId = value;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(FlagshipConfig.prototype, "apiKey", {
        get: function () {
            return this._apiKey;
        },
        set: function (value) {
            this._apiKey = value;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(FlagshipConfig.prototype, "decisionMode", {
        get: function () {
            return this._decisionMode;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(FlagshipConfig.prototype, "timeout", {
        get: function () {
            return this._timeout;
        },
        set: function (value) {
            this._timeout = value;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(FlagshipConfig.prototype, "logLevel", {
        get: function () {
            return this._logLevel;
        },
        set: function (value) {
            this._logLevel = value;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(FlagshipConfig.prototype, "fetchNow", {
        get: function () {
            return this._fetchNow;
        },
        set: function (v) {
            this._fetchNow = v;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(FlagshipConfig.prototype, "pollingInterval", {
        get: function () {
            return this._pollingInterval;
        },
        set: function (v) {
            this._pollingInterval = v;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(FlagshipConfig.prototype, "statusChangedCallback", {
        get: function () {
            return this._statusChangedCallback;
        },
        set: function (fn) {
            if (typeof fn !== 'function') {
                (0,_utils_utils__WEBPACK_IMPORTED_MODULE_1__.logError)(this, statusChangeError, 'statusChangedCallback');
                return;
            }
            this._statusChangedCallback = fn;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(FlagshipConfig.prototype, "logManager", {
        get: function () {
            return this._logManager;
        },
        set: function (value) {
            this._logManager = value;
        },
        enumerable: false,
        configurable: true
    });
    return FlagshipConfig;
}());



/***/ }),

/***/ "./src/config/index.ts":
/*!*****************************!*\
  !*** ./src/config/index.ts ***!
  \*****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "ConfigManager": () => (/* reexport safe */ _ConfigManager__WEBPACK_IMPORTED_MODULE_0__.ConfigManager),
/* harmony export */   "DecisionApiConfig": () => (/* reexport safe */ _DecisionApiConfig__WEBPACK_IMPORTED_MODULE_1__.DecisionApiConfig),
/* harmony export */   "BucketingConfig": () => (/* reexport safe */ _BucketingConfig__WEBPACK_IMPORTED_MODULE_2__.BucketingConfig),
/* harmony export */   "DecisionMode": () => (/* reexport safe */ _FlagshipConfig__WEBPACK_IMPORTED_MODULE_3__.DecisionMode),
/* harmony export */   "FlagshipConfig": () => (/* reexport safe */ _FlagshipConfig__WEBPACK_IMPORTED_MODULE_3__.FlagshipConfig)
/* harmony export */ });
/* harmony import */ var _ConfigManager__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./ConfigManager */ "./src/config/ConfigManager.ts");
/* harmony import */ var _DecisionApiConfig__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./DecisionApiConfig */ "./src/config/DecisionApiConfig.ts");
/* harmony import */ var _BucketingConfig__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./BucketingConfig */ "./src/config/BucketingConfig.ts");
/* harmony import */ var _FlagshipConfig__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./FlagshipConfig */ "./src/config/FlagshipConfig.ts");






/***/ }),

/***/ "./src/decision/ApiManager.ts":
/*!************************************!*\
  !*** ./src/decision/ApiManager.ts ***!
  \************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "ApiManager": () => (/* binding */ ApiManager)
/* harmony export */ });
/* harmony import */ var _enum_index__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../enum/index */ "./src/enum/index.ts");
/* harmony import */ var _DecisionManager__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./DecisionManager */ "./src/decision/DecisionManager.ts");
/* harmony import */ var _utils_utils__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../utils/utils */ "./src/utils/utils.ts");
var __extends = (undefined && undefined.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (undefined && undefined.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};



var ApiManager = /** @class */ (function (_super) {
    __extends(ApiManager, _super);
    function ApiManager() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    ApiManager.prototype.getCampaignsAsync = function (visitor) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        var _a;
                        var headers = (_a = {},
                            _a[_enum_index__WEBPACK_IMPORTED_MODULE_0__.HEADER_X_API_KEY] = "" + _this.config.apiKey,
                            _a[_enum_index__WEBPACK_IMPORTED_MODULE_0__.HEADER_X_SDK_CLIENT] = _enum_index__WEBPACK_IMPORTED_MODULE_0__.SDK_LANGUAGE,
                            _a[_enum_index__WEBPACK_IMPORTED_MODULE_0__.HEADER_X_SDK_VERSION] = _enum_index__WEBPACK_IMPORTED_MODULE_0__.SDK_VERSION,
                            _a[_enum_index__WEBPACK_IMPORTED_MODULE_0__.HEADER_CONTENT_TYPE] = _enum_index__WEBPACK_IMPORTED_MODULE_0__.HEADER_APPLICATION_JSON,
                            _a);
                        var postData = {
                            visitorId: visitor.visitorId,
                            anonymousId: visitor.anonymousId,
                            trigger_hit: false,
                            context: visitor.context
                        };
                        var url = "" + _enum_index__WEBPACK_IMPORTED_MODULE_0__.BASE_API_URL + _this.config.envId + _enum_index__WEBPACK_IMPORTED_MODULE_0__.URL_CAMPAIGNS + "?" + _enum_index__WEBPACK_IMPORTED_MODULE_0__.EXPOSE_ALL_KEYS + "=true";
                        _this._httpClient.postAsync(url, {
                            headers: headers,
                            timeout: _this.config.timeout,
                            body: postData
                        })
                            .then(function (data) {
                            _this.panic = false;
                            if (data.body.panic) {
                                _this.panic = true;
                            }
                            var response = [];
                            if (data.body.campaigns) {
                                response = data.body.campaigns;
                            }
                            resolve(response);
                        })
                            .catch(function (error) {
                            (0,_utils_utils__WEBPACK_IMPORTED_MODULE_2__.logError)(_this.config, JSON.stringify(error), _enum_index__WEBPACK_IMPORTED_MODULE_0__.PROCESS_GET_CAMPAIGNS);
                            reject(error);
                        });
                    })];
            });
        });
    };
    return ApiManager;
}(_DecisionManager__WEBPACK_IMPORTED_MODULE_1__.DecisionManager));



/***/ }),

/***/ "./src/decision/BucketingManager.ts":
/*!******************************************!*\
  !*** ./src/decision/BucketingManager.ts ***!
  \******************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "BucketingManager": () => (/* binding */ BucketingManager)
/* harmony export */ });
/* harmony import */ var _enum_index__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../enum/index */ "./src/enum/index.ts");
/* harmony import */ var _utils_utils__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../utils/utils */ "./src/utils/utils.ts");
/* harmony import */ var _DecisionManager__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./DecisionManager */ "./src/decision/DecisionManager.ts");
var __extends = (undefined && undefined.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (undefined && undefined.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};



var BucketingManager = /** @class */ (function (_super) {
    __extends(BucketingManager, _super);
    function BucketingManager(httpClient, config, murmurHash) {
        var _this = _super.call(this, httpClient, config) || this;
        _this._murmurHash = murmurHash;
        return _this;
    }
    BucketingManager.prototype.startPolling = function () {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            var url, headers, response, error_1;
            var _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        if (this._isPooling) {
                            return [2 /*return*/];
                        }
                        this._isPooling = true;
                        if (this.config.pollingInterval === 0) {
                            this._isPooling = false;
                        }
                        (0,_utils_utils__WEBPACK_IMPORTED_MODULE_1__.logInfo)(this.config, 'Bucketing polling starts', 'startPolling');
                        _c.label = 1;
                    case 1:
                        _c.trys.push([1, 4, , 5]);
                        url = (0,_utils_utils__WEBPACK_IMPORTED_MODULE_1__.sprintf)(_enum_index__WEBPACK_IMPORTED_MODULE_0__.BUCKETING_API_URL, this.config.envId);
                        headers = (_b = {},
                            _b[_enum_index__WEBPACK_IMPORTED_MODULE_0__.HEADER_X_API_KEY] = "" + this.config.apiKey,
                            _b[_enum_index__WEBPACK_IMPORTED_MODULE_0__.HEADER_X_SDK_CLIENT] = _enum_index__WEBPACK_IMPORTED_MODULE_0__.SDK_LANGUAGE,
                            _b[_enum_index__WEBPACK_IMPORTED_MODULE_0__.HEADER_X_SDK_VERSION] = _enum_index__WEBPACK_IMPORTED_MODULE_0__.SDK_VERSION,
                            _b[_enum_index__WEBPACK_IMPORTED_MODULE_0__.HEADER_CONTENT_TYPE] = _enum_index__WEBPACK_IMPORTED_MODULE_0__.HEADER_APPLICATION_JSON,
                            _b);
                        if (this._lastModified) {
                            headers['If-Modified-Since'] = this._lastModified;
                        }
                        return [4 /*yield*/, this._httpClient.getAsync(url, { headers: headers })];
                    case 2:
                        response = _c.sent();
                        if (response.status === 200) {
                            this._bucketingContent = response.body;
                        }
                        if (response.headers) {
                            this._lastModified = response.headers['Last-Modified'];
                        }
                        return [4 /*yield*/, (0,_utils_utils__WEBPACK_IMPORTED_MODULE_1__.sleep)(((_a = this.config.pollingInterval) !== null && _a !== void 0 ? _a : _enum_index__WEBPACK_IMPORTED_MODULE_0__.REQUEST_TIME_OUT) * 1000)];
                    case 3:
                        _c.sent();
                        return [3 /*break*/, 5];
                    case 4:
                        error_1 = _c.sent();
                        (0,_utils_utils__WEBPACK_IMPORTED_MODULE_1__.logError)(this.config, error_1, 'startPolling');
                        return [3 /*break*/, 5];
                    case 5:
                        if (this._isPooling) return [3 /*break*/, 1];
                        _c.label = 6;
                    case 6:
                        (0,_utils_utils__WEBPACK_IMPORTED_MODULE_1__.logInfo)(this.config, 'Bucketing polling stopped', 'startPolling');
                        return [2 /*return*/];
                }
            });
        });
    };
    BucketingManager.prototype.stopPolling = function () {
        this._isPooling = false;
    };
    BucketingManager.prototype.sendContext = function (visitor) {
        var _this = this;
        return new Promise(function (resolve) {
            var _a;
            var url = (0,_utils_utils__WEBPACK_IMPORTED_MODULE_1__.sprintf)(_enum_index__WEBPACK_IMPORTED_MODULE_0__.BUCKETING_API_CONTEXT_URL, _this.config.envId);
            var headers = (_a = {},
                _a[_enum_index__WEBPACK_IMPORTED_MODULE_0__.HEADER_X_API_KEY] = "" + _this.config.apiKey,
                _a[_enum_index__WEBPACK_IMPORTED_MODULE_0__.HEADER_X_SDK_CLIENT] = _enum_index__WEBPACK_IMPORTED_MODULE_0__.SDK_LANGUAGE,
                _a[_enum_index__WEBPACK_IMPORTED_MODULE_0__.HEADER_X_SDK_VERSION] = _enum_index__WEBPACK_IMPORTED_MODULE_0__.SDK_VERSION,
                _a[_enum_index__WEBPACK_IMPORTED_MODULE_0__.HEADER_CONTENT_TYPE] = _enum_index__WEBPACK_IMPORTED_MODULE_0__.HEADER_APPLICATION_JSON,
                _a);
            var body = {
                visitorId: visitor.visitorId,
                type: 'CONTEXT',
                data: visitor.context
            };
            _this._httpClient.postAsync(url, { headers: headers, body: body })
                .then(function () {
                resolve();
            })
                .catch(function (error) {
                (0,_utils_utils__WEBPACK_IMPORTED_MODULE_1__.logError)(_this.config, error, 'sendContext');
            });
        });
    };
    BucketingManager.prototype.getCampaignsAsync = function (visitor) {
        var _this = this;
        this.sendContext(visitor);
        return new Promise(function (resolve) {
            if (!_this._bucketingContent) {
                resolve([]);
                return;
            }
            if (_this._bucketingContent.panic) {
                _this.panic = true;
                resolve([]);
                return;
            }
            _this.panic = false;
            if (!_this._bucketingContent.campaigns) {
                resolve([]);
                return;
            }
            var visitorCampaigns = [];
            _this._bucketingContent.campaigns.forEach(function (campaign) {
                var currentCampaigns = _this.getVisitorCampaigns(campaign.variationGroups, campaign.id, visitor);
                if (currentCampaigns) {
                    visitorCampaigns.push(currentCampaigns);
                }
            });
            resolve(visitorCampaigns);
        });
    };
    BucketingManager.prototype.getVisitorCampaigns = function (variationGroups, campaignId, visitor) {
        for (var _i = 0, variationGroups_1 = variationGroups; _i < variationGroups_1.length; _i++) {
            var variationGroup = variationGroups_1[_i];
            var check = this.isMatchTargeting(variationGroup, visitor);
            if (check) {
                var variations = this.getVariation(variationGroup, visitor.visitorId);
                if (!variations) {
                    return null;
                }
                return {
                    id: campaignId,
                    variation: variations,
                    variationGroupId: variationGroup.id
                };
            }
        }
        return null;
    };
    BucketingManager.prototype.getVariation = function (variationGroup, visitorId) {
        var hash = this._murmurHash.murmurHash3Int32(variationGroup.id + visitorId);
        var hashAllocation = hash % 100;
        var totalAllocation = 0;
        for (var _i = 0, _a = variationGroup.variations; _i < _a.length; _i++) {
            var variation = _a[_i];
            if (variation.allocation === undefined) {
                continue;
            }
            totalAllocation += variation.allocation;
            if (hashAllocation < totalAllocation) {
                return {
                    id: variation.id,
                    modifications: variation.modifications,
                    reference: !!variation.reference
                };
            }
        }
        return null;
    };
    BucketingManager.prototype.isMatchTargeting = function (variationGroup, visitor) {
        if (!variationGroup || !variationGroup.targeting || !variationGroup.targeting.targetingGroups) {
            return false;
        }
        for (var _i = 0, _a = variationGroup.targeting.targetingGroups; _i < _a.length; _i++) {
            var targetingGroup = _a[_i];
            var check = this.checkAndTargeting(targetingGroup.targetings, visitor);
            if (check) {
                return true;
            }
        }
        return false;
    };
    BucketingManager.prototype.checkAndTargeting = function (targetings, visitor) {
        var contextValue;
        var check = false;
        for (var _i = 0, targetings_1 = targetings; _i < targetings_1.length; _i++) {
            var targeting = targetings_1[_i];
            var key = targeting.key;
            if (key === 'fs_all_users') {
                check = true;
                break;
            }
            else if (key === 'fs_users') {
                contextValue = visitor.visitorId;
            }
            else {
                if (!(key in visitor.context)) {
                    continue;
                }
                contextValue = visitor.context[key];
            }
            return this.testOperator(targeting.operator, contextValue, targeting.value);
        }
        return check;
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    BucketingManager.prototype.testOperator = function (operator, contextValue, value) {
        var check;
        switch (operator) {
            case 'EQUALS':
                check = contextValue === value;
                break;
            case 'NOT_EQUALS':
                check = contextValue !== value;
                break;
            case 'CONTAINS':
                check = new RegExp("" + value.join('|')).test(contextValue.toString());
                break;
            case 'NOT_CONTAINS':
                check = !(new RegExp("" + value.join('|')).test(contextValue.toString()));
                break;
            case 'GREATER_THAN':
                check = contextValue > value;
                break;
            case 'LOWER_THAN':
                check = contextValue < value;
                break;
            case 'GREATER_THAN_OR_EQUALS':
                check = contextValue >= value;
                break;
            case 'LOWER_THAN_OR_EQUALS':
                check = contextValue <= value;
                break;
            case 'STARTS_WITH':
                check = new RegExp("^" + value).test(contextValue.toString());
                break;
            case 'ENDS_WITH':
                check = new RegExp(value + "$").test(contextValue.toString());
                break;
            default:
                check = false;
                break;
        }
        return check;
    };
    return BucketingManager;
}(_DecisionManager__WEBPACK_IMPORTED_MODULE_2__.DecisionManager));



/***/ }),

/***/ "./src/decision/DecisionManager.ts":
/*!*****************************************!*\
  !*** ./src/decision/DecisionManager.ts ***!
  \*****************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "DecisionManager": () => (/* binding */ DecisionManager)
/* harmony export */ });
/* harmony import */ var _model_Modification__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../model/Modification */ "./src/model/Modification.ts");
var __awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (undefined && undefined.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};

var DecisionManager = /** @class */ (function () {
    function DecisionManager(httpClient, config) {
        this._panic = false;
        this._config = config;
        this._httpClient = httpClient;
    }
    Object.defineProperty(DecisionManager.prototype, "config", {
        get: function () {
            return this._config;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(DecisionManager.prototype, "panic", {
        // eslint-disable-next-line accessor-pairs
        set: function (v) {
            this._panic = v;
        },
        enumerable: false,
        configurable: true
    });
    DecisionManager.prototype.getModifications = function (campaigns) {
        var modifications = new Map();
        campaigns.forEach(function (campaign) {
            var object = campaign.variation.modifications.value;
            for (var key in object) {
                var value = object[key];
                modifications.set(key, new _model_Modification__WEBPACK_IMPORTED_MODULE_0__.Modification(key, campaign.id, campaign.variationGroupId, campaign.variation.id, campaign.variation.reference, value));
            }
        });
        return modifications;
    };
    DecisionManager.prototype.getCampaignsModificationsAsync = function (visitor) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        _this.getCampaignsAsync(visitor).then(function (campaigns) {
                            resolve(_this.getModifications(campaigns));
                        }).catch(function (error) {
                            console.log('campaigns', error);
                            reject(error);
                        });
                    })];
            });
        });
    };
    DecisionManager.prototype.isPanic = function () {
        return this._panic;
    };
    return DecisionManager;
}());



/***/ }),

/***/ "./src/enum/FlagshipConstant.ts":
/*!**************************************!*\
  !*** ./src/enum/FlagshipConstant.ts ***!
  \**************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "SDK_LANGUAGE": () => (/* binding */ SDK_LANGUAGE),
/* harmony export */   "REQUEST_TIME_OUT": () => (/* binding */ REQUEST_TIME_OUT),
/* harmony export */   "BASE_API_URL": () => (/* binding */ BASE_API_URL),
/* harmony export */   "HIT_API_URL": () => (/* binding */ HIT_API_URL),
/* harmony export */   "BUCKETING_API_URL": () => (/* binding */ BUCKETING_API_URL),
/* harmony export */   "BUCKETING_API_CONTEXT_URL": () => (/* binding */ BUCKETING_API_CONTEXT_URL),
/* harmony export */   "URL_CAMPAIGNS": () => (/* binding */ URL_CAMPAIGNS),
/* harmony export */   "URL_ACTIVATE_MODIFICATION": () => (/* binding */ URL_ACTIVATE_MODIFICATION),
/* harmony export */   "EXPOSE_ALL_KEYS": () => (/* binding */ EXPOSE_ALL_KEYS),
/* harmony export */   "SDK_VERSION": () => (/* binding */ SDK_VERSION),
/* harmony export */   "SDK_STARTED_INFO": () => (/* binding */ SDK_STARTED_INFO),
/* harmony export */   "FLAGSHIP_SDK": () => (/* binding */ FLAGSHIP_SDK),
/* harmony export */   "EMIT_READY": () => (/* binding */ EMIT_READY),
/* harmony export */   "INITIALIZATION_PARAM_ERROR": () => (/* binding */ INITIALIZATION_PARAM_ERROR),
/* harmony export */   "ERROR": () => (/* binding */ ERROR),
/* harmony export */   "CONTEXT_NULL_ERROR": () => (/* binding */ CONTEXT_NULL_ERROR),
/* harmony export */   "CONTEXT_PARAM_ERROR": () => (/* binding */ CONTEXT_PARAM_ERROR),
/* harmony export */   "GET_MODIFICATION_CAST_ERROR": () => (/* binding */ GET_MODIFICATION_CAST_ERROR),
/* harmony export */   "GET_MODIFICATION_MISSING_ERROR": () => (/* binding */ GET_MODIFICATION_MISSING_ERROR),
/* harmony export */   "GET_MODIFICATION_KEY_ERROR": () => (/* binding */ GET_MODIFICATION_KEY_ERROR),
/* harmony export */   "GET_MODIFICATION_ERROR": () => (/* binding */ GET_MODIFICATION_ERROR),
/* harmony export */   "DECISION_MANAGER_MISSING_ERROR": () => (/* binding */ DECISION_MANAGER_MISSING_ERROR),
/* harmony export */   "TRACKER_MANAGER_MISSING_ERROR": () => (/* binding */ TRACKER_MANAGER_MISSING_ERROR),
/* harmony export */   "CURL_LIBRARY_IS_NOT_LOADED": () => (/* binding */ CURL_LIBRARY_IS_NOT_LOADED),
/* harmony export */   "TYPE_ERROR": () => (/* binding */ TYPE_ERROR),
/* harmony export */   "TYPE_INTEGER_ERROR": () => (/* binding */ TYPE_INTEGER_ERROR),
/* harmony export */   "VISITOR_ID_ERROR": () => (/* binding */ VISITOR_ID_ERROR),
/* harmony export */   "PANIC_MODE_ERROR": () => (/* binding */ PANIC_MODE_ERROR),
/* harmony export */   "METHOD_DEACTIVATED_CONSENT_ERROR": () => (/* binding */ METHOD_DEACTIVATED_CONSENT_ERROR),
/* harmony export */   "METHOD_DEACTIVATED_ERROR": () => (/* binding */ METHOD_DEACTIVATED_ERROR),
/* harmony export */   "METHOD_DEACTIVATED_BUCKETING_ERROR": () => (/* binding */ METHOD_DEACTIVATED_BUCKETING_ERROR),
/* harmony export */   "FLAGSHIP_VISITOR_NOT_AUTHENTICATE": () => (/* binding */ FLAGSHIP_VISITOR_NOT_AUTHENTICATE),
/* harmony export */   "PREDEFINED_CONTEXT_TYPE_ERROR": () => (/* binding */ PREDEFINED_CONTEXT_TYPE_ERROR),
/* harmony export */   "PROCESS": () => (/* binding */ PROCESS),
/* harmony export */   "PROCESS_INITIALIZATION": () => (/* binding */ PROCESS_INITIALIZATION),
/* harmony export */   "PROCESS_UPDATE_CONTEXT": () => (/* binding */ PROCESS_UPDATE_CONTEXT),
/* harmony export */   "PROCESS_GET_MODIFICATION": () => (/* binding */ PROCESS_GET_MODIFICATION),
/* harmony export */   "PROCESS_GET_MODIFICATION_INFO": () => (/* binding */ PROCESS_GET_MODIFICATION_INFO),
/* harmony export */   "PROCESS_NEW_VISITOR": () => (/* binding */ PROCESS_NEW_VISITOR),
/* harmony export */   "PROCESS_ACTIVE_MODIFICATION": () => (/* binding */ PROCESS_ACTIVE_MODIFICATION),
/* harmony export */   "PROCESS_SYNCHRONIZED_MODIFICATION": () => (/* binding */ PROCESS_SYNCHRONIZED_MODIFICATION),
/* harmony export */   "PROCESS_SEND_HIT": () => (/* binding */ PROCESS_SEND_HIT),
/* harmony export */   "PROCESS_SEND_ACTIVATE": () => (/* binding */ PROCESS_SEND_ACTIVATE),
/* harmony export */   "PROCESS_GET_CAMPAIGNS": () => (/* binding */ PROCESS_GET_CAMPAIGNS),
/* harmony export */   "PROCESS_GET_ALL_MODIFICATION": () => (/* binding */ PROCESS_GET_ALL_MODIFICATION),
/* harmony export */   "PROCESS_MODIFICATIONS_FOR_CAMPAIGN": () => (/* binding */ PROCESS_MODIFICATIONS_FOR_CAMPAIGN),
/* harmony export */   "CUSTOMER_ENV_ID_API_ITEM": () => (/* binding */ CUSTOMER_ENV_ID_API_ITEM),
/* harmony export */   "CUSTOMER_UID": () => (/* binding */ CUSTOMER_UID),
/* harmony export */   "ANONYMOUS_ID": () => (/* binding */ ANONYMOUS_ID),
/* harmony export */   "VISITOR_ID_API_ITEM": () => (/* binding */ VISITOR_ID_API_ITEM),
/* harmony export */   "VARIATION_GROUP_ID_API_ITEM": () => (/* binding */ VARIATION_GROUP_ID_API_ITEM),
/* harmony export */   "VARIATION_ID_API_ITEM": () => (/* binding */ VARIATION_ID_API_ITEM),
/* harmony export */   "DS_API_ITEM": () => (/* binding */ DS_API_ITEM),
/* harmony export */   "T_API_ITEM": () => (/* binding */ T_API_ITEM),
/* harmony export */   "DL_API_ITEM": () => (/* binding */ DL_API_ITEM),
/* harmony export */   "SDK_APP": () => (/* binding */ SDK_APP),
/* harmony export */   "TID_API_ITEM": () => (/* binding */ TID_API_ITEM),
/* harmony export */   "TA_API_ITEM": () => (/* binding */ TA_API_ITEM),
/* harmony export */   "TT_API_ITEM": () => (/* binding */ TT_API_ITEM),
/* harmony export */   "TC_API_ITEM": () => (/* binding */ TC_API_ITEM),
/* harmony export */   "TCC_API_ITEM": () => (/* binding */ TCC_API_ITEM),
/* harmony export */   "ICN_API_ITEM": () => (/* binding */ ICN_API_ITEM),
/* harmony export */   "SM_API_ITEM": () => (/* binding */ SM_API_ITEM),
/* harmony export */   "PM_API_ITEM": () => (/* binding */ PM_API_ITEM),
/* harmony export */   "TR_API_ITEM": () => (/* binding */ TR_API_ITEM),
/* harmony export */   "TS_API_ITEM": () => (/* binding */ TS_API_ITEM),
/* harmony export */   "IN_API_ITEM": () => (/* binding */ IN_API_ITEM),
/* harmony export */   "IC_API_ITEM": () => (/* binding */ IC_API_ITEM),
/* harmony export */   "IP_API_ITEM": () => (/* binding */ IP_API_ITEM),
/* harmony export */   "IQ_API_ITEM": () => (/* binding */ IQ_API_ITEM),
/* harmony export */   "IV_API_ITEM": () => (/* binding */ IV_API_ITEM),
/* harmony export */   "EVENT_CATEGORY_API_ITEM": () => (/* binding */ EVENT_CATEGORY_API_ITEM),
/* harmony export */   "EVENT_ACTION_API_ITEM": () => (/* binding */ EVENT_ACTION_API_ITEM),
/* harmony export */   "EVENT_LABEL_API_ITEM": () => (/* binding */ EVENT_LABEL_API_ITEM),
/* harmony export */   "EVENT_VALUE_API_ITEM": () => (/* binding */ EVENT_VALUE_API_ITEM),
/* harmony export */   "HEADER_X_API_KEY": () => (/* binding */ HEADER_X_API_KEY),
/* harmony export */   "HEADER_CONTENT_TYPE": () => (/* binding */ HEADER_CONTENT_TYPE),
/* harmony export */   "HEADER_X_SDK_CLIENT": () => (/* binding */ HEADER_X_SDK_CLIENT),
/* harmony export */   "HEADER_X_SDK_VERSION": () => (/* binding */ HEADER_X_SDK_VERSION),
/* harmony export */   "HEADER_APPLICATION_JSON": () => (/* binding */ HEADER_APPLICATION_JSON)
/* harmony export */ });
/**
 * SDK language
 */
var SDK_LANGUAGE = 'TypeScript';
/**
 * Default request timeout in second
 */
var REQUEST_TIME_OUT = 2;
/**
 * Decision api base url
 */
var BASE_API_URL = 'https://decision.flagship.io/v2/';
var HIT_API_URL = 'https://ariane.abtasty.com';
var BUCKETING_API_URL = 'https://cdn.flagship.io/{0}/bucketing.json';
var BUCKETING_API_CONTEXT_URL = 'https://decision.flagship.io/v2/{0}/events';
var URL_CAMPAIGNS = '/campaigns';
var URL_ACTIVATE_MODIFICATION = 'activate';
var EXPOSE_ALL_KEYS = 'exposeAllKeys';
/**
 * SDK version
 */
var SDK_VERSION = 'v2';
/**
 * Message Info
 */
var SDK_STARTED_INFO = 'Flagship SDK (version: {0}) READY';
var FLAGSHIP_SDK = 'Flagship SDK';
var EMIT_READY = 'ready';
/**
 * Message Error
 */
var INITIALIZATION_PARAM_ERROR = "Params 'envId' and 'apiKey' must not be null or empty.";
var ERROR = 'error';
var CONTEXT_NULL_ERROR = 'Context must not to be null';
var CONTEXT_PARAM_ERROR = "params {0} must be a non null String, and 'value' must be one of the following types , Number, Boolean";
var GET_MODIFICATION_CAST_ERROR = 'Modification for key {0} has a different type. Default value is returned.';
var GET_MODIFICATION_MISSING_ERROR = 'No modification for key {0}. Default value is returned.';
var GET_MODIFICATION_KEY_ERROR = 'Key {0} must not be null. Default value is returned.';
var GET_MODIFICATION_ERROR = 'No modification for key {0}.';
var DECISION_MANAGER_MISSING_ERROR = 'decisionManager must not be null.';
var TRACKER_MANAGER_MISSING_ERROR = 'trackerManager must not be null.';
var CURL_LIBRARY_IS_NOT_LOADED = 'curl library is not loaded';
var TYPE_ERROR = '{0} must be a {1}';
var TYPE_INTEGER_ERROR = 'value of {0} is not an {1}, it will be truncated to {1}';
var VISITOR_ID_ERROR = 'visitorId must not be null or empty';
var PANIC_MODE_ERROR = '{0} deactivated while panic mode is on.';
var METHOD_DEACTIVATED_CONSENT_ERROR = 'Method {0} is deactivated for visitor {1} : visitor did not consent.';
var METHOD_DEACTIVATED_ERROR = 'Method {0} is deactivated while SDK status is: {1}.';
var METHOD_DEACTIVATED_BUCKETING_ERROR = 'Method {0} is deactivated on Bucketing mode.';
var FLAGSHIP_VISITOR_NOT_AUTHENTICATE = 'Visitor is not authenticated yet';
var PREDEFINED_CONTEXT_TYPE_ERROR = 'Predefined Context {0} must be type of {1}';
// Process
var PROCESS = 'process';
var PROCESS_INITIALIZATION = 'INITIALIZATION';
var PROCESS_UPDATE_CONTEXT = 'UPDATE CONTEXT';
var PROCESS_GET_MODIFICATION = 'GET MODIFICATION';
var PROCESS_GET_MODIFICATION_INFO = 'GET MODIFICATION INFO';
var PROCESS_NEW_VISITOR = 'NEW VISITOR';
var PROCESS_ACTIVE_MODIFICATION = 'ACTIVE MODIFICATION';
var PROCESS_SYNCHRONIZED_MODIFICATION = 'SYNCHRONIZED MODIFICATION';
var PROCESS_SEND_HIT = 'SEND HIT';
var PROCESS_SEND_ACTIVATE = 'SEND ACTIVATE';
var PROCESS_GET_CAMPAIGNS = 'GET CAMPAIGNS';
var PROCESS_GET_ALL_MODIFICATION = 'GET ALL MODIFICATIONS';
var PROCESS_MODIFICATIONS_FOR_CAMPAIGN = 'GET MODIFICATION FOR CAMPAIGN';
// Api items
var CUSTOMER_ENV_ID_API_ITEM = 'cid';
var CUSTOMER_UID = 'cuid';
var ANONYMOUS_ID = 'aid';
var VISITOR_ID_API_ITEM = 'vid';
var VARIATION_GROUP_ID_API_ITEM = 'caid';
var VARIATION_ID_API_ITEM = 'vaid';
var DS_API_ITEM = 'ds';
var T_API_ITEM = 't';
var DL_API_ITEM = 'dl';
var SDK_APP = 'APP';
var TID_API_ITEM = 'tid';
var TA_API_ITEM = 'ta';
var TT_API_ITEM = 'tt';
var TC_API_ITEM = 'tc';
var TCC_API_ITEM = 'tcc';
var ICN_API_ITEM = 'icn';
var SM_API_ITEM = 'sm';
var PM_API_ITEM = 'pm';
var TR_API_ITEM = 'tr';
var TS_API_ITEM = 'ts';
var IN_API_ITEM = 'in';
var IC_API_ITEM = 'ic';
var IP_API_ITEM = 'ip';
var IQ_API_ITEM = 'iq';
var IV_API_ITEM = 'iv';
var EVENT_CATEGORY_API_ITEM = 'ec';
var EVENT_ACTION_API_ITEM = 'ea';
var EVENT_LABEL_API_ITEM = 'el';
var EVENT_VALUE_API_ITEM = 'ev';
var HEADER_X_API_KEY = 'x-api-key';
var HEADER_CONTENT_TYPE = 'Content-Type';
var HEADER_X_SDK_CLIENT = 'x-sdk-client';
var HEADER_X_SDK_VERSION = 'x-sdk-version';
var HEADER_APPLICATION_JSON = 'application/json';


/***/ }),

/***/ "./src/enum/FlagshipContext.ts":
/*!*************************************!*\
  !*** ./src/enum/FlagshipContext.ts ***!
  \*************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "DEVICE_LOCALE": () => (/* binding */ DEVICE_LOCALE),
/* harmony export */   "DEVICE_TYPE": () => (/* binding */ DEVICE_TYPE),
/* harmony export */   "DEVICE_MODEL": () => (/* binding */ DEVICE_MODEL),
/* harmony export */   "LOCATION_CITY": () => (/* binding */ LOCATION_CITY),
/* harmony export */   "LOCATION_REGION": () => (/* binding */ LOCATION_REGION),
/* harmony export */   "LOCATION_COUNTRY": () => (/* binding */ LOCATION_COUNTRY),
/* harmony export */   "LOCATION_LAT": () => (/* binding */ LOCATION_LAT),
/* harmony export */   "LOCATION_LONG": () => (/* binding */ LOCATION_LONG),
/* harmony export */   "IP": () => (/* binding */ IP),
/* harmony export */   "OS_NAME": () => (/* binding */ OS_NAME),
/* harmony export */   "OS_VERSION_NAME": () => (/* binding */ OS_VERSION_NAME),
/* harmony export */   "OS_VERSION_CODE": () => (/* binding */ OS_VERSION_CODE),
/* harmony export */   "CARRIER_NAME": () => (/* binding */ CARRIER_NAME),
/* harmony export */   "INTERNET_CONNECTION": () => (/* binding */ INTERNET_CONNECTION),
/* harmony export */   "APP_VERSION_NAME": () => (/* binding */ APP_VERSION_NAME),
/* harmony export */   "APP_VERSION_CODE": () => (/* binding */ APP_VERSION_CODE),
/* harmony export */   "INTERFACE_NAME": () => (/* binding */ INTERFACE_NAME),
/* harmony export */   "FLAGSHIP_CLIENT": () => (/* binding */ FLAGSHIP_CLIENT),
/* harmony export */   "FLAGSHIP_VERSION": () => (/* binding */ FLAGSHIP_VERSION),
/* harmony export */   "FLAGSHIP_VISITOR": () => (/* binding */ FLAGSHIP_VISITOR)
/* harmony export */ });
/**
     * Current device locale
     */
var DEVICE_LOCALE = '{"key":"sdk_deviceLanguage", "type":"string"}';
/**
  * Current device type  tablet, pc, server, iot, other

  */
var DEVICE_TYPE = '{"key":"sdk_deviceType", "type":"string"}';
/**
  * Current device model
  */
var DEVICE_MODEL = '{"key":"sdk_deviceModel", "type":"string"}';
/**
  * Current visitor city

  */
var LOCATION_CITY = '{"key":"sdk_city", "type":"string"}';
/**
  * Current visitor region

  */
var LOCATION_REGION = '{"key":"sdk_region", "type":"string"}';
/**
  * Current visitor country

  */
var LOCATION_COUNTRY = '{"key":"sdk_country", "type":"string"}';
/**
  * Current visitor latitude

  */
var LOCATION_LAT = '{"key":"sdk_lat", "type":"number"}';
/**
  * Current visitor longitude

  */
var LOCATION_LONG = '{"key":"sdk_long", "type":"number"}';
/**
  * Device public ip

  */
var IP = '{"key":"sdk_ip", "type":"string"}';
/**
  * OS name

  */
var OS_NAME = '{"key":"sdk_osName", "type":"string"}';
/**
  * OS version name

  */
var OS_VERSION_NAME = '{"key":"sdk_osVersionName", "type":"string"}';
/**
  * OS version code

  */
var OS_VERSION_CODE = '{"key":"sdk_osVersionCode", "type":"number"}';
/**
  * Carrier operator

  */
var CARRIER_NAME = '{"key":"sdk_carrierName", "type":"string"}';
/**
  * Internet connection type : 4G, 5G, Fiber

  */
var INTERNET_CONNECTION = '{"key":"sdk_internetConnection", "type":"string"}';
/**
  * Customer app version name

  */
var APP_VERSION_NAME = '{"key":"sdk_versionName", "type":"string"}';
/**
  * Customer app version code

  */
var APP_VERSION_CODE = '{"key":"sdk_versionCode", "type":"number"}';
/**
  * Current customer app interface name

  */
var INTERFACE_NAME = '{"key":"sdk_interfaceName", "type":"string"}';
/**
  * Flagship SDK client name

  */
var FLAGSHIP_CLIENT = '{"key":"fs_client", "type":"string"}';
/**
  * Flagship SDK version name

  */
var FLAGSHIP_VERSION = '{"key":"fs_version", "type":"string"}';
/**
  * Current visitor id

  */
var FLAGSHIP_VISITOR = '{"key":"fs_users", "type":"string"}';


/***/ }),

/***/ "./src/enum/FlagshipStatus.ts":
/*!************************************!*\
  !*** ./src/enum/FlagshipStatus.ts ***!
  \************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "FlagshipStatus": () => (/* binding */ FlagshipStatus)
/* harmony export */ });
var FlagshipStatus;
(function (FlagshipStatus) {
    /**
        * It is the default initial status. This status remains until the sdk has been initialized successfully.
        * Flagship SDK has not been started or initialized successfully.
        * @deprecated in v2, use FlagshipStatus::NOT_INITIALIZED instead of
        */
    FlagshipStatus[FlagshipStatus["NOT_READY"] = 0] = "NOT_READY";
    /**
     * It is the default initial status. This status remains until the sdk has been initialized successfully.
     */
    FlagshipStatus[FlagshipStatus["NOT_INITIALIZED"] = 0] = "NOT_INITIALIZED";
    /**
     * Flagship SDK is starting.
     */
    FlagshipStatus[FlagshipStatus["STARTING"] = 1] = "STARTING";
    /**
     * Flagship SDK has been started successfully but is still polling campaigns.
     */
    FlagshipStatus[FlagshipStatus["POLLING"] = 2] = "POLLING";
    /**
     * Flagship SDK is ready but is running in Panic mode: All features are disabled except the one which refresh this status.
     */
    FlagshipStatus[FlagshipStatus["READY_PANIC_ON"] = 3] = "READY_PANIC_ON";
    /**
     * Flagship SDK is ready to use.
     */
    FlagshipStatus[FlagshipStatus["READY"] = 4] = "READY";
})(FlagshipStatus || (FlagshipStatus = {}));


/***/ }),

/***/ "./src/enum/HitType.ts":
/*!*****************************!*\
  !*** ./src/enum/HitType.ts ***!
  \*****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "HitType": () => (/* binding */ HitType)
/* harmony export */ });
var HitType;
(function (HitType) {
    /**
     * User has seen a URL
     *
     */
    HitType["PAGE_VIEW"] = "PAGEVIEW";
    /**
     * User has seen a URL
     *
     */
    HitType["PAGE"] = "PAGE";
    /**
     * User has seen a screen.
     *
     */
    HitType["SCREEN_VIEW"] = "SCREENVIEW";
    /**
     * User has seen a screen.
     *
     */
    HitType["SCREEN"] = "SCREEN";
    /**
     * User has made a transaction.
     *
     */
    HitType["TRANSACTION"] = "TRANSACTION";
    /**
     * Item bought in a transaction.
     *
     */
    HitType["ITEM"] = "ITEM";
    /**
     * User has made a specific action.
     *
     */
    HitType["EVENT"] = "EVENT";
})(HitType || (HitType = {}));


/***/ }),

/***/ "./src/enum/LogLevel.ts":
/*!******************************!*\
  !*** ./src/enum/LogLevel.ts ***!
  \******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "LogLevel": () => (/* binding */ LogLevel)
/* harmony export */ });
var LogLevel;
(function (LogLevel) {
    /**
       * NONE = 0: Logging will be disabled.
       */
    LogLevel[LogLevel["NONE"] = 0] = "NONE";
    /**
       * EMERGENCY = 1: Only emergencies will be logged.
       */
    LogLevel[LogLevel["EMERGENCY"] = 1] = "EMERGENCY";
    /**
       * ALERT = 2: Only alerts and above will be logged.
       */
    LogLevel[LogLevel["ALERT"] = 2] = "ALERT";
    /**
       * CRITICAL = 3: Only critical and above will be logged.
       */
    LogLevel[LogLevel["CRITICAL"] = 3] = "CRITICAL";
    /**
       * ERROR = 4: Only errors and above will be logged.
       */
    LogLevel[LogLevel["ERROR"] = 4] = "ERROR";
    /**
       * WARNING = 5: Only warnings and above will be logged.
       */
    LogLevel[LogLevel["WARNING"] = 5] = "WARNING";
    /**
       * NOTICE = 6: Only notices and above will be logged.
       */
    LogLevel[LogLevel["NOTICE"] = 6] = "NOTICE";
    /**
       * INFO = 7: Only info logs and above will be logged.
       */
    LogLevel[LogLevel["INFO"] = 7] = "INFO";
    /**
       * DEBUG = 8: Only debug logs and above will be logged.
       */
    LogLevel[LogLevel["DEBUG"] = 8] = "DEBUG";
    /**
       * ALL = 9: All logs will be logged.
       */
    LogLevel[LogLevel["ALL"] = 9] = "ALL";
})(LogLevel || (LogLevel = {}));


/***/ }),

/***/ "./src/enum/index.ts":
/*!***************************!*\
  !*** ./src/enum/index.ts ***!
  \***************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "LogLevel": () => (/* reexport safe */ _LogLevel__WEBPACK_IMPORTED_MODULE_0__.LogLevel),
/* harmony export */   "ANONYMOUS_ID": () => (/* reexport safe */ _FlagshipConstant__WEBPACK_IMPORTED_MODULE_1__.ANONYMOUS_ID),
/* harmony export */   "BASE_API_URL": () => (/* reexport safe */ _FlagshipConstant__WEBPACK_IMPORTED_MODULE_1__.BASE_API_URL),
/* harmony export */   "BUCKETING_API_CONTEXT_URL": () => (/* reexport safe */ _FlagshipConstant__WEBPACK_IMPORTED_MODULE_1__.BUCKETING_API_CONTEXT_URL),
/* harmony export */   "BUCKETING_API_URL": () => (/* reexport safe */ _FlagshipConstant__WEBPACK_IMPORTED_MODULE_1__.BUCKETING_API_URL),
/* harmony export */   "CONTEXT_NULL_ERROR": () => (/* reexport safe */ _FlagshipConstant__WEBPACK_IMPORTED_MODULE_1__.CONTEXT_NULL_ERROR),
/* harmony export */   "CONTEXT_PARAM_ERROR": () => (/* reexport safe */ _FlagshipConstant__WEBPACK_IMPORTED_MODULE_1__.CONTEXT_PARAM_ERROR),
/* harmony export */   "CURL_LIBRARY_IS_NOT_LOADED": () => (/* reexport safe */ _FlagshipConstant__WEBPACK_IMPORTED_MODULE_1__.CURL_LIBRARY_IS_NOT_LOADED),
/* harmony export */   "CUSTOMER_ENV_ID_API_ITEM": () => (/* reexport safe */ _FlagshipConstant__WEBPACK_IMPORTED_MODULE_1__.CUSTOMER_ENV_ID_API_ITEM),
/* harmony export */   "CUSTOMER_UID": () => (/* reexport safe */ _FlagshipConstant__WEBPACK_IMPORTED_MODULE_1__.CUSTOMER_UID),
/* harmony export */   "DECISION_MANAGER_MISSING_ERROR": () => (/* reexport safe */ _FlagshipConstant__WEBPACK_IMPORTED_MODULE_1__.DECISION_MANAGER_MISSING_ERROR),
/* harmony export */   "DL_API_ITEM": () => (/* reexport safe */ _FlagshipConstant__WEBPACK_IMPORTED_MODULE_1__.DL_API_ITEM),
/* harmony export */   "DS_API_ITEM": () => (/* reexport safe */ _FlagshipConstant__WEBPACK_IMPORTED_MODULE_1__.DS_API_ITEM),
/* harmony export */   "EMIT_READY": () => (/* reexport safe */ _FlagshipConstant__WEBPACK_IMPORTED_MODULE_1__.EMIT_READY),
/* harmony export */   "ERROR": () => (/* reexport safe */ _FlagshipConstant__WEBPACK_IMPORTED_MODULE_1__.ERROR),
/* harmony export */   "EVENT_ACTION_API_ITEM": () => (/* reexport safe */ _FlagshipConstant__WEBPACK_IMPORTED_MODULE_1__.EVENT_ACTION_API_ITEM),
/* harmony export */   "EVENT_CATEGORY_API_ITEM": () => (/* reexport safe */ _FlagshipConstant__WEBPACK_IMPORTED_MODULE_1__.EVENT_CATEGORY_API_ITEM),
/* harmony export */   "EVENT_LABEL_API_ITEM": () => (/* reexport safe */ _FlagshipConstant__WEBPACK_IMPORTED_MODULE_1__.EVENT_LABEL_API_ITEM),
/* harmony export */   "EVENT_VALUE_API_ITEM": () => (/* reexport safe */ _FlagshipConstant__WEBPACK_IMPORTED_MODULE_1__.EVENT_VALUE_API_ITEM),
/* harmony export */   "EXPOSE_ALL_KEYS": () => (/* reexport safe */ _FlagshipConstant__WEBPACK_IMPORTED_MODULE_1__.EXPOSE_ALL_KEYS),
/* harmony export */   "FLAGSHIP_SDK": () => (/* reexport safe */ _FlagshipConstant__WEBPACK_IMPORTED_MODULE_1__.FLAGSHIP_SDK),
/* harmony export */   "FLAGSHIP_VISITOR_NOT_AUTHENTICATE": () => (/* reexport safe */ _FlagshipConstant__WEBPACK_IMPORTED_MODULE_1__.FLAGSHIP_VISITOR_NOT_AUTHENTICATE),
/* harmony export */   "GET_MODIFICATION_CAST_ERROR": () => (/* reexport safe */ _FlagshipConstant__WEBPACK_IMPORTED_MODULE_1__.GET_MODIFICATION_CAST_ERROR),
/* harmony export */   "GET_MODIFICATION_ERROR": () => (/* reexport safe */ _FlagshipConstant__WEBPACK_IMPORTED_MODULE_1__.GET_MODIFICATION_ERROR),
/* harmony export */   "GET_MODIFICATION_KEY_ERROR": () => (/* reexport safe */ _FlagshipConstant__WEBPACK_IMPORTED_MODULE_1__.GET_MODIFICATION_KEY_ERROR),
/* harmony export */   "GET_MODIFICATION_MISSING_ERROR": () => (/* reexport safe */ _FlagshipConstant__WEBPACK_IMPORTED_MODULE_1__.GET_MODIFICATION_MISSING_ERROR),
/* harmony export */   "HEADER_APPLICATION_JSON": () => (/* reexport safe */ _FlagshipConstant__WEBPACK_IMPORTED_MODULE_1__.HEADER_APPLICATION_JSON),
/* harmony export */   "HEADER_CONTENT_TYPE": () => (/* reexport safe */ _FlagshipConstant__WEBPACK_IMPORTED_MODULE_1__.HEADER_CONTENT_TYPE),
/* harmony export */   "HEADER_X_API_KEY": () => (/* reexport safe */ _FlagshipConstant__WEBPACK_IMPORTED_MODULE_1__.HEADER_X_API_KEY),
/* harmony export */   "HEADER_X_SDK_CLIENT": () => (/* reexport safe */ _FlagshipConstant__WEBPACK_IMPORTED_MODULE_1__.HEADER_X_SDK_CLIENT),
/* harmony export */   "HEADER_X_SDK_VERSION": () => (/* reexport safe */ _FlagshipConstant__WEBPACK_IMPORTED_MODULE_1__.HEADER_X_SDK_VERSION),
/* harmony export */   "HIT_API_URL": () => (/* reexport safe */ _FlagshipConstant__WEBPACK_IMPORTED_MODULE_1__.HIT_API_URL),
/* harmony export */   "ICN_API_ITEM": () => (/* reexport safe */ _FlagshipConstant__WEBPACK_IMPORTED_MODULE_1__.ICN_API_ITEM),
/* harmony export */   "IC_API_ITEM": () => (/* reexport safe */ _FlagshipConstant__WEBPACK_IMPORTED_MODULE_1__.IC_API_ITEM),
/* harmony export */   "INITIALIZATION_PARAM_ERROR": () => (/* reexport safe */ _FlagshipConstant__WEBPACK_IMPORTED_MODULE_1__.INITIALIZATION_PARAM_ERROR),
/* harmony export */   "IN_API_ITEM": () => (/* reexport safe */ _FlagshipConstant__WEBPACK_IMPORTED_MODULE_1__.IN_API_ITEM),
/* harmony export */   "IP_API_ITEM": () => (/* reexport safe */ _FlagshipConstant__WEBPACK_IMPORTED_MODULE_1__.IP_API_ITEM),
/* harmony export */   "IQ_API_ITEM": () => (/* reexport safe */ _FlagshipConstant__WEBPACK_IMPORTED_MODULE_1__.IQ_API_ITEM),
/* harmony export */   "IV_API_ITEM": () => (/* reexport safe */ _FlagshipConstant__WEBPACK_IMPORTED_MODULE_1__.IV_API_ITEM),
/* harmony export */   "METHOD_DEACTIVATED_BUCKETING_ERROR": () => (/* reexport safe */ _FlagshipConstant__WEBPACK_IMPORTED_MODULE_1__.METHOD_DEACTIVATED_BUCKETING_ERROR),
/* harmony export */   "METHOD_DEACTIVATED_CONSENT_ERROR": () => (/* reexport safe */ _FlagshipConstant__WEBPACK_IMPORTED_MODULE_1__.METHOD_DEACTIVATED_CONSENT_ERROR),
/* harmony export */   "METHOD_DEACTIVATED_ERROR": () => (/* reexport safe */ _FlagshipConstant__WEBPACK_IMPORTED_MODULE_1__.METHOD_DEACTIVATED_ERROR),
/* harmony export */   "PANIC_MODE_ERROR": () => (/* reexport safe */ _FlagshipConstant__WEBPACK_IMPORTED_MODULE_1__.PANIC_MODE_ERROR),
/* harmony export */   "PM_API_ITEM": () => (/* reexport safe */ _FlagshipConstant__WEBPACK_IMPORTED_MODULE_1__.PM_API_ITEM),
/* harmony export */   "PREDEFINED_CONTEXT_TYPE_ERROR": () => (/* reexport safe */ _FlagshipConstant__WEBPACK_IMPORTED_MODULE_1__.PREDEFINED_CONTEXT_TYPE_ERROR),
/* harmony export */   "PROCESS": () => (/* reexport safe */ _FlagshipConstant__WEBPACK_IMPORTED_MODULE_1__.PROCESS),
/* harmony export */   "PROCESS_ACTIVE_MODIFICATION": () => (/* reexport safe */ _FlagshipConstant__WEBPACK_IMPORTED_MODULE_1__.PROCESS_ACTIVE_MODIFICATION),
/* harmony export */   "PROCESS_GET_ALL_MODIFICATION": () => (/* reexport safe */ _FlagshipConstant__WEBPACK_IMPORTED_MODULE_1__.PROCESS_GET_ALL_MODIFICATION),
/* harmony export */   "PROCESS_GET_CAMPAIGNS": () => (/* reexport safe */ _FlagshipConstant__WEBPACK_IMPORTED_MODULE_1__.PROCESS_GET_CAMPAIGNS),
/* harmony export */   "PROCESS_GET_MODIFICATION": () => (/* reexport safe */ _FlagshipConstant__WEBPACK_IMPORTED_MODULE_1__.PROCESS_GET_MODIFICATION),
/* harmony export */   "PROCESS_GET_MODIFICATION_INFO": () => (/* reexport safe */ _FlagshipConstant__WEBPACK_IMPORTED_MODULE_1__.PROCESS_GET_MODIFICATION_INFO),
/* harmony export */   "PROCESS_INITIALIZATION": () => (/* reexport safe */ _FlagshipConstant__WEBPACK_IMPORTED_MODULE_1__.PROCESS_INITIALIZATION),
/* harmony export */   "PROCESS_MODIFICATIONS_FOR_CAMPAIGN": () => (/* reexport safe */ _FlagshipConstant__WEBPACK_IMPORTED_MODULE_1__.PROCESS_MODIFICATIONS_FOR_CAMPAIGN),
/* harmony export */   "PROCESS_NEW_VISITOR": () => (/* reexport safe */ _FlagshipConstant__WEBPACK_IMPORTED_MODULE_1__.PROCESS_NEW_VISITOR),
/* harmony export */   "PROCESS_SEND_ACTIVATE": () => (/* reexport safe */ _FlagshipConstant__WEBPACK_IMPORTED_MODULE_1__.PROCESS_SEND_ACTIVATE),
/* harmony export */   "PROCESS_SEND_HIT": () => (/* reexport safe */ _FlagshipConstant__WEBPACK_IMPORTED_MODULE_1__.PROCESS_SEND_HIT),
/* harmony export */   "PROCESS_SYNCHRONIZED_MODIFICATION": () => (/* reexport safe */ _FlagshipConstant__WEBPACK_IMPORTED_MODULE_1__.PROCESS_SYNCHRONIZED_MODIFICATION),
/* harmony export */   "PROCESS_UPDATE_CONTEXT": () => (/* reexport safe */ _FlagshipConstant__WEBPACK_IMPORTED_MODULE_1__.PROCESS_UPDATE_CONTEXT),
/* harmony export */   "REQUEST_TIME_OUT": () => (/* reexport safe */ _FlagshipConstant__WEBPACK_IMPORTED_MODULE_1__.REQUEST_TIME_OUT),
/* harmony export */   "SDK_APP": () => (/* reexport safe */ _FlagshipConstant__WEBPACK_IMPORTED_MODULE_1__.SDK_APP),
/* harmony export */   "SDK_LANGUAGE": () => (/* reexport safe */ _FlagshipConstant__WEBPACK_IMPORTED_MODULE_1__.SDK_LANGUAGE),
/* harmony export */   "SDK_STARTED_INFO": () => (/* reexport safe */ _FlagshipConstant__WEBPACK_IMPORTED_MODULE_1__.SDK_STARTED_INFO),
/* harmony export */   "SDK_VERSION": () => (/* reexport safe */ _FlagshipConstant__WEBPACK_IMPORTED_MODULE_1__.SDK_VERSION),
/* harmony export */   "SM_API_ITEM": () => (/* reexport safe */ _FlagshipConstant__WEBPACK_IMPORTED_MODULE_1__.SM_API_ITEM),
/* harmony export */   "TA_API_ITEM": () => (/* reexport safe */ _FlagshipConstant__WEBPACK_IMPORTED_MODULE_1__.TA_API_ITEM),
/* harmony export */   "TCC_API_ITEM": () => (/* reexport safe */ _FlagshipConstant__WEBPACK_IMPORTED_MODULE_1__.TCC_API_ITEM),
/* harmony export */   "TC_API_ITEM": () => (/* reexport safe */ _FlagshipConstant__WEBPACK_IMPORTED_MODULE_1__.TC_API_ITEM),
/* harmony export */   "TID_API_ITEM": () => (/* reexport safe */ _FlagshipConstant__WEBPACK_IMPORTED_MODULE_1__.TID_API_ITEM),
/* harmony export */   "TRACKER_MANAGER_MISSING_ERROR": () => (/* reexport safe */ _FlagshipConstant__WEBPACK_IMPORTED_MODULE_1__.TRACKER_MANAGER_MISSING_ERROR),
/* harmony export */   "TR_API_ITEM": () => (/* reexport safe */ _FlagshipConstant__WEBPACK_IMPORTED_MODULE_1__.TR_API_ITEM),
/* harmony export */   "TS_API_ITEM": () => (/* reexport safe */ _FlagshipConstant__WEBPACK_IMPORTED_MODULE_1__.TS_API_ITEM),
/* harmony export */   "TT_API_ITEM": () => (/* reexport safe */ _FlagshipConstant__WEBPACK_IMPORTED_MODULE_1__.TT_API_ITEM),
/* harmony export */   "TYPE_ERROR": () => (/* reexport safe */ _FlagshipConstant__WEBPACK_IMPORTED_MODULE_1__.TYPE_ERROR),
/* harmony export */   "TYPE_INTEGER_ERROR": () => (/* reexport safe */ _FlagshipConstant__WEBPACK_IMPORTED_MODULE_1__.TYPE_INTEGER_ERROR),
/* harmony export */   "T_API_ITEM": () => (/* reexport safe */ _FlagshipConstant__WEBPACK_IMPORTED_MODULE_1__.T_API_ITEM),
/* harmony export */   "URL_ACTIVATE_MODIFICATION": () => (/* reexport safe */ _FlagshipConstant__WEBPACK_IMPORTED_MODULE_1__.URL_ACTIVATE_MODIFICATION),
/* harmony export */   "URL_CAMPAIGNS": () => (/* reexport safe */ _FlagshipConstant__WEBPACK_IMPORTED_MODULE_1__.URL_CAMPAIGNS),
/* harmony export */   "VARIATION_GROUP_ID_API_ITEM": () => (/* reexport safe */ _FlagshipConstant__WEBPACK_IMPORTED_MODULE_1__.VARIATION_GROUP_ID_API_ITEM),
/* harmony export */   "VARIATION_ID_API_ITEM": () => (/* reexport safe */ _FlagshipConstant__WEBPACK_IMPORTED_MODULE_1__.VARIATION_ID_API_ITEM),
/* harmony export */   "VISITOR_ID_API_ITEM": () => (/* reexport safe */ _FlagshipConstant__WEBPACK_IMPORTED_MODULE_1__.VISITOR_ID_API_ITEM),
/* harmony export */   "VISITOR_ID_ERROR": () => (/* reexport safe */ _FlagshipConstant__WEBPACK_IMPORTED_MODULE_1__.VISITOR_ID_ERROR),
/* harmony export */   "FlagshipStatus": () => (/* reexport safe */ _FlagshipStatus__WEBPACK_IMPORTED_MODULE_2__.FlagshipStatus),
/* harmony export */   "HitType": () => (/* reexport safe */ _HitType__WEBPACK_IMPORTED_MODULE_3__.HitType)
/* harmony export */ });
/* harmony import */ var _LogLevel__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./LogLevel */ "./src/enum/LogLevel.ts");
/* harmony import */ var _FlagshipConstant__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./FlagshipConstant */ "./src/enum/FlagshipConstant.ts");
/* harmony import */ var _FlagshipStatus__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./FlagshipStatus */ "./src/enum/FlagshipStatus.ts");
/* harmony import */ var _HitType__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./HitType */ "./src/enum/HitType.ts");






/***/ }),

/***/ "./src/hit/Event.ts":
/*!**************************!*\
  !*** ./src/hit/Event.ts ***!
  \**************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "ERROR_MESSAGE": () => (/* binding */ ERROR_MESSAGE),
/* harmony export */   "CATEGORY_ERROR": () => (/* binding */ CATEGORY_ERROR),
/* harmony export */   "EventCategory": () => (/* binding */ EventCategory),
/* harmony export */   "Event": () => (/* binding */ Event)
/* harmony export */ });
/* harmony import */ var _enum_FlagshipConstant__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../enum/FlagshipConstant */ "./src/enum/FlagshipConstant.ts");
/* harmony import */ var _enum_HitType__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../enum/HitType */ "./src/enum/HitType.ts");
/* harmony import */ var _utils_utils__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../utils/utils */ "./src/utils/utils.ts");
/* harmony import */ var _HitAbstract__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./HitAbstract */ "./src/hit/HitAbstract.ts");
var __extends = (undefined && undefined.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();




var ERROR_MESSAGE = 'event category and event action are required';
var CATEGORY_ERROR = 'The category value must be either EventCategory::ACTION_TRACKING or EventCategory::ACTION_TRACKING';
var EventCategory;
(function (EventCategory) {
    EventCategory["ACTION_TRACKING"] = "ACTION_TRACKING";
    EventCategory["USER_ENGAGEMENT"] = "USER_ENGAGEMENT";
})(EventCategory || (EventCategory = {}));
var Event = /** @class */ (function (_super) {
    __extends(Event, _super);
    function Event(event) {
        var _this = _super.call(this, _enum_HitType__WEBPACK_IMPORTED_MODULE_1__.HitType.EVENT) || this;
        var category = event.category, action = event.action, eventLabel = event.eventLabel, eventValue = event.eventValue;
        _this.category = category;
        _this.action = action;
        if (eventLabel) {
            _this.eventLabel = eventLabel;
        }
        if (eventValue) {
            _this.eventValue = eventValue;
        }
        return _this;
    }
    Object.defineProperty(Event.prototype, "category", {
        get: function () {
            return this._category;
        },
        /**
         * Specify Action Tracking or User Engagement.
         */
        set: function (v) {
            if (!(v in EventCategory)) {
                (0,_utils_utils__WEBPACK_IMPORTED_MODULE_2__.logError)(this.config, CATEGORY_ERROR, 'category');
                return;
            }
            this._category = v;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Event.prototype, "action", {
        get: function () {
            return this._action;
        },
        /**
         * Specify Event name that will also serve as the KPI
         * that you will have inside your reporting
         */
        set: function (v) {
            if (!this.isNotEmptyString(v, 'action')) {
                return;
            }
            this._action = v;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Event.prototype, "eventLabel", {
        get: function () {
            return this._eventLabel;
        },
        /**
         * Specify additional description of event.
         */
        set: function (v) {
            if (!this.isNotEmptyString(v, 'eventLabel')) {
                return;
            }
            this._eventLabel = v;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Event.prototype, "eventValue", {
        get: function () {
            return this._eventValue;
        },
        /**
         * Specify the monetary value associated with an event
         * (e.g. you earn 10 to 100 euros depending on the quality of lead generated).
         *
         * <br/> NOTE: this value must be non-negative.
         */
        set: function (v) {
            if (!this.isNumeric(v, 'eventValue')) {
                return;
            }
            this._eventValue = v;
        },
        enumerable: false,
        configurable: true
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Event.prototype.toApiKeys = function () {
        var apiKeys = _super.prototype.toApiKeys.call(this);
        apiKeys[_enum_FlagshipConstant__WEBPACK_IMPORTED_MODULE_0__.EVENT_CATEGORY_API_ITEM] = this.category;
        apiKeys[_enum_FlagshipConstant__WEBPACK_IMPORTED_MODULE_0__.EVENT_ACTION_API_ITEM] = this.action;
        if (this.eventLabel) {
            apiKeys[_enum_FlagshipConstant__WEBPACK_IMPORTED_MODULE_0__.EVENT_LABEL_API_ITEM] = this.eventLabel;
        }
        if (this.eventValue) {
            apiKeys[_enum_FlagshipConstant__WEBPACK_IMPORTED_MODULE_0__.EVENT_VALUE_API_ITEM] = this.eventValue;
        }
        return apiKeys;
    };
    Event.prototype.isReady = function () {
        return !!(_super.prototype.isReady.call(this) && this.category && this.action);
    };
    Event.prototype.getErrorMessage = function () {
        return ERROR_MESSAGE;
    };
    return Event;
}(_HitAbstract__WEBPACK_IMPORTED_MODULE_3__.HitAbstract));



/***/ }),

/***/ "./src/hit/HitAbstract.ts":
/*!********************************!*\
  !*** ./src/hit/HitAbstract.ts ***!
  \********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "HitAbstract": () => (/* binding */ HitAbstract)
/* harmony export */ });
/* harmony import */ var _enum_FlagshipConstant__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../enum/FlagshipConstant */ "./src/enum/FlagshipConstant.ts");
/* harmony import */ var _utils_utils__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../utils/utils */ "./src/utils/utils.ts");


var HitAbstract = /** @class */ (function () {
    function HitAbstract(type) {
        this.type = type;
        this._anonymousId = null;
    }
    Object.defineProperty(HitAbstract.prototype, "anonymousId", {
        get: function () {
            return this._anonymousId;
        },
        set: function (v) {
            this._anonymousId = v;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(HitAbstract.prototype, "visitorId", {
        get: function () {
            return this._visitorId;
        },
        set: function (v) {
            this._visitorId = v;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(HitAbstract.prototype, "ds", {
        get: function () {
            return this._ds;
        },
        set: function (v) {
            this._ds = v;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(HitAbstract.prototype, "type", {
        get: function () {
            return this._type;
        },
        set: function (v) {
            this._type = v;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(HitAbstract.prototype, "config", {
        get: function () {
            return this._config;
        },
        set: function (v) {
            this._config = v;
        },
        enumerable: false,
        configurable: true
    });
    /**
     * Return true if value is a string and not empty, otherwise return false
     * @param value
     * @param itemName
     * @returns
     */
    HitAbstract.prototype.isNotEmptyString = function (value, itemName) {
        if (!value || typeof value !== 'string') {
            (0,_utils_utils__WEBPACK_IMPORTED_MODULE_1__.logError)(this.config, (0,_utils_utils__WEBPACK_IMPORTED_MODULE_1__.sprintf)(_enum_FlagshipConstant__WEBPACK_IMPORTED_MODULE_0__.TYPE_ERROR, itemName, 'string'), itemName);
            return false;
        }
        return true;
    };
    HitAbstract.prototype.isNumeric = function (value, itemName) {
        if (!value || typeof value !== 'number') {
            (0,_utils_utils__WEBPACK_IMPORTED_MODULE_1__.logError)(this.config, (0,_utils_utils__WEBPACK_IMPORTED_MODULE_1__.sprintf)(_enum_FlagshipConstant__WEBPACK_IMPORTED_MODULE_0__.TYPE_ERROR, itemName, 'number'), itemName);
            return false;
        }
        return true;
    };
    HitAbstract.prototype.isInteger = function (value, itemName) {
        if (!value || typeof value !== 'number') {
            (0,_utils_utils__WEBPACK_IMPORTED_MODULE_1__.logError)(this.config, (0,_utils_utils__WEBPACK_IMPORTED_MODULE_1__.sprintf)(_enum_FlagshipConstant__WEBPACK_IMPORTED_MODULE_0__.TYPE_ERROR, itemName, 'integer'), itemName);
            return false;
        }
        if (!Number.isInteger(value)) {
            (0,_utils_utils__WEBPACK_IMPORTED_MODULE_1__.logError)(this.config, (0,_utils_utils__WEBPACK_IMPORTED_MODULE_1__.sprintf)(_enum_FlagshipConstant__WEBPACK_IMPORTED_MODULE_0__.TYPE_INTEGER_ERROR, itemName, 'integer'), itemName);
        }
        return true;
    };
    /**
     * Return an object with Api parameters as keys
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    HitAbstract.prototype.toApiKeys = function () {
        var _a;
        var apiKeys = (_a = {},
            _a[_enum_FlagshipConstant__WEBPACK_IMPORTED_MODULE_0__.VISITOR_ID_API_ITEM] = this.visitorId,
            _a[_enum_FlagshipConstant__WEBPACK_IMPORTED_MODULE_0__.DS_API_ITEM] = this.ds,
            _a[_enum_FlagshipConstant__WEBPACK_IMPORTED_MODULE_0__.CUSTOMER_ENV_ID_API_ITEM] = "" + this.config.envId,
            _a[_enum_FlagshipConstant__WEBPACK_IMPORTED_MODULE_0__.T_API_ITEM] = this.type,
            _a);
        if (this.visitorId && this._anonymousId) {
            apiKeys[_enum_FlagshipConstant__WEBPACK_IMPORTED_MODULE_0__.VISITOR_ID_API_ITEM] = this._anonymousId;
            apiKeys[_enum_FlagshipConstant__WEBPACK_IMPORTED_MODULE_0__.CUSTOMER_UID] = this.visitorId;
        }
        else {
            apiKeys[_enum_FlagshipConstant__WEBPACK_IMPORTED_MODULE_0__.VISITOR_ID_API_ITEM] = this._anonymousId || this.visitorId;
            apiKeys[_enum_FlagshipConstant__WEBPACK_IMPORTED_MODULE_0__.CUSTOMER_UID] = null;
        }
        return apiKeys;
    };
    /**
     * Return true if all required attributes are given, otherwise return false
     */
    HitAbstract.prototype.isReady = function () {
        return !!(this.visitorId &&
            this.ds &&
            this.config &&
            this.config.envId &&
            this.type);
    };
    return HitAbstract;
}());



/***/ }),

/***/ "./src/hit/Item.ts":
/*!*************************!*\
  !*** ./src/hit/Item.ts ***!
  \*************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "ERROR_MESSAGE": () => (/* binding */ ERROR_MESSAGE),
/* harmony export */   "Item": () => (/* binding */ Item)
/* harmony export */ });
/* harmony import */ var _enum_FlagshipConstant__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../enum/FlagshipConstant */ "./src/enum/FlagshipConstant.ts");
/* harmony import */ var _enum_HitType__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../enum/HitType */ "./src/enum/HitType.ts");
/* harmony import */ var _HitAbstract__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./HitAbstract */ "./src/hit/HitAbstract.ts");
var __extends = (undefined && undefined.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();



var ERROR_MESSAGE = 'Transaction Id, Item name and item code are required';
var Item = /** @class */ (function (_super) {
    __extends(Item, _super);
    /**
     *Item constructor.
     * @param transactionId : Transaction unique identifier.
     * @param productName : Name of the item product.
     * @param productSku : The SKU or item code.
     */
    function Item(item) {
        var _this = _super.call(this, _enum_HitType__WEBPACK_IMPORTED_MODULE_1__.HitType.ITEM) || this;
        var transactionId = item.transactionId, productName = item.productName, productSku = item.productSku, itemCategory = item.itemCategory, itemPrice = item.itemPrice, itemQuantity = item.itemQuantity;
        _this.transactionId = transactionId;
        _this.productName = productName;
        _this.productSku = productSku;
        if (itemCategory) {
            _this.itemCategory = itemCategory;
        }
        if (itemPrice) {
            _this.itemPrice = itemPrice;
        }
        if (itemQuantity) {
            _this.itemQuantity = itemQuantity;
        }
        return _this;
    }
    Object.defineProperty(Item.prototype, "transactionId", {
        get: function () {
            return this._transactionId;
        },
        /**
         * Specify transaction unique identifier.
         */
        set: function (v) {
            if (!this.isNotEmptyString(v, 'transactionId')) {
                return;
            }
            this._transactionId = v;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Item.prototype, "productName", {
        get: function () {
            return this._productName;
        },
        /**
         * Specify name of the item product.
         */
        set: function (v) {
            if (!this.isNotEmptyString(v, 'productName')) {
                return;
            }
            this._productName = v;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Item.prototype, "productSku", {
        get: function () {
            return this._productSku;
        },
        /**
         * Specify the SKU or item code.
         */
        set: function (v) {
            if (!this.isNotEmptyString(v, 'productSku')) {
                return;
            }
            this._productSku = v;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Item.prototype, "itemPrice", {
        get: function () {
            return this._itemPrice;
        },
        /**
         * Specify the price for a single item
         */
        set: function (v) {
            if (!this.isNumeric(v, 'itemPrice')) {
                return;
            }
            this._itemPrice = v;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Item.prototype, "itemQuantity", {
        get: function () {
            return this._itemQuantity;
        },
        /**
         * Specify the number of items purchased.
         */
        set: function (v) {
            if (!this.isInteger(v, 'itemQuantity')) {
                return;
            }
            this._itemQuantity = Math.trunc(v);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Item.prototype, "itemCategory", {
        get: function () {
            return this._itemCategory;
        },
        /**
         * Specify the category that the item belongs to
         */
        set: function (v) {
            if (!this.isNotEmptyString(v, 'itemCategory')) {
                return;
            }
            this._itemCategory = v;
        },
        enumerable: false,
        configurable: true
    });
    Item.prototype.isReady = function () {
        return !!(_super.prototype.isReady.call(this) &&
            this.transactionId &&
            this.productName &&
            this.productSku);
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Item.prototype.toApiKeys = function () {
        var apiKeys = _super.prototype.toApiKeys.call(this);
        apiKeys[_enum_FlagshipConstant__WEBPACK_IMPORTED_MODULE_0__.TID_API_ITEM] = this.transactionId;
        apiKeys[_enum_FlagshipConstant__WEBPACK_IMPORTED_MODULE_0__.IN_API_ITEM] = this.productName;
        apiKeys[_enum_FlagshipConstant__WEBPACK_IMPORTED_MODULE_0__.IC_API_ITEM] = this.productSku;
        if (this.itemPrice) {
            apiKeys[_enum_FlagshipConstant__WEBPACK_IMPORTED_MODULE_0__.IP_API_ITEM] = this.itemPrice;
        }
        if (this.itemQuantity) {
            apiKeys[_enum_FlagshipConstant__WEBPACK_IMPORTED_MODULE_0__.IQ_API_ITEM] = this.itemQuantity;
        }
        if (this.itemCategory) {
            apiKeys[_enum_FlagshipConstant__WEBPACK_IMPORTED_MODULE_0__.IV_API_ITEM] = this.itemCategory;
        }
        return apiKeys;
    };
    Item.prototype.getErrorMessage = function () {
        return ERROR_MESSAGE;
    };
    return Item;
}(_HitAbstract__WEBPACK_IMPORTED_MODULE_2__.HitAbstract));



/***/ }),

/***/ "./src/hit/Page.ts":
/*!*************************!*\
  !*** ./src/hit/Page.ts ***!
  \*************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "ERROR_MESSAGE": () => (/* binding */ ERROR_MESSAGE),
/* harmony export */   "Page": () => (/* binding */ Page)
/* harmony export */ });
/* harmony import */ var _enum_FlagshipConstant__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../enum/FlagshipConstant */ "./src/enum/FlagshipConstant.ts");
/* harmony import */ var _enum_HitType__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../enum/HitType */ "./src/enum/HitType.ts");
/* harmony import */ var _HitAbstract__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./HitAbstract */ "./src/hit/HitAbstract.ts");
var __extends = (undefined && undefined.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();



var ERROR_MESSAGE = 'documentLocation url is required';
var Page = /** @class */ (function (_super) {
    __extends(Page, _super);
    function Page(page) {
        var _this = _super.call(this, _enum_HitType__WEBPACK_IMPORTED_MODULE_1__.HitType.PAGE_VIEW) || this;
        _this.documentLocation = page === null || page === void 0 ? void 0 : page.documentLocation;
        return _this;
    }
    Object.defineProperty(Page.prototype, "documentLocation", {
        get: function () {
            return this._documentLocation;
        },
        set: function (v) {
            if (!this.isNotEmptyString(v, 'documentLocation')) {
                return;
            }
            this._documentLocation = v;
        },
        enumerable: false,
        configurable: true
    });
    Page.prototype.isReady = function () {
        return !!(_super.prototype.isReady.call(this) && this.documentLocation);
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Page.prototype.toApiKeys = function () {
        var apiKeys = _super.prototype.toApiKeys.call(this);
        apiKeys[_enum_FlagshipConstant__WEBPACK_IMPORTED_MODULE_0__.DL_API_ITEM] = this.documentLocation;
        return apiKeys;
    };
    Page.prototype.getErrorMessage = function () {
        return ERROR_MESSAGE;
    };
    return Page;
}(_HitAbstract__WEBPACK_IMPORTED_MODULE_2__.HitAbstract));



/***/ }),

/***/ "./src/hit/Screen.ts":
/*!***************************!*\
  !*** ./src/hit/Screen.ts ***!
  \***************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "ERROR_MESSAGE": () => (/* binding */ ERROR_MESSAGE),
/* harmony export */   "Screen": () => (/* binding */ Screen)
/* harmony export */ });
/* harmony import */ var _enum_FlagshipConstant__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../enum/FlagshipConstant */ "./src/enum/FlagshipConstant.ts");
/* harmony import */ var _enum_HitType__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../enum/HitType */ "./src/enum/HitType.ts");
/* harmony import */ var _HitAbstract__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./HitAbstract */ "./src/hit/HitAbstract.ts");
var __extends = (undefined && undefined.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();



var ERROR_MESSAGE = 'Screen name is required';
var Screen = /** @class */ (function (_super) {
    __extends(Screen, _super);
    function Screen(screen) {
        var _this = _super.call(this, _enum_HitType__WEBPACK_IMPORTED_MODULE_1__.HitType.SCREEN_VIEW) || this;
        _this.documentLocation = screen === null || screen === void 0 ? void 0 : screen.documentLocation;
        return _this;
    }
    Object.defineProperty(Screen.prototype, "documentLocation", {
        get: function () {
            return this._documentLocation;
        },
        set: function (v) {
            if (!this.isNotEmptyString(v, 'documentLocation')) {
                return;
            }
            this._documentLocation = v;
        },
        enumerable: false,
        configurable: true
    });
    Screen.prototype.isReady = function () {
        return !!(_super.prototype.isReady.call(this) && this.documentLocation);
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Screen.prototype.toApiKeys = function () {
        var apiKeys = _super.prototype.toApiKeys.call(this);
        apiKeys[_enum_FlagshipConstant__WEBPACK_IMPORTED_MODULE_0__.DL_API_ITEM] = this.documentLocation;
        return apiKeys;
    };
    Screen.prototype.getErrorMessage = function () {
        return ERROR_MESSAGE;
    };
    return Screen;
}(_HitAbstract__WEBPACK_IMPORTED_MODULE_2__.HitAbstract));



/***/ }),

/***/ "./src/hit/Transaction.ts":
/*!********************************!*\
  !*** ./src/hit/Transaction.ts ***!
  \********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "CURRENCY_ERROR": () => (/* binding */ CURRENCY_ERROR),
/* harmony export */   "ERROR_MESSAGE": () => (/* binding */ ERROR_MESSAGE),
/* harmony export */   "Transaction": () => (/* binding */ Transaction)
/* harmony export */ });
/* harmony import */ var _enum_FlagshipConstant__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../enum/FlagshipConstant */ "./src/enum/FlagshipConstant.ts");
/* harmony import */ var _enum_HitType__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../enum/HitType */ "./src/enum/HitType.ts");
/* harmony import */ var _utils_utils__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../utils/utils */ "./src/utils/utils.ts");
/* harmony import */ var _HitAbstract__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./HitAbstract */ "./src/hit/HitAbstract.ts");
var __extends = (undefined && undefined.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
/* eslint-disable @typescript-eslint/no-explicit-any */




var CURRENCY_ERROR = '{0} must be a string and have exactly 3 letters';
var ERROR_MESSAGE = 'Transaction Id and Transaction affiliation are required';
var Transaction = /** @class */ (function (_super) {
    __extends(Transaction, _super);
    function Transaction(transaction) {
        var _this = _super.call(this, _enum_HitType__WEBPACK_IMPORTED_MODULE_1__.HitType.TRANSACTION) || this;
        var transactionId = transaction.transactionId, affiliation = transaction.affiliation, taxes = transaction.taxes, currency = transaction.currency, couponCode = transaction.couponCode, itemCount = transaction.itemCount, shippingMethod = transaction.shippingMethod, paymentMethod = transaction.paymentMethod, totalRevenue = transaction.totalRevenue, shippingCosts = transaction.shippingCosts;
        _this.transactionId = transactionId;
        _this.affiliation = affiliation;
        if (taxes) {
            _this.taxes = taxes;
        }
        if (currency) {
            _this.currency = currency;
        }
        if (couponCode) {
            _this.couponCode = couponCode;
        }
        if (itemCount) {
            _this.itemCount = itemCount;
        }
        if (shippingMethod) {
            _this.shippingMethod = shippingMethod;
        }
        if (paymentMethod) {
            _this.paymentMethod = paymentMethod;
        }
        if (totalRevenue) {
            _this.totalRevenue = totalRevenue;
        }
        if (shippingCosts) {
            _this.shippingCosts = shippingCosts;
        }
        return _this;
    }
    Object.defineProperty(Transaction.prototype, "transactionId", {
        get: function () {
            return this._transactionId;
        },
        set: function (v) {
            if (!this.isNotEmptyString(v, 'transactionId')) {
                return;
            }
            this._transactionId = v;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Transaction.prototype, "affiliation", {
        get: function () {
            return this._affiliation;
        },
        set: function (v) {
            if (!this.isNotEmptyString(v, 'affiliation')) {
                return;
            }
            this._affiliation = v;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Transaction.prototype, "taxes", {
        get: function () {
            return this._taxes;
        },
        set: function (v) {
            if (!this.isNumeric(v, 'taxes')) {
                return;
            }
            this._taxes = v;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Transaction.prototype, "currency", {
        get: function () {
            return this._currency;
        },
        set: function (v) {
            if (!v || typeof v !== 'string' || v.length !== 3) {
                (0,_utils_utils__WEBPACK_IMPORTED_MODULE_2__.logError)(this.config, (0,_utils_utils__WEBPACK_IMPORTED_MODULE_2__.sprintf)(CURRENCY_ERROR, 'currency'), 'currency');
                return;
            }
            this._currency = v;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Transaction.prototype, "couponCode", {
        get: function () {
            return this._couponCode;
        },
        set: function (v) {
            if (!this.isNotEmptyString(v, 'couponCode')) {
                return;
            }
            this._couponCode = v;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Transaction.prototype, "itemCount", {
        get: function () {
            return this._itemCount;
        },
        set: function (v) {
            if (!this.isInteger(v, 'itemCount')) {
                return;
            }
            this._itemCount = Math.trunc(v);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Transaction.prototype, "shippingMethod", {
        get: function () {
            return this._shippingMethod;
        },
        set: function (v) {
            if (!this.isNotEmptyString(v, 'shippingMethod')) {
                return;
            }
            this._shippingMethod = v;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Transaction.prototype, "paymentMethod", {
        get: function () {
            return this._paymentMethod;
        },
        set: function (v) {
            if (!this.isNotEmptyString(v, 'paymentMethod')) {
                return;
            }
            this._paymentMethod = v;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Transaction.prototype, "totalRevenue", {
        get: function () {
            return this._totalRevenue;
        },
        set: function (v) {
            if (!this.isNumeric(v, 'totalRevenue')) {
                return;
            }
            this._totalRevenue = v;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Transaction.prototype, "shippingCosts", {
        get: function () {
            return this._shippingCosts;
        },
        set: function (v) {
            if (!this.isNumeric(v, 'shippingCosts')) {
                return;
            }
            this._shippingCosts = v;
        },
        enumerable: false,
        configurable: true
    });
    Transaction.prototype.isReady = function () {
        return !!(_super.prototype.isReady.call(this) && this.transactionId && this.affiliation);
    };
    Transaction.prototype.toApiKeys = function () {
        var apiKeys = _super.prototype.toApiKeys.call(this);
        apiKeys[_enum_FlagshipConstant__WEBPACK_IMPORTED_MODULE_0__.TID_API_ITEM] = this.transactionId;
        apiKeys[_enum_FlagshipConstant__WEBPACK_IMPORTED_MODULE_0__.TA_API_ITEM] = this.affiliation;
        if (this.taxes) {
            apiKeys[_enum_FlagshipConstant__WEBPACK_IMPORTED_MODULE_0__.TT_API_ITEM] = this.taxes;
        }
        if (this.currency) {
            apiKeys[_enum_FlagshipConstant__WEBPACK_IMPORTED_MODULE_0__.TC_API_ITEM] = this.currency;
        }
        if (this.couponCode) {
            apiKeys[_enum_FlagshipConstant__WEBPACK_IMPORTED_MODULE_0__.TCC_API_ITEM] = this.couponCode;
        }
        if (this.itemCount) {
            apiKeys[_enum_FlagshipConstant__WEBPACK_IMPORTED_MODULE_0__.ICN_API_ITEM] = this.itemCount;
        }
        if (this.shippingMethod) {
            apiKeys[_enum_FlagshipConstant__WEBPACK_IMPORTED_MODULE_0__.SM_API_ITEM] = this.shippingMethod;
        }
        if (this.paymentMethod) {
            apiKeys[_enum_FlagshipConstant__WEBPACK_IMPORTED_MODULE_0__.PM_API_ITEM] = this.paymentMethod;
        }
        if (this.totalRevenue) {
            apiKeys[_enum_FlagshipConstant__WEBPACK_IMPORTED_MODULE_0__.TR_API_ITEM] = this.totalRevenue;
        }
        if (this.shippingCosts) {
            apiKeys[_enum_FlagshipConstant__WEBPACK_IMPORTED_MODULE_0__.TS_API_ITEM] = this.shippingCosts;
        }
        return apiKeys;
    };
    Transaction.prototype.getErrorMessage = function () {
        return ERROR_MESSAGE;
    };
    return Transaction;
}(_HitAbstract__WEBPACK_IMPORTED_MODULE_3__.HitAbstract));



/***/ }),

/***/ "./src/hit/index.ts":
/*!**************************!*\
  !*** ./src/hit/index.ts ***!
  \**************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "Event": () => (/* reexport safe */ _Event__WEBPACK_IMPORTED_MODULE_0__.Event),
/* harmony export */   "EventCategory": () => (/* reexport safe */ _Event__WEBPACK_IMPORTED_MODULE_0__.EventCategory),
/* harmony export */   "Item": () => (/* reexport safe */ _Item__WEBPACK_IMPORTED_MODULE_1__.Item),
/* harmony export */   "Page": () => (/* reexport safe */ _Page__WEBPACK_IMPORTED_MODULE_2__.Page),
/* harmony export */   "Screen": () => (/* reexport safe */ _Screen__WEBPACK_IMPORTED_MODULE_3__.Screen),
/* harmony export */   "Transaction": () => (/* reexport safe */ _Transaction__WEBPACK_IMPORTED_MODULE_4__.Transaction),
/* harmony export */   "HitAbstract": () => (/* reexport safe */ _HitAbstract__WEBPACK_IMPORTED_MODULE_5__.HitAbstract)
/* harmony export */ });
/* harmony import */ var _Event__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./Event */ "./src/hit/Event.ts");
/* harmony import */ var _Item__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./Item */ "./src/hit/Item.ts");
/* harmony import */ var _Page__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./Page */ "./src/hit/Page.ts");
/* harmony import */ var _Screen__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./Screen */ "./src/hit/Screen.ts");
/* harmony import */ var _Transaction__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./Transaction */ "./src/hit/Transaction.ts");
/* harmony import */ var _HitAbstract__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./HitAbstract */ "./src/hit/HitAbstract.ts");








/***/ }),

/***/ "./src/main/Flagship.ts":
/*!******************************!*\
  !*** ./src/main/Flagship.ts ***!
  \******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "Flagship": () => (/* binding */ Flagship)
/* harmony export */ });
/* harmony import */ var _visitor_Visitor__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../visitor/Visitor */ "./src/visitor/Visitor.ts");
/* harmony import */ var _enum_FlagshipStatus__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../enum/FlagshipStatus */ "./src/enum/FlagshipStatus.ts");
/* harmony import */ var _config_FlagshipConfig__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../config/FlagshipConfig */ "./src/config/FlagshipConfig.ts");
/* harmony import */ var _config_DecisionApiConfig__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../config/DecisionApiConfig */ "./src/config/DecisionApiConfig.ts");
/* harmony import */ var _config_ConfigManager__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../config/ConfigManager */ "./src/config/ConfigManager.ts");
/* harmony import */ var _decision_ApiManager__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../decision/ApiManager */ "./src/decision/ApiManager.ts");
/* harmony import */ var _api_TrackingManager__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../api/TrackingManager */ "./src/api/TrackingManager.ts");
/* harmony import */ var _utils_NodeHttpClient__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ../utils/NodeHttpClient */ "./src/utils/NodeHttpClient.ts");
/* harmony import */ var _utils_FlagshipLogManager__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ../utils/FlagshipLogManager */ "./src/utils/FlagshipLogManager.ts");
/* harmony import */ var _utils_utils__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ../utils/utils */ "./src/utils/utils.ts");
/* harmony import */ var _enum_index__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ../enum/index */ "./src/enum/index.ts");
/* harmony import */ var _visitor_VisitorDelegate__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! ../visitor/VisitorDelegate */ "./src/visitor/VisitorDelegate.ts");
/* harmony import */ var _config_index__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! ../config/index */ "./src/config/index.ts");
/* harmony import */ var _decision_BucketingManager__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(/*! ../decision/BucketingManager */ "./src/decision/BucketingManager.ts");
/* harmony import */ var _utils_MurmurHash__WEBPACK_IMPORTED_MODULE_14__ = __webpack_require__(/*! ../utils/MurmurHash */ "./src/utils/MurmurHash.ts");















var Flagship = /** @class */ (function () {
    // eslint-disable-next-line no-useless-constructor
    function Flagship() {
        // singleton
    }
    Object.defineProperty(Flagship.prototype, "config", {
        get: function () {
            return this._config;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Flagship.prototype, "configManager", {
        get: function () {
            return this._configManger;
        },
        set: function (value) {
            this._configManger = value;
        },
        enumerable: false,
        configurable: true
    });
    Flagship.getInstance = function () {
        if (!this._instance) {
            this._instance = new this();
        }
        return this._instance;
    };
    /**
     * Return true if the SDK is properly initialized, otherwise return false
     */
    Flagship.isReady = function () {
        var _a, _b, _c, _d;
        var apiKey = (_b = (_a = this._instance) === null || _a === void 0 ? void 0 : _a.config) === null || _b === void 0 ? void 0 : _b.apiKey;
        var envId = (_d = (_c = this._instance) === null || _c === void 0 ? void 0 : _c.config) === null || _d === void 0 ? void 0 : _d.envId;
        return (!!this._instance && !!apiKey && !!envId);
    };
    Flagship.prototype.setStatus = function (status) {
        var statusChanged = this.config.statusChangedCallback;
        if (this.config && statusChanged && this._status !== status) {
            statusChanged(status);
        }
        this._status = status;
    };
    /**
     * Return current status of Flagship SDK.
     */
    Flagship.getStatus = function () {
        return this.getInstance()._status;
    };
    /**
     * Return the current config set by the customer and used by the SDK.
     */
    Flagship.getConfig = function () {
        return this.getInstance()._config;
    };
    /**
     * Start the flagship SDK, with a custom configuration implementation
     * @param {string} envId : Environment id provided by Flagship.
     * @param {string} apiKey : Secure api key provided by Flagship.
     * @param {IFlagshipConfig} config : (optional) SDK configuration.
     */
    Flagship.start = function (envId, apiKey, config) {
        var _a;
        var flagship = this.getInstance();
        if (!(config instanceof _config_FlagshipConfig__WEBPACK_IMPORTED_MODULE_2__.FlagshipConfig)) {
            if ((config === null || config === void 0 ? void 0 : config.decisionMode) === _config_FlagshipConfig__WEBPACK_IMPORTED_MODULE_2__.DecisionMode.BUCKETING) {
                config = new _config_index__WEBPACK_IMPORTED_MODULE_12__.BucketingConfig(config);
            }
            else {
                config = new _config_DecisionApiConfig__WEBPACK_IMPORTED_MODULE_3__.DecisionApiConfig(config);
            }
        }
        config.envId = envId;
        config.apiKey = apiKey;
        flagship._config = config;
        flagship.setStatus(_enum_FlagshipStatus__WEBPACK_IMPORTED_MODULE_1__.FlagshipStatus.NOT_INITIALIZED);
        // check custom logger
        if (!config.logManager) {
            config.logManager = new _utils_FlagshipLogManager__WEBPACK_IMPORTED_MODULE_8__.FlagshipLogManager();
        }
        if (!envId || envId === '' || !apiKey || apiKey === '') {
            (0,_utils_utils__WEBPACK_IMPORTED_MODULE_9__.logError)(config, _enum_index__WEBPACK_IMPORTED_MODULE_10__.INITIALIZATION_PARAM_ERROR, _enum_index__WEBPACK_IMPORTED_MODULE_10__.PROCESS_INITIALIZATION);
            return;
        }
        var decisionManager = (_a = flagship.configManager) === null || _a === void 0 ? void 0 : _a.decisionManager;
        if (typeof decisionManager === 'object' && decisionManager instanceof _decision_BucketingManager__WEBPACK_IMPORTED_MODULE_13__.BucketingManager) {
            decisionManager.stopPolling();
        }
        var httpClient = new _utils_NodeHttpClient__WEBPACK_IMPORTED_MODULE_7__.HttpClient();
        if (config.decisionMode === _config_FlagshipConfig__WEBPACK_IMPORTED_MODULE_2__.DecisionMode.BUCKETING) {
            decisionManager = new _decision_BucketingManager__WEBPACK_IMPORTED_MODULE_13__.BucketingManager(httpClient, config, new _utils_MurmurHash__WEBPACK_IMPORTED_MODULE_14__.MurmurHash());
            var bucketingManager = decisionManager;
            bucketingManager.startPolling();
        }
        else {
            decisionManager = new _decision_ApiManager__WEBPACK_IMPORTED_MODULE_5__.ApiManager(httpClient, config);
        }
        var trackingManager = new _api_TrackingManager__WEBPACK_IMPORTED_MODULE_6__.TrackingManager(httpClient, config);
        flagship.configManager = new _config_ConfigManager__WEBPACK_IMPORTED_MODULE_4__.ConfigManager(config, decisionManager, trackingManager);
        if (this.isReady()) {
            flagship.setStatus(_enum_FlagshipStatus__WEBPACK_IMPORTED_MODULE_1__.FlagshipStatus.READY);
            (0,_utils_utils__WEBPACK_IMPORTED_MODULE_9__.logInfo)(config, (0,_utils_utils__WEBPACK_IMPORTED_MODULE_9__.sprintf)(_enum_index__WEBPACK_IMPORTED_MODULE_10__.SDK_STARTED_INFO, _enum_index__WEBPACK_IMPORTED_MODULE_10__.SDK_VERSION), _enum_index__WEBPACK_IMPORTED_MODULE_10__.PROCESS_INITIALIZATION);
        }
    };
    Flagship.newVisitor = function (params, params2) {
        var _a;
        if (!this.isReady()) {
            return null;
        }
        var visitorId;
        var context;
        var isAuthenticated = false;
        if (typeof params === 'string' || params === null) {
            visitorId = params;
            context = params2 || {};
        }
        else {
            visitorId = params.visitorId || null;
            context = params.context || {};
            isAuthenticated = (_a = params.isAuthenticated) !== null && _a !== void 0 ? _a : false;
        }
        var visitorDelegate = new _visitor_VisitorDelegate__WEBPACK_IMPORTED_MODULE_11__.VisitorDelegate({
            visitorId: visitorId,
            context: context,
            isAuthenticated: isAuthenticated,
            configManager: this.getInstance().configManager
        });
        var visitor = new _visitor_Visitor__WEBPACK_IMPORTED_MODULE_0__.Visitor(visitorDelegate);
        if (this.getConfig().fetchNow) {
            visitor.synchronizeModifications();
        }
        return visitor;
    };
    return Flagship;
}());



/***/ }),

/***/ "./src/model/Modification.ts":
/*!***********************************!*\
  !*** ./src/model/Modification.ts ***!
  \***********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "Modification": () => (/* binding */ Modification)
/* harmony export */ });
var Modification = /** @class */ (function () {
    function Modification(key, campaignId, variationGroupId, variationId, isReference, value) {
        this._key = key;
        this._campaignId = campaignId;
        this._variationGroupId = variationGroupId;
        this._variationId = variationId;
        this._isReference = isReference;
        this._value = value;
    }
    Object.defineProperty(Modification.prototype, "key", {
        get: function () {
            return this._key;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Modification.prototype, "campaignId", {
        get: function () {
            return this._campaignId;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Modification.prototype, "variationGroupId", {
        get: function () {
            return this._variationGroupId;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Modification.prototype, "variationId", {
        get: function () {
            return this._variationId;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Modification.prototype, "isReference", {
        get: function () {
            return this._isReference;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Modification.prototype, "value", {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        get: function () {
            return this._value;
        },
        enumerable: false,
        configurable: true
    });
    return Modification;
}());



/***/ }),

/***/ "./src/nodeDeps.ts":
/*!*************************!*\
  !*** ./src/nodeDeps.ts ***!
  \*************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "EventEmitter": () => (/* reexport safe */ events__WEBPACK_IMPORTED_MODULE_0__.EventEmitter)
/* harmony export */ });
/* harmony import */ var events__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! events */ "events");
/* harmony import */ var events__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(events__WEBPACK_IMPORTED_MODULE_0__);



/***/ }),

/***/ "./src/utils/FlagshipLogManager.ts":
/*!*****************************************!*\
  !*** ./src/utils/FlagshipLogManager.ts ***!
  \*****************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "FlagshipLogManager": () => (/* binding */ FlagshipLogManager)
/* harmony export */ });
/* harmony import */ var _enum_index__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../enum/index */ "./src/enum/index.ts");

var FlagshipLogManager = /** @class */ (function () {
    function FlagshipLogManager() {
    }
    FlagshipLogManager.prototype.emergency = function (message, tag) {
        this.log(_enum_index__WEBPACK_IMPORTED_MODULE_0__.LogLevel.EMERGENCY, message, tag);
    };
    FlagshipLogManager.prototype.alert = function (message, tag) {
        this.log(_enum_index__WEBPACK_IMPORTED_MODULE_0__.LogLevel.ALERT, message, tag);
    };
    FlagshipLogManager.prototype.critical = function (message, tag) {
        this.log(_enum_index__WEBPACK_IMPORTED_MODULE_0__.LogLevel.CRITICAL, message, tag);
    };
    FlagshipLogManager.prototype.error = function (message, tag) {
        this.log(_enum_index__WEBPACK_IMPORTED_MODULE_0__.LogLevel.ERROR, message, tag);
    };
    FlagshipLogManager.prototype.warning = function (message, tag) {
        this.log(_enum_index__WEBPACK_IMPORTED_MODULE_0__.LogLevel.WARNING, message, tag);
    };
    FlagshipLogManager.prototype.notice = function (message, tag) {
        this.log(_enum_index__WEBPACK_IMPORTED_MODULE_0__.LogLevel.NOTICE, message, tag);
    };
    FlagshipLogManager.prototype.info = function (message, tag) {
        this.log(_enum_index__WEBPACK_IMPORTED_MODULE_0__.LogLevel.INFO, message, tag);
    };
    FlagshipLogManager.prototype.debug = function (message, tag) {
        this.log(_enum_index__WEBPACK_IMPORTED_MODULE_0__.LogLevel.DEBUG, message, tag);
    };
    FlagshipLogManager.prototype.log = function (level, message, tag) {
        var now = new Date();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        var getTwoDigit = function (value) {
            return value.toString().length === 1 ? "0" + value : value;
        };
        var out = "[" + getTwoDigit(now.getFullYear()) + "-" + getTwoDigit(now.getMonth()) + "-" + getTwoDigit(now.getDay()) + " " + getTwoDigit(now.getHours()) + ":" + getTwoDigit(now.getMinutes()) + "] [" + _enum_index__WEBPACK_IMPORTED_MODULE_0__.FLAGSHIP_SDK + "] [" + _enum_index__WEBPACK_IMPORTED_MODULE_0__.LogLevel[level] + "] [" + tag + "] : " + message;
        console.log(out);
    };
    return FlagshipLogManager;
}());



/***/ }),

/***/ "./src/utils/MurmurHash.ts":
/*!*********************************!*\
  !*** ./src/utils/MurmurHash.ts ***!
  \*********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "MurmurHash": () => (/* binding */ MurmurHash)
/* harmony export */ });
/* eslint-disable no-fallthrough */
var MurmurHash = /** @class */ (function () {
    function MurmurHash() {
    }
    MurmurHash.prototype.murmurHash3Int32 = function (key, seed) {
        if (seed === void 0) { seed = 0; }
        var h1, h1b, k1, i;
        var remainder = key.length & 3; // key.length % 4
        var bytes = key.length - remainder;
        h1 = seed;
        var c1 = 0xcc9e2d51;
        var c2 = 0x1b873593;
        i = 0;
        while (i < bytes) {
            k1 = (key.charCodeAt(i) & 0xff) | ((key.charCodeAt(++i) & 0xff) << 8) | ((key.charCodeAt(++i) & 0xff) << 16) | ((key.charCodeAt(++i) & 0xff) << 24);
            ++i;
            k1 = (((k1 & 0xffff) * c1) + ((((k1 >>> 16) * c1) & 0xffff) << 16)) & 0xffffffff;
            k1 = (k1 << 15) | (k1 >>> 17);
            k1 = (((k1 & 0xffff) * c2) + ((((k1 >>> 16) * c2) & 0xffff) << 16)) & 0xffffffff;
            h1 ^= k1;
            h1 = (h1 << 13) | (h1 >>> 19);
            h1b = (((h1 & 0xffff) * 5) + ((((h1 >>> 16) * 5) & 0xffff) << 16)) & 0xffffffff;
            h1 = (((h1b & 0xffff) + 0x6b64) + ((((h1b >>> 16) + 0xe654) & 0xffff) << 16));
        }
        k1 = 0;
        switch (remainder) {
            case 3: k1 ^= (key.charCodeAt(i + 2) & 0xff) << 16;
            case 2: k1 ^= (key.charCodeAt(i + 1) & 0xff) << 8;
            case 1:
                k1 ^= (key.charCodeAt(i) & 0xff);
                k1 = (((k1 & 0xffff) * c1) + ((((k1 >>> 16) * c1) & 0xffff) << 16)) & 0xffffffff;
                k1 = (k1 << 15) | (k1 >>> 17);
                k1 = (((k1 & 0xffff) * c2) + ((((k1 >>> 16) * c2) & 0xffff) << 16)) & 0xffffffff;
                h1 ^= k1;
        }
        h1 ^= key.length;
        h1 ^= h1 >>> 16;
        h1 = (((h1 & 0xffff) * 0x85ebca6b) + ((((h1 >>> 16) * 0x85ebca6b) & 0xffff) << 16)) & 0xffffffff;
        h1 ^= h1 >>> 13;
        h1 = (((h1 & 0xffff) * 0xc2b2ae35) + ((((h1 >>> 16) * 0xc2b2ae35) & 0xffff) << 16)) & 0xffffffff;
        h1 ^= h1 >>> 16;
        return h1 >>> 0;
    };
    return MurmurHash;
}());



/***/ }),

/***/ "./src/utils/NodeHttpClient.ts":
/*!*************************************!*\
  !*** ./src/utils/NodeHttpClient.ts ***!
  \*************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "HttpClient": () => (/* binding */ HttpClient)
/* harmony export */ });
/* harmony import */ var axios__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! axios */ "./node_modules/axios/index.js");
/* harmony import */ var axios__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(axios__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _enum__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../enum */ "./src/enum/index.ts");


var HttpClient = /** @class */ (function () {
    function HttpClient() {
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    HttpClient.prototype.getResponse = function (response) {
        return {
            headers: response.headers,
            status: response.status,
            body: response.data
        };
    };
    HttpClient.prototype.getAsync = function (url, options) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            axios__WEBPACK_IMPORTED_MODULE_0___default().get(url, {
                headers: options === null || options === void 0 ? void 0 : options.headers,
                timeout: (options === null || options === void 0 ? void 0 : options.timeout) ? options.timeout * 1000 : _enum__WEBPACK_IMPORTED_MODULE_1__.REQUEST_TIME_OUT * 1000
            })
                .then(function (response) {
                resolve(_this.getResponse(response));
            }).catch(function (error) {
                reject(error.message);
            });
        });
    };
    HttpClient.prototype.postAsync = function (url, options) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            axios__WEBPACK_IMPORTED_MODULE_0___default().post(url, options.body, {
                headers: options.headers,
                timeout: options.timeout ? options.timeout * 1000 : _enum__WEBPACK_IMPORTED_MODULE_1__.REQUEST_TIME_OUT * 1000
            })
                .then(function (response) {
                resolve(_this.getResponse(response));
            })
                .catch(function (error) {
                reject(error.message);
            });
        });
    };
    return HttpClient;
}());



/***/ }),

/***/ "./src/utils/utils.ts":
/*!****************************!*\
  !*** ./src/utils/utils.ts ***!
  \****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "sprintf": () => (/* binding */ sprintf),
/* harmony export */   "logError": () => (/* binding */ logError),
/* harmony export */   "logInfo": () => (/* binding */ logInfo),
/* harmony export */   "sleep": () => (/* binding */ sleep)
/* harmony export */ });
/* harmony import */ var _enum_index__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../enum/index */ "./src/enum/index.ts");

/**
 * Return a formatted string
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function sprintf(format) {
    var value = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        value[_i - 1] = arguments[_i];
    }
    var formatted = format;
    for (var i = 0; i < value.length; i++) {
        var element = value[i];
        formatted = formatted.replace(new RegExp("\\{" + i + "\\}", 'g'), element);
    }
    return formatted;
}
function logError(config, message, tag) {
    if (!config ||
        !config.logManager ||
        typeof config.logManager.error !== 'function' ||
        !config.logLevel ||
        config.logLevel < _enum_index__WEBPACK_IMPORTED_MODULE_0__.LogLevel.ERROR) {
        return;
    }
    config.logManager.error(message, tag);
}
function logInfo(config, message, tag) {
    if (!config ||
        !config.logManager ||
        typeof config.logManager.info !== 'function' ||
        !config.logLevel ||
        config.logLevel < _enum_index__WEBPACK_IMPORTED_MODULE_0__.LogLevel.INFO) {
        return;
    }
    config.logManager.info(message, tag);
}
function sleep(ms) {
    return new Promise(function (resolve) { return setTimeout(resolve, ms); });
}


/***/ }),

/***/ "./src/visitor/DefaultStrategy.ts":
/*!****************************************!*\
  !*** ./src/visitor/DefaultStrategy.ts ***!
  \****************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "TYPE_HIT_REQUIRED_ERROR": () => (/* binding */ TYPE_HIT_REQUIRED_ERROR),
/* harmony export */   "DefaultStrategy": () => (/* binding */ DefaultStrategy)
/* harmony export */ });
/* harmony import */ var _enum_index__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../enum/index */ "./src/enum/index.ts");
/* harmony import */ var _hit_index__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../hit/index */ "./src/hit/index.ts");
/* harmony import */ var _utils_utils__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../utils/utils */ "./src/utils/utils.ts");
/* harmony import */ var _VisitorStrategyAbstract__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./VisitorStrategyAbstract */ "./src/visitor/VisitorStrategyAbstract.ts");
/* harmony import */ var _config_index__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../config/index */ "./src/config/index.ts");
var __extends = (undefined && undefined.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (undefined && undefined.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};





var TYPE_HIT_REQUIRED_ERROR = 'property type is required and must ';
var DefaultStrategy = /** @class */ (function (_super) {
    __extends(DefaultStrategy, _super);
    function DefaultStrategy() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     *  Update the visitor context values, matching the given keys, used for targeting.
     *
     * A new context value associated with this key will be created if there is no previous matching value.
     * Context key must be String, and value type must be one of the following : Number, Boolean, String.
     * @param {string} key : context key.
     * @param {primitive} value : context value.
     */
    DefaultStrategy.prototype.updateContextKeyValue = function (key, value) {
        var valueType = typeof value;
        if (typeof key !== 'string' ||
            key === '' ||
            (valueType !== 'string' && valueType !== 'number' && valueType !== 'boolean')) {
            (0,_utils_utils__WEBPACK_IMPORTED_MODULE_2__.logError)(this.visitor.config, (0,_utils_utils__WEBPACK_IMPORTED_MODULE_2__.sprintf)(_enum_index__WEBPACK_IMPORTED_MODULE_0__.CONTEXT_PARAM_ERROR, key), _enum_index__WEBPACK_IMPORTED_MODULE_0__.PROCESS_UPDATE_CONTEXT);
            return;
        }
        var predefinedContext = this.getPredefinedContext(key, value);
        if (predefinedContext) {
            if (!predefinedContext.check) {
                (0,_utils_utils__WEBPACK_IMPORTED_MODULE_2__.logError)(this.config, (0,_utils_utils__WEBPACK_IMPORTED_MODULE_2__.sprintf)(_enum_index__WEBPACK_IMPORTED_MODULE_0__.PREDEFINED_CONTEXT_TYPE_ERROR, predefinedContext.key, predefinedContext.type), _enum_index__WEBPACK_IMPORTED_MODULE_0__.PROCESS_UPDATE_CONTEXT);
                return;
            }
            key = predefinedContext.key;
        }
        if (key.match(/^fs_/i)) {
            return;
        }
        this.visitor.context[key] = value;
    };
    DefaultStrategy.prototype.updateContext = function (context) {
        if (!context) {
            (0,_utils_utils__WEBPACK_IMPORTED_MODULE_2__.logError)(this.visitor.config, _enum_index__WEBPACK_IMPORTED_MODULE_0__.CONTEXT_NULL_ERROR, _enum_index__WEBPACK_IMPORTED_MODULE_0__.PROCESS_UPDATE_CONTEXT);
            return;
        }
        for (var key in context) {
            var value = context[key];
            this.updateContextKeyValue(key, value);
        }
    };
    DefaultStrategy.prototype.getPredefinedContext = function (key, value) {
        var checkRegex = key.match(/^{"key":".*",."type":"[a-z]*"}$/);
        if (checkRegex) {
            var predefinedContext = JSON.parse(key);
            var check = void 0;
            switch (predefinedContext.type) {
                case 'string':
                    check = typeof value === 'string';
                    break;
                case 'number':
                    check = typeof value === 'number';
                    break;
                default:
                    check = false;
                    break;
            }
            return {
                key: predefinedContext.key,
                check: check,
                type: predefinedContext.type
            };
        }
        return null;
    };
    DefaultStrategy.prototype.clearContext = function () {
        this.visitor.context = {};
    };
    DefaultStrategy.prototype.getModification = function (params, activateAll) {
        return Promise.resolve(this.getModificationSync(params, activateAll));
    };
    DefaultStrategy.prototype.checkAndGetModification = function (params, activateAll) {
        var _this = this;
        var key = params.key, defaultValue = params.defaultValue, activate = params.activate;
        if (!key || typeof key !== 'string') {
            (0,_utils_utils__WEBPACK_IMPORTED_MODULE_2__.logError)(this.config, (0,_utils_utils__WEBPACK_IMPORTED_MODULE_2__.sprintf)(_enum_index__WEBPACK_IMPORTED_MODULE_0__.GET_MODIFICATION_KEY_ERROR, key), _enum_index__WEBPACK_IMPORTED_MODULE_0__.PROCESS_GET_MODIFICATION);
            return defaultValue;
        }
        var modification = this.visitor.modifications.get(key);
        if (!modification) {
            (0,_utils_utils__WEBPACK_IMPORTED_MODULE_2__.logError)(this.config, (0,_utils_utils__WEBPACK_IMPORTED_MODULE_2__.sprintf)(_enum_index__WEBPACK_IMPORTED_MODULE_0__.GET_MODIFICATION_MISSING_ERROR, key), _enum_index__WEBPACK_IMPORTED_MODULE_0__.PROCESS_GET_MODIFICATION);
            return defaultValue;
        }
        var castError = function () {
            (0,_utils_utils__WEBPACK_IMPORTED_MODULE_2__.logError)(_this.config, (0,_utils_utils__WEBPACK_IMPORTED_MODULE_2__.sprintf)(_enum_index__WEBPACK_IMPORTED_MODULE_0__.GET_MODIFICATION_CAST_ERROR, key), _enum_index__WEBPACK_IMPORTED_MODULE_0__.PROCESS_GET_MODIFICATION);
            if (!modification.value && (activate || activateAll)) {
                _this.activateModificationSync(key);
            }
        };
        if (typeof modification.value === 'object' &&
            typeof defaultValue === 'object' &&
            Array.isArray(modification.value) !== Array.isArray(defaultValue)) {
            castError();
            return defaultValue;
        }
        if (typeof modification.value !== typeof defaultValue) {
            castError();
            return defaultValue;
        }
        if (activate || activateAll) {
            this.activateModification(key);
        }
        return modification.value;
    };
    DefaultStrategy.prototype.getModificationSync = function (params, activateAll) {
        var _this = this;
        if (Array.isArray(params)) {
            return params.map(function (item) {
                return _this.checkAndGetModification(item, activateAll);
            });
        }
        return this.checkAndGetModification(params, activateAll);
    };
    DefaultStrategy.prototype.getModificationInfo = function (key) {
        return Promise.resolve(this.getModificationInfoSync(key));
    };
    DefaultStrategy.prototype.getModificationInfoSync = function (key) {
        if (!key || typeof key !== 'string') {
            (0,_utils_utils__WEBPACK_IMPORTED_MODULE_2__.logError)(this.visitor.config, (0,_utils_utils__WEBPACK_IMPORTED_MODULE_2__.sprintf)(_enum_index__WEBPACK_IMPORTED_MODULE_0__.GET_MODIFICATION_KEY_ERROR, key), _enum_index__WEBPACK_IMPORTED_MODULE_0__.PROCESS_GET_MODIFICATION_INFO);
            return null;
        }
        var modification = this.visitor.modifications.get(key);
        if (!modification) {
            (0,_utils_utils__WEBPACK_IMPORTED_MODULE_2__.logError)(this.visitor.config, (0,_utils_utils__WEBPACK_IMPORTED_MODULE_2__.sprintf)(_enum_index__WEBPACK_IMPORTED_MODULE_0__.GET_MODIFICATION_ERROR, key), _enum_index__WEBPACK_IMPORTED_MODULE_0__.PROCESS_GET_MODIFICATION_INFO);
            return null;
        }
        return modification;
    };
    DefaultStrategy.prototype.synchronizeModifications = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.configManager.decisionManager.getCampaignsAsync(_this.visitor)
                .then(function (campaigns) {
                _this.visitor.campaigns = campaigns;
                _this.visitor.modifications = _this.visitor.configManager.decisionManager.getModifications(_this.visitor.campaigns);
                _this.visitor.emit(_enum_index__WEBPACK_IMPORTED_MODULE_0__.EMIT_READY);
                resolve();
            })
                .catch(function (error) {
                _this.visitor.emit(_enum_index__WEBPACK_IMPORTED_MODULE_0__.EMIT_READY, error);
                (0,_utils_utils__WEBPACK_IMPORTED_MODULE_2__.logError)(_this.config, error.message, _enum_index__WEBPACK_IMPORTED_MODULE_0__.PROCESS_SYNCHRONIZED_MODIFICATION);
                reject(error);
            });
        });
    };
    DefaultStrategy.prototype.activateModification = function (params) {
        return Promise.resolve(this.activateModificationSync(params));
    };
    DefaultStrategy.prototype.hasTrackingManager = function (process) {
        var check = this.configManager.trackingManager;
        if (!check) {
            (0,_utils_utils__WEBPACK_IMPORTED_MODULE_2__.logError)(this.config, (0,_utils_utils__WEBPACK_IMPORTED_MODULE_2__.sprintf)(_enum_index__WEBPACK_IMPORTED_MODULE_0__.TRACKER_MANAGER_MISSING_ERROR), process);
        }
        return !!check;
    };
    DefaultStrategy.prototype.activate = function (key) {
        var modification = this.visitor.modifications.get(key);
        if (!modification) {
            (0,_utils_utils__WEBPACK_IMPORTED_MODULE_2__.logError)(this.visitor.config, (0,_utils_utils__WEBPACK_IMPORTED_MODULE_2__.sprintf)(_enum_index__WEBPACK_IMPORTED_MODULE_0__.GET_MODIFICATION_ERROR, key), _enum_index__WEBPACK_IMPORTED_MODULE_0__.PROCESS_ACTIVE_MODIFICATION);
            return;
        }
        if (!this.hasTrackingManager(_enum_index__WEBPACK_IMPORTED_MODULE_0__.PROCESS_ACTIVE_MODIFICATION)) {
            return;
        }
        this.configManager.trackingManager.sendActive(this.visitor, modification);
    };
    DefaultStrategy.prototype.activateModificationSync = function (params) {
        var _this = this;
        if (!params || (typeof params !== 'string' && !Array.isArray(params))) {
            (0,_utils_utils__WEBPACK_IMPORTED_MODULE_2__.logError)(this.config, (0,_utils_utils__WEBPACK_IMPORTED_MODULE_2__.sprintf)(_enum_index__WEBPACK_IMPORTED_MODULE_0__.GET_MODIFICATION_KEY_ERROR, params), _enum_index__WEBPACK_IMPORTED_MODULE_0__.PROCESS_ACTIVE_MODIFICATION);
            return;
        }
        if (typeof params === 'string') {
            this.activate(params);
        }
        else if (Array.isArray(params)) {
            params.forEach(function (item) {
                if (typeof item === 'string') {
                    _this.activate(item);
                }
                else
                    _this.activate(item.key);
            });
        }
    };
    DefaultStrategy.prototype.sendHit = function (hit) {
        return Promise.resolve(this.sendHitSync(hit));
    };
    DefaultStrategy.prototype.getHit = function (hit) {
        var newHit = null;
        switch (hit.type.toUpperCase()) {
            case _enum_index__WEBPACK_IMPORTED_MODULE_0__.HitType.EVENT:
                newHit = new _hit_index__WEBPACK_IMPORTED_MODULE_1__.Event(hit);
                break;
            case _enum_index__WEBPACK_IMPORTED_MODULE_0__.HitType.ITEM:
                newHit = new _hit_index__WEBPACK_IMPORTED_MODULE_1__.Item(hit);
                break;
            case _enum_index__WEBPACK_IMPORTED_MODULE_0__.HitType.PAGE:
            case _enum_index__WEBPACK_IMPORTED_MODULE_0__.HitType.PAGE_VIEW:
                newHit = new _hit_index__WEBPACK_IMPORTED_MODULE_1__.Page(hit);
                break;
            case _enum_index__WEBPACK_IMPORTED_MODULE_0__.HitType.SCREEN:
            case _enum_index__WEBPACK_IMPORTED_MODULE_0__.HitType.SCREEN_VIEW:
                newHit = new _hit_index__WEBPACK_IMPORTED_MODULE_1__.Screen(hit);
                break;
            case _enum_index__WEBPACK_IMPORTED_MODULE_0__.HitType.TRANSACTION:
                newHit = new _hit_index__WEBPACK_IMPORTED_MODULE_1__.Transaction(hit);
                break;
        }
        return newHit;
    };
    DefaultStrategy.prototype.prepareAndSendHit = function (hit) {
        return __awaiter(this, void 0, void 0, function () {
            var hitInstance, hitFromInt;
            return __generator(this, function (_a) {
                if (hit instanceof _hit_index__WEBPACK_IMPORTED_MODULE_1__.HitAbstract) {
                    hitInstance = hit;
                }
                else {
                    hitFromInt = this.getHit(hit);
                    if (!hitFromInt) {
                        (0,_utils_utils__WEBPACK_IMPORTED_MODULE_2__.logError)(this.config, TYPE_HIT_REQUIRED_ERROR, _enum_index__WEBPACK_IMPORTED_MODULE_0__.PROCESS_SEND_HIT);
                        return [2 /*return*/];
                    }
                    hitInstance = hitFromInt;
                }
                hitInstance.visitorId = this.visitor.visitorId;
                hitInstance.ds = _enum_index__WEBPACK_IMPORTED_MODULE_0__.SDK_APP;
                hitInstance.config = this.config;
                hitInstance.anonymousId = this.visitor.anonymousId;
                if (!hitInstance.isReady()) {
                    (0,_utils_utils__WEBPACK_IMPORTED_MODULE_2__.logError)(this.config, hitInstance.getErrorMessage(), _enum_index__WEBPACK_IMPORTED_MODULE_0__.PROCESS_SEND_HIT);
                    return [2 /*return*/];
                }
                this.configManager.trackingManager.sendHit(hitInstance);
                return [2 /*return*/];
            });
        });
    };
    DefaultStrategy.prototype.sendHitSync = function (hit) {
        var _this = this;
        if (!this.hasTrackingManager(_enum_index__WEBPACK_IMPORTED_MODULE_0__.PROCESS_SEND_HIT)) {
            return;
        }
        if (Array.isArray(hit)) {
            hit.forEach(function (item) {
                _this.prepareAndSendHit(item);
            });
        }
        else {
            this.prepareAndSendHit(hit);
        }
    };
    /**
     * returns a Promise<object> containing all the data for all the campaigns associated with the current visitor.
     *@deprecated
     */
    DefaultStrategy.prototype.getAllModifications = function (activate) {
        var _this = this;
        if (activate === void 0) { activate = false; }
        if (activate) {
            this.visitor.modifications.forEach(function (_, key) {
                _this.activateModification(key);
            });
        }
        return Promise.resolve({
            visitorId: this.visitor.visitorId,
            campaigns: this.visitor.campaigns
        });
    };
    /**
     * Get data for a specific campaign.
     * @param campaignId Identifies the campaign whose modifications you want to retrieve.
     * @param activate
     * @deprecated
     * @returns
     */
    DefaultStrategy.prototype.getModificationsForCampaign = function (campaignId, activate) {
        var _this = this;
        if (activate === void 0) { activate = false; }
        if (activate) {
            this.visitor.modifications.forEach(function (value) {
                if (value.campaignId === campaignId) {
                    _this.activateModification(value.key);
                }
            });
        }
        return Promise.resolve({
            visitorId: this.visitor.visitorId,
            campaigns: this.visitor.campaigns.filter(function (x) { return x.id === campaignId; })
        });
    };
    DefaultStrategy.prototype.authenticate = function (visitorId) {
        var functionName = 'authenticate';
        if (this.config.decisionMode === _config_index__WEBPACK_IMPORTED_MODULE_4__.DecisionMode.BUCKETING) {
            this.logDeactivateOnBucketing(functionName);
            return;
        }
        if (!visitorId) {
            (0,_utils_utils__WEBPACK_IMPORTED_MODULE_2__.logError)(this.config, _enum_index__WEBPACK_IMPORTED_MODULE_0__.VISITOR_ID_ERROR, functionName);
            return;
        }
        this.visitor.anonymousId = this.visitor.visitorId;
        this.visitor.visitorId = visitorId;
    };
    DefaultStrategy.prototype.unauthenticate = function () {
        var functionName = 'unauthenticate';
        if (this.config.decisionMode === _config_index__WEBPACK_IMPORTED_MODULE_4__.DecisionMode.BUCKETING) {
            this.logDeactivateOnBucketing(functionName);
            return;
        }
        if (!this.visitor.anonymousId) {
            (0,_utils_utils__WEBPACK_IMPORTED_MODULE_2__.logError)(this.config, _enum_index__WEBPACK_IMPORTED_MODULE_0__.FLAGSHIP_VISITOR_NOT_AUTHENTICATE, functionName);
            return;
        }
        this.visitor.visitorId = this.visitor.anonymousId;
        this.visitor.anonymousId = null;
    };
    DefaultStrategy.prototype.logDeactivateOnBucketing = function (functionName) {
        (0,_utils_utils__WEBPACK_IMPORTED_MODULE_2__.logError)(this.config, (0,_utils_utils__WEBPACK_IMPORTED_MODULE_2__.sprintf)(_enum_index__WEBPACK_IMPORTED_MODULE_0__.METHOD_DEACTIVATED_BUCKETING_ERROR, functionName), functionName);
    };
    return DefaultStrategy;
}(_VisitorStrategyAbstract__WEBPACK_IMPORTED_MODULE_3__.VisitorStrategyAbstract));



/***/ }),

/***/ "./src/visitor/NoConsentStrategy.ts":
/*!******************************************!*\
  !*** ./src/visitor/NoConsentStrategy.ts ***!
  \******************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "NoConsentStrategy": () => (/* binding */ NoConsentStrategy)
/* harmony export */ });
/* harmony import */ var _enum_index__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../enum/index */ "./src/enum/index.ts");
/* harmony import */ var _utils_utils__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../utils/utils */ "./src/utils/utils.ts");
/* harmony import */ var _DefaultStrategy__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./DefaultStrategy */ "./src/visitor/DefaultStrategy.ts");
var __extends = (undefined && undefined.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();



var NoConsentStrategy = /** @class */ (function (_super) {
    __extends(NoConsentStrategy, _super);
    function NoConsentStrategy() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    NoConsentStrategy.prototype.activateModificationSync = function (params) {
        this.log('activateModification');
    };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    NoConsentStrategy.prototype.sendHitSync = function (hit) {
        this.log('sendHit');
    };
    NoConsentStrategy.prototype.log = function (methodName) {
        (0,_utils_utils__WEBPACK_IMPORTED_MODULE_1__.logError)(this.config, (0,_utils_utils__WEBPACK_IMPORTED_MODULE_1__.sprintf)(_enum_index__WEBPACK_IMPORTED_MODULE_0__.METHOD_DEACTIVATED_CONSENT_ERROR, methodName, this.visitor.visitorId), methodName);
    };
    return NoConsentStrategy;
}(_DefaultStrategy__WEBPACK_IMPORTED_MODULE_2__.DefaultStrategy));



/***/ }),

/***/ "./src/visitor/NotReadyStrategy.ts":
/*!*****************************************!*\
  !*** ./src/visitor/NotReadyStrategy.ts ***!
  \*****************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "NotReadyStrategy": () => (/* binding */ NotReadyStrategy)
/* harmony export */ });
/* harmony import */ var _enum_index__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../enum/index */ "./src/enum/index.ts");
/* harmony import */ var _utils_utils__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../utils/utils */ "./src/utils/utils.ts");
/* harmony import */ var _DefaultStrategy__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./DefaultStrategy */ "./src/visitor/DefaultStrategy.ts");
var __extends = (undefined && undefined.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();



var NotReadyStrategy = /** @class */ (function (_super) {
    __extends(NotReadyStrategy, _super);
    function NotReadyStrategy() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    NotReadyStrategy.prototype.synchronizeModifications = function () {
        this.log('synchronizeModifications');
        return Promise.resolve();
    };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    NotReadyStrategy.prototype.getModificationSync = function (params, activateAll) {
        this.log('getModification');
        if (Array.isArray(params)) {
            return params.map(function (item) {
                return item.defaultValue;
            });
        }
        return params.defaultValue;
    };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    NotReadyStrategy.prototype.getModificationInfoSync = function (key) {
        this.log('getModificationInfo');
        return null;
    };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    NotReadyStrategy.prototype.activateModificationSync = function (params) {
        this.log('activateModification');
    };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    NotReadyStrategy.prototype.sendHitSync = function (hit) {
        this.log('sendHit');
    };
    NotReadyStrategy.prototype.log = function (methodName) {
        (0,_utils_utils__WEBPACK_IMPORTED_MODULE_1__.logError)(this.config, (0,_utils_utils__WEBPACK_IMPORTED_MODULE_1__.sprintf)(_enum_index__WEBPACK_IMPORTED_MODULE_0__.METHOD_DEACTIVATED_ERROR, methodName, _enum_index__WEBPACK_IMPORTED_MODULE_0__.FlagshipStatus[_enum_index__WEBPACK_IMPORTED_MODULE_0__.FlagshipStatus.NOT_INITIALIZED]), methodName);
    };
    return NotReadyStrategy;
}(_DefaultStrategy__WEBPACK_IMPORTED_MODULE_2__.DefaultStrategy));



/***/ }),

/***/ "./src/visitor/PanicStrategy.ts":
/*!**************************************!*\
  !*** ./src/visitor/PanicStrategy.ts ***!
  \**************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "PanicStrategy": () => (/* binding */ PanicStrategy)
/* harmony export */ });
/* harmony import */ var _enum_index__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../enum/index */ "./src/enum/index.ts");
/* harmony import */ var _utils_utils__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../utils/utils */ "./src/utils/utils.ts");
/* harmony import */ var _DefaultStrategy__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./DefaultStrategy */ "./src/visitor/DefaultStrategy.ts");
var __extends = (undefined && undefined.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();



var PanicStrategy = /** @class */ (function (_super) {
    __extends(PanicStrategy, _super);
    function PanicStrategy() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    PanicStrategy.prototype.updateContext = function (context) {
        this.log('updateContext');
    };
    PanicStrategy.prototype.clearContext = function () {
        this.log('clearContext');
    };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    PanicStrategy.prototype.getModificationSync = function (params, activateAll) {
        this.log('getModification');
        if (Array.isArray(params)) {
            return params.map(function (item) {
                return item.defaultValue;
            });
        }
        return params.defaultValue;
    };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    PanicStrategy.prototype.getModificationInfoSync = function (key) {
        this.log('getModificationInfo');
        return null;
    };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    PanicStrategy.prototype.activateModificationSync = function (params) {
        this.log('activateModification');
    };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    PanicStrategy.prototype.sendHitSync = function (hit) {
        this.log('sendHit');
    };
    PanicStrategy.prototype.log = function (methodName) {
        (0,_utils_utils__WEBPACK_IMPORTED_MODULE_1__.logError)(this.config, (0,_utils_utils__WEBPACK_IMPORTED_MODULE_1__.sprintf)(_enum_index__WEBPACK_IMPORTED_MODULE_0__.METHOD_DEACTIVATED_ERROR, methodName, _enum_index__WEBPACK_IMPORTED_MODULE_0__.FlagshipStatus[_enum_index__WEBPACK_IMPORTED_MODULE_0__.FlagshipStatus.READY_PANIC_ON]), methodName);
    };
    return PanicStrategy;
}(_DefaultStrategy__WEBPACK_IMPORTED_MODULE_2__.DefaultStrategy));



/***/ }),

/***/ "./src/visitor/Visitor.ts":
/*!********************************!*\
  !*** ./src/visitor/Visitor.ts ***!
  \********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "Visitor": () => (/* binding */ Visitor)
/* harmony export */ });
/* harmony import */ var _nodeDeps__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../nodeDeps */ "./src/nodeDeps.ts");
/* harmony import */ var _enum_index__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../enum/index */ "./src/enum/index.ts");
var __extends = (undefined && undefined.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();


var Visitor = /** @class */ (function (_super) {
    __extends(Visitor, _super);
    function Visitor(visitorDelegate) {
        var _this = _super.call(this) || this;
        _this.visitorDelegate = visitorDelegate;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        _this.visitorDelegate.on(_enum_index__WEBPACK_IMPORTED_MODULE_1__.EMIT_READY, function (err) {
            _this.emit(_enum_index__WEBPACK_IMPORTED_MODULE_1__.EMIT_READY, err);
        });
        return _this;
    }
    Object.defineProperty(Visitor.prototype, "visitorId", {
        get: function () {
            return this.visitorDelegate.visitorId;
        },
        set: function (v) {
            this.visitorDelegate.visitorId = v;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Visitor.prototype, "hasConsented", {
        get: function () {
            return this.visitorDelegate.hasConsented;
        },
        enumerable: false,
        configurable: true
    });
    Visitor.prototype.setConsent = function (hasConsented) {
        this.visitorDelegate.setConsent(hasConsented);
    };
    Object.defineProperty(Visitor.prototype, "config", {
        get: function () {
            return this.visitorDelegate.config;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Visitor.prototype, "context", {
        get: function () {
            return this.visitorDelegate.context;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Visitor.prototype, "modifications", {
        get: function () {
            return this.visitorDelegate.modifications;
        },
        enumerable: false,
        configurable: true
    });
    Visitor.prototype.updateContext = function (context) {
        this.visitorDelegate.updateContext(context);
    };
    Visitor.prototype.clearContext = function () {
        this.visitorDelegate.clearContext();
    };
    Visitor.prototype.getModification = function (params, activateAll) {
        return this.visitorDelegate.getModification(params, activateAll);
    };
    Visitor.prototype.getModificationSync = function (params, activateAll) {
        return this.visitorDelegate.getModificationSync(params, activateAll);
    };
    Visitor.prototype.getModificationInfo = function (key) {
        return this.visitorDelegate.getModificationInfo(key);
    };
    Visitor.prototype.getModificationInfoSync = function (key) {
        return this.visitorDelegate.getModificationInfoSync(key);
    };
    Visitor.prototype.synchronizeModifications = function () {
        return this.visitorDelegate.synchronizeModifications();
    };
    Visitor.prototype.activateModification = function (params) {
        return this.visitorDelegate.activateModification(params);
    };
    Visitor.prototype.activateModificationSync = function (params) {
        this.visitorDelegate.activateModificationSync(params);
    };
    Visitor.prototype.sendHit = function (hit) {
        return this.visitorDelegate.sendHit(hit);
    };
    Visitor.prototype.sendHitSync = function (hit) {
        return this.visitorDelegate.sendHitSync(hit);
    };
    Visitor.prototype.getAllModifications = function (activate) {
        if (activate === void 0) { activate = false; }
        return this.visitorDelegate.getAllModifications(activate);
    };
    Visitor.prototype.getModificationsForCampaign = function (campaignId, activate) {
        if (activate === void 0) { activate = false; }
        return this.visitorDelegate.getModificationsForCampaign(campaignId, activate);
    };
    Visitor.prototype.authenticate = function (visitorId) {
        this.visitorDelegate.authenticate(visitorId);
    };
    Visitor.prototype.unauthenticate = function () {
        this.visitorDelegate.unauthenticate();
    };
    return Visitor;
}(_nodeDeps__WEBPACK_IMPORTED_MODULE_0__.EventEmitter));



/***/ }),

/***/ "./src/visitor/VisitorAbstract.ts":
/*!****************************************!*\
  !*** ./src/visitor/VisitorAbstract.ts ***!
  \****************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "VisitorAbstract": () => (/* binding */ VisitorAbstract)
/* harmony export */ });
/* harmony import */ var _config_index__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../config/index */ "./src/config/index.ts");
/* harmony import */ var _enum_index__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../enum/index */ "./src/enum/index.ts");
/* harmony import */ var _utils_utils__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../utils/utils */ "./src/utils/utils.ts");
/* harmony import */ var _DefaultStrategy__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./DefaultStrategy */ "./src/visitor/DefaultStrategy.ts");
/* harmony import */ var _nodeDeps__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../nodeDeps */ "./src/nodeDeps.ts");
/* harmony import */ var _main_Flagship__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../main/Flagship */ "./src/main/Flagship.ts");
/* harmony import */ var _NotReadyStrategy__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./NotReadyStrategy */ "./src/visitor/NotReadyStrategy.ts");
/* harmony import */ var _PanicStrategy__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./PanicStrategy */ "./src/visitor/PanicStrategy.ts");
/* harmony import */ var _NoConsentStrategy__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ./NoConsentStrategy */ "./src/visitor/NoConsentStrategy.ts");
var __extends = (undefined && undefined.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();









var VisitorAbstract = /** @class */ (function (_super) {
    __extends(VisitorAbstract, _super);
    function VisitorAbstract(param) {
        var _this = this;
        var visitorId = param.visitorId, configManager = param.configManager, context = param.context, isAuthenticated = param.isAuthenticated;
        _this = _super.call(this) || this;
        _this.visitorId = visitorId || _this.createVisitorId();
        _this._modifications = new Map();
        _this.campaigns = [];
        _this._configManager = configManager;
        _this._config = configManager.config;
        _this._context = {};
        _this.updateContext(context);
        _this._anonymousId = null;
        _this.loadPredefinedContext();
        if (isAuthenticated && _this.config.decisionMode === _config_index__WEBPACK_IMPORTED_MODULE_0__.DecisionMode.DECISION_API) {
            _this._anonymousId = _this.uuidV4();
        }
        return _this;
    }
    VisitorAbstract.prototype.loadPredefinedContext = function () {
        this.context.fs_client = _enum_index__WEBPACK_IMPORTED_MODULE_1__.SDK_LANGUAGE;
        this.context.fs_version = _enum_index__WEBPACK_IMPORTED_MODULE_1__.SDK_VERSION;
        this.context.fs_users = this.visitorId;
    };
    VisitorAbstract.prototype.uuidV4 = function () {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (char) {
            var rand = Math.random() * 16 | 0;
            var value = char === 'x' ? rand : (rand & 0x3 | 0x8);
            return value.toString(16);
        });
    };
    VisitorAbstract.prototype.createVisitorId = function () {
        var now = new Date();
        var random = Math.floor(Math.random() * (99999 - 10000) + 10000);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        var twoDigits = function (value) { return (value.toString().length === 1 ? "0" + value : value); };
        return "" + now.getFullYear() + twoDigits(now.getMonth() + 1) + twoDigits(now.getDate()) + twoDigits(now.getHours()) + twoDigits(now.getMinutes()) + random;
    };
    Object.defineProperty(VisitorAbstract.prototype, "visitorId", {
        get: function () {
            return this._visitorId;
        },
        set: function (v) {
            if (!v || typeof v !== 'string') {
                (0,_utils_utils__WEBPACK_IMPORTED_MODULE_2__.logError)(this.config, _enum_index__WEBPACK_IMPORTED_MODULE_1__.VISITOR_ID_ERROR, 'VISITOR ID');
                return;
            }
            this._visitorId = v;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(VisitorAbstract.prototype, "hasConsented", {
        /**
         * Return True or False if the visitor has consented for protected data usage.
         * @return bool
         */
        get: function () {
            return this._hasConsented;
        },
        enumerable: false,
        configurable: true
    });
    /**
      * Set if visitor has consented for protected data usage.
      * @param {boolean} hasConsented True if the visitor has consented false otherwise.
      */
    VisitorAbstract.prototype.setConsent = function (hasConsented) {
        this._hasConsented = hasConsented;
    };
    Object.defineProperty(VisitorAbstract.prototype, "context", {
        get: function () {
            return this._context;
        },
        /**
        * Clear the current context and set a new context value
        */
        set: function (v) {
            this._context = {};
            this.updateContext(v);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(VisitorAbstract.prototype, "modifications", {
        get: function () {
            return this._modifications;
        },
        set: function (v) {
            this._modifications = v;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(VisitorAbstract.prototype, "configManager", {
        get: function () {
            return this._configManager;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(VisitorAbstract.prototype, "config", {
        get: function () {
            return this._config;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(VisitorAbstract.prototype, "campaigns", {
        get: function () {
            return this._campaigns;
        },
        set: function (v) {
            this._campaigns = v;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(VisitorAbstract.prototype, "anonymousId", {
        get: function () {
            return this._anonymousId;
        },
        set: function (v) {
            this._anonymousId = v;
        },
        enumerable: false,
        configurable: true
    });
    VisitorAbstract.prototype.getStrategy = function () {
        var strategy;
        if (!_main_Flagship__WEBPACK_IMPORTED_MODULE_5__.Flagship.getStatus() || _main_Flagship__WEBPACK_IMPORTED_MODULE_5__.Flagship.getStatus() === _enum_index__WEBPACK_IMPORTED_MODULE_1__.FlagshipStatus.NOT_INITIALIZED) {
            strategy = new _NotReadyStrategy__WEBPACK_IMPORTED_MODULE_6__.NotReadyStrategy(this);
        }
        else if (_main_Flagship__WEBPACK_IMPORTED_MODULE_5__.Flagship.getStatus() === _enum_index__WEBPACK_IMPORTED_MODULE_1__.FlagshipStatus.READY_PANIC_ON) {
            strategy = new _PanicStrategy__WEBPACK_IMPORTED_MODULE_7__.PanicStrategy(this);
        }
        else if (!this.hasConsented) {
            strategy = new _NoConsentStrategy__WEBPACK_IMPORTED_MODULE_8__.NoConsentStrategy(this);
        }
        else {
            strategy = new _DefaultStrategy__WEBPACK_IMPORTED_MODULE_3__.DefaultStrategy(this);
        }
        return strategy;
    };
    return VisitorAbstract;
}(_nodeDeps__WEBPACK_IMPORTED_MODULE_4__.EventEmitter));



/***/ }),

/***/ "./src/visitor/VisitorDelegate.ts":
/*!****************************************!*\
  !*** ./src/visitor/VisitorDelegate.ts ***!
  \****************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "VisitorDelegate": () => (/* binding */ VisitorDelegate)
/* harmony export */ });
/* harmony import */ var _VisitorAbstract__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./VisitorAbstract */ "./src/visitor/VisitorAbstract.ts");
var __extends = (undefined && undefined.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();

var VisitorDelegate = /** @class */ (function (_super) {
    __extends(VisitorDelegate, _super);
    function VisitorDelegate() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    VisitorDelegate.prototype.updateContext = function (context) {
        this.getStrategy().updateContext(context);
    };
    VisitorDelegate.prototype.clearContext = function () {
        this.getStrategy().clearContext();
    };
    VisitorDelegate.prototype.getModification = function (params, activateAll) {
        return this.getStrategy().getModification(params, activateAll);
    };
    VisitorDelegate.prototype.getModificationSync = function (params, activateAll) {
        return this.getStrategy().getModificationSync(params, activateAll);
    };
    VisitorDelegate.prototype.getModificationInfo = function (key) {
        return this.getStrategy().getModificationInfo(key);
    };
    VisitorDelegate.prototype.getModificationInfoSync = function (key) {
        return this.getStrategy().getModificationInfoSync(key);
    };
    VisitorDelegate.prototype.synchronizeModifications = function () {
        return this.getStrategy().synchronizeModifications();
    };
    VisitorDelegate.prototype.activateModification = function (params) {
        return this.getStrategy().activateModification(params);
    };
    VisitorDelegate.prototype.activateModificationSync = function (params) {
        return this.getStrategy().activateModificationSync(params);
    };
    VisitorDelegate.prototype.sendHit = function (hit) {
        return this.getStrategy().sendHit(hit);
    };
    VisitorDelegate.prototype.sendHitSync = function (hit) {
        return this.getStrategy().sendHitSync(hit);
    };
    VisitorDelegate.prototype.getAllModifications = function (activate) {
        if (activate === void 0) { activate = false; }
        return this.getStrategy().getAllModifications(activate);
    };
    VisitorDelegate.prototype.getModificationsForCampaign = function (campaignId, activate) {
        if (activate === void 0) { activate = false; }
        return this.getStrategy().getModificationsForCampaign(campaignId, activate);
    };
    VisitorDelegate.prototype.authenticate = function (visitorId) {
        this.getStrategy().authenticate(visitorId);
    };
    VisitorDelegate.prototype.unauthenticate = function () {
        this.getStrategy().unauthenticate();
    };
    return VisitorDelegate;
}(_VisitorAbstract__WEBPACK_IMPORTED_MODULE_0__.VisitorAbstract));



/***/ }),

/***/ "./src/visitor/VisitorStrategyAbstract.ts":
/*!************************************************!*\
  !*** ./src/visitor/VisitorStrategyAbstract.ts ***!
  \************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "VisitorStrategyAbstract": () => (/* binding */ VisitorStrategyAbstract)
/* harmony export */ });
var VisitorStrategyAbstract = /** @class */ (function () {
    function VisitorStrategyAbstract(visitor) {
        this.visitor = visitor;
    }
    Object.defineProperty(VisitorStrategyAbstract.prototype, "configManager", {
        get: function () {
            return this.visitor.configManager;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(VisitorStrategyAbstract.prototype, "config", {
        get: function () {
            return this.visitor.config;
        },
        enumerable: false,
        configurable: true
    });
    return VisitorStrategyAbstract;
}());



/***/ }),

/***/ "events":
/*!*************************!*\
  !*** external "events" ***!
  \*************************/
/***/ ((module) => {

"use strict";
module.exports = require("events");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	(() => {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = (module) => {
/******/ 			var getter = module && module.__esModule ?
/******/ 				() => (module['default']) :
/******/ 				() => (module);
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be in strict mode.
(() => {
"use strict";
/*!**********************!*\
  !*** ./src/index.ts ***!
  \**********************/
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "Flagship": () => (/* reexport safe */ _main_Flagship__WEBPACK_IMPORTED_MODULE_0__.Flagship),
/* harmony export */   "DecisionApiConfig": () => (/* reexport safe */ _config_index__WEBPACK_IMPORTED_MODULE_1__.DecisionApiConfig),
/* harmony export */   "DecisionMode": () => (/* reexport safe */ _config_index__WEBPACK_IMPORTED_MODULE_1__.DecisionMode),
/* harmony export */   "Event": () => (/* reexport safe */ _hit_index__WEBPACK_IMPORTED_MODULE_2__.Event),
/* harmony export */   "EventCategory": () => (/* reexport safe */ _hit_index__WEBPACK_IMPORTED_MODULE_2__.EventCategory),
/* harmony export */   "Item": () => (/* reexport safe */ _hit_index__WEBPACK_IMPORTED_MODULE_2__.Item),
/* harmony export */   "Page": () => (/* reexport safe */ _hit_index__WEBPACK_IMPORTED_MODULE_2__.Page),
/* harmony export */   "Screen": () => (/* reexport safe */ _hit_index__WEBPACK_IMPORTED_MODULE_2__.Screen),
/* harmony export */   "Transaction": () => (/* reexport safe */ _hit_index__WEBPACK_IMPORTED_MODULE_2__.Transaction),
/* harmony export */   "FlagshipStatus": () => (/* reexport safe */ _enum_index__WEBPACK_IMPORTED_MODULE_3__.FlagshipStatus),
/* harmony export */   "LogLevel": () => (/* reexport safe */ _enum_index__WEBPACK_IMPORTED_MODULE_3__.LogLevel),
/* harmony export */   "HitType": () => (/* reexport safe */ _enum_index__WEBPACK_IMPORTED_MODULE_3__.HitType),
/* harmony export */   "APP_VERSION_CODE": () => (/* reexport safe */ _enum_FlagshipContext__WEBPACK_IMPORTED_MODULE_4__.APP_VERSION_CODE),
/* harmony export */   "APP_VERSION_NAME": () => (/* reexport safe */ _enum_FlagshipContext__WEBPACK_IMPORTED_MODULE_4__.APP_VERSION_NAME),
/* harmony export */   "CARRIER_NAME": () => (/* reexport safe */ _enum_FlagshipContext__WEBPACK_IMPORTED_MODULE_4__.CARRIER_NAME),
/* harmony export */   "DEVICE_LOCALE": () => (/* reexport safe */ _enum_FlagshipContext__WEBPACK_IMPORTED_MODULE_4__.DEVICE_LOCALE),
/* harmony export */   "DEVICE_MODEL": () => (/* reexport safe */ _enum_FlagshipContext__WEBPACK_IMPORTED_MODULE_4__.DEVICE_MODEL),
/* harmony export */   "DEVICE_TYPE": () => (/* reexport safe */ _enum_FlagshipContext__WEBPACK_IMPORTED_MODULE_4__.DEVICE_TYPE),
/* harmony export */   "FLAGSHIP_CLIENT": () => (/* reexport safe */ _enum_FlagshipContext__WEBPACK_IMPORTED_MODULE_4__.FLAGSHIP_CLIENT),
/* harmony export */   "FLAGSHIP_VERSION": () => (/* reexport safe */ _enum_FlagshipContext__WEBPACK_IMPORTED_MODULE_4__.FLAGSHIP_VERSION),
/* harmony export */   "FLAGSHIP_VISITOR": () => (/* reexport safe */ _enum_FlagshipContext__WEBPACK_IMPORTED_MODULE_4__.FLAGSHIP_VISITOR),
/* harmony export */   "INTERFACE_NAME": () => (/* reexport safe */ _enum_FlagshipContext__WEBPACK_IMPORTED_MODULE_4__.INTERFACE_NAME),
/* harmony export */   "INTERNET_CONNECTION": () => (/* reexport safe */ _enum_FlagshipContext__WEBPACK_IMPORTED_MODULE_4__.INTERNET_CONNECTION),
/* harmony export */   "IP": () => (/* reexport safe */ _enum_FlagshipContext__WEBPACK_IMPORTED_MODULE_4__.IP),
/* harmony export */   "LOCATION_CITY": () => (/* reexport safe */ _enum_FlagshipContext__WEBPACK_IMPORTED_MODULE_4__.LOCATION_CITY),
/* harmony export */   "LOCATION_COUNTRY": () => (/* reexport safe */ _enum_FlagshipContext__WEBPACK_IMPORTED_MODULE_4__.LOCATION_COUNTRY),
/* harmony export */   "LOCATION_LAT": () => (/* reexport safe */ _enum_FlagshipContext__WEBPACK_IMPORTED_MODULE_4__.LOCATION_LAT),
/* harmony export */   "LOCATION_LONG": () => (/* reexport safe */ _enum_FlagshipContext__WEBPACK_IMPORTED_MODULE_4__.LOCATION_LONG),
/* harmony export */   "LOCATION_REGION": () => (/* reexport safe */ _enum_FlagshipContext__WEBPACK_IMPORTED_MODULE_4__.LOCATION_REGION),
/* harmony export */   "OS_NAME": () => (/* reexport safe */ _enum_FlagshipContext__WEBPACK_IMPORTED_MODULE_4__.OS_NAME),
/* harmony export */   "OS_VERSION_CODE": () => (/* reexport safe */ _enum_FlagshipContext__WEBPACK_IMPORTED_MODULE_4__.OS_VERSION_CODE),
/* harmony export */   "OS_VERSION_NAME": () => (/* reexport safe */ _enum_FlagshipContext__WEBPACK_IMPORTED_MODULE_4__.OS_VERSION_NAME),
/* harmony export */   "Modification": () => (/* reexport safe */ _model_Modification__WEBPACK_IMPORTED_MODULE_5__.Modification)
/* harmony export */ });
/* harmony import */ var _main_Flagship__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./main/Flagship */ "./src/main/Flagship.ts");
/* harmony import */ var _config_index__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./config/index */ "./src/config/index.ts");
/* harmony import */ var _hit_index__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./hit/index */ "./src/hit/index.ts");
/* harmony import */ var _enum_index__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./enum/index */ "./src/enum/index.ts");
/* harmony import */ var _enum_FlagshipContext__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./enum/FlagshipContext */ "./src/enum/FlagshipContext.ts");
/* harmony import */ var _model_Modification__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./model/Modification */ "./src/model/Modification.ts");







})();

/******/ 	return __webpack_exports__;
/******/ })()
;
});
//# sourceMappingURL=index.browser.js.map