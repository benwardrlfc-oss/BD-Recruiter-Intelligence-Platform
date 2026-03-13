// eslint-disable-next-line @typescript-eslint/no-unused-vars -- taxonomy available for future use

export interface ParsedMarketProfile {
  industry: string
  subsector: string
  niche: string
  functions: string[]
  seniority: string[]
  regions: string[]
  subGeos: string[]
  companyTypes: string[]
  stages: string[]
  signalPreferences: string[]
  keywords: string[]
  confidence: Record<string, number>
  rawInput: string
}

// ── Keyword maps ────────────────────────────────────────────────────────────

const INDUSTRY_KEYWORDS: Record<string, string[]> = {
  'Life Sciences': [
    'biotech', 'biotechnology', 'pharma', 'pharmaceutical', 'medtech', 'medical device',
    'diagnostics', 'cro', 'cdmo', 'gene therapy', 'cell therapy', 'biopharma',
    'life sciences', 'life science', 'drug discovery', 'clinical', 'oncology',
    'radiopharma', 'liquid biopsy', 'mab', 'biologics', 'specialty pharma',
    'digital health', 'health tech', 'synthetic biology',
  ],
  Technology: [
    'saas', 'software', 'tech', 'technology', 'ai', 'machine learning', 'ml',
    'cybersecurity', 'cyber', 'fintech', 'cloud', 'semiconductor', 'chip',
    'robotics', 'devtools', 'data infrastructure', 'consumer tech', 'startup',
    'scaleup', 'b2b', 'infrastructure', 'platform', 'developer tools', 'llm',
    'foundation model', 'computer vision', 'nlp',
  ],
  'Financial Services': [
    'private equity', 'pe ', 'pe-backed', 'venture capital', 'vc ', 'vc-backed',
    'investment banking', 'asset management', 'hedge fund', 'insurance',
    'wealth management', 'financial services', 'finance sector', 'banking',
    'fund', 'portfolio', 'buyout', 'growth equity',
  ],
  Healthcare: [
    'hospital', 'health system', 'payer', 'insurer', 'primary care', 'specialty care',
    'mental health', 'home health', 'healthcare it', 'value-based care', 'provider',
    'nhs', 'health plan', 'population health',
  ],
  'Manufacturing & Engineering': [
    'aerospace', 'defense', 'defence', 'automotive', 'industrial', 'manufacturing',
    'electronics', 'chemicals', 'food & beverage', 'consumer goods',
    'advanced materials', 'engineering', 'factory', 'production',
  ],
  'Energy & Infrastructure': [
    'oil & gas', 'energy', 'renewable', 'solar', 'wind', 'utilities', 'nuclear',
    'grid', 'clean tech', 'cleantech', 'water', 'infrastructure', 'power',
    'energy storage', 'battery',
  ],
  Legal: ['law firm', 'in-house legal', 'legal tech', 'compliance', 'ip', 'patent', 'litigation'],
  'Consulting & Professional Services': [
    'consulting', 'consultancy', 'advisory', 'big 4', 'mckinsey', 'bain', 'bcg', 'deloitte',
    'professional services', 'management consulting', 'strategy consulting',
  ],
  'Retail & Consumer': [
    'retail', 'e-commerce', 'ecommerce', 'luxury', 'fmcg', 'fashion', 'apparel',
    'consumer', 'dtc', 'grocery', 'brand',
  ],
  'Logistics & Supply Chain': [
    'logistics', 'supply chain', '3pl', 'freight', 'last-mile', 'delivery',
    'cold chain', 'maritime', 'aviation', 'rail',
  ],
  'Real Estate & Construction': [
    'real estate', 'property', 'proptech', 'construction', 'reit', 'commercial property',
  ],
  Education: ['edtech', 'education', 'university', 'k-12', 'corporate learning', 'training'],
  'Government & Public Sector': [
    'government', 'federal', 'public sector', 'defence', 'defense', 'non-profit', 'nonprofit',
  ],
  'Media & Creative': [
    'media', 'advertising', 'pr', 'entertainment', 'gaming', 'publishing', 'sports',
    'digital media', 'content',
  ],
}

