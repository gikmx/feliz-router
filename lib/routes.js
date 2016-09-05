'use strict';

const PATH = require('path');
const Memory = new WeakMap();

module.exports = {loader, getter};

function getter(self){
    // There's no reason for the user to directly modify the routes
    // so, always return a copy of the original array.
    const routes = Memory.get(this).map(route => Object.assign({}, route));
    this.debug(self.path, 'getter:routes', routes);
    return routes;
}

function loader(self, route){

    // Validate route properties
    route = validator.call(this, self, route);
    const info = `${self.path}:${route.bundle.name}`;
    this.debug(info, 'init', route);

    // get the currently loaded routes
    const routes = Memory.get(this) || [];

    // Check if route bundle actually exists and require it
    const bundle$ = this.observable
        .of(route)
        .switchMap(route => this.util.rx
            .path(route.bundle.path)
            .isDir()
            .map(isDir => {
                if (isDir) route.bundle.path = PATH.join(route.bundle.path, 'index');
                return route;
            }))
        .switchMap(route => this.util.rx
            .path(route.bundle.path + this.path.ext)
            .isFile()
            .map(isFile => {
                const {path, name} = route.bundle;
                if (!isFile) throw this.error(`Invalid bundle: ${name} (${path})`);
                // File exist, load the handler.
                const data = require(path);
                if (!this.util.is(data).function())
                    throw this.error.type({
                        name: `${info}.bundle:${name}`,
                        type: 'function',
                        data: data
                    });
                route.bundle.data = data;
                // make the bundle available on routes
                Memory.set(this, routes.concat(route))
                this.debug(info, 'load', route);
                return route;
            }));

    // returns the route with parsed bundle
    return bundle$;
}

function validator(self, route){
    const info = `${self.path}:route`;
    const methods = this.conf[self.name].methods;
    // Path
    if (!this.util.is(route.path).string())
        throw this.error.type({
            info: `${info}.path`,
            type: 'String',
            data: route.path
        });
    // Methods
    if (!route.method) route.method = [methods[0].name];
    const is = this.util.is(route.method);
    if (!is.string() && !is.array())
        throw this.error.type({
            name : `${info}.method`,
            type : 'String or Array',
            data : route.method
        });
    if (is.string()) route.method = [route.method];
    if (!route.method.length)
        throw this.error.type({
            name : `${info}.method`,
            type : 'Non empty Array',
            data : route.method
        });
    const types = [];
    route.method.forEach(method => {
        const avail = methods.filter(m => m.name === method);
        if (!avail.length) throw this.error.type({
            name : `${info}.method`,
            type : `valid method (${avail.join(',')})`,
            data : method
        });
        const type = avail.shift().type;
        if (types.indexOf(type) === -1) types.push(type);
    });
    if (types.length > 1)
        throw this.error.type({
            name: `${info}.method(type)`,
            type: 'same type',
            data: types
        });
    route.type = types[0];
    // Bundles
    if (!this.util.is(route.bundle).string())
        throw this.error.type({
            name: `${info}.bundle`,
            type: 'String',
            data: route.bundle
        });
    route.bundle = {
        name: route.bundle,
        path: PATH.join(this.path.bundles, route.bundle.replace(/\//g, PATH.sep))
    };
    return route;
}
