import {GeoName, Taxonomy} from '../types';
import {readFile, writeFileSync} from 'fs';

// min length of a location name
const minLength = 4;

// some geonames are very common in the german language
const exclude = [
  'wetter',
  'paar',
  'kraft',
  'bescheid',
  'landgericht',
  'brand',
  'blei',
  'honig',
  'mark',
  'kirche',
  'männl',
  'hafen',
  'freiheit',
  'wasch',
  'gericht',
  'spielplatz',
  'leer',
  'mangel',
  'essen',
  'hohe',
  'schwarze',
  'vers',
  'wehr',
  'grüne',
  'berg',
  'rote',
  'halle',
  'mitte',
  'betten',
  'forst',
  'höhe',
  'schraube',
  'eine',
  'grün',
  'gleichen',
  'weil',
  'platten',
  'ben de',
  'kupfer',
  'sand',
  'fisch',
  'grund',
  'wässerung',
  'masch',
  'erden',
  'bauland',
  'strom',
  'kanal',
  'klein',
  'wald',
  'schutz',
  'speicher',
  'steinen',
  'boden',
  'plan',
  'waren',
  'kreis',
  'oder',
  'ohne',
];

export const loadGeonames = (): Promise<GeoName[]> => {
  return new Promise((resolve, reject) => {
    readFile('./assets/geonames_DE.txt', 'utf8', (err, data: string) => {
      if (err) {
        reject(err);
      }
      const geoNames: GeoName[] = [];
      data.split('\n').forEach(line => {
        const columns = line.split('\t');
        if (['A', 'H', 'L', 'T', 'V'].includes(columns[6])) {
          const values: string[] = [];
          if (
            columns[1] &&
            columns[1].length >= minLength &&
            !exclude.includes(columns[1])
          ) {
            values.push(columns[1].toLowerCase().trim());
          }
          if (
            columns[2] &&
            columns[2].length >= minLength &&
            values.indexOf(columns[2]) === -1 &&
            !exclude.includes(columns[2])
          ) {
            values.push(columns[2].toLowerCase().trim());
          }
          // Alternate writings contain a lot of weird stuff
          if (columns[3]) {
            columns[3].split(',').forEach(v => {
              if (
                v &&
                v.length >= minLength &&
                values.indexOf(v) === -1 &&
                !exclude.includes(v)
              ) {
                values.push(v.toLowerCase().trim());
              }
            });
          }
          geoNames.push({
            lat: parseFloat(columns[4]),
            lon: parseFloat(columns[5]),
            values,
          });
        }
      });
      resolve(geoNames);
    });
  });
};

export const extractGeonames = (
  taxonomies: Taxonomy[],
  geoNames: GeoName[],
  deleteLocations = true
): {
  taxonomies: Taxonomy[];
  locations: {
    [key: number]: {
      lat: number;
      lon: number;
      value: string;
    };
  };
} => {
  const r: {
    taxonomies: Taxonomy[];
    locations: {
      [key: number]: {
        lat: number;
        lon: number;
        value: string;
      };
    };
  } = {
    taxonomies: [],
    locations: {},
  };

  const deletion: number[] = [];

  const matches: {
    [key: string]: number;
  } = {};

  taxonomies.forEach((t, ti) => {
    let matchSize = 0;
    let match = '';
    for (let gi = 0; gi < geoNames.length; gi += 1) {
      const geo = geoNames[gi];
      for (let vi = 0; vi < geo.values.length; vi += 1) {
        const v = geo.values[vi];
        let isMatch = false;
        let isOver = false;
        if (v.length < 8 && !v.match(/[,.-\s]/g)) {
          const els = t.value.split(/[.-\s,]/g);
          els.forEach(el => {
            if (el === v) {
              isMatch = true;
              isOver = true;
            }
          });
        } else {
          if (t.value.indexOf(v) > -1 && v.length > matchSize) {
            isMatch = true;
            if (v.length === t.value.length) {
              isOver = true;
            }
          }
        }
        if (isMatch) {
          matchSize = v.length;
          match = v;
          r.locations[t.id] = {
            value: v,
            lat: geo.lat,
            lon: geo.lon,
          };
          if (isOver) {
            vi = geo.values.length;
            gi = geoNames.length;
          }
        }
      }
    }
    if (matchSize > 0) {
      if (!(match in matches)) {
        matches[match] = 0;
      }
      matches[match]++;
      if (
        t.value.trim() === match ||
        Math.abs(match.length - t.value.trim().length) < 4
      ) {
        deletion.push(ti);
      }
      if (deleteLocations) {
        taxonomies[ti].value = taxonomies[ti].value.replace(match, '').trim();
      }
    }
  });

  deletion.sort();
  for (let d = deletion.length - 1; d >= 0; d -= 1) {
    delete taxonomies[deletion[d]];
  }

  r.taxonomies = taxonomies.filter(t => (t ? true : false));

  const sortableMatches: [string, number][] = [];
  Object.keys(matches).forEach(match => {
    sortableMatches.push([match, matches[match]]);
  });

  sortableMatches.sort((a, b) => {
    return a[1] - b[1];
  });

  writeFileSync(
    './tmp/geonames',
    JSON.stringify(sortableMatches, null, 4),
    'utf8'
  );

  return r;
};
