'use strict';

const PATH = require('path');

const Memory = new WeakMap();
const Name = 'plugins:router';

module.exports = class Routes extends Array {

    constructor(feliz){
        super();
        Memory.set(this, feliz);
        feliz.debug(Name, 'routes:constructor');
    }

    load(route){
        const feliz = Memory.get(this);
        route = validator.call(feliz, route);
        const route$ = resolver.call(feliz, route).do(route => {
            this.push(route);
            feliz.debug(Name, 'routes:load', route);
            feliz.events.emit(`${Name}:routes`, this);
        });
        return route$;
    }
}

function resolver(route){ return this.observable
    .of(route)
    .mergeMap(route => this.util.rx
        .path(route.bundle.path)
        .isDir()
        .map(isDir => {
            if (isDir) route.bundle.path = PATH.join(route.bundle.path, 'index');
            return route;
        })
    )
    .mergeMap(route => this.util.rx
        .path(route.bundle.path + this.path.ext)
        .isFile()
        .map(isFile => {
            const {path, name} = route.bundle;
            if (!isFile) throw this.error(`Invalid bundle: ${name} (${path})`);
            const data = require(path);
            if (!this.util.is(data).function())
                throw this.error.type({
                    name: `${info}.bundle:${name}`,
                    type: 'function',
                    data: data
                });
            route.bundle.data = data;
            this.debug(Name, 'routes:resolver', route);
            return route;
        })
    );
}

function validator(route){
    const methods = this.conf.router.methods;
    // Path
    if (!this.util.is(route.path).string())
        throw this.error.type({
            name: `${Name}:route.path`,
            type: 'String',
            data: route.path
        });
    // Methods
    if (!route.method) route.method = [methods[0].name];
    const is = this.util.is(route.method);
    if (!is.string() && !is.array())
        throw this.error.type({
            name : `${Name}:route.method`,
            type : 'String or Array',
            data : route.method
        });
    if (is.string()) route.method = [route.method];
    if (!route.method.length)
        throw this.error.type({
            name : `${Name}:route.method`,
            type : 'Non empty Array',
            data : route.method
        });
    const types = [];
    route.method.forEach(method => {
        const avail = methods.filter(m => m.name === method);
        if (!avail.length) throw this.error.type({
            name : `${Name}:route.method`,
            type : `valid method (${avail.join(',')})`,
            data : method
        });
        const type = avail.shift().type;
        if (types.indexOf(type) === -1) types.push(type);
    });
    if (types.length > 1)
        throw this.error.type({
            name: `${Name}:route.method(type)`,
            type: 'same type',
            data: types
        });
    route.type = types[0];
    // Bundles
    if (!this.util.is(route.bundle).string())
        throw this.error.type({
            name: `${Name}:route.bundle`,
            type: 'String',
            data: route.bundle
        });
    route.bundle = {
        name: route.bundle,
        path: PATH.join(
            this.path.bundles,
            route.bundle.replace(/\//g, PATH.sep)
        )
    };
    this.debug(Name, 'routes:validator', route);
    return route;
}
