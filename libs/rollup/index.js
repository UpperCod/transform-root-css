'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var rollupPluginutils = require('rollup-pluginutils');
var transform = _interopDefault(require('transform-root-css'));

function plugin(options) {
    if ( options === void 0 ) options = {};

    var filter = rollupPluginutils.createFilter(options.include, options.exclude),
        extensions = RegExp(
            "(" +
                []
                    .concat(options.extensions || [".root.css"])
                    .map(function (ext) { return ext.replace(/\./g, "\\."); })
                    .join("|") +
                ")$"
        ),
        parse = transform(options.plugins || []);
    return {
        name: "root-css",
        transform: function transform$$1(input, id) {
            return new Promise(function (resolve, reject) {
                if (!filter(id)) { return resolve(null); }
                if (extensions.test(id)) {
                    parse(input)
                        .then(function (fns) { return ({
                            code: ("export default [" + fns + "];\n"),
                            map: { mappings: "" }
                        }); })
                        .then(resolve)
                        .catch(reject);
                } else {
                    resolve(null);
                }
            });
            // if (!filter(id)) return null;
            // if (extensions.test(id)) {
            //     let fns = parse(input);
            //     return {
            //         code: `export default [${fns}];\n`,
            //         map: { mappings: "" }
            //     };
            // } else {
            //     return null;
            // }
        }
    };
}

module.exports = plugin;
