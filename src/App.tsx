/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Trash2, Edit2, Save, ArrowLeft, LogOut, ChevronDown, Check, X, RotateCcw } from 'lucide-react';
import { Campaign, Character, Sticker } from './types';
import { STICKERS, TRACKER_LABELS, CLASSES, RACES } from './constants';

const LOCAL_STORAGE_KEY = 'dragonfire_campaigns';

export default function App() {
  const [view, setView] = useState<'menu' | 'new' | 'load' | 'campaign'>('menu');
  const [isPortrait, setIsPortrait] = useState(false);

  useEffect(() => {
    const checkOrientation = () => {
      setIsPortrait(window.innerHeight > window.innerWidth);
    };
    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    return () => window.removeEventListener('resize', checkOrientation);
  }, []);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [currentCampaign, setCurrentCampaign] = useState<Campaign | null>(null);
  const [currentCharacterIndex, setCurrentCharacterIndex] = useState(0);
  const [isBackSide, setIsBackSide] = useState(false);
  const [availableSheets, setAvailableSheets] = useState<string[]>([]);

  // Fetch available character sheets from the server
  useEffect(() => {
    const fetchSheets = async () => {
      try {
        const response = await fetch('/api/sheets');
        const data = await response.json();
        setAvailableSheets(data);
      } catch (error) {
        console.error('Failed to fetch character sheets:', error);
      }
    };
    fetchSheets();
  }, []);

  // Load campaigns from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        setCampaigns(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse campaigns", e);
      }
    }
  }, []);

  // Save campaigns to localStorage
  const saveCampaigns = (updatedCampaigns: Campaign[]) => {
    setCampaigns(updatedCampaigns);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedCampaigns));
  };

  const handleStartNew = () => {
    setView('new');
  };

  const handleLoad = () => {
    setView('load');
  };

  const handleExit = () => {
    // In a web app, "exit" usually means just going back to the menu or closing the tab.
    // We'll just show a message or reset.
    if (confirm("Are you sure you want to exit?")) {
      window.location.reload();
    }
  };

  const createCampaign = (name: string, characterData: { name: string, class: string, race: string }[]) => {
    const newCampaign: Campaign = {
      id: crypto.randomUUID(),
      name,
      lastModified: Date.now(),
      characters: characterData.map(data => ({
        id: crypto.randomUUID(),
        name: data.name,
        race: data.race,
        class: data.class,
        stickers: { 1: null, 2: null, 3: null, 4: null, 5: null, 6: null },
        trackerValue: 0,
        magicItems: '',
        magicItemsRight: '',
        xp: '',
        level: ''
      }))
    };
    const updated = [...campaigns, newCampaign];
    saveCampaigns(updated);
    setCurrentCampaign(newCampaign);
    setCurrentCharacterIndex(0);
    setView('campaign');
  };

  const updateCurrentCampaign = (updated: Campaign) => {
    setCurrentCampaign(updated);
    const updatedCampaigns = campaigns.map(c => c.id === updated.id ? updated : c);
    saveCampaigns(updatedCampaigns);
  };

  const handleSaveAndReturn = () => {
    if (currentCampaign) {
      updateCurrentCampaign({ ...currentCampaign, lastModified: Date.now() });
    }
    setView('menu');
    setCurrentCampaign(null);
  };

  return (
    <div className="min-h-screen bg-black text-slate-100 font-sans selection:bg-red-500/30">
      <AnimatePresence>
        {isPortrait && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center p-8 text-center"
          >
            <motion.div
              animate={{ rotate: 90 }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              className="mb-6 text-red-500"
            >
              <RotateCcw size={64} />
            </motion.div>
            <h2 className="text-3xl font-display text-orange-500 mb-4">Landscape Mode Required</h2>
            <p className="text-slate-400 max-w-xs">
              Please rotate your device to landscape mode for the best experience.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {view === 'menu' && (
          <motion.div
            key="menu"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center justify-center min-h-screen p-6"
            style={{ 
              backgroundImage: "url('/Mainbackground.jpg')", 
              backgroundSize: 'contain', 
              backgroundRepeat: 'no-repeat', 
              backgroundPosition: 'center' 
            }}
          >
            <h2 
              className="text-[34px] font-display mb-12 tracking-widest text-white uppercase mt-[40vh]"
              style={{ textShadow: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000' }}
            >
              Campaign Tracker
            </h2>
            <div className="flex flex-col gap-4 w-full max-w-xs">
              <MenuButton onClick={handleStartNew} label="New Campaign" icon={<Plus size={20} />} />
              <MenuButton onClick={handleLoad} label="Load Campaign" icon={<Save size={20} />} />
              <MenuButton onClick={handleExit} label="Exit" icon={<LogOut size={20} />} variant="danger" />
            </div>
          </motion.div>
        )}

        {view === 'new' && (
          <NewCampaignForm
            onCancel={() => setView('menu')}
            onSubmit={createCampaign}
            availableSheets={availableSheets}
          />
        )}

        {view === 'load' && (
          <LoadCampaignList
            campaigns={campaigns}
            onSelect={(c) => {
              setCurrentCampaign(c);
              setCurrentCharacterIndex(0);
              setView('campaign');
            }}
            onDelete={(id) => {
              const updated = campaigns.filter(c => c.id !== id);
              saveCampaigns(updated);
            }}
            onCancel={() => setView('menu')}
          />
        )}

        {view === 'campaign' && currentCampaign && (
          <CampaignView
            campaign={currentCampaign}
            characterIndex={currentCharacterIndex}
            onCharacterChange={setCurrentCharacterIndex}
            onUpdateCampaign={updateCurrentCampaign}
            onBack={handleSaveAndReturn}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function MenuButton({ onClick, label, icon, variant = 'primary' }: { onClick: () => void, label: string, icon: React.ReactNode, variant?: 'primary' | 'danger' }) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`flex items-center justify-between px-6 py-4 rounded-xl font-display text-2xl tracking-wide transition-all shadow-lg ${
        variant === 'primary' 
          ? 'bg-red-700 hover:bg-red-600 text-white shadow-red-950/50 border border-red-600/50' 
          : 'bg-slate-900/80 hover:bg-red-950/40 text-red-500 border border-red-900/50'
      }`}
    >
      <span>{label}</span>
      {icon}
    </motion.button>
  );
}

function NewCampaignForm({ onCancel, onSubmit, availableSheets }: { onCancel: () => void, onSubmit: (name: string, characters: { name: string, class: string, race: string }[]) => void, availableSheets: string[] }) {
  const [name, setName] = useState('');
  
  // Parse available sheets into unique classes and races
  const classes = Array.from(new Set(availableSheets.map(s => s.split('_')[0]))).sort();
  const races = Array.from(new Set(availableSheets.map(s => s.split('_')[1]))).sort();

  const [characters, setCharacters] = useState([{ 
    name: '', 
    class: classes[0] || CLASSES[0], 
    race: races[0] || RACES[0] 
  }]);

  const addCharacterField = () => setCharacters([...characters, { 
    name: '', 
    class: classes[0] || CLASSES[0], 
    race: races[0] || RACES[0] 
  }]);
  const updateCharacter = (index: number, field: 'name' | 'class' | 'race', val: string) => {
    const next = [...characters];
    next[index] = { ...next[index], [field]: val };
    setCharacters(next);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center min-h-screen p-6"
    >
      <div className="w-full max-w-2xl bg-black/90 backdrop-blur-xl p-8 rounded-2xl shadow-2xl border border-red-900/30">
        <h2 className="text-3xl font-display mb-6 flex items-center gap-2 text-orange-500 tracking-wide">
          <Plus className="text-red-500" /> New Campaign
        </h2>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Campaign Name</label>
            <input
              autoFocus
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-600 transition-all text-slate-100"
              placeholder="Enter campaign name..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Characters</label>
            <div className="space-y-4 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
              {characters.map((char, i) => (
                <div key={i} className="p-4 bg-slate-950/50 rounded-xl border border-slate-800 space-y-3">
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="block text-[10px] uppercase tracking-widest text-slate-500 mb-1">Name</label>
                      <input
                        type="text"
                        value={char.name}
                        onChange={(e) => updateCharacter(i, 'name', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-red-600 transition-all text-sm"
                        placeholder="Character name..."
                      />
                    </div>
                    <div className="w-1/3">
                      <label className="block text-[10px] uppercase tracking-widest text-slate-500 mb-1">Class</label>
                      <select
                        value={char.class}
                        onChange={(e) => updateCharacter(i, 'class', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-red-600 transition-all text-sm"
                      >
                        {classes.length > 0 ? classes.map(c => <option key={c} value={c}>{c}</option>) : CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="w-1/3">
                      <label className="block text-[10px] uppercase tracking-widest text-slate-500 mb-1">Race</label>
                      <select
                        value={char.race}
                        onChange={(e) => updateCharacter(i, 'race', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-red-600 transition-all text-sm"
                      >
                        {races.length > 0 ? races.map(r => <option key={r} value={r}>{r}</option>) : RACES.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={addCharacterField}
              className="mt-4 text-sm text-orange-500 hover:text-orange-400 flex items-center gap-1 transition-colors font-bold uppercase tracking-widest"
            >
              <Plus size={16} /> Add another character
            </button>
          </div>
        </div>

        <div className="flex gap-3 mt-8">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 font-medium transition-colors border border-slate-700"
          >
            Cancel
          </button>
          <button
            disabled={!name || characters.every(c => !c.name)}
            onClick={() => onSubmit(name, characters.filter(c => c.name.trim()))}
            className="flex-1 px-4 py-2 rounded-lg bg-red-700 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed font-display text-xl tracking-wide transition-all shadow-lg shadow-red-950/50"
          >
            Start
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function LoadCampaignList({ campaigns, onSelect, onDelete, onCancel }: { campaigns: Campaign[], onSelect: (c: Campaign) => void, onDelete: (id: string) => void, onCancel: () => void }) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center min-h-screen p-6"
    >
      <div className="w-full max-w-md bg-black/90 backdrop-blur-xl p-8 rounded-2xl shadow-2xl border border-red-900/30 relative overflow-hidden">
        <h2 className="text-3xl font-display mb-6 flex items-center gap-2 text-orange-500 tracking-wide">
          <Save className="text-emerald-500" /> Load Campaign
        </h2>

        {campaigns.length === 0 ? (
          <div className="text-center py-12 text-slate-600">
            No saved campaigns found.
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
            {campaigns.sort((a, b) => b.lastModified - a.lastModified).map((c) => (
              <div key={c.id} className="group flex items-center gap-2">
                <button
                  onClick={() => onSelect(c)}
                  className="flex-1 text-left bg-black hover:bg-red-950/20 p-4 rounded-xl border border-slate-800 hover:border-red-900/50 transition-all"
                >
                  <div className="font-display text-2xl tracking-wide text-slate-200">{c.name}</div>
                  <div className="text-xs text-slate-500 uppercase tracking-widest">
                    {c.characters.length} characters • {new Date(c.lastModified).toLocaleDateString()}
                  </div>
                </button>
                <button
                  onClick={() => setDeletingId(c.id)}
                  className="p-3 text-slate-600 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={onCancel}
          className="w-full mt-8 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 font-medium transition-colors border border-slate-700"
        >
          Back
        </button>

        <AnimatePresence>
          {deletingId && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center z-50"
            >
              <Trash2 size={48} className="text-red-500 mb-4" />
              <h3 className="text-xl font-bold mb-2">Delete Campaign?</h3>
              <p className="text-sm text-slate-400 mb-6">This action cannot be undone.</p>
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setDeletingId(null)}
                  className="flex-1 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onDelete(deletingId);
                    setDeletingId(null);
                  }}
                  className="flex-1 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 transition-colors font-bold"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function CampaignView({ campaign, characterIndex, onCharacterChange, onUpdateCampaign, onBack }: { 
  campaign: Campaign, 
  characterIndex: number, 
  onCharacterChange: (i: number) => void,
  onUpdateCampaign: (c: Campaign) => void,
  onBack: () => void
}) {
  const [isBackSide, setIsBackSide] = useState(false);
  const character = campaign.characters[characterIndex];

  const updateCharacter = (updatedChar: Character) => {
    const nextChars = [...campaign.characters];
    nextChars[characterIndex] = updatedChar;
    onUpdateCampaign({ ...campaign, characters: nextChars });
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Top Bar */}
      <div className="bg-black/80 backdrop-blur-xl border-b border-red-900/30 p-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-red-500/10 text-red-500 rounded-lg transition-colors"
            title="Save and Return"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="font-display text-3xl tracking-wide text-orange-500 leading-tight">{campaign.name}</h2>
            <div className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-bold">Dragonfire Campaign</div>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-black/80 p-1 rounded-xl border border-slate-800">
          {campaign.characters.map((char, i) => (
            <button
              key={char.id}
              onClick={() => onCharacterChange(i)}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all uppercase tracking-tighter ${
                i === characterIndex 
                  ? 'bg-red-700 text-white shadow-lg shadow-red-950/50' 
                  : 'text-slate-500 hover:text-slate-300 hover:bg-black'
              }`}
            >
              {char.name}
            </button>
          ))}
        </div>

        <button
          onClick={() => setIsBackSide(!isBackSide)}
          className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-red-900/20 text-red-500 text-xs font-black uppercase tracking-widest transition-all border border-red-900/30"
        >
          Flip to {isBackSide ? 'Front' : 'Back'}
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-8 overflow-auto">
        <motion.div
          key={isBackSide ? 'back' : 'front'}
          initial={{ rotateY: isBackSide ? 90 : -90, opacity: 0 }}
          animate={{ rotateY: 0, opacity: 1 }}
          transition={{ type: 'spring', damping: 20, stiffness: 100 }}
          className="relative w-full max-w-6xl aspect-[3/1] bg-slate-800 rounded-lg shadow-2xl overflow-hidden border-4 border-slate-700"
          style={{
            backgroundImage: `url(/charactersheets/${character.class.toLowerCase()}_${character.race.toLowerCase()}_${isBackSide ? 'b' : 'f'}.jpg)`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {/* Overlay to make it look like the provided images if background fails */}
          <div className="absolute inset-0 bg-blue-900/5 pointer-events-none" />

          {!isBackSide ? (
            <FrontSide character={character} onUpdate={updateCharacter} />
          ) : (
            <BackSide character={character} onUpdate={updateCharacter} />
          )}
        </motion.div>
      </div>
    </div>
  );
}

function FrontSide({ character, onUpdate }: { character: Character, onUpdate: (c: Character) => void }) {
  return (
    <div className="absolute inset-0 flex flex-col">
      {/* Tracker Top - Aligned with the 16 boxes */}
      <div className="flex justify-between h-[18%] px-[2%] pt-[1%]">
        {TRACKER_LABELS.map((label, i) => (
          <button
            key={i}
            onClick={() => onUpdate({ ...character, trackerValue: i })}
            className="relative flex-1 group"
          >
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              {character.trackerValue === i && (
                <motion.div
                  layoutId="tracker-circle"
                  className="relative w-10 h-10 rounded-full border-4 border-emerald-400 bg-emerald-400/20 shadow-[0_0_20px_rgba(52,211,153,0.6)] -top-[10px]"
                  style={{ 
                    marginLeft: `${-16 + (i >= 4 ? (i - 3) * 3.5 : 0)}px`
                  }}
                />
              )}
            </div>
            {/* Invisible box for clicking */}
            <div className="w-full h-full hover:bg-white/5 transition-colors cursor-pointer" />
          </button>
        ))}
      </div>

      {/* Feature Slots - Aligned with the white boxes */}
      <div className="flex-1 flex justify-between px-[1%] pb-[2%] mt-[2%]">
        {/* Left Slots (1-3) */}
        <div className="w-[24.5%] flex flex-col justify-between py-[1%]">
          {[1, 2, 3].map(slot => (
            <FeatureSlot
              key={slot}
              slot={slot}
              stickerName={character.stickers[slot] ?? null}
              onUpdate={(name) => onUpdate({
                ...character,
                stickers: { ...character.stickers, [slot]: name }
              })}
            />
          ))}
        </div>

        {/* Center Info - Aligned with the center area */}
        <div className="flex-1 flex flex-col items-start justify-start pl-[4%] pt-[2%]">
           {/* Character Name Field */}
           <div className="flex items-center w-full">
             <div className="w-[18%] invisible">NAME</div>
             <input
               type="text"
               value={character.name}
               onChange={(e) => onUpdate({ ...character, name: e.target.value })}
               className="relative bg-transparent border-none focus:ring-0 text-slate-900 font-display text-2xl tracking-wide uppercase flex-1 p-0 -top-[23px] -left-[45px]"
               placeholder="NAME"
             />
           </div>
           
           <div className="flex gap-4 mt-1 w-full">
             {/* XP Field */}
             <div className="flex items-center">
               <div className="w-[20px] invisible">XP</div>
               <input
                 type="text"
                 value={character.xp}
                 onChange={(e) => onUpdate({ ...character, xp: e.target.value })}
                 className="relative bg-transparent border-none focus:ring-0 text-black font-bold text-base uppercase tracking-widest w-16 p-0 ml-2 top-[4px]"
                 style={{ textShadow: '-1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff, 1px 1px 0 #fff' }}
                 placeholder="XP"
               />
             </div>
             {/* Level Field */}
             <div className="flex items-center ml-2">
               <div className="w-[40px] invisible">LEVEL</div>
               <input
                 type="text"
                 value={character.level}
                 onChange={(e) => onUpdate({ ...character, level: e.target.value })}
                 className="relative bg-transparent border-none focus:ring-0 text-black font-bold text-[17px] uppercase tracking-widest w-16 p-0 -left-[35px] top-[4px]"
                 style={{ textShadow: '-1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff, 1px 1px 0 #fff' }}
                 placeholder="LVL"
               />
             </div>
           </div>
        </div>

        {/* Right Slots (4-6) */}
        <div className="w-[24.5%] flex flex-col justify-between py-[1%]">
          {[4, 5, 6].map(slot => (
            <FeatureSlot
              key={slot}
              slot={slot}
              stickerName={character.stickers[slot] ?? null}
              onUpdate={(name) => onUpdate({
                ...character,
                stickers: { ...character.stickers, [slot]: name }
              })}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface FeatureSlotProps {
  slot: number;
  stickerName: string | null;
  onUpdate: (name: string | null) => void;
}

const renderDescriptionWithIcons = (text: string) => {
  const parts = text.split(/(%[^%]+\.jpg%)/g);
  return parts.map((part, index) => {
    if (part.startsWith('%') && part.endsWith('%')) {
      const iconName = part.slice(1, -1);
      return (
        <img
          key={index}
          src={`/icons/${iconName}`}
          alt={iconName}
          className="inline-block h-2.5 w-2.5 mx-0.5 align-middle"
          referrerPolicy="no-referrer"
        />
      );
    }
    return part;
  });
};

const getSlotOffsets = (slot: number) => {
  switch(slot) {
    case 1: return "-top-[8px] -left-[12px]";
    case 2: return "top-[8px] -left-[12px]";
    case 3: return "top-[22px] -left-[12px]";
    case 4: return "-top-[8px] left-[5px]";
    case 5: return "top-[8px] left-[5px]";
    case 6: return "top-[22px] left-[5px]";
    default: return "-top-[14px] -left-[30px]";
  }
};

const FeatureSlot: React.FC<FeatureSlotProps> = ({ slot, stickerName, onUpdate }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showActions, setShowActions] = useState(false);

  const sticker = STICKERS.find(s => s.name === stickerName);
  const slotOffsets = getSlotOffsets(slot);

  if (stickerName && sticker) {
    return (
      <div className="relative h-[28%] w-full flex items-center justify-center group">
        <button
          onClick={() => setShowActions(!showActions)}
          className={`relative w-[100%] h-[98%] bg-black rounded-sm border border-slate-800 flex items-center justify-center p-1 shadow-lg hover:border-blue-400 transition-all ${slotOffsets}`}
        >
          <div className="w-full h-full bg-[#f0f0f0] rounded-[10%/50%] flex flex-col items-center justify-between py-1 px-1.5 text-slate-900 relative shadow-inner overflow-hidden border border-slate-300">
            {/* Title */}
            <div className="flex flex-col items-center w-full">
              <div className="font-black text-[9px] leading-none uppercase tracking-tight text-black">
                {sticker.name}
              </div>
              {/* Wavy Line */}
              <svg width="40" height="4" viewBox="0 0 40 4" fill="none" xmlns="http://www.w3.org/2000/svg" className="mt-0.5 opacity-40">
                <path d="M0 2C5 2 5 0 10 0C15 0 15 2 20 2C25 2 25 4 30 4C35 4 35 2 40 2" stroke="black" strokeWidth="1.5" />
              </svg>
              {sticker.lineNumber && (
                <div className="text-[5px] text-slate-400 font-bold -mt-0.5">{sticker.lineNumber}</div>
              )}
            </div>

            {/* Requirement */}
            {sticker.requirement && sticker.requirement.toLowerCase() !== 'none' && (
              <div className="italic text-[6px] leading-none text-slate-600 font-medium -mt-0.5">
                {renderDescriptionWithIcons(sticker.requirement)}
              </div>
            )}

            {/* Description */}
            <div className="text-[7px] leading-[1.1] text-center font-bold text-slate-800 flex-1 flex items-center justify-center px-0.5">
              <span>{renderDescriptionWithIcons(sticker.description)}</span>
            </div>

            {/* Feature Type Badge */}
            {sticker.featureType && sticker.featureType.toLowerCase() !== 'none' && (
              <div className="relative mt-0.5">
                <div className="bg-black text-white text-[6px] px-2.5 py-0.5 font-black uppercase tracking-tighter clip-hexagon">
                  {renderDescriptionWithIcons(sticker.featureType)}
                </div>
              </div>
            )}
          </div>
        </button>

        <AnimatePresence>
          {showActions && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              className="absolute z-20 top-full mt-1 bg-slate-900 border border-red-900/50 rounded-lg shadow-2xl p-1 flex gap-1 backdrop-blur-xl"
            >
              <button
                onClick={() => {
                  setIsDropdownOpen(true);
                  setShowActions(false);
                }}
                className="p-2 hover:bg-orange-500/20 text-orange-500 rounded-md transition-colors"
                title="Edit"
              >
                <Edit2 size={16} />
              </button>
              <button
                onClick={() => {
                  onUpdate(null);
                  setShowActions(false);
                }}
                className="p-2 hover:bg-red-500/20 text-red-500 rounded-md transition-colors"
                title="Delete"
              >
                <Trash2 size={16} />
              </button>
              <button
                onClick={() => setShowActions(false)}
                className="p-2 hover:bg-slate-800 text-slate-500 rounded-md transition-colors"
              >
                <X size={16} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {isDropdownOpen && (
          <StickerDropdown
            slot={slot}
            onSelect={(name) => {
              onUpdate(name);
              setIsDropdownOpen(false);
            }}
            onClose={() => setIsDropdownOpen(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="relative h-[28%] w-full flex items-center justify-center">
      {!isDropdownOpen ? (
        <button
          onClick={() => setIsDropdownOpen(true)}
          className={`relative w-[100%] h-[98%] bg-white/10 hover:bg-white/20 border-2 border-dashed border-white/20 hover:border-white/40 rounded-sm flex items-center justify-center transition-all group ${slotOffsets}`}
        >
          <Plus className="text-white/30 group-hover:text-white/60 group-hover:scale-110 transition-all" size={32} />
        </button>
      ) : (
        <StickerDropdown
          slot={slot}
          onSelect={(name) => {
            onUpdate(name);
            setIsDropdownOpen(false);
          }}
          onClose={() => setIsDropdownOpen(false)}
        />
      )}
    </div>
  );
}

function StickerDropdown({ onSelect, onClose, slot }: { onSelect: (name: string) => void, onClose: () => void, slot: number }) {
  const isBottom = slot === 3 || slot === 6;
  const isRight = slot >= 4;

  return (
    <div className={`absolute z-30 ${isBottom ? 'bottom-full mb-6' : 'top-0'} ${isRight ? 'right-0' : 'left-0'} w-48 h-40 bg-slate-950 border border-red-900/50 rounded-sm shadow-2xl flex flex-col overflow-hidden -ml-[32px]`}>
      <div className="p-1 border-b border-red-900/30 flex justify-between items-center bg-red-950/20">
        <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest ml-1">Select Feature</span>
        <button onClick={onClose} className="p-1 hover:bg-red-500/20 rounded text-red-500 transition-colors">
          <X size={12} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar p-1 space-y-1 bg-slate-950">
        {STICKERS.map(s => (
          <button
            key={s.id}
            onClick={() => onSelect(s.name)}
            className="w-full text-left px-2 py-1.5 text-xs hover:bg-red-700 text-slate-300 hover:text-white rounded transition-colors font-bold uppercase tracking-tighter"
          >
            {s.name}
          </button>
        ))}
      </div>
    </div>
  );
}

function BackSide({ character, onUpdate }: { character: Character, onUpdate: (c: Character) => void }) {
  return (
    <div className="absolute inset-0 flex flex-col">
       {/* Tracker Top (Mirrored on back) */}
       <div className="flex justify-between h-[18%] px-[2%] pt-[1%]">
        {[...TRACKER_LABELS].reverse().map((label, i) => {
          const actualIndex = 15 - i;
          return (
            <div key={i} className="flex-1 relative">
              <button
                onClick={() => onUpdate({ ...character, trackerValue: actualIndex })}
                className="w-full h-full hover:bg-white/5 transition-colors cursor-pointer"
              />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                {character.trackerValue === actualIndex && (
                  <div 
                    className="relative w-10 h-10 rounded-full border-4 border-emerald-400 bg-emerald-400/20 shadow-[0_0_20px_rgba(52,211,153,0.6)] -top-[9px]"
                    style={{ 
                      marginLeft: `${20.75 - (actualIndex >= 4 ? (actualIndex - 3) * 3.5 : 0)}px`
                    }}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex-1 flex px-[1%] pb-[2%] mt-[2%] gap-4">
        {/* Left Magic Items Area */}
        <div className="w-[24.5%] flex flex-col -ml-[5px]">
          <div className="h-[32%] flex items-end pb-2" />
          <textarea
            value={character.magicItems}
            onChange={(e) => onUpdate({ ...character, magicItems: e.target.value })}
            className="flex-1 bg-transparent border-none focus:ring-0 text-slate-900 font-mono text-sm font-bold resize-none leading-[1.05rem] custom-scrollbar px-2"
            placeholder="Magic items..."
            style={{ backgroundImage: 'linear-gradient(transparent 16px, #00000015 17px)', backgroundSize: '100% 16.8px' }}
          />
        </div>

        {/* Center Area (Visual) */}
        <div className="flex-1" />

        {/* Right Magic Items Area */}
        <div className="w-[24.5%] flex flex-col -mr-[5px]">
          <div className="h-[10%] flex items-end pb-2" />
          <textarea
            value={character.magicItemsRight}
            onChange={(e) => onUpdate({ ...character, magicItemsRight: e.target.value })}
            className="flex-1 bg-transparent border-none focus:ring-0 text-slate-900 font-mono text-sm font-bold resize-none leading-[1.05rem] custom-scrollbar px-2"
            placeholder="More items..."
            style={{ backgroundImage: 'linear-gradient(transparent 16px, #00000015 17px)', backgroundSize: '100% 16.8px' }}
          />
        </div>
      </div>
    </div>
  );
}
