import { GeoName, Taxonomy } from '../types';
export declare const loadGeonames: () => Promise<GeoName[]>;
export declare const extractGeonames: (taxonomies: Taxonomy[], geoNames: GeoName[]) => {
    taxonomies: Taxonomy[];
    locations: {
        [key: number]: GeoName[];
    };
};
export declare const geoFilterWords: string[];
