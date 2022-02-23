"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.geoFilterWords = exports.extractGeonames = exports.loadGeonames = void 0;
const fs_1 = require("fs");
// min length of a location name
const minLength = 4;
// some geonames are very common in the german language
const exclude = [
    'lage',
    'eich',
    'lich',
    'asse',
    'schutz',
    'grun',
    'bode',
    'boden',
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
const loadGeonames = () => {
    return new Promise(resolve => {
        const data = (0, fs_1.readFileSync)('./assets/geonames_DE.txt', 'utf8');
        const officialData = (0, fs_1.readFileSync)('./assets/locations-clean.tsv', 'utf8');
        const uniqueGeonames = [];
        const geoNames = [];
        data.split('\n').forEach(line => {
            const columns = line.split('\t');
            if (['A', 'H', 'L', 'T', 'V'].includes(columns[6])) {
                const values = [];
                columns[1] = columns[1].toLowerCase().trim();
                if (columns[1] &&
                    columns[1].length >= minLength &&
                    !exclude.includes(columns[1]) &&
                    !uniqueGeonames.includes(columns[1])) {
                    uniqueGeonames.push(columns[1]);
                    values.push(columns[1]);
                }
                columns[2] = columns[2].toLowerCase().trim();
                if (columns[2] &&
                    columns[2].length >= minLength &&
                    values.indexOf(columns[2]) === -1 &&
                    !exclude.includes(columns[2]) &&
                    !uniqueGeonames.includes(columns[2])) {
                    uniqueGeonames.push(columns[2]);
                    values.push(columns[2]);
                }
                // Alternate writings contain a lot of weird stuff
                if (columns[3]) {
                    columns[3].split(',').forEach(v => {
                        v = v.toLowerCase().trim();
                        if (v &&
                            v.length >= minLength &&
                            values.indexOf(v) === -1 &&
                            !exclude.includes(v) &&
                            !uniqueGeonames.includes(v)) {
                            uniqueGeonames.push(v);
                            values.push(v);
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
            columns[0] = columns[0].toLowerCase().trim();
            if (!uniqueGeonames.includes(columns[0]) &&
                columns[0].length >= minLength) {
                geoNames.push({
                    values: [columns[0]],
                    bbox: columns.slice(1).map(c => parseFloat(c)),
                    lat: null,
                    lon: null,
                });
            }
        });
        resolve(geoNames);
    });
};
exports.loadGeonames = loadGeonames;
const extractGeonames = (taxonomies, geoNames) => {
    const r = {
        taxonomies: [],
        locations: {},
    };
    const matches = {};
    const taxonomyDeletion = [];
    taxonomies.forEach((t, ti) => {
        const match = [];
        const matchLocations = [];
        for (let gi = 0; gi < geoNames.length; gi += 1) {
            const geo = geoNames[gi];
            for (let vi = 0; vi < geo.values.length; vi += 1) {
                const v = geo.values[vi];
                if (t.value.indexOf(v) >= 0) {
                    match.push(v);
                    matchLocations.push({
                        values: [v],
                        bbox: geo.bbox,
                        lat: geo.lat,
                        lon: geo.lon,
                    });
                }
            }
        }
        if (match.length > 0) {
            match.forEach((m, mi) => {
                // TODO: turn into function
                let els = t.value.split(/[\s,-.–;/_]/g);
                const deletion = [];
                els.forEach((el, ei) => {
                    el = el.replace(/[)[\]]/g, '');
                    if (el === m) {
                        deletion.push(ei);
                        if (!(t.id in r.locations)) {
                            r.locations[t.id] = [];
                        }
                        r.locations[t.id].push(matchLocations[mi]);
                        if (!(m in matches)) {
                            matches[m] = 0;
                        }
                        matches[m]++;
                    }
                });
                deletion.sort();
                for (let d = deletion.length - 1; d >= 0; d -= 1) {
                    delete els[deletion[d]];
                }
                els = els.filter(e => (e && e.trim().length > 2 ? true : false));
                taxonomies[ti].value = els.join(' ').trim();
            });
            taxonomies[ti].value = taxonomies[ti].value.replace(/\s\s+/g, ' ').trim();
            if (taxonomies[ti].value.length < minLength) {
                taxonomyDeletion.push(ti);
            }
        }
    });
    // remove all tags (completely) with an areal descriptors
    for (let t = 0; t < taxonomies.length; t += 1) {
        const deletion = [];
        let els = taxonomies[t].value.split(/[\s,-.–;/_]/g);
        els.forEach((el, ei) => {
            el = el.replace(/[)[\]]/g, '');
            if (exports.geoFilterWords.includes(el)) {
                deletion.push(ei);
            }
        });
        deletion.sort();
        for (let d = deletion.length - 1; d >= 0; d -= 1) {
            delete els[deletion[d]];
        }
        els = els.filter(e => (e && e.trim().length > 2 ? true : false));
        taxonomies[t].value = els.join(' ').trim().replace(/\s\s+/g, ' ').trim();
        if (taxonomies[t].value.length < minLength &&
            !taxonomyDeletion.includes(t)) {
            taxonomyDeletion.push(t);
        }
    }
    taxonomyDeletion.sort();
    for (let d = taxonomyDeletion.length - 1; d >= 0; d -= 1) {
        delete taxonomies[taxonomyDeletion[d]];
    }
    r.taxonomies = taxonomies.filter(t => (t ? true : false));
    const sortableMatches = [];
    Object.keys(matches).forEach(match => {
        sortableMatches.push([match, matches[match]]);
    });
    sortableMatches.sort((a, b) => {
        return a[1] - b[1];
    });
    (0, fs_1.writeFileSync)('./tmp/geonames', JSON.stringify(sortableMatches, null, 4), 'utf8');
    return r;
};
exports.extractGeonames = extractGeonames;
exports.geoFilterWords = [
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
    'Gemeindefreies Gebiet (gemeinschaftsangehörig)',
].map(w => w.toLowerCase());
//# sourceMappingURL=geonames.js.map