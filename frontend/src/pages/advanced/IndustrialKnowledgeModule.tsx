import { useState } from 'react';
import type { ReactNode } from 'react';
import {
  Factory, Pill, ShoppingBag, Zap, Utensils, Droplets, FlaskConical,
  Fuel, Truck, Wheat, Recycle, Package, Gauge, Compass, ChevronRight,
  ShieldCheck, Wind, Cog, Map, Layers, ArrowRight, Info, Building2, BookOpen
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { CalcCard } from './SharedComponents';

function InfoNote({ children }: { children: ReactNode }) {
  return (
    <div className="mt-6 flex items-start gap-3 glass rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
      <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{children}</p>
    </div>
  );
}

// ─── Industry data model ────────────────────────────────────────────────────
interface IndustryStage { name: string; desc: string; equipment: string[]; hse: string; }
interface IndustryAspects {
  raw: string; process: string; equipment: string; utilities: string;
  control: string; hse: string; products: string; waste: string;
}
interface Industry {
  id: string; name: string; icon: ReactNode; color: string; tagline: string;
  stages: IndustryStage[]; aspects: IndustryAspects;
}

// ─── Interactive stage train (SVG chain, clickable) ─────────────────────────
function IndustryTrain({ stages, selected, onSelect }: {
  stages: IndustryStage[]; selected: number; onSelect: (i: number) => void;
}) {
  const n = stages.length;
  const x0 = 40;
  // fit nodes so they never overlap: stepX >= nodeW + gap, or compress nodeW
  const stepX = Math.max(100, (760 - x0 - 40) / Math.max(n - 1, 1));
  const nodeW = Math.min(110, Math.max(64, stepX - 12));
  const W = x0 + (n - 1) * stepX + nodeW + 40;
  const H = 150;
  const y = 78;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      {/* connectors */}
      {stages.slice(0, -1).map((_, i) => (
        <line key={'c' + i} x1={x0 + i * stepX + nodeW / 2} x2={x0 + (i + 1) * stepX + nodeW / 2}
          y1={y} y2={y} className={i < selected ? 'stroke-blue-500' : 'stroke-slate-300 dark:stroke-slate-700'}
          strokeWidth="3" strokeDasharray="5 4" />
      ))}
      {/* nodes */}
      {stages.map((s, i) => {
        const x = x0 + i * stepX;
        const active = i === selected;
        const done = i < selected;
        return (
          <g key={s.name} onClick={() => onSelect(i)} className="cursor-pointer">
            <rect x={x} y={y - 26} width={nodeW} height={52} rx="12"
              className={active
                ? 'fill-blue-600 stroke-blue-700'
                : done
                  ? 'fill-blue-100 stroke-blue-300 dark:fill-blue-900/50 dark:stroke-blue-700'
                  : 'fill-white stroke-slate-300 dark:fill-slate-900 dark:stroke-slate-700'}
              strokeWidth="2" />
            <text x={x + nodeW / 2} y={y - 4} textAnchor="middle"
              className={`text-[10px] font-black ${active ? 'fill-white' : 'fill-slate-600 dark:fill-slate-300'}`}>
              {i + 1}
            </text>
            <text x={x + nodeW / 2} y={y + 14} textAnchor="middle"
              className={`text-[9px] font-bold ${active ? 'fill-white' : 'fill-slate-500 dark:fill-slate-400'}`}>
              {s.name.length > 14 ? s.name.slice(0, 13) + '…' : s.name}
            </text>
          </g>
        );
      })}
      <text x={W / 2} y={H - 14} textAnchor="middle" className="fill-slate-400 text-[9px] font-bold">
        Click a stage to inspect it — arrows show the process direction
      </text>
    </svg>
  );
}
// ─── Industry learning paths — data part 1 ──────────────────────────────────
const INDUSTRIES: Industry[] = [
  {
    id: 'cement', name: 'Cement', icon: <Building2 className="w-5 h-5" />, color: '#64748b',
    tagline: 'The backbone of construction — every tonne starts as limestone and ends as clinker.',
    stages: [
      { name: 'Quarry', desc: 'Limestone, clay and additives are blasted and hauled to the crusher.', equipment: ['Drills & explosives', 'Dump trucks', 'Apron feeders'], hse: 'Dust, noise and fly-rock control; blast permits.' },
      { name: 'Crushing', desc: 'Run-of-mine rock is reduced to <75 mm for the raw mill.', equipment: ['Jaw crusher', 'Impact crusher', 'Vibrating screens'], hse: 'Guarding, dust extraction, isolation before maintenance.' },
      { name: 'Raw Mill', desc: 'Crushed rock is ground and blended with clay/sand to a fine raw meal.', equipment: ['Vertical roller mill', 'Ball mill', 'Air classifiers'], hse: 'Mill fires (coal), confined-space entry.' },
      { name: 'Preheater', desc: 'Cyclones preheat raw meal to ~850 °C using kiln exhaust heat.', equipment: ['Cyclone towers', 'Kiln riser ducts', 'Precalciner burner'], hse: 'Hot gas handling, refractory integrity checks.' },
      { name: 'Kiln', desc: 'The heart: raw meal is sintered at 1450 °C into clinker.', equipment: ['Rotary kiln', 'Cooler', 'Burning zone burners'], hse: 'Heat, CO, NOx; refractory & shell monitoring.' },
      { name: 'Clinker Cooler', desc: 'Hot clinker (1400 °C) is quenched to ~100 °C, recovering heat.', equipment: ['Grate cooler', 'Cooling fans', 'Heat recovery to kiln'], hse: 'Hot clinker dust, thermal radiation.' },
      { name: 'Cement Mill', desc: 'Clinker + gypsum are ground to the final fine powder.', equipment: ['Ball mills', 'High-pressure rolls', 'Cement silos'], hse: 'Noise, dust, gypsum handling.' },
      { name: 'Packing', desc: 'Cement is packed in bags or loaded bulk for dispatch.', equipment: ['Rotary packers', 'Bulk loading spouts', 'Palletisers'], hse: 'Bag lifting ergonomics, dust exposure.' },
    ],
    aspects: {
      raw: 'Limestone (CaCO₃), clay (SiO₂/Al₂O₃/Fe₂O₃), gypsum, coal/pet-coke for the kiln, and iron additives.',
      process: 'Drying → crushing → raw meal blending → preheating → calcination/sintering at 1450 °C → rapid cooling → inter-grinding with gypsum.',
      equipment: 'Crushers, vertical roller mills, cyclone preheaters, rotary kilns, grate coolers, ball mills, packers.',
      utilities: 'Coal/pet-coke, natural gas, electricity (largest cost), water for cooling and dust suppression.',
      control: 'Kiln shell temperature scanning, O₂/CO/NOx analysers, raw meal chemistry (XRF), mill load control.',
      hse: 'Dust (respirable silica), heat stress, kiln refractory, confined spaces, rotary equipment guarding.',
      products: 'OPC (Ordinary Portland Cement), blended cements (PPC, PSC), white cement, cement bags/bulk.',
      waste: 'Kiln dust, spent refractories, tyres (co-processed as fuel), excess heat — cement kilns are the classic co-processing hosts.',
    },
  },
  {
    id: 'fertilizer', name: 'Fertilizer', icon: <Wheat className="w-5 h-5" />, color: '#65a30d',
    tagline: 'Feeding the world: nitrogen from air, phosphorus from rock, potassium from mines.',
    stages: [
      { name: 'Syngas', desc: 'Natural gas is steam-reformed to H₂/N₂ synthesis gas.', equipment: ['Desulphurisers', 'Primary & secondary reformers', 'Shift converters'], hse: 'High-temperature, high-pressure steam/CO risk.' },
      { name: 'CO₂ Removal', desc: 'CO₂ is scrubbed out — it is sold or used for urea later.', equipment: ['Absorbers (MEA/K₂CO₃)', 'Strippers', 'CO₂ compressors'], hse: 'Amino corrosion, H₂S traces, high pressure.' },
      { name: 'Ammonia Loop', desc: 'N₂ + 3H₂ ⇌ 2NH₃ over iron catalyst at 150–300 bar, 450 °C.', equipment: ['Synthesis converter', 'Ammonia chillers', 'Refrigeration'], hse: 'Anhydrous ammonia is toxic & flammable — leak detection is critical.' },
      { name: 'Urea Synthesis', desc: 'Ammonia + CO₂ → urea at ~180 bar; solution is stripped and evaporated.', equipment: ['Urea reactor', 'Carbamate stripper', 'Evaporators', 'Prilling/granulation tower'], hse: 'Carbamate is corrosive; biuret control for food-grade urea.' },
      { name: 'Granulation', desc: 'Urea melt or ammonium nitrate is granulated/prilled for handling.', equipment: ['Fluid-bed granulators', 'Prilling towers', 'Coating drums'], hse: 'Dust explosions, ammonia exposure.' },
      { name: 'Bagging', desc: 'Granules are screened, coated and packed.', equipment: ['Rotary screens', 'Coater', 'Bagging machines'], hse: 'Dust control, ergonomics.' },
    ],
    aspects: {
      raw: 'Natural gas (or coal), air, water, phosphate rock, potash, sulphur (for sulphuric acid).',
      process: 'Steam reforming → shift → CO₂ removal → ammonia synthesis → urea/AN/DAP granulation → bagging.',
      equipment: 'Reformers, converters, absorbers, high-pressure urea reactors, granulators, dryers, coolers.',
      utilities: 'Steam, electricity, cooling water, refrigeration, compressed air.',
      control: 'H₂/N₂ ratio control, converter temperature profile, loop pressure, moisture in granules.',
      hse: 'Ammonia & CO toxicity, high pressure (300 bar), carbamate corrosion, dust explosions, catalyst (Ni, Fe) handling.',
      products: 'Urea, ammonium nitrate (AN), DAP/MAP, NPK blends, liquid ammonia, technical-grade urea.',
      waste: 'CO₂ (sold/recycled into urea), condensate, purge gas (recovered H₂), spent catalyst.',
    },
  },
  {
    id: 'petrochemical', name: 'Petrochemical', icon: <FlaskConical className="w-5 h-5" />, color: '#0ea5e9',
    tagline: 'From naphtha and ethane to the building blocks of plastics, fibres and solvents.',
    stages: [
      { name: 'Cracking', desc: 'Naphtha/ethane is steam-cracked at 850 °C into olefins.', equipment: ['Cracking furnaces', 'Quench columns', 'Decoking system'], hse: 'Furnace tube failure → fire; coke & pyrophorics.' },
      { name: 'Separation', desc: 'Cracked gas is compressed and distilled into pure streams.', equipment: ['Charge gas compressor', 'De-methaniser', 'C₂/C₃ splitters', 'Acetylene converters'], hse: 'Extremely flammable ethylene/propylene at pressure.' },
      { name: 'Polymerisation', desc: 'Olefins are polymerised into polyethylene/polypropylene.', equipment: ['Loop or gas-phase reactors', 'Catalyst injection', 'Extruders'], hse: 'Runaway polymerisation, high pressure, flammability.' },
      { name: 'Derivatives', desc: 'Ethylene oxide, styrene, VCM and other monomers are produced.', equipment: ['Oxidation reactors', 'Distillation trains', 'Storage caverns'], hse: 'EO is toxic & explosive; VCM is carcinogenic.' },
      { name: 'Compounding', desc: 'Polymer + additives are melted, mixed and pelletised.', equipment: ['Twin-screw extruders', 'Pellettisers', 'Blenders'], hse: 'Melt burns, additives dust, noise.' },
    ],
    aspects: {
      raw: 'Naphtha, ethane/propane (shale gas), natural gas, water, catalysts, additives.',
      process: 'Steam cracking → olefin separation → polymerisation → compounding → packaging.',
      equipment: 'Cracking furnaces, distillation columns, polymer reactors, extruders, storage spheres.',
      utilities: 'Fuel gas, steam, cooling water, nitrogen blanketing, flare system.',
      control: 'Furnace outlet temperature, reactor pressure, catalyst feed rate, product MFR (melt flow rate).',
      hse: 'Flammable hydrocarbons, high pressure, toxic intermediates (EO, VCM), reactive polymerisation.',
      products: 'Ethylene, propylene, PE/PP, EO/EG, styrene, VCM/PVC, butadiene.',
      waste: 'Off-gas to flare/fuel, tars, spent catalysts, pyrolysis gasoline by-product.',
    },
  },
  {
    id: 'oil-gas', name: 'Oil & Gas', icon: <Fuel className="w-5 h-5" />, color: '#78716c',
    tagline: 'Crude in, fuels and lubricants out — the refinery that fuels civilisation.',
    stages: [
      { name: 'Crude Storage', desc: 'Tankers/pipelines deliver crude to floating-roof storage tanks.', equipment: ['Crude tanks', 'Desalters', 'Feed preheat train'], hse: 'Flammable vapour and fire risk; fixed-roof tank vents, secondary containment.' },
      { name: 'Atmospheric Distillation', desc: 'Crude is heated (~370 °C) and fractionated in the crude unit into gas, naphtha, kerosene, diesel and residue.', equipment: ['Fired heater', 'Atmospheric column', 'Side strippers', 'Overhead condensers'], hse: 'High-temperature hydrocarbons; furnace tube rupture; overpressure relief.' },
      { name: 'Vacuum Distillation', desc: 'Column bottoms are distilled under vacuum to recover gas-oil for conversion units.', equipment: ['Vacuum column', 'Steam ejectors', 'Hot-oil pumps'], hse: 'Air ingress at vacuum can ignite hot residue — strict inerting.' },
      { name: 'Conversion Units', desc: 'FCC, hydrocracker and coker upgrade heavy fractions into lighter, more valuable products.', equipment: ['FCC reactor/regenerator', 'Hydrocracker', 'Delayed coker', 'Catalytic reformer'], hse: 'Catalyst circulation, high-pressure H2, H2S-bearing gas.' },
      { name: 'Hydrotreating', desc: 'Sulfur, nitrogen and metals are removed by hydrogen over a catalyst before product blending.', equipment: ['Hydrotreater reactor', 'Make-up H2 compressor', 'Amine scrubber'], hse: 'H2S is a silent killer — fixed gas detection and escape routes mandatory.' },
      { name: 'Blending & Storage', desc: 'Streams are blended to product specs, stored in tank farms and shipped out.', equipment: ['Blending manifolds', 'Product tanks', 'Truck/rail loading bays'], hse: 'Vapour recovery, static discharge earthing, road-tanker safety.' },
    ],
    aspects: {
      raw: 'Crude oil, natural gas liquids, blending components.',
      process: 'Fractionation, conversion (FCC/HC), treating and blending — a continuous, fully integrated network.',
      equipment: 'Fired heaters, distillation columns, reactors, compressors, heat exchangers, tank farms.',
      utilities: 'Cooling water, steam, fuel gas, instrument air, nitrogen, power.',
      control: 'Advanced process control, crude assay scheduling, product blending optimisation.',
      hse: 'H2S & hydrocarbon detection, firewater systems, relief & flare, emergency shutdown.',
      products: 'LPG, gasoline, jet fuel, diesel, fuel oil, lubricants, bitumen, petrochemical feedstocks.',
      waste: 'Sour gas to sulfur recovery, spent caustic, oily sludge, CO2 from heaters.',
    },
  },
  {
    id: 'pharma', name: 'Pharmaceutical', icon: <Pill className="w-5 h-5" />, color: '#ec4899',
    tagline: 'From molecule to medicine — where quality is literally a matter of life.',
    stages: [
      { name: 'API Synthesis', desc: 'Active pharmaceutical ingredient is made by multi-step organic synthesis in batch reactors.', equipment: ['Glass-lined reactors', 'Centrifuges', 'Dryers', 'Solvent recovery'], hse: 'Toxic & flammable solvents; containment of potent compounds.' },
      { name: 'Purification', desc: 'Crude API is crystallised, filtered and dried to meet purity specs.', equipment: ['Crystallisers', 'Filter presses', 'Vacuum dryers'], hse: 'Dust exposure (APIs are potent) — containment booths, PPE.' },
      { name: 'Formulation', desc: 'API is blended with excipients and made into tablets, capsules or liquids.', equipment: ['Blenders', 'Granulators', 'Tablet presses', 'Coating pans'], hse: 'Cross-contamination control, cleaning validation between batches.' },
      { name: 'Filling & Packaging', desc: 'Doses are filled, sealed, labelled and packed in cleanrooms.', equipment: ['Filling lines', 'Blister packers', 'Labellers'], hse: 'Class A/B cleanroom discipline; glass breakage handling.' },
      { name: 'QC & Release', desc: 'Every batch is tested against pharmacopoeia specs before release to market.', equipment: ['HPLC/GC', 'Dissolution baths', 'Stability chambers'], hse: 'Chemical hygiene, compressed gases, controlled substances.' },
    ],
    aspects: {
      raw: 'Chemical intermediates, solvents, excipients, packaging materials, purified water.',
      process: 'Batch synthesis and formulation with strict GMP, validated steps and full batch traceability.',
      equipment: 'Reactors, centrifuges, dryers, tablet presses, fill-finish lines, cleanrooms.',
      utilities: 'WFI & purified water, HVAC with HEPA filtration, nitrogen, steam.',
      control: 'Batch records, LIMS, environmental monitoring, PAT, electronic signatures.',
      hse: 'Containment, chemical hygiene plans, cleanroom gowning, spill response.',
      products: 'Tablets, capsules, injectables, liquids, creams — approved, batch-released medicines.',
      waste: 'Solvent recovery & incineration, expired API disposal, contaminated packaging.',
    },
  },
  {
    id: 'fmcg', name: 'FMCG / Consumer', icon: <ShoppingBag className="w-5 h-5" />, color: '#f59e0b',
    tagline: 'Soap, shampoo, detergent and food — chemistry you meet every single day.',
    stages: [
      { name: 'Raw Materials', desc: 'Surfactants, oils, fragrances and water are received and QC-checked.', equipment: ['Storage tanks', 'Silo systems', 'QC lab'], hse: 'Chemical storage segregation, SDS compliance.' },
      { name: 'Batching', desc: 'Formulas are mixed to exact recipes in large stirred vessels.', equipment: ['Jacketed mixers', 'High-shear blenders', 'Weigh systems'], hse: 'Dust & fume control, hot-oil jacket burns.' },
      { name: 'Processing', desc: 'Heating, homogenising, pH adjustment and viscosity control set the product feel.', equipment: ['Homogenisers', 'Heat exchangers', 'Inline mixers'], hse: 'Hot surfaces, moving rotor guards, pressure relief.' },
      { name: 'Filling', desc: 'High-speed lines fill bottles, tubes and sachets to weight.', equipment: ['Filling machines', 'Cappers', 'Checkweighers'], hse: 'Line-speed hazards, crush points, hygiene zoning.' },
      { name: 'Packing & Dispatch', desc: 'Cases are assembled, palletised and shipped to retailers.', equipment: ['Cartoners', 'Palletisers', 'Stretch wrappers'], hse: 'Lifting & ergonomics, forklift traffic.' },
    ],
    aspects: {
      raw: 'Surfactants, oils, thickeners, preservatives, fragrances, packaging film.',
      process: 'Continuous/batch blending with strict recipe control and traceability.',
      equipment: 'Mixers, homogenisers, filling lines, cappers, palletisers.',
      utilities: 'Process water, steam, compressed air, HVAC for hygiene zones.',
      control: 'PLC line control, weight check, batch traceability, spec hold/release.',
      hse: 'Chemical handling PPE, machine guarding, food-grade hygiene, allergen control.',
      products: 'Detergents, personal care, home care, packaged food & beverages.',
      waste: 'Effluent with surfactant load, packaging scrap, off-spec batches.',
    },
  },
  {
    id: 'polymer', name: 'Polymer & Plastics', icon: <Layers className="w-5 h-5" />, color: '#8b5cf6',
    tagline: 'Monomers linked into the plastics, fibres and rubbers of modern life.',
    stages: [
      { name: 'Feedstock Prep', desc: 'Monomers (ethylene, styrene, VCM) are purified and dried before reaction.', equipment: ['Monomer dryers', 'Distillation columns', 'Storage spheres'], hse: 'Flammable monomers under pressure — leak detection is critical.' },
      { name: 'Polymerisation', desc: 'Monomer converts to polymer in bulk, solution, suspension or emulsion reactors.', equipment: ['Loop reactors', 'Autoclaves', 'Stirred tank reactors'], hse: 'Runaway exotherm control, inhibitor dosing, pressure relief.' },
      { name: 'Recovery & Drying', desc: 'Unreacted monomer is flashed and recycled; polymer is dried to powder or pellets.', equipment: ['Flash tanks', 'Centrifuges', 'Fluid-bed dryers'], hse: 'Dust explosions from polymer powder — ATEX zones.' },
      { name: 'Compounding', desc: 'Additives (stabilisers, fillers, colours) are melt-blended into the resin.', equipment: ['Twin-screw extruders', 'Pelletisers', 'Blenders'], hse: 'Hot melt contact, fumes from thermal degradation.' },
      { name: 'Conversion', desc: 'Pellets are moulded, blown or extruded into final plastic products.', equipment: ['Injection moulders', 'Blow moulders', 'Film lines'], hse: 'Machine guarding, hot moulds, granulator noise.' },
    ],
    aspects: {
      raw: 'Ethylene, propylene, styrene, vinyl chloride, catalysts, additives.',
      process: 'Polymerisation (free-radical, Ziegler–Natta) with heat removal as the core challenge.',
      equipment: 'Reactors, extruders, pelletisers, moulding machines, silos.',
      utilities: 'Cooling water (heat of reaction!), steam, nitrogen, power.',
      control: 'Reaction temperature/pressure tight control, MWD via viscosity, rate control.',
      hse: 'Monomer toxicity (VCM!), dust explosion zones, hot-melt burns.',
      products: 'PE, PP, PS, PVC, PET, ABS — pellets, films, mouldings, fibres.',
      waste: 'Off-spec resin, scrap regrind, volatile emissions, catalyst waste.',
    },
  },
  {
    id: 'steel', name: 'Steel', icon: <Factory className="w-5 h-5" />, color: '#64748b',
    tagline: 'Iron ore to structural steel — the heaviest chemistry on the planet.',
    stages: [
      { name: 'Ore Prep', desc: 'Iron ore is crushed, beneficiated and sintered or pelletised for the blast furnace.', equipment: ['Crushers', 'Sinter plant', 'Pellet plant'], hse: 'Dust, silica exposure, sinter-machine heat.' },
      { name: 'Blast Furnace', desc: 'Coke, ore and flux react with hot air to produce molten iron.', equipment: ['Blast furnace', 'Hot stoves', 'Tuyeres'], hse: 'Molten metal burns, CO exposure, furnace stoves pressure.' },
      { name: 'Steelmaking', desc: 'Basic Oxygen Furnace or EAF refines iron into steel by removing carbon.', equipment: ['BOF vessel', 'Electric arc furnace', 'Ladle furnace'], hse: 'Splashing molten slag, electrode hazards, fume.' },
      { name: 'Casting', desc: 'Molten steel is cast into slabs, blooms or billets.', equipment: ['Continuous caster', 'Tundish', 'Moulds'], hse: 'Breakouts, hot metal handling, water-in-mould explosion risk.' },
      { name: 'Rolling & Finishing', desc: 'Semi-finished steel is hot- or cold-rolled into sheet, bar and sections.', equipment: ['Hot strip mill', 'Cold mill', 'Galvanising line'], hse: 'Coil-handling pinch points, furnace heat, fume & oil mist.' },
    ],
    aspects: {
      raw: 'Iron ore, coke, limestone, scrap (for EAF), alloying metals.',
      process: 'Carbothermic reduction then refining — massively energy- and CO2-intensive.',
      equipment: 'Blast furnace, BOF/EAF, continuous caster, rolling mills, annealing furnaces.',
      utilities: 'Huge cooling-water circuits, oxygen, fuel gas, power (EAF is grid-hungry).',
      control: 'Hot-metal chemistry to tap, ladle alloying, rolling-gauge control.',
      hse: 'Molten-metal PPE, CO monitoring, crane safety, thermal stress.',
      products: 'Slabs, billets, hot/cold-rolled sheet, rebar, structural sections, wire.',
      waste: 'Slag, CO2, dust & fume, scale, process water contamination.',
    },
  },
  {
    id: 'power', name: 'Power Generation', icon: <Zap className="w-5 h-5" />, color: '#eab308',
    tagline: 'Fuel in, electrons out — the utility that every other industry depends on.',
    stages: [
      { name: 'Fuel Handling', desc: 'Coal, gas or biomass is received, stored and prepared for combustion.', equipment: ['Coal conveyors', 'Gas skids', 'Pulverisers'], hse: 'Coal-dust explosion, gas leaks, conveyor pinch points.' },
      { name: 'Boiler', desc: 'Fuel burns to raise high-pressure superheated steam.', equipment: ['Water-tube boiler', 'Burners', 'Superheaters'], hse: 'Boiler explosion risk, furnace implosion, burner management.' },
      { name: 'Turbine', desc: 'Steam expands across turbine stages to spin the generator.', equipment: ['Steam turbine', 'Generator', 'Condenser'], hse: 'High-speed rotating machinery, overspeed trip integrity.' },
      { name: 'Water Treatment', desc: 'Feedwater is demineralised to protect boiler tubes from scale.', equipment: ['Demin plants', 'Deaerators', 'Polishing units'], hse: 'Caustic & acid handling, thermal deaerator hazard.' },
      { name: 'Emissions Control', desc: 'Flue gas is cleaned of dust, SOx and NOx before the stack.', equipment: ['ESP/baghouse', 'FGD scrubber', 'SCR catalyst'], hse: 'Ammonia (SCR), limestone slurry, high-temp ductwork.' },
    ],
    aspects: {
      raw: 'Coal, natural gas, biomass, uranium, water.',
      process: 'Thermodynamic Rankine cycle: combustion → steam → turbine → electricity.',
      equipment: 'Boilers, turbines, generators, condensers, cooling towers, transformers.',
      utilities: 'Fuel, water, lube oil — the plant IS the utility provider.',
      control: 'DCS with load dispatch, boiler master, turbine governor, protection trips.',
      hse: 'High-energy steam, electrical safety (HV), confined spaces, noise.',
      products: 'Electricity (MW), and steam for co-generation (CHP).',
      waste: 'CO2, fly ash, SOx/NOx, cooling-water heat, boiler blowdown.',
    },
  },
  {
    id: 'food', name: 'Food Processing', icon: <Utensils className="w-5 h-5" />, color: '#16a34a',
    tagline: 'Farm to shelf — where safety is invisible but absolutely non-negotiable.',
    stages: [
      { name: 'Receiving', desc: 'Raw ingredients are received, inspected and stored under controlled conditions.', equipment: ['Receiving bays', 'Cold stores', 'Silos'], hse: 'Forklift traffic, allergen segregation, cold-room hazards.' },
      { name: 'Preparation', desc: 'Cleaning, peeling, cutting and mixing prepare ingredients for processing.', equipment: ['Wash lines', 'Cutters', 'Blenders'], hse: 'Blade & machine guarding, water slip hazards.' },
      { name: 'Thermal Processing', desc: 'Heat kills pathogens — pasteurisation, sterilisation, cooking.', equipment: ['Heat exchangers', 'Retorts', 'Ovens', 'Fryers'], hse: 'Hot oil fires, steam burns, pressure-retort safety.' },
      { name: 'Filling & Sealing', desc: 'Product is filled, sealed and often packaged aseptically.', equipment: ['Filling lines', 'Sealers', 'Aseptic tunnels'], hse: 'Hygiene zoning, glass breakage, line guards.' },
      { name: 'Cold Chain & Dispatch', desc: 'Chilled/frozen product is warehoused and shipped with temperature logs.', equipment: ['Cold rooms', 'Refrigerated trucks', 'Shrink wrappers'], hse: 'Ammonia refrigeration leaks, freezer-burn PPE.' },
    ],
    aspects: {
      raw: 'Agricultural produce, dairy, meat, grains, additives, packaging.',
      process: 'Cleaning → thermal treatment → aseptic fill, all under HACCP control points.',
      equipment: 'Heat exchangers, retorts, fryers, fillers, cold stores, conveyor lines.',
      utilities: 'Steam, chilled water, ice water, compressed air, CIP chemicals.',
      control: 'HACCP/CCP monitoring, temperature & time records, metal detection, traceability.',
      hse: 'Food safety IS worker safety: hygiene, allergens, ammonia, hot surfaces.',
      products: 'Packaged food, beverages, dairy, meat, bakery, ready meals.',
      waste: 'Organic waste, effluent BOD load, packaging scrap, CIP chemicals.',
    },
  },
  {
    id: 'water', name: 'Water Treatment', icon: <Droplets className="w-5 h-5" />, color: '#06b6d4',
    tagline: 'Nature cleans water by dilution; plants clean it by design.',
    stages: [
      { name: 'Intake & Screening', desc: 'Raw water is drawn from river/reservoir and large debris is screened out.', equipment: ['Bar screens', 'Intake pumps', 'Grit chambers'], hse: 'Water/confined space, lifting, pump energy isolation.' },
      { name: 'Coagulation & Flocculation', desc: 'Chemicals make fine particles clump into settleable flocs.', equipment: ['Rapid mixers', 'Flocculators', 'Dosing skids'], hse: 'Chemical dosing (alum, polymer) skin/eye hazards.' },
      { name: 'Sedimentation & Filtration', desc: 'Flocs settle and the clear water is filtered through sand or membranes.', equipment: ['Clarifiers', 'Sand filters', 'UF/RO skids'], hse: 'Confined-space entry, chemical cleaning of membranes.' },
      { name: 'Disinfection', desc: 'Chlorine, ozone or UV inactivates pathogens before distribution.', equipment: ['Chlorine dosing', 'Ozone generators', 'UV banks'], hse: 'Chlorine gas toxicity — gas-tight rooms, emergency scrubbers.' },
      { name: 'Distribution', desc: 'Treated water is stored and pumped into the network.', equipment: ['Clear wells', 'Distribution pumps', 'SCADA'], hse: 'Residual chlorine handling, pump-room noise & electrical safety.' },
    ],
    aspects: {
      raw: 'Raw surface/ground water, coagulants, disinfectants, membrane chemicals.',
      process: 'Screening → coagulation → settling → filtration → disinfection.',
      equipment: 'Clarifiers, filters, RO trains, ozone/UV systems, pumps, SCADA.',
      utilities: 'Power, chemical storage, air scour, backwash water.',
      control: 'SCADA with turbidity, chlorine residual, pH and flow control.',
      hse: 'Chlorine/ozone hazards, confined spaces, chemical handling, electrical safety.',
      products: 'Safe drinking water at potable standards; wastewater as reusable resource.',
      waste: 'Sludge, membrane concentrate/brine, spent chemicals, backwash water.',
    },
  },
];
// ─── Explorer tab: pick an industry, walk its process train ─────────────────
const ASPECT_META: { key: keyof IndustryAspects; label: string; icon: LucideIcon; color: string; desc: string }[] = [
  { key: 'raw', label: 'Raw Materials', icon: Truck, color: '#f59e0b', desc: 'What goes in' },
  { key: 'process', label: 'Process', icon: Wind, color: '#0ea5e9', desc: 'How it converts' },
  { key: 'equipment', label: 'Equipment', icon: Cog, color: '#64748b', desc: 'What does the work' },
  { key: 'utilities', label: 'Utilities', icon: Zap, color: '#eab308', desc: 'Steam, power, water, air' },
  { key: 'control', label: 'Control', icon: Gauge, color: '#8b5cf6', desc: 'How it is regulated' },
  { key: 'hse', label: 'HSE', icon: ShieldCheck, color: '#ef4444', desc: 'Risks & protection' },
  { key: 'products', label: 'Products', icon: Package, color: '#10b981', desc: 'What goes out' },
  { key: 'waste', label: 'Waste & By-products', icon: Recycle, color: '#78716c', desc: 'What must be managed' },
];

