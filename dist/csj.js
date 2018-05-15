'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var postcss = _interopDefault(require('postcss'));

var config = {
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
            replace: function replace(context, take) {
                return (
                    "${" +
                    take.replace(/[^\s\t\n]+/g, function (use) {
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
            function (pattern) { return pattern.find.test(selector) && pattern.scape; }
        )
    ) {
        return selector;
    } else {
        var and = selector.match(/^\&([\s\t\n]*)(.+)/);
        selector = and ? and[2] : " " + selector;
        return deep ? selector : "." + config.varRoot + selector;
    }
}

function setProp(props, ref) {
    var index = ref[0];
    var value = ref[1];

    props[index] = index in props ? [].concat(props[index], value) : value;
    return props;
}

function translator(nodes, atrule, deep) {
    if ( atrule === void 0 ) atrule = [];
    if ( deep === void 0 ) deep = 0;

    var rules = nodes
        .map(function (node) {
            switch (node.type) {
                case "rule":
                    var selectors = node.selector
                        .split(",")
                        .map(function (selector) { return prepareSelector(selector, deep); });
                    var props = {};
                    var childs = [];
                    translator(node.nodes, atrule, deep + 1).forEach(function (value) {
                        if (Array.isArray(value)) {
                            setProp(props, value);
                        } else {
                            childs.push(value);
                        }
                    });
                    return {
                        selectors: selectors,
                        childs: childs,
                        props: props
                    };
                case "decl":
                    return [node.prop, node.value];
                case "atrule":
                    var group;
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
        .filter(function (value) { return value; });

    return deep ? rules : { rules: rules, atrule: atrule };
}

function createReplace(patterns, string) {
    return patterns.reduce(
        function (string, pattern) { return string.replace(pattern.find, pattern.replace); },
        string
    );
}

function createProps(props) {
    var str = "";
    var loop = function ( prop ) {
        [].concat(props[prop]).forEach(function (value) {
            str += prop + ":" + createReplace(config.patternsProp, value) + ";";
        });
    };

    for (var prop in props) loop( prop );
    return str;
}

function templateRule(selector, props) {
    return selector + "{" + props + "}";
}

function createSelector(selector) {
    return createReplace(config.patternsSelector, selector);
}

function templateRules(childs, rules, parent) {
    if ( rules === void 0 ) rules = [];
    if ( parent === void 0 ) parent = "";

    childs.forEach(function (rule) { return rule.selectors.forEach(function (selector) {
            var before = selector.indexOf(config.varRoot) === 0 ? "." : "";
            selector = before + createSelector(parent + selector);

            templateRules(rule.childs, rules, selector);
            var props = createProps(rule.props);
            if (props) {
                rules.push(templateRule(selector, props));
            }
        }); }
    );
    return rules;
}

function templateAlrule(atrule, rules, prefix) {
    if ( prefix === void 0 ) prefix = "@";

    atrule.forEach(function (rule) {
        if (/media/.test(rule.selector)) {
            rules.push(
                templateRule(
                    prefix + rule.selector + " " + rule.params,
                    templateRules(rule.childs.rules).join("")
                )
            );
        } else if (/supports|document/.test(rule.selector)) ; else if (/keyframes/.test(rule.selector)) {
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
                            function (props, add) { return setProp(props, add); },
                            {}
                        )
                    )
                )
            );
        }
    });
    return rules;
}

function transform(plugins) {
    var instance = postcss(plugins);
    return function parse(input) {
        var root = instance.process(input, { parser: postcss.parse }).root,
            result = translator(root.nodes);

        return templateAlrule(
            result.atrule,
            templateRules(result.rules).reverse()
        ).map(
            function (rule) { return "function(root){ return typeof root == 'object' ?`" +
                quoteScape(rule) +
                "`: ''}"; }
        );
    };
}

module.exports = transform;
//# sourceMappingURL=csj.js.map
