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
    plugins: [
        buble({
            objectAssign: "Object.assign"
        })
    ]
};
