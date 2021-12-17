import { isPlainObject, isArray, hasOwn, isFunction, extend, camelize } from '@vue/shared';
import { injectHook, ref, nextTick, getExposeProxy, findComponentPropsData, toRaw, updateProps, invalidateJob, pruneComponentPropsCache } from 'vue';

// lifecycle
// App and Page
const ON_SHOW$1 = 'onShow';
//Page
const ON_LOAD$1 = 'onLoad';
const ON_READY$1 = 'onReady';

class EventChannel$1 {
    constructor(id, events) {
        this.id = id;
        this.listener = {};
        this.emitCache = {};
        if (events) {
            Object.keys(events).forEach((name) => {
                this.on(name, events[name]);
            });
        }
    }
    emit(eventName, ...args) {
        const fns = this.listener[eventName];
        if (!fns) {
            return (this.emitCache[eventName] || (this.emitCache[eventName] = [])).push(args);
        }
        fns.forEach((opt) => {
            opt.fn.apply(opt.fn, args);
        });
        this.listener[eventName] = fns.filter((opt) => opt.type !== 'once');
    }
    on(eventName, fn) {
        this._addListener(eventName, 'on', fn);
        this._clearCache(eventName);
    }
    once(eventName, fn) {
        this._addListener(eventName, 'once', fn);
        this._clearCache(eventName);
    }
    off(eventName, fn) {
        const fns = this.listener[eventName];
        if (!fns) {
            return;
        }
        if (fn) {
            for (let i = 0; i < fns.length;) {
                if (fns[i].fn === fn) {
                    fns.splice(i, 1);
                    i--;
                }
                i++;
            }
        }
        else {
            delete this.listener[eventName];
        }
    }
    _clearCache(eventName) {
        const cacheArgs = this.emitCache[eventName];
        if (cacheArgs) {
            for (; cacheArgs.length > 0;) {
                this.emit.apply(this, [eventName, ...cacheArgs.shift()]);
            }
        }
    }
    _addListener(eventName, type, fn) {
        (this.listener[eventName] || (this.listener[eventName] = [])).push({
            fn,
            type,
        });
    }
}

// quickapp-webview 不能使用 default 作为插槽名称
const SLOT_DEFAULT_NAME = 'd';
// lifecycle
// App and Page
const ON_SHOW = 'onShow';
const ON_HIDE = 'onHide';
//App
const ON_LAUNCH = 'onLaunch';
const ON_ERROR = 'onError';
const ON_THEME_CHANGE = 'onThemeChange';
const ON_PAGE_NOT_FOUND = 'onPageNotFound';
const ON_UNHANDLE_REJECTION = 'onUnhandledRejection';
//Page
const ON_LOAD = 'onLoad';
const ON_READY = 'onReady';
const ON_UNLOAD = 'onUnload';
const ON_RESIZE = 'onResize';
const ON_TAB_ITEM_TAP = 'onTabItemTap';
const ON_REACH_BOTTOM = 'onReachBottom';
const ON_PULL_DOWN_REFRESH = 'onPullDownRefresh';
const ON_ADD_TO_FAVORITES = 'onAddToFavorites';

const encode = encodeURIComponent;
function stringifyQuery(obj, encodeStr = encode) {
    const res = obj
        ? Object.keys(obj)
            .map((key) => {
            let val = obj[key];
            if (typeof val === undefined || val === null) {
                val = '';
            }
            else if (isPlainObject(val)) {
                val = JSON.stringify(val);
            }
            return encodeStr(key) + '=' + encodeStr(val);
        })
            .filter((x) => x.length > 0)
            .join('&')
        : null;
    return res ? `?${res}` : '';
}

function hasLeadingSlash(str) {
    return str.indexOf('/') === 0;
}
function addLeadingSlash(str) {
    return hasLeadingSlash(str) ? str : '/' + str;
}
const invokeArrayFns = (fns, arg) => {
    let ret;
    for (let i = 0; i < fns.length; i++) {
        ret = fns[i](arg);
    }
    return ret;
};

