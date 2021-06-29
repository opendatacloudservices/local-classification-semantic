import { clusterList } from '../types';
export declare const prepare: (data: string[], ngramSize?: number) => clusterList;
export declare const cleanNgrams: (clusters: clusterList) => clusterList;
