"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanNgrams = exports.prepare = void 0;
// Collect strings into groups that share certain ngrams.
const prepare = (data, ngramSize = 6) => {
    const ngrams = {};
    let clusters = {};
    const shortWords = [];
    let clusterCount = 1;
    let cleanCount = 0;
    //identify and group exact matches
    data.forEach((d, di) => {
        if (d.length <= ngramSize) {
            shortWords.push(di);
        }
        else {
            const localNgramList = {};
            for (let i = 0; i < d.length - ngramSize; i += 1) {
                const str = d.substr(i, ngramSize);
                if (!(str in ngrams)) {
                    localNgramList[str] = 'undefined';
                }
                else {
                    localNgramList[str] = ngrams[str];
                }
            }
            let allUndefined = true;
            const localClusters = [];
            Object.keys(localNgramList).forEach(ngram => {
                if (localNgramList[ngram] !== 'undefined') {
                    allUndefined = false;
                    if (localClusters.indexOf(localNgramList[ngram]) === -1) {
                        localClusters.push(localNgramList[ngram]);
                    }
                }
            });
            let clusterName = 'undefined';
            if (allUndefined) {
                clusterName = 'cluster-' + clusterCount;
                clusterCount++;
                clusters[clusterName] = [di];
            }
            else if (localClusters.length === 1) {
                clusterName = localClusters[0];
                clusters[clusterName].push(di);
            }
            else {
                clusterName = localClusters[0];
                Object.keys(ngrams).forEach(ngram => {
                    if (localClusters.indexOf(ngrams[ngram]) > -1 &&
                        clusterName !== ngrams[ngram]) {
                        if (ngrams[ngram] in clusters) {
                            clusters[ngrams[ngram]].forEach(id => {
                                clusters[clusterName].push(id);
                            });
                            delete clusters[ngrams[ngram]];
                        }
                        ngrams[ngram] = clusterName;
                    }
                });
            }
            Object.keys(localNgramList).forEach(ngram => {
                ngrams[ngram] = clusterName;
            });
            // checking duplicates with indexOf takes quite some time as the arrays grow
            // therefore duplicates are removed every 500 words, as increasing array sizes
            // also slow down the process.
            cleanCount += 1;
            if (cleanCount > 500) {
                cleanCount = 0;
                clusters = (0, exports.cleanNgrams)(clusters);
            }
        }
    });
    clusters = (0, exports.cleanNgrams)(clusters);
    clusters['cluster-' + clusterCount] = shortWords;
    return clusters;
};
exports.prepare = prepare;
const cleanNgrams = (clusters) => {
    Object.keys(clusters).forEach(clusterName => {
        clusters[clusterName].sort();
        for (let d = 0; d < clusters[clusterName].length; d += 1) {
            const deletes = [];
            for (let dd = d + 1; d < clusters[clusterName].length &&
                clusters[clusterName][d] === clusters[clusterName][dd]; dd += 1) {
                deletes.push(dd);
            }
            deletes.forEach(del => {
                delete clusters[clusterName][del];
            });
        }
    });
    return clusters;
};
exports.cleanNgrams = cleanNgrams;
//# sourceMappingURL=ngrams.js.map