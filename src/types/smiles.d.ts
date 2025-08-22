import type { Ketcher } from 'ketcher-core';

export type MolfileVersion = 'v2000' | 'v3000';

export declare function applySmiles(ketcher: Ketcher | null, smiles: string): Promise<void>;

export declare function clearMolecule(ketcher: Ketcher | null): Promise<void>;

export declare function readSmiles(ketcher: Ketcher | null): Promise<string>;

export declare function readMolfile(
  ketcher: Ketcher | null,
  version?: MolfileVersion
): Promise<string>;

export declare function applyMolfile(ketcher: Ketcher | null, molfile: string): Promise<void>;