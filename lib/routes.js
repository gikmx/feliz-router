'use strict';

const PATH = require('path');

function rxValidator(info, routes){
}

module.exports = function(info, router){

    info = `${info.name}#routes`;
    const {methods} = this.conf.router;

    if (!this.util.is(router.routes).object())
        throw this.error.type({name:info, type:'Object', data:router.routes});

    // make sync validations
    const routes = Object.keys(router.routes).map(path => {
        const route = Object.assign({path}, router.routes[path]);

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
                name: `${info}.method`,
                type: `valid method (${avail.join(',')})`,
                data: method
            });
            const type = avail.shift().type;
            if (types.indexOf(type) === -1) types.push(type);
        });
        if (types.length > 1)
            throw this.error(`Methods of route ${route.name} must be the same type`);
        route.type = types[0];

        // Bundles
        if (!this.util.is(route.bundle).string())
            throw this.error.type({
                name: `${info.name}.bundle`,
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

        return route;
    });

    const route$ = this.observable
        .from(routes)
        .mergeMap(route => this.util.rx.path(route.bundle.path)
            .isDir()
            .map(isDir => {
                if (isDir) route.bundle.path = PATH.join(route.bundle.path, 'index');
                return route;
            })
        )
        .mergeMap(route => this.util.rx.path(route.bundle.path + this.path.ext)
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
                return route;
            })
        );

    const routes$ = route$.toArray();

    return routes$;
}