class EventChannel {
    constructor(id, events) {
        this.id = id;
        this.listener = {};
        this.emitCache = {};
        if (events) {
            Object.keys(events).forEach((name) => {
                this.on(name, events[name]);
            });
        }
    }
    emit(eventName, ...args) {
        const fns = this.listener[eventName];
        if (!fns) {
            return (this.emitCache[eventName] || (this.emitCache[eventName] = [])).push(args);
        }
        fns.forEach((opt) => {
            opt.fn.apply(opt.fn, args);
        });
        this.listener[eventName] = fns.filter((opt) => opt.type !== 'once');
    }
    on(eventName, fn) {
        this._addListener(eventName, 'on', fn);
        this._clearCache(eventName);
    }
    once(eventName, fn) {
        this._addListener(eventName, 'once', fn);
        this._clearCache(eventName);
    }
    off(eventName, fn) {
        const fns = this.listener[eventName];
        if (!fns) {
            return;
        }
        if (fn) {
            for (let i = 0; i < fns.length;) {
                if (fns[i].fn === fn) {
                    fns.splice(i, 1);
                    i--;
                }
                i++;
            }
        }
        else {
            delete this.listener[eventName];
        }
    }
    _clearCache(eventName) {
        const cacheArgs = this.emitCache[eventName];
        if (cacheArgs) {
            for (; cacheArgs.length > 0;) {
                this.emit.apply(this, [eventName, ...cacheArgs.shift()]);
            }
        }
    }
    _addListener(eventName, type, fn) {
        (this.listener[eventName] || (this.listener[eventName] = [])).push({
            fn,
            type,
        });
    }
}

const eventChannels = {};
const eventChannelStack = [];
function getEventChannel(id) {
    if (id) {
        const eventChannel = eventChannels[id];
        delete eventChannels[id];
        return eventChannel;
    }
    return eventChannelStack.shift();
}

const MP_METHODS = [
    'createSelectorQuery',
    'createIntersectionObserver',
    'selectAllComponents',
    'selectComponent',
];
function createEmitFn(oldEmit, ctx) {
    return function emit(event, ...args) {
        const scope = ctx.$scope;
        if (scope && event) {
            const detail = { __args__: args };
            // 百度小程序，快手小程序，自定义组件不能绑定动态事件
            {
                detail.__ins__ = scope;
            }
            {
                scope.triggerEvent(event, detail);
            }
        }
        return oldEmit.apply(this, [event, ...args]);
    };
}
function initBaseInstance(instance, options) {
    const ctx = instance.ctx;
    // mp
    ctx.mpType = options.mpType; // @deprecated
    ctx.$mpType = options.mpType;
    ctx.$mpPlatform = "mp-baidu";
    ctx.$scope = options.mpInstance;
    // TODO @deprecated
    ctx.$mp = {};
    if (__VUE_OPTIONS_API__) {
        ctx._self = {};
    }
    // $vm
    ctx.$scope.$vm = instance.proxy;
    // slots
    instance.slots = {};
    if (isArray(options.slots) && options.slots.length) {
        options.slots.forEach((name) => {
            instance.slots[name] = true;
        });
        if (instance.slots[SLOT_DEFAULT_NAME]) {
            instance.slots.default = true;
        }
    }
    ctx.getOpenerEventChannel = function () {
        if (!this.__eventChannel__) {
            this.__eventChannel__ = new EventChannel();
        }
        return this.__eventChannel__;
    };
    ctx.$hasHook = hasHook;
    ctx.$callHook = callHook;
    // $emit
    instance.emit = createEmitFn(instance.emit, ctx);
}
function initComponentInstance(instance, options) {
    initBaseInstance(instance, options);
    const ctx = instance.ctx;
    MP_METHODS.forEach((method) => {
        ctx[method] = function (...args) {
            const mpInstance = ctx.$scope;
            if (mpInstance && mpInstance[method]) {
                return mpInstance[method].apply(mpInstance, args);
            }
        };
    });
}
function initMocks(instance, mpInstance, mocks) {
    const ctx = instance.ctx;
    mocks.forEach((mock) => {
        if (hasOwn(mpInstance, mock)) {
            instance[mock] = ctx[mock] = mpInstance[mock];
        }
    });
}
function hasHook(name) {
    const hooks = this.$[name];
    if (hooks && hooks.length) {
        return true;
    }
    return false;
}
function callHook(name, args) {
    if (name === 'mounted') {
        callHook.call(this, 'bm'); // beforeMount
        this.$.isMounted = true;
        name = 'm';
    }
    else if (name === 'onLoad' && args && args.__id__) {
        this.__eventChannel__ = getEventChannel(args.__id__);
        delete args.__id__;
    }
    const hooks = this.$[name];
    return hooks && invokeArrayFns(hooks, args);
}

