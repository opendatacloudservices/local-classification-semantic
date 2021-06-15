"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv = require("dotenv");
const path = require("path");
const pg_1 = require("pg");
const index_1 = require("./taxonomies/index");
// get environmental variables
dotenv.config({ path: path.join(__dirname, '../.env') });
const local_microservice_1 = require("local-microservice");
const local_logger_1 = require("local-logger");
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
    index_1.getTaxonomies(client)
        .then(taxonomies => {
        let taxonomyGroups = index_1.transformTaxonomies(taxonomies);
        taxonomyGroups = index_1.processFingerprint(taxonomyGroups);
        taxonomyGroups = index_1.processLevenshtein(taxonomyGroups);
        res.status(200).json({ message: 'Classifying' });
    })
        .catch(err => {
        console.log(err);
    });
});
local_microservice_1.catchAll();
//# sourceMappingURL=index.js.map