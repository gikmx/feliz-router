'use string';

const Routes = require('./routes');
const Conf   = require('./support/configuration');

const Memory = new WeakMap();

module.exports = function router(info){

    // Regiter the router configuration where it belongs.
    this.conf = Conf;

    // Make sure the bundle path is present on the config
    if (!this.util.is(this.path.bundles)) throw this.error.type({
        name: 'feliz.path',
        type: 'String',
        data: this.path.bundles
    });

    this.set('router', null, { get:getter.bind(this) });

    const filename$ = this.observable.of(this.path.router);

    const routerFile$ = filename$
        .switchMap(filename => this.util.rx.path(filename)
            .isFile()
            .map(isFile => ({filename, isFile}))
        )
        .do(router => {
            this.debug(`${info.name}.filename`, router);
            if (router.isFile) return;
            throw this.error(`Could not find router on ${filename}`);
        })
        .map(router => Object.assign({routes:require(router.filename)}, router));

    const router$ = routerFile$
        .switchMap(router => {
            const routes$ = Routes.call(this, info, router);
            return routes$.map(routes => {
                router.routes = routes;
                delete router.isFile;
                return router;
            })
        })
        .do(router => Memory.set(this, router))

    return router$.mapTo(this);
}

function getter(){
    const value = Memory.get(this);
    this.debug(`${info.name}.get`, value);
    return value;
}

