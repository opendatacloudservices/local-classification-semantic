import {Client} from 'pg';
import {Taxonomy, TaxonomyGroup} from '../types';
import {analyse} from './fingerprint';
import {writeFileSync} from 'fs';
import {levenshtein} from './levenshtein';

export const getTaxonomies = (client: Client): Promise<Taxonomy[]> => {
  return client
    .query(
      `SELECT
        *, (
          SELECT 
            COUNT(*)
          FROM
            "_TaxonomiesToImports"
          WHERE
            id = taxonomies_id
          GROUP BY
            taxonomies_id
        ) AS count
      FROM
        "Taxonomies"
      WHERE
        value IS NOT NULL`
    )
    .then(result => result.rows);
};

export const transformTaxonomies = (
  taxonomies: Taxonomy[]
): TaxonomyGroup[] => {
  const taxonomyGroups: TaxonomyGroup[] = [];

  // remove all taxonomies without value
  taxonomies = taxonomies.filter(t =>
    t.value && t.value.length > 0 ? true : false
  );

  // only keep digit values between 1800 and current year, as they are potentially year tags
  taxonomies = taxonomies.filter(t =>
    isNaN(parseInt(t.value)) ||
    (parseInt(t.value) >= 1800 && parseInt(t.value) <= new Date().getFullYear())
      ? true
      : false
  );

  // create group and filter out duplicates in the process
  const taxonomyMap: string[] = [];
  taxonomies.forEach(t => {
    const existIdx = taxonomyMap.indexOf(t.value);
    if (existIdx > -1) {
      taxonomyGroups[existIdx].children.push(t);
      if (
        t.type &&
        t.type.length > 0 &&
        !taxonomyGroups[existIdx].types.includes(t.type)
      ) {
        taxonomyGroups[existIdx].types.push(t.type);
      }
    } else {
      const types: string[] = [];
      if (t.type && t.type.length > 0) {
        types.push(t.type);
      }
      taxonomyMap.push(t.value);
      taxonomyGroups.push({
        label: t.value,
        types,
        children: [t],
      });
    }
  });

  return taxonomyGroups;
};

/*
 * TODO:
 * - after all mergings, add minor tag to taxonomies with only N elements (probably 5)
 * - sample on 1800-2020, otherwise also remove
 * - min lenght 3?
 */

export const processFingerprint = (
  taxonomyGroups: TaxonomyGroup[]
): TaxonomyGroup[] => {
  const analysis = analyse(
    taxonomyGroups.map(t => t.label),
    'normal',
    {
      lang: 'german',
      stemming: true,
    }
  );

  const newGroups: TaxonomyGroup[] = [];

  Object.keys(analysis).forEach(key => {
    // filter out numeric fingerprints (except 1800 - current year)
    if (
      isNaN(parseInt(key)) ||
      (parseInt(key) >= 1800 && parseInt(key) <= new Date().getFullYear())
    ) {
      const newGroup = taxonomyGroups[analysis[key][0].id];
      analysis[key].forEach((item, i) => {
        if (i > 0) {
          newGroup.children = [
            ...newGroup.children,
            ...taxonomyGroups[item.id].children,
          ];
          taxonomyGroups[item.id].types.forEach(t => {
            if (!newGroup.types.includes(t)) {
              newGroup.types.push(t);
            }
          });
        }
      });
      newGroups.push(newGroup);
    }
  });

  return newGroups;
};

export const processLevenshtein = (
  taxonomyGroups: TaxonomyGroup[]
): TaxonomyGroup[] => {
  levenshtein(taxonomyGroups);
  return taxonomyGroups;
};
