import { calculate } from './model.mjs';

const by = id => document.getElementById(id);
const form = by('inputs');
const format = (n, digits = 2) => n == null ? '—' : n.toLocaleString('es-PE', { maximumFractionDigits: digits });
const temp = n => format(n, 1) + ' °C';
const fields = [
  ['flow','Caudal de leche (L/h)',5000,1],
  ['inlet','Temperatura de entrada (°C)',4,0,60],
  ['hot','Temperatura HTST (°C)',72,1,100],
  ['outlet','Temperatura final (°C)',4,0,60],
  ['eff','Efectividad objetivo (%)',85,0,99.9],
  ['area','Área instalada (m²)',12.78,.01],
  ['cp','Calor específico (kJ/kg·K)',3.94,.01],
  ['density','Densidad (kg/m³)',1030,1],
  ['u','Coeficiente U (W/m²·K)',2500,1],
  ['volume','Volumen de retención (L)',20.833333333333332,.01],
  ['pressure','Caída de presión base (kPa)',0,0],
  ['extraPressure','Caída adicional (kPa)',100,0],
  ['pumpEff','Rendimiento conjunto bomba y motor (%)',54,1,100],
  ['boiler','Rendimiento térmico (%)',85,1,100],
  ['cop','COP de refrigeración',3.5,.01],
  ['fridgeShare','Fracción con refrigeración mecánica (%)',50,0,100],
  ['hours','Horas de operación (h/año)',4800,0,8760],
  ['gasPrice','Tarifa de gas (S/ por kWh PCI)',.1,0],
  ['elecPrice','Tarifa eléctrica (S/ por kWh)',.55,0],
  ['investment','Inversión incremental (S/)',122000,0],
  ['maintenance','Mantenimiento incremental (S/ al año)',10000,0],
  ['gasCO2','Factor gas (kg CO₂/kWh PCI)',.20196,0],
  ['gridCO2','Factor eléctrico (kg CO₂/kWh)',0,0],
];
for (const [index, [key, label, value, min, max]] of fields.entries()) {
  by(index < 10 ? 'process-fields' : 'utility-fields').insertAdjacentHTML('beforeend',
    '<label>' + label + '<input required type="number" step="any" name="' + key +
    '" min="' + min + '" value="' + value + '"' + (max == null ? '' : ' max="' + max + '"') + '></label>');
}
const field = key => form.elements.namedItem(key);
const equipment = [
  ['tank','Tanque de equilibrio','Alimenta la línea y recibe el producto desviado.'],
  ['pump','Bomba','Impulsa la leche a través de la línea.'],
  ['regen','Regenerador de placas','Las placas separan las corrientes y transfieren calor en contracorriente.'],
  ['heater','Calentador','Aporta la carga térmica externa para alcanzar la consigna HTST.'],
  ['hold','Tubo de retención','Mantiene la leche a temperatura durante el tiempo nominal calculado.'],
  ['valve','Válvula de desvío','Envía el producto al tanque si la temperatura o la residencia nominal quedan por debajo del criterio del modelo.'],
  ['cooler','Enfriador final','Retira el calor restante antes del almacenamiento.'],
  ['storage','Almacenamiento','Recibe el producto de la ruta normal.'],
];
by('equipment').innerHTML = equipment.map(([key,name]) => '<option value="' + key + '">' + name + '</option>').join('');
let p, r, scene, rows, scenarios;
let running = false;
let forced = false;
let exploded = false;
const base = () => by('config').value === 'base';
const diversion = () => forced || r.diverted;
const select = key => {
  by('equipment').value = key;
  renderEquipment();
};

