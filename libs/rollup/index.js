'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var rollupPluginutils = require('rollup-pluginutils');
var transform = _interopDefault(require('transform-root-css'));

function regExpExtension(ext) {
    return RegExp(ext.replace(/\./, "\\.") + "$", "g");
}

function fileName(path) {
    path = path.match(/[^\/\\]+$/g);
    return path ? path[0] : false;
}

function plugin(options) {
    if ( options === void 0 ) options = {};

    var filter = rollupPluginutils.createFilter(options.include, options.exclude),
        extensions = []
            .concat(options.extensions || [".root.css"])
            .map(regExpExtension),
        parse = transform(options.plugins || []);
    return {
        name: "root-css",
        transform: function transform$$1(input, id) {
            if (!filter(id)) { return null; }
            var file = fileName(id);
            if (file && extensions.some(function (regExp) { return regExp.test(file); })) {
                var fns = parse(input);
                return {
                    code: ("export default [" + fns + "];\n"),
                    map: { mappings: "" }
                };
            } else {
                return null;
            }
        }
    };
}

module.exports = plugin;
