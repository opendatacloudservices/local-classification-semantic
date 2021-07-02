"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.translateGroups = exports.processLevenshtein = exports.processNgrams = exports.processFingerprint = exports.transformTaxonomies = exports.removeStopwords = exports.cleanTaxonomies = exports.getTaxonomies = void 0;
const fingerprint_1 = require("./fingerprint");
const levenshtein_1 = require("./levenshtein");
const ngrams_1 = require("./ngrams");
const stopwords = require("stopwords-de");
const index_1 = require("../translation/index");
const getTaxonomies = (client) => {
    return client
        .query(`SELECT
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
        value IS NOT NULL AND LENGTH(value) > 3`)
        .then(result => result.rows);
};
exports.getTaxonomies = getTaxonomies;
const cleanTaxonomies = (taxonomies) => {
    // make sure its all lower case
    taxonomies = taxonomies.map(t => {
        return {
            ...t,
            value: t.value.toLowerCase(),
        };
    });
    // remove all taxonomies without value
    taxonomies = taxonomies.filter(t => t.value &&
        t.value.length > 3 &&
        (typeof t.value === 'string' || typeof t.value === 'number')
        ? true
        : false);
    // only keep digit values between 1800 and current year, as they are potentially year tags
    taxonomies = taxonomies.filter(t => isNaN(parseInt(t.value)) ||
        (parseInt(t.value) >= 1800 && parseInt(t.value) <= new Date().getFullYear())
        ? true
        : false);
    // anführungszeichen entfernen
    for (let t = 0; t < taxonomies.length; t += 1) {
        taxonomies[t].value = taxonomies[t].value.replace(/["'„“»«‚‘›‹]/g, '');
    }
    const deleteWords = ['http', 'inspire'];
    taxonomies = taxonomies.filter(t => {
        let notFound = true;
        deleteWords.forEach(w => {
            if (t.value.indexOf(w) >= 0) {
                notFound = false;
            }
        });
        return notFound;
    });
    return taxonomies;
};
exports.cleanTaxonomies = cleanTaxonomies;
const removeStopwords = (taxonomies) => {
    const customStopwords = [
        'eu',
        'sonstige',
        'übrige',
        'op',
        'eg',
        'insgesamt',
        'gesamt',
        'bn',
    ];
    const allStopwords = stopwords.concat(customStopwords);
    const taxonomyDeletion = [];
    for (let t = 0; t < taxonomies.length; t += 1) {
        let els = taxonomies[t].value.split(/[\s,-.–;/_]/g);
        const deletion = [];
        els.forEach((el, ei) => {
            el = el.replace(/[)[\]]/g, '');
            if (allStopwords.includes(el)) {
                deletion.push(ei);
            }
        });
        deletion.sort();
        for (let d = deletion.length - 1; d >= 0; d -= 1) {
            delete els[deletion[d]];
        }
        // min length of words > 2
        els = els.filter(e => (e && e.trim().length > 2 ? true : false));
        // we replace all delimiters with simple spaces!
        taxonomies[t].value = els.join(' ').trim();
        if (taxonomies[t].value.length === 0) {
            taxonomyDeletion.push(t);
        }
    }
    taxonomyDeletion.sort();
    for (let d = taxonomyDeletion.length - 1; d >= 0; d -= 1) {
        delete taxonomies[taxonomyDeletion[d]];
    }
    taxonomies = taxonomies.filter(t => (t ? true : false));
    return taxonomies;
};
exports.removeStopwords = removeStopwords;
const transformTaxonomies = (taxonomies) => {
    const taxonomyGroups = [];
    // create group and filter out duplicates in the process
    const taxonomyMap = [];
    taxonomies.forEach(t => {
        let existIdx = taxonomyMap.indexOf(t.value);
        // simple alterations
        const extensions = ['e', 'en', 's', 'n', 'm', 'es'];
        for (let e = 0; e < extensions.length && existIdx === -1; e += 1) {
            existIdx = taxonomyMap.indexOf(t.value + extensions[e]);
        }
        for (let e = 0; e < extensions.length && existIdx === -1; e += 1) {
            if (t.value.substr(-extensions[e].length, extensions[e].length) ===
                extensions[e]) {
                existIdx = taxonomyMap.indexOf(t.value.substr(0, t.value.length - extensions[e].length));
            }
        }
        if (existIdx > -1) {
            taxonomyGroups[existIdx].children.push(t);
            if (t.type &&
                t.type.length > 0 &&
                !taxonomyGroups[existIdx].types.includes(t.type)) {
                taxonomyGroups[existIdx].types.push(t.type);
            }
        }
        else {
            const types = [];
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
exports.transformTaxonomies = transformTaxonomies;
/*
 * TODO:
 * - sample on 1800-2020, otherwise also remove
 */
const processFingerprint = (taxonomyGroups) => {
    const analysis = fingerprint_1.analyse(taxonomyGroups.map(t => t.label), 'normal', {
        lang: 'german',
        stemming: true,
    });
    const newGroups = [];
    Object.keys(analysis).forEach(key => {
        // filter out numeric fingerprints (except 1800 - current year)
        if (isNaN(parseInt(key)) ||
            (parseInt(key) >= 1800 && parseInt(key) <= new Date().getFullYear())) {
            const newGroup = taxonomyGroups[analysis[key][0].id];
            analysis[key].forEach((item, i) => {
                if (i > 0) {
                    for (let ci = 0; ci < taxonomyGroups[item.id].children.length; ci += 1) {
                        taxonomyGroups[item.id].children[ci].merge = 'fingerprint';
                    }
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
exports.processFingerprint = processFingerprint;
const processNgrams = (taxonomies) => {
    const groups = ngrams_1.prepare(taxonomies.map(t => t.label), 12 // if two tags share at least 10 sequential characters they are part of a group ???!
    );
    const deletion = [];
    Object.keys(groups).forEach((group, gi) => {
        // ignore the short words
        if (gi < Object.keys(groups).length - 1) {
            const target = groups[group][0];
            for (let g = 1; g < groups[group].length; g += 1) {
                for (let ci = 0; ci < taxonomies[groups[group][g]].children.length; ci += 1) {
                    taxonomies[groups[group][g]].children[ci].merge = 'ngrams';
                }
                taxonomies[target].children = taxonomies[target].children.concat(taxonomies[groups[group][g]].children);
                deletion.push(groups[group][g]);
            }
        }
    });
    deletion.sort();
    for (let d = deletion.length - 1; d >= 0; d -= 1) {
        delete taxonomies[deletion[d]];
    }
    const r = taxonomies.filter(t => (t ? true : false));
    return r;
};
exports.processNgrams = processNgrams;
const processLevenshtein = (taxonomyGroups) => {
    return levenshtein_1.levenshtein(taxonomyGroups);
};
exports.processLevenshtein = processLevenshtein;
const translateGroups = async (taxonomyGroups) => {
    const deletion = [];
    for (let ti = 0; ti < taxonomyGroups.length; ti += 1) {
        const translation = await index_1.get(taxonomyGroups[ti].label, 'de', 'en');
        if (!translation) {
            deletion.push(ti);
        }
        else {
            taxonomyGroups[ti].labelEn = translation;
            if (translation &&
                taxonomyGroups[ti].label.toLowerCase().trim() ===
                    translation.toLowerCase().trim()) {
                const reTranslation = await index_1.get(taxonomyGroups[ti].label, 'en', 'de');
                if (!reTranslation) {
                    deletion.push(ti);
                }
                else if (reTranslation &&
                    translation.toLowerCase().trim() ===
                        reTranslation.toLowerCase().trim()) {
                    deletion.push(ti);
                }
                else {
                    taxonomyGroups[ti].label = reTranslation;
                }
            }
        }
    }
    deletion.sort();
    for (let d = deletion.length - 1; d >= 0; d -= 1) {
        delete taxonomyGroups[deletion[d]];
    }
    const r = taxonomyGroups.filter(t => (t ? true : false));
    return r;
};
exports.translateGroups = translateGroups;
//# sourceMappingURL=index.js.map