const SUBSECTOR_KEYWORDS: Record<string, string[]> = {
  Biotech: ['biotech', 'biotechnology', 'biopharma', 'biologics', 'oncology biotech'],
  Pharma: ['pharma', 'pharmaceutical', 'specialty pharma', 'generics'],
  MedTech: ['medtech', 'medical device', 'surgical', 'cardiovascular device', 'ortho'],
  Diagnostics: ['diagnostics', 'diagnostics', 'liquid biopsy', 'molecular diagnostics', 'ngs', 'genomics'],
  CRO: ['cro', 'contract research', 'preclinical cro'],
  CDMO: ['cdmo', 'contract manufacturing', 'biologics cdmo', 'biomanufacturing'],
  'Cell & Gene Therapy': ['gene therapy', 'cell therapy', 'car-t', 'aav', 'mrna', 'crispr', 'lentiviral', 'allogeneic'],
  'Digital Health': ['digital health', 'digital therapeutics', 'health tech', 'healthtech', 'digital therapeutics'],
  'AI / Machine Learning': ['ai ', 'artificial intelligence', 'machine learning', ' ml ', 'llm', 'foundation model', 'ai infrastructure', 'computer vision'],
  SaaS: ['saas', 'software as a service', 'b2b saas', 'vertical saas', 'plg'],
  Cybersecurity: ['cybersecurity', 'cyber security', 'endpoint', 'cloud security', 'identity'],
  'Private Equity': ['private equity', 'pe-backed', 'pe backed', 'buyout', 'growth equity'],
  'Venture Capital': ['venture capital', 'vc-backed', 'vc backed', 'venture'],
  Semiconductors: ['semiconductor', 'chip design', 'silicon', 'rf & wireless'],
}

const FUNCTION_KEYWORDS: Record<string, string[]> = {
  'Executive Leadership': ['ceo', 'coo', 'cso', 'president', 'executive', 'c-suite', 'chief ', 'managing director', 'general manager', 'head of', 'exec'],
  'R&D': ['r&d', 'research', 'discovery', 'drug discovery', 'research and development'],
  Clinical: ['clinical', 'clinical development', 'clinical operations', 'medical director'],
  Commercial: ['commercial', 'gtm', 'go-to-market', 'revenue', 'growth'],
  Sales: ['sales', 'account executive', 'business development', 'bd', 'vp sales', 'cro '],
  Marketing: ['marketing', 'cmo', 'demand gen', 'brand', 'content marketing'],
  Product: ['product', 'product management', 'cpo', 'product manager', 'pm'],
  Engineering: ['engineering', 'cto', 'software engineer', 'vp engineering', 'tech lead', 'architect'],
  Finance: ['finance', 'cfo', 'financial', 'treasury', 'fp&a', 'controller', 'accounting'],
  Operations: ['operations', 'coo', 'ops', 'operational'],
  Legal: ['legal', 'counsel', 'general counsel', 'clro', 'compliance'],
  HR: ['hr', 'human resources', 'talent', 'chro', 'people', 'hrbp', 'talent acquisition'],
  Manufacturing: ['manufacturing', 'cmc', 'production', 'plant manager', 'factory'],
  Regulatory: ['regulatory', 'ra ', 'regulatory affairs', 'regulatory strategy'],
  Quality: ['quality', 'qa', 'quality assurance', 'quality control', 'qc'],
  'Medical Affairs': ['medical affairs', 'medical science', 'msl', 'medical director'],
  'Supply Chain': ['supply chain', 'procurement', 'logistics', 'sourcing'],
  Strategy: ['strategy', 'corporate development', 'corp dev'],
  'Data & Analytics': ['data', 'analytics', 'data science', 'bi ', 'business intelligence'],
}

const SENIORITY_KEYWORDS: Record<string, string[]> = {
  'Individual Contributor': ['individual contributor', 'ic', 'associate', 'analyst', 'specialist', 'contributor'],
  Manager: ['manager', 'team lead', 'lead '],
  Director: ['director', 'sr. director', 'senior director'],
  VP: ['vp ', 'vice president', 'svp', 'evp', 'senior vp'],
  'C-Suite': ['ceo', 'cto', 'coo', 'cfo', 'cmo', 'cso', 'cpo', 'chro', 'clo', 'c-suite', 'chief ', 'c suite'],
  Board: ['board', 'board member', 'non-executive', 'ned', 'chair'],
}

const COMPANY_TYPE_KEYWORDS: Record<string, string[]> = {
  'VC-backed': ['vc-backed', 'vc backed', 'venture-backed', 'venture backed', 'venture capital'],
  'PE-backed': ['pe-backed', 'pe backed', 'private equity', 'pe firm'],
  Startup: ['startup', 'start-up', 'early stage', 'early-stage', 'pre-seed', 'seed stage'],
  Scaleup: ['scaleup', 'scale-up', 'growth stage', 'scale up'],
  'Public company': ['public company', 'listed company', 'nasdaq', 'nyse', 'publicly traded', 'public'],
  'Private company': ['private company', 'privately held', 'privately owned'],
  'Non-profit': ['non-profit', 'nonprofit', 'not-for-profit'],
  Consultancy: ['consultancy', 'consulting firm', 'advisory firm'],
}

