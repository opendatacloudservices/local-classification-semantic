import {GeoName, Taxonomy} from '../types';
import {readFileSync, writeFileSync} from 'fs';

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
    const data = readFileSync('./assets/geonames_DE.txt', 'utf8');
    const officialData = readFileSync('./assets/locations-clean.tsv', 'utf8');
      
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
          bbox: null,
          values,
        });
      }
    });
    officialData.split('\n').forEach(line => {
      const columns = line.split('\t');
      geoNames.push({
        values: [columns[0].toLowerCase().trim()],
        bbox: columns.slice(1).map(c => parseFloat(c)),
        lat: null,
        lon: null,
      })
    });
    resolve(geoNames);
  });
};

export const extractGeonames = (
  taxonomies: Taxonomy[],
  geoNames: GeoName[],
  deleteLocations = true
): {
  taxonomies: Taxonomy[];
  locations: {
    [key: number]: GeoName;
  };
} => {
  const r: {
    taxonomies: Taxonomy[];
    locations: {
      [key: number]: GeoName;
    };
  } = {
    taxonomies: [],
    locations: {},
  };

  // remove all tags (completely) with an areal descriptors
  const taxonomyDeletion: number[] = [];
  for (let t = 0; t < taxonomies.length; t += 1) {
    let els = taxonomies[t].value.split(/[\s,-.–;]/g);
    const deletion: number[] = [];
    els.forEach((el, ei) => {
      el = el.replace(/[)[\]]/g, '');
      if (geoFilterWords.includes(el)) {
        taxonomyDeletion.push(t);
      }
    });
  }

  taxonomyDeletion.sort();
  for (let d = taxonomyDeletion.length - 1; d >= 0; d -= 1) {
    delete taxonomies[taxonomyDeletion[d]];
  }
  taxonomies = taxonomies.filter(t => (t ? true : false));

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
            values: [v],
            bbox: geo.bbox,
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

export const geoFilterWords = [
  'Bundesland',
  'Gemeinde',
  'Gemeinden',
  'Kreis',
  'Kreise',
  'Landkreis',
  'Landkreise',
  'Stadt',
  'Städte',
  'Bezirk',
  'Bezirke',
  'Stadtkreis',
  'Kreisfreie Stadt',
  'Freie Hansestadt',
  'Freie und Hansestadt',
  'Freistaat',
  'Land',
  'Bundesland',
  'gemeinschaftsangehörig Stadt',
  'Stadt (gemeinschaftsangehörig)',
  'gemeinschaftsangehörig Gemeinde',
  'Gemeinde (gemeinschaftsangehörig)',
  'Stadt (kreisfrei)',
  'Gemeindefreies Gebiet',
  'Region',
  'Regionalverband',
  'Städteregion',
  'Gemeindefreies Gebiet (gemeinschaftsangehörig)'
].map(w => w.toLowerCase());
