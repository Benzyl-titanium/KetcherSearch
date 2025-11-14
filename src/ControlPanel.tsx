import React, { useState } from 'react';
import {
  getWikipediaUrlByCID,
  getMolecularFormulaByCID,
  getPubChemCID,
  getCASByCID,
  getIUPACNameByCID,
  getPubChemUrlByCID,
  getPubChemData,
} from '@/services/pubchem';
import {
  findDrugBankId,
  buildDrugBankExactUrlByCAS,
  buildDrugBankFuzzyUrlBySmiles
} from './services/drugbank';
import { validateSmiles } from './services/smiles';

interface ControlPanelProps {
  smilesInput: string;
  selectedExample: string;
  onSmilesChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void | Promise<void>;
  onCopy: () => void | Promise<void>;
  onInputFocusChange?: (focused: boolean) => void;
  onExampleChange: (value: string) => void;
}

function ControlPanel({
  smilesInput,
  selectedExample,
  onSmilesChange,
  onClear,
  onCopy,
  onInputFocusChange,
  onExampleChange
}: ControlPanelProps) {
  const [loading, setLoading] = useState(false);
  const [isValidSmiles, setIsValidSmiles] = useState(true);

  // Common alert messages
  const alerts = {
    compoundNotFound: 'Compound not found',
    casNotFound: 'CAS number not found',
    iupacNotFound: 'IUPAC Name not found',
    formulaNotFound: 'Molecular Formula not found',
    wikipediaNotFound: 'Wikipedia link not found',
    drugbankNotFound: 'DrugBank ID or CAS number not found',
    invalidSmiles: 'Invalid SMILES format',
    networkError: 'Failed to fetch, please check your network',
    pubchemError: 'Failed to fetch PubChem CID, please check your network',
    wikipediaError: 'Failed to fetch Wikipedia link',
    drugbankError: 'Failed to fetch DrugBank info',
    copyFailed: 'Copy failed'
  };

  const handleSmilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setIsValidSmiles(validateSmiles(value));
    onSmilesChange(e);
  };

  const handleExampleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    onExampleChange(value);
  };

  const handlePubChem = async () => {
    if (!smilesInput) {
      return;
    }
    if (!isValidSmiles) {
      alert(alerts.invalidSmiles);
      return;
    }
    setLoading(true);
    try {
      const cid = await getPubChemCID(smilesInput);
      if (!cid) {
        alert(alerts.compoundNotFound);
        return;
      }
      const url = await getPubChemUrlByCID(cid);
      window.open(url, '_blank');
    } catch (e) {
      alert(alerts.pubchemError);
    } finally {
      setLoading(false);
    }
  };

  const handleHNMR = () => {
    if (smilesInput) {
      const searchUrl = `https://www.nmrdb.org/new_predictor/index.shtml?v=latest&smiles=${encodeURIComponent(smilesInput)}`;
      window.open(searchUrl, '_blank');
    }
  };

  // Get dropdown
  const handleGetSelect = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    if (!smilesInput || !value) return;
    setLoading(true);
    try {
      const cid = await getPubChemCID(smilesInput);
      if (!cid) {
        alert(alerts.compoundNotFound);
        return;
      }
      if (value === 'cas') {
        const cas = await getCASByCID(cid);
        if (cas) {
          try {
            await navigator.clipboard.writeText(cas);
            alert(`CAS ${cas} copied`);
          } catch {
            alert(alerts.copyFailed);
          }
        } else {
          alert(alerts.casNotFound);
        }
      } else if (value === 'iupac') {
        const name = await getIUPACNameByCID(cid);
        if (name) {
          try {
            await navigator.clipboard.writeText(name);
            alert(`IUPAC Name: ${name} copied`);
          } catch {
            alert(alerts.copyFailed);
          }
        } else {
          alert(alerts.iupacNotFound);
        }
      } else if (value === 'formula') {
        const formula = await getMolecularFormulaByCID(cid);
        if (formula) {
          try {
            await navigator.clipboard.writeText(formula);
            alert(`Molecular Formula: ${formula} copied`);
          } catch {
            alert(alerts.copyFailed);
          }
        } else {
          alert(alerts.formulaNotFound);
        }
      }
    } catch {
      alert(alerts.networkError);
    } finally {
      setLoading(false);
      event.target.value = '';
    }
  };

  const handleGetWikipedia = async () => {
    if (!smilesInput) return;
    setLoading(true);
    try {
      const cid = await getPubChemCID(smilesInput);
      if (!cid) {
        alert(alerts.compoundNotFound);
        return;
      }
      const wikipediaUrl = await getWikipediaUrlByCID(cid);
      if (wikipediaUrl) {
        window.open(wikipediaUrl, '_blank');
      } else {
        alert(alerts.wikipediaNotFound);
      }
    } catch {
      alert(alerts.wikipediaError);
    } finally {
      setLoading(false);
    }
  };

  const handleDrugBankSelect = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    if (!smilesInput || !value) return;
    
    if (value === 'fuzzy') {
      window.open(buildDrugBankFuzzyUrlBySmiles(smilesInput), '_blank');
      event.target.value = '';
      return;
    }

    setLoading(true);
    try {
      const cid = await getPubChemCID(smilesInput);
      if (!cid) {
        alert(alerts.compoundNotFound);
        return;
      }
      if (value === 'exact') {
        const data = await getPubChemData(cid);
        const result = findDrugBankId(data.Record?.Section);
        if (result && result.url) {
          window.open(result.url, '_blank');
        } else {
          const casNumber = await getCASByCID(cid);
          if (casNumber) {
            window.open(buildDrugBankExactUrlByCAS(casNumber), '_blank');
          } else {
            alert(alerts.drugbankNotFound);
          }
        }
      }
    } catch {
      alert(alerts.drugbankError);
    } finally {
      setLoading(false);
      event.target.value = '';
    }
  };

  return (
    <div style={{ marginTop: '4px', marginBottom: '4px' }}>
      {loading && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
        }}>
          <div>Loading...</div>
        </div>
      )}
      {/* Responsive input area */}
      <div className="input-stars-row">
        <input
          id="smiles-input"
          type="text"
          value={smilesInput}
          onChange={handleSmilesChange}
          onFocus={() => onInputFocusChange && onInputFocusChange(true)}
          onBlur={() => onInputFocusChange && onInputFocusChange(false)}
          placeholder="SMILES"
          style={{ 
            flex: 1, 
            minWidth: 0,
            borderColor: isValidSmiles || !smilesInput ? '#ccc' : '#ff6b6b',
            borderWidth: '1px',
            borderStyle: 'solid'
          }}
        />
        {smilesInput && (
          <span 
            style={{ 
              marginLeft: '4px', 
              color: isValidSmiles ? '#28a745' : '#dc3545',
              fontSize: '12px',
              fontWeight: 'bold'
            }}
            title={isValidSmiles ? 'Valid SMILES' : 'Invalid SMILES format'}
          >
            {isValidSmiles ? '✓' : '✗'}
          </span>
        )}
        <a
          href="https://github.com/biantailab/KetcherSearch"
          target="_blank"
          rel="noopener noreferrer"
          style={{ verticalAlign: 'middle', marginLeft: '2px' }}
        >
          <img
            src="https://img.shields.io/github/stars/biantailab/KetcherSearch.svg?style=social"
            alt="GitHub stars"
            style={{ height: '22px', verticalAlign: 'middle', position: 'relative' }}
          />
        </a>
      </div>
      {/* Responsive button area */}
      <div className="button-group" style={{ marginTop: '4px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
        <select value={selectedExample} onChange={handleExampleChange} style={{ height: '20px', cursor: 'pointer' }}>
          <option value="">Example:</option>
          <option value="C(C1=CC=CC=C1)[Ti](CC1=CC=CC=C1)(CC1=CC=CC=C1)CC1=CC=CC=C1">Benzyl titanium</option>
          <option value="O=C(O)C[C@H](CC(C)C)CN">Pregabalin</option>
          <option value="CNCCC(C1=CC=CC=C1)OC2=CC=C(C=C2)C(F)(F)F">Fluoxetine</option>
        </select>
        <button onClick={onClear} disabled={loading || !smilesInput} style={{ height: '20px', minWidth: '4px', cursor: 'pointer' }}>Clear</button>
        <button onClick={onCopy} disabled={loading || !smilesInput || !isValidSmiles} style={{ height: '20px', minWidth: '4px', cursor: 'pointer' }}>Copy</button>
        <select onChange={handleGetSelect} disabled={loading || !smilesInput || !isValidSmiles} style={{ height: '20px', cursor: 'pointer' }}>
          <option value="">Get:</option>
          <option value="cas">CAS</option>
          <option value="iupac" title="IUPACName">Name</option>
          <option value="formula" title="Molecular Formula">Formula</option>
        </select>
        <button onClick={handleHNMR} disabled={loading || !smilesInput || !isValidSmiles} style={{ height: '20px', minWidth: '4px', cursor: 'pointer' }}>HNMR</button>
        <button onClick={handlePubChem} disabled={loading || !smilesInput || !isValidSmiles} style={{ height: '20px', minWidth: '4px', cursor: 'pointer' }}>PubChem</button>
        <button onClick={handleGetWikipedia} disabled={loading || !smilesInput || !isValidSmiles} style={{ height: '20px', minWidth: '4px', cursor: 'pointer' }}>Wikipedia</button>
        <select onChange={handleDrugBankSelect} disabled={loading || !smilesInput || !isValidSmiles} style={{ height: '20px', cursor: 'pointer' }}>
          <option value="">DrugBank:</option>
          <option value="exact">exact</option>
          <option value="fuzzy">fuzzy</option>
        </select>
      </div>
      {/* Responsive styles */}
      <style>{`
        .input-stars-row {
          display: flex;
          align-items: center;
          width: 100%;
          height: 20px;
          max-width: 600px;
          gap: 4px;
          margin: 0 auto;
        }
        .button-group {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
          justify-content: center;
        }
        .button-group button, .button-group select {
          min-width: 80px;
        }
        @media screen and (max-width: 602px) {
          .input-stars-row {
            max-width: 100vw;
          }
          .button-group {
            gap: 4px;
          }
          .button-group button, .button-group select {
            flex: 1 0 auto;
            min-width: 90px;
            max-width: 100%;
          }
        }
      `}</style>
    </div>
  );
}

export default ControlPanel;