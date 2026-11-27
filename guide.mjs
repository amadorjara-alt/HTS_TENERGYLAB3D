const descriptions = {
  planta: ['Planta 3D', 'Sigue el recorrido de la leche desde el tanque hasta el almacenamiento. Pulsa Iniciar simulación y elige un equipo para ver qué hace y a qué temperatura opera.'],
  simulador: ['Ajustar el proceso', 'Cambia el caudal, la temperatura o la recuperación y compara lo que ocurre. Puedes empezar con los valores iniciales del proyecto.'],
  laboratorio: ['Aprender con experimentos', 'Abre un ejercicio para probar una variable y ver su efecto. Empieza por el intercambiador si quieres entender de dónde sale el calor recuperado.'],
  graficos: ['Comparar resultados', 'La tabla compara la misma planta en dos configuraciones. Abre un gráfico si quieres ver de dónde vienen las diferencias de energía, costos o emisiones.'],
  auditoria: ['Verificar los cálculos', 'La auditoría comprueba que los balances del modelo cierren. El residuo es la diferencia entre dos formas de calcular lo mismo. Un valor cercano a cero indica que coinciden dentro de la tolerancia del programa.'],
  metodo: ['Fórmulas y fuentes', 'Consulta las ecuaciones, las unidades y los supuestos de los cálculos para reproducir un resultado.'],
};

const guideStyle = document.createElement('style');
guideStyle.textContent = `
  [hidden]{display:none!important}
  .top nav a{padding:.35rem .55rem;border-radius:6px}
  .top nav a[aria-current="location"]{background:#d8f3eb;color:#10312c;font-weight:750}
  main{max-width:1200px}
  .intro{padding:2.5rem 0 1rem}
  .intro h1{font-size:clamp(2rem,5vw,3.8rem)}
  .intro p:last-child{margin-bottom:0}
  .section-guide{max-width:73ch;line-height:1.55;color:var(--muted);margin:.45rem 0 1rem}
  .guide-tip{background:#eaf6f2;border-left:3px solid var(--teal);border-radius:6px;padding:.8rem 1rem;margin:0 0 1rem;line-height:1.5}
  .guide-tip summary{margin:0}
  .guide-tip[open] summary{margin-bottom:.45rem}
  .guide-tip p:last-child{margin-bottom:0}
  .guide-field{display:block;margin:0;color:var(--muted);font-size:.83rem;line-height:1.35;font-weight:400}
  .guide-next{margin:1.2rem 0 0;display:flex;gap:.7rem;align-items:center;flex-wrap:wrap}
  .guide-next a{padding:.5rem .75rem;border:1px solid #bdcfce;border-radius:7px;font-weight:700;text-decoration:none}
  .guide-group{padding:.75rem 1rem;border:1px solid var(--hair);border-radius:9px;margin:.7rem 0}
  .guide-group>summary{margin:0;cursor:pointer}
  .guide-group[open]>summary{margin-bottom:.75rem}
  .guide-group>article{border:0!important;padding:0!important}
  .guide-group>article>h3{display:none}
  .guide-results{margin-top:1rem;background:#f1f6f5;padding:1rem;border-radius:9px}
  .guide-results dl{display:grid;grid-template-columns:repeat(auto-fit,minmax(145px,1fr));gap:.75rem;margin:0}
  .guide-results dt{color:var(--muted);font-size:.85rem}
  .guide-results dd{margin:.22rem 0 0;font-weight:800;font-size:1.2rem}
  .guided-example{border:1px solid var(--hair);border-radius:9px;padding:.85rem 1rem;margin:1rem 0;background:#f8fcfb}
  .guided-example summary{margin:0}
  .guided-example[open] summary{margin-bottom:.7rem}
  .guided-example table td,.guided-example table th{white-space:normal}
  .guided-example .exercise-note{margin:.75rem 0;color:var(--muted);line-height:1.5}
  #laboratorio .charts,#graficos .charts{display:block}
  #graficos .charts canvas{max-height:270px}
  #results th{white-space:normal}
  .metric-help{display:block;margin-top:.3rem;line-height:1.35}
  @media(max-width:600px){.top nav{gap:.25rem}.top nav a{font-size:.83rem}.intro{padding:1.3rem 0 .75rem}.guide-group{padding:.65rem .75rem}}
  @media print{#graficos[hidden],#auditoria[hidden],#metodo[hidden]{display:block!important}.guide-next,.section-guide{display:none!important}}
`;
document.head.append(guideStyle);

