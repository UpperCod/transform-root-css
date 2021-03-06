import { createFilter, dataToEsm } from "rollup-pluginutils";
import transform from "transform-root-css";

function regExpExtension(ext) {
    return RegExp(ext.replace(/\./, "\\.") + "$", "g");
}

export default function plugin(options = {}) {
    let filter = createFilter(options.include, options.exclude),
        extensions = RegExp(
            "(" +
                []
                    .concat(options.extensions || [".root.css"])
                    .map(ext => ext.replace(/\./g, "\\."))
                    .join("|") +
                ")$"
        ),
        parse = transform(options.plugins || []);
    return {
        name: "root-css",
        transform(input, id) {
            return new Promise((resolve, reject) => {
                if (!filter(id)) return resolve(null);
                if (extensions.test(id)) {
                    parse(input)
                        .then(fns => ({
                            code: `export default [${fns}];\n`,
                            map: { mappings: "" }
                        }))
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
