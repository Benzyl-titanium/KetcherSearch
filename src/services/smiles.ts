import type { Ketcher } from 'ketcher-core';

export async function applySmiles(ketcher: Ketcher | null, smiles: string): Promise<void> {
  if (!ketcher) return;
  const text = (smiles ?? '').trim();
  if (!text) {
    try {
      await ketcher.setMolecule('');
    } catch {}
    return;
  }
  try {
    await ketcher.setMolecule(text, { format: 'smiles' } as any);
  } catch {}
}

export async function clearMolecule(ketcher: Ketcher | null): Promise<void> {
  if (!ketcher) return;
  try {
    await ketcher.setMolecule('');
  } catch {}
}

export async function readSmiles(ketcher: Ketcher | null): Promise<string> {
  if (!ketcher) return '';
  try {
    const fn: any = (ketcher as any).getSmiles;
    const smiles = (await fn?.call(ketcher)) || '';
    return typeof smiles === 'string' ? smiles : '';
  } catch {
    return '';
  }
}

export type MolfileVersion = 'v2000' | 'v3000';

export async function readMolfile(
  ketcher: Ketcher | null,
  version: MolfileVersion = 'v2000'
): Promise<string> {
  if (!ketcher) return '';
  try {
    const fn: any = (ketcher as any).getMolfile;
    const mol = (await fn?.call(ketcher, version)) || '';
    return typeof mol === 'string' ? mol : '';
  } catch {
    return '';
  }
}

export async function applyMolfile(ketcher: Ketcher | null, molfile: string): Promise<void> {
  if (!ketcher) return;
  const text = (molfile ?? '').trim();
  try {
    await ketcher.setMolecule(text, { format: 'mol' } as any);
  } catch {}
}