const PAGE_HOOKS = [
    ON_LOAD,
    ON_SHOW,
    ON_HIDE,
    ON_UNLOAD,
    ON_RESIZE,
    ON_TAB_ITEM_TAP,
    ON_REACH_BOTTOM,
    ON_PULL_DOWN_REFRESH,
    ON_ADD_TO_FAVORITES,
    // 'onReady', // lifetimes.ready
    // 'onPageScroll', // 影响性能，开发者手动注册
    // 'onShareTimeline', // 右上角菜单，开发者手动注册
    // 'onShareAppMessage' // 右上角菜单，开发者手动注册
];
function findHooks(vueOptions, hooks = new Set()) {
    if (vueOptions) {
        Object.keys(vueOptions).forEach((name) => {
            if (name.indexOf('on') === 0 && isFunction(vueOptions[name])) {
                hooks.add(name);
            }
        });
        if (__VUE_OPTIONS_API__) {
            const { extends: extendsOptions, mixins } = vueOptions;
            if (mixins) {
                mixins.forEach((mixin) => findHooks(mixin, hooks));
            }
            if (extendsOptions) {
                findHooks(extendsOptions, hooks);
            }
        }
    }
    return hooks;
}
function initHook$1(mpOptions, hook, excludes) {
    if (excludes.indexOf(hook) === -1 && !hasOwn(mpOptions, hook)) {
        mpOptions[hook] = function (args) {
            return this.$vm && this.$vm.$callHook(hook, args);
        };
    }
}
const EXCLUDE_HOOKS = [ON_READY];
function initHooks(mpOptions, hooks, excludes = EXCLUDE_HOOKS) {
    hooks.forEach((hook) => initHook$1(mpOptions, hook, excludes));
}
function initUnknownHooks(mpOptions, vueOptions, excludes = EXCLUDE_HOOKS) {
    findHooks(vueOptions).forEach((hook) => initHook$1(mpOptions, hook, excludes));
}

swan.appLaunchHooks = [];
function injectAppLaunchHooks(appInstance) {
    swan.appLaunchHooks.forEach((hook) => {
        injectHook(ON_LAUNCH, hook, appInstance);
    });
}

const HOOKS = [
    ON_SHOW,
    ON_HIDE,
    ON_ERROR,
    ON_THEME_CHANGE,
    ON_PAGE_NOT_FOUND,
    ON_UNHANDLE_REJECTION,
];
function parseApp(instance, parseAppOptions) {
    const internalInstance = instance.$;
    const appOptions = {
        globalData: (instance.$options && instance.$options.globalData) || {},
        $vm: instance,
        onLaunch(options) {
            const ctx = internalInstance.ctx;
            if (this.$vm && ctx.$scope) {
                // 已经初始化过了，主要是为了百度，百度 onShow 在 onLaunch 之前
                return;
            }
            initBaseInstance(internalInstance, {
                mpType: 'app',
                mpInstance: this,
                slots: [],
            });
            injectAppLaunchHooks(internalInstance);
            ctx.globalData = this.globalData;
            instance.$callHook(ON_LAUNCH, extend({ app: { mixin: internalInstance.appContext.app.mixin } }, options));
        },
    };
    initLocale(instance);
    const vueOptions = instance.$.type;
    initHooks(appOptions, HOOKS);
    initUnknownHooks(appOptions, vueOptions);
    if (__VUE_OPTIONS_API__) {
        const methods = vueOptions.methods;
        methods && extend(appOptions, methods);
    }
    if (parseAppOptions) {
        parseAppOptions.parse(appOptions);
    }
    return appOptions;
}
function initCreateApp(parseAppOptions) {
    return function createApp(vm) {
        return App(parseApp(vm, parseAppOptions));
    };
}
function initCreateSubpackageApp(parseAppOptions) {
    return function createApp(vm) {
        const appOptions = parseApp(vm, parseAppOptions);
        const app = getApp({
            allowDefault: true,
        });
        vm.$.ctx.$scope = app;
        const globalData = app.globalData;
        if (globalData) {
            Object.keys(appOptions.globalData).forEach((name) => {
                if (!hasOwn(globalData, name)) {
                    globalData[name] = appOptions.globalData[name];
                }
            });
        }
        Object.keys(appOptions).forEach((name) => {
            if (!hasOwn(app, name)) {
                app[name] = appOptions[name];
            }
        });
        initAppLifecycle(appOptions, vm);
    };
}
function initAppLifecycle(appOptions, vm) {
    if (isFunction(appOptions.onShow) && swan.onAppShow) {
        swan.onAppShow((args) => {
            vm.$callHook('onShow', args);
        });
    }
    if (isFunction(appOptions.onHide) && swan.onAppHide) {
        swan.onAppHide((args) => {
            vm.$callHook('onHide', args);
        });
    }
    if (isFunction(appOptions.onLaunch)) {
        const args = swan.getLaunchOptionsSync && swan.getLaunchOptionsSync();
        vm.$callHook('onLaunch', args || {});
    }
}
function initLocale(appVm) {
    const locale = ref(swan.getSystemInfoSync().language || 'zh-Hans');
    Object.defineProperty(appVm, '$locale', {
        get() {
            return locale.value;
        },
        set(v) {
            locale.value = v;
        },
    });
}