function renderEquipment() {
  const key = by('equipment').value;
  const [,name,description] = equipment.find(item => item[0] === key);
  const nominal = diversion() ? ' (nominal)' : '';
  const points = {
    tank: [['Salida',temp(p.inlet)]],
    pump: [['Potencia eléctrica',format(r.pump + (base() ? 0 : r.extraPump)) + ' kW']],
    regen: base() ? [['Configuración','En bypass']] : [['Lado frío',temp(p.inlet) + ' → ' + temp(r.preheat)],['Lado caliente' + nominal,temp(p.hot) + ' → ' + temp(r.warm)],['Recuperación nominal',format(r.recovered) + ' kW'],['Área efectiva',format(r.area) + ' m²'],['Coeficiente U',format(p.u) + ' W/m²·K']],
    heater: [['Entrada nominal',temp(base() ? p.inlet : r.preheat)],['Salida',temp(p.hot)],['Potencia térmica nominal',format(base() ? r.total : r.heat) + ' kW']],
    hold: [['Temperatura',temp(p.hot)],['Residencia nominal',format(r.retention) + ' s']],
    valve: [['Temperatura',temp(p.hot)],['Destino',diversion() ? 'Retorno al tanque' : 'Enfriamiento y almacenamiento']],
    cooler: [['Entrada' + nominal,temp(base() ? p.hot : r.warm)],['Salida' + nominal,temp(base() ? p.outlet : Math.min(r.warm,p.outlet))],['Carga térmica nominal',format(base() ? r.baselineCooling : r.cooling) + ' kW']],
    storage: [['Temperatura nominal',temp(base() ? p.outlet : Math.min(r.warm,p.outlet))],['Ruta',diversion() ? 'Sin alimentación' : 'Habilitada']],
  };
  const bypassed = base() && key === 'regen';
  const downstream = key === 'cooler' || key === 'storage';
  const flow = bypassed || (downstream && diversion()) ? 0 : p.flow;
  const values = [['Caudal de la ruta',format(flow) + ' L/h'], ...points[key]];
  by('equipment-data').innerHTML = '<h3>' + name + '</h3><p>' + description + '</p><dl>' +
    values.map(([a,b]) => '<dt>' + a + '</dt><dd>' + b + '</dd>').join('') + '</dl>';
}

function renderPlant() {
  const conventional = base();
  const diverted = diversion();
  const points = [
    ['tank','Tanque',p.inlet],['pump','Bomba',p.inlet],
    ...(!conventional ? [['regen','Regenerador frío',r.preheat]] : []),
    ['heater','Calentador',p.hot],['hold','Retención',p.hot],['valve','Desvío',p.hot],
    ...(!conventional ? [['regen','Regenerador caliente',r.warm]] : []),
    ['cooler','Enfriador',conventional ? p.outlet : Math.min(p.outlet,r.warm)],
    ['storage','Almacenamiento',conventional ? p.outlet : Math.min(p.outlet,r.warm)],
  ];
  by('route').innerHTML = points.map(([key,name,t],index) => (index ? '<span aria-hidden="true">→</span>' : '') +
    '<button type="button" data-equipment="' + key + '">' + name + ' · ' + temp(t) + '</button>').join('') +
    '<p class="return">Válvula de desvío → tubería de retorno → tanque de equilibrio</p>';
  by('run').textContent = running ? 'Pausar simulación' : 'Iniciar simulación';
  by('divert').setAttribute('aria-pressed', forced);
  by('divert').textContent = forced ? 'Liberar desvío manual' : 'Forzar desvío';
  by('explode').disabled = !scene || conventional;
  by('explode').setAttribute('aria-pressed', exploded);
  by('explode').textContent = exploded ? 'Cerrar placas' : 'Separar placas';
  const gate = diverted ? (forced ? 'Desvío manual al tanque.' : 'Desvío automático por temperatura o retención insuficiente.') : 'Ruta habilitada hacia almacenamiento.';
  by('process-status').textContent = (running ? 'En marcha. ' : 'En pausa. ') + gate;
  by('metrics').innerHTML = [
    ['Capacidad de proceso',format(p.flow),'L/h'],
    ['Regeneración',format(conventional ? 0 : 100 * r.effectiveness,1),'%'],
    ['Calor recuperado',format(conventional ? 0 : r.recovered),'kW nominales'],
    ['Área de intercambio',format(conventional ? 0 : r.area),'m² de regeneración'],
  ].map(([label,n,unit]) => '<article><small>' + label + '</small><b>' + n + '</b><small>' + unit + '</small></article>').join('');
  renderEquipment();
  scene?.update({ running, conventional, diverted, exploded, points, flow:p.flow });
}