const get = id => document.getElementById(id);
const nav = document.querySelector('.top nav');
const tabs = Object.keys(descriptions).map(get).filter(Boolean);
const intro = document.querySelector('.intro');
const metrics = get('metrics');
const home = 'planta';

function linkTo(id, text) {
  const link = document.createElement('a');
  link.href = '#' + id;
  link.textContent = text;
  return link;
}

function addInfo(container, text, where = 'beforeend') {
  if (!container) return;
  const p = document.createElement('p');
  p.className = 'section-guide';
  p.textContent = text;
  container.insertAdjacentElement(where, p);
}

function addTip(container, title, text, where = 'beforeend') {
  const details = document.createElement('details');
  details.className = 'guide-tip';
  const summary = document.createElement('summary');
  summary.textContent = title;
  details.append(summary);
  addInfo(details, text);
  container.insertAdjacentElement(where, details);
}

for (const section of tabs) {
  const [label,text] = descriptions[section.id];
  let link = nav.querySelector('a[href="#'+section.id+'"]');
  if (!link) {
    link = linkTo(section.id,label);
    nav.append(link);
  }
  link.textContent = label;
  const heading = section.querySelector('h2');
  heading.tabIndex = -1;
  addInfo(section.querySelector('.section-head') ?? heading, text, 'afterend');
}

function addNext(section, links) {
  if (!get(section)) return;
  const actions = document.createElement('div');
  actions.className = 'guide-next';
  for (const [id,text] of links) actions.append(linkTo(id,text));
  get(section).append(actions);
}
addNext('planta',[['simulador','Cambiar las condiciones']]);
addNext('simulador',[['graficos','Ver la comparación'],['planta','Ver el cambio en la planta']]);
addNext('laboratorio',[['simulador','Volver a los ajustes'],['metodo','Consultar las fórmulas']]);
addNext('graficos',[['simulador','Ajustar el escenario'],['auditoria','Comprobar los balances']]);

addTip(get('planta').querySelector('.toolbar'),'¿Qué pasa dentro del intercambiador?',
  'La leche que ya se calentó cede parte de su calor a la leche fría que entra. Las placas separan las dos corrientes. Con regeneración, el calentador y el enfriador necesitan aportar y retirar menos energía.', 'beforebegin');
addTip(get('simulador').querySelector('form'),'¿Qué modo elijo?',
  'Usa Efectividad objetivo si quieres saber de qué tamaño debe ser el intercambiador. Usa Área fija si ya conoces su tamaño y quieres estimar cuánto calor recuperaría en esas condiciones.', 'beforebegin');
addTip(get('auditoria') ?? get('metodo'),'¿Qué se verifica y qué requiere medir?',
  'El programa verifica la coherencia de las ecuaciones y compara el calor calculado por dos métodos. La inversión requiere una cotización y la retención real y la seguridad sanitaria deben verificarse en planta.', 'beforeend');

const balanceDiagrams = document.createElement('details');
balanceDiagrams.className = 'guide-group';
balanceDiagrams.innerHTML = '<summary>Diagramas clásicos de balance</summary>' +
  '<p>Los recuadros representan equipos. Las flechas numeradas muestran las corrientes y la flecha vertical del regenerador indica el calor transferido.</p>' +
  '<a href="./balances.svg"><img src="./balances.svg" alt="Balances de materia y energía del escenario base HTST" width="920" height="756" style="display:block;width:100%;height:auto"></a>' +
  '<p><a href="./balances.svg" download>Descargar los diagramas en SVG</a></p>';
balanceDiagrams.id = 'diagramas';
get('planta').append(balanceDiagrams);

