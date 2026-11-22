import { calculate } from './model.mjs';
import { audit, exchanger, financial, MODEL_VERSION, pipeLoss, sensitivity } from './engineering.mjs';

const number = n => n == null ? '—' : new Intl.NumberFormat('es-PE',{
  maximumFractionDigits:2
}).format(n);
const sources = [
  ['Intercambio térmico y DMLT','https://dairyprocessinghandbook.tetrapak.com/chapter/heat-exchangers'],
  ['Línea HTST y retención','https://dairyprocessinghandbook.tetrapak.com/chapter/designing-process-line'],
  ['Ensuciamiento por depósitos de leche','https://pmc.ncbi.nlm.nih.gov/articles/PMC8397245/'],
  ['Consumo y recuperación de energía en lácteos','https://eta-publications.lbl.gov/publications/energy-efficiency-improvement-and'],
  ['Factor de combustión de gas natural','https://www.ipcc-nggip.iges.or.jp/public/2006gl/pdf/2_Volume2/V2_2_Ch2_Stationary_Combustion.pdf'],
];

const input = (key,label,value,min,max,step='any') =>
  '<label>' + label + '<input name="' + key + '" type="number" value="' + value +
  '" min="' + min + '" max="' + max + '" step="' + step + '"></label>';

function entries(items) {
  return '<dl class="lab-values">' + items.map(([name,value,unit='']) =>
    '<div><dt>' + name + '</dt><dd>' + (typeof value === 'string' ? value : number(value)) + ' ' + unit + '</dd></div>').join('') + '</dl>';
}

