import buble from "rollup-plugin-buble";
export default {
    input: "src/index.js",
    output: [
        {
            file: "index.js",
            format: "cjs"
        }
    ],
    sourceMap: false,
    external: ["postcss"],
    watch: {
        chokidar: {},
        exclude: ["node_modules/**"]
    },
    plugins: [
        buble({
            objectAssign: "Object.assign"
        })
    ]
};