const inputHelp = {
  flow:'Litros que ingresan cada hora. Más caudal reduce el tiempo que cada porción pasa en el tubo de retención.',
  inlet:'Temperatura de la leche al llegar al tanque.',
  hot:'Temperatura que se busca alcanzar con el calentador.',
  outlet:'Temperatura deseada antes del almacenamiento.',
  eff:'Porcentaje del calentamiento total que se desea cubrir con calor recuperado.',
  area:'Superficie disponible para que pase calor a través de las placas.',
  cp:'Energía para subir 1 °C la temperatura de un kilogramo de leche.',
  density:'Masa de leche por metro cúbico. Se usa para pasar de litros por hora a kilogramos por segundo.',
  u:'Facilidad con la que el calor atraviesa las placas limpias. Cuanto mayor sea U, más calor se puede transferir con la misma área.',
  volume:'Volumen de leche dentro del tubo. El simulador lo divide entre el caudal para estimar el tiempo de retención.',
  fouling:'Resistencia adicional causada por depósitos en las placas. Introduce cero para representar placas limpias.',
  pressure:'Caída de presión del recorrido convencional. Se usa para estimar la energía de la bomba.',
  extraPressure:'Caída de presión adicional al usar el regenerador. Aumenta el consumo de bombeo.',
  pumpEff:'Fracción de la electricidad de la bomba y el motor que se convierte en potencia hidráulica.',
  boiler:'Fracción de la energía del combustible que se convierte en calor útil.',
  cop:'Calor que el equipo extrae por cada unidad de electricidad consumida.',
  fridgeShare:'Parte de la carga de enfriamiento atendida con refrigeración mecánica.',
  hours:'Horas que la planta opera en un año. Se usan para estimar consumos y costos anuales.',
  gasPrice:'Precio por unidad de energía del gas en base a su poder calorífico inferior.',
  elecPrice:'Precio por unidad de electricidad comprada.',
  investment:'Costo adicional inicial para incorporar el sistema de regeneración.',
  maintenance:'Costo anual adicional de operación y mantenimiento del sistema de recuperación.',
  gasCO2:'Emisiones directas por cada kWh de gas comprado.',
  gridCO2:'Emisiones indirectas por kWh de la red. Usa un factor documentado para el lugar y periodo de estudio.',
  plateArea:'Área útil de una placa según el fabricante. Se divide el área total entre este valor.',
  experimentU:'Cambia solo U para ver cómo afecta el calor recuperado con un área de 12,78 m².',
  diameter:'Usa el diámetro por donde circula la leche. Un diámetro menor suele aumentar la velocidad y la caída de presión.',
  length:'Suma la longitud recta del tramo; sus accesorios se ingresan por separado.',
  roughness:'Describe qué tan irregular es la superficie interior del tubo.',
  viscosity:'Resistencia de la leche a fluir. El valor depende de la temperatura.',
  minor:'Suma los coeficientes de pérdida de los codos, válvulas y otros accesorios.',
  years:'Número de años para proyectar los ahorros del proyecto.',
  discount:'Tasa usada para convertir los ahorros futuros a su valor de hoy.',
  baseWater:'Consumo anual neto medido en la línea convencional.',
  regenWater:'Consumo anual neto medido en la línea con recuperación.',
  variation:'Porcentaje que se suma y resta a cada parámetro para comparar sus efectos por separado.',
};
for (const input of document.querySelectorAll('input[name]')) {
  const help = inputHelp[input.name];
  if (!help) continue;
  const note = document.createElement('small');
  note.id = 'ayuda-' + input.name;
  note.className = 'guide-field';
  note.textContent = help;
  input.after(note);
  input.setAttribute('aria-describedby',note.id);
}

const technical = document.createElement('details');
technical.className = 'guide-group';
const technicalLabel = document.createElement('summary');
technicalLabel.textContent = 'Propiedades de la leche y del equipo';
const technicalFields = document.createElement('div');
technicalFields.className = 'fields';
for (const name of ['cp','density','u','volume','fouling']) {
  const field = get('inputs').elements.namedItem(name);
  if (field) technicalFields.append(field.closest('label'));
}
technical.append(technicalLabel,technicalFields);
get('process-fields').after(technical);

