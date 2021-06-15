/**
 * Fingerprint Module.
 * The concept for fingerprinting is taken from Open refine
 * https://github.com/OpenRefine/OpenRefine/wiki/Clustering-In-Depth
 */
import { ngramClusters } from '../types';
export declare const key: (str: string, type?: 'normal' | 'phonetic', params?: {
    lang: 'german' | 'english';
    stemming: boolean;
}) => string;
export declare const asciify: (str: string) => string;
export declare const analyse: (data: string[], type?: 'normal' | 'phonetic', params?: {
    lang: 'german' | 'english';
    stemming: boolean;
}) => ngramClusters;
