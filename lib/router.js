'use string';

const Routes = require('./routes');
const Conf   = require('./support/configuration');

const Memory = new WeakMap();

module.exports = function router(info){

    // Update the current path with this module's configuration
    this.path = Conf.path;

    const get = ()=> Memory.get(this);

    this.set('router', null, { get });

    // Make sure the bundle path is present on the config
    if (!this.util.is(this.path.bundles)) throw this.error.type({
        name: 'feliz.path',
        type: 'String',
        data: this.path.bundles
    });

    // Determine if the router exists
    const router$ = this.observable
        .of(this.path.router)
        .switchMap(filename => {
            if (!this.util.is(filename).string()) throw this.error.type({
                name: `${info.name}#filename`,
                type: 'String',
                data: filename
            });
            return this.util.rx.path(filename)
                .isFile()
                .map(isFile => {
                    if (!isFile) throw this.error(`Could not find router on ${filename}`);
                    return {filename, routes:require(filename)};
                });
        });

    return router$
        // construct the routes array
        .mergeMap(Routes.bind(this))
        // Populate memory
        .do(router => Memory.set(this, router))
        // return the instance as expected
        .mapTo(this);
}
