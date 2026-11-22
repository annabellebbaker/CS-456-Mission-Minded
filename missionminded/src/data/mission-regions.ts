/**
 * States and countries that mission names start with, plus their flag codes.
 * Shared by the Missionary tab's flag header and the boundary map lookup.
 */
export const stateFlagCodes: Record<string, string> = {
  alabama: 'al', alaska: 'ak', arizona: 'az', arkansas: 'ar', california: 'ca',
  colorado: 'co', connecticut: 'ct', delaware: 'de', florida: 'fl', georgia: 'ga',
  hawaii: 'hi', idaho: 'id', illinois: 'il', indiana: 'in', iowa: 'ia', kansas: 'ks',
  kentucky: 'ky', louisiana: 'la', maine: 'me', maryland: 'md', massachusetts: 'ma',
  michigan: 'mi', minnesota: 'mn', mississippi: 'ms', missouri: 'mo', montana: 'mt',
  nebraska: 'ne', nevada: 'nv', 'new hampshire': 'nh', 'new jersey': 'nj',
  'new mexico': 'nm', 'new york': 'ny', 'north carolina': 'nc', 'north dakota': 'nd',
  ohio: 'oh', oklahoma: 'ok', oregon: 'or', pennsylvania: 'pa', 'rhode island': 'ri',
  'south carolina': 'sc', 'south dakota': 'sd', tennessee: 'tn', texas: 'tx', utah: 'ut',
  vermont: 'vt', virginia: 'va', washington: 'wa', 'west virginia': 'wv', wisconsin: 'wi',
  wyoming: 'wy',
};

export const countryFlagCodes: Record<string, string> = {
  adriatic: 'hr', albania: 'al', alpine: 'at', argentina: 'ar', armenia: 'am',
  australia: 'au', austria: 'at', baltic: 'ee', barbados: 'bb', belgium: 'be',
  'belgium netherlands': 'be', benin: 'bj', bolivia: 'bo', botswana: 'bw',
  brazil: 'br', bulgaria: 'bg', cambodia: 'kh', cameroon: 'cm', 'cape town': 'za',
  cape: 'za', chile: 'cl', china: 'cn', colombia: 'co', 'costa rica': 'cr',
  'cote d ivoire': 'ci', cuba: 'cu', 'czech slovak': 'cz', 'czech republic': 'cz',
  'democratic republic': 'cd', 'dominican republic': 'do', ecuador: 'ec',
  'el salvador': 'sv', england: 'gb-eng', ethiopia: 'et', europe: 'eu', fiji: 'fj',
  finland: 'fi', france: 'fr', germany: 'de', ghana: 'gh', greece: 'gr', guatemala: 'gt',
  guyana: 'gy', haiti: 'ht', honduras: 'hn', 'hong kong': 'hk', hungary: 'hu',
  india: 'in', indonesia: 'id', ireland: 'ie', israel: 'il', italy: 'it', jamaica: 'jm',
  japan: 'jp', kenya: 'ke', korea: 'kr', liberia: 'lr', madagascar: 'mg', malawi: 'mw',
  'marshall islands': 'mh', mexico: 'mx', micronesia: 'fm', mongolia: 'mn',
  mozambique: 'mz', nepal: 'np', netherlands: 'nl', 'new zealand': 'nz', nicaragua: 'ni',
  nigeria: 'ng', norway: 'no', pakistan: 'pk', panama: 'pa', 'papua new guinea': 'pg',
  paraguay: 'py', peru: 'pe', philippines: 'ph', poland: 'pl', portugal: 'pt',
  'puerto rico': 'pr', 'republic of congo': 'cg', romania: 'ro', russia: 'ru', rwanda: 'rw',
  samoa: 'ws', scotland: 'gb-sct', senegal: 'sn', 'sierra leone': 'sl', singapore: 'sg',
  'solomon islands': 'sb', 'south africa': 'za', 'south korea': 'kr', spain: 'es',
  sweden: 'se', switzerland: 'ch', tahiti: 'pf', taiwan: 'tw', tanzania: 'tz',
  thailand: 'th', togo: 'tg', tonga: 'to', turkey: 'tr', uganda: 'ug', ukraine: 'ua',
  'united kingdom': 'gb', uruguay: 'uy', vanuatu: 'vu', venezuela: 've', vietnam: 'vn',
  zambia: 'zm', zimbabwe: 'zw', canada: 'ca',
};

export function getMissionFlagUrl(missionName: string, missionId: string): string | undefined {
  const normalizedName = missionName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z ]/g, ' ').replace(/\s+/g, ' ').trim();
  if (missionId === 'alaska-anchorage' || normalizedName.startsWith('alaska ')) {
    return 'https://flagcdn.com/w640/us-ak.png';
  }
  const stateName = Object.keys(stateFlagCodes).sort((a, b) => b.length - a.length)
    .find((state) => normalizedName.startsWith(`${state} `));
  const countryName = Object.keys(countryFlagCodes).sort((a, b) => b.length - a.length)
    .find((country) => normalizedName.startsWith(`${country} `));
  const code = stateName ? `us-${stateFlagCodes[stateName]}` : countryName ? countryFlagCodes[countryName] : undefined;
  return code ? `https://flagcdn.com/w640/${code}.png` : undefined;
}

function normalize(text: string) {
  return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z ]/g, ' ').replace(/\s+/g, ' ').trim();
}

/** The state or country a mission name starts with, like "new mexico" for "New Mexico Albuquerque Mission". */
export function getMissionRegion(missionName: string): string | undefined {
  const name = normalize(missionName);
  const regions = [...Object.keys(stateFlagCodes), ...Object.keys(countryFlagCodes)].sort((a, b) => b.length - a.length);
  return regions.find((region) => name === region || name.startsWith(`${region} `));
}
