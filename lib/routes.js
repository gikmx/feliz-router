'use strict';

const PATH = require('path');

module.exports = function(router){

    if (!this.util.is(router.routes).object()) throw this.error.type({
        name: `${info.name}#routes`,
        type: 'Object',
        data: router.routes
    });

    const route$ = this.observable
        .from(Object.keys(router.routes))
        .map(path => Object.assign({path}, router.routes[path]));

    // Make sure the method sent is valid
    const method$ = route$.map(route => {
        let {methods} = this.conf.router;
        const type = this.util.is(route.method);
        if (!type.string() && !type.array()) route.method = [methods[0].name];
        if (type.string()) route.method = [route.method];
        if (!route.method.length) throw instance.error.type({
            name: 'route.method',
            type: 'Array of method(s)',
            data: 'empty array'
        });
        const types = [];
        route.method.forEach(method => {
            methods = methods.filter(m => m.name === method);
            if (!methods.length) throw this.error.type({
                name: 'route.method',
                type: `valid method (${methods.join(',')})`,
                data: method
            });
            const type = methods.shift().type;
            if (types.indexOf(type) === -1) types.push(type);
        });
        if (types.length > 1)
            throw this.error(`Methods of route ${route.name} must be the same type`);
        route.type = types[0];
        return route;
    });

    // make sure each routes has a bundle defined.
    const bundlePath$ = route$.map(route => {
        if (!this.util.is(route.bundle).string()) throw this.error.type({
            name: `${info.name}#route.bundle`,
            type: 'String',
            data: route.bundle
        });
        route.bundle = { name: route.bundle };
        const path = route.bundle.name.replace(/\//g, PATH.sep);
        route.bundle.path = PATH.join(this.path.bundles, path);
        return route;
    });

    // make sure each bundle exists and is a function.
    const bundleData$ = bundlePath$.mergeMap(route => this.util.rx
        .path(route.bundle.path)
        .isDir()
        .map(isDir => {
            if (isDir) return PATH.join(route.bundle.path, 'index');
            return route.bundle.path;
        })
        .mergeMap(path => {
            route.bundle.path = [path, this.path.ext].join('');
            return this.util.rx.path(route.bundle.path).isFile();
        })
        .map(isFile => {
            if (!isFile) throw this.error(`Invalid bundle: ${route.bundle.name}`);
            const data = require(route.bundle.path);
            if (!this.util.is(data).function()) throw this.error.type({
                name: `${info.name}#route.bundle:${route.bundle.name}`,
                type: 'function',
                data: data
            });
            route.bundle.data = data;
            return route;
        })
    );

    return this.observable
        .combineLatest(
            method$,
            bundleData$,
            (method, bundle) => this.util.object(method).merge(bundle)
        )
        .toArray()
        .do(routes => router.routes = routes)
        .mapTo(router);
}
