/*
 * TODO: If more services require translations, the functionality of this file should be turned into a stand alone service
 */

import {readFileSync, existsSync, writeFileSync} from 'fs';
import {translate as googleTranslate} from './google';

export type languages = 'de' | 'en';

let dictionary: {
  de: {
    [key: string]: string;
  };
  en: {
    [key: string]: string;
  };
} = {de: {}, en: {}};

let dictionaryLoaded = false;

const dictionaryLocation = './assets/dictionary.json';

export const get = (
  str: string,
  sourceLang: languages,
  targetLang: languages
): Promise<string | null> => {
  const archiveVersion = getArchive(str, targetLang);
  if (archiveVersion) {
    return Promise.resolve(archiveVersion);
  } else {
    return googleTranslate(str, sourceLang, targetLang)
      .then(translation => {
        dictionary[targetLang][str] = translation
          ? translation.toLowerCase()
          : '';
        saveDictionary();
        return translation;
      })
      .catch(err => {
        throw err;
      });
  }
};

export const getArchive = (str: string, lang: languages): string | null => {
  if (!dictionaryLoaded) {
    loadDictionary();
  }
  if (str in dictionary[lang]) {
    return dictionary[lang][str].toLowerCase();
  }
  return null;
};

const loadDictionary = (): void => {
  if (!existsSync(dictionaryLocation)) {
    saveDictionary();
  }
  dictionary = JSON.parse(readFileSync(dictionaryLocation, 'utf8'));
  dictionaryLoaded = true;
};

const saveDictionary = (): void => {
  writeFileSync(dictionaryLocation, JSON.stringify(dictionary), 'utf8');
};
