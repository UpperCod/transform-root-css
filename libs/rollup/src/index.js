import { createFilter, dataToEsm } from "rollup-pluginutils";
import transform from "./transform";

function regExpExtension(ext) {
    return RegExp(ext.replace(/\./, "\\.") + "$", "g");
}

function fileName(path) {
    path = path.match(/[^\/\\]+$/g);
    return path ? path[0] : false;
}

export default function plugin(options = {}) {
    let filter = createFilter(options.include, options.exclude),
        extensions = []
            .concat(options.extensions || [".root.css"])
            .map(regExpExtension),
        parse = transform(options.plugins || []);
    return {
        name: "root-css",
        transform(input, id) {
            if (!filter(id)) return null;
            let file = fileName(id);
            if (file && extensions.some(regExp => regExp.test(file))) {
                let fns = parse(input);
                return {
                    code: `export default [${fns}];\n`,
                    map: { mappings: "" }
                };
            } else {
                return null;
            }
        }
    };
}
