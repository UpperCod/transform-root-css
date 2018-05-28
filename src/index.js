import postcss from "postcss";

let config = {
    varRoot: ":root",
    quoteScape: /([\\]*)(\`)/g,
    patternsSelector: [
        {
            find: /([\s]){0,}(\&)([\s]){0,}/g,
            replace: "",
            scape: false
        },
        {
            /**
             * It allows to add a prefix to the state to the selector by attribute
             * @example: root [checked] =>. $ {root.cn} [$ {root.st} checked]
             */
            find: /\:root((?:\[([^\]]+)\]){1,}){1}/g,
            replace(content, attrs) {
                return ":root" + attrs.replace(/\[/g, "[${root.px}");
            }
        },
        {
            /**
             * will replace the selector :root
             * @example :root => ${root.cn}
             */
            find: /\:root/g,
            replace: ".${root.cn}",
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
            /**
             * Allows you to use the properties of root as template variables
             * @example color : root(primary) => color : ${root.primary}
             */
            find: /(?:root)\(([^\)\(]+)\)/g,
            replace(context, take) {
                take = take.match(/([\w\d]+)/);
                take = (take && take[1]) || "";
                take = /^\d/.test(take) ? "" : take;
                return take ? `\${root.${take}}` : "";
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
    if (
        config.patternsSelector.some(
            pattern => pattern.find.test(selector) && pattern.scape
        )
    ) {
        return selector;
    } else {
        return deep ? selector : config.varRoot + " " + selector;
    }
}

function setProp(props, [index, value]) {
    props[index] = index in props ? [].concat(props[index], value) : value;
    return props;
}

function translator(nodes, atrule = [], deep = 0) {
    let rules = (nodes || [])
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
    return clearSpace(createReplace(config.patternsSelector, selector));
}

function templateRules(childs, rules = [], parent = "") {
    childs.forEach(rule =>
        rule.selectors.forEach(selector => {
            selector = parent + " " + selector;
            let nextSelector = createSelector(selector);
            templateRules(rule.childs, rules, selector);
            let props = createProps(rule.props);
            if (props) {
                rules.push(templateRule(nextSelector, props));
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
            if (/import/.test(rule.selector)) {
                rules.unshift(prefix + rule.selector + " " + rule.params);
            } else {
                rules.push(
                    templateRule(
                        prefix +
                            rule.selector +
                            " " +
                            createSelector(rule.params),
                        createProps(
                            rule.childs.reduce(
                                (props, add) => setProp(props, add),
                                {}
                            )
                        )
                    )
                );
            }
        }
    });
    return rules;
}

export default function transform(plugins) {
    let instance = postcss(plugins);
    return function parse(input) {
        return instance
            .process(input, { parser: postcss.parse })
            .then(({ root }) => translator(root.nodes))
            .then(result =>
                templateAlrule(
                    result.atrule,
                    templateRules(result.rules).reverse()
                )
            )
            .then(rules =>
                rules.map(
                    rule => "function(root){ return `" + quoteScape(rule) + "`}"
                )
            );
    };
}
