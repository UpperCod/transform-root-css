import postcss from "postcss";

let config = {
    varRoot: ":root",
    quoteScape: /([\\]*)(\`)/g,
    patternsSelector: [
        {
            find: /((?:\:root|\$\{root\.id\})\[)/g,
            replace: "$1${root.state}"
        },
        {
            find: /\:root/g,
            replace: "${root.id}",
            scape: true
        },
        {
            find: /\:global/g,
            replace: "",
            scape: true
        }
    ],
    patternsProp: [
        {
            find: /@var\(([^\)\(]+)\)/g,
            replace(context, take) {
                return (
                    "${" +
                    take.replace(/[^\s\t\n]+/g, use => {
                        if (/^[\"\'\?\:\|\&\<\=\!\d\+\*\-]+/.test(use)) {
                            return use;
                        } else {
                            return "root." + use;
                        }
                    }) +
                    "}"
                );
            }
        }
    ]
};

function clearSpace(selector) {
    return selector.replace(/([\n\s\t]+)/g, " ").replace(/^\s+|\s+$/g, "");
}

function quoteScape(string) {
    return string.replace(config.quoteScape, "\\`");
}

function prepareSelector(selector, deep) {
    selector = clearSpace(selector);
    if (
        config.patternsSelector.some(
            pattern => pattern.find.test(selector) && pattern.scape
        )
    ) {
        return selector;
    } else {
        let and = selector.match(/^\&([\s\t\n]*)(.+)/);
        selector = and ? and[2] : " " + selector;
        return deep ? selector : "." + config.varRoot + selector;
    }
}

function setProp(props, [index, value]) {
    props[index] = index in props ? [].concat(props[index], value) : value;
    return props;
}

function translator(nodes, atrule = [], deep = 0) {
    let rules = nodes
        .map(node => {
            switch (node.type) {
                case "rule":
                    let selectors = node.selector
                        .split(",")
                        .map(selector => prepareSelector(selector, deep));
                    let props = {};
                    let childs = [];
                    translator(node.nodes, atrule, deep + 1).forEach(value => {
                        if (Array.isArray(value)) {
                            setProp(props, value);
                        } else {
                            childs.push(value);
                        }
                    });
                    return {
                        selectors,
                        childs,
                        props
                    };
                case "decl":
                    return [node.prop, node.value];
                case "atrule":
                    let group;
                    if (/keyframes/.test(node.name)) {
                        group = translator(node.nodes, atrule, true);
                    } else if (/supports|document/.test(node.name)) {
                        group = translator(node.nodes, [], false);
                    } else if (/media/.test(node.name)) {
                        group = translator(node.nodes, atrule, false);
                    } else {
                        group = translator(node.nodes, atrule, true);
                    }
                    atrule.push({
                        selector: node.name,
                        params: node.params,
                        childs: group
                    });
                    break;
            }
        })
        .filter(value => value);

    return deep ? rules : { rules, atrule };
}

function createReplace(patterns, string) {
    return patterns.reduce(
        (string, pattern) => string.replace(pattern.find, pattern.replace),
        string
    );
}

function createProps(props) {
    let str = "";
    for (let prop in props) {
        [].concat(props[prop]).forEach(value => {
            str += prop + ":" + createReplace(config.patternsProp, value) + ";";
        });
    }
    return str;
}

function templateRule(selector, props) {
    return selector + "{" + props + "}";
}

function createSelector(selector) {
    return createReplace(config.patternsSelector, selector);
}

function templateRules(childs, rules = [], parent = "") {
    childs.forEach(rule =>
        rule.selectors.forEach(selector => {
            let before = selector.indexOf(config.varRoot) === 0 ? "." : "";
            selector = before + createSelector(parent + selector);

            templateRules(rule.childs, rules, selector);
            let props = createProps(rule.props);
            if (props) {
                rules.push(templateRule(selector, props));
            }
        })
    );
    return rules;
}

function templateAlrule(atrule, rules, prefix = "@") {
    atrule.forEach(rule => {
        if (/media/.test(rule.selector)) {
            rules.push(
                templateRule(
                    prefix + rule.selector + " " + rule.params,
                    templateRules(rule.childs.rules).join("")
                )
            );
        } else if (/supports|document/.test(rule.selector)) {
            // space to create algorithm for support and document
        } else if (/keyframes/.test(rule.selector)) {
            rules.push(
                templateRule(
                    prefix + rule.selector + " " + createSelector(rule.params),
                    templateRules(rule.childs).join("")
                )
            );
        } else {
            rules.push(
                templateRule(
                    prefix + rule.selector + " " + createSelector(rule.params),
                    createProps(
                        rule.childs.reduce(
                            (props, add) => setProp(props, add),
                            {}
                        )
                    )
                )
            );
        }
    });
    return rules;
}

export default function transform(plugins) {
    let instance = postcss(plugins);
    return function parse(input) {
        let root = instance.process(input, { parser: postcss.parse }).root,
            result = translator(root.nodes);

        return templateAlrule(
            result.atrule,
            templateRules(result.rules).reverse()
        ).map(
            rule =>
                "function(root){ return typeof root == 'object' ?`" +
                quoteScape(rule) +
                "`: ''}"
        );
    };
}
