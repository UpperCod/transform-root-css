# rollup-root-css

Transform using [**transform-root-css**] (https://github.com/uppercod/transform-root-css), the rules of a css document to template functions.

```js
import rootcss from "rollup-root-css";
import autoprefixer from "autoprefixer";

export default {
    input: "src/index.js",
    output: [{ file: "dist/bundle.js", format: "iife", sourcemap: true }],
    watch: {
        exclude: "node_modules/**"
    },
    plugins: [
        rootcss({
            extensions : [".root.css"], // default  [".root.css"]
            plugins : [autoprefixer] // default []
        })
    ]
};
```