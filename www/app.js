(() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __esm = (fn, res) => function __init() {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  };
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };

  // node_modules/@capacitor/core/dist/index.js
  var ExceptionCode, CapacitorException, getPlatformId, createCapacitor, initCapacitorGlobal, Capacitor, registerPlugin, WebPlugin, encode, decode, CapacitorCookiesPluginWeb, CapacitorCookies, readBlobAsBase64, normalizeHttpHeaders, buildUrlParams, buildRequestInit, CapacitorHttpPluginWeb, CapacitorHttp;
  var init_dist = __esm({
    "node_modules/@capacitor/core/dist/index.js"() {
      (function(ExceptionCode2) {
        ExceptionCode2["Unimplemented"] = "UNIMPLEMENTED";
        ExceptionCode2["Unavailable"] = "UNAVAILABLE";
      })(ExceptionCode || (ExceptionCode = {}));
      CapacitorException = class extends Error {
        constructor(message, code, data) {
          super(message);
          this.message = message;
          this.code = code;
          this.data = data;
        }
      };
      getPlatformId = (win) => {
        var _a, _b;
        if (win === null || win === void 0 ? void 0 : win.androidBridge) {
          return "android";
        } else if ((_b = (_a = win === null || win === void 0 ? void 0 : win.webkit) === null || _a === void 0 ? void 0 : _a.messageHandlers) === null || _b === void 0 ? void 0 : _b.bridge) {
          return "ios";
        } else {
          return "web";
        }
      };
      createCapacitor = (win) => {
        const capCustomPlatform = win.CapacitorCustomPlatform || null;
        const cap = win.Capacitor || {};
        const Plugins = cap.Plugins = cap.Plugins || {};
        const getPlatform = () => {
          return capCustomPlatform !== null ? capCustomPlatform.name : getPlatformId(win);
        };
        const isNativePlatform = () => getPlatform() !== "web";
        const isPluginAvailable = (pluginName) => {
          const plugin = registeredPlugins.get(pluginName);
          if (plugin === null || plugin === void 0 ? void 0 : plugin.platforms.has(getPlatform())) {
            return true;
          }
          if (getPluginHeader(pluginName)) {
            return true;
          }
          return false;
        };
        const getPluginHeader = (pluginName) => {
          var _a;
          return (_a = cap.PluginHeaders) === null || _a === void 0 ? void 0 : _a.find((h) => h.name === pluginName);
        };
        const handleError = (err) => win.console.error(err);
        const registeredPlugins = /* @__PURE__ */ new Map();
        const registerPlugin2 = (pluginName, jsImplementations = {}) => {
          const registeredPlugin = registeredPlugins.get(pluginName);
          if (registeredPlugin) {
            console.warn(`Capacitor plugin "${pluginName}" already registered. Cannot register plugins twice.`);
            return registeredPlugin.proxy;
          }
          const platform = getPlatform();
          const pluginHeader = getPluginHeader(pluginName);
          let jsImplementation;
          const loadPluginImplementation = async () => {
            if (!jsImplementation && platform in jsImplementations) {
              jsImplementation = typeof jsImplementations[platform] === "function" ? jsImplementation = await jsImplementations[platform]() : jsImplementation = jsImplementations[platform];
            } else if (capCustomPlatform !== null && !jsImplementation && "web" in jsImplementations) {
              jsImplementation = typeof jsImplementations["web"] === "function" ? jsImplementation = await jsImplementations["web"]() : jsImplementation = jsImplementations["web"];
            }
            return jsImplementation;
          };
          const createPluginMethod = (impl, prop) => {
            var _a, _b;
            if (pluginHeader) {
              const methodHeader = pluginHeader === null || pluginHeader === void 0 ? void 0 : pluginHeader.methods.find((m) => prop === m.name);
              if (methodHeader) {
                if (methodHeader.rtype === "promise") {
                  return (options) => cap.nativePromise(pluginName, prop.toString(), options);
                } else {
                  return (options, callback) => cap.nativeCallback(pluginName, prop.toString(), options, callback);
                }
              } else if (impl) {
                return (_a = impl[prop]) === null || _a === void 0 ? void 0 : _a.bind(impl);
              }
            } else if (impl) {
              return (_b = impl[prop]) === null || _b === void 0 ? void 0 : _b.bind(impl);
            } else {
              throw new CapacitorException(`"${pluginName}" plugin is not implemented on ${platform}`, ExceptionCode.Unimplemented);
            }
          };
          const createPluginMethodWrapper = (prop) => {
            let remove;
            const wrapper = (...args) => {
              const p = loadPluginImplementation().then((impl) => {
                const fn = createPluginMethod(impl, prop);
                if (fn) {
                  const p2 = fn(...args);
                  remove = p2 === null || p2 === void 0 ? void 0 : p2.remove;
                  return p2;
                } else {
                  throw new CapacitorException(`"${pluginName}.${prop}()" is not implemented on ${platform}`, ExceptionCode.Unimplemented);
                }
              });
              if (prop === "addListener") {
                p.remove = async () => remove();
              }
              return p;
            };
            wrapper.toString = () => `${prop.toString()}() { [capacitor code] }`;
            Object.defineProperty(wrapper, "name", {
              value: prop,
              writable: false,
              configurable: false
            });
            return wrapper;
          };
          const addListener = createPluginMethodWrapper("addListener");
          const removeListener = createPluginMethodWrapper("removeListener");
          const addListenerNative = (eventName, callback) => {
            const call = addListener({ eventName }, callback);
            const remove = async () => {
              const callbackId = await call;
              removeListener({
                eventName,
                callbackId
              }, callback);
            };
            const p = new Promise((resolve) => call.then(() => resolve({ remove })));
            p.remove = async () => {
              console.warn(`Using addListener() without 'await' is deprecated.`);
              await remove();
            };
            return p;
          };
          const proxy = new Proxy({}, {
            get(_, prop) {
              switch (prop) {
                // https://github.com/facebook/react/issues/20030
                case "$$typeof":
                  return void 0;
                case "toJSON":
                  return () => ({});
                case "addListener":
                  return pluginHeader ? addListenerNative : addListener;
                case "removeListener":
                  return removeListener;
                default:
                  return createPluginMethodWrapper(prop);
              }
            }
          });
          Plugins[pluginName] = proxy;
          registeredPlugins.set(pluginName, {
            name: pluginName,
            proxy,
            platforms: /* @__PURE__ */ new Set([...Object.keys(jsImplementations), ...pluginHeader ? [platform] : []])
          });
          return proxy;
        };
        if (!cap.convertFileSrc) {
          cap.convertFileSrc = (filePath) => filePath;
        }
        cap.getPlatform = getPlatform;
        cap.handleError = handleError;
        cap.isNativePlatform = isNativePlatform;
        cap.isPluginAvailable = isPluginAvailable;
        cap.registerPlugin = registerPlugin2;
        cap.Exception = CapacitorException;
        cap.DEBUG = !!cap.DEBUG;
        cap.isLoggingEnabled = !!cap.isLoggingEnabled;
        return cap;
      };
      initCapacitorGlobal = (win) => win.Capacitor = createCapacitor(win);
      Capacitor = /* @__PURE__ */ initCapacitorGlobal(typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : {});
      registerPlugin = Capacitor.registerPlugin;
      WebPlugin = class {
        constructor() {
          this.listeners = {};
          this.retainedEventArguments = {};
          this.windowListeners = {};
        }
        addListener(eventName, listenerFunc) {
          let firstListener = false;
          const listeners = this.listeners[eventName];
          if (!listeners) {
            this.listeners[eventName] = [];
            firstListener = true;
          }
          this.listeners[eventName].push(listenerFunc);
          const windowListener = this.windowListeners[eventName];
          if (windowListener && !windowListener.registered) {
            this.addWindowListener(windowListener);
          }
          if (firstListener) {
            this.sendRetainedArgumentsForEvent(eventName);
          }
          const remove = async () => this.removeListener(eventName, listenerFunc);
          const p = Promise.resolve({ remove });
          return p;
        }
        async removeAllListeners() {
          this.listeners = {};
          for (const listener in this.windowListeners) {
            this.removeWindowListener(this.windowListeners[listener]);
          }
          this.windowListeners = {};
        }
        notifyListeners(eventName, data, retainUntilConsumed) {
          const listeners = this.listeners[eventName];
          if (!listeners) {
            if (retainUntilConsumed) {
              let args = this.retainedEventArguments[eventName];
              if (!args) {
                args = [];
              }
              args.push(data);
              this.retainedEventArguments[eventName] = args;
            }
            return;
          }
          listeners.forEach((listener) => listener(data));
        }
        hasListeners(eventName) {
          var _a;
          return !!((_a = this.listeners[eventName]) === null || _a === void 0 ? void 0 : _a.length);
        }
        registerWindowListener(windowEventName, pluginEventName) {
          this.windowListeners[pluginEventName] = {
            registered: false,
            windowEventName,
            pluginEventName,
            handler: (event) => {
              this.notifyListeners(pluginEventName, event);
            }
          };
        }
        unimplemented(msg = "not implemented") {
          return new Capacitor.Exception(msg, ExceptionCode.Unimplemented);
        }
        unavailable(msg = "not available") {
          return new Capacitor.Exception(msg, ExceptionCode.Unavailable);
        }
        async removeListener(eventName, listenerFunc) {
          const listeners = this.listeners[eventName];
          if (!listeners) {
            return;
          }
          const index = listeners.indexOf(listenerFunc);
          this.listeners[eventName].splice(index, 1);
          if (!this.listeners[eventName].length) {
            this.removeWindowListener(this.windowListeners[eventName]);
          }
        }
        addWindowListener(handle) {
          window.addEventListener(handle.windowEventName, handle.handler);
          handle.registered = true;
        }
        removeWindowListener(handle) {
          if (!handle) {
            return;
          }
          window.removeEventListener(handle.windowEventName, handle.handler);
          handle.registered = false;
        }
        sendRetainedArgumentsForEvent(eventName) {
          const args = this.retainedEventArguments[eventName];
          if (!args) {
            return;
          }
          delete this.retainedEventArguments[eventName];
          args.forEach((arg) => {
            this.notifyListeners(eventName, arg);
          });
        }
      };
      encode = (str) => encodeURIComponent(str).replace(/%(2[346B]|5E|60|7C)/g, decodeURIComponent).replace(/[()]/g, escape);
      decode = (str) => str.replace(/(%[\dA-F]{2})+/gi, decodeURIComponent);
      CapacitorCookiesPluginWeb = class extends WebPlugin {
        async getCookies() {
          const cookies = document.cookie;
          const cookieMap = {};
          cookies.split(";").forEach((cookie) => {
            if (cookie.length <= 0)
              return;
            let [key, value] = cookie.replace(/=/, "CAP_COOKIE").split("CAP_COOKIE");
            key = decode(key).trim();
            value = decode(value).trim();
            cookieMap[key] = value;
          });
          return cookieMap;
        }
        async setCookie(options) {
          try {
            const encodedKey = encode(options.key);
            const encodedValue = encode(options.value);
            const expires = options.expires ? `; expires=${options.expires.replace("expires=", "")}` : "";
            const path = (options.path || "/").replace("path=", "");
            const domain = options.url != null && options.url.length > 0 ? `domain=${options.url}` : "";
            document.cookie = `${encodedKey}=${encodedValue || ""}${expires}; path=${path}; ${domain};`;
          } catch (error) {
            return Promise.reject(error);
          }
        }
        async deleteCookie(options) {
          try {
            document.cookie = `${options.key}=; Max-Age=0`;
          } catch (error) {
            return Promise.reject(error);
          }
        }
        async clearCookies() {
          try {
            const cookies = document.cookie.split(";") || [];
            for (const cookie of cookies) {
              document.cookie = cookie.replace(/^ +/, "").replace(/=.*/, `=;expires=${(/* @__PURE__ */ new Date()).toUTCString()};path=/`);
            }
          } catch (error) {
            return Promise.reject(error);
          }
        }
        async clearAllCookies() {
          try {
            await this.clearCookies();
          } catch (error) {
            return Promise.reject(error);
          }
        }
      };
      CapacitorCookies = registerPlugin("CapacitorCookies", {
        web: () => new CapacitorCookiesPluginWeb()
      });
      readBlobAsBase64 = async (blob) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64String = reader.result;
          resolve(base64String.indexOf(",") >= 0 ? base64String.split(",")[1] : base64String);
        };
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(blob);
      });
      normalizeHttpHeaders = (headers = {}) => {
        const originalKeys = Object.keys(headers);
        const loweredKeys = Object.keys(headers).map((k) => k.toLocaleLowerCase());
        const normalized = loweredKeys.reduce((acc, key, index) => {
          acc[key] = headers[originalKeys[index]];
          return acc;
        }, {});
        return normalized;
      };
      buildUrlParams = (params, shouldEncode = true) => {
        if (!params)
          return null;
        const output = Object.entries(params).reduce((accumulator, entry) => {
          const [key, value] = entry;
          let encodedValue;
          let item;
          if (Array.isArray(value)) {
            item = "";
            value.forEach((str) => {
              encodedValue = shouldEncode ? encodeURIComponent(str) : str;
              item += `${key}=${encodedValue}&`;
            });
            item.slice(0, -1);
          } else {
            encodedValue = shouldEncode ? encodeURIComponent(value) : value;
            item = `${key}=${encodedValue}`;
          }
          return `${accumulator}&${item}`;
        }, "");
        return output.substr(1);
      };
      buildRequestInit = (options, extra = {}) => {
        const output = Object.assign({ method: options.method || "GET", headers: options.headers }, extra);
        const headers = normalizeHttpHeaders(options.headers);
        const type = headers["content-type"] || "";
        if (typeof options.data === "string") {
          output.body = options.data;
        } else if (type.includes("application/x-www-form-urlencoded")) {
          const params = new URLSearchParams();
          for (const [key, value] of Object.entries(options.data || {})) {
            params.set(key, value);
          }
          output.body = params.toString();
        } else if (type.includes("multipart/form-data") || options.data instanceof FormData) {
          const form = new FormData();
          if (options.data instanceof FormData) {
            options.data.forEach((value, key) => {
              form.append(key, value);
            });
          } else {
            for (const key of Object.keys(options.data)) {
              form.append(key, options.data[key]);
            }
          }
          output.body = form;
          const headers2 = new Headers(output.headers);
          headers2.delete("content-type");
          output.headers = headers2;
        } else if (type.includes("application/json") || typeof options.data === "object") {
          output.body = JSON.stringify(options.data);
        }
        return output;
      };
      CapacitorHttpPluginWeb = class extends WebPlugin {
        /**
         * Perform an Http request given a set of options
         * @param options Options to build the HTTP request
         */
        async request(options) {
          const requestInit = buildRequestInit(options, options.webFetchExtra);
          const urlParams = buildUrlParams(options.params, options.shouldEncodeUrlParams);
          const url = urlParams ? `${options.url}?${urlParams}` : options.url;
          const response = await fetch(url, requestInit);
          const contentType = response.headers.get("content-type") || "";
          let { responseType = "text" } = response.ok ? options : {};
          if (contentType.includes("application/json")) {
            responseType = "json";
          }
          let data;
          let blob;
          switch (responseType) {
            case "arraybuffer":
            case "blob":
              blob = await response.blob();
              data = await readBlobAsBase64(blob);
              break;
            case "json":
              data = await response.json();
              break;
            case "document":
            case "text":
            default:
              data = await response.text();
          }
          const headers = {};
          response.headers.forEach((value, key) => {
            headers[key] = value;
          });
          return {
            data,
            headers,
            status: response.status,
            url: response.url
          };
        }
        /**
         * Perform an Http GET request given a set of options
         * @param options Options to build the HTTP request
         */
        async get(options) {
          return this.request(Object.assign(Object.assign({}, options), { method: "GET" }));
        }
        /**
         * Perform an Http POST request given a set of options
         * @param options Options to build the HTTP request
         */
        async post(options) {
          return this.request(Object.assign(Object.assign({}, options), { method: "POST" }));
        }
        /**
         * Perform an Http PUT request given a set of options
         * @param options Options to build the HTTP request
         */
        async put(options) {
          return this.request(Object.assign(Object.assign({}, options), { method: "PUT" }));
        }
        /**
         * Perform an Http PATCH request given a set of options
         * @param options Options to build the HTTP request
         */
        async patch(options) {
          return this.request(Object.assign(Object.assign({}, options), { method: "PATCH" }));
        }
        /**
         * Perform an Http DELETE request given a set of options
         * @param options Options to build the HTTP request
         */
        async delete(options) {
          return this.request(Object.assign(Object.assign({}, options), { method: "DELETE" }));
        }
      };
      CapacitorHttp = registerPlugin("CapacitorHttp", {
        web: () => new CapacitorHttpPluginWeb()
      });
    }
  });

  // node_modules/@capacitor-community/admob/dist/esm/consent/consent-status.enum.js
  var AdmobConsentStatus;
  var init_consent_status_enum = __esm({
    "node_modules/@capacitor-community/admob/dist/esm/consent/consent-status.enum.js"() {
      (function(AdmobConsentStatus2) {
        AdmobConsentStatus2["NOT_REQUIRED"] = "NOT_REQUIRED";
        AdmobConsentStatus2["OBTAINED"] = "OBTAINED";
        AdmobConsentStatus2["REQUIRED"] = "REQUIRED";
        AdmobConsentStatus2["UNKNOWN"] = "UNKNOWN";
      })(AdmobConsentStatus || (AdmobConsentStatus = {}));
    }
  });

  // node_modules/@capacitor-community/admob/dist/esm/consent/privacy-options-requirement-status.enum.js
  var PrivacyOptionsRequirementStatus;
  var init_privacy_options_requirement_status_enum = __esm({
    "node_modules/@capacitor-community/admob/dist/esm/consent/privacy-options-requirement-status.enum.js"() {
      (function(PrivacyOptionsRequirementStatus2) {
        PrivacyOptionsRequirementStatus2["NOT_REQUIRED"] = "NOT_REQUIRED";
        PrivacyOptionsRequirementStatus2["REQUIRED"] = "REQUIRED";
        PrivacyOptionsRequirementStatus2["UNKNOWN"] = "UNKNOWN";
      })(PrivacyOptionsRequirementStatus || (PrivacyOptionsRequirementStatus = {}));
    }
  });

  // node_modules/@capacitor-community/admob/dist/esm/web.js
  var web_exports = {};
  __export(web_exports, {
    AdMobWeb: () => AdMobWeb
  });
  var AdMobWeb;
  var init_web = __esm({
    "node_modules/@capacitor-community/admob/dist/esm/web.js"() {
      init_dist();
      init_consent_status_enum();
      init_privacy_options_requirement_status_enum();
      AdMobWeb = class extends WebPlugin {
        async initialize() {
          console.log("initialize");
        }
        async requestTrackingAuthorization() {
          console.log("requestTrackingAuthorization");
        }
        async trackingAuthorizationStatus() {
          return {
            status: "authorized"
          };
        }
        async requestConsentInfo(options) {
          console.log("requestConsentInfo", options);
          return {
            status: AdmobConsentStatus.REQUIRED,
            isConsentFormAvailable: true,
            canRequestAds: true,
            privacyOptionsRequirementStatus: PrivacyOptionsRequirementStatus.REQUIRED
          };
        }
        async showPrivacyOptionsForm() {
          console.log("showPrivacyOptionsForm");
        }
        async showConsentForm() {
          console.log("showConsentForm");
          return {
            status: AdmobConsentStatus.REQUIRED,
            canRequestAds: true,
            privacyOptionsRequirementStatus: PrivacyOptionsRequirementStatus.REQUIRED
          };
        }
        async resetConsentInfo() {
          console.log("resetConsentInfo");
        }
        async setApplicationMuted(options) {
          console.log("setApplicationMuted", options);
        }
        async setApplicationVolume(options) {
          console.log("setApplicationVolume", options);
        }
        async showBanner(options) {
          console.log("showBanner", options);
        }
        // Hide the banner, remove it from screen, but can show it later
        async hideBanner() {
          console.log("hideBanner");
        }
        // Resume the banner, show it after hide
        async resumeBanner() {
          console.log("resumeBanner");
        }
        // Destroy the banner, remove it from screen.
        async removeBanner() {
          console.log("removeBanner");
        }
        async prepareInterstitial(options) {
          console.log("prepareInterstitial", options);
          return {
            adUnitId: options.adId
          };
        }
        async showInterstitial() {
          console.log("showInterstitial");
        }
        async prepareRewardVideoAd(options) {
          console.log(options);
          return {
            adUnitId: options.adId
          };
        }
        async showRewardVideoAd() {
          return {
            type: "",
            amount: 0
          };
        }
        async prepareRewardInterstitialAd(options) {
          console.log(options);
          return {
            adUnitId: options.adId
          };
        }
        async showRewardInterstitialAd() {
          return {
            type: "",
            amount: 0
          };
        }
      };
    }
  });

  // node_modules/@capacitor-mlkit/barcode-scanning/dist/esm/definitions.js
  var BarcodeFormat, BarcodeValueType, Resolution, LensFacing, GoogleBarcodeScannerModuleInstallState, AddressType, EmailFormatType, PhoneFormatType, WifiEncryptionType;
  var init_definitions = __esm({
    "node_modules/@capacitor-mlkit/barcode-scanning/dist/esm/definitions.js"() {
      (function(BarcodeFormat2) {
        BarcodeFormat2["Aztec"] = "AZTEC";
        BarcodeFormat2["Codabar"] = "CODABAR";
        BarcodeFormat2["Code39"] = "CODE_39";
        BarcodeFormat2["Code93"] = "CODE_93";
        BarcodeFormat2["Code128"] = "CODE_128";
        BarcodeFormat2["DataMatrix"] = "DATA_MATRIX";
        BarcodeFormat2["Ean8"] = "EAN_8";
        BarcodeFormat2["Ean13"] = "EAN_13";
        BarcodeFormat2["Itf"] = "ITF";
        BarcodeFormat2["Pdf417"] = "PDF_417";
        BarcodeFormat2["QrCode"] = "QR_CODE";
        BarcodeFormat2["UpcA"] = "UPC_A";
        BarcodeFormat2["UpcE"] = "UPC_E";
      })(BarcodeFormat || (BarcodeFormat = {}));
      (function(BarcodeValueType2) {
        BarcodeValueType2["CalendarEvent"] = "CALENDAR_EVENT";
        BarcodeValueType2["ContactInfo"] = "CONTACT_INFO";
        BarcodeValueType2["DriversLicense"] = "DRIVERS_LICENSE";
        BarcodeValueType2["Email"] = "EMAIL";
        BarcodeValueType2["Geo"] = "GEO";
        BarcodeValueType2["Isbn"] = "ISBN";
        BarcodeValueType2["Phone"] = "PHONE";
        BarcodeValueType2["Product"] = "PRODUCT";
        BarcodeValueType2["Sms"] = "SMS";
        BarcodeValueType2["Text"] = "TEXT";
        BarcodeValueType2["Url"] = "URL";
        BarcodeValueType2["Wifi"] = "WIFI";
        BarcodeValueType2["Unknown"] = "UNKNOWN";
      })(BarcodeValueType || (BarcodeValueType = {}));
      (function(Resolution2) {
        Resolution2[Resolution2["640x480"] = 0] = "640x480";
        Resolution2[Resolution2["1280x720"] = 1] = "1280x720";
        Resolution2[Resolution2["1920x1080"] = 2] = "1920x1080";
        Resolution2[Resolution2["3840x2160"] = 3] = "3840x2160";
      })(Resolution || (Resolution = {}));
      (function(LensFacing2) {
        LensFacing2["Front"] = "FRONT";
        LensFacing2["Back"] = "BACK";
      })(LensFacing || (LensFacing = {}));
      (function(GoogleBarcodeScannerModuleInstallState2) {
        GoogleBarcodeScannerModuleInstallState2[GoogleBarcodeScannerModuleInstallState2["UNKNOWN"] = 0] = "UNKNOWN";
        GoogleBarcodeScannerModuleInstallState2[GoogleBarcodeScannerModuleInstallState2["PENDING"] = 1] = "PENDING";
        GoogleBarcodeScannerModuleInstallState2[GoogleBarcodeScannerModuleInstallState2["DOWNLOADING"] = 2] = "DOWNLOADING";
        GoogleBarcodeScannerModuleInstallState2[GoogleBarcodeScannerModuleInstallState2["CANCELED"] = 3] = "CANCELED";
        GoogleBarcodeScannerModuleInstallState2[GoogleBarcodeScannerModuleInstallState2["COMPLETED"] = 4] = "COMPLETED";
        GoogleBarcodeScannerModuleInstallState2[GoogleBarcodeScannerModuleInstallState2["FAILED"] = 5] = "FAILED";
        GoogleBarcodeScannerModuleInstallState2[GoogleBarcodeScannerModuleInstallState2["INSTALLING"] = 6] = "INSTALLING";
        GoogleBarcodeScannerModuleInstallState2[GoogleBarcodeScannerModuleInstallState2["DOWNLOAD_PAUSED"] = 7] = "DOWNLOAD_PAUSED";
      })(GoogleBarcodeScannerModuleInstallState || (GoogleBarcodeScannerModuleInstallState = {}));
      (function(AddressType2) {
        AddressType2[AddressType2["HOME"] = 0] = "HOME";
        AddressType2[AddressType2["UNKNOWN"] = 1] = "UNKNOWN";
        AddressType2[AddressType2["WORK"] = 2] = "WORK";
      })(AddressType || (AddressType = {}));
      (function(EmailFormatType2) {
        EmailFormatType2[EmailFormatType2["HOME"] = 0] = "HOME";
        EmailFormatType2[EmailFormatType2["UNKNOWN"] = 1] = "UNKNOWN";
        EmailFormatType2[EmailFormatType2["WORK"] = 2] = "WORK";
      })(EmailFormatType || (EmailFormatType = {}));
      (function(PhoneFormatType2) {
        PhoneFormatType2[PhoneFormatType2["FAX"] = 0] = "FAX";
        PhoneFormatType2[PhoneFormatType2["HOME"] = 1] = "HOME";
        PhoneFormatType2[PhoneFormatType2["MOBILE"] = 2] = "MOBILE";
        PhoneFormatType2[PhoneFormatType2["UNKNOWN"] = 3] = "UNKNOWN";
        PhoneFormatType2[PhoneFormatType2["WORK"] = 4] = "WORK";
      })(PhoneFormatType || (PhoneFormatType = {}));
      (function(WifiEncryptionType2) {
        WifiEncryptionType2[WifiEncryptionType2["OPEN"] = 1] = "OPEN";
        WifiEncryptionType2[WifiEncryptionType2["WEP"] = 2] = "WEP";
        WifiEncryptionType2[WifiEncryptionType2["WPA"] = 3] = "WPA";
      })(WifiEncryptionType || (WifiEncryptionType = {}));
    }
  });

  // node_modules/@capacitor-mlkit/barcode-scanning/dist/esm/web.js
  var web_exports2 = {};
  __export(web_exports2, {
    BarcodeScannerWeb: () => BarcodeScannerWeb
  });
  var BarcodeScannerWeb;
  var init_web2 = __esm({
    "node_modules/@capacitor-mlkit/barcode-scanning/dist/esm/web.js"() {
      init_dist();
      init_definitions();
      BarcodeScannerWeb = class extends WebPlugin {
        constructor() {
          super(...arguments);
          this._isSupported = "BarcodeDetector" in window;
          this.errorVideoElementMissing = "videoElement must be provided.";
          this.eventBarcodesScanned = "barcodesScanned";
        }
        async startScan(options) {
          if (!this._isSupported) {
            throw this.createUnavailableException();
          }
          if (!(options === null || options === void 0 ? void 0 : options.videoElement)) {
            throw new Error(this.errorVideoElementMissing);
          }
          this.videoElement = options.videoElement;
          this.stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: {
                ideal: (options === null || options === void 0 ? void 0 : options.lensFacing) === LensFacing.Front ? "user" : "environment"
              }
            },
            audio: false
          });
          options.videoElement.srcObject = this.stream;
          await options.videoElement.play();
          const barcodeDetector = new BarcodeDetector();
          this.intervalId = window.setInterval(async () => {
            if (!options.videoElement) {
              return;
            }
            const barcodes = await barcodeDetector.detect(options.videoElement);
            if (barcodes.length === 0) {
              return;
            } else {
              this.handleScannedBarcodes(barcodes);
            }
          }, 500);
        }
        async stopScan() {
          if (!this._isSupported) {
            throw this.createUnavailableException();
          }
          if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = void 0;
          }
          if (this.stream) {
            this.stream.getTracks().forEach((track) => track.stop());
            this.stream = void 0;
          }
          if (this.videoElement) {
            this.videoElement.srcObject = null;
            this.videoElement = void 0;
          }
        }
        async readBarcodesFromImage(_options) {
          throw this.createUnavailableException();
        }
        async scan() {
          throw this.createUnavailableException();
        }
        async isSupported() {
          return { supported: this._isSupported };
        }
        async enableTorch() {
          throw this.createUnavailableException();
        }
        async disableTorch() {
          throw this.createUnavailableException();
        }
        async toggleTorch() {
          throw this.createUnavailableException();
        }
        async isTorchEnabled() {
          throw this.createUnavailableException;
        }
        async isTorchAvailable() {
          throw this.createUnavailableException();
        }
        async setZoomRatio(_options) {
          throw this.createUnavailableException();
        }
        async getZoomRatio() {
          throw this.createUnavailableException();
        }
        async getMinZoomRatio() {
          throw this.createUnavailableException();
        }
        async getMaxZoomRatio() {
          throw this.createUnavailableException();
        }
        async openSettings() {
          throw this.createUnavailableException();
        }
        async isGoogleBarcodeScannerModuleAvailable() {
          throw this.createUnavailableException();
        }
        async installGoogleBarcodeScannerModule() {
          throw this.createUnavailableException();
        }
        async checkPermissions() {
          try {
            const result = await navigator.permissions.query({
              name: "camera"
            });
            return {
              camera: result.state
            };
          } catch (error) {
            return {
              camera: "prompt"
            };
          }
        }
        async requestPermissions() {
          try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            stream.getTracks().forEach((track) => track.stop());
            return {
              camera: "granted"
            };
          } catch (error) {
            return {
              camera: "denied"
            };
          }
        }
        createUnavailableException() {
          return new CapacitorException("This plugin method is not available on this platform.", ExceptionCode.Unavailable);
        }
        handleScannedBarcodes(barcodes) {
          const result = {
            barcodes: barcodes.map((barcode) => ({
              cornerPoints: [
                [barcode.cornerPoints[0].x, barcode.cornerPoints[0].y],
                [barcode.cornerPoints[1].x, barcode.cornerPoints[1].y],
                [barcode.cornerPoints[2].x, barcode.cornerPoints[2].y],
                [barcode.cornerPoints[3].x, barcode.cornerPoints[3].y]
              ],
              displayValue: barcode.rawValue,
              rawValue: barcode.rawValue,
              format: barcode.format.toUpperCase(),
              valueType: BarcodeValueType.Unknown
            }))
          };
          this.notifyListeners(this.eventBarcodesScanned, result);
        }
      };
    }
  });

  // node_modules/@capacitor-community/admob/dist/esm/index.js
  init_dist();

  // node_modules/@capacitor-community/admob/dist/esm/definitions.js
  var MaxAdContentRating;
  (function(MaxAdContentRating2) {
    MaxAdContentRating2["General"] = "General";
    MaxAdContentRating2["ParentalGuidance"] = "ParentalGuidance";
    MaxAdContentRating2["Teen"] = "Teen";
    MaxAdContentRating2["MatureAudience"] = "MatureAudience";
  })(MaxAdContentRating || (MaxAdContentRating = {}));

  // node_modules/@capacitor-community/admob/dist/esm/banner/banner-ad-plugin-events.enum.js
  var BannerAdPluginEvents;
  (function(BannerAdPluginEvents2) {
    BannerAdPluginEvents2["SizeChanged"] = "bannerAdSizeChanged";
    BannerAdPluginEvents2["Loaded"] = "bannerAdLoaded";
    BannerAdPluginEvents2["FailedToLoad"] = "bannerAdFailedToLoad";
    BannerAdPluginEvents2["Opened"] = "bannerAdOpened";
    BannerAdPluginEvents2["Closed"] = "bannerAdClosed";
    BannerAdPluginEvents2["AdImpression"] = "bannerAdImpression";
  })(BannerAdPluginEvents || (BannerAdPluginEvents = {}));

  // node_modules/@capacitor-community/admob/dist/esm/banner/banner-ad-position.enum.js
  var BannerAdPosition;
  (function(BannerAdPosition2) {
    BannerAdPosition2["TOP_CENTER"] = "TOP_CENTER";
    BannerAdPosition2["CENTER"] = "CENTER";
    BannerAdPosition2["BOTTOM_CENTER"] = "BOTTOM_CENTER";
  })(BannerAdPosition || (BannerAdPosition = {}));

  // node_modules/@capacitor-community/admob/dist/esm/banner/banner-ad-size.enum.js
  var BannerAdSize;
  (function(BannerAdSize2) {
    BannerAdSize2["BANNER"] = "BANNER";
    BannerAdSize2["FULL_BANNER"] = "FULL_BANNER";
    BannerAdSize2["LARGE_BANNER"] = "LARGE_BANNER";
    BannerAdSize2["MEDIUM_RECTANGLE"] = "MEDIUM_RECTANGLE";
    BannerAdSize2["LEADERBOARD"] = "LEADERBOARD";
    BannerAdSize2["ADAPTIVE_BANNER"] = "ADAPTIVE_BANNER";
    BannerAdSize2["SMART_BANNER"] = "SMART_BANNER";
  })(BannerAdSize || (BannerAdSize = {}));

  // node_modules/@capacitor-community/admob/dist/esm/interstitial/interstitial-ad-plugin-events.enum.js
  var InterstitialAdPluginEvents;
  (function(InterstitialAdPluginEvents2) {
    InterstitialAdPluginEvents2["Loaded"] = "interstitialAdLoaded";
    InterstitialAdPluginEvents2["FailedToLoad"] = "interstitialAdFailedToLoad";
    InterstitialAdPluginEvents2["Showed"] = "interstitialAdShowed";
    InterstitialAdPluginEvents2["FailedToShow"] = "interstitialAdFailedToShow";
    InterstitialAdPluginEvents2["Dismissed"] = "interstitialAdDismissed";
  })(InterstitialAdPluginEvents || (InterstitialAdPluginEvents = {}));

  // node_modules/@capacitor-community/admob/dist/esm/reward-interstitial/reward-interstitial-ad-plugin-events.enum.js
  var RewardInterstitialAdPluginEvents;
  (function(RewardInterstitialAdPluginEvents2) {
    RewardInterstitialAdPluginEvents2["Loaded"] = "onRewardedInterstitialAdLoaded";
    RewardInterstitialAdPluginEvents2["FailedToLoad"] = "onRewardedInterstitialAdFailedToLoad";
    RewardInterstitialAdPluginEvents2["Showed"] = "onRewardedInterstitialAdShowed";
    RewardInterstitialAdPluginEvents2["FailedToShow"] = "onRewardedInterstitialAdFailedToShow";
    RewardInterstitialAdPluginEvents2["Dismissed"] = "onRewardedInterstitialAdDismissed";
    RewardInterstitialAdPluginEvents2["Rewarded"] = "onRewardedInterstitialAdReward";
  })(RewardInterstitialAdPluginEvents || (RewardInterstitialAdPluginEvents = {}));

  // node_modules/@capacitor-community/admob/dist/esm/reward/reward-ad-plugin-events.enum.js
  var RewardAdPluginEvents;
  (function(RewardAdPluginEvents2) {
    RewardAdPluginEvents2["Loaded"] = "onRewardedVideoAdLoaded";
    RewardAdPluginEvents2["FailedToLoad"] = "onRewardedVideoAdFailedToLoad";
    RewardAdPluginEvents2["Showed"] = "onRewardedVideoAdShowed";
    RewardAdPluginEvents2["FailedToShow"] = "onRewardedVideoAdFailedToShow";
    RewardAdPluginEvents2["Dismissed"] = "onRewardedVideoAdDismissed";
    RewardAdPluginEvents2["Rewarded"] = "onRewardedVideoAdReward";
  })(RewardAdPluginEvents || (RewardAdPluginEvents = {}));

  // node_modules/@capacitor-community/admob/dist/esm/consent/index.js
  init_consent_status_enum();

  // node_modules/@capacitor-community/admob/dist/esm/consent/consent-debug-geography.enum.js
  var AdmobConsentDebugGeography;
  (function(AdmobConsentDebugGeography2) {
    AdmobConsentDebugGeography2[AdmobConsentDebugGeography2["DISABLED"] = 0] = "DISABLED";
    AdmobConsentDebugGeography2[AdmobConsentDebugGeography2["EEA"] = 1] = "EEA";
    AdmobConsentDebugGeography2[AdmobConsentDebugGeography2["NOT_EEA"] = 2] = "NOT_EEA";
    AdmobConsentDebugGeography2[AdmobConsentDebugGeography2["US"] = 3] = "US";
    AdmobConsentDebugGeography2[AdmobConsentDebugGeography2["OTHER"] = 4] = "OTHER";
  })(AdmobConsentDebugGeography || (AdmobConsentDebugGeography = {}));

  // node_modules/@capacitor-community/admob/dist/esm/index.js
  var AdMob = registerPlugin("AdMob", {
    web: () => Promise.resolve().then(() => (init_web(), web_exports)).then((m) => new m.AdMobWeb())
  });

  // src/app.js
  init_dist();

  // node_modules/@capacitor-mlkit/barcode-scanning/dist/esm/index.js
  init_dist();
  init_definitions();
  var BarcodeScanner = registerPlugin("BarcodeScanner", {
    web: () => Promise.resolve().then(() => (init_web2(), web_exports2)).then((m) => new m.BarcodeScannerWeb())
  });

  // src/app.js
  var T = { es: { heading: "Escanea un alimento", intro: "Comprueba los ingredientes declarados de un producto.", scan: "Escanear c\xF3digo", again: "Escanear otro", manual: "Introducir c\xF3digo manualmente", history: "\xDAltimos escaneos", disclaimer: "Informaci\xF3n orientativa basada en Open Food Facts. Los datos pueden estar incompletos. Revisa siempre el envase.", safe: "APTO", unsafe: "NO APTO", unknown: "NO VERIFICADO", missing: "Producto o ingredientes no disponibles", uncertain: "Hay ingredientes de origen incierto", found: "Ingrediente detectado", clean: "No se han detectado ingredientes de cerdo en la lista disponible", error: "No se pudo consultar el producto", permission: "No se concedi\xF3 acceso a la c\xE1mara" }, en: { heading: "Scan a food product", intro: "Check a product\u2019s listed ingredients.", scan: "Scan barcode", again: "Scan another", manual: "Enter barcode manually", history: "Recent scans", disclaimer: "Informational only, based on Open Food Facts. Data may be incomplete. Always check packaging.", safe: "SUITABLE", unsafe: "NOT SUITABLE", unknown: "UNVERIFIED", missing: "Product or ingredients unavailable", uncertain: "Some ingredients have uncertain origins", found: "Detected ingredient", clean: "No pork ingredients detected in available list", error: "Could not look up product", permission: "Camera permission not granted" }, fr: { heading: "Scannez un aliment", intro: "V\xE9rifiez les ingr\xE9dients d\xE9clar\xE9s du produit.", scan: "Scanner le code", again: "Scanner un autre", manual: "Saisir un code", history: "Scans r\xE9cents", disclaimer: "Informations indicatives issues d\u2019Open Food Facts. Les donn\xE9es peuvent \xEAtre incompl\xE8tes. V\xE9rifiez toujours l\u2019emballage.", safe: "ADAPT\xC9", unsafe: "NON ADAPT\xC9", unknown: "NON V\xC9RIFI\xC9", missing: "Produit ou ingr\xE9dients indisponibles", uncertain: "Certains ingr\xE9dients ont une origine incertaine", found: "Ingr\xE9dient d\xE9tect\xE9", clean: "Aucun ingr\xE9dient porcin d\xE9tect\xE9 dans la liste disponible", error: "Impossible de consulter le produit", permission: "Acc\xE8s cam\xE9ra refus\xE9" } };
  var $ = (id) => document.getElementById(id);
  var lang = localStorage.getItem("lang") || "es";
  var completed = 0;
  function tr(k) {
    return T[lang][k];
  }
  function render() {
    document.documentElement.lang = lang;
    for (const [id, key] of Object.entries({ heading: "heading", intro: "intro", scan: "scan", again: "again", "manual-title": "manual", "history-title": "history", disclaimer: "disclaimer" })) $(id).textContent = tr(key);
    $("lang").value = lang;
    renderHistory();
  }
  $("lang").onchange = (e) => {
    lang = e.target.value;
    localStorage.setItem("lang", lang);
    render();
  };
  var pork = /(\bpork\b|\bpig\b|\bporcine\b|\blard\b|\bbacon\b|\bham\b|\bsaindoux\b|\bporc\b|\bcochon\b|\bcerdo\b|\bporcino\b|\bmanteca de cerdo\b|\bjam[oó]n\b|\btocino\b|\bpancetta\b|\bprosciutto\b|\bschwein\b|\bschweinefleisch\b|\bschmalz\b|\bgelatina de cerdo\b)/i;
  var uncertain = /(\bgelatin(e|a)?\b|\bgelatina\b|\bg[eé]latine\b|\brennet\b|\bcuajo\b|\bprésure\b|\banimal fat\b|\bgrasa animal\b|\bgraisse animale\b|\bmono.?diglycerides\b|\bmono.?diglic[eé]ridos\b|\be[- ]?47[1-9]\b|\be[- ]?441\b)/i;
  function assess(p) {
    const raw = [p.ingredients_text, p.ingredients_text_es, p.ingredients_text_en, p.ingredients_text_fr].filter(Boolean).join(" | ");
    if (!raw.trim()) return { state: "unknown", detail: tr("missing") };
    let m = raw.match(pork);
    if (m) return { state: "unsafe", detail: tr("found") + ": " + m[0] };
    m = raw.match(uncertain);
    if (m) return { state: "unknown", detail: tr("uncertain") + ": " + m[0] };
    return { state: "safe", detail: tr("clean") };
  }
  function renderHistory() {
    const items = JSON.parse(localStorage.getItem("history") || "[]");
    $("history").textContent = items.map((x) => x.name + " \xB7 " + x.code).join("\n") || "\u2014";
    $("history").style.whiteSpace = "pre-line";
  }
  async function lookup(code) {
    if (!/^\d{8,14}$/.test(code)) return;
    $("result").style.display = "block";
    $("status").textContent = "\u2026";
    $("product").textContent = "";
    $("detail").textContent = "";
    let state = "unknown", detail = "", name = code;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 1e4);
      let res;
      try {
        res = await fetch("https://world.openfoodfacts.org/api/v2/product/" + encodeURIComponent(code) + ".json?fields=code,product_name,product_name_es,product_name_en,product_name_fr,ingredients_text,ingredients_text_es,ingredients_text_en,ingredients_text_fr", { signal: controller.signal });
      } finally {
        clearTimeout(timeout);
      }
      if (!res.ok) throw Error("HTTP " + res.status);
      const data = await res.json();
      if (data.status !== 1) {
        detail = tr("missing");
      } else {
        name = data.product?.["product_name_" + lang] || data.product?.product_name || code;
        ({ state, detail } = assess(data.product || {}));
      }
    } catch (e) {
      detail = tr("error");
    }
    const labels = { safe: tr("safe"), unsafe: tr("unsafe"), unknown: tr("unknown") };
    $("status").textContent = labels[state];
    $("status").style.color = { safe: "#15803d", unsafe: "#c62828", unknown: "#a36b00" }[state];
    $("product").textContent = name;
    $("detail").textContent = detail;
    let h = JSON.parse(localStorage.getItem("history") || "[]");
    h.unshift({ name, code, state });
    localStorage.setItem("history", JSON.stringify(h.slice(0, 15)));
    renderHistory();
    completed++;
  }
  $("lookup").onclick = () => lookup($("barcode").value.trim());
  $("barcode").onkeydown = (e) => {
    if (e.key === "Enter") lookup(e.target.value.trim());
  };
  $("again").onclick = async () => {
    await maybeShowInterstitial();
    $("result").style.display = "none";
  };
  $("scan").onclick = async () => {
    try {
      if (!Capacitor.isNativePlatform()) {
        alert("El esc\xE1ner requiere la aplicaci\xF3n Android. Puedes introducir un c\xF3digo manualmente.");
        return;
      }
      const { camera } = await BarcodeScanner.checkPermissions();
      if (camera !== "granted") {
        const p = await BarcodeScanner.requestPermissions();
        if (p.camera !== "granted") {
          alert(tr("permission"));
          return;
        }
      }
      const moduleStatus = await BarcodeScanner.isGoogleBarcodeScannerModuleAvailable();
      if (!moduleStatus.available) {
        await BarcodeScanner.installGoogleBarcodeScannerModule();
        alert("Se est\xE1 instalando el esc\xE1ner. Espera unos segundos y vuelve a pulsar Escanear c\xF3digo.");
        return;
      }
      const r = await BarcodeScanner.scan({ formats: [BarcodeFormat.Ean13, BarcodeFormat.Ean8, BarcodeFormat.UpcA, BarcodeFormat.UpcE] });
      const code = r.barcodes?.[0]?.rawValue;
      if (code) await lookup(code);
    } catch (e) {
      alert(String(e.message || e));
    }
  };
  render();
  var TEST_ADS = true;
  var AD_BANNER = TEST_ADS ? "ca-app-pub-3940256099942544/9214589741" : "ca-app-pub-8854680295966508/9086592417";
  var AD_INTERSTITIAL = TEST_ADS ? "ca-app-pub-3940256099942544/1033173712" : "ca-app-pub-8854680295966508/6735761245";
  var adsReady = false;
  var interstitialReady = false;
  var lastInterstitialScan = 0;
  async function prepareInterstitial() {
    if (!adsReady) return;
    try {
      await AdMob.prepareInterstitial({ adId: AD_INTERSTITIAL });
      interstitialReady = true;
    } catch (e) {
      interstitialReady = false;
      console.warn(e);
    }
  }
  async function maybeShowInterstitial() {
    if (completed - lastInterstitialScan < 5) return;
    if (!adsReady || !interstitialReady) return;
    lastInterstitialScan = completed;
    interstitialReady = false;
    try {
      await AdMob.showInterstitial();
    } catch (e) {
      console.warn(e);
    }
    await prepareInterstitial();
  }
  async function startAds() {
    if (!Capacitor.isNativePlatform()) return;
    try {
      let consent = await AdMob.requestConsentInfo();
      if (consent.isConsentFormAvailable && consent.status === AdmobConsentStatus.REQUIRED) {
        consent = await AdMob.showConsentForm();
      }
      if (consent.privacyOptionsRequirementStatus === "REQUIRED") {
        document.getElementById("privacy-options").style.display = "block";
      }
      if (!consent.canRequestAds) return;
      await AdMob.initialize();
      adsReady = true;
      await AdMob.showBanner({
        adId: AD_BANNER,
        adSize: BannerAdSize.ADAPTIVE_BANNER,
        position: BannerAdPosition.BOTTOM_CENTER,
        margin: 0
      });
      await prepareInterstitial();
    } catch (e) {
      console.warn("AdMob:", e);
    }
  }
  document.getElementById("privacy-options").onclick = async () => {
    try {
      await AdMob.showPrivacyOptionsForm();
    } catch (e) {
      console.warn(e);
    }
  };
  setTimeout(startAds, 500);
})();
/*! Bundled license information:

@capacitor/core/dist/index.js:
  (*! Capacitor: https://capacitorjs.com/ - MIT License *)
*/
