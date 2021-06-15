export interface Taxonomy {
    id: number;
    value: string;
    type: string;
    count: number;
}
export interface TaxonomyGroup {
    label: string;
    types: string[];
    children: {
        id: number;
        value: string;
        type: string;
        count: number;
    }[];
}
export interface ngramList {
    [key: string]: number[];
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
