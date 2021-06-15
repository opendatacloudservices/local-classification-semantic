"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processLevenshtein = exports.processFingerprint = exports.transformTaxonomies = exports.getTaxonomies = void 0;
const fingerprint_1 = require("./fingerprint");
const levenshtein_1 = require("./levenshtein");
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
        value IS NOT NULL`)
        .then(result => result.rows);
};
exports.getTaxonomies = getTaxonomies;
const transformTaxonomies = (taxonomies) => {
    const taxonomyGroups = [];
    // remove all taxonomies without value
    taxonomies = taxonomies.filter(t => t.value && t.value.length > 0 ? true : false);
    // only keep digit values between 1800 and current year, as they are potentially year tags
    taxonomies = taxonomies.filter(t => isNaN(parseInt(t.value)) ||
        (parseInt(t.value) >= 1800 && parseInt(t.value) <= new Date().getFullYear())
        ? true
        : false);
    // create group and filter out duplicates in the process
    const taxonomyMap = [];
    taxonomies.forEach(t => {
        const existIdx = taxonomyMap.indexOf(t.value);
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
 * - after all mergings, add minor tag to taxonomies with only N elements (probably 5)
 * - sample on 1800-2020, otherwise also remove
 * - min lenght 3?
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
const processLevenshtein = (taxonomyGroups) => {
    levenshtein_1.levenshtein(taxonomyGroups);
    return taxonomyGroups;
};
exports.processLevenshtein = processLevenshtein;
//# sourceMappingURL=index.js.map