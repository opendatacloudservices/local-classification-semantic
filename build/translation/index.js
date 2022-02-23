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
const get = (str, sourceLang, targetLang) => {
    const archiveVersion = (0, exports.getArchive)(str, targetLang);
    if (archiveVersion) {
        return Promise.resolve(archiveVersion);
    }
    else {
        return (0, google_1.translate)(str, sourceLang, targetLang)
            .then(translation => {
            dictionary[targetLang][str] = translation
                ? translation.toLowerCase()
                : '';
            saveDictionary();
            return translation;
        })
            .catch(err => {
            throw err;
        });
    }
};
exports.get = get;
const getArchive = (str, lang) => {
    if (!dictionaryLoaded) {
        loadDictionary();
    }
    if (str in dictionary[lang]) {
        return dictionary[lang][str].toLowerCase();
    }
    return null;
};
exports.getArchive = getArchive;
const loadDictionary = () => {
    if (!(0, fs_1.existsSync)(dictionaryLocation)) {
        saveDictionary();
    }
    dictionary = JSON.parse((0, fs_1.readFileSync)(dictionaryLocation, 'utf8'));
    dictionaryLoaded = true;
};
const saveDictionary = () => {
    (0, fs_1.writeFileSync)(dictionaryLocation, JSON.stringify(dictionary), 'utf8');
};
//# sourceMappingURL=index.js.map