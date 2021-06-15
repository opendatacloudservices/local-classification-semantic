declare type langs =
  | 'arabic'
  | 'basque'
  | 'catalan'
  | 'danish'
  | 'dutch'
  | 'english'
  | 'finnish'
  | 'french'
  | 'german'
  | 'greek'
  | 'hindi'
  | 'hungarian'
  | 'indonesian'
  | 'irish'
  | 'italian'
  | 'lithuanian'
  | 'nepali'
  | 'norwegian'
  | 'portuguese'
  | 'spanish'
  | 'swedish'
  | 'romanian'
  | 'russian'
  | 'tamil'
  | 'turkish'
  | 'porter';

declare type isos = 'UTF-8' | 'ISO-8859-1' | 'ISO-8859-2';

declare module 'node-snowball' {
  function stemword(text: string, lang?: langs, iso?: isos): string;
  function stemword(text: string[], lang?: langs, iso?: isos): string[];
}
