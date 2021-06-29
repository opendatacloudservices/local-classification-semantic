import { Taxonomy } from '../types';
export declare const extractDates: (taxonomies: Taxonomy[], deleteDates?: boolean) => {
    taxonomies: Taxonomy[];
    dates: {
        [key: number]: string;
    };
};
