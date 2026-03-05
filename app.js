const { useState, useMemo, useEffect, useRef, useCallback } = React;
const { 
  FileText, Layers, CheckCircle, AlertTriangle, XCircle, 
  Plus, Trash2, Wind, Weight, Volume2, Flame, Leaf, ArrowUp, ArrowDown, Activity, Factory, MapPin, 
  Calculator, Info, BookOpen, HardHat, Euro, Lightbulb, Ruler, ShieldAlert,
  Undo2, Redo2, Search, Box, LayoutTemplate, BoxSelect, Settings2, Download,
  ThermometerSnowflake, Target, Zap, ExternalLink, GraduationCap, Wand2, ChevronDown, ChevronUp,
  AlertOctagon, CheckSquare, ClipboardList, Briefcase, FileSignature, Presentation
} = lucide;

// ============================================================================
// 1. BASES DE DATOS OFICIALES (CTE 2026 - ESPAÑA / IVE VALENCIA)
// ============================================================================

const ZONAS_CTE = {
  A: { maxUMuro: 0.82, maxUCubierta: 0.50, maxUSuelo: 0.65, nombre: 'Zona A (Cádiz, Canarias, Almería)' },
  B: { maxUMuro: 0.56, maxUCubierta: 0.44, maxUSuelo: 0.52, nombre: 'Zona B (Valencia, Sevilla, Alicante)' },
  C: { maxUMuro: 0.49, maxUCubierta: 0.40, maxUSuelo: 0.46, nombre: 'Zona C (Barcelona, Bilbao, A Coruña)' },
  D: { maxUMuro: 0.41, maxUCubierta: 0.32, maxUSuelo: 0.38, nombre: 'Zona D (Madrid, Zaragoza, Toledo)' },
  E: { maxUMuro: 0.36, maxUCubierta: 0.28, maxUSuelo: 0.33, nombre: 'Zona E (Burgos, León, Soria)' },
};

const CONDICIONES_AMBIENTALES = [
  { id: 'fachada', nombre: 'Cerramiento de Fachada (Contacto Exterior Intemperie)' },
  { id: 'cubierta', nombre: 'Cubierta Plana / Inclinada (Intemperie Superior)' },
  { id: 'terreno', nombre: 'Solera / Muro en Contacto con el Terreno' },
  { id: 'interior_seco', nombre: 'Partición Interior Seca (Entrepiso / Tabique)' },
  { id: 'interior_humedo', nombre: 'Partición Interior Húmeda (Baños, Cocinas)' },
];

const CATEGORIAS_TECNICAS = [
  { id: 'fabrica_pesada', nombre: 'Estructura Pesada y Fábricas', color: 'border-slate-500' },
  { id: 'estructura_ligera', nombre: 'Estructura Ligera (Madera/Metal)', color: 'border-amber-600' },
  { id: 'aislamiento_sintetico', nombre: 'Aislamiento Térmico Sintético', color: 'border-blue-500' },
  { id: 'aislamiento_natural', nombre: 'Aislamiento Mineral y Natural', color: 'border-emerald-500' },
  { id: 'aislamiento_avanzado', nombre: 'Aislamientos Avanzados (VIP/Aerogel)', color: 'border-fuchsia-500' },
  { id: 'impermeabilizacion', nombre: 'Láminas Impermeabilizantes', color: 'border-indigo-800' },
  { id: 'barreras_films', nombre: 'Barreras de Vapor y Transpirables', color: 'border-cyan-400' },
  { id: 'membranas_acusticas', nombre: 'Membranas y Láminas Acústicas', color: 'border-violet-600' },
  { id: 'morteros_revocos', nombre: 'Morteros y Revocos', color: 'border-stone-400' },
  { id: 'placas_paneles', nombre: 'Placas y Paneles de Revestimiento', color: 'border-teal-600' },
  { id: 'acabados_pesados', nombre: 'Acabados Pesados (Cerámica, Piedra)', color: 'border-orange-700' },
  { id: 'acabados_metalicos', nombre: 'Acabados Metálicos (Zinc, Cobre)', color: 'border-slate-300' },
  { id: 'camaras_aire', nombre: 'Cámaras de Aire', color: 'border-sky-200' },
  { id: 'auxiliares', nombre: 'Capas Auxiliares (Grava, Sustrato...)', color: 'border-lime-700' }
];