const resultSummary = document.createElement('div');
resultSummary.className = 'guide-results';
resultSummary.innerHTML = '<h3>Resultado con recuperación de calor</h3><dl></dl>';
get('inputs').after(resultSummary);
const keyResults = [
  ['Calor recuperado (kW)','Potencia reutilizada','kW'],
  ['Calentamiento externo (kW)','Potencia que aporta el calentador','kW'],
  ['Área de regeneración (m²)','Superficie necesaria o instalada','m²'],
];
function updateResultSummary() {
  const list = resultSummary.querySelector('dl');
  if (get('csv').disabled) {
    list.textContent = 'Corrige los datos para actualizar los resultados.';
    return;
  }
  const values = new Map([...get('results').querySelectorAll('tbody tr')].map(row =>
    [row.cells[0].textContent,row.cells[2].textContent]));
  list.replaceChildren(...keyResults.map(([key,label,unit]) => {
    const item = document.createElement('div');
    const dt = document.createElement('dt');
    const dd = document.createElement('dd');
    dt.textContent = label;
    dd.textContent = values.has(key) ? values.get(key) + ' ' + unit : '—';
    item.append(dt,dd);
    return item;
  }));
}
updateResultSummary();
const resultObserver = new MutationObserver(updateResultSummary);
resultObserver.observe(get('results'),{childList:true});
resultObserver.observe(get('csv'),{attributes:true,attributeFilter:['disabled']});

const exercise = document.createElement('details');
exercise.className = 'guided-example';
exercise.innerHTML = `
  <summary>Práctica guiada · ¿qué cambia de 85 % a 90 %?</summary>
  <p>Piensa qué pasará con el aporte del calentador y el tamaño del intercambiador. Luego revela la comparación.</p>
  <button type="button" class="exercise-reveal" aria-expanded="false" aria-controls="exercise-answer">Revelar comparación</button>
  <div id="exercise-answer" hidden>
    <div class="table-scroll"><table>
      <thead><tr><th scope="col">Qué estamos comparando</th><th scope="col">85 %</th><th scope="col">90 %</th></tr></thead>
      <tbody></tbody>
    </table></div>
    <p class="exercise-note">Al recuperar más calor, el calentador aporta menos. La diferencia de temperatura entre las corrientes también se reduce, por lo que se necesita más superficie de placas para transferir ese calor.</p>
    <p class="exercise-note">La tabla usa el caudal, las temperaturas y las propiedades actuales. Los dos casos calculan el área necesaria para alcanzar su porcentaje objetivo.</p>
    <button type="button" class="exercise-apply">Aplicar 90 % al simulador</button>
    <span class="exercise-status" role="status"></span>
  </div>`;
get('simulador').querySelector('.guide-tip').after(exercise);
const answer = get('exercise-answer');
const reveal = exercise.querySelector('.exercise-reveal');
const apply = exercise.querySelector('.exercise-apply');
const exerciseStatus = exercise.querySelector('.exercise-status');
const practiceRows = [
  ['Precalentamiento (°C)','Temperatura antes del calentador','°C'],
  ['Recuperación (kW)','Calor transferido entre las dos corrientes','kW'],
  ['Calentamiento externo (kW)','Potencia que todavía aporta el calentador','kW'],
  ['Área (m²)','Superficie de placas necesaria','m²'],
];
function updateExercise() {
  const body = exercise.querySelector('tbody');
  body.replaceChildren();
  apply.disabled = get('csv').disabled;
  if (apply.disabled) {
    exerciseStatus.textContent = ' Corrige los datos para comparar.';
    return;
  }
  const rows = new Map([...get('scenarios').querySelectorAll('tbody tr')].map(row =>
    [row.cells[0].textContent,row.cells]));
  for (const [key,label,unit] of practiceRows) {
    const cells = rows.get(key);
    if (!cells) continue;
    const row = body.insertRow();
    const name = document.createElement('th');
    name.scope = 'row';
    name.textContent = label;
    row.append(name);
    for (const index of [2,3]) row.insertCell().textContent = cells[index].textContent + ' ' + unit;
  }
  const preset = get('presets').querySelector('[data-eff="90"]');
  exerciseStatus.textContent = preset?.getAttribute('aria-pressed') === 'true' ? ' Escenario del 90 % activo.' : '';
}
reveal.addEventListener('click', () => {
  answer.hidden = !answer.hidden;
  reveal.setAttribute('aria-expanded',String(!answer.hidden));
  reveal.textContent = answer.hidden ? 'Revelar comparación' : 'Ocultar comparación';
  if (!answer.hidden) updateExercise();
});
apply.addEventListener('click', () => get('presets').querySelector('[data-eff="90"]').click());
const exerciseObserver = new MutationObserver(() => { if (!answer.hidden) updateExercise(); });
exerciseObserver.observe(get('scenarios'),{childList:true});
exerciseObserver.observe(get('csv'),{attributes:true,attributeFilter:['disabled']});

