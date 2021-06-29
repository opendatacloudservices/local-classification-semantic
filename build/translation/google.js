"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.translate = void 0;
const translate_1 = require("@google-cloud/translate");
let translationClient;
const translate = (text, lang) => {
    if (!translationClient) {
        translationClient = new translate_1.v2.Translate();
    }
    return translationClient.translate(text, lang).then(response => {
        const translations = Array.isArray(response) ? response : [response];
        if (translations && translations[0]) {
            return response[0];
        }
        return null;
    });
};
exports.translate = translate;
//# sourceMappingURL=google.js.map