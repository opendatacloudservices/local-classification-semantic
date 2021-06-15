import {distance} from 'fastest-levenshtein';
import {prepare} from './ngrams';
import {TaxonomyGroup} from '../types';
import {writeFileSync} from 'fs';

export const levenshteinPercentage = (word1: string, word2: string): number => {
  let index = distance(word1, word2);
  index /= word1.length < word2.length ? word1.length : word2.length;
  return index;
};

export const levenshtein = (taxonomies: TaxonomyGroup[]): TaxonomyGroup[] => {
  // identify groups of words that share certain ngrams
  const groups = prepare(taxonomies.map(t => t.label));

  // create distance matrices for all words in each group
  Object.keys(groups).forEach(key => {
    if (groups[key].length > 1) {
      // do processing
    }
  });

  writeFileSync(
    './tmp/ngrams.json',
    JSON.stringify(Object.keys(groups).length, null, 4),
    'utf8'
  );

  return taxonomies;
};
