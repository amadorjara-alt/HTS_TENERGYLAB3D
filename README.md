# Planta virtual de pasteurización HTST

Proyecto final de Operaciones y Procesos Unitarios. Simulador académico del proceso, dimensionamiento térmico del regenerador de placas y comparación económica y ambiental con una línea convencional.

## Ejecutar en local

Sirve esta carpeta por HTTP. Por ejemplo, con Python ejecuta `python -m http.server 8000` y abre `http://localhost:8000`. El modelo 3D requiere WebGL y las bibliotecas Three.js y Chart.js se cargan desde un CDN. El recorrido, las fichas y las tablas funcionan aunque estas bibliotecas no se carguen.

## GitHub Pages

En **Settings → Pages**, elige **Deploy from a branch**, rama **main** y carpeta **/(root)**.

## Modelo académico

La configuración inicial emplea 5 000 L/h, 4 °C a la entrada, 72 °C de consigna y 85 % de efectividad. Las propiedades y los parámetros económicos, hidráulicos y ambientales son editables. La sección Metodología contiene las fórmulas, supuestos y bibliografía.

La geometría 3D se construye con Three.js. El recorrido animado es una demostración educativa y la retención calculada es nominal.
