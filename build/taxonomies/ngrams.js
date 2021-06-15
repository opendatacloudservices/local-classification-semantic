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
            addNgram(d, di, ngrams);
        }
        else {
            for (let i = 0; i < d.length - ngramSize; i += 1) {
                addNgram(d.substr(i, ngramSize), di, ngrams);
            }
        }
    });
    console.log(Object.keys(ngrams).length);
    let clusterCount = 1;
    const clusterMap = {};
    for (const n in ngrams) {
        if (ngrams[n].length > 1) {
            console.log(n);
            const clusterName = 'cluster-' + clusterCount;
            clusterCount += 1;
            clusters[clusterName] = [];
            ngrams[n].forEach(id => {
                if (!clusters[clusterName].includes(id)) {
                    clusters[clusterName].push(id);
                }
                if (id in clusterMap && clusterMap[id] !== clusterName) {
                    const tId = String(clusterMap[id]);
                    clusters[clusterMap[id]].forEach(cid => {
                        if (!clusters[clusterName].includes(cid)) {
                            clusters[clusterName].push(cid);
                        }
                        clusterMap[cid] = clusterName;
                    });
                    delete clusters[tId];
                }
                clusterMap[id] = clusterName;
            });
            console.log(Object.keys(clusters).length);
        }
        delete ngrams[n];
    }
    console.log(Object.keys(clusters).length);
    return clusters;
};
exports.prepare = prepare;
const addNgram = (str, id, ngrams) => {
    if (!(str in ngrams)) {
        ngrams[str] = [];
    }
    if (ngrams[str].indexOf(id) === -1) {
        ngrams[str].push(id);
    }
};
//# sourceMappingURL=ngrams.js.map