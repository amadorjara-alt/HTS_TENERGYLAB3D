# Anexo técnico · HTST EnergyLab 3D

El laboratorio acompaña el informe «Equipo 4 – Proyecto Final». La maqueta, los balances, la comparación y la auditoría toman los resultados del motor JavaScript. La vida útil, la tasa de descuento y la geometría del tramo circular son supuestos del laboratorio y se pueden editar.

## Datos de referencia y comprobación

| Parámetro o resultado | Escenario académico |
|---|---:|
| Caudal | 5 000 L/h |
| Entrada / consigna / almacenamiento | 4 / 72 / 4 °C |
| Efectividad objetivo | 85 % |
| Recuperación térmica | 325,78 kW |
| Calentamiento y enfriamiento externos | 57,49 kW por servicio |
| Área equivalente de placas | 12,78 m² |
| DMLT ideal | 10,20 K |
| Bombeo eléctrico incremental | 0,257 kW |
| Ahorro operativo neto | S/ 296 160/año |
| Retorno simple | 4,94 meses |
| CO₂ directo evitado | 371,55 t/año |

El retorno, el costo y las emisiones usan los supuestos del informe. El software permite incorporar un factor eléctrico documentado y consumos netos medidos de agua. El gráfico de presión–entalpía es conceptual y la simulación sanitaria es lógica. La maqueta y las estimaciones no sustituyen cotizaciones, curvas del fabricante ni validación en planta.

## Trazabilidad de operaciones unitarias

| Fundamento | Módulo | Comprobación |
|---|---|---|
| Conservación de masa | Motor y auditoría | El caudal másico corresponde a densidad por caudal volumétrico |
| Calor sensible | Motor y planta | La recuperación coincide con la pérdida del lado caliente y la ganancia del lado frío |
| DMLT y NTU–efectividad | Laboratorio térmico | UA × DMLT produce el mismo calor que ε × C × diferencia de entrada |
| Resistencia térmica | Ensuciamiento | A área fija, añadir resistencia reduce U y el calor recuperado |
| Flujo interno | Laboratorio hidráulico | Darcy–Weisbach y ΣK para un tramo circular. La presión en placas debe verificarse con datos de fabricante |
| Refrigeración | Laboratorio y evaluación | Carga mecánica dividida por COP |
| Combustión | Evaluación | Calor útil dividido por rendimiento, con combustible expresado en PCI |

Vincula las diapositivas del curso con esta tabla cuando dispongas de sus referencias. En el simulador, la auditoría exporta fecha, versión, variables, resultados, pruebas y fuentes.

## Reproducir

1. Abre la plataforma y pulsa **Reiniciar**.
2. Selecciona **90 %**. El área pasa a 20,29 m² y el precalentamiento a 65,2 °C.
3. Vuelve a **85 %**, cambia a **Área fija** e introduce 6 000 L/h. La retención nominal baja a 12,5 s y se activa el desvío automático.
4. En el laboratorio, reduce U y observa el descenso de la efectividad con área fija.
5. Descarga la auditoría JSON para conservar los datos del escenario.
6. Ejecuta `node --test engineering.test.mjs` para verificar el caso base, la equivalencia DMLT–NTU, el desvío, el tramo hidráulico y el flujo de caja.

## Fuentes

- Tetra Pak, [Heat exchangers](https://dairyprocessinghandbook.tetrapak.com/chapter/heat-exchangers).
- Tetra Pak, [Designing a process line](https://dairyprocessinghandbook.tetrapak.com/chapter/designing-process-line).
- Avila-Sierra et al., [Molecular understanding of fouling induction and removal](https://pmc.ncbi.nlm.nih.gov/articles/PMC8397245/).
- IPCC, [Stationary combustion, Tabla 2.3](https://www.ipcc-nggip.iges.or.jp/public/2006gl/pdf/2_Volume2/V2_2_Ch2_Stationary_Combustion.pdf).
