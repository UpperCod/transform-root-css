import buble from "rollup-plugin-buble";
export default {
    input: "src/index.js",
    output: [{ file: "index.js", format: "cjs", sourcemap: true }],
    sourceMap: false,
    external: ["postcss"],
    plugins: [
        buble({
            objectAssign: "Object.assign"
        })
    ]
};
