"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prepare = void 0;
// Collect strings into groups that share certain ngrams.
const prepare = (data, ngramSize = 6) => {
    const ngrams = {};
    const clusters = {};
    //identify and group exact matches
    data.forEach((d, di) => {
        if (d.length <= ngramSize) {
            // TODO: put all shorts words in one group?
            // ignore words shorter than ngramSize
            // addNgram(d, di, ngrams);
        }
        else {
            for (let i = 0; i < d.length - ngramSize; i += 1) {
                const str = d.substr(i, ngramSize);
                if (!(str in ngrams)) {
                    ngrams[str] = [];
                }
                if (ngrams[str].indexOf(di) === -1) {
                    ngrams[str].push(di);
                }
            }
        }
    });
    console.log(Object.keys(ngrams).length);
    let clusterCount = 1;
    const clusterMap = {};
    Object.keys(ngrams).forEach(gram => {
        const ngram = ngrams[gram];
        if (ngram.length > 1) {
            const clusterName = 'cluster-' + clusterCount;
            clusterCount += 1;
            clusters[clusterName] = [];
            ngram.forEach(id => {
                if (clusters[clusterName].indexOf(id) === -1) {
                    clusters[clusterName].push(id);
                }
                if (id in clusterMap && clusterMap[id] !== clusterName) {
                    const tId = String(clusterMap[id]);
                    clusters[tId].forEach(cid => {
                        // if (clusters[clusterName].indexOf(cid) === -1) {
                        clusters[clusterName].push(cid);
                        // }
                        clusterMap[cid] = clusterName;
                    });
                    delete clusters[tId];
                }
                clusterMap[id] = clusterName;
            });
        }
        delete ngrams[gram];
    });
    console.log(Object.keys(clusters).length);
    return clusters;
};
exports.prepare = prepare;
//# sourceMappingURL=ngrams.js.map