function ExplorerTab() {
  const [sel, setSel] = useState('cement');
  const [stage, setStage] = useState(0);
  const ind = INDUSTRIES.find(i => i.id === sel) ?? INDUSTRIES[0];
  const s = ind.stages[Math.min(stage, ind.stages.length - 1)];
  return (
    <>
      <div className="mb-6">
        <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
          <Compass className="w-6 h-6 text-blue-500" /> Industry Explorer
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Pick an industry, then walk its process train stage by stage — every aspect from raw materials to waste.</p>
      </div>

      {/* industry picker */}
      <div className="flex flex-wrap gap-2 mb-6">
        {INDUSTRIES.map(i => (
          <button key={i.id} onClick={() => { setSel(i.id); setStage(0); }}
            className={`px-3 py-2 rounded-xl text-xs font-black flex items-center gap-2 border transition-all ${sel === i.id
              ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/25'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-blue-400'}`}>
            {i.icon}
            {i.name}
          </button>
        ))}
      </div>

      {/* header */}
      <div className="glass rounded-2xl border border-slate-200 dark:border-slate-800 p-6 mb-6">
        <div className="flex items-center gap-4 mb-2">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white" style={{ background: ind.color }}>
            {ind.icon}
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-800 dark:text-white">{ind.name}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 italic">{ind.tagline}</p>
          </div>
        </div>
        <IndustryTrain stages={ind.stages} selected={stage} onSelect={setStage} />
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* stage detail */}
        <CalcCard title={`Stage ${stage + 1} · ${s.name}`} icon={Map}>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">{s.desc}</p>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Typical equipment</p>
          <div className="flex flex-wrap gap-2 mb-4">
            {s.equipment.map(e => (
              <span key={e} className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                <Cog className="w-3 h-3 text-slate-400" /> {e}
              </span>
            ))}
          </div>
          <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-red-700 dark:text-red-300">{s.hse}</p>
          </div>
          <div className="flex items-center justify-between mt-4">
            <button disabled={stage === 0} onClick={() => setStage(stage - 1)}
              className="px-3 py-2 rounded-xl text-xs font-black bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-30 hover:bg-slate-200 transition-all">
              ← Prev stage
            </button>
            <span className="text-[10px] font-black text-slate-400">{stage + 1} / {ind.stages.length}</span>
            <button disabled={stage >= ind.stages.length - 1} onClick={() => setStage(stage + 1)}
              className="px-3 py-2 rounded-xl text-xs font-black bg-blue-600 text-white disabled:opacity-30 hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/25 flex items-center gap-1">
              Next stage <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </CalcCard>

        {/* aspects grid */}
        <CalcCard title="8 aspects of the industry" icon={Layers}>
          <div className="grid grid-cols-2 gap-3">
            {ASPECT_META.map(a => {
              const A = a.icon;
              return (
                <div key={a.key} className="rounded-xl border border-slate-200 dark:border-slate-800 p-3 hover:border-blue-400 transition-all">
                  <div className="flex items-center gap-2 mb-1.5">
                    <A className="w-4 h-4" style={{ color: a.color }} />
                    <p className="text-[11px] font-black text-slate-700 dark:text-slate-200">{a.label}</p>
                  </div>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1">{a.desc}</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">{ind.aspects[a.key]}</p>
                </div>
              );
            })}
          </div>
        </CalcCard>
      </div>
    </>
  );
}
// ─── Compare tab: two industries side by side ───────────────────────────────
function CompareTab() {
  const [aId, setAId] = useState('cement');
  const [bId, setBId] = useState('pharma');
  const A = INDUSTRIES.find(i => i.id === aId) ?? INDUSTRIES[0];
  const B = INDUSTRIES.find(i => i.id === bId) ?? INDUSTRIES[1];
  const rows: { label: string; av: string; bv: string }[] = [
    { label: 'Tagline', av: A.tagline, bv: B.tagline },
    { label: 'Process stages', av: A.stages.map(s => s.name).join(' → '), bv: B.stages.map(s => s.name).join(' → ') },
    { label: 'Raw materials', av: A.aspects.raw, bv: B.aspects.raw },
    { label: 'Core process', av: A.aspects.process, bv: B.aspects.process },
    { label: 'Key equipment', av: A.aspects.equipment, bv: B.aspects.equipment },
    { label: 'Utilities', av: A.aspects.utilities, bv: B.aspects.utilities },
    { label: 'Control strategy', av: A.aspects.control, bv: B.aspects.control },
    { label: 'HSE focus', av: A.aspects.hse, bv: B.aspects.hse },
    { label: 'Products', av: A.aspects.products, bv: B.aspects.products },
    { label: 'Waste streams', av: A.aspects.waste, bv: B.aspects.waste },
  ];
  const pick = (val: string, setter: (v: string) => void, exclude: string) => (
    <select value={val} onChange={e => setter(e.target.value)}
      className="w-full px-3 py-2 rounded-xl text-xs font-black bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500">
      {INDUSTRIES.filter(i => i.id !== exclude).map(i => (
        <option key={i.id} value={i.id}>{i.name}</option>
      ))}
    </select>
  );
  return (
    <>
      <div className="mb-6">
        <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
          <ArrowRight className="w-6 h-6 text-emerald-500" /> Industry Compare
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Side-by-side the raw inputs, process, equipment, HSE and products of any two industries.</p>
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 mb-6">
        {pick(aId, setAId, bId)}
        <span className="text-[10px] font-black text-slate-400 px-2">VS</span>
        {pick(bId, setBId, aId)}
      </div>
      <div className="space-y-3">
        {rows.map(r => (
          <div key={r.label} className="grid md:grid-cols-[140px_1fr_1fr] gap-3 rounded-xl border border-slate-200 dark:border-slate-800 p-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center">{r.label}</p>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed border-l-2 pl-3 border-blue-400">{r.av}</p>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed border-l-2 pl-3 border-emerald-400">{r.bv}</p>
          </div>
        ))}
      </div>
      <InfoNote>Comparing industries is how engineers steal good ideas: a water-treatment plant uses the same filtration thinking as a pharma cleanroom, and a refinery's control room is a DCS twin of a power plant's.</InfoNote>
    </>
  );
}
// ─── Glossary tab ───────────────────────────────────────────────────────────
const TERMS: { term: string; def: string; tag: string }[] = [
  { term: 'Feedstock', def: 'The raw input material fed into a process — crude oil, ore, monomer or grain.', tag: 'basics' },
  { term: 'Unit operation', def: 'A single physical step: distillation, filtration, drying, heat exchange, pumping.', tag: 'basics' },
  { term: 'Unit process', def: 'A chemical transformation step — a reactor converting A + B into C.', tag: 'basics' },
  { term: 'Batch vs Continuous', def: 'Batch: make discrete lots with start/end (pharma, specialty). Continuous: steady 24/7 flow (refining, bulk).', tag: 'basics' },
  { term: 'Utilities', def: 'The service systems every plant shares: steam, cooling water, instrument air, nitrogen, power.', tag: 'basics' },
  { term: 'PFD', def: 'Process Flow Diagram — the big picture: major equipment, streams and heat/material balances.', tag: 'drawings' },
  { term: 'P&ID', def: 'Piping & Instrumentation Diagram — every pipe, valve, instrument and control loop in detail.', tag: 'drawings' },
  { term: 'DCS', def: 'Distributed Control System — the computer network that operates a continuous plant.', tag: 'control' },
  { term: 'SCADA', def: 'Supervisory Control & Data Acquisition — remote monitoring/control, common in utilities.', tag: 'control' },
  { term: 'PLC', def: 'Programmable Logic Controller — rugged controllers for discrete/machine control.', tag: 'control' },
  { term: 'CIP / SIP', def: 'Clean-In-Place / Steam-In-Place — automated washing and sterilising of process lines without dismantling.', tag: 'quality' },
  { term: 'WFI', def: 'Water for Injection — the purest water grade, used in pharmaceutical manufacturing.', tag: 'quality' },
  { term: 'GMP', def: 'Good Manufacturing Practice — the regulated quality system for pharma, food and medical devices.', tag: 'quality' },
  { term: 'HACCP', def: 'Hazard Analysis & Critical Control Points — the food-industry food-safety system.', tag: 'quality' },
  { term: 'ATEX', def: 'Atmospheres Explosibles — zones where explosive dust/gas can form; equipment must be rated for them.', tag: 'safety' },
  { term: 'LEL / UEL', def: 'Lower/Upper Explosive Limit — the flammable window of a vapour concentration in air.', tag: 'safety' },
  { term: 'TLV / TWA', def: 'Threshold Limit Value / Time-Weighted Average — the safe 8-hour exposure limit of a chemical.', tag: 'safety' },
  { term: 'VOC', def: 'Volatile Organic Compound — evaporating solvents that form smog and need recovery/control.', tag: 'environment' },
  { term: 'BOD / COD', def: 'Biochemical / Chemical Oxygen Demand — how much oxygen wastewater consumes; effluent-load yardsticks.', tag: 'environment' },
  { term: 'ETP', def: 'Effluent Treatment Plant — the on-site wastewater clean-up before discharge or reuse.', tag: 'environment' },
  { term: 'ZLD', def: 'Zero Liquid Discharge — recovering and reusing all water so nothing is discharged.', tag: 'environment' },
  { term: 'Debottlenecking', def: 'Finding and removing the single capacity-limiting step to raise plant throughput.', tag: 'business' },
  { term: 'Co-generation (CHP)', def: 'Making electricity AND useful steam from one fuel — the classic plant efficiency win.', tag: 'business' },
  { term: 'Energy intensity', def: 'Energy consumed per tonne of product — the metric every plant is trying to shrink.', tag: 'business' },
];

