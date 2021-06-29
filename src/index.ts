import * as dotenv from 'dotenv';
import * as path from 'path';
import {Client} from 'pg';
import {
  cleanTaxonomies,
  getTaxonomies,
  processFingerprint,
  processLevenshtein,
  processNgrams,
  translateGroups,
  transformTaxonomies,
  removeStopwords,
} from './taxonomies/index';
import {extractDates} from './taxonomies/dates';

// get environmental variables
dotenv.config({path: path.join(__dirname, '../.env')});

import {api, catchAll} from 'local-microservice';

import {logError} from 'local-logger';
import {extractGeonames, loadGeonames} from './taxonomies/geonames';
import {readFileSync, writeFileSync} from 'fs';

// connect to postgres (via env vars params)
const client = new Client({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: parseInt(process.env.PGPORT || '5432'),
});
client.connect().catch(err => {
  logError({message: err});
});

/**
 * @swagger
 *
 * /classify/taxonomies:
 *   get:
 *     operationId: getClassifyTaxonomies
 *     description: trying to make sense of the taxonomies
 *     produces:
 *       - application/json
 *     responses:
 *       500:
 *         description: error
 *       200:
 *         description: success
 */
api.get('/classify/taxonomies', async (req, res) => {
  Promise.all([loadGeonames(), getTaxonomies(client)])
    .then(async data => {
      const start = new Date().getTime();
      let taxonomies = data[1];
      const geonames = data[0];

      console.log('All: ', taxonomies.length);

      taxonomies = cleanTaxonomies(taxonomies);
      console.log('After cleaning: ', taxonomies.length);

      taxonomies = removeStopwords(taxonomies);
      console.log('After stopwords: ', taxonomies.length);

      const dateResult = extractDates(taxonomies);
      console.log(
        'After dates: ',
        dateResult.taxonomies.length,
        Object.keys(dateResult.dates).length,
        'time: ',
        new Date().getTime() - start
      );

      const geoResult = extractGeonames(dateResult.taxonomies, geonames);
      console.log(
        'After geonames: ',
        geoResult.taxonomies.length,
        Object.keys(geoResult.locations).length,
        'time: ',
        new Date().getTime() - start
      );

      taxonomies = cleanTaxonomies(geoResult.taxonomies);
      console.log('Additional cleaning: ', taxonomies.length);

      let taxonomyGroups = transformTaxonomies(taxonomies);
      console.log(
        'After groups: ',
        taxonomyGroups.length,
        'time: ',
        new Date().getTime() - start
      );

      taxonomyGroups = processFingerprint(taxonomyGroups);
      console.log(
        'After fingerprint: ',
        taxonomyGroups.length,
        'time: ',
        new Date().getTime() - start
      );

      taxonomyGroups = processLevenshtein(taxonomyGroups);
      console.log(
        'After levenshtein: ',
        taxonomyGroups.length,
        'time: ',
        new Date().getTime() - start
      );

      // ----------------------------------------------
      // taxonomyGroups = processNgrams(taxonomyGroups);
      // console.log(
      //   'After ngrams: ',
      //   taxonomyGroups.length,
      //   'time: ',
      //   new Date().getTime() - start
      // );
      // ----------------------------------------------

      taxonomyGroups = taxonomyGroups.filter(
        t =>
          t.children.reduce(
            (sum, current) => sum + parseInt(current.count.toString()),
            0
          ) > 10
      );

      taxonomyGroups.sort(
        (t1, t2) =>
          t1.children.reduce(
            (sum, current) => sum + parseInt(current.count.toString()),
            0
          ) -
          t2.children.reduce(
            (sum, current) => sum + parseInt(current.count.toString()),
            0
          )
      );

      console.log(
        'After minor classes: ',
        taxonomyGroups.length,
        'time: ',
        new Date().getTime() - start
      );

      taxonomyGroups = await translateGroups(taxonomyGroups);

      console.log(
        'After translate: ',
        taxonomyGroups.length,
        'time: ',
        new Date().getTime() - start
      );

      writeFileSync(
        './tmp/sofar-trans.json',
        JSON.stringify(taxonomyGroups, null, 4),
        'utf8'
      );

      console.log('done');
      res.status(200).json({message: 'Classifying'});
    })
    .catch(err => {
      console.log(err);
    });
});

catchAll();

const taxonomyGroups = JSON.parse(readFileSync('./tmp/sofar.json', 'utf8'));

console.log('After minor classes: ', taxonomyGroups.length);
translateGroups(taxonomyGroups).then(taxonomyGroups => {
  console.log('After translate: ', taxonomyGroups.length);

  writeFileSync(
    './tmp/sofar-trans.json',
    JSON.stringify(taxonomyGroups, null, 4),
    'utf8'
  );
});
