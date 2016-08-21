'use strict';

const PATH = require('path');
const Routes = require('./routes');
const Conf = require('./support/configuration');

const Memory = new WeakMap();
const Name = 'plugins:router';

module.exports = function router() {

    // Inject router's configuration (and generate paths)
    this.conf = Conf;

    // return an instance of an object
    const router$ = this.observable.of(new (class Router extends Object{}));

    // Make sure the router file exists
    const filename$ = router$.switchMap(router => {
        const filename = this.path.router;
        return this.util.rx.path(filename)
            .isFile()
            .do(isFile => {
                if (!isFile)
                    throw this.error.type({ name:'router', type:'File', data:filename });
                Object.defineProperty(router, 'filename', {
                    enumerable : true,
                    value      : filename
                });
            })
            .mapTo(router)
            .do(router => this.debug(Name, 'filename', router))
    });

    const routes$ = filename$.switchMap(router => {
        let routes = require(router.filename);
        if (!this.util.is(routes).object())
            throw this.error.type({
                name: 'router.routes',
                type: 'Object',
                data: router.routes
            });
        // Avoid modifying the original routing reference by copying the object.
        routes = this.util.object({}).merge(routes);
        // define the getter and set the default value
        Object.defineProperty(router, 'routes', { get: getter.bind(this) });
        Memory.set(this, new Routes(this))
        // Resolve each route observable and return it.
        return this.observable
            .from(Object.keys(routes))
            .concatMap(path => router.routes.load(path, routes[path]))
            .toArray()
            .mapTo(router);
    });

    return routes$.mapTo(this);
}

function getter() {
    const routes = Memory.get(this);
    this.debug(Name, 'getter', routes);
    return routes;
}