function GlossaryTab() {
  const [q, setQ] = useState('');
  const terms = TERMS.filter(t => t.term.toLowerCase().includes(q.toLowerCase()) || t.def.toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <div className="mb-6">
        <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
          <BookOpen className="w-6 h-6 text-amber-500" /> Plant Vocabulary
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">The 24 terms every process engineer must be able to drop in an interview.</p>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search terms… e.g. LEL, DCS, CIP"
          className="mt-4 w-full max-w-md px-4 py-2.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        {terms.map(t => (
          <div key={t.term} className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 hover:border-amber-400 hover:shadow-lg hover:shadow-amber-500/5 transition-all">
            <div className="flex items-center gap-2 mb-1">
              <ChevronRight className="w-4 h-4 text-amber-500" />
              <p className="text-sm font-black text-slate-800 dark:text-white">{t.term}</p>
              <span className="ml-auto px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[9px] font-black uppercase tracking-widest text-slate-400">{t.tag}</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">{t.def}</p>
          </div>
        ))}
        {terms.length === 0 && <p className="text-xs text-slate-400 py-8 text-center col-span-2">No terms match “{q}” — try LEL, CIP or DCS.</p>}
      </div>
    </>
  );
}

// ─── Module shell & tabs ────────────────────────────────────────────────────
const TABS = [
  { id: 'explorer', label: 'Explorer', icon: Compass },
  { id: 'compare', label: 'Compare', icon: ArrowRight },
  { id: 'glossary', label: 'Glossary', icon: BookOpen },
] as const;

type TabId = (typeof TABS)[number]['id'];

export default function IndustrialKnowledgeModule() {
  const [tab, setTab] = useState<TabId>('explorer');
  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-1">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 text-white flex items-center justify-center shadow-lg shadow-sky-500/25">
            <Factory className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 dark:text-white">Industrial Knowledge</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">11 industry learning paths — walk the process train, compare industries, speak the language.</p>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 mb-8">
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 border transition-all ${tab === t.id
                ? 'bg-sky-600 border-sky-600 text-white shadow-lg shadow-sky-500/25'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-sky-400'}`}>
              <Icon className="w-4 h-4" /> {t.label}
            </button>
          );
        })}
      </div>
      {tab === 'explorer' && <ExplorerTab />}
      {tab === 'compare' && <CompareTab />}
      {tab === 'glossary' && <GlossaryTab />}
    </div>
  );
}
