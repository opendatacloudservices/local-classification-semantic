"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv = require("dotenv");
const path = require("path");
const pg_1 = require("pg");
const index_1 = require("./taxonomies/index");
const dates_1 = require("./taxonomies/dates");
// get environmental variables
dotenv.config({ path: path.join(__dirname, '../.env') });
const local_microservice_1 = require("@opendatacloudservices/local-microservice");
const local_logger_1 = require("@opendatacloudservices/local-logger");
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
    (0, local_logger_1.logError)({ message: err });
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
    res.status(200).json({ message: 'Classifying' });
    Promise.all([(0, geonames_1.loadGeonames)(), (0, index_1.getTaxonomies)(client)])
        .then(async (data) => {
        const start = new Date().getTime();
        let taxonomies = data[1];
        const geonames = data[0];
        console.log('All: ', taxonomies.length);
        taxonomies = (0, index_1.cleanTaxonomies)(taxonomies);
        console.log('After cleaning: ', taxonomies.length);
        (0, fs_1.writeFileSync)('./tmp/01-cleaning.json', JSON.stringify(taxonomies, null, 4), 'utf8');
        taxonomies = (0, index_1.removeStopwords)(taxonomies);
        console.log('After stopwords: ', taxonomies.length);
        (0, fs_1.writeFileSync)('./tmp/02-stopwords.json', JSON.stringify(taxonomies, null, 4), 'utf8');
        const dateResult = (0, dates_1.extractDates)(taxonomies);
        console.log('After dates: ', dateResult.taxonomies.length, Object.keys(dateResult.dates).length, 'time: ', new Date().getTime() - start);
        (0, fs_1.writeFileSync)('./tmp/03-dates.json', JSON.stringify(dateResult.taxonomies, null, 4), 'utf8');
        const geoResult = (0, geonames_1.extractGeonames)(dateResult.taxonomies, geonames);
        console.log('After geonames: ', geoResult.taxonomies.length, Object.keys(geoResult.locations).length, 'time: ', new Date().getTime() - start);
        (0, fs_1.writeFileSync)('./tmp/04-geo.json', JSON.stringify(geoResult.taxonomies, null, 4), 'utf8');
        taxonomies = (0, index_1.cleanTaxonomies)(geoResult.taxonomies);
        console.log('Additional cleaning: ', taxonomies.length);
        (0, fs_1.writeFileSync)('./tmp/05-cleaning.json', JSON.stringify(taxonomies, null, 4), 'utf8');
        let taxonomyGroups = (0, index_1.transformTaxonomies)(taxonomies);
        console.log('After groups: ', taxonomyGroups.length, 'time: ', new Date().getTime() - start);
        (0, fs_1.writeFileSync)('./tmp/06-groups.json', JSON.stringify(taxonomyGroups, null, 4), 'utf8');
        taxonomyGroups = (0, index_1.processFingerprint)(taxonomyGroups);
        console.log('After fingerprint: ', taxonomyGroups.length, 'time: ', new Date().getTime() - start);
        (0, fs_1.writeFileSync)('./tmp/07-fingerprint.json', JSON.stringify(taxonomyGroups, null, 4), 'utf8');
        taxonomyGroups = (0, index_1.processLevenshtein)(taxonomyGroups);
        console.log('After levenshtein: ', taxonomyGroups.length, 'time: ', new Date().getTime() - start);
        (0, fs_1.writeFileSync)('./tmp/08-levenshtein.json', JSON.stringify(taxonomyGroups, null, 4), 'utf8');
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
        (0, fs_1.writeFileSync)('./tmp/09-minor.json', JSON.stringify(taxonomyGroups, null, 4), 'utf8');
        taxonomyGroups = await (0, index_1.translateGroups)(taxonomyGroups);
        console.log('After translate: ', taxonomyGroups.length, 'time: ', new Date().getTime() - start);
        (0, fs_1.writeFileSync)('./tmp/10-translate.json', JSON.stringify(taxonomyGroups, null, 4), 'utf8');
        taxonomyGroups = (0, index_1.processFingerprint)(taxonomyGroups);
        (0, fs_1.writeFileSync)('./tmp/11-2ndFingerprint.json', JSON.stringify(taxonomyGroups, null, 4), 'utf8');
        taxonomyGroups = (0, index_1.processLevenshtein)(taxonomyGroups);
        (0, fs_1.writeFileSync)('./tmp/12-2ndLevenshtein.json', JSON.stringify(taxonomyGroups, null, 4), 'utf8');
        console.log('done');
    })
        .catch(err => {
        console.log(err);
    });
});
(0, local_microservice_1.catchAll)();
//# sourceMappingURL=index.js.map