function initBehavior(options) {
    return Behavior(options);
}
function initVueIds(vueIds, mpInstance) {
    if (!vueIds) {
        return;
    }
    const ids = vueIds.split(',');
    const len = ids.length;
    if (len === 1) {
        mpInstance._$vueId = ids[0];
    }
    else if (len === 2) {
        mpInstance._$vueId = ids[0];
        mpInstance._$vuePid = ids[1];
    }
}
const EXTRAS = ['externalClasses'];
function initExtraOptions(miniProgramComponentOptions, vueOptions) {
    EXTRAS.forEach((name) => {
        if (hasOwn(vueOptions, name)) {
            miniProgramComponentOptions[name] = vueOptions[name];
        }
    });
}
function initWxsCallMethods(methods, wxsCallMethods) {
    if (!isArray(wxsCallMethods)) {
        return;
    }
    wxsCallMethods.forEach((callMethod) => {
        methods[callMethod] = function (args) {
            return this.$vm[callMethod](args);
        };
    });
}
function selectAllComponents(mpInstance, selector, $refs) {
    const components = mpInstance.selectAllComponents(selector);
    components.forEach((component) => {
        const ref = component.properties.uR;
        $refs[ref] = findRefValue(component);
    });
}
function findRefValue(component) {
    const vm = component.$vm;
    if (vm) {
        return getExposeProxy(vm.$) || vm;
    }
    return component;
}
function initRefs(instance, mpInstance) {
    Object.defineProperty(instance, 'refs', {
        get() {
            const $refs = {};
            selectAllComponents(mpInstance, '.r', $refs);
            const forComponents = mpInstance.selectAllComponents('.r-i-f');
            forComponents.forEach((component) => {
                const ref = component.properties.uR;
                if (!ref) {
                    return;
                }
                if (!$refs[ref]) {
                    $refs[ref] = [];
                }
                $refs[ref].push(findRefValue(component));
            });
            return $refs;
        },
    });
}
function findVmByVueId(instance, vuePid) {
    // 标准 vue3 中 没有 $children，定制了内核
    const $children = instance.$children;
    // 优先查找直属(反向查找:https://github.com/dcloudio/uni-app/issues/1200)
    for (let i = $children.length - 1; i >= 0; i--) {
        const childVm = $children[i];
        if (childVm.$scope._$vueId === vuePid) {
            return childVm;
        }
    }
    // 反向递归查找
    let parentVm;
    for (let i = $children.length - 1; i >= 0; i--) {
        parentVm = findVmByVueId($children[i], vuePid);
        if (parentVm) {
            return parentVm;
        }
    }
}
const EVENT_OPTS = 'eO';
/**
 * 需要搭配：
 * ./componentInstance/index.ts:24 triggerEvent 时传递 __ins__
 * ./componentProps.ts:49 增加 properties eO
 * @param this
 * @param event
 * @returns
 */
function handleEvent(event) {
    const { type, target: { dataset }, detail: { __ins__ }, } = event;
    let methodName = type;
    // 快手小程序的 __l 方法也会走此处逻辑，但没有 __ins__
    if (__ins__) {
        // 自定义事件，通过 triggerEvent 传递 __ins__
        methodName = (__ins__.properties[EVENT_OPTS] || {})[type];
    }
    else if (dataset && dataset[EVENT_OPTS]) {
        // 快手小程序 input 等内置组件的 input 事件也会走此逻辑，所以从 dataset 中读取
        methodName = dataset[EVENT_OPTS][type];
    }
    if (!this[methodName]) {
        return console.warn(type + ' not found');
    }
    this[methodName](event);
}
function nextSetDataTick(mpInstance, fn) {
    // 随便设置一个字段来触发回调（部分平台必须有字段才可以，比如头条）
    mpInstance.setData({ r1: 1 }, () => fn());
}
function initSetRef(mpInstance) {
    if (!mpInstance._$setRef) {
        mpInstance._$setRef = (fn) => {
            nextTick(() => nextSetDataTick(mpInstance, fn));
        };
    }
}

