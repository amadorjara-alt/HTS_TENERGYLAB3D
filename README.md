# HTST EnergyLab 3D

Laboratorio virtual de pasteurización de leche para el proyecto final de **Operaciones y Procesos Unitarios** de la UPCH. Permite dimensionar un intercambiador de placas y comparar una línea convencional con una línea con recuperación de calor.

**[Abrir el simulador en GitHub Pages](https://amadorjara-alt.github.io/HTS_TENERGYLAB_3D/)**

## Guía de uso

1. En **Planta**, pulsa **Iniciar simulación**. Arrastra para girar la maqueta y usa la rueda o el gesto de pellizcar para acercarte.
2. Selecciona un equipo en la maqueta o en **Inspeccionar equipo** para ver sus datos. En **Con regeneración**, pulsa **Separar placas** para explorar los canales. Usa **Forzar desvío** para observar el retorno al tanque.
3. En **Simulador**, ajusta el caudal, las temperaturas y las propiedades de la leche. Usa **Efectividad objetivo** para calcular el área necesaria o **Área fija** para calcular la efectividad alcanzable. Los resultados se actualizan al editar.
4. En **Laboratorio OPU**, modifica el coeficiente U con área fija. Compara DMLT con NTU y explora el ensuciamiento, la hidráulica y la refrigeración.
5. En **Análisis**, compara energía, costos y emisiones. Usa **Exportar CSV** en el simulador o **Descargar auditoría JSON** en **Auditoría** para guardar resultados y parámetros.

## Ejemplo para la sustentación

1. Pulsa **Reiniciar**. El caso base parte de **5 000 L/h**, leche a **4 °C**, consigna de **72 °C** y regeneración del **85 %**.
2. Selecciona **90 %** en el simulador y compara los resultados.

| Indicador | 85 % | 90 % |
| --- | ---: | ---: |
| Temperatura después del precalentamiento | 61,8 °C | 65,2 °C |
| Calor recuperado | 325,78 kW | 344,95 kW |
| Calentamiento externo restante | 57,49 kW | 38,33 kW |
| Área estimada del regenerador | 12,78 m² | 20,29 m² |

3. Reinicia, elige **Área fija**, cambia el caudal a **6 000 L/h** e inicia la simulación. La residencia nominal baja a **12,5 s** y se activa el desvío automático al tanque.


## Alcance del modelo

Los balances se calculan en régimen estacionario. El arranque, la animación del flujo y la limpieza CIP son demostraciones educativas. La retención calculada es nominal y requiere validación sanitaria en planta. Consulta el [anexo técnico](ANEXO.md) para revisar las ecuaciones, los supuestos y las fuentes.
