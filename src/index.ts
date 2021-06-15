import * as dotenv from 'dotenv';
import * as path from 'path';
import {Client} from 'pg';
import {
  getTaxonomies,
  processFingerprint,
  processLevenshtein,
  transformTaxonomies,
} from './taxonomies/index';

// get environmental variables
dotenv.config({path: path.join(__dirname, '../.env')});

import {api, catchAll} from 'local-microservice';

import {logError} from 'local-logger';

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
  getTaxonomies(client)
    .then(taxonomies => {
      let taxonomyGroups = transformTaxonomies(taxonomies);
      taxonomyGroups = processFingerprint(taxonomyGroups);
      taxonomyGroups = processLevenshtein(taxonomyGroups);
      res.status(200).json({message: 'Classifying'});
    })
    .catch(err => {
      console.log(err);
    });
});

catchAll();
