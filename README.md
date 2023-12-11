# arcgis-calcite-template
Template for a ArcGIS JS 4 mapping web app using [calcite](https://developers.arcgis.com/calcite-design-system/) components

## Themes
In index.html set the Calcite stylesheet url to the preferred theme
```html
  <!--link rel="stylesheet" href="https://js.arcgis.com/4.22/@arcgis/core/assets/esri/themes/light/main.css" /-->
  <link rel="stylesheet" href="https://js.arcgis.com/4.22/@arcgis/core/assets/esri/themes/dark/main.css" />
```
And wrap application in a div
```html
  <div class="calcite-theme-dark"></div>
```

In main.css set the color scheme for dark themed browser controls e.g. scrollbars etc
```css
:root {
  color-scheme: dark; /* Dark style scrollbars etc.*/
}
```

