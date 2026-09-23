import React, { useState } from 'react';
import { 
  Upload, Code2, Play, Sparkles, FileText, CheckCircle2, 
  ArrowLeft, RefreshCw, Layers, AlertCircle, Terminal, HelpCircle 
} from 'lucide-react';
import { Game, GameGenre } from '../types/game';
import { GAME_TEMPLATES } from '../data/gameTemplates';
import { createGame, updateGame } from '../utils/api';

interface GameUploaderProps {
  onClose: () => void;
  onGameSaved: (savedGame: Game) => void;
  initialGameToUpdate?: Game | null;
}

export const GameUploader: React.FC<GameUploaderProps> = ({
  onClose,
  onGameSaved,
  initialGameToUpdate,
}) => {
  const isUpdating = Boolean(initialGameToUpdate);

  // Form State
  const [title, setTitle] = useState<string>(initialGameToUpdate?.title || '');
  const [description, setDescription] = useState<string>(initialGameToUpdate?.description || '');
  const [genre, setGenre] = useState<GameGenre>(initialGameToUpdate?.genre || 'Action');
  const [author, setAuthor] = useState<string>(initialGameToUpdate?.author || '');
  const [version, setVersion] = useState<string>(
    initialGameToUpdate 
      ? `1.${initialGameToUpdate.versions.length}.0`
      : '1.0.0'
  );
  const [changelog, setChangelog] = useState<string>('');
  const [tagsInput, setTagsInput] = useState<string>(
    initialGameToUpdate?.tags.join(', ') || 'HTML5, Arcade, Web'
  );
  const [controlsInput, setControlsInput] = useState<string>(
    initialGameToUpdate?.controls.map(c => `${c.key}:${c.action}`).join('\n') || 
    'WASD / Arrows:Move Character\nSpace:Action / Jump'
  );
  const [accentTheme, setAccentTheme] = useState<string>('blue');

  // Editor / Code state
  const [activeTab, setActiveTab] = useState<'editor' | 'file' | 'templates'>('editor');
  const [gameCode, setGameCode] = useState<string>(
    initialGameToUpdate?.code || GAME_TEMPLATES[0].code
  );
  const [previewKey, setPreviewKey] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [dragOver, setDragOver] = useState<boolean>(false);

  // Pick thumbnail gradient based on non-neon theme
  const getGradientForTheme = (th: string) => {
    switch (th) {
      case 'emerald': return 'from-emerald-950 via-slate-900 to-black';
      case 'amber': return 'from-amber-950 via-slate-900 to-black';
      case 'slate': return 'from-slate-800 via-slate-900 to-black';
      case 'blue':
      default: return 'from-blue-950 via-slate-900 to-black';
    }
  };

  const getAccentColor = (th: string) => {
    switch (th) {
      case 'emerald': return '#10b981';
      case 'amber': return '#f59e0b';
      case 'slate': return '#94a3b8';
      case 'blue':
      default: return '#3b82f6';
    }
  };

  // Handle template selection
  const handleSelectTemplate = (templateId: string) => {
    const tmpl = GAME_TEMPLATES.find(t => t.id === templateId);
    if (tmpl) {
      setGameCode(tmpl.code);
      if (!title) setTitle(tmpl.name);
      if (!description) setDescription(tmpl.description);
      setGenre(tmpl.genre);
      setControlsInput(tmpl.defaultControls.map(c => `${c.key}:${c.action}`).join('\n'));
      setActiveTab('editor');
      setPreviewKey(prev => prev + 1);
    }
  };

  // Handle file drop / upload
  const handleFileUpload = (file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        setGameCode(content);
        if (!title) {
          const match = content.match(/<title>([^<]+)<\/title>/i);
          if (match && match[1]) setTitle(match[1]);
          else setTitle(file.name.replace(/\.[^/.]+$/, ''));
        }
        setActiveTab('editor');
        setPreviewKey(prev => prev + 1);
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  // Save / Publish game
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !gameCode.trim()) {
      alert('Please provide a game title and code.');
      return;
    }

    setIsSubmitting(true);

    const parsedControls = controlsInput
      .split('\n')
      .map(line => {
        const parts = line.split(':');
        if (parts.length >= 2) {
          return { key: parts[0].trim(), action: parts.slice(1).join(':').trim() };
        }
        return { key: 'Key', action: line.trim() };
      })
      .filter(c => c.action);

    const parsedTags = tagsInput
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    try {
      if (isUpdating && initialGameToUpdate) {
        const updated = await updateGame(initialGameToUpdate.id, {
          title,
          description,
          genre,
          tags: parsedTags,
          version,
          changelog: changelog || 'Updated game balance and mechanics.',
          code: gameCode,
          author: author || initialGameToUpdate.author,
          controls: parsedControls.length > 0 ? parsedControls : initialGameToUpdate.controls,
        });
        onGameSaved(updated);
      } else {
        const created = await createGame({
          title,
          description: description || 'A community-crafted web game created in the studio.',
          genre,
          tags: parsedTags.length > 0 ? parsedTags : ['Indie', 'HTML5'],
          author: author || 'Sphere Creator',
          version: version || '1.0.0',
          changelog: changelog || 'Initial release on Sphere Strike Games.',
          code: gameCode,
          thumbnailGradient: getGradientForTheme(accentTheme),
          accentColor: getAccentColor(accentTheme),
          iconName: genre === 'Shooter' ? 'Rocket' : genre === 'Retro' ? 'Zap' : 'Gamepad2',
          controls: parsedControls.length > 0 ? parsedControls : [{ key: 'Mouse & Keys', action: 'Standard Game Controls' }],
        });
        onGameSaved(created);
      }
    } catch (err) {
      console.error('Failed to save game', err);
      alert('Failed to save game. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white border border-white/[0.06] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white font-['Outfit'] flex items-center gap-2">
              <Code2 className="w-5 h-5 text-blue-400" />
              <span>{isUpdating ? `Update Game: ${initialGameToUpdate?.title}` : 'Sphere Strike Creator Studio'}</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {isUpdating 
                ? 'Ship an update with a new version number and changelog. Community players get the updated build instantly!'
                : 'Upload an HTML5 / Canvas game or code one directly in the sandbox. Everyone can play it once published.'
              }
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setPreviewKey(prev => prev + 1)}
            className="px-3 py-1.5 bg-white/[0.04] hover:bg-white/[0.08] text-xs text-slate-300 hover:text-white border border-white/[0.06] rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-blue-400" />
            <span>Re-run Sandbox</span>
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !title.trim()}
            className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-md shadow-blue-950 disabled:opacity-50 transition-all flex items-center gap-2 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4 text-white" />
            <span>{isSubmitting ? 'Publishing...' : isUpdating ? 'Publish Version Update' : 'Publish to Sphere Strike'}</span>
          </button>
        </div>
      </div>

      {/* Main Studio Grid: Left Form & Code, Right Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Columns: Metadata & Code Editor */}
        <div className="lg:col-span-7 space-y-5">
          {/* Metadata Accordion / Fields */}
          <div className="p-5 rounded-2xl glass-panel border border-white/[0.08] space-y-4">
            <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              <span>1. Game Metadata & Versioning</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Game Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Kinetic Orb Striker"
                  required
                  className="w-full px-3 py-2 text-xs bg-white/[0.04] border border-white/[0.08] rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Genre / Category
                </label>
                <select
                  value={genre}
                  onChange={(e) => setGenre(e.target.value as GameGenre)}
                  className="w-full px-3 py-2 text-xs bg-slate-900 border border-white/[0.08] rounded-xl text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="2 Player">2 Player</option>
                  <option value="Action">Action</option>
                  <option value="Arcade">Arcade</option>
                  <option value="Shooter">Shooter</option>
                  <option value="Puzzle">Puzzle</option>
                  <option value="Driving">Driving</option>
                  <option value="Sports">Sports</option>
                  <option value="Casual">Casual</option>
                  <option value="Retro">Retro</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Author / Developer Name
                </label>
                <input
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="e.g. PixelCrafter"
                  className="w-full px-3 py-2 text-xs bg-white/[0.04] border border-white/[0.08] rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Version Number *
                </label>
                <input
                  type="text"
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  placeholder="1.0.0"
                  required
                  className="w-full px-3 py-2 text-xs bg-white/[0.04] border border-white/[0.08] rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your game, premise, and objective..."
                rows={2}
                className="w-full px-3 py-2 text-xs bg-white/[0.04] border border-white/[0.08] rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Version Changelog (What changed?)
              </label>
              <input
                type="text"
                value={changelog}
                onChange={(e) => setChangelog(e.target.value)}
                placeholder="e.g. Added multi-ball bonus and adjusted paddle speed"
                className="w-full px-3 py-2 text-xs bg-white/[0.04] border border-white/[0.08] rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Controls Input */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Controls (Format: Key:Action per line)
                </label>
                <textarea
                  value={controlsInput}
                  onChange={(e) => setControlsInput(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-1.5 text-xs bg-white/[0.04] border border-white/[0.08] rounded-xl text-slate-200 font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Card Theme Accent
                </label>
                <div className="grid grid-cols-4 gap-2 pt-1">
                  {[
                    { id: 'blue', label: 'Sapphire', color: 'bg-blue-600' },
                    { id: 'emerald', label: 'Emerald', color: 'bg-emerald-600' },
                    { id: 'amber', label: 'Amber', color: 'bg-amber-600' },
                    { id: 'slate', label: 'Steel', color: 'bg-slate-600' },
                  ].map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setAccentTheme(t.id)}
                      className={`p-2 rounded-xl border text-[11px] font-medium flex flex-col items-center gap-1 cursor-pointer transition-all ${
                        accentTheme === t.id
                          ? 'border-blue-400 bg-blue-950/40 text-white'
                          : 'border-white/[0.06] bg-white/[0.02] text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span className={`w-3.5 h-3.5 rounded-full ${t.color}`} />
                      <span>{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Code Tabs (Editor, Upload File, Templates) */}
          <div className="p-5 rounded-2xl glass-panel border border-white/[0.08] space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('editor')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors cursor-pointer ${
                    activeTab === 'editor'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  HTML5 Code Sandbox
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('file')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors cursor-pointer ${
                    activeTab === 'file'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Upload File
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('templates')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors cursor-pointer ${
                    activeTab === 'templates'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Templates
                </button>
              </div>

              <span className="text-[11px] font-mono text-slate-400">
                {gameCode.length} characters
              </span>
            </div>

            {/* TAB: CODE EDITOR */}
            {activeTab === 'editor' && (
              <div className="space-y-2">
                <textarea
                  value={gameCode}
                  onChange={(e) => {
                    setGameCode(e.target.value);
                  }}
                  rows={14}
                  className="w-full p-4 text-xs font-mono bg-[#070a14] border border-white/[0.08] rounded-xl text-slate-300 focus:outline-none focus:border-blue-500 leading-relaxed resize-y"
                  placeholder="Paste raw HTML5 game code or single-file game bundle here..."
                />
              </div>
            )}

            {/* TAB: FILE DROP */}
            {activeTab === 'file' && (
              <div 
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                className={`p-8 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-center space-y-3 transition-colors ${
                  dragOver ? 'border-blue-400 bg-blue-950/20' : 'border-white/15 bg-white/[0.02]'
                }`}
              >
                <Upload className="w-8 h-8 text-blue-400" />
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-white">
                    Drag and drop your HTML game file here
                  </p>
                  <p className="text-xs text-slate-400">
                    Supports .html, .js, or single-file web game bundles
                  </p>
                </div>
                <label className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl cursor-pointer">
                  Browse File
                  <input
                    type="file"
                    accept=".html,.htm,.txt,.js"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileUpload(e.target.files[0]);
                      }
                    }}
                  />
                </label>
              </div>
            )}

            {/* TAB: STARTER TEMPLATES */}
            {activeTab === 'templates' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {GAME_TEMPLATES.map(tmpl => (
                  <div 
                    key={tmpl.id}
                    onClick={() => handleSelectTemplate(tmpl.id)}
                    className="p-4 rounded-xl border border-white/[0.08] hover:border-blue-500/40 bg-white/[0.02] hover:bg-white/[0.06] transition-all cursor-pointer space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{tmpl.name}</span>
                      <span className="text-[10px] font-mono text-blue-400">{tmpl.genre}</span>
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-2">
                      {tmpl.description}
                    </p>
                    <div className="text-[11px] text-blue-400 font-semibold pt-1">
                      Load this template →
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right 5 Columns: Live Sandbox Simulator */}
        <div className="lg:col-span-5 space-y-4">
          <div className="sticky top-20 rounded-2xl glass-panel border border-white/[0.08] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Play className="w-4 h-4 text-blue-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  Live Sandbox Preview
                </h3>
              </div>
              <button
                onClick={() => setPreviewKey(k => k + 1)}
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-mono cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Reload</span>
              </button>
            </div>

            {/* Live iframe */}
            <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-black border border-white/10 shadow-lg">
              <iframe
                key={previewKey}
                srcDoc={gameCode}
                title="Sandbox Preview"
                sandbox="allow-scripts allow-modals allow-same-origin allow-pointer-lock"
                className="w-full h-full border-0 block"
              />
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              Test gameplay, canvas sizing, and sound in real time before publishing.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
