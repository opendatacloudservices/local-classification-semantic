"use strict";
/*
 * TODO: If more services require translations, the functionality of this file should be turned into a stand alone service
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getArchive = exports.get = void 0;
const fs_1 = require("fs");
const google_1 = require("./google");
let dictionary = { de: {}, en: {} };
let dictionaryLoaded = false;
const dictionaryLocation = './assets/dictionary.json';
const get = (str, lang) => {
    const archiveVersion = exports.getArchive(str, lang);
    if (archiveVersion) {
        return Promise.resolve(archiveVersion);
    }
    else {
        return google_1.translate(str, lang).then(translation => {
            dictionary[lang][str] = translation;
            saveDictionary();
            return translation;
        });
    }
};
exports.get = get;
const getArchive = (str, lang) => {
    if (!dictionaryLoaded) {
        loadDictionary();
    }
    if (str in dictionary[lang]) {
        return dictionary[lang][str];
    }
    return null;
};
exports.getArchive = getArchive;
const loadDictionary = () => {
    if (!fs_1.existsSync(dictionaryLocation)) {
        saveDictionary();
    }
    dictionary = JSON.parse(fs_1.readFileSync(dictionaryLocation, 'utf8'));
    dictionaryLoaded = true;
};
const saveDictionary = () => {
    fs_1.writeFileSync(dictionaryLocation, JSON.stringify(dictionary), 'utf8');
};
//# sourceMappingURL=index.js.map