function table(id, headers, data) {
  by(id).innerHTML = '<thead><tr>' + headers.map(h => '<th scope="col">' + h + '</th>').join('') +
    '</tr></thead><tbody>' + data.map(([label,...values]) => '<tr><th scope="row">' + label + '</th>' +
      values.map(v => '<td>' + format(v) + '</td>').join('') + '</tr>').join('') + '</tbody>';
}

const charts = {};
function chart(id, labels, series, scales) {
  if (!window.Chart) return;
  const colors = ['#526d81','#087b6b','#bd445c'];
  const datasets = series.map(([label,data,yAxisID], i) => ({ label, data, backgroundColor:colors[i], yAxisID, borderRadius:4 }));
  if (charts[id]) {
    charts[id].data = { labels, datasets };
    charts[id].update('none');
    return;
  }
  charts[id] = new window.Chart(by(id), { type:'bar',data:{ labels,datasets },options:{
    responsive:true, animation:false, scales, plugins:{legend:{position:'bottom',display:series.length > 1}}
  }});
}

function renderAnalysis() {
  const c = r.conventional;
  const g = r.regeneration;
  const cases = [80,85,90].map(eff => calculate({ ...p, mode:'design',eff }));
  rows = [
    ['Caudal másico (kg/s)',r.mass,r.mass],['Residencia nominal (s)',r.retention,r.retention],
    ['Carga térmica total de la leche (kW)',r.total,r.total],['Precalentamiento (°C)',p.inlet,r.preheat],
    ['Salida antes del enfriador (°C)',p.hot,r.warm],['Calor recuperado (kW)',0,r.recovered],
    ['Calentamiento externo (kW)',r.total,r.heat],['Enfriamiento restante (kW)',r.baselineCooling,r.cooling],
    ['Área de regeneración (m²)',0,r.area],['Bombeo eléctrico (kW)',r.pump,r.pump+r.extraPump],
    ['Gas comprado (kWh/año)',c.gas,g.gas],['Electricidad comprada (kWh/año)',c.electric,g.electric],
    ['Ahorro neto incremental (S/ al año)',null,r.net],['ROI anual simple (%)',null,r.roi],
    ['Retorno simple (meses)',null,r.payback == null ? null : r.payback*12],['Emisiones (t CO₂/año)',c.emissions,g.emissions],
    ['CO₂ evitado (t/año)',null,r.avoided],
  ];
  scenarios = [
    ['Precalentamiento (°C)',...cases.map(a => a.preheat)],['Salida del lado caliente (°C)',...cases.map(a => a.warm)],
    ['Recuperación (kW)',...cases.map(a => a.recovered)],['Calentamiento externo (kW)',...cases.map(a => a.heat)],
    ['Área (m²)',...cases.map(a => a.area)],['Ahorro neto (S/ al año)',...cases.map(a => a.net)],
  ];
  table('results',['Indicador','Convencional','Con regeneración'],rows);
  table('scenarios',['Indicador','80 %','85 %','90 %'],scenarios);
  const compare = (a,b) => [['Convencional',a],['Con regeneración',b]];
  chart('loads',['Calentamiento (kW)','Enfriamiento (kW)'],compare([r.total,r.baselineCooling],[r.heat,r.cooling]));
  chart('energy',['Gas (kWh/año)','Electricidad (kWh/año)'],compare([c.gas,c.electric],[g.gas,g.electric]));
  chart('savings',['Gas','Electricidad','Mantenimiento','Ahorro neto'],[['S/ al año',[r.gasSaving,r.electricSaving,-p.maintenance,r.net]]]);
  chart('emissions',['Emisiones (t CO₂/año)'],compare([c.emissions],[g.emissions]));
  chart('sensitivity',['80 %','85 %','90 %'],[
    ['Recuperación (kW)',cases.map(a => a.recovered),'y'],['Área (m²)',cases.map(a => a.area),'area'],
    ['Ahorro neto (miles de S/ al año)',cases.map(a => a.net/1000),'savings']
  ],{ y:{beginAtZero:true},area:{position:'right',beginAtZero:true,grid:{drawOnChartArea:false}},savings:{position:'right',beginAtZero:true,grid:{drawOnChartArea:false}} });
  by('estimate-note').textContent = [
    'Estimaciones para régimen nominal y tarifas editables. El mantenimiento y la inversión se mantienen constantes en la sensibilidad.',
    p.gridCO2 === 0 ? 'El escenario inicial contabiliza CO₂ directo de gas. Introduce un factor de red documentado para incluir emisiones indirectas.' : '',
    r.needsReheat ? 'El lado caliente sale por debajo de la temperatura final solicitada. El modelo deja el enfriador sin carga y no incluye recalentamiento.' : '',
    !window.Chart ? 'La biblioteca de gráficos no se cargó. Las tablas conservan los valores de la comparación.' : '',
  ].filter(Boolean).join(' ');
}

