export declare type languages = 'de' | 'en';
export declare const get: (str: string, lang: languages) => Promise<string | null>;
export declare const getArchive: (str: string, lang: languages) => string | null;
