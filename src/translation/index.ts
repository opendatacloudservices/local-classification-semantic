/*
 * TODO: If more services require translations, the functionality of this file should be turned into a stand alone service
 */

import {readFileSync, existsSync, writeFileSync} from 'fs';
import {translate as googleTranslate} from './google';

export type languages = 'de' | 'en';

let dictionary: {
  de: {
    [key: string]: string | null;
  };
  en: {
    [key: string]: string | null;
  };
} = {de: {}, en: {}};

let dictionaryLoaded = false;

const dictionaryLocation = './assets/dictionary.json';

export const get = (str: string, lang: languages): Promise<string | null> => {
  const archiveVersion = getArchive(str, lang);
  if (archiveVersion) {
    return Promise.resolve(archiveVersion);
  } else {
    return googleTranslate(str, lang).then(translation => {
      dictionary[lang][str] = translation;
      saveDictionary();
      return translation;
    });
  }
};

export const getArchive = (str: string, lang: languages): string | null => {
  if (!dictionaryLoaded) {
    loadDictionary();
  }
  if (str in dictionary[lang]) {
    return dictionary[lang][str];
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
