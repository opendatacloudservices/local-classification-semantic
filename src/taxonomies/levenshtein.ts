import {distance} from 'fastest-levenshtein';
import {prepare} from './ngrams';
import {TaxonomyGroup} from '../types';

export const levenshteinPercentage = (word1: string, word2: string): number => {
  let index = distance(word1, word2);
  index /= word1.length < word2.length ? word1.length : word2.length;
  return index;
};

export const levenshtein = (taxonomies: TaxonomyGroup[]): TaxonomyGroup[] => {
  // identify groups of words that share certain ngrams
  const groups = prepare(taxonomies.map(t => t.label));

  const deletion: number[] = [];

  // create distance matrices for all words in each group
  Object.keys(groups).forEach(key => {
    if (groups[key].length > 1) {
      const mapped: {
        [key: number]: number;
      } = {};

      groups[key].sort();

      groups[key].forEach(id1 => {
        mapped[id1] = id1;
      });

      groups[key].forEach(id1 => {
        groups[key].forEach(id2 => {
          if (
            mapped[id1] !== id2 &&
            id1 !== id2 &&
            mapped[id2] !== mapped[id1]
          ) {
            const dist = levenshteinPercentage(
              taxonomies[id1].label,
              taxonomies[id2].label
            );
            if (dist < 0.2) {
              if (mapped[id2] !== id2) {
                for (
                  let c = 0;
                  c < taxonomies[mapped[id2]].children.length;
                  c += 1
                ) {
                  if (!('oid' in taxonomies[mapped[id2]].children[c])) {
                    taxonomies[mapped[id2]].children[c].merge = 'levenshtein';
                    taxonomies[mapped[id2]].children[c].oid = mapped[id2];
                  }
                }
                taxonomies[mapped[id1]].children = taxonomies[
                  mapped[id1]
                ].children.concat(taxonomies[mapped[id2]].children);
                for (
                  let c = 0;
                  c < taxonomies[mapped[id1]].children.length;
                  c += 1
                ) {
                  if (
                    'oid' in taxonomies[mapped[id1]].children[c] &&
                    taxonomies[mapped[id1]].children[c].oid
                  ) {
                    const oid = taxonomies[mapped[id1]].children[c].oid;
                    if (oid) {
                      mapped[oid] = mapped[id1];
                    }
                  }
                }
                deletion.push(mapped[id2]);
              } else {
                for (let c = 0; c < taxonomies[id2].children.length; c += 1) {
                  taxonomies[id2].children[c].merge = 'levenshtein';
                  taxonomies[id2].children[c].oid = id2;
                }
                taxonomies[mapped[id1]].children = taxonomies[
                  mapped[id1]
                ].children.concat(taxonomies[id2].children);
                deletion.push(id2);
              }
              mapped[id2] = mapped[id1];
            }
          }
        });
      });
    }
  });

  deletion.sort();
  for (let d = deletion.length - 1; d >= 0; d -= 1) {
    delete taxonomies[deletion[d]];
  }

  const filteredTaxonomies: TaxonomyGroup[] = taxonomies.filter(t =>
    t ? true : false
  );

  return filteredTaxonomies;
};
