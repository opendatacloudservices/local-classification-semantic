import { GeoName, Taxonomy } from '../types';
export declare const loadGeonames: () => Promise<GeoName[]>;
export declare const extractGeonames: (taxonomies: Taxonomy[], geoNames: GeoName[], deleteLocations?: boolean) => {
    taxonomies: Taxonomy[];
    locations: {
        [key: number]: {
            lat: number;
            lon: number;
            value: string;
        };
    };
};