const STAGE_KEYWORDS: Record<string, string[]> = {
  'Pre-seed': ['pre-seed', 'pre seed', 'idea stage'],
  Seed: ['seed', 'seed stage', 'seed round'],
  'Series A': ['series a', 'series-a', 'series a round'],
  'Series B': ['series b', 'series-b', 'series b round'],
  Growth: ['growth', 'growth stage', 'series c', 'series d', 'series e'],
  'Late stage': ['late stage', 'late-stage', 'pre-ipo', 'pre ipo', 'mezzanine'],
  Enterprise: ['enterprise', 'large enterprise'],
  Public: ['public', 'ipo', 'listed', 'nasdaq', 'nyse', 'post-ipo'],
}

const GEO_KEYWORDS: Record<string, { region: string; subGeos: string[] }> = {
  usa: { region: 'USA', subGeos: [] },
  'united states': { region: 'USA', subGeos: [] },
  'us ': { region: 'USA', subGeos: [] },
  american: { region: 'USA', subGeos: [] },
  'north america': { region: 'USA', subGeos: [] },
  'san francisco': { region: 'USA', subGeos: ['California'] },
  'bay area': { region: 'USA', subGeos: ['California'] },
  california: { region: 'USA', subGeos: ['California'] },
  boston: { region: 'USA', subGeos: ['Massachusetts'] },
  cambridge: { region: 'USA', subGeos: ['Massachusetts'] },
  massachusetts: { region: 'USA', subGeos: ['Massachusetts'] },
  'new york': { region: 'USA', subGeos: ['New York'] },
  nyc: { region: 'USA', subGeos: ['New York'] },
  'research triangle': { region: 'USA', subGeos: ['North Carolina'] },
  texas: { region: 'USA', subGeos: ['Texas'] },
  chicago: { region: 'USA', subGeos: ['Illinois'] },
  seattle: { region: 'USA', subGeos: ['Washington'] },
  northeast: { region: 'USA', subGeos: ['Massachusetts', 'Connecticut', 'New York', 'New Jersey'] },
  europe: { region: 'Europe', subGeos: [] },
  eu: { region: 'Europe', subGeos: [] },
  european: { region: 'Europe', subGeos: [] },
  uk: { region: 'Europe', subGeos: ['UK'] },
  london: { region: 'Europe', subGeos: ['UK'] },
  germany: { region: 'Europe', subGeos: ['Germany'] },
  switzerland: { region: 'Europe', subGeos: ['Switzerland'] },
  france: { region: 'Europe', subGeos: ['France'] },
  netherlands: { region: 'Europe', subGeos: ['Netherlands'] },
  'apac': { region: 'APAC', subGeos: [] },
  asia: { region: 'APAC', subGeos: [] },
  'asia pacific': { region: 'APAC', subGeos: [] },
  japan: { region: 'APAC', subGeos: ['Japan'] },
  china: { region: 'APAC', subGeos: ['China'] },
  singapore: { region: 'APAC', subGeos: ['Singapore'] },
  australia: { region: 'APAC', subGeos: ['Australia'] },
  canada: { region: 'Canada', subGeos: [] },
  global: { region: 'USA', subGeos: [] },
}

function matchKeywords(text: string, keywords: string[]): boolean {
  return keywords.some((kw) => text.includes(kw.toLowerCase()))
}

function pickBestMatch<T extends string>(
  text: string,
  map: Record<T, string[]>
): { value: T | ''; confidence: number } {
  let best: T | '' = ''
  let bestScore = 0
  for (const [key, keywords] of Object.entries(map) as [T, string[]][]) {
    const score = keywords.filter((kw) => text.includes(kw.toLowerCase())).length
    if (score > bestScore) {
      bestScore = score
      best = key
    }
  }
  return { value: best, confidence: bestScore > 0 ? Math.min(0.95, 0.5 + bestScore * 0.15) : 0 }
}

