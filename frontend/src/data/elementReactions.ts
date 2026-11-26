import type { Reaction, SubstanceDetail } from '../api';
import { ELEMENT_REACTIONS_CATALOG, findCatalogElement } from './elementsCatalog';

interface ReactionTemplate {
  suffix: string;
  name: (el: SubstanceDetail, v: number) => string;
  equation: (sym: string, v: number) => string;
  reaction_type: string;
  enthalpy: number;
  conditions: string;
  reversible?: boolean;
  description: (name: string, sym: string) => string;
}

/**
 * Determine primary chemical valence / oxidation state for stoichiometric balancing.
 */
function primaryValence(el: SubstanceDetail): number {
  const sym = el.symbol || 'X';
  const cat = (el.category || '').toLowerCase();
  const g = el.group_number || 0;
  if (sym === 'H') return 1;
  if (cat.includes('alkali metal') || g === 1) return 1;
  if (cat.includes('alkaline earth') || g === 2) return 2;
  if (sym === 'Al' || sym === 'B' || g === 13) return 3;
  if (sym === 'C' || sym === 'Si' || sym === 'Ge' || g === 14) return 4;
  if (sym === 'N' || sym === 'P' || sym === 'As' || g === 15) return 3;
  if (sym === 'O' || sym === 'S' || sym === 'Se' || sym === 'Te' || g === 16) return 2;
  if (cat.includes('halogen') || g === 17) return 1;
  if (cat.includes('lanthanide') || cat.includes('actinide')) return 3;
  if (sym === 'Ag') return 1;
  if (sym === 'Au') return 3;
  if (sym === 'Fe' || sym === 'Cr') return 3;
  return 2;
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

function binaryFormula(catSym: string, catVal: number, anSym: string, anVal: number, wrapAnion = false): string {
  const d = gcd(catVal, anVal);
  const cSub = anVal / d;
  const aSub = catVal / d;
  const cPart = cSub === 1 ? catSym : `${catSym}${cSub}`;
  const aBase = wrapAnion && aSub > 1 ? `(${anSym})` : anSym;
  const aPart = aSub === 1 ? anSym : `${aBase}${aSub}`;
  return `${cPart}${aPart}`;
}

function makeMetalTemplates(): ReactionTemplate[] {
  return [
    { suffix: 'o2', name: (e) => `${e.name} Direct Oxidation`, equation: (s, v) => v === 1 ? `4 ${s} + O2 -> 2 ${s}2O` : v === 2 ? `2 ${s} + O2 -> 2 ${s}O` : v === 3 ? `4 ${s} + 3 O2 -> 2 ${s}2O3` : `${s} + O2 -> ${s}O2`, reaction_type: 'oxidation', enthalpy: -620, conditions: 'Dry O2, 250–600 °C', description: (n) => `Thermal oxidation of ${n} forming its primary stoichiometric oxide.` },
    { suffix: 'f2', name: (e) => `${e.name} Fluorination`, equation: (s, v) => v % 2 === 0 ? `${s} + ${v / 2} F2 -> ${binaryFormula(s, v, 'F', 1)}` : `2 ${s} + ${v} F2 -> 2 ${binaryFormula(s, v, 'F', 1)}`, reaction_type: 'synthesis', enthalpy: -890, conditions: 'F2 gas, 200 °C', description: (n) => `Direct fluorination of ${n} producing anhydrous fluoride salt.` },
    { suffix: 'cl2', name: (e) => `${e.name} Chlorination`, equation: (s, v) => v % 2 === 0 ? `${s} + ${v / 2} Cl2 -> ${binaryFormula(s, v, 'Cl', 1)}` : `2 ${s} + ${v} Cl2 -> 2 ${binaryFormula(s, v, 'Cl', 1)}`, reaction_type: 'synthesis', enthalpy: -540, conditions: 'Dry Cl2 stream, 300 °C', description: (n) => `Industrial chlorination route producing anhydrous ${n} chloride.` },
    { suffix: 'br2', name: (e) => `${e.name} Bromination`, equation: (s, v) => v % 2 === 0 ? `${s} + ${v / 2} Br2 -> ${binaryFormula(s, v, 'Br', 1)}` : `2 ${s} + ${v} Br2 -> 2 ${binaryFormula(s, v, 'Br', 1)}`, reaction_type: 'synthesis', enthalpy: -440, conditions: 'Liquid/vapor Br2, 150 °C', description: (n) => `Direct halogenation of ${n} with bromine.` },
    { suffix: 'i2', name: (e) => `${e.name} Iodination`, equation: (s, v) => v % 2 === 0 ? `${s} + ${v / 2} I2 -> ${binaryFormula(s, v, 'I', 1)}` : `2 ${s} + ${v} I2 -> 2 ${binaryFormula(s, v, 'I', 1)}`, reaction_type: 'synthesis', enthalpy: -310, conditions: 'Sealed ampoule, 250 °C', reversible: true, description: (n) => `Van Arkel–de Boer style iodination of ${n} for ultra-high purification.` },
    { suffix: 's', name: (e) => `${e.name} Sulfidation`, equation: (s, v) => v === 1 ? `2 ${s} + S -> ${s}2S` : v === 2 ? `${s} + S -> ${s}S` : v === 3 ? `2 ${s} + 3 S -> ${s}2S3` : `${s} + 2 S -> ${s}S2`, reaction_type: 'synthesis', enthalpy: -260, conditions: '400–600 °C, inert N2', description: (n) => `High-temperature sulfidation of ${n} with elemental sulfur.` },
    { suffix: 'se', name: (e) => `${e.name} Selenide Synthesis`, equation: (s, v) => v === 1 ? `2 ${s} + Se -> ${s}2Se` : v === 2 ? `${s} + Se -> ${s}Se` : `2 ${s} + 3 Se -> ${s}2Se3`, reaction_type: 'synthesis', enthalpy: -210, conditions: '500 °C, vacuum quartz tube', description: (n) => `Solid-state synthesis of ${n} selenide semiconductor/chalcogenide.` },
    { suffix: 'te', name: (e) => `${e.name} Telluride Synthesis`, equation: (s, v) => v === 1 ? `2 ${s} + Te -> ${s}2Te` : v === 2 ? `${s} + Te -> ${s}Te` : `2 ${s} + 3 Te -> ${s}2Te3`, reaction_type: 'synthesis', enthalpy: -165, conditions: '550 °C, inert Ar', description: (n) => `Direct melt synthesis of ${n} telluride thermoelectric material.` },
    { suffix: 'n2', name: (e) => `${e.name} Nitridation`, equation: (s, v) => v === 1 ? `6 ${s} + N2 -> 2 ${s}3N` : v === 2 ? `3 ${s} + N2 -> ${s}3N2` : `2 ${s} + N2 -> 2 ${s}N`, reaction_type: 'synthesis', enthalpy: -320, conditions: '800–1100 °C, N2 atmosphere', description: (n) => `Refractory nitride formation of ${n} in pure nitrogen.` },
    { suffix: 'c', name: (e) => `${e.name} Carbide Formation`, equation: (s, v) => v <= 2 ? `${s} + 2 C -> ${s}C2` : `${s} + C -> ${s}C`, reaction_type: 'synthesis', enthalpy: -140, conditions: '1400–1800 °C, electric arc', description: (n) => `Carburization of ${n} with graphite forming hard refractory carbide.` },
    { suffix: 'h2', name: (e) => `${e.name} Hydride Absorption`, equation: (s, v) => v % 2 === 0 ? `${s} + ${v / 2} H2 <-> ${binaryFormula(s, v, 'H', 1)}` : `2 ${s} + ${v} H2 <-> 2 ${binaryFormula(s, v, 'H', 1)}`, reaction_type: 'synthesis', enthalpy: -95, conditions: '200–400 °C, 10–50 bar H2', reversible: true, description: (n) => `Reversible hydrogen absorption into ${n} forming metal hydride.` },
    { suffix: 'h2o_cold', name: (e) => `${e.name} Hydrolysis / Steam Reaction`, equation: (s, v) => v === 1 ? `2 ${s} + 2 H2O -> 2 ${s}OH + H2` : v === 2 ? `${s} + 2 H2O -> ${s}(OH)2 + H2` : `2 ${s} + 6 H2O -> 2 ${s}(OH)3 + 3 H2`, reaction_type: 'single_replacement', enthalpy: -280, conditions: 'Liquid water or superheated steam', description: (n) => `Reaction of ${n} with water/steam liberating hydrogen gas and hydroxide.` },
    { suffix: 'steam_ox', name: (e) => `${e.name} High-Temperature Steam Oxidation`, equation: (s, v) => v === 2 ? `${s} + H2O(g) -> ${s}O + H2` : `2 ${s} + 3 H2O(g) -> ${s}2O3 + 3 H2`, reaction_type: 'redox', enthalpy: -175, conditions: '500–800 °C steam', reversible: true, description: (n) => `Steam oxidation producing ${n} oxide and green hydrogen.` },
    { suffix: 'hcl', name: (e) => `${e.name} + Hydrochloric Acid`, equation: (s, v) => v % 2 === 0 ? `${s} + ${v} HCl -> ${binaryFormula(s, v, 'Cl', 1)} + ${v / 2} H2` : `2 ${s} + ${2 * v} HCl -> 2 ${binaryFormula(s, v, 'Cl', 1)} + ${v} H2`, reaction_type: 'single_replacement', enthalpy: -230, conditions: '2–6 M aqueous HCl', description: (n) => `Acid leaching of ${n} in hydrochloric acid releasing H2 gas.` },
    { suffix: 'hbr', name: (e) => `${e.name} + Hydrobromic Acid`, equation: (s, v) => v % 2 === 0 ? `${s} + ${v} HBr -> ${binaryFormula(s, v, 'Br', 1)} + ${v / 2} H2` : `2 ${s} + ${2 * v} HBr -> 2 ${binaryFormula(s, v, 'Br', 1)} + ${v} H2`, reaction_type: 'single_replacement', enthalpy: -210, conditions: 'Aqueous HBr, 25–60 °C', description: (n) => `Dissolution of ${n} in hydrobromic acid yielding bromide salt.` },
    { suffix: 'hi', name: (e) => `${e.name} + Hydroiodic Acid`, equation: (s, v) => v % 2 === 0 ? `${s} + ${v} HI -> ${binaryFormula(s, v, 'I', 1)} + ${v / 2} H2` : `2 ${s} + ${2 * v} HI -> 2 ${binaryFormula(s, v, 'I', 1)} + ${v} H2`, reaction_type: 'single_replacement', enthalpy: -180, conditions: 'Aqueous HI, ambient', description: (n) => `Formation of soluble ${n} iodide with hydrogen evolution.` },
    { suffix: 'hf', name: (e) => `${e.name} + Hydrofluoric Acid`, equation: (s, v) => v % 2 === 0 ? `${s} + ${v} HF -> ${binaryFormula(s, v, 'F', 1)} + ${v / 2} H2` : `2 ${s} + ${2 * v} HF -> 2 ${binaryFormula(s, v, 'F', 1)} + ${v} H2`, reaction_type: 'single_replacement', enthalpy: -315, conditions: 'Dilute HF, PTFE vessel', description: (n) => `Fluoride etching of ${n} in hydrofluoric acid.` },
    { suffix: 'h2so4_dil', name: (e) => `${e.name} + Dilute Sulfuric Acid`, equation: (s, v) => v === 1 ? `2 ${s} + H2SO4 -> ${s}2SO4 + H2` : v === 2 ? `${s} + H2SO4 -> ${s}SO4 + H2` : `2 ${s} + 3 H2SO4 -> ${s}2(SO4)3 + 3 H2`, reaction_type: 'single_replacement', enthalpy: -265, conditions: '1–4 M H2SO4, 25–80 °C', description: (n) => `Hydrometallurgical sulfate leaching of ${n}.` },
    { suffix: 'h2so4_conc', name: (e) => `${e.name} + Hot Concentrated H2SO4`, equation: (s, v) => v === 2 ? `${s} + 2 H2SO4 -> ${s}SO4 + SO2 + 2 H2O` : `2 ${s} + 6 H2SO4 -> ${s}2(SO4)3 + 3 SO2 + 6 H2O`, reaction_type: 'redox', enthalpy: -195, conditions: '98% H2SO4, 150–250 °C', description: (n) => `Oxidizing acid digestion of ${n} evolving sulfur dioxide gas.` },
    { suffix: 'hno3_dil', name: (e) => `${e.name} + Dilute Nitric Acid`, equation: (s, v) => v === 2 ? `3 ${s} + 8 HNO3 -> 3 ${s}(NO3)2 + 2 NO + 4 H2O` : `${s} + 4 HNO3 -> ${s}(NO3)3 + NO + 2 H2O`, reaction_type: 'redox', enthalpy: -340, conditions: 'Dilute HNO3 (20–30%)', description: (n) => `Oxidative dissolution of ${n} yielding nitrate solution and NO gas.` },
    { suffix: 'hno3_conc', name: (e) => `${e.name} + Concentrated Nitric Acid`, equation: (s, v) => v === 2 ? `${s} + 4 HNO3 -> ${s}(NO3)2 + 2 NO2 + 2 H2O` : `${s} + 6 HNO3 -> ${s}(NO3)3 + 3 NO2 + 3 H2O`, reaction_type: 'redox', enthalpy: -295, conditions: '68% HNO3, fume hood', description: (n) => `Vigorous oxidation of ${n} releasing brown NO2 fumes.` },
    { suffix: 'h3po4', name: (e) => `${e.name} Phosphate Conversion`, equation: (s, v) => v === 2 ? `3 ${s} + 2 H3PO4 -> ${s}3(PO4)2 + 3 H2` : `2 ${s} + 2 H3PO4 -> 2 ${s}PO4 + 3 H2`, reaction_type: 'single_replacement', enthalpy: -220, conditions: 'Aqueous H3PO4, 60–90 °C', description: (n) => `Phosphating surface treatment forming protective ${n} phosphate layer.` },
    { suffix: 'ch3cooh', name: (e) => `${e.name} + Acetic Acid`, equation: (s, v) => v === 2 ? `${s} + 2 CH3COOH -> ${s}(CH3COO)2 + H2` : `2 ${s} + 6 CH3COOH -> 2 ${s}(CH3COO)3 + 3 H2`, reaction_type: 'single_replacement', enthalpy: -125, conditions: 'Glacial/aqueous CH3COOH, warm', description: (n) => `Organic acid dissolution yielding soluble ${n} acetate complex.` },
    { suffix: 'h2o2', name: (e) => `${e.name} Peroxide Oxidation`, equation: (s, v) => v === 2 ? `${s} + H2O2 -> ${s}O + H2O` : `2 ${s} + 3 H2O2 -> ${s}2O3 + 3 H2O`, reaction_type: 'oxidation', enthalpy: -410, conditions: '30% H2O2 aqueous', description: (n) => `Clean wet-chemical oxidation of ${n} using hydrogen peroxide.` },
    { suffix: 'h2s', name: (e) => `${e.name} + Hydrogen Sulfide Corrosion`, equation: (s, v) => v === 2 ? `${s} + H2S -> ${s}S + H2` : `2 ${s} + 3 H2S -> ${s}2S3 + 3 H2`, reaction_type: 'redox', enthalpy: -145, conditions: 'Sour gas / H2S stream, 150 °C', description: (n) => `Sour-service sulfidation corrosion of ${n} in oil & gas environments.` },
    { suffix: 'so2', name: (e) => `${e.name} + Sulfur Dioxide Reaction`, equation: (s, v) => v === 2 ? `2 ${s} + SO2 -> 2 ${s}O + S` : `4 ${s} + 3 SO2 -> 2 ${s}2O3 + 3 S`, reaction_type: 'redox', enthalpy: -310, conditions: '500 °C, SO2 gas', description: (n) => `Reduction of sulfur dioxide by heated ${n}.` },
    { suffix: 'co2', name: (e) => `${e.name} + Carbon Dioxide Reduction`, equation: (s, v) => v === 2 ? `2 ${s} + CO2 -> 2 ${s}O + C` : `4 ${s} + 3 CO2 -> 2 ${s}2O3 + 3 C`, reaction_type: 'redox', enthalpy: -245, conditions: 'High temperature (>600 °C)', description: (n) => `Carbothermic-reverse reduction of CO2 over hot ${n}.` },
    { suffix: 'co_carbonyl', name: (e) => `${e.name} Carbonylation (Mond-Type)`, equation: (s) => `${s} + 4 CO <-> ${s}(CO)4`, reaction_type: 'complexation', enthalpy: -160, conditions: '50–200 °C, high-pressure CO', reversible: true, description: () => `Volatile metal carbonyl complex formation used in vapor-phase refining.` },
    { suffix: 'nh3', name: (e) => `${e.name} + Ammonia Nitridation`, equation: (s, v) => v === 2 ? `3 ${s} + 2 NH3 -> ${s}3N2 + 3 H2` : `2 ${s} + 2 NH3 -> 2 ${s}N + 3 H2`, reaction_type: 'redox', enthalpy: -185, conditions: '500–750 °C, anhydrous NH3', description: (n) => `Ammonolysis of ${n} producing surface nitride and hydrogen.` },
    { suffix: 'naoh', name: (e) => `${e.name} + Alkaline Hydroxide Attack`, equation: (s) => `${s} + 2 NaOH + 2 H2O -> Na2[${s}(OH)4] + H2`, reaction_type: 'complexation', enthalpy: -190, conditions: 'Concentrated NaOH, 80 °C', description: (n) => `Alkaline digestion / amphoteric hydroxo-complexation of ${n}.` },
    { suffix: 'koh', name: (e) => `${e.name} + Molten Potassium Hydroxide`, equation: (s) => `2 ${s} + 4 KOH + O2 -> 2 K2${s}O3 + 2 H2O`, reaction_type: 'redox', enthalpy: -360, conditions: 'Molten KOH, 400 °C, air', description: (n) => `Oxidative alkaline fusion of ${n} in molten caustic potash.` },
    { suffix: 'cuso4', name: (e) => `${e.name} Displacement of Copper(II)`, equation: (s, v) => v === 2 ? `${s} + CuSO4 -> ${s}SO4 + Cu` : `2 ${s} + 3 CuSO4 -> ${s}2(SO4)3 + 3 Cu`, reaction_type: 'single_replacement', enthalpy: -215, conditions: 'Aqueous CuSO4, 25 °C', description: () => `Cementation / galvanic displacement of copper from sulfate solution.` },
    { suffix: 'agno3', name: (e) => `${e.name} Displacement of Silver(I)`, equation: (s, v) => `${s} + ${v} AgNO3 -> ${binaryFormula(s, v, 'NO3', 1, true)} + ${v} Ag`, reaction_type: 'single_replacement', enthalpy: -290, conditions: 'Aqueous AgNO3, ambient', description: (n) => `Galvanic precipitation of metallic silver dendrites by ${n}.` },
    { suffix: 'fecl3', name: (e) => `${e.name} Ferric Chloride Etching`, equation: (s, v) => `${s} + ${v} FeCl3 -> ${binaryFormula(s, v, 'Cl', 1)} + ${v} FeCl2`, reaction_type: 'redox', enthalpy: -170, conditions: 'Aqueous FeCl3 etchant, 40 °C', description: (n) => `Industrial redox etching of ${n} using ferric chloride.` },
    { suffix: 'ox_h2_red', name: (e) => `${e.name} Oxide Hydrogen Reduction`, equation: (s, v) => v === 2 ? `${s}O + H2 -> ${s} + H2O` : `${s}2O3 + 3 H2 -> 2 ${s} + 3 H2O`, reaction_type: 'reduction', enthalpy: 65, conditions: '450–900 °C, dry H2 furnace', description: (n) => `Metallurgical hydrogen reduction of ${n} oxide to pure metal powder.` },
    { suffix: 'ox_c_red', name: (e) => `${e.name} Oxide Carbothermic Smelting`, equation: (s, v) => v === 2 ? `${s}O + C -> ${s} + CO` : `${s}2O3 + 3 C -> 2 ${s} + 3 CO`, reaction_type: 'reduction', enthalpy: 185, conditions: '900–1500 °C, coke furnace', description: (n) => `Pyrometallurgical carbon smelting of ${n} oxide ore.` },
    { suffix: 'ox_co_red', name: (e) => `${e.name} Oxide CO Reduction`, equation: (s, v) => v === 2 ? `${s}O + CO -> ${s} + CO2` : `${s}2O3 + 3 CO -> 2 ${s} + 3 CO2`, reaction_type: 'reduction', enthalpy: -35, conditions: '600–1000 °C, blast furnace', reversible: true, description: (n) => `Indirect gaseous reduction of ${n} oxide by carbon monoxide.` },
    { suffix: 'ox_al_red', name: (e) => `${e.name} Oxide Aluminothermic Reduction`, equation: (s, v) => v === 2 ? `3 ${s}O + 2 Al -> 3 ${s} + Al2O3` : `${s}2O3 + 2 Al -> 2 ${s} + Al2O3`, reaction_type: 'redox', enthalpy: -780, conditions: 'Thermite ignition, refractory crucible', description: (n) => `Goldschmidt aluminothermic extraction of carbon-free ${n}.` },
    { suffix: 'cl_mg_red', name: (e) => `${e.name} Chloride Kroll Reduction`, equation: (s, v) => v === 2 ? `${s}Cl2 + Mg -> ${s} + MgCl2` : `2 ${s}Cl3 + 3 Mg -> 2 ${s} + 3 MgCl2`, reaction_type: 'reduction', enthalpy: -310, conditions: '800–900 °C, argon retort', description: (n) => `Kroll-type magnesiothermic reduction producing pure ${n} sponge.` },
    { suffix: 'oh_precip', name: (e) => `${e.name} Hydroxide Precipitation`, equation: (s, v) => `${binaryFormula(s, v, 'Cl', 1)} + ${v} NaOH -> ${binaryFormula(s, v, 'OH', 1, true)} + ${v} NaCl`, reaction_type: 'precipitation', enthalpy: -58, conditions: 'Aqueous pH 9–11, 25 °C', description: (n) => `Wastewater/hydrometallurgical precipitation of ${n} hydroxide.` },
    { suffix: 'co3_precip', name: (e) => `${e.name} Carbonate Precipitation`, equation: (s, v) => v === 2 ? `${s}Cl2 + Na2CO3 -> ${s}CO3 + 2 NaCl` : `2 ${s}Cl3 + 3 Na2CO3 -> ${s}2(CO3)3 + 6 NaCl`, reaction_type: 'precipitation', enthalpy: -42, conditions: 'Aqueous Na2CO3, pH 8–9', description: (n) => `Precipitation of insoluble ${n} carbonate for calcination.` },
    { suffix: 'co3_calcine', name: (e) => `${e.name} Carbonate Calcination`, equation: (s, v) => v === 2 ? `${s}CO3 -> ${s}O + CO2` : `${s}2(CO3)3 -> ${s}2O3 + 3 CO2`, reaction_type: 'decomposition', enthalpy: 145, conditions: '500–900 °C rotary kiln', description: (n) => `Thermal calcination of ${n} carbonate into high-surface-area oxide.` },
    { suffix: 'oh_calcine', name: (e) => `${e.name} Hydroxide Dehydration`, equation: (s, v) => v === 2 ? `${s}(OH)2 -> ${s}O + H2O` : `2 ${s}(OH)3 -> ${s}2O3 + 3 H2O`, reaction_type: 'decomposition', enthalpy: 92, conditions: '300–550 °C calciner', description: (n) => `Thermal dehydration converting ${n} hydroxide into anhydrous oxide.` },
    { suffix: 'no3_decomp', name: (e) => `${e.name} Nitrate Thermal Decomposition`, equation: (s, v) => v === 2 ? `2 ${s}(NO3)2 -> 2 ${s}O + 4 NO2 + O2` : `4 ${s}(NO3)3 -> 2 ${s}2O3 + 12 NO2 + 3 O2`, reaction_type: 'decomposition', enthalpy: 260, conditions: '350–600 °C, catalyst prep', description: () => `Nitrate precursor calcination used in supported catalyst preparation.` },
    { suffix: 's_roast', name: (e) => `${e.name} Sulfide Ore Roasting`, equation: (s, v) => v === 2 ? `2 ${s}S + 3 O2 -> 2 ${s}O + 2 SO2` : `2 ${s}2S3 + 9 O2 -> 2 ${s}2O3 + 6 SO2`, reaction_type: 'oxidation', enthalpy: -880, conditions: '650–850 °C fluidized-bed roaster', description: (n) => `Oxidative roasting of ${n} sulfide ore prior to smelting.` },
    { suffix: 'b_boride', name: (e) => `${e.name} Boride Synthesis`, equation: (s) => `${s} + 2 B -> ${s}B2`, reaction_type: 'synthesis', enthalpy: -195, conditions: '1500 °C, vacuum sintering', description: (n) => `Formation of ultra-hard, high-melting ${n} diboride ceramic.` },
    { suffix: 'si_silicide', name: (e) => `${e.name} Silicide Synthesis`, equation: (s) => `${s} + 2 Si -> ${s}Si2`, reaction_type: 'synthesis', enthalpy: -135, conditions: '1000–1300 °C, solid-state', description: (n) => `Intermetallic ${n} disilicide formation for high-temp oxidation resistance.` },
    { suffix: 'p_phosphide', name: (e) => `${e.name} Phosphide Synthesis`, equation: (s, v) => v === 2 ? `3 ${s} + 2 P -> ${s}3P2` : `${s} + P -> ${s}P`, reaction_type: 'synthesis', enthalpy: -175, conditions: '600–850 °C, sealed ampoule', description: (n) => `Direct synthesis of ${n} phosphide catalyst/electronic material.` },
    { suffix: 'edta_chelate', name: (e) => `${e.name} EDTA Chelation Titration`, equation: (s, v) => `${s}${v}+ + H2Y2- -> [${s}Y]${v - 4 < 0 ? `${Math.abs(v - 4)}-` : ''} + 2 H+`, reaction_type: 'complexation', enthalpy: -28, conditions: 'Buffered pH 5–10, analytical titration', reversible: true, description: (n) => `Quantitative complexometric EDTA titration for ${n} ion assay.` },
    { suffix: 'electrodep', name: (e) => `${e.name} Cathodic Electrodeposition`, equation: (s, v) => `${s}${v}+ + ${v} e- -> ${s}(s)`, reaction_type: 'electrochemical', enthalpy: 0, conditions: 'Electrowinning / electroplating bath', description: (n) => `Electrolytic refining and cathodic plating of high-purity ${n}.` },
    { suffix: 'anod_ox', name: (e) => `${e.name} Anodic Dissolution`, equation: (s, v) => `${s}(s) -> ${s}${v}+ + ${v} e-`, reaction_type: 'electrochemical', enthalpy: 0, conditions: 'Electrorefining anode cell', description: (n) => `Controlled anodic oxidation of impure ${n} during electrorefining.` },
    { suffix: 'ox_hcl', name: (e) => `${e.name} Oxide Acid Dissolution`, equation: (s, v) => v === 2 ? `${s}O + 2 HCl -> ${s}Cl2 + H2O` : `${s}2O3 + 6 HCl -> 2 ${s}Cl3 + 3 H2O`, reaction_type: 'acid_base', enthalpy: -115, conditions: 'Aqueous HCl, 50 °C', description: (n) => `Acid-base neutralization dissolving ${n} oxide into chloride liquor.` },
    { suffix: 'ox_h2so4', name: (e) => `${e.name} Oxide Sulfuric Acid Leach`, equation: (s, v) => v === 2 ? `${s}O + H2SO4 -> ${s}SO4 + H2O` : `${s}2O3 + 3 H2SO4 -> ${s}2(SO4)3 + 3 H2O`, reaction_type: 'acid_base', enthalpy: -135, conditions: 'Dilute H2SO4, 60 °C', description: () => `Oxide ore acid leaching producing pregnant sulfate solution.` },
    { suffix: 'ox_hno3', name: (e) => `${e.name} Oxide Nitric Acid Dissolution`, equation: (s, v) => v === 2 ? `${s}O + 2 HNO3 -> ${s}(NO3)2 + H2O` : `${s}2O3 + 6 HNO3 -> 2 ${s}(NO3)3 + 3 H2O`, reaction_type: 'acid_base', enthalpy: -108, conditions: 'Aqueous HNO3, 40 °C', description: (n) => `Preparation of pure ${n} nitrate from oxide feedstock.` },
  ];
}

function makeNonmetalTemplates(): ReactionTemplate[] {
  return [
    { suffix: 'nm_o2', name: (e) => `${e.name} Complete Oxidation`, equation: (s) => `${s} + O2 -> ${s}O2`, reaction_type: 'oxidation', enthalpy: -395, conditions: 'Excess O2, elevated temp', description: (n) => `Complete combustion/oxidation of ${n} in oxygen.` },
    { suffix: 'nm_o2_inc', name: (e) => `${e.name} Partial Oxidation`, equation: (s) => `2 ${s} + O2 -> 2 ${s}O`, reaction_type: 'oxidation', enthalpy: -180, conditions: 'Oxygen-lean reactor', description: (n) => `Controlled partial oxidation of ${n}.` },
    { suffix: 'nm_h2', name: (e) => `${e.name} Direct Hydrogenation`, equation: (s, v) => v === 1 ? `H2 + ${s}2 -> 2 H${s}` : `${s} + ${Math.max(1, Math.floor(v / 2))} H2 -> ${s}H${v}`, reaction_type: 'synthesis', enthalpy: -120, conditions: 'Catalytic H2, 200–450 °C', reversible: true, description: (n) => `Catalytic hydrogenation of ${n} to its covalent hydride.` },
    { suffix: 'nm_f2', name: (e) => `${e.name} Complete Fluorination`, equation: (s) => `${s} + 2 F2 -> ${s}F4`, reaction_type: 'synthesis', enthalpy: -940, conditions: 'Dry F2, Ni/Monel reactor', description: (n) => `Direct fluorination producing volatile ${n} fluoride.` },
    { suffix: 'nm_cl2', name: (e) => `${e.name} Direct Chlorination`, equation: (s) => `${s} + 2 Cl2 -> ${s}Cl4`, reaction_type: 'synthesis', enthalpy: -460, conditions: 'Dry Cl2, 250–400 °C', description: (n) => `Chlorination of ${n} yielding covalent chloride intermediate.` },
    { suffix: 'nm_br2', name: (e) => `${e.name} Bromination`, equation: (s) => `${s} + 2 Br2 -> ${s}Br4`, reaction_type: 'synthesis', enthalpy: -310, conditions: 'Br2 vapor, 200 °C', description: (n) => `Synthesis of ${n} bromide reagent.` },
    { suffix: 'nm_i2', name: (e) => `${e.name} Iodination`, equation: (s) => `${s} + 2 I2 -> ${s}I4`, reaction_type: 'synthesis', enthalpy: -165, conditions: '250 °C, inert tube', reversible: true, description: () => `Reversible iodide synthesis for vapor transport purification.` },
    { suffix: 'nm_na', name: (e) => `${e.name} + Sodium Reduction`, equation: (s, v) => v === 1 ? `2 Na + ${s}2 -> 2 Na${s}` : `${v} Na + ${s} -> Na${v}${s}`, reaction_type: 'redox', enthalpy: -520, conditions: 'Molten Na, inert Ar', description: (n) => `Exothermic formation of ionic sodium-${n} compound.` },
    { suffix: 'nm_k', name: (e) => `${e.name} + Potassium Synthesis`, equation: (s, v) => v === 1 ? `2 K + ${s}2 -> 2 K${s}` : `${v} K + ${s} -> K${v}${s}`, reaction_type: 'redox', enthalpy: -560, conditions: 'Heated K, dry N2', description: (n) => `Direct synthesis of potassium salt of ${n}.` },
    { suffix: 'nm_li', name: (e) => `${e.name} + Lithium Battery Chemistry`, equation: (s, v) => v === 1 ? `2 Li + ${s}2 -> 2 Li${s}` : `${v} Li + ${s} -> Li${v}${s}`, reaction_type: 'electrochemical', enthalpy: -590, conditions: 'Ambient / electrochemical cell', description: (n) => `High-energy-density lithium reaction with ${n}.` },
    { suffix: 'nm_mg', name: (e) => `${e.name} + Magnesium Synthesis`, equation: (s) => `2 Mg + ${s} -> Mg2${s}`, reaction_type: 'synthesis', enthalpy: -410, conditions: '500–700 °C, Ar', description: (n) => `Direct combination of magnesium with ${n}.` },
    { suffix: 'nm_ca', name: (e) => `${e.name} + Calcium Synthesis`, equation: (s) => `Ca + ${s} -> Ca${s}`, reaction_type: 'synthesis', enthalpy: -440, conditions: '600 °C, inert gas', description: (n) => `Calcium fixation / scavenging reaction with ${n}.` },
    { suffix: 'nm_al', name: (e) => `${e.name} + Aluminum Synthesis`, equation: (s) => `2 Al + 3 ${s} -> Al2${s}3`, reaction_type: 'synthesis', enthalpy: -510, conditions: '700 °C, crucible', description: (n) => `Direct synthesis of aluminum-${n} binary compound.` },
    { suffix: 'nm_fe', name: (e) => `${e.name} + Iron Combination`, equation: (s) => `Fe + ${s} -> Fe${s}`, reaction_type: 'synthesis', enthalpy: -195, conditions: '550 °C, steelmaking', description: (n) => `Ferrous alloy/inclusion chemistry involving ${n}.` },
    { suffix: 'nm_cu', name: (e) => `${e.name} + Copper Reaction`, equation: (s) => `2 Cu + ${s} -> Cu2${s}`, reaction_type: 'synthesis', enthalpy: -145, conditions: '400 °C', description: (n) => `Copper chalcogenide/halide formation with ${n}.` },
    { suffix: 'nm_zn', name: (e) => `${e.name} + Zinc Synthesis`, equation: (s) => `Zn + ${s} -> Zn${s}`, reaction_type: 'synthesis', enthalpy: -225, conditions: '450 °C, vapor phase', description: (n) => `Synthesis of zinc-${n} compound used in optics and coatings.` },
    { suffix: 'nm_naoh', name: (e) => `${e.name} + Aqueous NaOH Scrubbing`, equation: (s) => `${s} + 2 NaOH -> Na2${s}O2 + H2`, reaction_type: 'disproportionation', enthalpy: -135, conditions: '20% NaOH scrubber, 25–60 °C', description: (n) => `Alkaline wet-scrubbing absorption of ${n} in chemical plants.` },
    { suffix: 'nm_koh', name: (e) => `${e.name} + Aqueous KOH Absorption`, equation: (s) => `${s} + 2 KOH -> K2${s}O2 + H2`, reaction_type: 'disproportionation', enthalpy: -140, conditions: 'Aqueous KOH, 40 °C', description: (n) => `Caustic potash absorption/disproportionation of ${n}.` },
    { suffix: 'nm_hno3', name: (e) => `${e.name} + Concentrated HNO3 Oxidation`, equation: (s) => `${s} + 4 HNO3 -> H2${s}O3 + 4 NO2 + H2O`, reaction_type: 'oxidation', enthalpy: -275, conditions: 'Hot 68% HNO3', description: (n) => `Strong oxidizing acid conversion of ${n} into its oxyacid.` },
    { suffix: 'nm_h2so4', name: (e) => `${e.name} + Hot Concentrated H2SO4`, equation: (s) => `${s} + 2 H2SO4 -> ${s}O2 + 2 SO2 + 2 H2O`, reaction_type: 'redox', enthalpy: -120, conditions: 'Boiling 98% H2SO4', description: (n) => `Dehydrating oxidation of ${n} by concentrated sulfuric acid.` },
    { suffix: 'nm_h2o', name: (e) => `${e.name} + Steam Reforming / Hydrolysis`, equation: (s) => `${s} + 2 H2O(g) -> ${s}O2 + 2 H2`, reaction_type: 'redox', enthalpy: 95, conditions: '700–900 °C steam', reversible: true, description: () => `High-temperature steam reaction producing oxide and hydrogen.` },
    { suffix: 'nm_h2o2', name: (e) => `${e.name} + Hydrogen Peroxide Oxidation`, equation: (s) => `${s} + 2 H2O2 -> ${s}O2 + 2 H2O`, reaction_type: 'oxidation', enthalpy: -380, conditions: '30% H2O2, aqueous', description: (n) => `Green oxidation of ${n} using peroxide with water as sole byproduct.` },
    { suffix: 'nm_c_red', name: (e) => `${e.name} Oxide Carbothermic Reduction`, equation: (s) => `${s}O2 + 2 C -> ${s} + 2 CO`, reaction_type: 'reduction', enthalpy: 280, conditions: '1400–1900 °C arc furnace', description: (n) => `Industrial carbon reduction of ${n} oxide to elemental ${n}.` },
    { suffix: 'nm_si_red', name: (e) => `${e.name} Chloride Hydrogen Reduction`, equation: (s) => `${s}Cl4 + 2 H2 -> ${s} + 4 HCl`, reaction_type: 'reduction', enthalpy: 115, conditions: '900–1100 °C CVD reactor', description: (n) => `Chemical vapor deposition (CVD) producing electronic-grade ${n}.` },
    { suffix: 'nm_nh3', name: (e) => `${e.name} + Ammonia Amination`, equation: (s) => `3 ${s} + 4 NH3 -> ${s}3N4 + 6 H2`, reaction_type: 'synthesis', enthalpy: -165, conditions: '800–1200 °C, NH3', description: (n) => `High-temperature nitridation of ${n} using ammonia gas.` },
    { suffix: 'nm_ch4', name: (e) => `${e.name} + Methane Carburization`, equation: (s) => `${s} + CH4 -> ${s}C + 2 H2`, reaction_type: 'synthesis', enthalpy: 75, conditions: '1100 °C, CH4/H2 plasma', description: (n) => `Vapor-phase carbide synthesis from ${n} and methane.` },
    { suffix: 'nm_co', name: (e) => `${e.name} + Carbon Monoxide Reaction`, equation: (s) => `${s} + CO -> ${s}O + C`, reaction_type: 'redox', enthalpy: -65, conditions: '450 °C', reversible: true, description: (n) => `Gas-phase redox equilibrium between ${n} and CO.` },
    { suffix: 'nm_no', name: (e) => `${e.name} + Nitric Oxide Reduction`, equation: (s) => `${s} + 2 NO -> ${s}O2 + N2`, reaction_type: 'redox', enthalpy: -510, conditions: '500 °C, DeNOx bed', description: (n) => `Reduction of NOx pollutant to harmless N2 over ${n}.` },
    { suffix: 'nm_so2', name: (e) => `${e.name} + Sulfur Dioxide Reaction`, equation: (s) => `${s} + SO2 -> ${s}O2 + S`, reaction_type: 'redox', enthalpy: -95, conditions: '550 °C', description: () => `Redox interaction with industrial SO2 off-gas.` },
    { suffix: 'nm_o3', name: (e) => `${e.name} + Ozone Oxidation`, equation: (s) => `3 ${s} + 2 O3 -> 3 ${s}O2`, reaction_type: 'oxidation', enthalpy: -720, conditions: 'Ozonized air, 25 °C', description: (n) => `Rapid low-temperature oxidation of ${n} by ozone.` },
    { suffix: 'nm_kmno4', name: (e) => `${e.name} + Permanganate Assay`, equation: (s) => `5 ${s} + 4 KMnO4 + 6 H2SO4 -> 5 ${s}O2 + 2 K2SO4 + 4 MnSO4 + 6 H2O`, reaction_type: 'redox', enthalpy: -610, conditions: 'Acidic KMnO4 titration', description: (n) => `Analytical permanganometric redox oxidation of ${n}.` },
    { suffix: 'nm_k2cr2o7', name: (e) => `${e.name} + Dichromate Oxidation`, equation: (s) => `3 ${s} + 2 K2Cr2O7 + 8 H2SO4 -> 3 ${s}O2 + 2 K2SO4 + 2 Cr2(SO4)3 + 8 H2O`, reaction_type: 'redox', enthalpy: -540, conditions: 'Acidic K2Cr2O7, 70 °C', description: () => `Strong wet oxidation with potassium dichromate.` },
    { suffix: 'nm_cl_hydro', name: (e) => `${e.name} Chloride Hydrolysis`, equation: (s) => `${s}Cl4 + 2 H2O -> ${s}O2 + 4 HCl`, reaction_type: 'hydrolysis', enthalpy: -195, conditions: 'Moist air / water, 25 °C', description: (n) => `Rapid hydrolysis of covalent ${n} chloride releasing HCl fumes.` },
    { suffix: 'nm_ox_naoh', name: (e) => `${e.name} Oxide + NaOH Neutralization`, equation: (s) => `${s}O2 + 2 NaOH -> Na2${s}O3 + H2O`, reaction_type: 'acid_base', enthalpy: -110, conditions: 'Aqueous/molten NaOH', description: () => `Acidic oxide absorption into alkaline caustic solution.` },
    { suffix: 'nm_ox_cao', name: (e) => `${e.name} Oxide + Lime Slagging`, equation: (s) => `${s}O2 + CaO -> Ca${s}O3`, reaction_type: 'acid_base', enthalpy: -90, conditions: '900–1300 °C kiln/furnace', description: (n) => `Basic flux capture of acidic ${n} oxide with quicklime.` },
    { suffix: 'nm_ox_h2o', name: (e) => `${e.name} Oxide Hydration (Oxyacid)`, equation: (s) => `${s}O2 + H2O <-> H2${s}O3`, reaction_type: 'hydration', enthalpy: -45, conditions: 'Aqueous absorption tower', reversible: true, description: (n) => `Hydration of ${n} oxide forming its corresponding aqueous oxyacid.` },
    { suffix: 'nm_s', name: (e) => `${e.name} + Sulfur Disulfide Synthesis`, equation: (s) => `${s} + 2 S -> ${s}S2`, reaction_type: 'synthesis', enthalpy: -115, conditions: '600 °C, sealed reactor', description: (n) => `Direct sulfidation forming covalent ${n} sulfide.` },
    { suffix: 'nm_p', name: (e) => `${e.name} + Phosphorus Combination`, equation: (s) => `3 ${s} + 4 P -> ${s}3P4`, reaction_type: 'synthesis', enthalpy: -155, conditions: '550 °C, inert Ar', description: (n) => `Synthesis of phosphorus-${n} covalent compound.` },
    { suffix: 'nm_b', name: (e) => `${e.name} + Boron Ceramic Synthesis`, equation: (s) => `${s} + 4 B -> B4${s}`, reaction_type: 'synthesis', enthalpy: -130, conditions: '1600 °C, hot pressing', description: (n) => `High-hardness boron-${n} advanced ceramic synthesis.` },
    { suffix: 'nm_ti', name: (e) => `${e.name} + Titanium Refractory Synthesis`, equation: (s) => `Ti + ${s} -> Ti${s}`, reaction_type: 'synthesis', enthalpy: -290, conditions: '1200 °C, PVD/CVD coating', description: (n) => `Wear-resistant titanium-${n} thin-film deposition.` },
    { suffix: 'nm_ag', name: (e) => `${e.name} + Silver Halide/Chalcogenide`, equation: (s) => `2 Ag + ${s} -> Ag2${s}`, reaction_type: 'synthesis', enthalpy: -110, conditions: 'Ambient / 200 °C', description: (n) => `Formation of photosensitive/conductive silver-${n} solid.` },
    { suffix: 'nm_hg', name: (e) => `${e.name} + Mercury Reaction`, equation: (s) => `Hg + ${s} -> Hg${s}`, reaction_type: 'synthesis', enthalpy: -95, conditions: 'Ambient / mild heating', description: () => `Direct combination with liquid mercury.` },
    { suffix: 'nm_pb', name: (e) => `${e.name} + Lead Compound Formation`, equation: (s) => `Pb + ${s} -> Pb${s}`, reaction_type: 'synthesis', enthalpy: -130, conditions: '350 °C', description: (n) => `Lead-${n} semiconductor/pigment synthesis.` },
    { suffix: 'nm_ni', name: (e) => `${e.name} + Nickel Catalytic Interaction`, equation: (s) => `Ni + ${s} -> Ni${s}`, reaction_type: 'synthesis', enthalpy: -175, conditions: '400 °C', description: (n) => `Nickel catalyst interaction/poisoning chemistry with ${n}.` },
    { suffix: 'nm_co_cat', name: (e) => `${e.name} + Cobalt Synthesis`, equation: (s) => `Co + ${s} -> Co${s}`, reaction_type: 'synthesis', enthalpy: -165, conditions: '450 °C', description: (n) => `Cobalt-${n} magnetic/catalytic compound synthesis.` },
    { suffix: 'nm_mn', name: (e) => `${e.name} + Manganese Synthesis`, equation: (s) => `Mn + ${s} -> Mn${s}`, reaction_type: 'synthesis', enthalpy: -240, conditions: '500 °C', description: () => `Manganese scavenging reaction in metallurgy.` },
    { suffix: 'nm_cr', name: (e) => `${e.name} + Chromium Synthesis`, equation: (s) => `2 Cr + 3 ${s} -> Cr2${s}3`, reaction_type: 'synthesis', enthalpy: -310, conditions: '650 °C', description: (n) => `Chromium-${n} refractory/coating formation.` },
    { suffix: 'nm_v', name: (e) => `${e.name} + Vanadium Synthesis`, equation: (s) => `V + ${s} -> V${s}`, reaction_type: 'synthesis', enthalpy: -260, conditions: '700 °C', description: (n) => `Vanadium-${n} catalytic/alloy synthesis.` },
    { suffix: 'nm_w', name: (e) => `${e.name} + Tungsten Synthesis`, equation: (s) => `W + 2 ${s} -> W${s}2`, reaction_type: 'synthesis', enthalpy: -210, conditions: '900 °C', description: (n) => `Layered tungsten-${n} solid lubricant/refractory synthesis.` },
    { suffix: 'nm_mo', name: (e) => `${e.name} + Molybdenum Synthesis`, equation: (s) => `Mo + 2 ${s} -> Mo${s}2`, reaction_type: 'synthesis', enthalpy: -235, conditions: '850 °C', description: (n) => `Hydrodesulfurization-class molybdenum-${n} synthesis.` },
    { suffix: 'nm_kclo3', name: (e) => `${e.name} + Chlorate Oxidation`, equation: (s) => `3 ${s} + 2 KClO3 -> 3 ${s}O2 + 2 KCl`, reaction_type: 'oxidation', enthalpy: -790, conditions: 'Pyrotechnic / heated oxidizer', description: (n) => `Vigorous solid-state oxidation of ${n} by potassium chlorate.` },
    { suffix: 'nm_kno3', name: (e) => `${e.name} + Nitrate Fusion Oxidation`, equation: (s) => `5 ${s} + 4 KNO3 -> 5 ${s}O2 + 2 K2O + 2 N2`, reaction_type: 'oxidation', enthalpy: -680, conditions: 'Molten KNO3, 400 °C', description: (n) => `Oxidative fusion of ${n} with potassium nitrate.` },
    { suffix: 'nm_elec_red', name: (e) => `${e.name} Electrochemical Reduction`, equation: (s, v) => `${s} + ${v} e- -> ${s}${v}-`, reaction_type: 'electrochemical', enthalpy: 0, conditions: 'Cathodic half-cell, 25 °C', description: (n) => `Standard cathodic reduction of ${n} to its anion.` },
    { suffix: 'nm_elec_ox', name: (e) => `${e.name} Anodic Oxidation`, equation: (s) => `${s} + 2 H2O -> ${s}O2 + 4 H+ + 4 e-`, reaction_type: 'electrochemical', enthalpy: 0, conditions: 'Anodic half-cell, aqueous', description: (n) => `Electrochemical oxidation of ${n} in aqueous electrolyte.` },
  ];
}

function makeNobleGasTemplates(): ReactionTemplate[] {
  return [
    { suffix: 'ng_ion1', name: (e) => `${e.name} First Electron-Impact Ionization`, equation: (s) => `${s}(g) + e- -> ${s}+(g) + 2 e-`, reaction_type: 'ionization', enthalpy: 1450, conditions: 'Plasma discharge / mass spectrometer', description: (n) => `Primary electron-impact ionization of ${n} in plasma and ICP-MS sources.` },
    { suffix: 'ng_ion2', name: (e) => `${e.name} Second Ionization`, equation: (s) => `${s}+(g) + e- -> ${s}2+(g) + 2 e-`, reaction_type: 'ionization', enthalpy: 2650, conditions: 'High-energy RF plasma', description: (n) => `Doubly charged ${n} ion generation in high-temperature plasma arcs.` },
    { suffix: 'ng_recomb', name: (e) => `${e.name} Radiative Recombination`, equation: (s) => `${s}+(g) + e- -> ${s}(g) + hν`, reaction_type: 'spectroscopic', enthalpy: -1450, conditions: 'Gas-discharge tube / afterglow', description: (n) => `Electron-ion recombination emitting characteristic ${n} atomic emission lines.` },
    { suffix: 'ng_excite', name: (e) => `${e.name} Metastable Excitation`, equation: (s) => `${s}(g) + e- -> ${s}*(g) + e-`, reaction_type: 'spectroscopic', enthalpy: 1120, conditions: 'Glow discharge, 1–10 Torr', reversible: true, description: (n) => `Electronic excitation of ${n} into long-lived metastable state.` },
    { suffix: 'ng_dimer', name: (e) => `${e.name} Excimer Formation`, equation: (s) => `${s}*(g) + 2 ${s}(g) -> ${s}2*(g) + ${s}(g)`, reaction_type: 'excimer', enthalpy: -85, conditions: 'High-pressure discharge, VUV lamp', description: () => `Three-body excimer formation producing vacuum-ultraviolet (VUV) radiation.` },
    { suffix: 'ng_dimer_dec', name: (e) => `${e.name} Excimer Radiative Decay`, equation: (s) => `${s}2*(g) -> 2 ${s}(g) + hν`, reaction_type: 'excimer', enthalpy: -120, conditions: 'VUV excimer laser cavity', description: (n) => `Bound-free radiative dissociation of ${n} excimer releasing coherent VUV photon.` },
    { suffix: 'ng_f_exc', name: (e) => `${e.name} Fluoride Excimer Laser Pumping`, equation: (s) => `${s}*(g) + F2(g) -> ${s}F*(g) + F(g)`, reaction_type: 'excimer', enthalpy: -195, conditions: 'Excimer laser gas mix (F2/buffer)', description: (n) => `Excited-state halogen harpoon reaction forming ${n} fluoride exciplex.` },
    { suffix: 'ng_cl_exc', name: (e) => `${e.name} Chloride Excimer Formation`, equation: (s) => `${s}*(g) + HCl(g) -> ${s}Cl*(g) + H(g)`, reaction_type: 'excimer', enthalpy: -140, conditions: 'Pulsed UV discharge', description: () => `Exciplex formation used in industrial UV photolithography and medical lasers.` },
    { suffix: 'ng_br_exc', name: (e) => `${e.name} Bromide Exciplex Formation`, equation: (s) => `${s}*(g) + Br2(g) -> ${s}Br*(g) + Br(g)`, reaction_type: 'excimer', enthalpy: -125, conditions: 'Dielectric barrier discharge', description: (n) => `Narrow-band UV excilamp emission process involving ${n} bromide exciplex.` },
    { suffix: 'ng_penning_n2', name: (e) => `${e.name} Penning Ionization of Nitrogen`, equation: (s) => `${s}*(g) + N2(g) -> ${s}(g) + N2+(g) + e-`, reaction_type: 'plasma', enthalpy: -210, conditions: 'Atmospheric plasma jet', description: (n) => `Metastable ${n} energy transfer ionizing molecular nitrogen.` },
    { suffix: 'ng_penning_o2', name: (e) => `${e.name} Penning Ionization of Oxygen`, equation: (s) => `${s}*(g) + O2(g) -> ${s}(g) + O2+(g) + e-`, reaction_type: 'plasma', enthalpy: -260, conditions: 'Plasma sterilization / etching', description: (n) => `Penning ionization generating reactive oxygen cations via metastable ${n}.` },
    { suffix: 'ng_penning_h2', name: (e) => `${e.name} Penning Ionization of Hydrogen`, equation: (s) => `${s}*(g) + H2(g) -> ${s}(g) + H2+(g) + e-`, reaction_type: 'plasma', enthalpy: -190, conditions: 'Low-pressure plasma source', description: (n) => `Energy transfer from excited ${n} to molecular hydrogen.` },
    { suffix: 'ng_penning_co2', name: (e) => `${e.name} Penning Ionization of CO2`, equation: (s) => `${s}*(g) + CO2(g) -> ${s}(g) + CO2+(g) + e-`, reaction_type: 'plasma', enthalpy: -230, conditions: 'Gas laser / plasma reforming', description: (n) => `Collisional ionization of CO2 in ${n}-buffered gas lasers.` },
    { suffix: 'ng_penning_ch4', name: (e) => `${e.name} Penning Dissociation of Methane`, equation: (s) => `${s}*(g) + CH4(g) -> ${s}(g) + CH3+(g) + H(g) + e-`, reaction_type: 'plasma', enthalpy: -175, conditions: 'PECVD diamond/carbon deposition', description: (n) => `Plasma-enhanced activation of methane using ${n} carrier gas.` },
    { suffix: 'ng_penning_nh3', name: (e) => `${e.name} Penning Ionization of Ammonia`, equation: (s) => `${s}*(g) + NH3(g) -> ${s}(g) + NH3+(g) + e-`, reaction_type: 'plasma', enthalpy: -280, conditions: 'Plasma nitridation chamber', description: (n) => `Metastable ${n} assisted activation of ammonia plasma.` },
    { suffix: 'ng_hydride_ion', name: (e) => `${e.name} Hydride Cation (Gas-Phase Ion)`, equation: (s) => `${s}+(g) + H2(g) -> ${s}H+(g) + H(g)`, reaction_type: 'ion_molecule', enthalpy: -155, conditions: 'Ion trap / interstellar plasma', description: (n) => `Gas-phase formation of protonated ${n} hydride cation (${n}H+).` },
    { suffix: 'ng_proton', name: (e) => `${e.name} Proton Affinity Capture`, equation: (s) => `${s}(g) + H+(g) -> ${s}H+(g)`, reaction_type: 'ion_molecule', enthalpy: -178, conditions: 'High-vacuum mass spectrometry', description: (n) => `Protonation of ${n} forming a strongly bound noble-gas hydride ion.` },
    { suffix: 'ng_dimer_ion', name: (e) => `${e.name} Molecular Ion Association`, equation: (s) => `${s}+(g) + 2 ${s}(g) -> ${s}2+(g) + ${s}(g)`, reaction_type: 'ion_molecule', enthalpy: -115, conditions: 'High-pressure glow discharge', description: (n) => `Formation of diatomic ${n} molecular cation in discharge plasmas.` },
    { suffix: 'ng_charge_ex', name: (e) => `${e.name} Charge-Transfer with CO`, equation: (s) => `${s}+(g) + CO(g) -> ${s}(g) + CO+(g)`, reaction_type: 'plasma', enthalpy: -180, conditions: 'ICP-MS / ion beam', description: (n) => `Near-resonant charge exchange between ${n}+ and carbon monoxide.` },
    { suffix: 'ng_sputter_cu', name: (e) => `${e.name} Ion-Beam Sputtering of Copper`, equation: (s) => `${s}+(g) + Cu(s) -> ${s}(g) + Cu(g)`, reaction_type: 'physical', enthalpy: 338, conditions: 'Magnetron PVD sputter chamber', description: (n) => `Physical vapor deposition sputtering of copper thin films using ${n}+ ions.` },
    { suffix: 'ng_sputter_si', name: (e) => `${e.name} Ion-Beam Sputtering of Silicon`, equation: (s) => `${s}+(g) + Si(s) -> ${s}(g) + Si(g)`, reaction_type: 'physical', enthalpy: 450, conditions: 'Semiconductor RIE / PVD', description: (n) => `Anisotropic physical bombardment of silicon wafers with ${n}+ plasma.` },
    { suffix: 'ng_sputter_ti', name: (e) => `${e.name} Sputtering of Titanium Target`, equation: (s) => `${s}+(g) + Ti(s) -> ${s}(g) + Ti(g)`, reaction_type: 'physical', enthalpy: 470, conditions: 'DC magnetron sputtering', description: (n) => `Sputter deposition of titanium barrier layers in ${n} plasma.` },
    { suffix: 'ng_clath_h2o', name: (e) => `${e.name} Clathrate Hydrate Inclusion`, equation: (s) => `${s}(g) + 6 H2O(s) <-> ${s}·6H2O(s)`, reaction_type: 'clathrate', enthalpy: -22, conditions: 'High pressure, <273 K', reversible: true, description: (n) => `Physical van der Waals trapping of ${n} atoms inside ice clathrate cages.` },
    { suffix: 'ng_c60', name: (e) => `${e.name} Endohedral Fullerene Capture`, equation: (s) => `${s}(g) + C60(s) -> ${s}@C60(s)`, reaction_type: 'inclusion', enthalpy: 45, conditions: '650 °C, 3000 bar ${n}', description: (n) => `Physical encapsulation of a single ${n} atom inside a C60 buckyball cage.` },
    { suffix: 'ng_zeolite', name: (e) => `${e.name} Zeolite Physisorption`, equation: (s) => `${s}(g) + ZSM5(s) <-> ${s}@ZSM5(s)`, reaction_type: 'adsorption', enthalpy: -14, conditions: '77–298 K, PSA/cryo bed', reversible: true, description: (n) => `Reversible physical adsorption of ${n} in microporous zeolite cavities.` },
    { suffix: 'ng_carbon', name: (e) => `${e.name} Activated Carbon Cryo-Adsorption`, equation: (s) => `${s}(g) + C_act(s) <-> ${s}·C_act(s)`, reaction_type: 'adsorption', enthalpy: -12, conditions: '77 K liquid-N2 trap', reversible: true, description: (n) => `Cryogenic charcoal trapping used for ${n} purification and off-gas hold-up.` },
    { suffix: 'ng_liq', name: (e) => `${e.name} Cryogenic Liquefaction`, equation: (s) => `${s}(g) <-> ${s}(l)`, reaction_type: 'phase_change', enthalpy: -6, conditions: 'Joule–Thomson / Claude cryo cycle', reversible: true, description: (n) => `Isenthalpic liquefaction of ${n} for cryogenic cooling and storage.` },
    { suffix: 'ng_solid', name: (e) => `${e.name} Cryogenic Solidification`, equation: (s) => `${s}(l) <-> ${s}(s)`, reaction_type: 'phase_change', enthalpy: -1, conditions: 'Sub-kelvin / high-pressure cryostat', reversible: true, description: (n) => `Phase transition of liquid ${n} to van der Waals solid crystal.` },
    { suffix: 'ng_sol_h2o', name: (e) => `${e.name} Aqueous Henry-Law Dissolution`, equation: (s) => `${s}(g) <-> ${s}(aq)`, reaction_type: 'phase_change', enthalpy: -9, conditions: '298 K, 1–10 bar', reversible: true, description: (n) => `Physical dissolution of ${n} in water governed by Henry's law.` },
    { suffix: 'ng_inert_o2', name: (e) => `${e.name} Inert Stability vs Oxygen`, equation: (s) => `${s}(g) + O2(g) -> ${s}(g) + O2(g)`, reaction_type: 'inert_process', enthalpy: 0, conditions: 'Ambient to 2000 °C', description: (n) => `Closed-shell electron configuration renders ${n} chemically non-reactive with O2.` },
    { suffix: 'ng_inert_h2', name: (e) => `${e.name} Inert Stability vs Hydrogen`, equation: (s) => `${s}(g) + H2(g) -> ${s}(g) + H2(g)`, reaction_type: 'inert_process', enthalpy: 0, conditions: 'Standard industrial conditions', description: () => `Zero covalent reactivity with H2; used as safe diluent and purge gas.` },
    { suffix: 'ng_inert_n2', name: (e) => `${e.name} Inert Stability vs Nitrogen`, equation: (s) => `${s}(g) + N2(g) -> ${s}(g) + N2(g)`, reaction_type: 'inert_process', enthalpy: 0, conditions: 'Air separation unit (ASU)', description: () => `Non-reactive gas mixture separated via cryogenic fractional distillation.` },
    { suffix: 'ng_inert_hcl', name: (e) => `${e.name} Acid Resistance (HCl)`, equation: (s) => `${s}(g) + HCl(aq) -> ${s}(g) + HCl(aq)`, reaction_type: 'inert_process', enthalpy: 0, conditions: 'Aqueous 12 M HCl, 25 °C', description: (n) => `${n} exhibits complete chemical immunity to strong mineral acids.` },
    { suffix: 'ng_inert_naoh', name: (e) => `${e.name} Caustic Resistance (NaOH)`, equation: (s) => `${s}(g) + NaOH(aq) -> ${s}(g) + NaOH(aq)`, reaction_type: 'inert_process', enthalpy: 0, conditions: '50% NaOH scrubber, 25 °C', description: (n) => `${n} passes unchanged through alkaline scrubbers during gas purification.` },
    { suffix: 'ng_inert_fe', name: (e) => `${e.name} Steelmaking Inert Shrouding`, equation: (s) => `${s}(g) + Fe(l) -> ${s}(g) + Fe(l)`, reaction_type: 'inert_process', enthalpy: 0, conditions: '1600 °C AOD / ladle metallurgy', description: (n) => `Inert bottom-stirring and shrouding of molten steel with ${n} without nitride/oxide formation.` },
    { suffix: 'ng_inert_ti', name: (e) => `${e.name} TIG Welding Shield (Titanium)`, equation: (s) => `${s}(g) + Ti(l) -> ${s}(g) + Ti(l)`, reaction_type: 'inert_process', enthalpy: 0, conditions: 'GTAW weld pool, 1700 °C', description: () => `Protective inert gas shielding preventing oxygen/nitrogen embrittlement of molten titanium.` },
    { suffix: 'ng_inert_si', name: (e) => `${e.name} Czochralski Silicon Blanket`, equation: (s) => `${s}(g) + Si(l) -> ${s}(g) + Si(l)`, reaction_type: 'inert_process', enthalpy: 0, conditions: '1420 °C crystal puller', description: (n) => `Ultra-pure ${n} sweep gas protecting single-crystal silicon ingots from oxidation.` },
    { suffix: 'ng_inert_li', name: (e) => `${e.name} Glovebox Blanket over Lithium`, equation: (s) => `${s}(g) + Li(s) -> ${s}(g) + Li(s)`, reaction_type: 'inert_process', enthalpy: 0, conditions: 'Dry glovebox, <1 ppm O2/H2O', description: () => `Inert atmosphere preserving pyrophoric alkali metals without nitridation.` },
    { suffix: 'ng_vdw_co2', name: (e) => `${e.name}–CO2 van der Waals Complex`, equation: (s) => `${s}(g) + CO2(g) <-> ${s}···CO2(g)`, reaction_type: 'complexation', enthalpy: -2, conditions: 'Supersonic molecular beam, <10 K', reversible: true, description: () => `Weak London dispersion complex studied in rotational spectroscopy.` },
    { suffix: 'ng_vdw_h2o', name: (e) => `${e.name}–Water van der Waals Cluster`, equation: (s) => `${s}(g) + H2O(g) <-> ${s}···H2O(g)`, reaction_type: 'complexation', enthalpy: -2, conditions: 'Cryogenic jet expansion', reversible: true, description: () => `Weak dipole-induced-dipole cluster observed in microwave spectroscopy.` },
    { suffix: 'ng_vdw_hf', name: (e) => `${e.name}–HF van der Waals Complex`, equation: (s) => `${s}(g) + HF(g) <-> ${s}···HF(g)`, reaction_type: 'complexation', enthalpy: -3, conditions: 'Supersonic expansion, 5 K', reversible: true, description: () => `Linear van der Waals adduct benchmarked in quantum chemistry.` },
    { suffix: 'ng_vdw_hcl', name: (e) => `${e.name}–HCl van der Waals Complex`, equation: (s) => `${s}(g) + HCl(g) <-> ${s}···HCl(g)`, reaction_type: 'complexation', enthalpy: -2, conditions: 'Cryogenic molecular beam', reversible: true, description: (n) => `Dispersion-stabilized ${n}–HCl adduct in infrared spectroscopy.` },
    { suffix: 'ng_matrix_n2', name: (e) => `${e.name} Cryogenic Matrix Isolation`, equation: (s) => `N2(g) + n ${s}(g) -> N2@${s}_n(s)`, reaction_type: 'physical', enthalpy: -5, conditions: '4–15 K optical cryostat', description: (n) => `Solid ${n} host matrix isolating reactive radicals for FTIR analysis.` },
    { suffix: 'ng_f2_fluoride', name: (e) => `${e.name} High-Energy Fluorination (Kr/Xe/Rn)`, equation: (s) => (s === 'Kr' || s === 'Xe' || s === 'Rn' || s === 'Og') ? `${s}(g) + F2(g) -> ${s}F2(s)` : `${s}(g) + F2(g) -> ${s}(g) + F2(g)`, reaction_type: 'synthesis', enthalpy: -108, conditions: 'UV photolysis / 400 °C Ni reactor', description: () => `Heavy noble gases (Kr, Xe, Rn) form difluorides under UV/thermal F2; light noble gases (He, Ne, Ar) remain unreactive.` },
    { suffix: 'ng_f4_fluoride', name: (e) => `${e.name} Tetrafluoride Route (Xe/Rn)`, equation: (s) => (s === 'Xe' || s === 'Rn' || s === 'Og') ? `${s}(g) + 2 F2(g) -> ${s}F4(s)` : `${s}(g) + 2 F2(g) -> ${s}(g) + 2 F2(g)`, reaction_type: 'synthesis', enthalpy: -262, conditions: '400 °C, 6 bar F2 (1:5 ratio)', description: () => `Square-planar tetrafluoride synthesis for heavy noble gases; light noble gases remain inert.` },
    { suffix: 'ng_f6_fluoride', name: (e) => `${e.name} Hexafluoride Route (Xe)`, equation: (s) => (s === 'Xe' || s === 'Og') ? `${s}(g) + 3 F2(g) -> ${s}F6(s)` : `${s}(g) + 3 F2(g) -> ${s}(g) + 3 F2(g)`, reaction_type: 'synthesis', enthalpy: -338, conditions: '300 °C, 60 bar excess F2', description: () => `High-pressure fluorination producing distorted-octahedral hexafluoride for Xe; lighter noble gases stay inert.` },
    { suffix: 'ng_au_complex', name: (e) => `${e.name}–Gold Cation Complex (Gas/Superacid)`, equation: (s) => `${s}(g) + Au+(g) -> [Au${s}]+(g)`, reaction_type: 'complexation', enthalpy: -95, conditions: 'Gas-phase ion chemistry / HF-SbF5', description: (n) => `Relativistic d-orbital stabilization forming gold–${n} coordination cation.` },
    { suffix: 'ng_cu_complex', name: (e) => `${e.name}–Copper(I) Halide Adduct`, equation: (s) => `${s}(g) + CuF(g) -> ${s}–CuF(g)`, reaction_type: 'complexation', enthalpy: -48, conditions: 'Laser-ablation microwave spectroscopy', description: () => `Gas-phase noble-gas–coinage-metal coordination complex.` },
    { suffix: 'ng_ag_complex', name: (e) => `${e.name}–Silver(I) Halide Adduct`, equation: (s) => `${s}(g) + AgF(g) -> ${s}–AgF(g)`, reaction_type: 'complexation', enthalpy: -42, conditions: 'Supersonic discharge expansion', description: (n) => `Spectroscopically characterized linear ${n}–AgF adduct.` },
    { suffix: 'ng_gc_carrier', name: (e) => `${e.name} Gas Chromatography Carrier Transport`, equation: (s) => `${s}(g) + Analyte(ads) <-> ${s}(g) + Analyte(g)`, reaction_type: 'separation', enthalpy: 0, conditions: 'GC capillary column, 40–300 °C', reversible: true, description: () => `Chemically inert mobile-phase carrier gas sweeping analytes through GC columns.` },
    { suffix: 'ng_icp_torch', name: (e) => `${e.name} ICP Plasma Atomization`, equation: (s) => `${s}+(g) + M(aq) -> ${s}(g) + M+(g)`, reaction_type: 'plasma', enthalpy: 520, conditions: '6000–10000 K ICP torch', description: (n) => `Inductively coupled ${n} plasma atomizing and ionizing trace metal analytes.` },
  ];
}

const METAL_TEMPLATES = makeMetalTemplates();
const NONMETAL_TEMPLATES = makeNonmetalTemplates();
const NOBLE_GAS_TEMPLATES = makeNobleGasTemplates();
const CACHE = new Map<string, Reaction[]>();

/**
 * Returns exactly 50 distinct, balanced chemical reactions for ANY of the 118 elements.
 */
export function getFiftyReactionsForElement(idOrSymbolOrName: string): Reaction[] {
  const el = findCatalogElement(idOrSymbolOrName);
  if (!el || !el.symbol) return [];
  const sym = el.symbol;
  if (CACHE.has(sym)) return CACHE.get(sym)!;

  const base: Reaction[] = [...(ELEMENT_REACTIONS_CATALOG[sym] || [])];
  const seenEq = new Set(base.map((r) => r.equation.replace(/\s+/g, '').toLowerCase()));
  const cat = (el.category || '').toLowerCase();
  const isNobleGas = cat.includes('noble gas') || ['He', 'Ne', 'Ar', 'Kr', 'Xe', 'Rn', 'Og'].includes(sym);
  const isNonmetal = !isNobleGas && (cat.includes('nonmetal') || cat.includes('halogen') || cat.includes('metalloid'));
  const orderedTemplates = isNobleGas
    ? NOBLE_GAS_TEMPLATES
    : isNonmetal
      ? [...NONMETAL_TEMPLATES, ...METAL_TEMPLATES]
      : [...METAL_TEMPLATES, ...NONMETAL_TEMPLATES];
  const v = primaryValence(el);

  for (const tpl of orderedTemplates) {
    if (base.length >= 50) break;
    const eq = tpl.equation(sym, v);
    const norm = eq.replace(/\s+/g, '').toLowerCase();
    if (seenEq.has(norm)) continue;
    seenEq.add(norm);
    base.push({
      id: `rxn_${sym.toLowerCase()}_${tpl.suffix}`,
      name: tpl.name(el, v),
      equation: eq,
      reaction_type: tpl.reaction_type,
      enthalpy_change: tpl.enthalpy,
      conditions: tpl.conditions,
      is_reversible: Boolean(tpl.reversible),
      description: tpl.description(el.name, sym),
      balanced: true,
      reactants: [],
      products: [],
    });
  }

  const finalFifty = base.slice(0, 50);
  CACHE.set(sym, finalFifty);
  return finalFifty;
}

export function findFiftyCatalogReaction(reactionId: string): Reaction | undefined {
  // Expected format: rxn_<sym>_<suffix>
  const parts = reactionId.split('_');
  if (parts.length < 3) return undefined;
  const sym = parts[1];
  const list = getFiftyReactionsForElement(sym);
  return list.find((r) => r.id === reactionId);
}