const builtInProps = [
    // 百度小程序,快手小程序自定义组件不支持绑定动态事件，动态dataset，故通过props传递事件信息
    // event-opts
    'eO',
    // 组件 ref
    'uR',
    // 组件 ref-in-for
    'uRIF',
    // 组件 id
    'uI',
    // 组件类型 m: 小程序组件
    'uT',
    // 组件 props
    'uP',
    // 小程序不能直接定义 $slots 的 props，所以通过 vueSlots 转换到 $slots
    'uS',
];
function initDefaultProps(isBehavior = false) {
    const properties = {};
    if (!isBehavior) {
        // 均不指定类型，避免微信小程序 property received type-uncompatible value 警告
        builtInProps.forEach((name) => {
            properties[name] = {
                type: null,
                value: '',
            };
        });
        // 小程序不能直接定义 $slots 的 props，所以通过 vueSlots 转换到 $slots
        properties.uS = {
            type: null,
            value: [],
            observer: function (newVal) {
                const $slots = Object.create(null);
                newVal &&
                    newVal.forEach((slotName) => {
                        $slots[slotName] = true;
                    });
                this.setData({
                    $slots,
                });
            },
        };
    }
    return properties;
}
/**
 *
 * @param mpComponentOptions
 * @param isBehavior
 */
function initProps(mpComponentOptions) {
    if (!mpComponentOptions.properties) {
        mpComponentOptions.properties = {};
    }
    extend(mpComponentOptions.properties, initDefaultProps());
}
/**
 * 初始化页面 props，方便接收页面参数，类型均为String，默认值均为''
 * @param param
 * @param rawProps
 */
function initPageProps({ properties }, rawProps) {
    if (isArray(rawProps)) {
        rawProps.forEach((key) => {
            properties[key] = {
                type: String,
                value: '',
            };
        });
    }
    else if (isPlainObject(rawProps)) {
        Object.keys(rawProps).forEach((key) => {
            properties[key] = {
                type: String,
                value: '',
            };
        });
    }
}
function findPropsData(properties, isPage) {
    return ((isPage
        ? findPagePropsData(properties)
        : findComponentPropsData(properties.uP)) || {});
}
function findPagePropsData(properties) {
    const propsData = {};
    if (isPlainObject(properties)) {
        Object.keys(properties).forEach((name) => {
            if (builtInProps.indexOf(name) === -1) {
                propsData[name] = properties[name];
            }
        });
    }
    return propsData;
}

function initData(_) {
    return {};
}
function initPropsObserver(componentOptions) {
    const observe = function observe() {
        const up = this.properties.uP;
        if (!up) {
            return;
        }
        if (this.$vm) {
            updateComponentProps(up, this.$vm.$);
        }
        else if (this.properties.uT === 'm') {
            // 小程序组件
            updateMiniProgramComponentProperties(up, this);
        }
    };
    {
        componentOptions.properties.uP.observer = observe;
    }
}
function updateMiniProgramComponentProperties(up, mpInstance) {
    const prevProps = mpInstance.properties;
    const nextProps = findComponentPropsData(up) || {};
    if (hasPropsChanged(prevProps, nextProps, false)) {
        mpInstance.setData(nextProps);
    }
}
function updateComponentProps(up, instance) {
    const prevProps = toRaw(instance.props);
    const nextProps = findComponentPropsData(up) || {};
    if (hasPropsChanged(prevProps, nextProps)) {
        updateProps(instance, nextProps, prevProps, false);
        invalidateJob(instance.update);
        instance.update();
    }
}
function hasPropsChanged(prevProps, nextProps, checkLen = true) {
    const nextKeys = Object.keys(nextProps);
    if (checkLen && nextKeys.length !== Object.keys(prevProps).length) {
        return true;
    }
    for (let i = 0; i < nextKeys.length; i++) {
        const key = nextKeys[i];
        if (nextProps[key] !== prevProps[key]) {
            return true;
        }
    }
    return false;
}
function initBehaviors(vueOptions, initBehavior) {
    const vueBehaviors = vueOptions.behaviors;
    const vueExtends = vueOptions.extends;
    const vueMixins = vueOptions.mixins;
    let vueProps = vueOptions.props;
    if (!vueProps) {
        vueOptions.props = vueProps = [];
    }
    const behaviors = [];
    if (isArray(vueBehaviors)) {
        vueBehaviors.forEach((behavior) => {
            behaviors.push(behavior.replace('uni://', 'swan://'));
            if (behavior === 'uni://form-field') {
                if (isArray(vueProps)) {
                    vueProps.push('name');
                    vueProps.push('value');
                }
                else {
                    vueProps.name = {
                        type: String,
                        default: '',
                    };
                    vueProps.value = {
                        type: [String, Number, Boolean, Array, Object, Date],
                        default: '',
                    };
                }
            }
        });
    }
    if (vueExtends && vueExtends.props) {
        const behavior = {};
        behaviors.push(initBehavior(behavior));
    }
    if (isArray(vueMixins)) {
        vueMixins.forEach((vueMixin) => {
            if (vueMixin.props) {
                const behavior = {};
                behaviors.push(initBehavior(behavior));
            }
        });
    }
    return behaviors;
}
function applyOptions(componentOptions, vueOptions, initBehavior) {
    componentOptions.data = initData();
    componentOptions.behaviors = initBehaviors(vueOptions, initBehavior);
}

