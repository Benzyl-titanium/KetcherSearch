import type { PubChemSection } from "../types/pubchem";

export async function getPubChemCID(smiles: string): Promise<number | null> {
  const searchUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/smiles/${encodeURIComponent(
    smiles
  )}/cids/JSON`;
  try {
    const searchResponse = await fetch(searchUrl);
    if (!searchResponse.ok) {
      throw new Error(`PubChem search failed: ${searchResponse.status}`);
    }
    const searchData = await searchResponse.json();
    if (!searchData.IdentifierList?.CID?.[0]) {
      return null;
    }
    return searchData.IdentifierList.CID[0];
  } catch (e) {
    return null;
  }
}

export function buildPubChemCompoundUrl(cid: number): string {
  return `https://pubchem.ncbi.nlm.nih.gov/compound/${cid}`;
}

export async function getCASByCID(cid: number): Promise<string | null> {
  const casUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/synonyms/JSON`;
  const casResponse = await fetch(casUrl);
  if (!casResponse.ok) throw new Error("CAS query failed");
  const casData = await casResponse.json();
  const synonyms = casData.InformationList?.Information?.[0]?.Synonym || [];
  const casNumber = synonyms.find(
    (syn) => /^\d+-\d{2}-\d$/.test(syn) && !syn.startsWith("EC")
  );
  return casNumber || null;
}

export async function getSynonymsByCID(cid: number): Promise<string[]> {
  const url = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/synonyms/JSON`;
  const response = await fetch(url);
  if (!response.ok) throw new Error("Synonyms query failed");
  const data = await response.json();
  const synonyms: string[] = data.InformationList?.Information?.[0]?.Synonym || [];
  const normalized = Array.from(new Set((synonyms || []).map((s: string) => s?.trim()).filter(Boolean)));
  return normalized;
}

export async function getPubChemData(cid: number): Promise<any> {
  const url = `https://pubchem.ncbi.nlm.nih.gov/rest/pug_view/data/compound/${cid}/JSON/`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Failed to fetch PubChem data");
  }
  return await response.json();
}

export async function getIUPACNameByCID(cid: number): Promise<string | null> {
  const nameUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/property/IUPACName/JSON`;
  const nameResponse = await fetch(nameUrl);
  if (!nameResponse.ok) {
    throw new Error("Failed to fetch IUPACName");
  }
  const nameData = await nameResponse.json();
  return nameData.PropertyTable?.Properties?.[0]?.IUPACName || null;
}

export async function getMolecularFormulaByCID(cid: number): Promise<string | null> {
  const formulaUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/property/MolecularFormula/JSON`;
  const formulaResponse = await fetch(formulaUrl);
  if (!formulaResponse.ok) {
    throw new Error("Failed to fetch MolecularFormula");
  }
  const formulaData = await formulaResponse.json();
  return formulaData.PropertyTable?.Properties?.[0]?.MolecularFormula || null;
}

export function findWikipediaLink(
  sections: PubChemSection[],
  recordTitle: string,
  synonyms: string[] = []
): string | null {
  for (const section of sections || []) {
    if (section.TOCHeading === "Wikipedia") {
      const information = section.Information || [];
      if (information.length > 0) {
        const normalize = (s?: string) => (s || "").trim().toLowerCase();
        const titlesToMatch = [recordTitle, ...synonyms]
          .filter(Boolean)
          .map((t) => normalize(t));

        let bestUrl: string | null = null;
        let bestScore = -1;

        information.forEach((info) => {
          const rawTitle = info.Value?.StringWithMarkup?.[0]?.String;
          const wikiTitle = normalize(rawTitle);
          const url = info.URL || null;
          if (!url) return;

          let score = 0;
          if (url.includes("en.wikipedia.org")) score += 20;
          const nameHint = normalize(info.Name);
          if (nameHint.includes("wikipedia") && nameHint.includes("en")) score += 10;

          if (wikiTitle && titlesToMatch.includes(wikiTitle)) {
            score += 100;
          } else if (wikiTitle) {
            for (const title of titlesToMatch) {
              if (title && (title.includes(wikiTitle) || wikiTitle.includes(title))) {
                score += 60;
                break;
              }
            }
          }

          if (score > bestScore) {
            bestScore = score;
            bestUrl = url;
          }
        });

        if (bestUrl) return bestUrl;
      }
    }
    if (section.Section) {
      const result = findWikipediaLink(section.Section, recordTitle, synonyms);
      if (result) return result;
    }
  }
  return null;
} 