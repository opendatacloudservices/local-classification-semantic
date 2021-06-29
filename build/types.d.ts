export interface Taxonomy {
    id: number;
    value: string;
    type: string;
    count: number;
}
export interface TaxonomyGroup {
    label: string;
    labelEn?: string;
    types: string[];
    children: {
        oid?: number;
        id: number;
        value: string;
        type: string;
        count: number;
        merge?: string;
    }[];
}
export interface ngramList {
    [key: string]: string;
}
export interface ngramClusters {
    [key: string]: {
        id: number;
        label: string;
    }[];
}
export interface clusterList {
    [key: string]: number[];
}
export interface clusterResultEl {
    [key: string]: {
        ok: number;
        ids: number[];
    };
}
export interface clusterResult {
    cluster: clusterResultEl;
    key: string;
}
export interface GeoName {
    lat: number;
    lon: number;
    values: string[];
}
