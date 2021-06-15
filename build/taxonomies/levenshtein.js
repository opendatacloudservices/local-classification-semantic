"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.levenshtein = exports.levenshteinPercentage = void 0;
const fastest_levenshtein_1 = require("fastest-levenshtein");
const ngrams_1 = require("./ngrams");
const fs_1 = require("fs");
const levenshteinPercentage = (word1, word2) => {
    let index = fastest_levenshtein_1.distance(word1, word2);
    index /= word1.length < word2.length ? word1.length : word2.length;
    return index;
};
exports.levenshteinPercentage = levenshteinPercentage;
const levenshtein = (taxonomies) => {
    // identify groups of words that share certain ngrams
    const groups = ngrams_1.prepare(taxonomies.map(t => t.label));
    // create distance matrices for all words in each group
    Object.keys(groups).forEach(key => {
        if (groups[key].length > 1) {
            // do processing
        }
    });
    fs_1.writeFileSync('./tmp/ngrams.json', JSON.stringify(Object.keys(groups).length, null, 4), 'utf8');
    return taxonomies;
};
exports.levenshtein = levenshtein;
//# sourceMappingURL=levenshtein.js.map