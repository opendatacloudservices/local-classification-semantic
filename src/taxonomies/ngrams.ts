import {ngramList, clusterList} from '../types';

// Collect strings into groups that share certain ngrams.
export const prepare = (data: string[], ngramSize = 6): clusterList => {
  const ngrams: ngramList = {};
  const clusters: clusterList = {};

  //identify and group exact matches
  data.forEach((d, di) => {
    if (d.length <= ngramSize) {
      // TODO: put all shorts words in one group?
      // ignore words shorter than ngramSize
      // addNgram(d, di, ngrams);
    } else {
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
  const clusterMap: {[key: number]: string} = {};

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
          clusters[tId].forEach(cid => {
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