function parseComponent(vueOptions, { parse, mocks, isPage, initRelation, handleLink, initLifetimes, }) {
    vueOptions = vueOptions.default || vueOptions;
    const options = {
        multipleSlots: true,
        addGlobalClass: true,
        pureDataPattern: /^uP$/,
    };
    if (vueOptions.options) {
        extend(options, vueOptions.options);
    }
    const mpComponentOptions = {
        options,
        lifetimes: initLifetimes({ mocks, isPage, initRelation, vueOptions }),
        pageLifetimes: {
            show() {
                this.$vm && this.$vm.$callHook('onPageShow');
            },
            hide() {
                this.$vm && this.$vm.$callHook('onPageHide');
            },
            resize(size) {
                this.$vm && this.$vm.$callHook('onPageResize', size);
            },
        },
        methods: {
            __l: handleLink,
        },
    };
    if (__VUE_OPTIONS_API__) {
        applyOptions(mpComponentOptions, vueOptions, initBehavior);
    }
    initProps(mpComponentOptions);
    initPropsObserver(mpComponentOptions);
    initExtraOptions(mpComponentOptions, vueOptions);
    initWxsCallMethods(mpComponentOptions.methods, vueOptions.wxsCallMethods);
    if (parse) {
        parse(mpComponentOptions, { handleLink });
    }
    return mpComponentOptions;
}
function initCreateComponent(parseOptions) {
    return function createComponent(vueComponentOptions) {
        return Component(parseComponent(vueComponentOptions, parseOptions));
    };
}
let $createComponentFn;
let $destroyComponentFn;
function $createComponent(initialVNode, options) {
    if (!$createComponentFn) {
        $createComponentFn = getApp().$vm.$createComponent;
    }
    return $createComponentFn(initialVNode, options);
}
function $destroyComponent(instance) {
    if (!$destroyComponentFn) {
        $destroyComponentFn = getApp().$vm.$destroyComponent;
    }
    return $destroyComponentFn(instance);
}

function parsePage(vueOptions, parseOptions) {
    const { parse, mocks, isPage, initRelation, handleLink, initLifetimes } = parseOptions;
    const miniProgramPageOptions = parseComponent(vueOptions, {
        mocks,
        isPage,
        initRelation,
        handleLink,
        initLifetimes,
    });
    initPageProps(miniProgramPageOptions, (vueOptions.default || vueOptions).props);
    const methods = miniProgramPageOptions.methods;
    methods.onLoad = function (query) {
        this.options = query;
        this.$page = {
            fullPath: addLeadingSlash(this.route + stringifyQuery(query)),
        };
        return this.$vm && this.$vm.$callHook(ON_LOAD, query);
    };
    initHooks(methods, PAGE_HOOKS);
    initUnknownHooks(methods, vueOptions);
    parse && parse(miniProgramPageOptions, { handleLink });
    return miniProgramPageOptions;
}
function initCreatePage(parseOptions) {
    return function createPage(vuePageOptions) {
        return Component(parsePage(vuePageOptions, parseOptions));
    };
}