/* DICCIONARIO MASIVO DE MATERIALES - RIGOR ETSIE UPV
  Precios Base de Material (MaterialP) indicados en €/m3.
  Precios Base de Mano de Obra (ManoObraP) indicados en €/m3 (estimación cuadrilla).
  Propiedades Físicas Reales: λ (W/mK), μ (Difusión Vapor), Cp (J/kgK), CO2 (kg/kg), Rw base (dB), Densidad (kg/m3)
  Razones Sociales Oficiales de Empresas.
*/
const BASE_DATOS_MATERIALES = {
  // --- FÁBRICA Y ESTRUCTURA PESADA ---
  'ladrillo_hd': { 
    nombre: 'Fábrica Ladrillo Hueco Doble (HD)', k: 0.32, mu: 10, cp: 1000, co2: 0.25, rw: 45, densidad: 900, 
    precioMaterial: 85, precioManoObra: 60, categoria: 'fabrica_pesada', color: '#8c4228', fuego: 'EI120', 
    marca: 'Cerámica La Paloma S.A.', producto: 'LHD 24x11,5x9', web: 'https://www.ceramicalapaloma.com/', convenio: 'Convenio Prácticas ETSIE UPV', 
    desc: 'Fábrica de ladrillo cerámico tradicional para hoja principal, recibido con mortero de cemento.' 
  },
  'ladrillo_perforado': { 
    nombre: 'Fábrica Ladrillo Perforado (Gero)', k: 0.45, mu: 10, cp: 1000, co2: 0.28, rw: 48, densidad: 1000, 
    precioMaterial: 110, precioManoObra: 65, categoria: 'fabrica_pesada', color: '#a0522d', fuego: 'EI120', 
    marca: 'Keraben Grupo S.A.', producto: 'Gero Acústico 24x11,5x10', web: 'https://www.keraben.com/', convenio: 'Partner Máster Acústica', 
    desc: 'Mayor masa y resistencia a compresión. Ideal para separaciones acústicas entre recintos protegidos.' 
  },
  'ladrillo_cv': { 
    nombre: 'Fábrica Ladrillo Cara Vista Klinker', k: 0.50, mu: 10, cp: 1000, co2: 0.30, rw: 50, densidad: 1100, 
    precioMaterial: 250, precioManoObra: 170, categoria: 'fabrica_pesada', color: '#6e2b1d', fuego: 'EI120', 
    marca: 'La Escandella S.A.', producto: 'Klinker Cara Vista', web: 'https://laescandella.com/', convenio: 'Partner Máster Edificación', 
    desc: 'Acabado exterior cerámico de nula porosidad, preparado para resistir la intemperie directa sin revestir.' 
  },
  'bloque_termo': { 
    nombre: 'Fábrica Bloque Termoarcilla', k: 0.24, mu: 10, cp: 1000, co2: 0.20, rw: 48, densidad: 800, 
    precioMaterial: 110, precioManoObra: 70, categoria: 'fabrica_pesada', color: '#9e5a1b', fuego: 'EI240', 
    marca: 'Consorcio Termoarcilla S.L.', producto: 'Termoarcilla® ECO 24', web: 'http://www.termoarcilla.com/', convenio: 'Cátedra Termoarcilla UPV', 
    desc: 'Bloque aligerado multiceldilla. Su laberinto interior mejora exponencialmente la resistencia térmica.' 
  },
  'bloque_hormigon': { 
    nombre: 'Fábrica Bloque de Hormigón Hueco', k: 1.30, mu: 60, cp: 1000, co2: 0.15, rw: 52, densidad: 1200, 
    precioMaterial: 60, precioManoObra: 60, categoria: 'fabrica_pesada', color: '#6b7280', fuego: 'EI240', 
    marca: 'Pavasal Empresa Constructora S.A.', producto: 'BH 40x20x20', web: 'https://www.pavasal.com/', convenio: 'Cátedra Empresa Pavasal UPV', 
    desc: 'Material muy robusto y económico. Alta resistencia mecánica para muros de contención o divisorias estructurales.' 
  },
  'hormigon_armado': { 
    nombre: 'Hormigón Armado in situ (HA-25/B/20/IIa)', k: 1.63, mu: 80, cp: 1000, co2: 0.18, rw: 55, densidad: 2500, 
    precioMaterial: 110, precioManoObra: 100, categoria: 'fabrica_pesada', color: '#4b5563', fuego: 'REI120', 
    marca: 'Grupo Bertolín S.A.U.', producto: 'Hormigón HA-25 (Acero B500S)', web: 'https://www.grupobertolin.es/', convenio: 'Cátedra Bertolín UPV', 
    desc: 'Estructura principal masiva. Elaborado in situ. Exige aislamiento térmico exterior para evitar puentes térmicos graves.' 
  },
  'hormigon_celular': { 
    nombre: 'Bloque Hormigón Celular Curado Autoclave', k: 0.12, mu: 5, cp: 1000, co2: 0.10, rw: 42, densidad: 400, 
    precioMaterial: 180, precioManoObra: 100, categoria: 'fabrica_pesada', color: '#d1d5db', fuego: 'REI240', 
    marca: 'Xella España S.A.U. (Ytong)', producto: 'Ytong Compact', web: 'https://www.ytong.es/', convenio: 'Cátedra Innovación Materiales', 
    desc: 'Material macizo pero extremadamente poroso. Funciona como estructura y aislamiento térmico simultáneamente.' 
  },
  'bovedilla_hormigon': { 
    nombre: 'Forjado Unidireccional (Vigueta/Bovedilla)', k: 1.10, mu: 60, cp: 1000, co2: 0.15, rw: 45, densidad: 1100, 
    precioMaterial: 90, precioManoObra: 65, categoria: 'fabrica_pesada', color: '#52525b', fuego: 'REI90', 
    marca: 'Cemex España Operaciones S.L.U.', producto: 'Forjado H 25+5', web: 'https://www.cemex.es/', convenio: 'Cátedra Blanca Cemex UPV', 
    desc: 'Capa estructural de forjado tradicional compuesta por viguetas de hormigón, bovedillas y capa de compresión.' 
  },

  // --- ESTRUCTURA LIGERA ---
  'panel_clt': { 
    nombre: 'Panel Madera Contralaminada (CLT)', k: 0.13, mu: 50, cp: 1600, co2: -0.8, rw: 40, densidad: 500, 
    precioMaterial: 750, precioManoObra: 200, categoria: 'estructura_ligera', color: '#b08358', fuego: 'REI60', 
    marca: 'Egoin S.A.', producto: 'Egoin CLT Structural', web: 'https://egoin.com/', convenio: 'Aula Empresa Egoin UPV', 
    desc: 'Estructura masiva de madera de abeto. Sumidero de CO2 natural. Excelente comportamiento estructural frente a sismos.' 
  },
  'entramado_ligero_madera': { 
    nombre: 'Montantes Madera (Entramado Timber Frame)', k: 0.13, mu: 50, cp: 1600, co2: -0.7, rw: 20, densidad: 450, 
    precioMaterial: 350, precioManoObra: 200, categoria: 'estructura_ligera', color: '#d97706', fuego: 'R30', 
    marca: 'Financiera Maderera S.A. (FINSA)', producto: 'Madera Estructural KVH', web: 'https://www.finsa.com/', convenio: 'Cátedra Finsa ETSIE', 
    desc: 'Estructura ligera. Permite embutir el aislamiento entre los montantes ahorrando un 30% de espacio útil.' 
  },
  'perfileria_acero': { 
    nombre: 'Subestructura Acero Galvanizado', k: 50.0, mu: 100000, cp: 450, co2: 1.8, rw: 20, densidad: 7850, 
    precioMaterial: 2000, precioManoObra: 1200, categoria: 'estructura_ligera', color: '#94a3b8', fuego: 'A1', 
    marca: 'Celsa Group S.A.', producto: 'Perfiles Estructurales S275', web: 'https://www.celsagroup.com/', convenio: 'Ninguno', 
    desc: 'Steel framing o rastreles metálicos para fachadas ventiladas. Transmisor térmico elevado, requiere rotura de puente térmico.' 
  },
  'chapa_colaborante': { 
    nombre: 'Chapa Perfilada Colaborante (Forjado Mixto)', k: 50.0, mu: 100000, cp: 450, co2: 2.0, rw: 15, densidad: 7850, 
    precioMaterial: 1200, precioManoObra: 300, categoria: 'estructura_ligera', color: '#64748b', fuego: 'A1', 
    marca: 'Incoprofil S.A.', producto: 'Perfil INCO 70.4', web: '#', convenio: 'Ninguno', 
    desc: 'Soporte metálico para forjados mixtos o base resistente para cubiertas tipo Deck industriales.' 
  },

  // --- AISLAMIENTO SINTÉTICO ---
  'eps': { 
    nombre: 'Poliestireno Expandido (EPS)', k: 0.036, mu: 60, cp: 1450, co2: 2.5, rw: 0, densidad: 20, 
    precioMaterial: 80, precioManoObra: 30, categoria: 'aislamiento_sintetico', color: '#fef08a', fuego: 'E', 
    marca: 'Grupo Valero S.A.', producto: 'Valero EPS SATE', web: 'https://grupovalero.com/', convenio: 'Partner de Innovación UPV', 
    desc: 'Aislante rígido económico. Núcleo estándar de sistemas SATE. Debe protegerse obligatoriamente de la radiación UV y fuego.' 
  },
  'eps_grafito': { 
    nombre: 'EPS Grafito (Alta Eficiencia)', k: 0.031, mu: 60, cp: 1450, co2: 2.6, rw: 0, densidad: 20, 
    precioMaterial: 110, precioManoObra: 30, categoria: 'aislamiento_sintetico', color: '#71717a', fuego: 'E', 
    marca: 'Grupo Valero S.A.', producto: 'Valero EPS Grafito', web: 'https://grupovalero.com/', convenio: 'Partner de Innovación UPV', 
    desc: 'Poliestireno dopado con grafito. Absorbe la radiación infrarroja reduciendo la transmitancia térmica un 20%.' 
  },
  'xps': { 
    nombre: 'Poliestireno Extruido (XPS)', k: 0.034, mu: 150, cp: 1450, co2: 3.0, rw: 0, densidad: 35, 
    precioMaterial: 140, precioManoObra: 35, categoria: 'aislamiento_sintetico', color: '#3b82f6', fuego: 'E', 
    marca: 'Derivados Asfálticos Normalizados S.A. (DANOSA)', producto: 'Danopren® TR', web: 'https://www.danosa.com/', convenio: 'Cátedra Danosa ETSIE', 
    desc: 'Estructura de celda cerrada. Imputrescible y no absorbe agua. El único aislante avalado por el CTE para Cubiertas Invertidas.' 
  },
  'pur': { 
    nombre: 'Poliuretano Proyectado in situ (PUR)', k: 0.028, mu: 60, cp: 1400, co2: 3.5, rw: 5, densidad: 35, 
    precioMaterial: 180, precioManoObra: 70, categoria: 'aislamiento_sintetico', color: '#facc15', fuego: 'E', 
    marca: 'Synthesia Technology Europe S.L.U.', producto: 'Poliuretan Spray', web: 'https://synthesia.com/', convenio: 'Colaborador Polímeros UPV', 
    desc: 'Aislamiento continuo sin juntas térmicas. Sella infiltraciones de aire adaptándose a la geometría de cámaras de aire.' 
  },
  'pir': { 
    nombre: 'Panel Poliisocianurato (PIR)', k: 0.022, mu: 100, cp: 1400, co2: 3.2, rw: 5, densidad: 32, 
    precioMaterial: 190, precioManoObra: 35, categoria: 'aislamiento_sintetico', color: '#fde047', fuego: 'B-s2,d0', 
    marca: 'Soprema Iberia S.L.U.', producto: 'EFYOS PIR', web: 'https://www.soprema.es/', convenio: 'Soprema Academia', 
    desc: 'Evolución química del PUR. Mayor resistencia térmica en menor espesor y mejor reacción al fuego certificada.' 
  },

  // --- AISLAMIENTO NATURAL/MINERAL ---
  'lana_roca': { 
    nombre: 'Panel Rígido Lana de Roca', k: 0.035, mu: 1, cp: 840, co2: 1.2, rw: 15, densidad: 40, 
    precioMaterial: 120, precioManoObra: 40, categoria: 'aislamiento_natural', color: '#78716c', fuego: 'A1', 
    marca: 'Rockwool Peninsular S.A.U.', producto: 'RockSATE Duo Plus', web: 'https://www.rockwool.es/', convenio: 'Colaborador Acústica UPV', 
    desc: 'Extraído de roca basáltica fundida. Aislamiento térmico, gran absorbente acústico y totalmente incombustible (Euroclase A1).' 
  },
  'lana_mineral': { 
    nombre: 'Manta Lana Mineral de Vidrio', k: 0.032, mu: 1, cp: 840, co2: 1.0, rw: 16, densidad: 25, 
    precioMaterial: 90, precioManoObra: 35, categoria: 'aislamiento_natural', color: '#fde047', fuego: 'A1', 
    marca: 'Saint-Gobain Isover Ibérica S.L.', producto: 'Arena Acústica', web: 'https://www.isover.es/', convenio: 'Premios Isover Universidades', 
    desc: 'Manta flexible e incombustible, se comprime y adapta a perfiles metálicos. Ideal para particiones secas (Pladur).' 
  },
  'fibra_madera': { 
    nombre: 'Panel Rígido Fibra de Madera', k: 0.040, mu: 3, cp: 2100, co2: -1.2, rw: 12, densidad: 160, 
    precioMaterial: 170, precioManoObra: 50, categoria: 'aislamiento_natural', color: '#b4846c', fuego: 'E', 
    marca: 'Steico SE', producto: 'Steico Therm', web: 'https://www.steico.com/es/', convenio: 'Ninguno', 
    desc: 'Material natural con altísimo calor específico (Cp = 2100 J/kgK). Genera un gran desfase térmico para proteger del calor estival.' 
  },
  'celulosa': { 
    nombre: 'Celulosa Insuflada (Papel Reciclado)', k: 0.038, mu: 2, cp: 2000, co2: -0.5, rw: 10, densidad: 50, 
    precioMaterial: 60, precioManoObra: 35, categoria: 'aislamiento_natural', color: '#d6d3d1', fuego: 'B-s2,d0', 
    marca: 'Aislanat S.L.', producto: 'Celulosa Aislanat', web: '#', convenio: 'Ninguno', 
    desc: 'Material ecológico tratado con sales de boro (ignífugo). Se insufla a presión en cámaras de aire vacías en rehabilitación.' 
  },
  'corcho_expandido': { 
    nombre: 'Placa Corcho Expandido Natural (ICB)', k: 0.040, mu: 10, cp: 1800, co2: -1.5, rw: 8, densidad: 110, 
    precioMaterial: 220, precioManoObra: 60, categoria: 'aislamiento_natural', color: '#8b5a2b', fuego: 'E', 
    marca: 'Amorim Cork Insulation S.A.', producto: 'Amorim Thermocork', web: 'https://www.amorimcorkinsulation.com/', convenio: 'Seminarios Bioconstrucción', 
    desc: '100% natural y renovable. Resiste la compresión y la humedad de forma natural. Excelente huella de carbono negativa.' 
  },
  'vidrio_celular': { 
    nombre: 'Placa de Vidrio Celular Rígido', k: 0.041, mu: 100000, cp: 1000, co2: 4.0, rw: 0, densidad: 110, 
    precioMaterial: 500, precioManoObra: 100, categoria: 'aislamiento_natural', color: '#1f2937', fuego: 'A1', 
    marca: 'Pittsburgh Corning Europe (Foamglas)', producto: 'Foamglas T4+', web: 'https://www.foamglas.com/', convenio: 'Ninguno', 
    desc: 'Aislamiento totalmente incombustible, impermeable al agua y al vapor (barrera total). Alta resistencia a compresión para cimentaciones.' 
  },

  // --- IMPERMEABILIZACIÓN ---
  'lamina_epdm': { 
    nombre: 'Lámina Impermeabilizante EPDM', k: 0.25, mu: 60000, cp: 1200, co2: 2.5, rw: 0, densidad: 1200, 
    precioMaterial: 4500, precioManoObra: 2000, categoria: 'impermeabilizacion', color: '#111827', fuego: 'E', 
    marca: 'Giscosa S.L.', producto: 'Giscolene EPDM 1.5mm', web: 'https://www.giscosa.com/', convenio: 'Ninguno', 
    desc: 'Lámina de caucho sintético monómero. Altísima elongación (300%) y vida útil probada a la intemperie superior a 50 años.' 
  },
  'lamina_pvc': { 
    nombre: 'Lámina Sintética de PVC plastificado', k: 0.17, mu: 20000, cp: 1000, co2: 2.8, rw: 0, densidad: 1300, 
    precioMaterial: 3500, precioManoObra: 2000, categoria: 'impermeabilizacion', color: '#374151', fuego: 'E', 
    marca: 'Sika España S.A.U.', producto: 'Sikaplan® G-15', web: 'https://esp.sika.com/', convenio: 'Sika Academia UPV', 
    desc: 'Lámina plástica armada termosoldable mediante aire caliente. Sistema muy estandarizado y rápido en cubiertas planas.' 
  },
  'lamina_asfaltica': { 
    nombre: 'Lámina Bituminosa Modificada (LBM)', k: 0.20, mu: 50000, cp: 1000, co2: 1.5, rw: 0, densidad: 1100, 
    precioMaterial: 1500, precioManoObra: 1300, categoria: 'impermeabilizacion', color: '#000000', fuego: 'E', 
    marca: 'Derivados Asfálticos Normalizados S.A. (DANOSA)', producto: 'Esterdan® 30 P Elast', web: 'https://www.danosa.com/', convenio: 'Cátedra Danosa ETSIE', 
    desc: 'Impermeabilización tradicional mediante betún elastomérico SBS. Suele aplicarse en sistema bicapa adherida a fuego con soplete.' 
  },
  'poliurea': { 
    nombre: 'Membrana Poliurea Proyectada en Caliente', k: 0.20, mu: 2500, cp: 1500, co2: 3.5, rw: 0, densidad: 1100, 
    precioMaterial: 8000, precioManoObra: 4000, categoria: 'impermeabilizacion', color: '#4b5563', fuego: 'E', 
    marca: 'Krypton Chemical S.L.', producto: 'Polyurea Rayston', web: '#', convenio: 'Ninguno', 
    desc: 'Aplicación líquida con máquina bi-componente. Cura en 3 segundos creando una piel elástica continua, impermeable y transitable.' 
  },

  // --- BARRERAS Y FILMS ---
  'barrera_vapor': { 
    nombre: 'Film Barrera de Vapor Polietileno', k: 0.33, mu: 100000, cp: 2200, co2: 2.0, rw: 0, densidad: 920, 
    precioMaterial: 1000, precioManoObra: 800, categoria: 'barreras_films', color: '#0ea5e9', fuego: 'F', 
    marca: 'Rothoblaas Iberia S.L.', producto: 'Vapor Stop', web: 'https://www.rothoblaas.es/', convenio: 'Seminarios Timber UPV', 
    desc: 'Capa plástica muy fina que impide matemáticamente la difusión de vapor de agua. Debe instalarse siempre en la cara "caliente" del aislante.' 
  },
  'lamina_transpirable': { 
    nombre: 'Lámina Transpirable (Cortavientos Exterior)', k: 0.20, mu: 0.02, cp: 1500, co2: 1.5, rw: 0, densidad: 600, 
    precioMaterial: 1200, precioManoObra: 900, categoria: 'barreras_films', color: '#bae6fd', fuego: 'E', 
    marca: 'Rothoblaas Iberia S.L.', producto: 'Traspir 110', web: 'https://www.rothoblaas.es/', convenio: 'Seminarios Timber UPV', 
    desc: 'Membrana técnica microperforada. Actúa como paravientos e impermeable exterior, pero permite "respirar" y evacuar el vapor del interior del muro.' 
  },
  'barrera_radon': { 
    nombre: 'Lámina Barrera Anti-Radón (DB-HS6)', k: 0.20, mu: 150000, cp: 2000, co2: 2.2, rw: 0, densidad: 1000, 
    precioMaterial: 1800, precioManoObra: 1200, categoria: 'barreras_films', color: '#8b5cf6', fuego: 'E', 
    marca: 'Asfaltos ChovA S.A.', producto: 'ChovA Radon', web: 'https://chova.com/', convenio: 'Partner HS6 UPV', 
    desc: 'Lámina plástica gruesa (>2mm) estanca a gases. Exigida por CTE en plantas bajas de zonas geográficas graníticas para bloquear el gas radón cancerígeno.' 
  },

  // --- MEMBRANAS ACÚSTICAS ---
  'lamina_acustica_visco': { 
    nombre: 'Lámina Acústica Viscoelástica Alta Densidad', k: 0.45, mu: 50000, cp: 1000, co2: 3.0, rw: 30, densidad: 2000, 
    precioMaterial: 3500, precioManoObra: 1000, categoria: 'membranas_acusticas', color: '#334155', fuego: 'B-s2,d0', 
    marca: 'Soprema Iberia S.L.U.', producto: 'Tecsound® 50', web: 'https://www.soprema.es/', convenio: 'Soprema Academia', 
    desc: 'Masa pesada viscoelástica (espesor <5mm). Rompe las frecuencias de coincidencia y resonancia en sistemas de tabiquería seca (Masa-Muelle-Masa).' 
  },
  'impacto_polietileno': { 
    nombre: 'Lámina Anti-Impacto Suelos (PE Reticulado)', k: 0.040, mu: 100, cp: 1400, co2: 1.5, rw: 0, densidad: 30, 
    precioMaterial: 800, precioManoObra: 400, categoria: 'membranas_acusticas', color: '#fef08a', fuego: 'F', 
    marca: 'Asfaltos ChovA S.A.', producto: 'ChovAImpact', web: 'https://chova.com/', convenio: 'Partner Acústica UPV', 
    desc: 'Desolidariza el mortero de nivelación respecto al forjado estructural. Obligatorio (DB-HR) para evitar transmisión de ruido de pisadas y arrastre de muebles.' 
  },

  // --- MORTEROS Y REVOCOS ---
  'mortero': { 
    nombre: 'Mortero de Cemento (Enfoscado/Reguladora)', k: 1.30, mu: 15, cp: 1000, co2: 0.14, rw: 30, densidad: 2000, 
    precioMaterial: 60, precioManoObra: 90, categoria: 'morteros_revocos', color: '#9ca3af', fuego: 'A1', 
    marca: 'Grupo Puma S.L.', producto: 'Morcem® Sec', web: 'https://www.grupopuma.com/', convenio: 'Cátedra Grupo Puma UPV', 
    desc: 'Capa base de cemento, arena y agua para regularizar paredes de fábrica o proteger elementos estructurales. Acabado rugoso no final.' 
  },
  'mortero_monocapa': { 
    nombre: 'Mortero Monocapa Raspado Exterior', k: 0.80, mu: 10, cp: 1000, co2: 0.15, rw: 25, densidad: 1500, 
    precioMaterial: 120, precioManoObra: 260, categoria: 'morteros_revocos', color: '#d6c6b4', fuego: 'A1', 
    marca: 'Saint-Gobain Weber Cemarksa S.A.', producto: 'Weberpral®', web: 'https://www.es.weber/', convenio: 'Saint-Gobain Academia UPV', 
    desc: 'Revestimiento decorativo exterior coloreado en masa. Impermeable al agua de lluvia directa pero permeable al vapor de agua interior.' 
  },
  'mortero_acrilico': { 
    nombre: 'Mortero Acrílico Fino (Acabado SATE)', k: 0.70, mu: 50, cp: 1000, co2: 0.30, rw: 20, densidad: 1400, 
    precioMaterial: 400, precioManoObra: 400, categoria: 'morteros_revocos', color: '#e5e5e5', fuego: 'B-s1,d0', 
    marca: 'Propamsa S.A.U.', producto: 'Revestimiento Revat®', web: 'https://www.propamsa.es/', convenio: 'Partner FA', 
    desc: 'Revestimiento sintético final para sistemas SATE. Gran flexibilidad para absorber tensiones térmicas del aislamiento subyacente sin fisurar.' 
  },
  'sate_adhesivo': { 
    nombre: 'Mortero Base/Adhesivo SATE (Armado con Malla)', k: 0.80, mu: 15, cp: 1000, co2: 0.20, rw: 10, densidad: 1400, 
    precioMaterial: 200, precioManoObra: 280, categoria: 'morteros_revocos', color: '#a8a29e', fuego: 'A1', 
    marca: 'Grupo Puma S.L.', producto: 'Traditerm® SATE', web: 'https://www.grupopuma.com/', convenio: 'Cátedra Grupo Puma UPV', 
    desc: 'Pasta polimérica de alta adherencia. Pega el panel aislante a la fachada y conforma la capa base armada con malla de fibra de vidrio.' 
  },
  'yeso': { 
    nombre: 'Enlucido / Guarnecido de Yeso Interior', k: 0.30, mu: 6, cp: 1000, co2: 0.12, rw: 20, densidad: 800, 
    precioMaterial: 40, precioManoObra: 120, categoria: 'morteros_revocos', color: '#f8fafc', fuego: 'A1', 
    marca: 'Saint-Gobain Placo Ibérica S.A.', producto: 'Proyal®', web: 'https://www.placo.es/', convenio: 'Saint-Gobain Academia', 
    desc: 'Revestimiento interior continuo amasado con agua. Aporta planimetría perfecta para pintar y regula de forma natural la humedad del ambiente.' 
  },
  'revoco_cal': { 
    nombre: 'Revoco de Cal Aérea Tradicional', k: 0.70, mu: 8, cp: 1000, co2: 0.08, rw: 20, densidad: 1400, 
    precioMaterial: 80, precioManoObra: 170, categoria: 'morteros_revocos', color: '#fcfaf2', fuego: 'A1', 
    marca: 'Kerakoll Ibérica S.A.', producto: 'Biocalce®', web: 'https://www.kerakoll.com/', convenio: 'Máster Restauración Patrimonio', 
    desc: 'Transpirabilidad máxima. Capacidad biocida natural por su alto pH. Material exigido en bioconstrucción y restauración de patrimonio histórico.' 
  },

  // --- PLACAS Y PANELES ---
  'pladur': { 
    nombre: 'Placa Yeso Laminado (PYL Standard N)', k: 0.25, mu: 10, cp: 1000, co2: 0.25, rw: 35, densidad: 800, 
    precioMaterial: 400, precioManoObra: 300, categoria: 'placas_paneles', color: '#e2e8f0', fuego: 'A2-s1,d0', 
    marca: 'Pladur Gypsum S.A.U.', producto: 'Placa Pladur® N 15', web: 'https://corporativo.pladur.com/', convenio: 'Concurso Arquitectura Pladur ETSIE', 
    desc: 'El sistema de tabiquería y trasdosado seco por excelencia. Acabado interior rápido, limpio y preparado para encintar y pintar.' 
  },
  'pladur_hidrofugo': { 
    nombre: 'Placa PYL Hidrófuga (H1 - Zonas Húmedas)', k: 0.25, mu: 10, cp: 1000, co2: 0.28, rw: 35, densidad: 850, 
    precioMaterial: 500, precioManoObra: 300, categoria: 'placas_paneles', color: '#bbf7d0', fuego: 'A2-s1,d0', 
    marca: 'Pladur Gypsum S.A.U.', producto: 'Placa Pladur® H1', web: 'https://corporativo.pladur.com/', convenio: 'Concurso Arquitectura Pladur', 
    desc: 'Placa verde. Tratamiento del núcleo de yeso con siliconas para evitar la absorción capilar de agua y vapor en tabiques de baños y cocinas.' 
  },
  'pladur_fuego': { 
    nombre: 'Placa PYL Cortafuego (F - Alta resistencia)', k: 0.25, mu: 10, cp: 1000, co2: 0.26, rw: 35, densidad: 900, 
    precioMaterial: 550, precioManoObra: 300, categoria: 'placas_paneles', color: '#fecaca', fuego: 'A1', 
    marca: 'Knauf GmbH Sucursal España', producto: 'Knauf Cortafuego DF', web: 'https://www.knauf.es/', convenio: 'Partner Universidad', 
    desc: 'Placa rosa. Armado del núcleo de yeso con malla de fibra de vidrio para mantener la cohesión mecánica durante un incendio severo.' 
  },
  'fibroyeso': { 
    nombre: 'Placa de Fibroyeso Alta Dureza', k: 0.32, mu: 13, cp: 1100, co2: 0.35, rw: 40, densidad: 1150, 
    precioMaterial: 700, precioManoObra: 350, categoria: 'placas_paneles', color: '#cbd5e1', fuego: 'A2-s1,d0', 
    marca: 'Fermacell Spain (James Hardie)', producto: 'Fermacell® Standard', web: '#', convenio: 'Ninguno', 
    desc: 'Yeso mezclado con fibras de celulosa. Dureza extrema al impacto y altísima capacidad de carga para colgar muebles sin refuerzos.' 
  },
  'placa_cemento': { 
    nombre: 'Placa de Cemento Exterior (Aquapanel)', k: 0.35, mu: 50, cp: 1000, co2: 0.30, rw: 40, densidad: 1150, 
    precioMaterial: 900, precioManoObra: 500, categoria: 'placas_paneles', color: '#94a3b8', fuego: 'A1', 
    marca: 'Knauf GmbH Sucursal España', producto: 'Aquapanel® Outdoor', web: 'https://www.knauf.es/', convenio: 'Partner Universidad', 
    desc: 'Placa inorgánica de cemento portland reforzada. 100% resistente al agua, hongos y a la intemperie. Soporte ideal para aplacados.' 
  },
  'osb': { 
    nombre: 'Panel de Virutas Orientadas (OSB 3)', k: 0.13, mu: 200, cp: 1600, co2: -0.9, rw: 25, densidad: 600, 
    precioMaterial: 350, precioManoObra: 200, categoria: 'placas_paneles', color: '#d97706', fuego: 'D-s2,d0', 
    marca: 'Financiera Maderera S.A. (FINSA)', producto: 'SuperPan Tech', web: 'https://www.finsa.com/', convenio: 'Cátedra Finsa ETSIE', 
    desc: 'Panel estructural de madera. Crucial para arriostrar a cortante las estructuras de entramado ligero (Timber Frame) o cubiertas.' 
  },
  'panel_composite': { 
    nombre: 'Panel Composite Aluminio (ACM)', k: 160.0, mu: 100000, cp: 880, co2: 6.0, rw: 25, densidad: 1800, 
    precioMaterial: 2500, precioManoObra: 1000, categoria: 'placas_paneles', color: '#9ca3af', fuego: 'B-s1,d0', 
    marca: 'Stac S.L. (Stacbond)', producto: 'Stacbond® PE/FR', web: 'https://stacbond.com/es/', convenio: 'Colaborador Tecnológico FA', 
    desc: 'Piel exterior tecnológica para fachadas ventiladas. Dos láminas de aluminio unidas por núcleo termoplástico o mineral.' 
  },
  'panel_hpl': { 
    nombre: 'Panel Fenólico HPL Alta Presión', k: 0.30, mu: 250, cp: 1400, co2: 1.5, rw: 20, densidad: 1400, 
    precioMaterial: 2800, precioManoObra: 700, categoria: 'placas_paneles', color: '#78350f', fuego: 'B-s2,d0', 
    marca: 'Trespa International B.V.', producto: 'Trespa® Meteon®', web: '#', convenio: 'Ninguno', 
    desc: 'Resinas termoendurecibles prensadas. Alta resistencia al impacto e inalterabilidad del color frente a los rayos UV.' 
  },

  // --- ACABADOS PESADOS ---
  'baldosa': { 
    nombre: 'Aplacado / Pavimento Gres Porcelánico', k: 1.00, mu: 10000, cp: 840, co2: 0.40, rw: 40, densidad: 2000, 
    precioMaterial: 1800, precioManoObra: 1000, categoria: 'acabados_pesados', color: '#78350f', fuego: 'A1', 
    marca: 'Porcelanosa Grupo A.I.E.', producto: 'STON-KER® Técnico', web: 'https://www.porcelanosa.com/es', convenio: 'Cátedra Porcelanosa UPV', 
    desc: 'Cerámica técnica prensada y cocida a >1200ºC. Absorción de agua prácticamente nula (<0.1%). Gran resistencia al desgaste y heladas.' 
  },
  'piedra_natural': { 
    nombre: 'Aplacado Piedra Natural / Cuarzo', k: 2.50, mu: 200, cp: 1000, co2: 0.05, rw: 55, densidad: 2600, 
    precioMaterial: 2500, precioManoObra: 1500, categoria: 'acabados_pesados', color: '#d6d3d1', fuego: 'A1', 
    marca: 'Cosentino S.A.', producto: 'Dekton® Ultracompacto', web: 'https://www.cosentino.com/es/', convenio: 'Partner Arquitectura', 
    desc: 'Máxima durabilidad estética y mecánica. Debido a su alto peso específico, en fachadas exige siempre anclajes mecánicos de acero inoxidable.' 
  },

  // --- ACABADOS METÁLICOS ---
  'chapa_zinc': { 
    nombre: 'Bandeja de Zinc Titanio (Junta Alzada)', k: 110.0, mu: 100000, cp: 380, co2: 3.5, rw: 15, densidad: 7200, 
    precioMaterial: 4000, precioManoObra: 2000, categoria: 'acabados_metalicos', color: '#94a3b8', fuego: 'A1', 
    marca: 'VMZinc (Sociedad Minera Pegñarroya)', producto: 'VMZinc QUARTZ', web: '#', convenio: 'Ninguno', 
    desc: 'Revestimiento metálico noble para cubiertas y fachadas. Material vivo que genera una pátina protectora natural de carbonato de zinc.' 
  },

  // --- CÁMARAS DE AIRE ---
  'camara_aire': { 
    nombre: 'Cámara de Aire Confinada (Estanca)', k: 0.18, mu: 1, cp: 1000, co2: 0, rw: 5, densidad: 1.2, 
    precioMaterial: 0, precioManoObra: 0, categoria: 'camaras_aire', color: '#0f172a', fuego: 'A1', 
    marca: 'Física Natural / Diseño Arquitectónico', producto: 'Espacio Vacío', web: '#', convenio: 'N/A', 
    desc: 'Espacio cerrado no ventilado (habitualmente <2cm). El aire inmóvil actúa como aislante térmico aportando una resistencia normativa estándar (R~0.18 m2K/W).' 
  },
  'camara_ventilada': { 
    nombre: 'Cámara de Aire EXTERIOR VENTILADA', k: 0.18, mu: 1, cp: 1000, co2: 0, rw: 0, densidad: 1.2, 
    precioMaterial: 0, precioManoObra: 0, categoria: 'camaras_aire', color: '#1e293b', fuego: 'A1', 
    marca: 'Física Natural / Diseño Arquitectónico', producto: 'Flujo Continuo (Tiro Térmico)', web: '#', convenio: 'N/A', 
    desc: 'Cámara conectada al aire exterior. Genera efecto chimenea evaporando humedades. Por DB-HE, la cámara y todas las capas situadas a su exterior NO computan para el cálculo de Transmitancia (U).' 
  },

  // --- AUXILIARES ---
  'grava': { 
    nombre: 'Capa de Grava de Protección (Canto rodado)', k: 2.00, mu: 1, cp: 800, co2: 0.01, rw: 15, densidad: 1500, 
    precioMaterial: 20, precioManoObra: 15, categoria: 'auxiliares', color: '#cbd5e1', fuego: 'A1', 
    marca: 'Proveedores de Áridos Locales (Genérico)', producto: 'Grava Lavada 16/32', web: '#', convenio: 'N/A', 
    desc: 'Lastre contra el levantamiento por succión de viento en cubiertas invertidas. Protege las láminas de la degradación por rayos UV directos.' 
  },
  'sustrato': { 
    nombre: 'Sustrato Vegetal Extensivo (Tierra Aligerada)', k: 1.00, mu: 2, cp: 1200, co2: 0.05, rw: 10, densidad: 1200, 
    precioMaterial: 45, precioManoObra: 15, categoria: 'auxiliares', color: '#451a03', fuego: 'A1', 
    marca: 'Projar S.A.', producto: 'Sustrato Cubierta Ecológica', web: 'https://www.projar.es/', convenio: 'Partner Sostenibilidad', 
    desc: 'Mezcla de materia orgánica y áridos ligeros (perlita/arlita) para techos verdes. Alta retención hídrica con bajo peso estructural saturado.' 
  },
  'geotextil': { 
    nombre: 'Fieltro Separador Geotextil (Poliéster)', k: 0.10, mu: 1, cp: 1000, co2: 1.8, rw: 0, densidad: 200, 
    precioMaterial: 350, precioManoObra: 150, categoria: 'auxiliares', color: '#94a3b8', fuego: 'E', 
    marca: 'Derivados Asfálticos Normalizados S.A. (DANOSA)', producto: 'Danofelt® PY 300', web: 'https://www.danosa.com/', convenio: 'Cátedra Danosa ETSIE', 
    desc: 'Capa antipunzonante y filtrante. Impide que las gravas o tierras perforen la impermeabilización y evita que finos colapsen el drenaje.' 
  },
};


