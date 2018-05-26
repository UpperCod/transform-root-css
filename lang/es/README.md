# transform-root-css

Se crea como utilidad para usarse dentro de herramientas de bundler, como [**rollup**](http://rollupjs.org).

| soporte |estado|
|---------|------|
| [rollup](https://github.com/UpperCod/transform-root-css/tree/master/libs/rollup) |✔️|
| parceljs | 👷 |
| webpack | 👷 |

La finalidad es simple transformar el css en funciones de plantilla, por ejemplo :

#### Css de entrada.
```css
:root{
  color : black;
}
```
#### function de salida
```js
[function(root){
  return typeof root == "object" : `${root.cn}{color:black;}` : "";
}]
```
> Su estilo siempre será  dinámico e inmutable.

## Instancia

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

**transform-root-css**, transforma todas las reglas del css en funciones de plantilla agrupadas en un arreglo.

listas para usar en el cliente con poca sobrecarga.

## Postcss

transform-root-css  utiliza **postcss** para parsear por primera vez el estilo, luego agrupa las reglas genera algunos cambios a base de **pseudo-clase** útiles.

## pseudo-clase

### :root

apunta a la raíz del estilo, esto quiere decir que root para efectos de la funcion template sera remplazado por `${root.cn}`, esto es porque  `root.id` debe ser el nombre de la clase prinsipal.

### :root[state]

si root se acompaña de un selector de estado, sera remplazado por `${root.cn}[${root.px}state]`.

### :global

:global evita que se anteponga :root como contexto por defecto

### `root(property)`

su uso sólo es posible dentro de la definición de propiedades y permite obtener atributos de root

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
> De esta forma el keyframes poseera un identificador único como animación y mediante `root(cn)` ud puede acceder a ese identificador.

** root también acepta expresiones **

```css
:root{
  color : root(color);
}
```
> root pude contener más de una propiedad por lo que ud puede acceder a ellas desde usando root(property)