const explanations = {
  'Estados de operación':'Distingue producción normal, retorno por desvío y demostraciones de preparación o limpieza.',
  'Intercambiador · DMLT y NTU':'UA indica cuánto calor puede transferir el intercambiador por cada grado de diferencia. La DMLT resume la diferencia de temperatura entre ambas corrientes. NTU compara esa capacidad de transferencia con la capacidad de la leche para transportar calor.',
  'Economía a largo plazo':'El VAN resta la inversión a los ahorros futuros expresados en dinero de hoy. La TIR es la tasa de descuento que hace que el VAN sea cero.',
  'Cargas térmicas':'Compara cuánto calor debe aportar el calentador y cuánto debe retirar el enfriador. Los kW expresan potencia durante la operación.',
  'Energía anual comprada':'Muestra el gas y la electricidad adquiridos durante un año. Los kWh son el consumo acumulado, que depende de las horas de operación.',
  'Balance económico anual':'El ahorro neto suma el ahorro de gas y electricidad y resta el mantenimiento adicional.',
  'Emisiones operativas':'Compara las emisiones de operación de ambas líneas. Si ingresas un factor de la red, el cálculo incluye las emisiones indirectas de la electricidad.',
  'Sensibilidad de diseño · 80 %, 85 % y 90 %':'Compara cuánta energía se recupera y qué superficie de placas se necesita en cada escenario.',
};
for (const id of ['laboratorio','graficos']) {
  const section = get(id);
  if (!section) continue;
  const charts = section.querySelector('.charts');
  for (const card of [...charts.children]) {
    const heading = card.querySelector('h3');
    const title = heading.textContent;
    const group = document.createElement('details');
    group.className = 'guide-group';
    const summary = document.createElement('summary');
    summary.textContent = title;
    card.before(group);
    group.append(summary,card);
    if (explanations[title]) addInfo(card,explanations[title],'afterbegin');
    if (id === 'laboratorio' && title.startsWith('Experimento · transferencia')) group.open = true;
  }
  if (id === 'graficos') {
    const table = get('results').closest('.table-scroll');
    const heading = table.previousElementSibling;
    charts.before(heading,table);
    addTip(heading,'¿Cómo leo la tabla?',
      'Calor recuperado es la energía térmica que pasa entre las dos corrientes. Ahorro neto es el dinero que queda después del mantenimiento adicional. Retorno simple indica cuántos meses tomaría recuperar la inversión con ese ahorro.', 'afterend');
  }
}

const metricNotes = ['Volumen de leche por hora','Parte del calor que se reutiliza','Potencia térmica reutilizada','Superficie estimada de las placas'];
function addMetricNotes() {
  metrics.querySelectorAll('article').forEach((card,index) => {
    if (card.querySelector('.metric-help') || !metricNotes[index]) return;
    const note = document.createElement('small');
    note.className = 'metric-help';
    note.textContent = metricNotes[index];
    card.append(note);
  });
}
addMetricNotes();
new MutationObserver(addMetricNotes).observe(metrics,{childList:true});

let previous;
function showSection() {
  const target = location.hash.slice(1);
  const current = tabs.some(section => section.id === target) ? target : home;
  for (const section of tabs) section.hidden = section.id !== current;
  for (const link of nav.querySelectorAll('a')) {
    if (link.hash === '#' + current) link.setAttribute('aria-current','location');
    else link.removeAttribute('aria-current');
  }
  intro.hidden = metrics.hidden = current !== home;
  if (previous !== undefined) {
    get(current).querySelector('h2').focus({preventScroll:true});
    window.scrollTo(0,0);
  }
  previous = current;
}
showSection();
window.addEventListener('hashchange',showSection);
