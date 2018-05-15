import buble from "rollup-plugin-buble";
export default {
    input: "src/index.js",
    output: [
        { file: "dist/csj.js", format: "cjs", sourcemap: true },
        { file: "dist/es.js", format: "es", sourcemap: true }
    ],
    sourceMap: false,
    external: ["postcss"],
    plugins: [
        buble({
            objectAssign: "Object.assign"
        })
    ]
};
