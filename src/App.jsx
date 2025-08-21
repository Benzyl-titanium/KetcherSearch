import React, { useState, useEffect, useRef } from 'react';
import KetcherBox from './ketcher-component.tsx';
import ControlPanel from './ControlPanel.jsx';

function App() {
  const [ketcher, setKetcher] = useState(null);
  const [smilesInput, setSmilesInput] = useState('');
  const syncingFromKetcherRef = useRef(false);
  const lastAppliedSmilesRef = useRef('');
  const ketcherToInputTimerRef = useRef(null);
  const inputFocusedRef = useRef(false);
  const smilesInputRef = useRef('');
  

  const handleClear = async () => {
    setSmilesInput("");
    if (ketcher && ketcher.setMolecule) {
      try {
        await ketcher.setMolecule("");
      } catch {
      }
    }
  };

  const handleCopy = async () => {
    if (!smilesInput) {
      return;
    }
    try {
      await navigator.clipboard.writeText(smilesInput);
    } catch {
    }
  };

  const handleSmilesChange = (e) => {
    setSmilesInput(e.target.value);
  };

  const applySmilesImmediate = async (text) => {
    if (!ketcher) return;
    const s = (text ?? smilesInput).trim();
    if (!s) {
      try { await ketcher.setMolecule(''); lastAppliedSmilesRef.current = ''; } catch {}
      return;
    }
    try {
      await ketcher.setMolecule(s, { format: 'smiles' });
      lastAppliedSmilesRef.current = s;
    } catch {
    }
  };

  const handleInputFocusChange = (focused) => {
    inputFocusedRef.current = focused;
  };

  useEffect(() => {
    smilesInputRef.current = smilesInput;
  }, [smilesInput]);

  useEffect(() => {
    if (!ketcher) return;
    const controller = { cancelled: false };
    const timer = setTimeout(async () => {
      if (controller.cancelled) return;
      if (!inputFocusedRef.current) return;
      const text = smilesInput.trim();
      if (syncingFromKetcherRef.current) return;
      if (text === lastAppliedSmilesRef.current) return;
      if (!text) {
        try { await ketcher.setMolecule(''); } catch {}
        lastAppliedSmilesRef.current = '';
        return;
      }
      try {
        await ketcher.setMolecule(text, { format: 'smiles' });
        lastAppliedSmilesRef.current = text;
      } catch {
      }
    }, 400);
    return () => { controller.cancelled = true; clearTimeout(timer); };
  }, [smilesInput, ketcher]);

  useEffect(() => {
    if (!ketcher) return;
    let cleanup = () => {};
    const scheduleUpdate = () => {
      if (ketcherToInputTimerRef.current) clearTimeout(ketcherToInputTimerRef.current);
      ketcherToInputTimerRef.current = setTimeout(async () => {
        try {
          const smiles = (await ketcher.getSmiles?.()) || '';
          if (!smiles) return;
          if (smiles === smilesInputRef.current) return;
          if (smiles === lastAppliedSmilesRef.current) return;
          if (inputFocusedRef.current) return;
          syncingFromKetcherRef.current = true;
          setSmilesInput(smiles);
        } catch {
        } finally {
          setTimeout(() => { syncingFromKetcherRef.current = false; }, 0);
        }
      }, 500);
    };
    try {
      if (typeof ketcher.subscribe === 'function') {
        ketcher.subscribe('change', scheduleUpdate);
        cleanup = () => { try { ketcher.unsubscribe && ketcher.unsubscribe('change', scheduleUpdate); } catch {} };
      } else if (typeof ketcher.on === 'function') {
        ketcher.on('change', scheduleUpdate);
        cleanup = () => { try { ketcher.off && ketcher.off('change', scheduleUpdate); } catch {} };
      } else {
        const timer = setInterval(scheduleUpdate, 800);
        cleanup = () => clearInterval(timer);
      }
    } catch {
      const timer = setInterval(scheduleUpdate, 800);
      cleanup = () => clearInterval(timer);
    }
    return cleanup;
  }, [ketcher]);

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ border: '1px solid #ccc', borderRadius: '4px', marginBottom: '4px', background: '#fff' }}>
        <ControlPanel
          smilesInput={smilesInput}
          onSmilesChange={handleSmilesChange}
          onClear={handleClear}
          onCopy={handleCopy}
          onInputFocusChange={handleInputFocusChange}
          onApplySmiles={applySmilesImmediate}
        />
      </div>
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', border: '1px solid #ccc', borderRadius: '4px', background: '#fff' }}>
        <KetcherBox onKetcherInit={setKetcher} />
      </div>
    </div>
  )
}

export default App