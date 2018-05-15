# rollup-root-css

Transforma mediante [**transform-root-css**](https://github.com/uppercod/transform-root-css), las reglas de un documento css a funciones de plantilla.

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