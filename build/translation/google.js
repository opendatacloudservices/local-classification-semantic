"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.translate = void 0;
const translate_1 = require("@google-cloud/translate");
let translationClient;
const translate = (text, sourceLang, targetLang) => {
    if (!translationClient) {
        translationClient = new translate_1.v2.Translate();
    }
    return translationClient
        .translate(text, {
        from: sourceLang,
        to: targetLang,
    })
        .then(response => {
        const translations = Array.isArray(response) ? response : [response];
        if (translations && translations[0]) {
            return translations[0];
        }
        return null;
    });
};
exports.translate = translate;
//# sourceMappingURL=google.js.map