const MPPage = Page;
const MPComponent = Component;
const customizeRE = /:/g;
function customize(str) {
    return camelize(str.replace(customizeRE, '-'));
}
function initTriggerEvent(mpInstance) {
    const oldTriggerEvent = mpInstance.triggerEvent;
    mpInstance.triggerEvent = function (event, ...args) {
        return oldTriggerEvent.apply(mpInstance, [customize(event), ...args]);
    };
}
function initHook(name, options, isComponent) {
    const oldHook = options[name];
    if (!oldHook) {
        options[name] = function () {
            initTriggerEvent(this);
        };
    }
    else {
        options[name] = function (...args) {
            initTriggerEvent(this);
            return oldHook.apply(this, args);
        };
    }
}
Page = function (options) {
    initHook(ON_LOAD, options);
    return MPPage(options);
};
{
    Page.after = MPPage.after;
}
Component = function (options) {
    initHook('created', options);
    // 小程序组件
    const isVueComponent = options.properties && options.properties.uP;
    if (!isVueComponent) {
        initProps(options);
        initPropsObserver(options);
    }
    return MPComponent(options);
};

function parse$2(appOptions) {
    // 百度 onShow 竟然会在 onLaunch 之前
    appOptions.onShow = function onShow(args) {
        if (!this.$vm) {
            this.onLaunch(args);
        }
        this.$vm.$callHook(ON_SHOW$1, args);
    };
}

var parseAppOptions = /*#__PURE__*/Object.freeze({
    __proto__: null,
    parse: parse$2
});

/**
 * 用于延迟调用 setData
 * 在 setData 真实调用的时机需执行 fixSetDataEnd
 * @param {*} mpInstance
 */
function fixSetDataStart(mpInstance) {
    const setData = mpInstance.setData;
    const setDataArgs = [];
    mpInstance.setData = function () {
        setDataArgs.push(arguments);
    };
    mpInstance.__fixInitData = function () {
        this.setData = setData;
        const fn = () => {
            setDataArgs.forEach((args) => {
                setData.apply(this, args);
            });
        };
        if (setDataArgs.length) {
            if (this.groupSetData) {
                this.groupSetData(fn);
            }
            else {
                fn();
            }
        }
    };
}
/**
 * 恢复真实的 setData 方法
 * @param {*} mpInstance
 */
function fixSetDataEnd(mpInstance) {
    if (mpInstance.__fixInitData) {
        mpInstance.__fixInitData();
        delete mpInstance.__fixInitData;
    }
}

// @ts-ignore
function initLifetimes({ mocks, isPage, initRelation, vueOptions, }) {
    return {
        attached() {
            // 微信 和 QQ 不需要延迟 setRef
            {
                initSetRef(this);
            }
            const properties = this.properties;
            initVueIds(properties.uI, this);
            const relationOptions = {
                vuePid: this._$vuePid,
            };
            // 处理父子关系
            initRelation(this, relationOptions);
            // 初始化 vue 实例
            const mpInstance = this;
            const isMiniProgramPage = isPage(mpInstance);
            this.$vm = $createComponent({
                type: vueOptions,
                props: findPropsData(properties, isMiniProgramPage),
            }, {
                mpType: isMiniProgramPage ? 'page' : 'component',
                mpInstance,
                slots: properties.uS || {},
                parentComponent: relationOptions.parent && relationOptions.parent.$,
                onBeforeSetup(instance, options) {
                    initRefs(instance, mpInstance);
                    initMocks(instance, mpInstance, mocks);
                    initComponentInstance(instance, options);
                },
            });
        },
        ready() {
            // 当组件 props 默认值为 true，初始化时传入 false 会导致 created,ready 触发, 但 attached 不触发
            // https://developers.weixin.qq.com/community/develop/doc/00066ae2844cc0f8eb883e2a557800
            if (this.$vm) {
                {
                    nextSetDataTick(this, () => {
                        this.$vm.$callHook('mounted');
                        this.$vm.$callHook(ON_READY$1);
                    });
                }
            }
        },
        detached() {
            if (this.$vm) {
                pruneComponentPropsCache(this.$vm.$.uid);
                $destroyComponent(this.$vm);
            }
        },
    };
}

function handleLink(event) {
    // detail 是微信,value 是百度(dipatch)
    const detail = (event.detail ||
        event.value);
    const vuePid = detail.vuePid;
    let parentVm;
    if (vuePid) {
        parentVm = findVmByVueId(this.$vm, vuePid);
    }
    if (!parentVm) {
        parentVm = this.$vm;
    }
    detail.parent = parentVm;
}