function refresh() {
  const mode = field('mode').value;
  field('eff').disabled = mode === 'area';
  field('area').disabled = mode === 'design';
  for (const button of by('presets').children) button.setAttribute('aria-pressed', mode === 'design' && Number(button.dataset.eff) === field('eff').valueAsNumber);
  const next = Object.fromEntries(fields.map(([key]) => [key,field(key).valueAsNumber]));
  next.mode = mode;
  const valid = [...form.elements].every(input => input.validity.valid);
  const temperatureOK = next.hot > Math.max(next.inlet,next.outlet);
  by('error').textContent = !valid ? 'Revisa los valores y límites del formulario.' : !temperatureOK ? 'La temperatura HTST debe superar las temperaturas de entrada y salida.' : '';
  if (!valid || !temperatureOK) {
    by('csv').disabled = true;
    return;
  }
  by('csv').disabled = false;
  p = next;
  r = calculate(p);
  renderPlant();
  renderAnalysis();
}
for (const eff of [80,85,90]) {
  const button = document.createElement('button');
  button.type = 'button';
  button.dataset.eff = eff;
  button.textContent = eff + ' %';
  button.onclick = () => { field('mode').value = 'design'; field('eff').value = eff; refresh(); };
  by('presets').append(button);
}
form.addEventListener('input',refresh);
form.addEventListener('submit',event => { event.preventDefault(); refresh(); });
by('equipment').onchange = renderEquipment;
by('route').onclick = event => { if (event.target.dataset.equipment) select(event.target.dataset.equipment); };
by('config').onchange = () => { exploded = false; renderPlant(); };
by('run').onclick = () => { running = !running; renderPlant(); };
by('divert').onclick = () => { forced = !forced; renderPlant(); };
by('camera').onclick = () => scene.home();
by('explode').onclick = () => { exploded = !exploded; if (exploded) select('regen'); renderPlant(); };
by('reset').onclick = () => {
  form.reset();
  running = forced = exploded = false;
  by('config').value = 'regen';
  by('equipment').value = 'tank';
  scene?.home();
  refresh();
};
by('csv').onclick = () => {
  const data = [['Parámetro','Valor'],...fields.filter(([key]) => !field(key).disabled).map(([key,label]) => [label,p[key]]),['Modo',p.mode],
    [],['Indicador','Convencional','Con regeneración'],...rows,[],['Indicador','80 %','85 %','90 %'],...scenarios];
  const quote = value => '"' + String(value ?? '').replaceAll('"','""') + '"';
  const url = URL.createObjectURL(new Blob(['\uFEFF',data.map(row => row.map(quote).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'}));
  const a = document.createElement('a');
  a.href = url;
  a.download = 'resultados-htst.csv';
  a.click();
  setTimeout(() => URL.revokeObjectURL(url),1000);
};
refresh();
import('./plant.mjs').then(({ createPlant }) => {
  scene = createPlant(by('viewport'),select);
  by('camera').disabled = false;
  by('scene-status').textContent = 'Arrastra para girar · rueda o pellizca para acercar · pulsa un equipo';
  renderPlant();
}).catch(error => {
  console.error(error);
  by('scene-status').textContent = 'La vista 3D requiere WebGL y acceso a Three.js. Explora la planta con el recorrido y las fichas.';
});
