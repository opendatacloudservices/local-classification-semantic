/**
 * Fingerprint Module.
 * The concept for fingerprinting is taken from Open refine
 * https://github.com/OpenRefine/OpenRefine/wiki/Clustering-In-Depth
 */

// import * as meta from 'metaphone';
import * as cologne from 'cologne-phonetic';
import * as snowball from 'node-snowball';
import {ngramClusters, clusterResult, clusterResultEl} from '../types';

const punct = /[~`!@#$%^&*(){}[\];:"'<,.>?/\\|_+=-]/g;
const printable = /[^A-Za-z0-9\s]+/g;
const whitespace = /\s/g;

// Transform string into key.
export const key = (
  str: string,
  type: 'normal' | 'phonetic' = 'normal',
  params: {
    lang: 'german' | 'english';
    stemming: boolean;
  } = {
    lang: 'german',
    stemming: false,
  }
): string => {
  if (str === null || !str) {
    throw new Error('key function requires a string to work');
  } else {
    str = str.trim();
    if (type === 'normal') {
      str = str.toLowerCase();
    }
    str = str.replace(punct, '');
    if (type === 'normal') {
      str = asciify(str);
    }
    str = str.replace(printable, '');
    const frags = str.split(whitespace);
    const tree: string[] = [];
    frags.forEach(f => {
      if (tree.indexOf(f) === -1) {
        tree.push(f);
      }
    });

    if ('stemming' in params && params.stemming) {
      tree.forEach((t, ti) => {
        tree[ti] = snowball.stemword(t, params.lang);
      });
    }

    if (type === 'phonetic') {
      tree.forEach((t, ti) => {
        if ('lang' in params && params.lang === 'german') {
          tree[ti] = cologne.colognePhonetic(t);
        } else {
          // tree[ti] = meta.metaphone(t);
        }
      });
    }

    tree.sort();
    return tree.join('');
  }
};

// Asciify characters (for special lang chars).
export const asciify = (str: string): string => {
  const chars = str.split('');
  chars.forEach((char, ci) => {
    chars[ci] = translate(char);
  });
  return chars.join('');
};

/*
 * Translate the given unicode char in the closest ASCII representation
 * NOTE: this function deals only with latin-1 supplement and latin-1 extended code charts
 */
const translate = (char: string): string => {
  const translations: {0: string[]; 1: string}[] = [
    [
      [
        'À',
        'Á',
        'Â',
        'Ã',
        'Ä',
        'Å',
        'à',
        'á',
        'â',
        'ã',
        'ä',
        'å',
        'Ā',
        'ā',
        'Ă',
        'ă',
        'Ą',
      ],
      'a',
    ],
    [['Ç', 'ç', 'Ć', 'ć', 'Ĉ', 'ĉ', 'Ċ', 'ċ', 'Č', 'č'], 'c'],
    [['Ð', 'ð', 'Ď', 'ď', 'Đ', 'đ'], 'd'],
    [
      [
        'È',
        'É',
        'Ê',
        'Ë',
        'è',
        'é',
        'ê',
        'ë',
        'Ē',
        'ē',
        'Ĕ',
        'ĕ',
        'Ė',
        'ė',
        'Ę',
        'ę',
        'Ě',
      ],
      'e',
    ],
    [['Ĝ', 'ĝ', 'Ğ', 'ğ', 'Ġ', 'ġ', 'Ģ', 'ģ'], 'g'],
    [['Ĥ', 'ĥ', 'Ħ', 'ħ'], 'h'],
    [
      [
        'Ì',
        'Í',
        'Î',
        'Ï',
        'ì',
        'í',
        'î',
        'ï',
        'Ĩ',
        'ĩ',
        'Ī',
        'ī',
        'Ĭ',
        'ĭ',
        'Į',
        'į',
      ],
      'i',
    ],
    [['Ĵ', 'ĵ'], 'j'],
    [['Ķ', 'ķ', 'ĸ'], 'k'],
    [['Ĺ', 'ĺ', 'Ļ', 'ļ', 'Ľ', 'ľ', 'Ŀ', 'ŀ', 'Ł', 'ł'], 'l'],
    [['Ñ', 'ñ', 'Ń', 'ń', 'Ņ', 'ņ', 'Ň', 'ň', 'ŉ', 'Ŋ', 'ŋ'], 'n'],
    [
      [
        'Ò',
        'Ó',
        'Ô',
        'Õ',
        'Ö',
        'Ø',
        'ò',
        'ó',
        'ô',
        'õ',
        'ö',
        'ø',
        'Ō',
        'ō',
        'Ŏ',
        'ŏ',
        'Ő',
      ],
      'o',
    ],
    [['Ŕ', 'ŕ', 'Ŗ', 'ŗ', 'Ř', 'ř'], 'r'],
    [['Ś', 'ś', 'Ŝ', 'ŝ', 'Ş', 'ş', 'Š', 'š', 'ſ', 'ß'], 's'],
    [['Ţ', 'ţ', 'Ť', 'ť', 'Ŧ', 'ŧ'], 't'],
    [
      [
        'Ù',
        'Ú',
        'Û',
        'Ü',
        'ù',
        'ú',
        'û',
        'ü',
        'Ũ',
        'ũ',
        'Ū',
        'ū',
        'Ŭ',
        'ŭ',
        'Ů',
        'ů',
        'Ű',
        'ű',
      ],
      'u',
    ],
    [['Ŵ', 'ŵ'], 'w'],
    [['Ý', 'ý', 'ÿ', 'Ŷ', 'ŷ', 'Ÿ'], 'y'],
    [['Ź', 'ź', 'Ż', 'ż', 'Ž', 'ž'], 'z'],
  ];

  let tChar = null;

  translations.forEach(t => {
    if (t[0].indexOf(char) > -1) {
      tChar = t[1];
    }
  });

  return !tChar ? char : tChar;
};

// Analyse an array of previously keyed strings.
export const analyse = (
  data: string[],
  type: 'normal' | 'phonetic' = 'normal',
  params: {
    lang: 'german' | 'english';
    stemming: boolean;
  } = {
    lang: 'german',
    stemming: false,
  }
): ngramClusters => {
  const map: ngramClusters = {};
  data.forEach((d, di) => {
    const keyed = key(d, type, params);
    if (!(keyed in map)) {
      map[keyed] = [];
    }
    map[keyed].push({
      id: di,
      label: d,
    });
  });
  return map;
};