// ============================================================================
// 2. COMPONENTES UI GLOBALES (Modales de Diálogo Nativos Custom)
// ============================================================================

const DialogoPersonalizado = ({ isOpen, type, title, message, onConfirm, onCancel, confirmText = "Confirmar Ejecución" }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex justify-center items-center p-4">
      <div className="bg-slate-900 border border-slate-700 shadow-[0_20px_60px_rgba(0,0,0,0.8)] rounded-2xl w-full max-w-md p-8 animate-in fade-in zoom-in-95">
        <div className="flex items-center mb-5">
          {type === 'warning' ? <AlertTriangle className="text-amber-500 mr-4" size={32}/> : 
           type === 'error' ? <AlertOctagon className="text-rose-500 mr-4" size={32}/> :
           <Activity className="text-cyan-500 mr-4" size={32}/>}
          <h3 className="text-xl font-black text-slate-100 tracking-wide">{title}</h3>
        </div>
        <p className="text-slate-300 text-sm mb-8 leading-relaxed font-medium">{message}</p>
        <div className="flex justify-end gap-4">
          {onCancel && <button onClick={onCancel} className="px-5 py-2.5 rounded-xl font-bold text-sm text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">Cancelar Operación</button>}
          <button onClick={onConfirm} className={`px-6 py-2.5 rounded-xl font-bold text-sm text-white shadow-xl transition-transform hover:scale-105 ${
            type === 'warning' ? 'bg-amber-700 hover:bg-amber-600 shadow-amber-900/50' : 
            type === 'error' ? 'bg-rose-700 hover:bg-rose-600 shadow-rose-900/50' :
            'bg-cyan-700 hover:bg-cyan-600 shadow-cyan-900/50'}`}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};


// ============================================================================
// 3. HOOKS (HISTORIAL ESTADO TIME-TRAVEL)
// ============================================================================
function useHistory(initialState) {
  const [history, setHistory] = useState([initialState]);
  const [pointer, setPointer] = useState(0);

  const setState = useCallback((action) => {
    setHistory((prevHistory) => {
      const currentState = prevHistory[pointer];
      const nextState = typeof action === 'function' ? action(currentState) : action;
      if (JSON.stringify(currentState) === JSON.stringify(nextState)) return prevHistory;
      const newHistory = prevHistory.slice(0, pointer + 1);
      newHistory.push(nextState);
      setPointer(newHistory.length - 1);
      return newHistory;
    });
  }, [pointer]);

  const undo = useCallback(() => setPointer((prev) => Math.max(0, prev - 1)), []);
  const redo = useCallback(() => setHistory((prev) => { setPointer(p => Math.min(prev.length - 1, p + 1)); return prev; }), []);

  return [history[pointer], setState, undo, redo, pointer > 0, pointer < history.length - 1];
}