export function mountLab({setInputs,refresh}) {
  const charts = document.getElementById('graficos');
  charts.insertAdjacentHTML('beforebegin',`
    <section id="laboratorio" class="panel lab">
      <p class="eyebrow">UNIVERSIDAD PERUANA CAYETANO HEREDIA</p>
      <h2>Laboratorio OPU</h2>
      <div class="charts">
        <article id="operacion" class="wide"><h3>Estados de operación</h3>
          <div class="actions"><button type="button" data-stage="Preparación">Preparación</button><button type="button" data-stage="Arranque">Demostrar arranque</button><button type="button" data-stage="Calentamiento">Demostrar calentamiento</button><button type="button" data-stage="CIP">Demostrar CIP</button><button type="button" data-stage="Parada">Parada</button></div>
          <p id="lab-operation" role="status"></p>
          <p class="muted">El arranque y el calentamiento transitorio se explican como secuencias educativas. Los balances numéricos usan régimen estacionario.</p>
        </article>
        <article class="wide"><h3>Intercambiador · DMLT y NTU</h3>
          <div class="lab-split"><div><div id="lab-exchanger"></div>
          <div class="fields">${input('plateArea','Área útil por placa (m²)',0,0,20)}</div>
          <p class="muted">Un valor positivo estima las placas activas por área útil. La disposición, los pasos y las placas extremas se verifican con el fabricante.</p></div>
          <div><div class="lab-plot"><canvas id="lab-profile" role="img" aria-label="Perfil ideal de temperaturas en contracorriente"></canvas></div><p class="muted">La coordenada avanza con la corriente fría. La corriente caliente recorre el equipo en sentido contrario.</p></div></div>
          <details><summary>Componentes del intercambiador</summary><label for="lab-part">Selecciona una pieza</label> <select id="lab-part">
          <option value="frame">Bastidor</option><option value="plates">Placas corrugadas</option><option value="gaskets">Juntas</option><option value="ports">Conexiones</option><option value="bolts">Pernos</option><option value="channels">Canales</option>
          </select><p id="lab-part-data"></p></details>
        </article>
        <article><h3>Experimento · transferencia de calor</h3>
          <p>Modifica U con 12,78 m² de área fija y los datos base del caso académico.</p>
          <div class="fields">${input('experimentU','U limpio (kW/m²·K)',2.5,.2,10,.01)}</div>
          <div id="lab-experiment"></div>
          <p class="muted">A igual área, bajar U reduce NTU, efectividad y precalentamiento. NTU = UA/C.</p>
          <div class="actions"><button type="button" id="lab-apply-heat">Aplicar a la planta</button><button type="button" id="lab-reset-heat">Restablecer</button></div>
        </article>
        <article><h3>Experimento · ensuciamiento</h3><p>Compara el intercambiador limpio y con la resistencia adicional ingresada en el simulador. Ambos usan la misma área.</p><div id="lab-fouling"></div>
          <p class="muted">La resistencia térmica modifica U. Evalúa la pérdida de presión por separado usando mediciones o datos de geometría.</p></article>
        <article><h3>Hidráulica · tramo circular</h3>
          <p>Estima la pérdida de un tramo con Darcy–Weisbach y accesorios mediante ΣK, usando el caudal y la densidad actuales.</p>
          <div class="fields">${input('diameter','Diámetro interior (mm)',38,1,1000)}${input('length','Longitud recta (m)',15,0,1000)}${input('roughness','Rugosidad (mm)',.015,0,5)}${input('viscosity','Viscosidad supuesta (mPa·s)',2,.05,100)}${input('minor','Suma K de accesorios',6,0,500)}</div>
          <div id="lab-hydraulic"></div><button type="button" id="lab-apply-loss" aria-pressed="false">Vincular como caída base</button>
          <p class="muted">La presión adicional en placas requiere datos del fabricante. Los valores geométricos iniciales sirven para el ejercicio.</p>
        </article>
        <article><h3>Refrigeración industrial</h3><div id="lab-fridge"></div>
          <svg viewBox="0 0 330 175" class="lab-diagram" role="img" aria-label="Diagrama conceptual presión entalpía del ciclo frigorífico">
            <path d="M36 15 V144 H305" class="axis" fill="none"/><text x="4" y="18">p</text><text x="298" y="165">h</text>
            <path d="M88 127 Q135 23 163 28 Q190 39 216 127" fill="none" stroke="#90a6ad" stroke-dasharray="4 4"/>
            <path d="M230 122 L267 48 H88 V122 Z" fill="none" stroke="#087b6b" stroke-width="3"/>
            <text x="235" y="129">1</text><text x="271" y="48">2</text><text x="70" y="47">3</text><text x="70" y="130">4</text>
          </svg>
          <p class="muted">1→2 compresión, 2→3 condensación, 3→4 expansión y 4→1 evaporación. Ejes esquemáticos. COP = calor retirado / trabajo eléctrico.</p>
        </article>
        <article><h3>Economía a largo plazo</h3><div class="fields">${input('years','Horizonte (años)',10,1,40,1)}${input('discount','Tasa de descuento (%)',10,0,100)}</div><div id="lab-finance"></div><p class="muted">Flujo de caja anual uniforme, al cierre de cada año, sin valor residual.</p></article>
        <article><h3>Balance de agua</h3><p>Introduce consumos netos medidos de agua, incluyendo reposición y purgas según el límite elegido.</p><div class="fields">${input('baseWater','Convencional (m³/año)','',0,1000000000)}${input('regenWater','Con regeneración (m³/año)','',0,1000000000)}</div><div id="lab-water"></div></article>
        <article class="wide"><h3>Sensibilidad de supuestos</h3><p>Varía un parámetro a la vez y conserva los demás. Los resultados son rangos de escenarios.</p>
          <div class="fields">${input('variation','Variación simétrica (%)',5,0,50)}</div><div class="table-scroll"><table id="lab-sensitivity"></table></div>
        </article>
      </div>
    </section>`);
  document.getElementById('metodo').insertAdjacentHTML('beforebegin',`
    <section id="auditoria" class="panel lab"><div class="section-head"><div><p class="eyebrow">VERIFICACIÓN Y TRAZABILIDAD</p><h2>Auditoría del escenario</h2></div><div class="actions"><button type="button" id="lab-json">Descargar auditoría JSON</button><button type="button" id="lab-print">Imprimir informe</button></div></div>
    <p id="lab-version"></p><div class="table-scroll"><table id="lab-checks"></table></div>
    <div id="lab-trace"></div>
    <details><summary>Fuentes y vínculo con OPU</summary><p>Materia y energía · conservación de masa y calor sensible. Transferencia · DMLT y NTU. Mecánica de fluidos · potencia hidráulica y Darcy–Weisbach. Servicios auxiliares · rendimiento de combustión y COP.</p><ul>${sources.map(([name,url])=>'<li><a href="'+url+'">'+name+'</a></li>').join('')}</ul></details>
    </section>`);

  const by = id => document.getElementById(id);
  const root = by('laboratorio');
  const get = name => root.querySelector('[name="'+name+'"]');
  const read = name => get(name).validity.valid ? get(name).valueAsNumber : NaN;
  const values = (id,items) => { by(id).innerHTML = entries(items); };
  const table = (id,head,rows) => {
    by(id).innerHTML = '<thead><tr>'+head.map(v=>'<th scope="col">'+v+'</th>').join('')+'</tr></thead><tbody>'+
      rows.map(([name,...cells])=>'<tr><th scope="row">'+name+'</th>'+cells.map(v=>'<td>'+v+'</td>').join('')+'</tr>').join('')+'</tbody>';
  };
  const baseline = { flow:5000,inlet:4,hot:72,outlet:4,eff:85,area:12.78,cp:3.94,density:1030,mode:'area' };
  const parts = {
    frame:'Bastidor de acero con protección para ambiente húmedo. Sostiene y comprime el paquete de placas de forma uniforme.',
    plates:'Placas corrugadas de acero inoxidable sanitario. La corrugación amplía el contacto y modifica la transferencia y la caída de presión.',
    gaskets:'Juntas elastoméricas compatibles con alimentos, temperatura y química de limpieza. Sellan y encaminan las dos corrientes.',
    ports:'Conexiones de acero inoxidable sanitario con uniones desmontables. Alimentan y descargan los canales en el orden definido por el fabricante.',
    bolts:'Pernos estructurales de sujeción. Mantienen la compresión de acuerdo con la cota de cierre del fabricante.',
    channels:'Canales alternos formados entre placas. Ambas corrientes intercambian calor a través del metal y conservan trayectorias separadas.',
  };
  by('lab-part').onchange = () => { by('lab-part-data').textContent=parts[by('lab-part').value]; };
  by('lab-part').onchange();
  let p,r,profile,loss,record,lastOperation,pressureLinked=false;
  const geometryKeys = ['diameter','length','roughness','viscosity','minor'];
  const getGeometry = () => Object.fromEntries(geometryKeys.map(key=>[key,read(key)]));
  const calculatePipe = (params,geometry) =>
    Object.values(geometry).every(Number.isFinite) && geometry.roughness < geometry.diameter ?
      pipeLoss(params,geometry) : null;
  function pressureButton() {
    const button = by('lab-apply-loss');
    button.disabled = !pressureLinked && loss == null;
    button.setAttribute('aria-pressed',pressureLinked);
    button.textContent = pressureLinked ? 'Desvincular caída base' : 'Vincular como caída base';
  }
  function renderProfile() {
    if (!window.Chart) return;
    const cold = [p.inlet,r.preheat];
    const hot = [r.warm,p.hot];
    const datasets = [
      {label:'Leche cruda',data:cold,borderColor:'#258cd0',backgroundColor:'#258cd0'},
      {label:'Leche pasteurizada',data:hot,borderColor:'#ed8440',backgroundColor:'#ed8440'},
    ];
    if (profile) {
      profile.data.datasets = datasets;
      profile.update('none');
    } else {
      profile = new window.Chart(by('lab-profile'),{type:'line',data:{labels:['Entrada fría','Salida fría'],datasets},options:{
        animation:false,maintainAspectRatio:false,scales:{y:{title:{display:true,text:'Temperatura (°C)'}}}
      }});
    }
  }

  function render() {
    if (!p || !r) return;
    const hx = exchanger(p,r,read('plateArea'));
    values('lab-exchanger',[['U efectivo',r.effectiveU,'W/m²·K'],['UA',hx.ua,'kW/K'],
      ['DMLT',hx.lmtd,'K'],['NTU',hx.ntu],['Q por DMLT',hx.heat,'kW'],
      ['Q por NTU',r.recovered,'kW'],['Placas activas estimadas',hx.plates]]);
    renderProfile();
    const u = read('experimentU');
    const experiment = Number.isFinite(u) ? calculate({...p,...baseline,u:u*1000,fouling:0}) : null;
    values('lab-experiment',[['Efectividad',experiment ? experiment.effectiveness*100 : null,'%'],
      ['Calor recuperado',experiment?.recovered,'kW'],['Salida lado frío',experiment?.preheat,'°C'],['Salida lado caliente',experiment?.warm,'°C']]);
    by('lab-apply-heat').disabled = !experiment;
    const fixed = {...p,mode:'area',area:r.area};
    const clean = r.area > 0 ? calculate({...fixed,fouling:0}) : null;
    const dirty = r.area > 0 ? calculate(fixed) : null;
    values('lab-fouling',[['Limpio',clean?.recovered,'kW'],['Con resistencia adicional',dirty?.recovered,'kW'],
      ['Pérdida de recuperación',clean ? clean.recovered-dirty.recovered : null,'kW']]);
    const geometry = getGeometry();
    const pipe = calculatePipe(p,geometry);
    loss = pipe?.loss;
    values('lab-hydraulic',[['Velocidad',pipe?.speed,'m/s'],['Reynolds',pipe?.reynolds],
      ['Factor Darcy',pipe?.f?.toFixed(4) ?? '—'],['Caída de presión',loss,'kPa'],
      ['Bombeo eléctrico del tramo',pipe?.pumping,'kW'],
      ['Régimen',!pipe ? 'Revisa los datos' : pipe.f === null ? 'Transición · pérdida sin estimar' : pipe.reynolds < 2300 ? 'Laminar' : 'Turbulento']]);
    pressureButton();
    values('lab-fridge',[['COP',p.cop],['Fracción mecánica',p.fridgeShare,'%'],
      ['Demanda eléctrica convencional',r.baselineCooling*p.fridgeShare/(100*p.cop),'kW'],
      ['Demanda eléctrica con regeneración',r.cooling*p.fridgeShare/(100*p.cop),'kW']]);
    const years = read('years'), discount = read('discount');
    const f = Number.isInteger(years) && Number.isFinite(discount) ? financial(r.net,p.investment,years,discount/100) : null;
    values('lab-finance',[['VAN',f?.npv,'S/'],['TIR',f?.irr == null ? null : 100*f.irr,'%']]);
    const baseWater = read('baseWater'), regenWater = read('regenWater');
    const water = Number.isFinite(baseWater) && Number.isFinite(regenWater) ? baseWater-regenWater : null;
    values('lab-water',[['Ahorro neto',water,'m³/año'],['Datos',water === null ? 'Pendientes de medición' : 'Ingresados en el escenario']]);
    const variation = read('variation');
    const variations = Number.isFinite(variation) ? sensitivity(p,variation/100) : [];
    table('lab-sensitivity',['Parámetro','Valor reducido (S/ netos/año)','Valor aumentado (S/ netos/año)'],
      variations.map(a=>[a.label,number(a.low),number(a.high)]));
    const checks = audit(p,r);
    const createdAt = new Date().toISOString();
    record = { modelVersion:MODEL_VERSION,createdAt,scenario:p,results:r,exchanger:hx,checks,
      laboratory:{geometry,pipe,pressureLinked,fouling:{clean,dirty},cashFlow:{years,discount,results:f},
        water:{baseWater,regenWater,saving:water},variation,variations},sources,
      assumptions:{sanitary:'Validación de planta pendiente',u:'Supuesto de diseño editable',budget:'Inversión referencial por cotizar'} };
    by('lab-version').textContent = 'Modelo ' + MODEL_VERSION + ' · ' + new Date(createdAt).toLocaleString('es-PE');
    by('lab-json').disabled = by('lab-print').disabled = false;
    table('lab-checks',['Prueba','Residuo absoluto','Estado'],
      checks.map(c=>[c.name,Math.abs(c.residual).toExponential(2)+' '+c.unit,c.pass ? 'Verificada' : 'Revisar']));
    values('lab-trace',[['U y condiciones nominales','Supuestos editables del informe'],
      ['Presupuesto','Inversión referencial por cotizar'],['Validación sanitaria','Pendiente en planta']]);
  }

  function operation(state) {
    lastOperation = state;
    by('lab-operation').textContent = state.running ?
      (state.diverted ? 'Desvío · retorno al tanque de equilibrio.' : 'Producción · flujo habilitado hacia almacenamiento.') :
      'Preparación · ajusta el caudal y la consigna, o inicia la simulación.';
  }
  root.addEventListener('input',event => {
    if (pressureLinked && geometryKeys.includes(event.target.name)) refresh();
    else if (!by('csv').disabled) render();
  });
  by('lab-apply-heat').onclick = () => setInputs({...baseline,u:read('experimentU')*1000,fouling:0});
  by('lab-reset-heat').onclick = () => { get('experimentU').value=2.5; render(); };
  by('lab-apply-loss').onclick = () => { pressureLinked=!pressureLinked; pressureButton(); refresh(); };
  const stages = {
    Preparación:'Preparación · revisa las condiciones y confirma la ruta de retorno.',
    Arranque:'Arranque · primero se establece el flujo por el circuito de retorno.',
    Calentamiento:'Calentamiento · el calentador aporta energía hasta llegar a la consigna. Verifica temperatura y residencia antes de producir.',
    CIP:'Limpieza CIP · secuencia conceptual de enjuague, lavado, enjuague final y verificación. El circuito se representa fuera de producción.',
    Parada:'Parada · se detiene el flujo mostrado. Puedes imprimir o descargar la auditoría del escenario.',
  };
  by('operacion').onclick = e => {
    const stage = e.target.dataset.stage;
    if (!stage) return;
    if (lastOperation?.running) by('run').click();
    by('lab-operation').textContent = stages[stage];
    if (stage === 'Parada') by('lab-json').focus();
  };
  by('lab-json').onclick = () => {
    const url=URL.createObjectURL(new Blob([JSON.stringify(record,null,2)],{type:'application/json'}));
    const link=document.createElement('a');
    link.href=url;
    link.download='auditoria-htst-'+MODEL_VERSION+'.json';
    link.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  };
  by('lab-print').onclick = () => window.print();
  return {
    update(params,result){p=params;r=result;render();},
    operation,component:key=>parts[key],pressureLinked:()=>pressureLinked,
    unlinkPressure(){pressureLinked=false;},
    adjust(params){
      if (!pressureLinked) return true;
      const pipe = calculatePipe(params,getGeometry());
      if (pipe?.loss == null) return false;
      params.pressure = pipe.loss;
      return true;
    },
    invalidate(){by('lab-json').disabled=by('lab-print').disabled=true;},
  };
}
