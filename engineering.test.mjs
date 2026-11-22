import test from 'node:test';
import assert from 'node:assert/strict';
import { calculate } from './model.mjs';
import { audit, exchanger, financial, pipeLoss, sensitivity } from './engineering.mjs';

const report = {
  flow:5000, inlet:4, hot:72, outlet:4, eff:85, cp:3.94, density:1030,
  u:2500, area:12.78, fouling:0, volume:5000*15/3600, mode:'design',
  pressure:0, extraPressure:100, pumpEff:54, boiler:85, cop:3.5,
  fridgeShare:50, hours:4800, gasPrice:.1, elecPrice:.55, investment:122000,
  maintenance:10000, gasCO2:.20196, gridCO2:0,
};
const close = (actual,expected,tolerance=1e-8) =>
  assert.ok(Math.abs(actual-expected) <= tolerance,`${actual} ≠ ${expected}`);

test('reproduce los resultados térmicos, económicos y ambientales del informe', () => {
  const r = calculate(report);
  close(r.preheat,61.8);
  close(r.warm,14.2);
  close(r.recovered,325.78,.005);
  close(r.area,12.78,.005);
  close(r.net,296160,1);
  close(12*r.payback,4.94,.005);
  close(r.avoided,371.55,.005);
  close(calculate({...report,eff:90}).area,20.29,.005);
});

test('DMLT coincide con NTU, incluso sin recuperación', () => {
  for (const p of [report,{...report,eff:0},{...report,eff:99.9},{...report,fouling:2}]) {
    assert.ok(audit(p,calculate(p)).every(check=>check.pass));
  }
  const hx = exchanger(report,calculate(report),.25);
  close(hx.lmtd,10.2);
  assert.equal(hx.plates,52);
});

test('área fija responde a U, caudal y ensuciamiento y el desvío sigue la retención', () => {
  const p = {...report,mode:'area'};
  const r = calculate(p);
  assert.equal(r.diverted,false);
  assert.ok(calculate({...p,u:1500}).recovered < r.recovered);
  assert.ok(calculate({...p,fouling:2}).effectiveness < r.effectiveness);
  const highFlow = calculate({...p,flow:6000});
  close(highFlow.retention,12.5);
  assert.ok(highFlow.effectiveness < r.effectiveness);
  assert.equal(highFlow.diverted,true);
  assert.equal(calculate({...p,hot:71}).diverted,true);
});

test('Darcy–Weisbach responde al caudal y deja la transición sin estimación', () => {
  const pipe = {diameter:38,length:15,roughness:.015,viscosity:2,minor:6};
  const base = pipeLoss(report,pipe);
  assert.ok(base.reynolds > 4000 && base.pumping > 0);
  assert.ok(pipeLoss({...report,flow:6000},pipe).loss > base.loss);
  assert.equal(pipeLoss({...report,flow:600},pipe).loss,null);
  const laminar = pipeLoss({...report,flow:200},pipe);
  close(laminar.f,64/laminar.reynolds);
});

test('VAN, TIR y sensibilidad preservan sus condiciones de cálculo', () => {
  const f = financial(60,100,2,0);
  close(f.npv,20);
  close(financial(60,100,2,f.irr).npv,0);
  assert.equal(financial(-1,100,2,0).irr,null);
  assert.ok(sensitivity(report,0).every(row=>row.low===row.high));
});
