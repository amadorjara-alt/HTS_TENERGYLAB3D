export function calculate(p) {
  const flow = p.flow / 3600000;
  const mass = flow * p.density;
  const capacity = mass * p.cp;
  const span = p.hot - p.inlet;
  const ntu = p.u * p.area / (1000 * capacity);
  const effectiveness = p.mode === 'area' ? ntu / (1 + ntu) : p.eff / 100;
  const preheat = p.inlet + span * effectiveness;
  const warm = p.hot - span * effectiveness;
  const total = capacity * span;
  const recovered = total * effectiveness;
  const heat = total - recovered;
  const cooling = Math.max(0, capacity * (warm - p.outlet));
  const baselineCooling = capacity * (p.hot - p.outlet);
  const area = p.mode === 'area' ? p.area :
    1000 * capacity * effectiveness / (p.u * (1 - effectiveness));
  const pump = flow * p.pressure / (p.pumpEff / 100);
  const extraPump = flow * p.extraPressure / (p.pumpEff / 100);
  const retention = p.volume / (p.flow / 3600);
  const diverted = p.hot < 72 || retention < 15 - 1e-9;
  const utilities = (thermalHeat, thermalCool, pumping) => {
    const gas = thermalHeat * p.hours / (p.boiler / 100);
    const electric = (thermalCool * p.fridgeShare / 100 / p.cop + pumping) * p.hours;
    return { gas, electric, emissions: (gas * p.gasCO2 + electric * p.gridCO2) / 1000 };
  };
  const conventional = utilities(total, baselineCooling, pump);
  const regeneration = utilities(heat, cooling, pump + extraPump);
  const gasSaving = (conventional.gas - regeneration.gas) * p.gasPrice;
  const electricSaving = (conventional.electric - regeneration.electric) * p.elecPrice;
  const net = gasSaving + electricSaving - p.maintenance;
  return { mass, effectiveness, preheat, warm, total, recovered, heat, cooling,
    baselineCooling, area, pump, extraPump, retention, diverted, conventional, regeneration,
    gasSaving, electricSaving, net, payback: net > 0 ? p.investment / net : null,
    roi: p.investment > 0 ? 100 * net / p.investment : null,
    avoided: conventional.emissions - regeneration.emissions,
    needsReheat: warm < p.outlet - 1e-9 };
}
