import React, { useState, useEffect, useRef } from 'react';
import KetcherBox from './ketcher-component';
import { applySmiles, clearMolecule, readSmiles } from './services/smiles';
import ControlPanel from './ControlPanel';
import { copyToClipboard } from './utils/copy';

function App(): JSX.Element {
  const [ketcher, setKetcher] = useState<any>(null);
  const [smilesInput, setSmilesInput] = useState<string>('');
  const syncingFromKetcherRef = useRef<boolean>(false);
  const lastAppliedSmilesRef = useRef<string>('');
  const ketcherToInputTimerRef = useRef<any>(null);
  const inputFocusedRef = useRef<boolean>(false);
  const smilesInputRef = useRef<string>('');
  

  const handleClear = async () => {
    setSmilesInput("");
    await clearMolecule(ketcher);
  };

  const handleCopy = async () => {
    if (!smilesInput) {
      return;
    }
    await copyToClipboard(smilesInput);
  };

  const handleSmilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSmilesInput(e.target.value);
  };

  const applySmilesImmediate = async (text?: string) => {
    if (!ketcher) return;
    const s = (text ?? smilesInput).trim();
    if (!s) {
      await clearMolecule(ketcher);
      lastAppliedSmilesRef.current = '';
      return;
    }
    const result = await applySmiles(ketcher, s);
    if (result.success) {
      lastAppliedSmilesRef.current = s;
    } else {
      console.error('SMILES conversion failed:', result.error);
    }
  };

  const handleInputFocusChange = (focused: boolean) => {
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
      const result = await applySmiles(ketcher, text);
      if (result.success) {
        lastAppliedSmilesRef.current = text;
      } else {
        console.error('SMILES conversion failed:', result.error);
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
          const result = await readSmiles(ketcher);
          if (!result.success || !result.data) return;
          if (result.data === smilesInputRef.current) return;
          if (result.data === lastAppliedSmilesRef.current) return;
          if (inputFocusedRef.current) return;
          syncingFromKetcherRef.current = true;
          setSmilesInput(result.data);
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