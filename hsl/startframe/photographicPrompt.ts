/** Graphics belong to the composition, never to the photographic source. Contextual in-scene text on screens and physical objects is allowed and encouraged for realism. */
export const PHOTOGRAPHIC_CONTRACT_VERSION = 'photographic-v2';
export const PHOTOGRAPHIC_CONSTRAINTS = 'Photorealistic cinematic 35mm documentary photography, physical materials and natural lighting, 16:9. Contextual and authentic in-scene text, numbers, and UI on device displays, screens, receipts, and physical interfaces must be sharp, legible, and realistic. NO FLOATING HUD, NO ISOLATED GRAPHIC TITLE CARDS, NO WATERMARKS. Global editorial overlays are added separately in the composition.';

function positiveClauses(prompt: string): string[] {
  const stripped = prompt
    .replace(/\b(?:without|with no|devoid of|free of|free from|excluding|sem|desprovido de|livre de)\s+[^,;.\n]+/gi, '')
    .replace(/\b(?:no|nenhum|nenhuma)\s+[^,;.\n]*(?:text|words|letters|typography|tipografia|hud|labels|logos)\b/gi, '');
  return stripped.split(/[,;\n]/).map(clause => clause.trim())
    .filter(clause => clause && !/^(?:no|without|with no|exclude|avoid|sem|não|nao)\b/i.test(clause));
}
const graphicDirective = /\b(?:(?:typograph\w*|tipograf\w*)\s*(?:title\s+cards?|cards?|overlays?|slides?|titles?|infographics?|:)|cart[ãa]o\s+(?:de\s+)?(?:t[íi]tulo|tipogr[áa]fico)|(?:floating\s+)?HUD|infographics?|infogr[áa]ficos?|(?:title|headline|caption)\s+(?:cards?|overlays?)|title\s+cards?|graphic\s+titles?)\b/i;

export function assertPhotographicPrompt(prompt: string): void {
  if (!prompt.trim() || positiveClauses(prompt).some(clause => graphicDirective.test(clause))) {
    throw new Error('PHOTOGRAPHIC_PROMPT_REQUIRED: describe the physical subject; text, HUD and typography belong to the composition');
  }
}

export function formatCinematic35mmPrompt(userPrompt: string): string {
  const brief = userPrompt.split(PHOTOGRAPHIC_CONSTRAINTS)[0]
    .replace(/^Cinematic 35mm photograph of\s+/i, '').replace(/[.\s]+$/, '');
  const subject = positiveClauses(brief)
    .filter(clause => !graphicDirective.test(clause) && !/Apple Keynote|Vox high-voltage|Overlays are added separately|Arri Alexa|\b8k\b|documentary aesthetic|^cinematic 35mm (?:pop-)?documentary shot$/i.test(clause))
    .join(', ').replace(/\s*--ar\s+16:9\b/g, '').trim();
  if (!subject) throw new Error('PHOTOGRAPHIC_SUBJECT_REQUIRED: replace the title card with a physical scene');
  return `Cinematic 35mm photograph of ${subject}. ${PHOTOGRAPHIC_CONSTRAINTS} --ar 16:9`;
}