// ============================================================================
// 4. MOTOR INTELIGENTE: ASISTENTE DIDÁCTICO, CÁLCULO FÍSICO Y AUTO-FIX (REGLAS TOPOLÓGICAS)
// ============================================================================
const motorDidacticoCTE = (capas, estadoProyecto) => {
  const validaciones = [];
  const instrucciones = [];
  
  if (capas.length === 0) {
    instrucciones.push({ tipo: 'guia', texto: "<strong>INICIO DEL DISEÑO CONSTRUCTIVO:</strong><br/>Tu lienzo de trabajo está vacío. Según los requerimientos del Documento Básico SE (Seguridad Estructural), todo cerramiento requiere una base portante. Empieza añadiendo una hoja principal desde las categorías <em>'Fábrica y Hormigones'</em> o <em>'Estructura Ligera'</em> en el panel izquierdo." });
    return { estado: 'vacio', valorU: 0, espesorTotal: 0, pesoPropio: 0, costeMateriales: 0, costeManoObra: 0, costeDirectoTotalM2: 0, co2Total: 0, RwEstimado: 0, validaciones, instrucciones, perfilTermico: [] };
  }

  const ambiente = estadoProyecto.ambiente;
  const zona = estadoProyecto.zona;
  const esCubierta = ambiente === 'cubierta';
  const esSuelo = ambiente === 'terreno';
  const esExterior = ambiente === 'fachada' || esCubierta;
  
  // 4.1 TERMODINÁMICA Y EVALUACIÓN FÍSICA
  const Rsi = esCubierta ? 0.10 : esSuelo ? 0.17 : 0.13;
  const Rse = esCubierta ? 0.04 : esSuelo ? 0.04 : 0.04;
  
  let totalR = Rsi + Rse;
  let espesorTotal = 0; let pesoPropio = 0; let costeMateriales = 0; let costeManoObra = 0; let co2Total = 0; 
  let maxRw = 0; let sdTotal = 0;
  
  let flags = {
    estructura: false, aislante: false, impermeable: false, barreraVapor: false, 
    camaraVentilada: false, acabadoExteriorCorrecto: false, acabadoInteriorCorrecto: false
  };
  
  const datosGlaser = []; 

  capas.forEach((capa, idx) => {
    const mat = BASE_DATOS_MATERIALES[capa.idMaterial];
    const espesorM = capa.espesor / 1000;
    espesorTotal += capa.espesor;
    
    // Cálculo de Resistencia Térmica (R)
    let capaR = 0;
    if (flags.camaraVentilada) {
       // Por normativa CTE, las capas exteriores a una cámara muy ventilada no aportan resistencia térmica (se considera intemperie en la cámara).
       capaR = 0; 
    } else {
       capaR = mat.categoria.includes('camara') ? (mat.nombre.includes('Estanca') ? 0.18 : 0) : (espesorM / mat.k);
    }
    
    totalR += capaR;
    sdTotal += (mat.mu * espesorM);
    pesoPropio += (espesorM * mat.densidad);
    
    if (mat.rw > maxRw) maxRw = mat.rw;
    co2Total += (espesorM * mat.densidad * mat.co2);
    
    // Sumatorio de Costes Directos (€/m²) para el Presupuesto Presto
    costeMateriales += (espesorM * mat.precioMaterial);
    costeManoObra += (espesorM * mat.precioManoObra);

    // Detectores Topológicos de Elementos
    if (['fabrica_pesada', 'estructura_ligera', 'placas_paneles'].includes(mat.categoria) && capa.espesor >= 40) flags.estructura = true;
    if (mat.categoria.includes('aislamiento')) flags.aislante = true;
    if (mat.categoria === 'impermeabilizacion') flags.impermeable = true;
    if (mat.nombre.includes('Vapor')) flags.barreraVapor = true;
    if (mat.nombre.includes('VENTILADA')) flags.camaraVentilada = true;
    
    // REGLA CRÍTICA: EVALUACIÓN DE CARAS EXPUESTAS
    // Índice 0 es la cara 1 (La que da a la calle/lluvia/sol o terreno).
    if (idx === 0) {
      if (['acabados_pesados', 'morteros_revocos', 'acabados_metalicos', 'auxiliares'].includes(mat.categoria)) flags.acabadoExteriorCorrecto = true;
      if (mat.nombre.includes('Cara Vista') || mat.nombre.includes('Hormigón Armado') || mat.nombre.includes('Bloque de Hormigón')) flags.acabadoExteriorCorrecto = true;
    }

    // Índice length - 1 es la última cara (La que se ve desde el salón de la vivienda).
    if (idx === capas.length - 1) {
      if (['acabados_pesados', 'morteros_revocos', 'placas_paneles', 'acabados_metalicos'].includes(mat.categoria)) flags.acabadoInteriorCorrecto = true;
      if (mat.nombre.includes('Cara Vista')) flags.acabadoInteriorCorrecto = true;
    }

    datosGlaser.push({ id: capa.id, nombre: mat.nombre, R: capaR, Sd: mat.mu * espesorM, espesorM, mat });
  });

  const U = totalR > 0 ? 1 / totalR : 0;
  const maxU = esCubierta ? ZONAS_CTE[zona].maxUCubierta : esSuelo ? ZONAS_CTE[zona].maxUSuelo : ZONAS_CTE[zona].maxUMuro;
  const costeDirectoTotalM2 = costeMateriales + costeManoObra;

  // 4.2 CÁLCULO FÍSICO MÉTODO DE GLASER (Aparición de Rocío)
  const T_int = 20; const HR_int = 0.50; 
  const T_ext = 0; const HR_ext = 0.80;
  const calcPsat = (T) => 610.5 * Math.exp((17.269 * T) / (237.3 + T)); // Fórmula de Magnus
  
  const P_in = HR_int * calcPsat(T_int);
  const P_out = HR_ext * calcPsat(T_ext);
  
  let tempActual = T_int - (Rsi / totalR) * (T_int - T_ext);
  let PvActual = P_in;
  let riesgoCondensacion = false;
  
  const perfilTermico = [{ x: 0, T: T_int, pos: 'Ambiente Interior' }, { x: 0, T: tempActual, pos: 'Superficie Int' }];
  let currentEspesorAcumulado = 0;

  // Recorremos de Interior a Exterior porque el vapor migra de zona caliente a fría
  const capasGlaserReversed = [...datosGlaser].reverse();
  
  capasGlaserReversed.forEach((stat) => {
    currentEspesorAcumulado += stat.espesorM * 1000;
    tempActual -= (stat.R / totalR) * (T_int - T_ext);
    PvActual -= (stat.Sd / sdTotal) * (P_in - P_out);
    perfilTermico.push({ x: currentEspesorAcumulado, T: tempActual, pos: stat.nombre });

    if (PvActual > calcPsat(tempActual)) riesgoCondensacion = true;
  });
  perfilTermico.push({ x: currentEspesorAcumulado, T: T_ext, pos: 'Intemperie Exterior' });

  // 4.3 MOTOR DE VALIDACIÓN ESTRICTA Y AUTO-SOLUCIONADOR (VARITA MÁGICA)

  // A) EJECUCIÓN CONSTRUCTIVA DE LAS CAPAS LÍMITE (Evitar lanas expuestas)
  if (esExterior && !flags.acabadoExteriorCorrecto && capas.length > 0) {
    const matExt = BASE_DATOS_MATERIALES[capas[0].idMaterial];
    validaciones.push({ id: 'Const-Ext', estado: 'error', titulo: 'Praxis Constructiva: Material Inadecuado a Intemperie', 
      mensaje: `La Capa 1 exterior [${matExt.nombre}] NO es resistente a la lluvia directa o a la radiación UV. Sufrirá una degradación fulminante.`, 
      didactica: `Nunca se expone un aislamiento, cámara, lámina o fábrica porosa al exterior sin protección. Debes proyectar un Mortero Monocapa (Revestimiento Continuo) o configurar una Fachada Ventilada.`,
      solucion: { tipo: 'agregar', material: 'mortero_monocapa', espesor: 15, posicion: 'exterior', textoBoton: 'Solucionar: Revestir con Mortero Monocapa (15mm)' }
    });
  }

  if ((ambiente.includes('interior') || ambiente === 'fachada' || ambiente === 'cubierta') && !flags.acabadoInteriorCorrecto && capas.length > 0) {
    const matInt = BASE_DATOS_MATERIALES[capas[capas.length - 1].idMaterial];
    validaciones.push({ id: 'Const-Int', estado: 'error', titulo: 'Praxis Constructiva: Paramento Interior Inacabado', 
      mensaje: `La Capa Interna [${matInt.nombre}] ha quedado totalmente al descubierto hacia el interior de la vivienda o recinto.`, 
      didactica: `Dejar bloques crudos, o peor aún, aislamientos de fibra (Lanas Minerales) al aire interior constituye un error grave de ejecución (desprendimiento de microfibras nocivas, patologías de polvo y estética inaceptable). Remátalo con una capa de Yeso o una Placa de Yeso Laminado (PYL).`,
      solucion: { tipo: 'agregar', material: 'yeso', espesor: 15, posicion: 'interior', textoBoton: 'Solucionar: Enlucir con Yeso (15mm)' }
    });
  }

  // B) SEGURIDAD ESTRUCTURAL (DB-SE)
  if (!flags.estructura) {
    validaciones.push({ id: 'SE', estado: 'error', titulo: 'DB-SE: Inestabilidad Estructural Detectada', 
      mensaje: `El cerramiento carece de una hoja portante o de un núcleo principal con resistencia al viento y peso.`, 
      didactica: `Leyes de la Estática: Toda configuración necesita una inercia mecánica base para no colapsar. Debes insertar obligatoriamente una fábrica (Ladrillo, Bloque), un panel CLT o un Entramado de madera/acero.`,
      solucion: { tipo: 'agregar', material: 'ladrillo_perforado', espesor: 115, posicion: 'interior_antes_acabado', textoBoton: 'Solucionar: Añadir Fábrica de Ladrillo (115mm)' }
    });
  } else if (!flags.aislante && esExterior && flags.acabadoExteriorCorrecto && flags.acabadoInteriorCorrecto) {
    instrucciones.push({ tipo: 'guia', texto: "<strong>Paso 2:</strong> Estructura y acabados resueltos. Sin embargo, este es un muro exterior, si lo dejas así, la calefacción se escapará a borbotones. Accede a la categoría de <span class='text-cyan-300 font-bold'>Aislamientos Térmicos</span>."});
  }

  // C) AHORRO DE ENERGÍA (DB-HE1)
  if (esExterior) {
    if (!flags.aislante) {
      validaciones.push({ id: 'HE1-Aisl', estado: 'error', titulo: 'DB-HE1: Puente Térmico Total Inaceptable', 
        mensaje: `No se ha instalado ningún Aislamiento Térmico Específico.`, 
        didactica: `Termodinámica de la Edificación: Materiales como el hormigón o el ladrillo son conductores del calor. Es mandatorio por normativa nZEB incluir barreras térmicas (XPS, EPS, Lanas, Aerogel).`,
        solucion: { tipo: 'agregar', material: 'eps_grafito', espesor: 80, posicion: 'exterior_estructura', textoBoton: 'Solucionar: Instalar Sistema SATE (EPS Grafito 80mm)' }
      });
    } else if (U > maxU) {
      validaciones.push({ id: 'HE1-U', estado: 'error', titulo: 'DB-HE1: Límite de Transmitancia Excedido', 
        mensaje: `U = ${U.toFixed(2)} W/m²K supera el límite estricto para la Zona ${zona} (${maxU.toFixed(2)} W/m²K).`, 
        didactica: `Fórmula General: Transmitancia (U) = 1 / Resistencia (R). Para disminuir la U debes aumentar la R. Esto se logra directamente añadiendo más milímetros de espesor al material aislante.`,
        solucion: { tipo: 'modificar_espesor', targetCategoria: 'aislamiento', incremento: 40, textoBoton: 'Solucionar: Aumentar Aislante Principal (+40mm)' }
      });
    } else {
      validaciones.push({ id: 'HE1-U', estado: 'ok', titulo: 'DB-HE1: Verificación Energética (nZEB)', mensaje: `Cálculo de Transmitancia válido: U = ${U.toFixed(2)} ≤ ${maxU.toFixed(2)} W/m²K.` });
    }

    if (riesgoCondensacion) {
      validaciones.push({ id: 'HE1-Cond', estado: 'error', titulo: 'DB-HE1: Condensación Intersticial Severa', 
        mensaje: `La Curva de Presión de Vapor cruza a la de Saturación. Se formará agua líquida dentro del muro.`, 
        didactica: `Higrometría: El vapor que se genera dentro de la vivienda atraviesa el muro y, al llegar a una capa muy fría (el aislante térmico), se condensa y empapa los materiales. Interpón una lámina estanca al vapor.`,
        solucion: { tipo: 'agregar', material: 'barrera_vapor', espesor: 1, posicion: 'antes_aislante', textoBoton: 'Solucionar: Sellar con Barrera de Vapor' }
      });
    }
  }

  // D) SALUBRIDAD Y PROTECCIÓN FRENTE A LA HUMEDAD (DB-HS1)
  if (ambiente === 'cubierta') {
    if (!flags.impermeable) {
      validaciones.push({ id: 'HS1', estado: 'error', titulo: 'DB-HS1: Cubierta Totalmente Permeable', 
        mensaje: `Carece absolutamente de una membrana impermeabilizante.`, 
        didactica: `Física de fluidos: Una cubierta plana acumula agua y la gravedad la filtra hacia la vivienda, provocando goteras inmediatas. Exigencia absoluta de láminas de estanqueidad.`,
        solucion: { tipo: 'agregar', material: 'lamina_pvc', espesor: 2, posicion: 'exterior_estructura', textoBoton: 'Solucionar: Termosoldar Lámina PVC (2mm)' }
      });
    } else if (flags.aislante) {
      const idxAislante = capas.findIndex(c => BASE_DATOS_MATERIALES[c.idMaterial].categoria.includes('aislamiento'));
      const idxImper = capas.findIndex(c => BASE_DATOS_MATERIALES[c.idMaterial].categoria === 'impermeabilizacion');
      
      // Si Aislante está antes (Exterior) que la impermeabilización -> Cubierta Invertida
      if (idxAislante > -1 && idxImper > -1 && idxAislante < idxImper) {
         if (!BASE_DATOS_MATERIALES[capas[idxAislante].idMaterial].nombre.includes('XPS')) {
            validaciones.push({ id: 'HS1-Inv', estado: 'error', titulo: 'DB-HS1: Error en Cubierta Invertida', 
              mensaje: `El aislante colocado a la intemperie por encima de la lámina DEBE ser XPS de celda cerrada.`, 
              didactica: `Has diseñado una cubierta invertida perfecta, excepto por el aislante. Materiales como EPS, lanas o PIR absorben el agua de lluvia, perdiendo su aislamiento λ. El XPS es el único imputrescible.`,
              solucion: { tipo: 'reemplazar', targetCategoria: 'aislamiento', nuevoMaterial: 'xps', textoBoton: 'Solucionar: Sustituir aislante exterior por XPS' }
            });
         }
      }
    }
  }

  // E) ACÚSTICA ARQUITECTÓNICA (DB-HR)
  let RwEstimado = maxRw > 0 ? maxRw + Math.log10(Math.max(pesoPropio, 1))*2 : 20 * Math.log10(Math.max(pesoPropio, 10)) + 15;
  if(flags.camaraVentilada || capas.some(c => BASE_DATOS_MATERIALES[c.idMaterial].nombre.includes('Lana') || BASE_DATOS_MATERIALES[c.idMaterial].categoria === 'membranas_acusticas')) RwEstimado += 12; 
  
  if (esExterior && RwEstimado < 50 && flags.estructura) {
    validaciones.push({ id: 'HR', estado: 'aviso', titulo: 'DB-HR: Rendimiento Acústico al Límite', 
      mensaje: `El Índice de reducción sonora Rw (~${RwEstimado.toFixed(0)} dB) es insuficiente frente a zonas de alto tráfico.`, 
      didactica: `Principios Acústicos: No confíes solo en la Ley de Masas de muros pesados. Para conseguir un confort acústico top, diseña un sistema disociado de 'Masa-Muelle-Masa' mediante lanas y placas laminadas.`,
      solucion: { tipo: 'agregar', material: 'lana_mineral', espesor: 46, posicion: 'interior_antes_acabado', textoBoton: 'Mejorar Acústica: Trasdosar (Lana Mineral + Pladur)', multi: true }
    });
  } else if (flags.estructura) {
    validaciones.push({ id: 'HR', estado: 'ok', titulo: 'DB-HR: Atenuación Sonora Conformada', mensaje: `Aislamiento a ruido aéreo estimado excelente: ~${RwEstimado.toFixed(0)} dB.` });
  }

  const numErrores = validaciones.filter(v => v.estado === 'error').length;
  const numAvisos = validaciones.filter(v => v.estado === 'aviso').length;

  if (numErrores === 0 && numAvisos === 0 && capas.length >= 3 && flags.acabadoExteriorCorrecto && flags.acabadoInteriorCorrecto) {
    instrucciones.push({ tipo: 'exito', texto: "🎓 <strong>¡EXCELENCIA TÉCNICA CONSEGUIDA!</strong> El detalle constructivo diseñado es perfecto. Resuelve la termodinámica, carece de condensaciones, está estructurado, acabado lógicamente y cumple todas las exigencias acústicas y de salubridad del CTE. Ya puedes enviar la partida al Presupuesto de Proyecto."});
  } else if (numErrores > 0) {
    instrucciones.push({ tipo: 'alerta', texto: `<strong>Tutoría Universitaria Activa:</strong> El sistema ha detectado <strong>${numErrores} infracción(es) normativa(s) o de ejecución constructiva grave.</strong><br/>No puedes validar un proyecto así en la vida real. Lee el fundamento físico en el panel inferior y presiona los botones de <strong>Solucionar</strong> para que el asistente reconfigure las capas automáticamente.`});
  }

  return { 
    estado: numErrores > 0 ? 'rojo' : numAvisos > 0 ? 'amarillo' : 'verde', 
    valorU: U, espesorTotal, pesoPropio, costeMateriales, costeManoObra, costeDirectoTotalM2, co2Total, RwEstimado,
    validaciones, instrucciones, perfilTermico 
  };
};

// ============================================================================
// 5. RENDERIZADORES GRÁFICOS COMPLEJOS (GLASER, CAD Y 3D)
// ============================================================================

