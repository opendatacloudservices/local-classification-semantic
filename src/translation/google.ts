import {v2} from '@google-cloud/translate';

let translationClient: v2.Translate;

export const translate = (
  text: string,
  lang: string
): Promise<string | null> => {
  if (!translationClient) {
    translationClient = new v2.Translate();
  }

  return translationClient.translate(text, lang).then(response => {
    const translations = Array.isArray(response) ? response : [response];

    if (translations && translations[0]) {
      return response[0];
    }
    return null;
  });
};
