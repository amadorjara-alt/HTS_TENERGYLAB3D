import { calculate } from './model.mjs';

export const MODEL_VERSION = '2.0.0';

export function exchanger(p, r, plateArea) {
  const d1 = p.hot - r.preheat;
  const d2 = r.warm - p.inlet;
  const lmtd = Math.abs(d1-d2) < 1e-9 ? (d1+d2)/2 : (d1-d2)/Math.log(d1/d2);
  const ua = r.effectiveU * r.area / 1000;
  return { d1, d2, lmtd, ua, ntu:ua/r.capacity, heat:ua*lmtd,
    plates:plateArea > 0 && r.area > 0 ? Math.ceil(r.area/plateArea) : null };
}

export function pipeLoss(p, { diameter, length, roughness, viscosity, minor }) {
  const flow = p.flow / 3600000;
  const d = diameter / 1000;
  const speed = 4 * flow / (Math.PI*d*d);
  const reynolds = p.density * speed*d / (viscosity/1000);
  // Swamee–Jain explícito para tubería circular turbulenta.
  const turbulent = .25 / Math.log10(roughness/1000/(3.7*d)+5.74/reynolds**.9)**2;
  const f = reynolds < 2300 ? 64/reynolds : reynolds >= 4000 ? turbulent : null;
  const loss = f === null ? null : (f*length/d+minor)*p.density*speed*speed/2000;
  const pumping = loss === null ? null : flow*loss/(p.pumpEff/100);
  return { speed, reynolds, f, loss, pumping };
}

export function financial(net, investment, years, discount) {
  const npvAt = rate => -investment + Array.from({length:years}, (_,i) => net/(1+rate)**(i+1)).reduce((a,b) => a+b,0);
  let lo = -.9999, hi = 1;
  if (net <= 0 || investment <= 0 || npvAt(lo) <= 0) return { npv:npvAt(discount), irr:null };
  while (npvAt(hi) > 0 && hi < 1e9) hi *= 2;
  if (npvAt(hi) > 0) return { npv:npvAt(discount), irr:null };
  for (let i=0; i<80; i++) {
    const mid = (lo+hi)/2;
    if (npvAt(mid) > 0) lo = mid;
    else hi = mid;
  }
  return { npv:npvAt(discount), irr:(lo+hi)/2 };
}

export function audit(p, r) {
  const hx = exchanger(p,r,0);
  const recoveredCold = r.capacity*(r.preheat-p.inlet);
  const recoveredHot = r.capacity*(p.hot-r.warm);
  const checks = [
    ['Masa en el regenerador',r.mass-p.flow/3600000*p.density,'kg/s'],
    ['Balance del lado frío',recoveredCold-r.recovered,'kW'],
    ['Balance del lado caliente',recoveredHot-r.recovered,'kW'],
    ['Calentamiento externo más recuperación',r.heat+r.recovered-r.total,'kW'],
    ['DMLT frente a NTU–efectividad',hx.heat-r.recovered,'kW'],
  ];
  return checks.map(([name,residual,unit]) => ({name, residual, unit,
    pass:Number.isFinite(residual) && Math.abs(residual) <= 1e-6}));
}

export function sensitivity(p, fraction) {
  return [
    ['Caudal','flow'],['U limpio','u'],['Tarifa de gas','gasPrice'],
    ['Tarifa eléctrica','elecPrice'],['Horas anuales','hours'],
  ].map(([label,key]) => {
    const low = calculate({...p,[key]:p[key]*(1-fraction)});
    const upper = p[key]*(1+fraction);
    const high = calculate({...p,[key]:key === 'hours' ? Math.min(8760,upper) : upper});
    return { label,low:low.net,high:high.net };
  });
}