const GlaserChart = ({ perfilTermico, espesorTotal }) => {
  if (!perfilTermico || perfilTermico.length < 3) return null;
  const width = 400; const height = 200;
  const padding = { top: 25, bottom: 35, left: 45, right: 25 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;
  const minT = Math.min(...perfilTermico.map(p => p.T), 0);
  const maxT = Math.max(...perfilTermico.map(p => p.T), 20);
  const getX = (x_mm) => padding.left + (x_mm / espesorTotal) * innerW;
  const getY = (T) => padding.top + innerH - ((T - minT) / (maxT - minT)) * innerH;

  const dPath = perfilTermico.map((p, i) => `${i===0?'M':'L'} ${getX(p.x)} ${getY(p.T)}`).join(' ');

  return (
    <div className="bg-[#0f172a] border border-slate-700/50 rounded-xl p-5 shadow-inner mt-4 print:hidden">
       <h4 className="text-[10px] uppercase font-black text-slate-400 mb-3 flex items-center tracking-widest"><ThermometerSnowflake size={14} className="mr-2 text-cyan-400"/> Gráfica Dinámica: Caída de Temperaturas</h4>
       <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-36 overflow-visible">
          {/* Ejes 0 y 20 */}
          <line x1={padding.left} y1={getY(0)} x2={width-padding.right} y2={getY(0)} stroke="#475569" strokeWidth="1" strokeDasharray="4,4"/>
          <text x={padding.left - 8} y={getY(0)} fill="#94a3b8" fontSize="10" fontWeight="bold" textAnchor="end" dominantBaseline="middle">0°C</text>
          
          <line x1={padding.left} y1={getY(20)} x2={width-padding.right} y2={getY(20)} stroke="#ef4444" strokeWidth="1" strokeDasharray="4,4" opacity="0.4"/>
          <text x={padding.left - 8} y={getY(20)} fill="#ef4444" fontSize="10" fontWeight="bold" textAnchor="end" dominantBaseline="middle">20°C</text>

          {/* Curva de Temperaturas */}
          <path d={dPath} fill="none" stroke="#0ea5e9" strokeWidth="3" style={{ filter: 'drop-shadow(0px 4px 6px rgba(14, 165, 233, 0.4))' }} />
          
          {/* Nodos Topológicos */}
          {perfilTermico.map((p, i) => (
             <g key={i}>
                <circle cx={getX(p.x)} cy={getY(p.T)} r="4" fill="#38bdf8" stroke="#020617" strokeWidth="2"/>
                {i > 0 && i < perfilTermico.length - 1 && (
                  <text x={getX(p.x)} y={getY(p.T) - 10} fill="#cbd5e1" fontSize="9" fontWeight="bold" textAnchor="middle" className="drop-shadow-lg">{p.T.toFixed(1)}°</text>
                )}
             </g>
          ))}
          {/* Identificadores de Lado */}
          <text x={padding.left} y={height - 10} fill="#64748b" fontSize="9" fontWeight="black" tracking="widest" textAnchor="start">INTERIOR VIVIENDA</text>
          <text x={width - padding.right} y={height - 10} fill="#64748b" fontSize="9" fontWeight="black" tracking="widest" textAnchor="end">EXTERIOR CALLE</text>
       </svg>
    </div>
  );
};

const Vista2DCAD = ({ capas, espesorTotal, ambiente }) => {
  let currentY = 0;
  return (
    <div className="w-full h-full bg-white sm:bg-[#0a0f1d] relative flex items-center justify-center overflow-hidden rounded-xl border border-slate-700/50 shadow-2xl print:border-slate-400 print:shadow-none print:bg-white print:m-0 print:h-[500px]">
      <div className="absolute top-4 left-4 text-[10px] font-bold text-cyan-500 font-mono tracking-widest flex items-center print:hidden bg-[#0a0f1d]/80 px-2 py-1 border border-cyan-900 rounded"><Ruler size={12} className="mr-1.5"/> SECCIÓN TÉCNICA 2D ACOTADA</div>
      <div className="absolute inset-0 opacity-10 pointer-events-none print:hidden" style={{ backgroundImage: 'linear-gradient(to right, #475569 1px, transparent 1px), linear-gradient(to bottom, #475569 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
      
      {capas.length > 0 && (
        <>
          <div className="absolute top-5 right-5 text-[9px] font-bold font-mono bg-blue-900/40 text-blue-200 border border-blue-500/50 px-3 py-1.5 rounded shadow-lg backdrop-blur-sm print:hidden uppercase tracking-widest">
            {ambiente === 'cubierta' ? 'SUPERIOR (INTEMPERIE)' : 'EXTERIOR (CARA FRÍA)'}
          </div>
          <div className="absolute bottom-5 right-5 text-[9px] font-bold font-mono bg-rose-900/40 text-rose-200 border border-rose-500/50 px-3 py-1.5 rounded shadow-lg backdrop-blur-sm print:hidden uppercase tracking-widest">
            {ambiente === 'cubierta' ? 'INFERIOR (INTERIOR)' : 'INTERIOR (CARA CÁLIDA)'}
          </div>
        </>
      )}

      <svg viewBox={`0 0 550 ${Math.max(400, espesorTotal + 150)}`} className="w-full max-h-[85%] z-10 drop-shadow-2xl transition-all duration-500 print:drop-shadow-none print:max-h-full">
        <defs>
          <pattern id="pat_ladrillo" patternUnits="userSpaceOnUse" width="12" height="12" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="12" stroke="#fca5a5" strokeWidth="1" opacity="0.4"/></pattern>
          <pattern id="pat_hormigon" patternUnits="userSpaceOnUse" width="16" height="16"><circle cx="4" cy="4" r="1.5" fill="#94a3b8" opacity="0.6"/><path d="M 8 2 L 10 4 L 6 4 Z" fill="#94a3b8" opacity="0.5"/></pattern>
          <pattern id="pat_aislante" patternUnits="userSpaceOnUse" width="10" height="10" patternTransform="rotate(45)"><line x1="0" y1="0" x2="10" y2="10" stroke="#fde047" strokeWidth="1" opacity="0.6"/><line x1="10" y1="0" x2="0" y2="10" stroke="#fde047" strokeWidth="1" opacity="0.6"/></pattern>
        </defs>
        
        <g transform="translate(180, 75)">
          <line x1="-70" y1="0" x2="-70" y2={espesorTotal} stroke="#0ea5e9" strokeWidth="1.5" strokeDasharray="4,4" className="print:stroke-black" />
          <line x1="-80" y1="0" x2="-60" y2="0" stroke="#0ea5e9" strokeWidth="1.5" className="print:stroke-black" />
          <line x1="-80" y1={espesorTotal} x2="-60" y2={espesorTotal} stroke="#0ea5e9" strokeWidth="1.5" className="print:stroke-black" />
          <text x="-85" y={espesorTotal/2} textAnchor="end" dominantBaseline="middle" fill="#0ea5e9" fontSize="14" fontFamily="monospace" fontWeight="bold" transform={`rotate(-90, -85, ${espesorTotal/2})`} className="print:fill-black tracking-wider">GROSOR TOTAL: {espesorTotal} mm</text>

          {capas.map((capa, idx) => {
            const mat = BASE_DATOS_MATERIALES[capa.idMaterial];
            const h = capa.espesor;
            const y = currentY;
            currentY += h;
            
            let pattern = '';
            if(mat?.categoria.includes('fabrica') && mat.nombre.includes('Ladrillo')) pattern = 'url(#pat_ladrillo)';
            else if(mat?.categoria.includes('fabrica')) pattern = 'url(#pat_hormigon)';
            else if(mat?.categoria.includes('aislamiento')) pattern = 'url(#pat_aislante)';
            
            return (
              <g key={capa.id} className="transition-all duration-300">
                {/* Cuadro principal del material */}
                <rect x="0" y={y} width="240" height={h} fill={mat?.color || '#cbd5e1'} opacity={mat.categoria.includes('camara') ? 0.2 : 0.8} className="print:stroke-black print:stroke-[0.5]" />
                {pattern && <rect x="0" y={y} width="240" height={h} fill={pattern} />}
                <line x1="0" y1={y} x2="240" y2={y} stroke="#0f172a" strokeWidth="1.5" className="print:stroke-black" />
                
                {/* Textos y cotas con lógica para evitar solapes visuales */}
                {h >= 12 ? (
                  <>
                    <line x1="245" y1={y + h/2} x2="270" y2={y + h/2} stroke="#64748b" strokeWidth="1" className="print:stroke-slate-500" />
                    <text x="275" y={y + h/2 - 3} dominantBaseline="baseline" fill="#f1f5f9" fontSize="12" fontFamily="sans-serif" fontWeight="800" className="print:fill-black">{mat?.nombre}</text>
                    <text x="275" y={y + h/2 + 13} dominantBaseline="baseline" fill="#94a3b8" fontSize="10" fontFamily="monospace" className="print:fill-slate-600 font-bold">Espesor: {h}mm | λ {mat?.k}</text>
                  </>
                ) : (
                   <>
                    <path d={`M 240 ${y + h/2} L 255 ${y + h/2} L 265 ${y + h/2 + (idx%2===0?-18:18)} L 275 ${y + h/2 + (idx%2===0?-18:18)}`} stroke="#64748b" fill="none" strokeWidth="1" className="print:stroke-slate-500" />
                    <text x="280" y={y + h/2 + (idx%2===0?-15:21)} dominantBaseline="baseline" fill="#cbd5e1" fontSize="11" fontFamily="sans-serif" fontWeight="600" className="print:fill-black">{mat?.nombre} <tspan fill="#94a3b8" fontSize="10" fontFamily="monospace" className="print:fill-slate-600">(e: {h}mm)</tspan></text>
                   </>
                )}
              </g>
            );
          })}
          <line x1="0" y1={currentY} x2="240" y2={currentY} stroke="#020617" strokeWidth="2" className="print:stroke-black" />
        </g>
      </svg>
    </div>
  );
};

const Vista3DAxo = ({ capas, espesorTotal }) => {
  return (
    <div className="w-full h-full bg-[#0f172a] relative flex items-center justify-center overflow-hidden rounded-xl border border-slate-700/50 shadow-inner print:hidden">
      <div className="absolute top-4 left-4 text-[10px] font-bold text-amber-500 font-mono tracking-widest flex items-center"><Box size={12} className="mr-1.5"/> MODELO 3D AXONOMETRÍA ISOMÉTRICA</div>
      
      {capas.length === 0 ? (
        <div className="text-slate-600 animate-pulse"><Box size={40} className="mx-auto mb-2 opacity-50"/> <span className="text-xs">Espacio de simulación 3D vacío</span></div>
      ) : (
        <div className="relative w-full h-full flex items-center justify-center pointer-events-none perspective-[1000px]">
          <div 
            className="relative transition-transform duration-[800ms] ease-out pointer-events-auto"
            style={{ transform: `rotateX(60deg) rotateZ(-45deg) scale(${Math.max(0.35, 0.7 - (espesorTotal/1500))})`, transformStyle: 'preserve-3d', width: '300px', height: '300px', marginTop: `${Math.min(180, espesorTotal/2)}px` }}
          >
            <div className="absolute top-0 left-0 w-full h-full bg-black/50 blur-2xl" style={{ transform: 'translateZ(-80px)' }}></div>
            {capas.map((capa, idx) => {
              const mat = BASE_DATOS_MATERIALES[capa.idMaterial];
              const capasAbajo = capas.slice(idx + 1);
              const zTranslate = capasAbajo.reduce((sum, c) => sum + c.espesor, 0) * 0.4;
              const h = capa.espesor * 0.4;
              const isTransparent = mat.categoria.includes('camara') || mat.nombre.includes('Lámina') || mat.nombre.includes('Film');
              
              return (
                <div key={capa.id} className="absolute top-0 left-0 w-full h-full transition-all duration-500 group"
                  style={{ backgroundColor: mat?.color || '#eee', transform: `translateZ(${zTranslate}px)`, opacity: isTransparent ? 0.3 : 1, border: isTransparent ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(0,0,0,0.6)', boxShadow: idx === 0 && !isTransparent ? 'inset 0 0 50px rgba(0,0,0,0.5)' : 'none', transformStyle: 'preserve-3d' }}>
                  
                  {/* Extrusión volumétrica */}
                  {!isTransparent && h > 1 && (
                    <>
                      <div className="absolute top-0 left-full w-full h-full origin-left bg-black/60 border border-black/70" style={{ width: `${h}px`, transform: `rotateY(90deg)` }}></div>
                      <div className="absolute top-full left-0 w-full h-full origin-top bg-black/80 border border-black/70" style={{ height: `${h}px`, transform: `rotateX(-90deg)` }}></div>
                    </>
                  )}

                  {/* Etiquetas flotantes contrarrotadas para legibilidad */}
                  {!isTransparent && h > 1 && (
                     <div className="absolute top-1/2 left-full origin-left opacity-0 group-hover:opacity-100 transition-opacity" style={{ transform: `translateY(-50%) translateZ(${h/2}px) rotateZ(45deg) rotateX(-60deg) translateX(50px)` }}>
                        <div className="relative flex items-center">
                          <div className="w-12 h-[1px] bg-cyan-400 -ml-12 absolute left-0 shadow-[0_0_8px_rgba(34,211,238,0.9)]"></div>
                          <span className="text-xs font-black text-white bg-[#020617]/95 border border-slate-600 px-3 py-1.5 rounded-lg shadow-2xl whitespace-nowrap ml-1 backdrop-blur-xl">
                             {mat.nombre} <span className="text-cyan-400 font-mono ml-2 border-l border-slate-700 pl-2">{capa.espesor} mm</span>
                          </span>
                        </div>
                     </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};


// ============================================================================
// 6. MODAL FICHA TÉCNICA OFICIAL (UNIVERSIDAD)
// ============================================================================
const ModalFichaTecnica = ({ material, onClose, onAdd }) => {
  if (!material) return null;
  return (
    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex justify-center items-center p-4">
       <div className="bg-slate-900 border border-slate-700 shadow-[0_25px_70px_rgba(0,0,0,0.9)] rounded-3xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95">
          <div className="p-6 border-b border-slate-800 flex justify-between items-start bg-[#020617] relative overflow-hidden">
             <div className="absolute -right-4 -top-8 opacity-5 text-cyan-500"><Factory size={140}/></div>
             <div className="relative z-10">
               <h3 className="text-2xl font-black text-cyan-400 leading-tight mb-2 pr-10">{material.nombre}</h3>
               <div className="flex gap-2">
                 <span className="text-[10px] font-bold text-slate-400 bg-slate-800 border border-slate-700 px-2.5 py-1 rounded uppercase tracking-widest">{CATEGORIAS_TECNICAS.find(c=>c.id===material.categoria)?.nombre}</span>
               </div>
             </div>
             <button onClick={onClose} className="text-slate-500 hover:text-rose-500 transition relative z-10 bg-slate-900 p-1.5 rounded-lg"><XCircle size={28}/></button>
          </div>
          
          <div className="p-8">
             <p className="text-sm text-slate-300 mb-8 italic border-l-4 border-cyan-700 pl-4 py-1 leading-relaxed bg-cyan-950/10 rounded-r-lg">"{material.desc}"</p>
             
             <div className="grid grid-cols-2 gap-5 mb-8">
                <div className="bg-slate-800/40 p-4 rounded-2xl border border-slate-700/50 shadow-inner">
                   <div className="text-[10px] text-slate-500 uppercase font-black tracking-wider mb-1">Conductividad Térmica (λ)</div>
                   <div className="font-mono text-3xl text-amber-400 font-bold">{material.k.toFixed(3)} <span className="text-xs text-slate-500 font-sans font-normal uppercase">W/mK</span></div>
                </div>
                <div className="bg-slate-800/40 p-4 rounded-2xl border border-slate-700/50 shadow-inner">
                   <div className="text-[10px] text-slate-500 uppercase font-black tracking-wider mb-1">Difusión al Vapor (μ)</div>
                   <div className="font-mono text-3xl text-blue-400 font-bold">{material.mu} <span className="text-xs text-slate-500 font-sans font-normal uppercase">-</span></div>
                </div>
                <div className="bg-slate-800/40 p-4 rounded-2xl border border-slate-700/50 shadow-inner">
                   <div className="text-[10px] text-slate-500 uppercase font-black tracking-wider mb-1">Densidad Volumétrica</div>
                   <div className="font-mono text-3xl text-slate-200 font-bold">{material.densidad} <span className="text-xs text-slate-500 font-sans font-normal uppercase">kg/m³</span></div>
                </div>
                <div className="bg-slate-800/40 p-4 rounded-2xl border border-slate-700/50 shadow-inner">
                   <div className="text-[10px] text-slate-500 uppercase font-black tracking-wider mb-1">Euroclase Fuego</div>
                   <div className="font-mono text-3xl text-rose-400 font-bold tracking-tight">{material.fuego}</div>
                </div>
             </div>

             <div className="flex flex-col bg-gradient-to-r from-emerald-950/60 to-[#020617] p-6 rounded-2xl border border-emerald-800/80 relative overflow-hidden shadow-xl">
               <div className="flex justify-between items-center mb-3">
                 <div className="flex items-center text-[10px] text-emerald-500 font-black uppercase tracking-widest"><GraduationCap size={16} className="mr-2"/> Red Cátedras Empresa UPV:</div>
                 {material.web !== '#' && <a href={material.web} target="_blank" rel="noreferrer" className="text-[10px] bg-emerald-800/60 text-white font-bold hover:bg-emerald-600 px-3 py-1.5 rounded-lg flex items-center transition shadow-lg"><ExternalLink size={12} className="mr-1.5"/> Entidad Matriz</a>}
               </div>
               <div className="font-black text-2xl text-white uppercase tracking-widest mt-1 mb-1">{material.marca}</div>
               <div className="text-sm text-emerald-300 font-bold flex items-center mb-3"><Box size={14} className="mr-1.5 opacity-70"/> Prescripción: <span className="text-emerald-100 ml-1 font-black">{material.producto}</span></div>
               <div className="text-[10px] text-emerald-600 uppercase font-black tracking-widest border-t border-emerald-900/80 pt-3 flex items-center"><Presentation size={12} className="mr-1.5"/> Vinculación ETSIE: <span className="text-emerald-400 ml-1">{material.convenio}</span></div>
             </div>
          </div>
          
          <div className="p-6 border-t border-slate-800 bg-[#020617] flex justify-end gap-4">
             <button onClick={onClose} className="px-6 py-3 text-sm font-bold text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition">Volver al Editor</button>
             <button onClick={() => { onAdd(); onClose(); }} className="px-8 py-3 bg-cyan-700 hover:bg-cyan-600 text-white text-sm font-black uppercase tracking-widest rounded-xl shadow-lg shadow-cyan-900/50 flex items-center transition-transform hover:scale-105"><Plus size={18} className="mr-2"/> Insertar en Muro</button>
          </div>
       </div>
    </div>
  );
};


// ============================================================================
// 7. APLICACIÓN PRINCIPAL MASTER
// ============================================================================

export default function App() {
  const [estadoProyecto, setEstadoProyecto] = useState({ zona: 'C', ambiente: 'fachada' }); 
  const [nombreCerramiento, setNombreCerramiento] = useState('Cerramiento Envolvente Tipo A');
  const [modoVisor, setModoVisor] = useState('2d'); 
  const [seccionActiva, setSeccionActiva] = useState('editor'); 
  
  const [capasCerramiento, setCapasCerramiento, deshacer, rehacer, canUndo, canRedo] = useHistory([]);
  
  const [elementosProyecto, setElementosProyecto] = useState([]);
  const [medicionGlobal, setMedicionGlobal] = useState(150);
  const [filasExpandidas, setFilasExpandidas] = useState({});
  
  const [searchTerm, setSearchTerm] = useState('');
  const [materialFocus, setMaterialFocus] = useState(null);
  const [dialogo, setDialogo] = useState(null);

  const finListaRef = useRef(null);

  const stats = useMemo(() => motorDidacticoCTE(capasCerramiento, estadoProyecto), [capasCerramiento, estadoProyecto]);

  const agregarCapaMaterial = (idMaterial) => {
    setCapasCerramiento(prev => [...prev, { id: `L_${Date.now()}_${Math.random()}`, idMaterial, espesor: 20 }]);
    setTimeout(() => finListaRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const modificarCapa = (id, campo, valor) => setCapasCerramiento(prev => prev.map(c => c.id === id ? { ...c, [campo]: campo === 'espesor' ? Number(valor) : valor } : c));
  const eliminarCapa = (id) => setCapasCerramiento(prev => prev.filter(c => c.id !== id));
  
  const moverCapa = (index, dir) => {
    if ((dir === -1 && index === 0) || (dir === 1 && index === capasCerramiento.length - 1)) return;
    setCapasCerramiento(prev => { const arr = [...prev]; [arr[index], arr[index + dir]] = [arr[index + dir], arr[index]]; return arr; });
  };

  const limpiarLienzo = () => { 
    setDialogo({
      type: 'warning', title: 'Peligro: Reset de Topología', message: 'Se procederá a la demolición virtual de todas las capas del detalle constructivo actual. Esta acción destrozará el lienzo. ¿Deseas proceder?',
      onConfirm: () => { setCapasCerramiento([]); setDialogo(null); },
      onCancel: () => setDialogo(null),
      confirmText: 'Sí, Demoler Capas'
    });
  };

  const aplicarSolucionCTE = (solucion) => {
    if (!solucion) return;
    setCapasCerramiento(prev => {
      const nuevas = [...prev];
      if (solucion.tipo === 'agregar') {
        const nuevaCapa = { id: `L_${Date.now()}_${Math.random()}`, idMaterial: solucion.material, espesor: solucion.espesor };
        if (solucion.posicion === 'exterior') nuevas.unshift(nuevaCapa);
        else if (solucion.posicion === 'interior') nuevas.push(nuevaCapa);
        else if (solucion.posicion === 'exterior_estructura') {
          const idx = nuevas.findIndex(c => ['fabrica_pesada', 'estructura_ligera'].includes(BASE_DATOS_MATERIALES[c.idMaterial].categoria));
          if (idx !== -1) nuevas.splice(idx, 0, nuevaCapa); else nuevas.unshift(nuevaCapa);
        }
        else if (solucion.posicion === 'antes_aislante') {
          const idx = nuevas.findIndex(c => BASE_DATOS_MATERIALES[c.idMaterial].categoria.includes('aislamiento'));
          if (idx !== -1) nuevas.splice(idx + 1, 0, nuevaCapa); else nuevas.push(nuevaCapa);
        }
        else if (solucion.posicion === 'interior_antes_acabado') {
          // Lo mete justo antes de la última capa, asumiendo que la última es el acabado interior.
          if (nuevas.length > 0) nuevas.splice(nuevas.length - 1, 0, nuevaCapa); else nuevas.push(nuevaCapa);
        }
        if (solucion.multi) nuevas.push({ id: `L_${Date.now()}_multi`, idMaterial: 'pladur', espesor: 15 });
      } 
      else if (solucion.tipo === 'modificar_espesor') {
         const idx = nuevas.findIndex(c => BASE_DATOS_MATERIALES[c.idMaterial].categoria.includes(solucion.targetCategoria));
         if(idx !== -1) nuevas[idx].espesor += solucion.incremento;
      } 
      else if (solucion.tipo === 'reemplazar') {
         const idx = nuevas.findIndex(c => BASE_DATOS_MATERIALES[c.idMaterial].categoria.includes(solucion.targetCategoria));
         if(idx !== -1) nuevas[idx].idMaterial = solucion.nuevoMaterial;
      }
      return nuevas;
    });
  };

  const anadirAPresupuesto = () => {
    if (capasCerramiento.length === 0) {
      return setDialogo({ type: 'error', title: 'Error de Presupuesto', message: 'No es posible enviar al Cuadro de Precios una partida constructiva vacía. Modela primero el cerramiento.', onConfirm: () => setDialogo(null), confirmText: 'Entendido' });
    }
    if (stats.estado === 'rojo') {
       return setDialogo({
         type: 'warning', title: 'Errores Normativos Críticos CTE', 
         message: 'El detalle arquitectónico actual incumple severamente la normativa técnica. Como técnico competente, ¿deseas asumir la responsabilidad y volcar esta partida defectuosa al presupuesto de licitación?',
         onConfirm: () => { setDialogo(null); ejecutarGuardadoPresupuesto(); },
         onCancel: () => setDialogo(null), confirmText: 'Bajo mi responsabilidad'
       });
    }
    ejecutarGuardadoPresupuesto();
  };

  const ejecutarGuardadoPresupuesto = () => {
    const descomposicion = capasCerramiento.map((c, i) => {
       const mat = BASE_DATOS_MATERIALES[c.idMaterial];
       const espM = c.espesor / 1000;
       return { 
         id: c.id, 
         codeM: `MT16${mat.categoria.substring(0,3).toUpperCase()}${i.toString().padStart(3,'0')}`, 
         codeO: `MO16${mat.categoria.substring(0,3).toUpperCase()}${i.toString().padStart(3,'0')}`,
         nombre: mat.nombre, producto: mat.producto, marca: mat.marca, espesor: c.espesor, 
         precioBaseMat: mat.precioMaterial, precioBaseMo: mat.precioManoObra, 
         rendimiento: espM, 
         importe: (mat.precioMaterial + mat.precioManoObra) * espM 
       };
    });

    setElementosProyecto(prev => [...prev, {
      id: Date.now(), nombre: nombreCerramiento, medicion: medicionGlobal,
      precioUnitario: stats.costeDirectoTotalM2, total: stats.costeDirectoTotalM2 * medicionGlobal,
      ambiente: CONDICIONES_AMBIENTALES.find(a=>a.id===estadoProyecto.ambiente).nombre, descomposicion
    }]);
    
    setDialogo({
      type: 'info', title: 'Partida Acoplada Exitosamente', 
      message: 'La justificación económica del cerramiento ha sido compilada en el Presupuesto Base de Licitación (PBL). ¿Deseas limpiar el área de diseño para componer un detalle nuevo?',
      onConfirm: () => { setCapasCerramiento([]); setNombreCerramiento("Nuevo Detalle Constructivo"); setDialogo(null); setSeccionActiva('presupuesto'); },
      onCancel: () => { setDialogo(null); setSeccionActiva('presupuesto'); }, confirmText: 'Limpiar Área'
    });
  };

  const toggleDesglose = (id) => setFilasExpandidas(prev => ({ ...prev, [id]: !prev[id] }));
  const eliminarPartida = (id) => setElementosProyecto(prev => prev.filter(p => p.id !== id));

  // CÁLCULOS ECONÓMICOS OFICIALES DE LA LEY DE CONTRATOS (LCSP ESPAÑA)
  const costeDirectoGuardado = elementosProyecto.reduce((acc, el) => acc + el.total, 0);
  const costeDirectoActual = capasCerramiento.length > 0 ? stats.costeDirectoTotalM2 * medicionGlobal : 0;
  
  const totalCosteDirecto = costeDirectoGuardado + costeDirectoActual; // CD
  const CostesIndirectos = totalCosteDirecto * 0.06; // CI: 6% s/ CD
  const PEM = totalCosteDirecto + CostesIndirectos; // P.E.M.
  const GastosGenerales = PEM * 0.13; // GG: 13% s/ PEM
  const BeneficioIndustrial = PEM * 0.06; // BI: 6% s/ PEM
  const PEC = PEM + GastosGenerales + BeneficioIndustrial; // Presupuesto Ejecución por Contrata
  const IVA = PEC * 0.21; // IVA: 21%
  const PBL = PEC + IVA; // Presupuesto Base de Licitación

  return (
    <div className="flex flex-col min-h-screen w-full bg-[#020617] text-slate-200 font-sans overflow-hidden selection:bg-cyan-900 selection:text-white print:h-auto print:overflow-visible print:bg-white print:text-black">
      
      {dialogo && <DialogoPersonalizado {...dialogo} />}
      {materialFocus && <ModalFichaTecnica material={BASE_DATOS_MATERIALES[materialFocus]} onClose={()=>setMaterialFocus(null)} onAdd={()=>agregarCapaMaterial(materialFocus)} />}

      {/* HEADER APLICACIÓN */}
      <div className="h-16 bg-[#0f172a] border-b border-slate-800 flex items-center px-8 shadow-2xl shrink-0 z-20 justify-between print:hidden">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-gradient-to-br from-cyan-600 to-indigo-900 rounded-xl flex items-center justify-center font-black text-xl text-white shadow-inner border border-cyan-400/50 mr-4">UPV</div>
          <div className="flex flex-col">
            <h1 className="font-black text-xl leading-tight text-slate-50 tracking-tight">ConstructoPro <span className="text-cyan-400 font-normal">Máster</span></h1>
            <h2 className="text-[9px] tracking-[0.3em] text-slate-500 uppercase flex items-center font-bold mt-0.5"><GraduationCap size={12} className="mr-1 text-slate-400"/> ETSIE Simulador Paramétrico</h2>
          </div>
        </div>
        
        <div className="flex bg-[#020617] p-1.5 rounded-xl border border-slate-800 shadow-inner">
          <button onClick={() => setSeccionActiva('editor')} className={`flex items-center px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${seccionActiva === 'editor' ? 'bg-cyan-900/80 text-cyan-300 shadow-md' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/80'}`}>
            <LayoutTemplate size={16} className="mr-2"/> Editor Topológico
          </button>
          <button onClick={() => setSeccionActiva('presupuesto')} className={`flex items-center px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${seccionActiva === 'presupuesto' ? 'bg-emerald-900/80 text-emerald-300 shadow-md' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/80'}`}>
            <Euro size={16} className="mr-2"/> LCSP Presupuestos <span className="ml-3 bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded shadow-inner">{elementosProyecto.length}</span>
          </button>
          <div className="w-px bg-slate-800 mx-3 my-2"></div>
          <button onClick={() => window.print()} disabled={elementosProyecto.length === 0 && capasCerramiento.length === 0} className="flex items-center px-8 py-2.5 bg-gradient-to-r from-indigo-700 to-indigo-900 hover:from-indigo-600 hover:to-indigo-800 disabled:opacity-30 disabled:grayscale rounded-lg text-xs font-black uppercase tracking-widest text-white shadow-[0_0_15px_rgba(67,56,202,0.5)] transition-all">
            <FileSignature size={16} className="mr-2"/> Exportar Visado
          </button>
        </div>
      </div>

      {/* ========================================================================================= */}
      {/* VISTA 1: ÁREA DE TRABAJO (EDITOR TOPOLÓGICO Y TUTOR) */}
      {/* ========================================================================================= */}
      {seccionActiva === 'editor' && (
        <div className="flex flex-1 overflow-hidden print:hidden">
          
          {/* 1.1 PANEL IZQUIERDO: Enciclopedia de Materiales */}
          <div className="w-[420px] bg-[#0f172a] border-r border-slate-800 flex flex-col shrink-0 z-10 shadow-[5px_0_25px_rgba(0,0,0,0.5)]">
            <div className="p-6 border-b border-slate-800 bg-[#020617] relative overflow-hidden">
              <div className="absolute -right-8 -top-8 text-slate-800 opacity-50"><MapPin size={100}/></div>
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-500 mb-5 flex items-center relative z-10"><Settings2 size={16} className="mr-2"/> Condicionantes Entorno CTE</h3>
              <div className="grid grid-cols-1 gap-4 text-sm relative z-10">
                <div className="flex flex-col">
                   <label className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-1.5 pl-1">Exigencia Climática</label>
                   <select className="bg-slate-900 border border-slate-700 text-slate-200 rounded-xl p-3 focus:border-cyan-500 outline-none transition-colors font-bold shadow-inner"
                     value={estadoProyecto.zona} onChange={e => setEstadoProyecto({...estadoProyecto, zona: e.target.value})}>
                     {Object.entries(ZONAS_CTE).map(([k, v]) => <option key={k} value={k}>ZONA {k} - {v.nombre}</option>)}
                   </select>
                </div>
                <div className="flex flex-col">
                   <label className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-1.5 pl-1">Emplazamiento Constructivo</label>
                   <select className="bg-slate-900 border border-slate-700 text-cyan-300 font-black rounded-xl p-3 focus:border-cyan-500 outline-none transition-colors shadow-inner"
                     value={estadoProyecto.ambiente} onChange={e => setEstadoProyecto({...estadoProyecto, ambiente: e.target.value})}>
                     {CONDICIONES_AMBIENTALES.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                   </select>
                </div>
              </div>
            </div>

            <div className="p-5 border-b border-slate-800 bg-[#0f172a]">
               <div className="relative group">
                 <Search size={18} className="absolute left-4 top-3.5 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
                 <input type="text" placeholder="Catálogo Oficial: Marca o Material..." className="w-full bg-[#020617] border border-slate-700 text-slate-100 font-medium rounded-xl pl-12 pr-4 py-3.5 text-sm outline-none focus:border-cyan-500 focus:shadow-[0_0_20px_rgba(34,211,238,0.15)] transition-all placeholder:text-slate-600"
                   value={searchTerm} onChange={e=>setSearchTerm(e.target.value.toLowerCase())} />
               </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-8">
              {CATEGORIAS_TECNICAS.map(cat => {
                const materialesCat = Object.entries(BASE_DATOS_MATERIALES).filter(([_, m]) => m.categoria === cat.id && (m.nombre.toLowerCase().includes(searchTerm) || m.marca.toLowerCase().includes(searchTerm)));
                if (materialesCat.length === 0) return null;
                return (
                  <div key={cat.id}>
                    <h4 className={`text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 mb-4 border-b-2 ${cat.color} pb-2 flex items-center`}><Box size={14} className="mr-2 opacity-70"/> {cat.nombre}</h4>
                    <div className="space-y-3">
                      {materialesCat.map(([id, mat]) => (
                        <div key={id} className="flex bg-[#020617]/70 hover:bg-cyan-950/40 border border-slate-800 hover:border-cyan-700 rounded-2xl cursor-pointer transition-all overflow-hidden group shadow-lg hover:shadow-[0_10px_20px_rgba(34,211,238,0.05)]">
                          <div className="flex-1 p-4 flex flex-col" onClick={() => agregarCapaMaterial(id)}>
                             <span className="font-black text-xs text-slate-200 group-hover:text-cyan-300 transition-colors leading-tight mb-1.5">{mat.nombre}</span>
                             <span className="text-[10px] text-emerald-500 font-bold mb-3 truncate bg-emerald-950/30 w-fit px-2 py-0.5 rounded border border-emerald-900/50">{mat.producto}</span>
                             <div className="flex justify-between mt-auto border-t border-slate-800/50 pt-2.5">
                               <span className="text-[9px] text-slate-500 font-mono bg-slate-900 px-2 py-1 rounded-lg border border-slate-700">λ {mat.k.toFixed(3)}</span>
                               <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider flex items-center"><Factory size={10} className="mr-1.5 text-slate-500"/> {mat.marca.split(' ')[0]}</span>
                             </div>
                          </div>
                          <button onClick={(e) => { e.stopPropagation(); setMaterialFocus(id); }} className="w-14 bg-slate-800/40 border-l border-slate-800 flex items-center justify-center text-cyan-600 hover:text-cyan-300 hover:bg-cyan-900/50 transition-colors" title="Ficha Técnica Oficial">
                            <Info size={20}/>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 1.2 PANEL CENTRAL: Visores y Módulo Live PEM */}
          <div className="flex-1 flex flex-col relative bg-[#020617] p-8 z-10">
            {/* Tutor Overlay Inteligente (Modo Máster) */}
            <div className="absolute top-8 left-1/2 -translate-x-1/2 z-30 w-full max-w-3xl pointer-events-none flex flex-col items-center">
               {stats.instrucciones.map((inst, idx) => (
                 <div key={idx} className={`mb-4 p-6 rounded-2xl border-2 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-start text-sm backdrop-blur-2xl leading-relaxed max-w-full transform transition-all animate-in slide-in-from-top-4 ${
                   inst.tipo === 'guia' ? 'bg-blue-950/95 border-blue-500/50 text-blue-100 shadow-blue-900/20' :
                   inst.tipo === 'alerta' ? 'bg-amber-950/95 border-amber-500/50 text-amber-100 shadow-amber-900/20' :
                   'bg-emerald-950/95 border-emerald-500/50 text-emerald-100 shadow-emerald-900/20'
                 }`}>
                    {inst.tipo === 'guia' && <Target size={32} className="mr-5 mt-0.5 shrink-0 text-blue-400"/>}
                    {inst.tipo === 'alerta' && <ShieldAlert size={32} className="mr-5 mt-0.5 shrink-0 text-amber-400"/>}
                    {inst.tipo === 'exito' && <CheckCircle size={32} className="mr-5 mt-0.5 shrink-0 text-emerald-400"/>}
                    <span className="font-medium" dangerouslySetInnerHTML={{__html: inst.texto}}></span>
                 </div>
               ))}
            </div>

            {/* Selector de Visualización Avanzada */}
            <div className="absolute top-10 right-10 z-30 flex bg-[#0f172a] border border-slate-700 rounded-xl p-2 shadow-2xl pointer-events-auto">
               <button onClick={() => setModoVisor('2d')} className={`px-6 py-3 text-xs font-black uppercase tracking-widest rounded-lg flex items-center transition-all ${modoVisor === '2d' ? 'bg-cyan-700 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}><Ruler size={16} className="mr-2"/> CAD Técnico</button>
               <button onClick={() => setModoVisor('3d')} className={`px-6 py-3 text-xs font-black uppercase tracking-widest rounded-lg flex items-center transition-all ${modoVisor === '3d' ? 'bg-amber-700 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}><Box size={16} className="mr-2"/> AXO Realidad</button>
            </div>

            {/* Lienzo Renderizado Gráfico */}
            <div className="flex-1 w-full h-full flex justify-center items-center pb-32">
                {modoVisor === '2d' ? <Vista2DCAD capas={capasCerramiento} espesorTotal={stats.espesorTotal} ambiente={estadoProyecto.ambiente} /> : <Vista3DAxo capas={capasCerramiento} espesorTotal={stats.espesorTotal} />}
            </div>

            {/* Widget: Live PEM Cost Calculator */}
            {capasCerramiento.length > 0 && (
              <div className="absolute bottom-8 w-[85%] left-[7.5%] bg-gradient-to-br from-[#0f172a] to-[#020617] backdrop-blur-2xl border border-slate-700 rounded-3xl p-6 shadow-[0_20px_60px_rgba(0,0,0,0.8)] pointer-events-auto flex items-center justify-between">
                <div className="flex items-center">
                   <div className="bg-emerald-950/80 p-4 rounded-2xl border border-emerald-900 mr-6 shadow-inner">
                      <Calculator size={32} className="text-emerald-400"/>
                   </div>
                   <div>
                     <h4 className="text-[10px] font-black uppercase text-emerald-500 tracking-[0.2em] mb-1.5 flex items-center"><Zap size={12} className="mr-1"/> Estimador de Ejecución Directa</h4>
                     <p className="text-sm text-slate-300 font-medium">Cálculo paramétrico de <strong className="text-white">Material + Mano de Obra</strong></p>
                   </div>
                </div>
                
                <div className="flex items-center gap-8">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-500 font-bold mb-2 uppercase tracking-widest pl-1">Superficie Total:</span>
                    <div className="flex items-center bg-[#020617] border-2 border-slate-800 rounded-xl overflow-hidden focus-within:border-cyan-500 transition-colors shadow-inner">
                      <input type="number" className="w-28 bg-transparent text-cyan-400 font-mono font-black text-right px-4 py-2.5 outline-none text-lg" value={medicionGlobal} onChange={e=>setMedicionGlobal(Number(e.target.value))} />
                      <span className="text-xs text-slate-500 font-black bg-slate-900 px-4 py-2.5 border-l border-slate-800">m²</span>
                    </div>
                  </div>
                  <div className="text-right border-l-2 border-slate-800 pl-8">
                    <div className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1.5">Importe de la Partida (CD)</div>
                    <div className="text-4xl font-black text-white font-mono tracking-tighter">{costeDirectoActual.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</div>
                  </div>
                  <button onClick={anadirAPresupuesto} className="bg-gradient-to-r from-emerald-600 to-emerald-800 hover:from-emerald-500 hover:to-emerald-700 text-white font-black text-sm px-8 py-5 rounded-2xl shadow-2xl shadow-emerald-900/50 flex items-center transition-all transform hover:scale-105 ml-4 uppercase tracking-widest border border-emerald-500">
                     <CheckSquare size={20} className="mr-3"/> Confirmar y Fijar
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 1.3 PANEL DERECHO: Pila Topológica y Tutor Interactivo CTE */}
          <div className="w-[550px] bg-[#0f172a] border-l border-slate-800 flex flex-col shrink-0 z-10 shadow-[-10px_0_30px_rgba(0,0,0,0.5)]">
            <div className="p-8 border-b border-slate-800 bg-[#020617]">
              <input type="text" className="w-full text-2xl font-black text-cyan-400 bg-transparent border-b-2 border-slate-700 outline-none focus:border-cyan-500 pb-2 mb-6 transition-colors placeholder:text-slate-700"
                value={nombreCerramiento} onChange={e => setNombreCerramiento(e.target.value)} placeholder="Denominación del Cerramiento..." />
              <div className="flex justify-between items-center">
                <div className="flex space-x-2 bg-slate-900 border border-slate-800 p-1.5 rounded-xl shadow-inner">
                  <button onClick={deshacer} disabled={!canUndo} className="p-2.5 hover:bg-slate-800 disabled:opacity-20 rounded-lg text-slate-400 transition-colors" title="Deshacer Cambio"><Undo2 size={18}/></button>
                  <button onClick={rehacer} disabled={!canRedo} className="p-2.5 hover:bg-slate-800 disabled:opacity-20 rounded-lg text-slate-400 transition-colors" title="Rehacer Cambio"><Redo2 size={18}/></button>
                </div>
                <button onClick={limpiarLienzo} className="text-xs font-black uppercase tracking-widest text-rose-500 hover:text-white hover:bg-rose-700 bg-rose-950/20 px-6 py-3 rounded-xl border border-rose-900/50 flex items-center transition-all"><Trash2 size={16} className="mr-2"/> Formatear Pila</button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto flex flex-col custom-scrollbar bg-[#0f172a]">
              <div className="p-6 min-h-[400px]">
                <div className="flex justify-between items-end mb-6">
                   <h3 className="text-xs font-black uppercase tracking-[0.15em] text-slate-300">Pila Estratigráfica</h3>
                   <span className="text-[11px] font-mono font-black text-cyan-300 bg-cyan-900/50 border border-cyan-700 px-4 py-2 rounded-xl shadow-inner">Σ Grosor: {stats.espesorTotal} mm</span>
                </div>
                
                {/* LÍMITE EXTERIOR */}
                <div className="flex items-center mb-6 mt-2">
                  <div className="h-px bg-blue-900/50 flex-1"></div>
                  <div className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] px-4">Límite Exterior (Intemperie / Cara Fría)</div>
                  <div className="h-px bg-blue-900/50 flex-1"></div>
                </div>
                
                <div className="space-y-3">
                  {capasCerramiento.map((capa, idx) => {
                    const mat = BASE_DATOS_MATERIALES[capa.idMaterial];
                    return (
                      <div key={capa.id} className="flex flex-col bg-[#020617] border border-slate-700/80 p-5 rounded-2xl shadow-xl relative group hover:border-cyan-500 transition-all hover:-translate-y-0.5">
                        <div className="flex items-center justify-between mb-4 pr-8">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-slate-900 rounded-xl flex items-center justify-center text-xs font-black text-cyan-500 mr-4 border border-slate-700 shadow-inner">{idx + 1}</div>
                            <div>
                               <span className="font-black text-base text-slate-100 block mb-0.5">{mat.nombre}</span>
                               <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">{CATEGORIAS_TECNICAS.find(c=>c.id===mat.categoria)?.nombre}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between pl-12">
                          <div className="text-[10px] font-mono text-emerald-500 bg-emerald-950/30 border border-emerald-900/50 px-2 py-1 rounded-md">{mat.marca.split(' ')[0]}</div>
                          <div className="flex items-center bg-slate-900 border-2 border-slate-700 rounded-xl overflow-hidden focus-within:border-cyan-500 transition-colors shadow-inner">
                            <span className="text-[9px] text-slate-400 px-4 font-black uppercase tracking-widest">Espesor</span>
                            <input type="number" className="w-20 text-right font-mono bg-[#020617] text-cyan-400 font-black px-3 py-2 outline-none text-base"
                              value={capa.espesor} min="1" onChange={(e) => modificarCapa(capa.id, 'espesor', e.target.value)} />
                            <span className="text-xs text-slate-500 px-4 bg-slate-900 font-black border-l border-slate-800 py-2">mm</span>
                          </div>
                        </div>
                        {/* Controles Reorden Topológico */}
                        <div className="absolute top-1/2 -translate-y-1/2 right-3 flex flex-col space-y-2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900/95 backdrop-blur-xl p-2 rounded-xl border border-slate-700 shadow-2xl">
                            <button onClick={() => moverCapa(idx, -1)} disabled={idx === 0} className="text-slate-400 hover:text-cyan-400 disabled:opacity-20 p-1"><ArrowUp size={20}/></button>
                            <div className="w-full h-px bg-slate-700"></div>
                            <button onClick={() => eliminarCapa(capa.id)} className="text-slate-400 hover:text-rose-500 p-1"><Trash2 size={20}/></button>
                            <div className="w-full h-px bg-slate-700"></div>
                            <button onClick={() => moverCapa(idx, 1)} disabled={idx === capasCerramiento.length - 1} className="text-slate-400 hover:text-cyan-400 disabled:opacity-20 p-1"><ArrowDown size={20}/></button>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={finListaRef}></div>
                </div>
                
                {/* LÍMITE INTERIOR */}
                {capasCerramiento.length > 0 && (
                  <div className="flex items-center mt-8 mb-4">
                    <div className="h-px bg-rose-900/50 flex-1"></div>
                    <div className="text-[10px] font-black text-rose-400 uppercase tracking-[0.3em] px-4">Límite Interior (Espacio Habitable)</div>
                    <div className="h-px bg-rose-900/50 flex-1"></div>
                  </div>
                )}
              </div>

              {/* Módulo Analítico Inferior (Tutor CTE) */}
              {capasCerramiento.length > 0 && (
                <div className="p-6 bg-[#020617] border-t-2 border-slate-800 mt-auto">
                  <div className="flex justify-between items-center mb-8 gap-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col flex-1 text-center shadow-inner relative overflow-hidden">
                      <div className="absolute -left-4 -bottom-4 opacity-5 text-cyan-400"><Wind size={80}/></div>
                      <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-2 relative z-10">Térmica U</span>
                      <span className="font-mono text-2xl font-black text-cyan-400 relative z-10">{stats.valorU.toFixed(2)}</span>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col flex-1 text-center shadow-inner relative overflow-hidden">
                      <div className="absolute -left-4 -bottom-4 opacity-5 text-purple-400"><Volume2 size={80}/></div>
                      <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-2 relative z-10">Acústica Rw</span>
                      <span className="font-mono text-2xl font-black text-purple-400 relative z-10">~{stats.RwEstimado.toFixed(0)}</span>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col flex-1 text-center shadow-inner relative overflow-hidden">
                      <div className="absolute -left-4 -bottom-4 opacity-5 text-amber-400"><Weight size={80}/></div>
                      <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-2 relative z-10">Masa DB-SE</span>
                      <span className="font-mono text-2xl font-black text-amber-400 relative z-10">{stats.pesoPropio.toFixed(0)}</span>
                    </div>
                  </div>

                  <GlaserChart perfilTermico={stats.perfilTermico} espesorTotal={stats.espesorTotal} />

                  <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-300 mb-6 mt-10 flex items-center border-b border-slate-800 pb-3"><BookOpen size={20} className="mr-3 text-indigo-500"/> Corrección CTE Magistral</h3>
                  <div className="space-y-4">
                    {stats.validaciones.map((val, i) => (
                      <div key={i} className={`p-5 rounded-2xl border-2 text-sm leading-relaxed shadow-xl ${
                        val.estado === 'error' ? 'bg-rose-950/20 border-rose-900/60' : 
                        val.estado === 'aviso' ? 'bg-amber-950/20 border-amber-900/60' : 
                        'bg-emerald-950/10 border-emerald-900/40'
                      }`}>
                        <div className="flex items-start">
                          {val.estado === 'error' ? <XCircle size={28} className="text-rose-500 mr-4 mt-1 shrink-0"/> :
                           val.estado === 'aviso' ? <AlertTriangle size={28} className="text-amber-500 mr-4 mt-1 shrink-0"/> :
                           <CheckCircle size={28} className="text-emerald-500 mr-4 mt-1 shrink-0"/>}
                          <div className="flex-1">
                            <strong className={`block uppercase text-[11px] tracking-widest mb-2 ${val.estado === 'error' ? 'text-rose-400' : val.estado === 'aviso' ? 'text-amber-400' : 'text-emerald-400'}`}>{val.titulo}</strong>
                            <span className="font-bold text-slate-100 mb-2 block text-base leading-snug">{val.mensaje}</span>
                            {val.estado !== 'ok' && <span className="text-xs text-slate-400 block border-t border-slate-800/80 pt-3 mt-3 leading-relaxed font-medium bg-[#020617]/80 p-4 rounded-xl shadow-inner"><strong className="text-cyan-500">Razonamiento Físico:</strong> {val.didactica}</span>}
                            
                            {/* BOTÓN AUTO-FIX MÁGICO */}
                            {val.solucion && (
                               <button onClick={() => aplicarSolucionCTE(val.solucion)} className={`mt-5 w-full py-4 px-4 rounded-xl flex justify-center items-center font-black text-xs uppercase tracking-widest transition-all transform hover:scale-[1.02] shadow-2xl border ${val.estado === 'error' ? 'bg-indigo-700 hover:bg-indigo-600 text-white shadow-indigo-900/50 border-indigo-500' : 'bg-cyan-800 hover:bg-cyan-700 text-white shadow-cyan-900/50 border-cyan-600'}`}>
                                  <Wand2 size={18} className="mr-3"/> {val.solucion.textoBoton}
                               </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================================= */}
      {/* VISTA 2: ÁREA DE PRESUPUESTO GLOBAL (LEY DE CONTRATOS - ESPAÑA) */}
      {/* ========================================================================================= */}
      {seccionActiva === 'presupuesto' && (
        <div className="flex-1 overflow-y-auto p-12 bg-[#020617] print:hidden relative z-10 custom-scrollbar">
           <div className="max-w-[1400px] mx-auto">
              <div className="flex justify-between items-end mb-12 border-b-2 border-slate-800 pb-8">
                 <div>
                    <h2 className="text-4xl font-black text-slate-50 flex items-center tracking-tight mb-3"><ClipboardList size={40} className="mr-4 text-emerald-500"/> Presupuesto Base de Licitación</h2>
                    <p className="text-sm text-slate-400 font-medium tracking-wide border-l-4 border-cyan-700 pl-4 py-1 leading-relaxed max-w-3xl">Estructura paramétrica según Ley 9/2017 de Contratos del Sector Público. Precios de mercado desglosados (Material + Mano de Obra) extraídos de la Base de Datos de Construcción del Instituto Valenciano de la Edificación (IVE 2026).</p>
                 </div>
                 <div className="text-right bg-gradient-to-br from-slate-900 to-[#020617] p-8 rounded-3xl border border-slate-700 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                    <p className="text-xs text-emerald-500 uppercase tracking-[0.3em] font-black mb-2">Total Presupuestado (PBL)</p>
                    <p className="text-6xl font-mono text-white font-black">{PBL.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</p>
                 </div>
              </div>

              {elementosProyecto.length === 0 && capasCerramiento.length === 0 ? (
                <div className="text-center p-32 border-2 border-slate-800 border-dashed rounded-3xl bg-slate-900/20">
                   <Briefcase size={80} className="mx-auto text-slate-700 mb-8" />
                   <h3 className="text-3xl font-black text-slate-300 mb-3">Expediente Económico Vacío</h3>
                   <p className="text-lg text-slate-500 mb-10">Debes diseñar tus detalles constructivos en el entorno de trabajo y aprobar la normativa para fijar su coste aquí.</p>
                   <button onClick={() => setSeccionActiva('editor')} className="px-10 py-5 bg-cyan-700 hover:bg-cyan-600 text-sm font-black uppercase tracking-widest text-white rounded-2xl shadow-[0_10px_30px_rgba(34,211,238,0.3)] transition-transform hover:scale-105">Acceder al Entorno de Diseño</button>
                </div>
              ) : (
                <div className="bg-[#0f172a] rounded-3xl border border-slate-700 overflow-hidden shadow-2xl mb-16">
                   <table className="w-full text-left text-base">
                      <thead className="bg-[#020617] text-slate-400 text-xs uppercase font-black tracking-widest border-b-2 border-slate-800">
                         <tr>
                            <th className="p-8 w-12 text-center">Info</th>
                            <th className="p-8 w-24">Código</th>
                            <th className="p-8">Descripción de la Unidad de Obra (Partida)</th>
                            <th className="p-8 text-center">Tipología</th>
                            <th className="p-8 text-right">Medición</th>
                            <th className="p-8 text-right">Coste Directo</th>
                            <th className="p-8 text-right">Importe Total</th>
                            <th className="p-8 text-center w-28">Acción</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/80">
                         
                         {/* Iteración de Partidas Aprobadas y Guardadas */}
                         {elementosProyecto.map((el, i) => (
                            <React.Fragment key={el.id}>
                              <tr className="hover:bg-slate-800/50 transition-colors group cursor-pointer" onClick={() => toggleDesglose(el.id)}>
                                 <td className="p-8 text-slate-500 text-center">{filasExpandidas[el.id] ? <ChevronUp size={24}/> : <ChevronDown size={24}/>}</td>
                                 <td className="p-8 text-sm font-mono text-slate-500 font-bold tracking-wider">C{i+1}</td>
                                 <td className="p-8 font-black text-slate-100 text-xl tracking-tight">{el.nombre}</td>
                                 <td className="p-8 text-center"><span className="bg-[#020617] border border-slate-700 px-4 py-2 rounded-xl text-[10px] uppercase font-bold tracking-widest text-cyan-400 shadow-inner">{el.ambiente}</span></td>
                                 <td className="p-8 text-right font-mono text-slate-300 text-lg">{el.medicion.toFixed(2)} m²</td>
                                 <td className="p-8 text-right font-mono text-slate-400 text-lg">{el.precioUnitario.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</td>
                                 <td className="p-8 text-right font-mono text-2xl font-black text-emerald-400">{el.total.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</td>
                                 <td className="p-8 text-center" onClick={(e) => e.stopPropagation()}>
                                    <button onClick={() => eliminarPartida(el.id)} className="text-slate-600 hover:text-rose-500 hover:bg-rose-950/40 p-3 rounded-xl transition-all opacity-0 group-hover:opacity-100"><Trash2 size={24}/></button>
                                 </td>
                              </tr>
                              
                              {/* SUB-TABLA: Cuadro de Precios Descompuestos Estilo Presto */}
                              {filasExpandidas[el.id] && (
                                <tr className="bg-[#020617]/90 shadow-inner">
                                   <td colSpan="8" className="p-10 border-b-2 border-slate-700/50">
                                      <div className="bg-slate-900 border border-slate-700 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                                         <div className="absolute right-0 top-0 w-32 h-32 bg-cyan-900/10 rounded-bl-full pointer-events-none"></div>
                                         <h5 className="text-xs font-black text-cyan-500 uppercase tracking-[0.25em] mb-6 flex items-center border-b border-slate-800 pb-3"><Layers size={16} className="mr-3"/> Justificación de Precios - Descomposición de la Partida C{i+1}</h5>
                                         
                                         <table className="w-full text-sm">
                                            <thead className="text-slate-500 font-mono text-[11px] border-b-2 border-slate-800 uppercase tracking-widest bg-slate-950/50">
                                               <tr>
                                                  <th className="p-3 text-left w-32">Cód. IVE</th>
                                                  <th className="p-3 text-left">Especificación Técnica Material / Empresa Suministradora</th>
                                                  <th className="p-3 text-center">Espesor</th>
                                                  <th className="p-3 text-right">Rendimiento Ud.</th>
                                                  <th className="p-3 text-right">Precio Base (€/m³)</th>
                                                  <th className="p-3 text-right">Parcial</th>
                                               </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-800/40 font-mono text-xs">
                                               
                                               {/* Desglose de cada capa como material + su mano de obra implicita */}
                                               {el.descomposicion.map((desc, idxDesc) => (
                                                  <React.Fragment key={idxDesc}>
                                                    {/* Fila Material */}
                                                    <tr className="text-slate-300 hover:bg-slate-800/40 transition-colors">
                                                       <td className="p-3 font-bold text-slate-500">{desc.codeM}</td>
                                                       <td className="p-3 text-cyan-100 font-sans font-bold flex items-center"><Box size={14} className="mr-2 text-cyan-700"/> [MATERIAL] {desc.producto} <span className="text-slate-500 ml-2 font-normal">({desc.marca})</span></td>
                                                       <td className="p-3 text-center">{desc.espesor} mm</td>
                                                       <td className="p-3 text-right text-slate-400">{desc.rendimiento.toFixed(3)} m³/m²</td>
                                                       <td className="p-3 text-right text-slate-400">{desc.precioBaseMat.toFixed(2)} €</td>
                                                       <td className="p-3 text-right font-black text-cyan-400">{(desc.precioBaseMat * desc.rendimiento).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</td>
                                                    </tr>
                                                    {/* Fila Mano de Obra para colocar ese material */}
                                                    {(desc.precioBaseMo > 0) && (
                                                      <tr className="text-slate-400 bg-slate-900/30 hover:bg-slate-800/40 transition-colors">
                                                         <td className="p-3 font-bold text-slate-600">{desc.codeO}</td>
                                                         <td className="p-3 text-emerald-200/80 font-sans font-medium flex items-center pl-6"><HardHat size={14} className="mr-2 text-emerald-800"/> [MANO OBRA] Cuadrilla Especializada instalación {desc.nombre.split(' ')[0]}</td>
                                                         <td className="p-3 text-center">-</td>
                                                         <td className="p-3 text-right text-slate-500">{desc.rendimiento.toFixed(3)} m³/m²</td>
                                                         <td className="p-3 text-right text-slate-500">{desc.precioBaseMo.toFixed(2)} €</td>
                                                         <td className="p-3 text-right font-black text-emerald-500/80">{(desc.precioBaseMo * desc.rendimiento).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</td>
                                                      </tr>
                                                    )}
                                                  </React.Fragment>
                                               ))}
                                               
                                               {/* Costes Directos Complementarios Clásicos (2%) */}
                                               <tr className="text-slate-400 bg-slate-950/50 border-t-2 border-slate-800">
                                                  <td className="p-3 font-bold text-slate-600">%M2</td>
                                                  <td className="p-3 font-sans font-bold text-slate-400">Costes Directos Complementarios (Medios Auxiliares)</td>
                                                  <td className="p-3 text-center">-</td>
                                                  <td className="p-3 text-right">2.000 %</td>
                                                  <td className="p-3 text-right text-slate-500">{el.precioUnitario.toFixed(2)} €</td>
                                                  <td className="p-3 text-right font-black text-slate-300">{(el.precioUnitario * 0.02).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</td>
                                               </tr>
                                            </tbody>
                                         </table>
                                         <div className="flex justify-end mt-4 pt-4 border-t border-slate-800">
                                           <div className="text-right">
                                             <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mr-4">Total Coste Directo Partida C{i+1}:</span>
                                             <span className="text-xl font-black font-mono text-white">{(el.precioUnitario * 1.02).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })} <span className="text-xs text-slate-500 font-sans">/ m²</span></span>
                                           </div>
                                         </div>
                                      </div>
                                   </td>
                                </tr>
                              )}
                            </React.Fragment>
                         ))}
                         
                         {/* ELEMENTO EN EDICIÓN EN TIEMPO REAL (Simulación viva) */}
                         {capasCerramiento.length > 0 && (
                            <tr className="bg-cyan-950/20 hover:bg-cyan-900/30 transition-colors group border-t-4 border-cyan-800">
                               <td className="p-8"></td>
                               <td className="p-8 text-base font-mono text-cyan-500 font-black">---</td>
                               <td className="p-8 font-black text-cyan-300 text-xl flex items-center">
                                  {nombreCerramiento} <span className="ml-4 text-xs bg-cyan-900 text-cyan-200 px-3 py-1 rounded uppercase tracking-[0.2em] border border-cyan-700 shadow-lg animate-pulse">Lienzo Activo</span>
                               </td>
                               <td className="p-8 text-center"><span className="bg-[#020617] border border-cyan-700 px-4 py-2 rounded-xl text-[10px] uppercase font-bold tracking-widest text-cyan-400 shadow-inner">{CONDICIONES_AMBIENTALES.find(a=>a.id===estadoProyecto.ambiente)?.nombre.split('(')[0] || estadoProyecto.ambiente}</span></td>
                               <td className="p-8 text-right font-mono text-cyan-200 text-lg">{medicionGlobal.toFixed(2)} m²</td>
                               <td className="p-8 text-right font-mono text-cyan-400 text-lg">{(stats.costeDirectoTotalM2 * 1.02).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</td>
                               <td className="p-8 text-right font-mono text-2xl font-black text-cyan-300">{(stats.costeDirectoTotalM2 * 1.02 * medicionGlobal).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</td>
                               <td className="p-8 text-center">
                                  <button onClick={anadirAPresupuesto} className="text-xs bg-emerald-700 hover:bg-emerald-600 text-white px-5 py-3 rounded-xl font-black shadow-[0_0_15px_rgba(16,185,129,0.5)] transition-all w-full uppercase tracking-widest hover:scale-105 border border-emerald-500">Fijar al PBL</button>
                               </td>
                            </tr>
                         )}
                      </tbody>
                   </table>

                   {/* CUADRO RESUMEN GLOBAL (LA CASCADA LCSP) */}
                   <div className="bg-[#020617] p-12 border-t-4 border-slate-800 flex justify-between items-start">
                     
                     <div className="w-[500px] pr-10 border-r border-slate-800">
                        <h4 className="text-sm font-black uppercase text-slate-300 tracking-[0.2em] mb-5 flex items-center"><BookOpen size={20} className="mr-3 text-indigo-500"/> Marco Normativo Económico</h4>
                        <p className="text-sm text-slate-500 leading-loose text-justify mb-5 font-medium">La estructura del presente presupuesto se rige estrictamente por la <strong className="text-slate-300">Ley 9/2017 de Contratos del Sector Público de España (LCSP)</strong> aplicable a obra oficial universitaria.</p>
                        <p className="text-xs text-slate-500 leading-relaxed text-justify mb-6">El Coste Directo (CD) incorpora materiales y mano de obra básica. El Presupuesto de Ejecución Material (PEM) se formula añadiendo un 6% de Costes Indirectos (instalaciones de obra, control de calidad y seguridad y salud). Sobre el PEM resultante se calculan los Gastos Generales (13%) y el Beneficio Industrial (6%), configurando el Presupuesto de Ejecución por Contrata (PEC). Finalmente, el PEC conforma la base imponible sobre la cual se aplica el IVA del 21% para resultar en el Presupuesto Base de Licitación (PBL).</p>
                        <div className="flex gap-4 mt-8">
                           <span className="bg-slate-900 border border-slate-700 px-4 py-2 rounded-lg text-xs text-slate-300 font-mono font-bold shadow-inner flex items-center"><MapPin size={14} className="mr-2 text-rose-500"/> COM. VALENCIANA</span>
                           <span className="bg-slate-900 border border-slate-700 px-4 py-2 rounded-lg text-xs text-slate-300 font-mono font-bold shadow-inner flex items-center"><Factory size={14} className="mr-2 text-cyan-500"/> BASE IVE 2026</span>
                        </div>
                     </div>

                     <div className="flex-1 space-y-4 pl-10">
                         {/* CD */}
                         <div className="flex justify-between items-center text-base font-mono text-slate-400 font-medium">
                           <span>Total Coste Directo Partidas (Material + M.O.)</span>
                           <span>{totalCosteDirecto.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</span>
                         </div>
                         <div className="flex justify-between items-center text-sm font-mono text-slate-500 font-medium">
                           <span>Costes Directos Complementarios (2%)</span>
                           <span>{(totalCosteDirecto * 0.02).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</span>
                         </div>
                         <div className="flex justify-between items-center text-base font-mono text-slate-400 border-b-2 border-slate-800 pb-4 font-medium">
                           <span>Costes Indirectos (CI) - 6% s/ CD</span>
                           <span>{CostesIndirectos.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</span>
                         </div>
                         
                         {/* PEM */}
                         <div className="flex justify-between items-center text-2xl font-black font-mono text-slate-100 pt-3">
                           <span>PRESUPUESTO EJECUCIÓN MATERIAL (PEM)</span>
                           <span className="bg-slate-900 px-4 py-1 rounded-lg border border-slate-700">{PEM.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</span>
                         </div>
                         
                         {/* PEC */}
                         <div className="flex justify-between items-center text-base font-mono text-slate-400 pt-6 font-medium">
                           <span>Gastos Generales (GG) - 13% s/ PEM</span>
                           <span>{GastosGenerales.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</span>
                         </div>
                         <div className="flex justify-between items-center text-base font-mono text-slate-400 border-b-2 border-slate-800 pb-4 font-medium">
                           <span>Beneficio Industrial (BI) - 6% s/ PEM</span>
                           <span>{BeneficioIndustrial.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</span>
                         </div>
                         <div className="flex justify-between items-center text-2xl font-black font-mono text-emerald-400 pt-3 pb-3">
                           <span>PRESUPUESTO CONTRATA (PEC)</span>
                           <span>{PEC.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</span>
                         </div>
                         
                         {/* PBL */}
                         <div className="flex justify-between items-center text-base font-mono text-slate-400 border-b-2 border-slate-800 pb-4 font-medium">
                           <span>Impuesto sobre Valor Añadido (I.V.A.) - 21% s/ PEC</span>
                           <span>{IVA.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</span>
                         </div>
                         <div className="flex justify-between items-center text-5xl font-black font-mono text-white pt-4 drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                           <span>TOTAL P.B.L.</span>
                           <span>{PBL.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</span>
                         </div>
                     </div>
                   </div>
                </div>
              )}
           </div>
        </div>
      )}

      {/* ========================================================================================= */}
      {/* VISTA 3: MÓDULO DE IMPRESIÓN PROFESIONAL (PDF A4 OFICIAL) */}
      {/* Se activa únicamente al ejecutar window.print(), y desactiva el resto de la interfaz */}
      {/* ========================================================================================= */}
      <div className="hidden print:block w-full min-h-screen bg-white text-black p-10 font-sans m-0 relative">
          
          {/* CABECERA DOCUMENTO */}
          <div className="border-b-[6px] border-black pb-6 mb-10 flex justify-between items-start">
            <div className="flex-1">
              <h1 className="text-4xl font-black text-black uppercase tracking-tighter mb-2 leading-none">Documento Básico de Proyecto</h1>
              <h2 className="text-xl font-bold text-slate-800 tracking-wide uppercase">Memoria Constructiva, CTE y Presupuesto LCSP</h2>
              <div className="mt-4 flex gap-4 font-mono text-xs font-bold">
                 <span className="bg-slate-200 px-3 py-1 border border-black">MÁSTER U. ETSIE UPV</span>
                 <span className="bg-slate-200 px-3 py-1 border border-black">BASE PRECIOS: IVE 2026</span>
              </div>
            </div>
            <div className="text-right flex flex-col items-end">
              <div className="text-3xl font-black text-white bg-black px-5 py-2 mb-3 inline-block border-2 border-black">CONSTRUCTO<span className="font-light">PRO</span></div>
              <p className="text-sm font-bold text-slate-600 uppercase tracking-widest font-mono">Generado el: {new Date().toLocaleDateString('es-ES')}</p>
            </div>
          </div>
          
          {/* SECCIÓN I: PRESUPUESTO LCSP */}
          <h3 className="font-black text-2xl uppercase mb-6 bg-slate-200 p-3 border-l-8 border-black">I. Cuadro Resumen Presupuestario</h3>
          <table className="w-full text-sm border-collapse mb-8 border border-black">
            <thead>
              <tr className="bg-slate-800 text-white uppercase text-xs">
                <th className="p-3 text-left border border-black">Definición de Partida Estratigráfica</th>
                <th className="p-3 text-center border border-black">Ambiente</th>
                <th className="p-3 text-right border border-black">Superficie</th>
                <th className="p-3 text-right border border-black">Coste Dir. Unit.</th>
                <th className="p-3 text-right border border-black">Importe Directo</th>
              </tr>
            </thead>
            <tbody>
              {elementosProyecto.map(el => (
                <tr key={el.id} className="border-b border-slate-300">
                  <td className="p-3 border-x border-black font-bold text-base">{el.nombre}</td>
                  <td className="p-3 border-x border-black text-center text-[10px] uppercase font-bold text-slate-700">{el.ambiente}</td>
                  <td className="p-3 border-x border-black text-right font-mono">{el.medicion} m²</td>
                  <td className="p-3 border-x border-black text-right font-mono">{(el.precioUnitario * 1.02).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</td>
                  <td className="p-3 border-x border-black text-right font-bold font-mono">{(el.total * 1.02).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</td>
                </tr>
              ))}
              {capasCerramiento.length > 0 && (
                <tr className="border-b border-black bg-slate-100 italic">
                  <td className="p-3 border-x border-black font-bold text-slate-800 text-base">{nombreCerramiento} (Edición)</td>
                  <td className="p-3 border-x border-black text-center text-[10px] uppercase font-bold text-slate-700">{CONDICIONES_AMBIENTALES.find(a=>a.id===estadoProyecto.ambiente)?.nombre.split('(')[0] || estadoProyecto.ambiente}</td>
                  <td className="p-3 border-x border-black text-right font-mono">{medicionGlobal} m²</td>
                  <td className="p-3 border-x border-black text-right font-mono">{(stats.costeDirectoTotalM2 * 1.02).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</td>
                  <td className="p-3 border-x border-black text-right font-bold font-mono">{(costeDirectoActual * 1.02).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</td>
                </tr>
              )}
            </tbody>
          </table>

          {/* TABLA ECONÓMICA LCSP PDF */}
          <div className="flex justify-end w-full mb-12">
            <table className="w-[450px] text-sm border-collapse border-2 border-black">
               <tbody>
                  <tr><td className="p-2 border-b border-slate-300 font-bold pl-4">Total Costes Directos (+2% Medios Aux)</td><td className="p-2 border-b border-slate-300 text-right font-mono font-bold pr-4">{(totalCosteDirecto * 1.02).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</td></tr>
                  <tr><td className="p-2 border-b border-slate-300 pl-4">Costes Indirectos (6%)</td><td className="p-2 border-b border-slate-300 text-right font-mono pr-4">{CostesIndirectos.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</td></tr>
                  <tr className="bg-slate-200"><td className="p-3 border-b-2 border-black font-black uppercase pl-4">Presupuesto Ejecución Material</td><td className="p-3 border-b-2 border-black text-right font-black font-mono pr-4 text-lg">{PEM.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</td></tr>
                  <tr><td className="p-2 border-b border-slate-300 pl-4">Gastos Generales (13%)</td><td className="p-2 border-b border-slate-300 text-right font-mono pr-4">{GastosGenerales.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</td></tr>
                  <tr><td className="p-2 border-b border-slate-300 pl-4">Beneficio Industrial (6%)</td><td className="p-2 border-b border-slate-300 text-right font-mono pr-4">{BeneficioIndustrial.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</td></tr>
                  <tr className="bg-slate-200"><td className="p-3 border-b-2 border-black font-black uppercase pl-4">P. Ejecución por Contrata</td><td className="p-3 border-b-2 border-black text-right font-black font-mono pr-4 text-lg">{PEC.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</td></tr>
                  <tr><td className="p-2 border-b border-slate-300 pl-4">I.V.A. Normativo (21%)</td><td className="p-2 border-b border-slate-300 text-right font-mono pr-4">{IVA.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</td></tr>
                  <tr className="bg-black text-white"><td className="p-4 font-black uppercase text-xl pl-4 tracking-widest">Total P.B.L.</td><td className="p-4 text-right font-black font-mono text-2xl pr-4">{PBL.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</td></tr>
               </tbody>
            </table>
          </div>

          <div className="break-before-page"></div>

          {/* SECCIÓN II: DETALLE TÉCNICO Y PLANOS */}
          <h3 className="font-black text-2xl uppercase mb-6 bg-slate-200 p-3 border-l-8 border-black mt-4">II. Certificación de Cerramiento Analizado</h3>
          
          {capasCerramiento.length > 0 ? (
            <div className="border-4 border-slate-800 p-8 rounded-2xl bg-white shadow-none">
              <h4 className="font-black text-3xl mb-4 text-black uppercase">{nombreCerramiento}</h4>
              
              <div className="grid grid-cols-4 gap-4 mb-8 bg-slate-100 p-5 border-2 border-slate-400 rounded-xl text-center">
                <div className="border-r-2 border-slate-300 last:border-0"><span className="block text-xs uppercase font-bold text-slate-500 mb-1">Zona Climática</span><span className="text-lg font-black">{ZONAS_CTE[estadoProyecto.zona].nombre.split(' ')[1]}</span></div>
                <div className="border-r-2 border-slate-300 last:border-0"><span className="block text-xs uppercase font-bold text-slate-500 mb-1">Espesor Geométrico</span><span className="text-lg font-black font-mono">{stats.espesorTotal} mm</span></div>
                <div className="border-r-2 border-slate-300 last:border-0"><span className="block text-xs uppercase font-bold text-slate-500 mb-1">Transmitancia U</span><span className="text-lg font-black font-mono">{stats.valorU.toFixed(2)} W/m²K</span></div>
                <div className="border-r-2 border-slate-300 last:border-0"><span className="block text-xs uppercase font-bold text-slate-500 mb-1">Acústica Global Rw</span><span className="text-lg font-black font-mono">~{stats.RwEstimado.toFixed(0)} dB</span></div>
              </div>
              
              <h5 className="font-bold text-sm uppercase border-b-2 border-black mb-3 pb-1">Cuadro de Estratigrafía Topológica</h5>
              <table className="w-full text-sm border-collapse mb-10 border-2 border-black">
                <thead>
                  <tr className="bg-slate-800 text-white uppercase text-[10px]">
                    <th className="p-3 border border-black">Orden</th>
                    <th className="p-3 border border-black text-left">Especificación Técnica Material</th>
                    <th className="p-3 border border-black text-center">e (mm)</th>
                    <th className="p-3 border border-black text-left">Proveedor Homologado (ETSIE)</th>
                  </tr>
                </thead>
                <tbody>
                  {capasCerramiento.map((capa, i) => {
                    const mat = BASE_DATOS_MATERIALES[capa.idMaterial];
                    return (
                    <tr key={capa.id}>
                      <td className="p-3 border border-slate-400 text-center font-black text-slate-800 text-base">{i+1}</td>
                      <td className="p-3 border border-slate-400 font-bold">{mat.producto} <span className="text-xs text-slate-600 font-normal block mt-1">Matriz: {mat.nombre} | λ: {mat.k} | μ: {mat.mu} | Fuego: {mat.fuego}</span></td>
                      <td className="p-3 border border-slate-400 text-center font-mono font-black text-lg">{capa.espesor}</td>
                      <td className="p-3 border border-slate-400 font-bold text-xs uppercase">{mat.marca}</td>
                    </tr>
                  )})}
                </tbody>
              </table>
              
              <h5 className="font-bold text-sm uppercase border-b-2 border-black mb-6 pb-1">Plano de Sección 2D Acotada</h5>
              <div className="h-[500px] border-2 border-slate-400 rounded-xl flex items-center justify-center relative bg-slate-50 overflow-hidden">
                 <Vista2DCAD capas={capasCerramiento} espesorTotal={stats.espesorTotal} ambiente={estadoProyecto.ambiente} />
              </div>

              <div className="mt-10 text-xs text-justify text-slate-700 p-6 bg-slate-100 border border-slate-400 rounded-xl font-medium leading-relaxed">
                <strong className="text-black uppercase">Visado Colegial / Anexo Normativo:</strong> El presente documento técnico certifica que la solución constructiva descrita en la sección superior ha sido modelada, calculada y validada paramétricamente de acuerdo a las exigencias básicas del Código Técnico de la Edificación de España. Se asegura la ausencia de condensaciones intersticiales (Método de Glaser), el cumplimiento del límite de demanda energética en la zona climática {estadoProyecto.zona} (DB-HE), la estanqueidad al agua y protección frente a la humedad (DB-HS), y se estima la atenuación acústica a ruido aéreo (DB-HR). El presupuesto es estimativo y se formula según la Ley de Contratos del Sector Público a través de bases del Instituto Valenciano de la Edificación.
              </div>
            </div>
          ) : (
             <p className="text-xl italic text-slate-400 font-bold">Lienzo estructural vacío.</p>
          )}
      </div>

    </div>
  );
}

const rootElement = document.getElementById('root');
const root = ReactDOM.createRoot(rootElement);
root.render(React.createElement(App));