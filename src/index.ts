import * as dotenv from 'dotenv';
import * as path from 'path';
import {Client} from 'pg';
import {
  cleanTaxonomies,
  getTaxonomies,
  processFingerprint,
  processLevenshtein,
  // processNgrams,
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
import {writeFileSync, readFileSync} from 'fs';

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
  res.status(200).json({message: 'Classifying'});
  Promise.all([loadGeonames(), getTaxonomies(client)])
    .then(async data => {
      const start = new Date().getTime();
      let taxonomies = data[1];
      const geonames = data[0];

      console.log('All: ', taxonomies.length);

      taxonomies = cleanTaxonomies(taxonomies);
      console.log('After cleaning: ', taxonomies.length);

      writeFileSync(
        './tmp/01-cleaning.json',
        JSON.stringify(taxonomies, null, 4),
        'utf8'
      );

      taxonomies = removeStopwords(taxonomies);
      console.log('After stopwords: ', taxonomies.length);

      writeFileSync(
        './tmp/02-stopwords.json',
        JSON.stringify(taxonomies, null, 4),
        'utf8'
      );

      const dateResult = extractDates(taxonomies);
      console.log(
        'After dates: ',
        dateResult.taxonomies.length,
        Object.keys(dateResult.dates).length,
        'time: ',
        new Date().getTime() - start
      );

      writeFileSync(
        './tmp/03-dates.json',
        JSON.stringify(dateResult.taxonomies, null, 4),
        'utf8'
      );

      const geoResult = extractGeonames(dateResult.taxonomies, geonames);
      console.log(
        'After geonames: ',
        geoResult.taxonomies.length,
        Object.keys(geoResult.locations).length,
        'time: ',
        new Date().getTime() - start
      );

      writeFileSync(
        './tmp/04-geo.json',
        JSON.stringify(geoResult.taxonomies, null, 4),
        'utf8'
      );

      taxonomies = cleanTaxonomies(geoResult.taxonomies);
      console.log('Additional cleaning: ', taxonomies.length);

      writeFileSync(
        './tmp/05-cleaning.json',
        JSON.stringify(taxonomies, null, 4),
        'utf8'
      );

      let taxonomyGroups = transformTaxonomies(taxonomies);
      console.log(
        'After groups: ',
        taxonomyGroups.length,
        'time: ',
        new Date().getTime() - start
      );

      writeFileSync(
        './tmp/06-groups.json',
        JSON.stringify(taxonomyGroups, null, 4),
        'utf8'
      );

      taxonomyGroups = processFingerprint(taxonomyGroups);
      console.log(
        'After fingerprint: ',
        taxonomyGroups.length,
        'time: ',
        new Date().getTime() - start
      );

      writeFileSync(
        './tmp/07-fingerprint.json',
        JSON.stringify(taxonomyGroups, null, 4),
        'utf8'
      );

      taxonomyGroups = processLevenshtein(taxonomyGroups);
      console.log(
        'After levenshtein: ',
        taxonomyGroups.length,
        'time: ',
        new Date().getTime() - start
      );

      writeFileSync(
        './tmp/08-levenshtein.json',
        JSON.stringify(taxonomyGroups, null, 4),
        'utf8'
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

      writeFileSync(
        './tmp/09-minor.json',
        JSON.stringify(taxonomyGroups, null, 4),
        'utf8'
      );

      taxonomyGroups = await translateGroups(taxonomyGroups);

      console.log(
        'After translate: ',
        taxonomyGroups.length,
        'time: ',
        new Date().getTime() - start
      );

      writeFileSync(
        './tmp/10-translate.json',
        JSON.stringify(taxonomyGroups, null, 4),
        'utf8'
      );

      console.log('done');
    })
    .catch(err => {
      console.log(err);
    });
});

catchAll();
