'use strict';

const PATH   = require('path');
const Routes = require('./routes');
const Conf   = require('./support/conf');

const Memory = new WeakMap();

class Router extends Object {}

module.exports = function(self){

    // Make sure the configuration set here won't override the one defined by the user
    let conf = Conf.call(this, self);
    if (!this.conf[self.name]) this.conf = conf;
    else this.conf = this.util.object(conf).merge({ [self.name]: this.conf[self.name] });
    conf = this.conf[self.name];

    // Create the instance and make it available via getter.
    const router = new Router();
    Memory.set(this, router);
    this.set(self.name, null, { get: getter.bind(this, self) });

    // define a public loader for bundles
    Object.defineProperty(router, 'load', {
        enumerable: true,
        value: Routes.loader.bind(this, self)
    });

    // load the routes from the router file
    const route$ = this.observable
        .of(this.path.router)
        // make sure it exists
        .switchMap(path => this.util.rx.path(path)
            .isFile()
            .map(isFile => {
                if (!isFile){
                    const base = path.replace(this.path.root + PATH.sep, '');
                    throw this.error(`${self.path}: router not found (${base})`);
                }
                return path;
            }))
        // process the router-file and return a stream of routes
        .switchMap(path => {
            const data = require(path);
            if (!this.util.is(data).object())
                throw this.error.type({name:`${self.path}:routes`, type:'Object', data});
            // define the properties
            Object.defineProperty(router, 'filename', { enumerable:true, value:path });
            Object.defineProperty(router, 'data'    , { value: data });
            Object.defineProperty(router, 'routes'  , {
                enumerable: true,
                get: Routes.getter.bind(this, self)
            });
            // Convert routes into an iterable stream
            const routes = Object
                .keys(router.data)
                .map(path => Object.assign({path}, router.data[path]));
            this.events.emit(`${self.path}:routes~before`, routes);
            return this.observable.from(routes);
        })
        // at this point each call is a route object, load it and concat them.
        .concatMap(route => router.load(route))
        // wait until all routes completed and make them accessible via getter
        .toArray()
        .do(routes => {
            this.events.emit(`${self.path}:routes`, routes);
            this.events.on('plugins:server:start~before', e => onServer.call(this, self));
        });
    return route$.mapTo(this);
}

// Allow the use of a dash in the function name
Object.defineProperty(module.exports, 'name', { value: 'server:router' })

function getter(self) {
    const router = Memory.get(this);
    this.debug(self.path, 'getter:router', router);
    return router;
}

// When the server is ready, register all defined routes.
function onServer(self){ this[self.name].routes
    .filter(route => route.type === 'http')
    .forEach(route => {
        // Remove non-hapi properties from route.
        const bundle = route.bundle;
        const name   = `routes:${bundle.name}`;
        delete route.bundle;
        delete route.type;
        return
        // Create a closure for each route so events can be sent automatically
        route.handler = (request, reply) => {
            const self = this.util
                .object({ bundle: { name:bundle.name, filename:bundle.path }})
                .merge(route);
            this.events.emit(`${self.path}:${name}`, self);
            this.debug(self.path, name, 'load', self);
            bundle.data.call(this, request, reply, self);
        }
        this.events.emit(`${self.path}:${name}~before`, route);
        this.debug(self.path, name, 'init');
        // register the route
        this.server.route(route);
    });
}

