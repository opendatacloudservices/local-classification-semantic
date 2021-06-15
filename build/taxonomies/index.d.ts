import { Client } from 'pg';
import { Taxonomy, TaxonomyGroup } from '../types';
export declare const getTaxonomies: (client: Client) => Promise<Taxonomy[]>;
export declare const transformTaxonomies: (taxonomies: Taxonomy[]) => TaxonomyGroup[];
export declare const processFingerprint: (taxonomyGroups: TaxonomyGroup[]) => TaxonomyGroup[];
export declare const processLevenshtein: (taxonomyGroups: TaxonomyGroup[]) => TaxonomyGroup[];
