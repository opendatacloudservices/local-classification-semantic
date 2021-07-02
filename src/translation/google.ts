import {v2} from '@google-cloud/translate';

let translationClient: v2.Translate;

export const translate = (
  text: string,
  sourceLang: string,
  targetLang: string
): Promise<string | null> => {
  if (!translationClient) {
    translationClient = new v2.Translate();
  }
  return translationClient
    .translate(text, {
      from: sourceLang,
      to: targetLang,
    })
    .then(response => {
      const translations = Array.isArray(response) ? response : [response];
      if (translations && translations[0]) {
        return translations[0];
      }
      return null;
    });
};
