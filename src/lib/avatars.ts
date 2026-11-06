/*
 * Profile photos for demo mode, keyed by username. Put each file in public/demo/avatars/ and
 * add its path here, for example "sabir-shakir": "/demo/avatars/sabir-shakir.png". Use only
 * photos the person has supplied or agreed to; anyone not listed gets their initials.
 */
const PHOTOS: Record<string, string> = {
  "imran-riaz-khan": "/demo/avatars/imran-riaz-khan.png",
  "mirza-shehzad-akbar": "/demo/avatars/mirza-shehzad-akbar.png",
  "moeed-pirzada": "/demo/avatars/moeed-pirzada.png",
  "qasim-khan-soori": "/demo/avatars/qasim-khan-soori.png",
  "sabir-shakir": "/demo/avatars/sabir-shakir.png",
  "shehbaz-gill": "/demo/avatars/shehbaz-gill.png",
  "wajahat-saeed-khan": "/demo/avatars/wajahat-saeed-khan.png",
};

export function avatarPhotoFor(username: string): string | null {
  return PHOTOS[username] ?? null;
}
