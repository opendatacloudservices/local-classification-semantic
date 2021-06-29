"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv = require("dotenv");
const path = require("path");
const pg_1 = require("pg");
const index_1 = require("./taxonomies/index");
const dates_1 = require("./taxonomies/dates");
// get environmental variables
dotenv.config({ path: path.join(__dirname, '../.env') });
const local_microservice_1 = require("local-microservice");
const local_logger_1 = require("local-logger");
const geonames_1 = require("./taxonomies/geonames");
const fs_1 = require("fs");
// connect to postgres (via env vars params)
const client = new pg_1.Client({
    user: process.env.PGUSER,
    host: process.env.PGHOST,
    database: process.env.PGDATABASE,
    password: process.env.PGPASSWORD,
    port: parseInt(process.env.PGPORT || '5432'),
});
client.connect().catch(err => {
    local_logger_1.logError({ message: err });
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
local_microservice_1.api.get('/classify/taxonomies', async (req, res) => {
    Promise.all([geonames_1.loadGeonames(), index_1.getTaxonomies(client)])
        .then(async (data) => {
        const start = new Date().getTime();
        let taxonomies = data[1];
        const geonames = data[0];
        console.log('All: ', taxonomies.length);
        taxonomies = index_1.cleanTaxonomies(taxonomies);
        console.log('After cleaning: ', taxonomies.length);
        taxonomies = index_1.removeStopwords(taxonomies);
        console.log('After stopwords: ', taxonomies.length);
        const dateResult = dates_1.extractDates(taxonomies);
        console.log('After dates: ', dateResult.taxonomies.length, Object.keys(dateResult.dates).length, 'time: ', new Date().getTime() - start);
        const geoResult = geonames_1.extractGeonames(dateResult.taxonomies, geonames);
        console.log('After geonames: ', geoResult.taxonomies.length, Object.keys(geoResult.locations).length, 'time: ', new Date().getTime() - start);
        taxonomies = index_1.cleanTaxonomies(geoResult.taxonomies);
        console.log('Additional cleaning: ', taxonomies.length);
        let taxonomyGroups = index_1.transformTaxonomies(taxonomies);
        console.log('After groups: ', taxonomyGroups.length, 'time: ', new Date().getTime() - start);
        taxonomyGroups = index_1.processFingerprint(taxonomyGroups);
        console.log('After fingerprint: ', taxonomyGroups.length, 'time: ', new Date().getTime() - start);
        taxonomyGroups = index_1.processLevenshtein(taxonomyGroups);
        console.log('After levenshtein: ', taxonomyGroups.length, 'time: ', new Date().getTime() - start);
        // ----------------------------------------------
        // taxonomyGroups = processNgrams(taxonomyGroups);
        // console.log(
        //   'After ngrams: ',
        //   taxonomyGroups.length,
        //   'time: ',
        //   new Date().getTime() - start
        // );
        // ----------------------------------------------
        taxonomyGroups = taxonomyGroups.filter(t => t.children.reduce((sum, current) => sum + parseInt(current.count.toString()), 0) > 10);
        taxonomyGroups.sort((t1, t2) => t1.children.reduce((sum, current) => sum + parseInt(current.count.toString()), 0) -
            t2.children.reduce((sum, current) => sum + parseInt(current.count.toString()), 0));
        console.log('After minor classes: ', taxonomyGroups.length, 'time: ', new Date().getTime() - start);
        taxonomyGroups = await index_1.translateGroups(taxonomyGroups);
        console.log('After translate: ', taxonomyGroups.length, 'time: ', new Date().getTime() - start);
        fs_1.writeFileSync('./tmp/sofar-trans.json', JSON.stringify(taxonomyGroups, null, 4), 'utf8');
        console.log('done');
        res.status(200).json({ message: 'Classifying' });
    })
        .catch(err => {
        console.log(err);
    });
});
local_microservice_1.catchAll();
const taxonomyGroups = JSON.parse(fs_1.readFileSync('./tmp/sofar.json', 'utf8'));
console.log('After minor classes: ', taxonomyGroups.length);
index_1.translateGroups(taxonomyGroups).then(taxonomyGroups => {
    console.log('After translate: ', taxonomyGroups.length);
    fs_1.writeFileSync('./tmp/sofar-trans.json', JSON.stringify(taxonomyGroups, null, 4), 'utf8');
});
//# sourceMappingURL=index.js.map