const mocks = ['nodeId', 'componentName', '_componentId', 'uniquePrefix'];
function isPage(mpInstance) {
    return !hasOwn(mpInstance, 'ownerId');
}
function initRelation(mpInstance, detail) {
    mpInstance.dispatch('__l', detail);
}
const newLifecycle = /*#__PURE__*/ swan.canIUse('lifecycle-2-0');
function parse$1(componentOptions) {
    const methods = componentOptions.methods;
    const lifetimes = componentOptions.lifetimes;
    // 关于百度小程序生命周期的说明(组件作为页面时):
    // lifetimes:attached --> methods:onShow --> methods:onLoad --> methods:onReady
    // 这里在强制将onShow挪到onLoad之后触发,另外一处修改在page-parser.js
    const oldAttached = lifetimes.attached;
    // 百度小程序基础库 3.260 以上支持页面 onInit 生命周期，提前创建 vm 实例
    lifetimes.onInit = function onInit(query) {
        // 百度小程序后续可能移除 pageinstance 属性，为向后兼容进行补充
        if (!this.pageinstance || !this.pageinstance.setData) {
            const pages = getCurrentPages();
            this.pageinstance = pages[pages.length - 1];
        }
        // 处理百度小程序 onInit 生命周期调用 setData 无效的问题
        fixSetDataStart(this);
        oldAttached.call(this);
        this.pageinstance.$vm = this.$vm;
        this.$vm.$callHook('onInit', query);
    };
    lifetimes.attached = function attached() {
        if (!this.$vm) {
            oldAttached.call(this);
        }
        else {
            initMocks(this.$vm.$, this, mocks);
            fixSetDataEnd(this);
        }
        if (isPage(this) && this.$vm) {
            // 百度 onLoad 在 attached 之前触发（基础库小于 3.70）
            // 百度 当组件作为页面时 pageinstance 不是原来组件的 instance
            const pageInstance = this.pageinstance;
            pageInstance.$vm = this.$vm;
            if (hasOwn(pageInstance, '_$args')) {
                this.$vm.$callHook(ON_LOAD$1, pageInstance._$args);
                this.$vm.$callHook(ON_SHOW$1);
                delete pageInstance._$args;
            }
        }
        else {
            // 百度小程序组件不触发 methods 内的 onReady
            if (this.$vm) {
                nextSetDataTick(this, () => {
                    this.$vm.$callHook('mounted');
                });
            }
        }
    };
    if (newLifecycle) {
        methods.onReady = lifetimes.ready;
        delete lifetimes.ready;
    }
    componentOptions.messages = {
        __l: methods.__l,
    };
    delete methods.__l;
    // 百度小程序自定义组件，不支持绑定动态事件，故由 __e 分发
    methods.__e = handleEvent;
}

var parseComponentOptions = /*#__PURE__*/Object.freeze({
    __proto__: null,
    mocks: mocks,
    isPage: isPage,
    initRelation: initRelation,
    parse: parse$1,
    handleLink: handleLink,
    initLifetimes: initLifetimes
});

function parse(pageOptions) {
    parse$1(pageOptions);
    const methods = pageOptions.methods;
    // 纠正百度小程序生命周期methods:onShow在methods:onLoad之前触发的问题
    methods.onShow = function onShow() {
        if (this.$vm && this._$loaded) {
            this.$vm.$callHook(ON_SHOW$1);
        }
    };
    methods.onLoad = function onLoad(args) {
        // 百度 onLoad 在 attached 之前触发，先存储 args, 在 attached 里边触发 onLoad
        if (this.$vm) {
            this._$loaded = true;
            this.$vm.$callHook(ON_LOAD$1, args);
            this.$vm.$callHook(ON_SHOW$1);
        }
        else {
            this.pageinstance._$args = args;
        }
    };
}

var parsePageOptions = /*#__PURE__*/Object.freeze({
    __proto__: null,
    parse: parse,
    handleLink: handleLink,
    initLifetimes: initLifetimes,
    mocks: mocks,
    isPage: isPage,
    initRelation: initRelation
});

const createApp = initCreateApp(parseAppOptions);
const createPage = initCreatePage(parsePageOptions);
const createComponent = initCreateComponent(parseComponentOptions);
const createSubpackageApp = initCreateSubpackageApp(parseAppOptions);
swan.EventChannel = EventChannel$1;
swan.createApp = global.createApp = createApp;
swan.createPage = createPage;
swan.createComponent = createComponent;
swan.createSubpackageApp = createSubpackageApp;

export { createApp, createComponent, createPage, createSubpackageApp };
