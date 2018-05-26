# transform-root-css

It is created as a utility to be used within bundler tools, such as [** rollup **] (http://rollupjs.org).

| support |state|
|---------|------|
| [rollup](https://github.com/UpperCod/transform-root-css/tree/master/libs/rollup) |✔️|
| parceljs | 👷 |
| webpack | 👷 |

The purpose is simple to transform the css into template functions, for example:

#### Input CSS.
```css
:root{
  color : black;
}
```
#### Output
```js
[function(root){
  return typeof root == "object" : `${root.cn}{color:black;}` : "";
}]
```

## Instance

```js
import transform from "transform-root-css";
import autoprefixer from "autoprefixer";

transform([autoprefixer])(`
   :root{
       display : flex;
   }
`).then((rules)=>{
   console.log(rules)
})
```

**transform-root-css**, transforms all css rules into template functions grouped in an array.

ready to use in the client with little overload.

## Postcss

transform-root-css uses **postcss** to walk the style for the first time, then group the rules generates some changes based on ** pseudo-class ** useful.

## pseudo-clase

### :root

Points to the root of the style, this means that root for the purposes of the template function will be replaced by `${root.cn}`, this is because `root.cn` must be the name of the prinsipal class.

### :root[state]

if root is accompanied by a state selector, it will be replaced by `${root.cn}[${root.px}state]`.

### :global

`:global` evita que se anteponga :root como contexto por defecto

### `root(property)`

`:global` prevents it from being prefixed `:root` as the default context

```css
:root{
  animation : root(cn)-zoom 1s ease alternate;
}
@keyframes :root-zoom{
  0%{
      transform : scale(1)
  }
  100%{
      transform : scale(1.5)
  }
}
```

> In this way the keyframes will have a unique identifier as an animation and through `root(cn)` you can access that identifier.


```css
:root{
  color : root(color);
}
```
