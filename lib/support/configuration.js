'use strict';

/**
 * The default configuration options.
 * @module Configuration
 * @type object
 */
module.exports = {

    router: {
        /**
         * The methods allowed for the router
         */
        methods: [
            { type: 'http'   , name:'GET'      },
            { type: 'http'   , name:'POST'     },
            { type: 'http'   , name:'PUT'      },
            { type: 'http'   , name:'DELETE'   },
            { type: 'http'   , name:'HEAD'     }
        ]
    },

    /**
     * Enable the bundle path
     * @type object
     * @kind __required__ property
     */
    path: {
        router : { type:'join', args:['${root}', 'routes${ext}'] },
        bundles: { type:'join', args:['${root}', 'bundles'] }
    }
}