function pickMultiMatch<T extends string>(
  text: string,
  map: Record<T, string[]>
): { values: T[]; confidence: number } {
  const found: T[] = []
  for (const [key, keywords] of Object.entries(map) as [T, string[]][]) {
    if (matchKeywords(text, keywords)) found.push(key)
  }
  return { values: found, confidence: found.length > 0 ? Math.min(0.9, 0.45 + found.length * 0.1) : 0 }
}

export function parseMarketInput(rawInput: string): ParsedMarketProfile {
  const text = rawInput.toLowerCase()

  // Industry
  const industry = pickBestMatch(text, INDUSTRY_KEYWORDS as Record<string, string[]>)

  // Subsector
  const subsector = pickBestMatch(text, SUBSECTOR_KEYWORDS as Record<string, string[]>)

  // Functions
  const functions = pickMultiMatch(text, FUNCTION_KEYWORDS as Record<string, string[]>)

  // Seniority
  const seniority = pickMultiMatch(text, SENIORITY_KEYWORDS as Record<string, string[]>)

  // Company types
  const companyTypes = pickMultiMatch(text, COMPANY_TYPE_KEYWORDS as Record<string, string[]>)

  // Stages
  const stages = pickMultiMatch(text, STAGE_KEYWORDS as Record<string, string[]>)

  // Geography
  const regions: string[] = []
  const subGeos: string[] = []
  let geoConfidence = 0
  for (const [kw, geo] of Object.entries(GEO_KEYWORDS)) {
    if (text.includes(kw)) {
      if (!regions.includes(geo.region)) regions.push(geo.region)
      for (const sg of geo.subGeos) {
        if (!subGeos.includes(sg)) subGeos.push(sg)
      }
      geoConfidence = 0.85
    }
  }

  // Niche — look for quoted text, specific technical terms not in taxonomy
  const nicheMatch = rawInput.match(/"([^"]+)"/) || rawInput.match(/'([^']+)'/)
  let niche = ''
  if (nicheMatch) {
    niche = nicheMatch[1]
  } else {
    // Try to detect specialties not covered by subsector (e.g. "oncology biotech", "radiopharma")
    const nicheHints = [
      'oncology', 'radiopharma', 'liquid biopsy', 'ai drug discovery', 'rare disease',
      'immunology', 'neuroscience', 'car-t', 'mrna', 'crispr', 'aav', 'gtm hires',
      'pe-backed industrial', 'semiconductor manufacturing',
    ]
    const found = nicheHints.filter((n) => text.includes(n))
    if (found.length > 0) niche = found[0]
  }

  // Signal preferences (inferred from context)
  const signalPreferences: string[] = []
  if (text.includes('funding') || text.includes('raised') || text.includes('round')) signalPreferences.push('Funding rounds')
  if (text.includes('leadership') || text.includes('hire') || text.includes('appointed')) signalPreferences.push('Leadership changes')
  if (text.includes('job') || text.includes('posting') || text.includes('opening')) signalPreferences.push('Job postings')
  if (text.includes('partnership') || text.includes('collaboration') || text.includes('deal')) signalPreferences.push('Partnerships')
  if (text.includes('pipeline') || text.includes('product') || text.includes('launch')) signalPreferences.push('Product / pipeline updates')
  if (text.includes('expansion') || text.includes('expand') || text.includes('new market')) signalPreferences.push('Geographic expansion')
  if (text.includes('merger') || text.includes('acquisition') || text.includes('m&a')) signalPreferences.push('M&A')
  // Default signals if none found
  if (signalPreferences.length === 0) signalPreferences.push('Funding rounds', 'Leadership changes')

  // Keywords extraction — pull capitalised/distinctive words
  const keywordCandidates = rawInput.match(/\b[A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)*/g) || []
  const stopWords = new Set(['I', 'The', 'We', 'My', 'For', 'In', 'On', 'At', 'And', 'Or', 'Of', 'To', 'A'])
  const keywords = [...new Set(keywordCandidates.filter((w) => !stopWords.has(w)))].slice(0, 5)

  const confidence: Record<string, number> = {
    industry: industry.confidence,
    subsector: subsector.confidence,
    niche: niche ? 0.7 : 0,
    functions: functions.confidence,
    seniority: seniority.confidence,
    geography: geoConfidence,
    companyTypes: companyTypes.confidence,
    stages: stages.confidence,
  }

  return {
    industry: industry.value,
    subsector: subsector.value,
    niche,
    functions: functions.values,
    seniority: seniority.values,
    regions,
    subGeos,
    companyTypes: companyTypes.values,
    stages: stages.values,
    signalPreferences,
    keywords,
    confidence,
    rawInput,
  }
}
