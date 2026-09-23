import React, { useState } from 'react';
import { 
  Upload, Code2, Play, Sparkles, FileText, CheckCircle2, 
  ArrowLeft, RefreshCw, Layers, AlertCircle, Globe, Link as LinkIcon, 
  HelpCircle, ExternalLink, Sliders, ChevronDown, ChevronUp
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

  // Method Selection: 'link' (Default) | 'file' | 'code'
  const [method, setMethod] = useState<'link' | 'file' | 'code'>(() => {
    if (initialGameToUpdate?.embedUrl) return 'link';
    if (initialGameToUpdate && !initialGameToUpdate.embedUrl) return 'code';
    return 'link';
  });

  // Core Form State
  const [title, setTitle] = useState<string>(initialGameToUpdate?.title || '');
  const [description, setDescription] = useState<string>(initialGameToUpdate?.description || '');
  const [gameLink, setGameLink] = useState<string>(initialGameToUpdate?.embedUrl || '');
  const [genre, setGenre] = useState<GameGenre>(initialGameToUpdate?.genre || 'Action');
  const [author, setAuthor] = useState<string>(initialGameToUpdate?.author || '');
  const [version, setVersion] = useState<string>(
    initialGameToUpdate 
      ? `1.${initialGameToUpdate.versions.length}.0`
      : '1.0.0'
  );
  const [changelog, setChangelog] = useState<string>('');
  const [tagsInput, setTagsInput] = useState<string>(
    initialGameToUpdate?.tags.join(', ') || 'Web, Indie, HTML5'
  );
  const [controlsInput, setControlsInput] = useState<string>(
    initialGameToUpdate?.controls.map(c => `${c.key}:${c.action}`).join('\n') || 
    'Mouse / Arrow Keys:Move & Aim\nSpace / Left Click:Action'
  );
  const [accentTheme, setAccentTheme] = useState<string>('blue');
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  // Code / File state for secondary modes
  const [gameCode, setGameCode] = useState<string>(
    initialGameToUpdate?.code || GAME_TEMPLATES[0].code
  );
  const [previewKey, setPreviewKey] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [dragOver, setDragOver] = useState<boolean>(false);
  const [linkTested, setLinkTested] = useState<boolean>(false);

  // Helper to extract clean URL if user pastes an iframe snippet or raw URL
  const cleanUrl = (input: string): string => {
    let raw = input.trim();
    if (!raw) return '';
    
    // If iframe snippet: <iframe ... src="https://..." ...>
    const iframeMatch = raw.match(/src=["']([^"']+)["']/i);
    if (iframeMatch && iframeMatch[1]) {
      raw = iframeMatch[1].trim();
    }

    // Add https:// if protocol is missing
    if (!raw.startsWith('http://') && !raw.startsWith('https://') && !raw.startsWith('//')) {
      raw = 'https://' + raw;
    }

    return raw;
  };

  const handleLinkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = cleanUrl(e.target.value);
    setGameLink(cleaned);
    setLinkTested(false);
  };

  // Sample playable web games for quick test
  const sampleLinks = [
    { name: 'Itch.io HTML5 Embed', url: 'https://v6p9d9t4.ssl.hwcdn.net/html/10129759/index.html' },
    { name: 'Canvas Asteroids', url: 'https://dougmcinnes.com/html-5-asteroids/' },
    { name: '2048 Web Game', url: 'https://play2048.co/' }
  ];

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

  // Publish / Upload game
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      alert('Please enter a name for your game.');
      return;
    }

    if (method === 'link' && !gameLink.trim()) {
      alert('Please provide a valid game link or URL.');
      return;
    }

    if (method !== 'link' && !gameCode.trim()) {
      alert('Please upload an HTML file or write game code.');
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

    const effectiveEmbedUrl = method === 'link' ? cleanUrl(gameLink) : undefined;
    const effectiveCode = effectiveEmbedUrl 
      ? `<iframe src="${effectiveEmbedUrl}" style="width:100%;height:100%;border:none;" allow="autoplay; fullscreen; gamepad" allowfullscreen></iframe>`
      : gameCode;

    try {
      if (isUpdating && initialGameToUpdate) {
        const updated = await updateGame(initialGameToUpdate.id, {
          title: title.trim(),
          description: description.trim() || 'A community web game.',
          genre,
          tags: parsedTags,
          version,
          changelog: changelog || 'Updated version uploaded.',
          code: effectiveCode,
          embedUrl: effectiveEmbedUrl,
          type: effectiveEmbedUrl ? 'embed' : 'html5',
          author: author.trim() || initialGameToUpdate.author,
          controls: parsedControls.length > 0 ? parsedControls : initialGameToUpdate.controls,
        });
        onGameSaved(updated);
      } else {
        const created = await createGame({
          title: title.trim(),
          description: description.trim() || 'A community-crafted web game.',
          genre,
          tags: parsedTags.length > 0 ? parsedTags : ['Indie', 'Web'],
          author: author.trim() || 'Sphere Creator',
          version: version || '1.0.0',
          changelog: changelog || 'Initial public release.',
          code: effectiveCode,
          embedUrl: effectiveEmbedUrl,
          type: effectiveEmbedUrl ? 'embed' : 'html5',
          thumbnailGradient: getGradientForTheme(accentTheme),
          accentColor: getAccentColor(accentTheme),
          iconName: genre === 'Shooter' ? 'Rocket' : genre === 'Retro' ? 'Zap' : 'Gamepad2',
          controls: parsedControls.length > 0 ? parsedControls : [{ key: 'Mouse & Keys', action: 'Standard Game Controls' }],
        });
        onGameSaved(created);
      }
    } catch (err) {
      console.error('Failed to save game', err);
      alert('Failed to upload game. Please check your inputs and try again.');
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
              <Globe className="w-5 h-5 text-blue-400" />
              <span>{isUpdating ? `Update Game: ${initialGameToUpdate?.title}` : 'Upload & Publish Game'}</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Add your game's name, description, and link so everyone in the community can play it!
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white/[0.04] hover:bg-white/[0.08] text-xs font-semibold text-slate-300 hover:text-white border border-white/[0.06] rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !title.trim() || (method === 'link' && !gameLink.trim())}
            className="px-6 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-md shadow-blue-950 disabled:opacity-50 transition-all flex items-center gap-2 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>{isUpdating ? 'Publish Update' : 'Publish & Play Now'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Upload Method Switcher */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] w-fit">
        <button
          type="button"
          onClick={() => setMethod('link')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            method === 'link'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          <LinkIcon className="w-3.5 h-3.5" />
          <span>Game Link (URL)</span>
          <span className="text-[10px] bg-blue-950 px-1.5 py-0.2 rounded border border-blue-400/30">Recommended</span>
        </button>

        <button
          type="button"
          onClick={() => setMethod('file')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            method === 'file'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Upload HTML5 File</span>
        </button>

        <button
          type="button"
          onClick={() => setMethod('code')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            method === 'code'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          <Code2 className="w-3.5 h-3.5" />
          <span>Code Sandbox</span>
        </button>
      </div>

      {/* Main Form & Preview Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form Inputs (7 Cols) */}
        <div className="lg:col-span-7 space-y-5">
          <div className="p-6 rounded-2xl glass-panel border border-white/[0.08] space-y-5">
            {/* Primary Field 1: Game Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <span>Game Name</span>
                <span className="text-blue-400">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Astro Odyssey, Gravity Ball 3D, Cyber Dash..."
                className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] focus:border-blue-500 focus:bg-white/[0.07] text-white text-sm focus:outline-none transition-all"
                required
              />
            </div>

            {/* Primary Field 2: Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <span>Game Description</span>
                <span className="text-blue-400">*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your game: objective, gameplay, controls, and what makes it fun..."
                rows={3}
                className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] focus:border-blue-500 focus:bg-white/[0.07] text-white text-xs focus:outline-none transition-all leading-relaxed"
                required
              />
            </div>

            {/* Primary Field 3: Link to your game (Method: LINK) */}
            {method === 'link' && (
              <div className="space-y-2 p-4 rounded-xl bg-blue-950/20 border border-blue-500/20">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-blue-400" />
                    <span>Link to Your Game (URL)</span>
                    <span className="text-blue-400">*</span>
                  </label>
                  <span className="text-[11px] text-slate-400">Embed or direct web URL</span>
                </div>

                <div className="relative">
                  <input
                    type="url"
                    value={gameLink}
                    onChange={handleLinkChange}
                    placeholder="https://example.com/game or https://itch.io/embed/..."
                    className="w-full pl-9 pr-24 py-2.5 rounded-xl bg-black/40 border border-white/[0.12] focus:border-blue-500 text-white text-xs font-mono focus:outline-none transition-all"
                  />
                  <LinkIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  
                  {gameLink && (
                    <button
                      type="button"
                      onClick={() => setPreviewKey(prev => prev + 1)}
                      className="absolute right-2 top-1.5 px-2.5 py-1 text-[11px] font-semibold bg-blue-600/80 hover:bg-blue-600 text-white rounded-lg transition-colors cursor-pointer"
                    >
                      Test Link
                    </button>
                  )}
                </div>

                <div className="text-[11px] text-slate-400 space-y-1 pt-1">
                  <p>
                    Paste any link to your playable web game (Itch.io, GitHub Pages, Vercel, Netlify, Poki, or direct HTML5 game link).
                  </p>
                  
                  {/* Quick test examples */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="text-slate-400">Try sample link:</span>
                    {sampleLinks.map((s) => (
                      <button
                        key={s.name}
                        type="button"
                        onClick={() => {
                          setGameLink(s.url);
                          if (!title) setTitle(s.name);
                          if (!description) setDescription('Free online web game.');
                          setPreviewKey(prev => prev + 1);
                        }}
                        className="text-[10px] text-blue-400 hover:text-blue-300 bg-blue-950/60 px-2 py-0.5 rounded border border-blue-500/30 cursor-pointer"
                      >
                        {s.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Method: FILE UPLOAD */}
            {method === 'file' && (
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                className={`p-8 border-2 border-dashed rounded-2xl text-center space-y-3 transition-colors ${
                  dragOver 
                    ? 'border-blue-500 bg-blue-950/30' 
                    : 'border-white/[0.12] bg-white/[0.02] hover:border-white/[0.2]'
                }`}
              >
                <Upload className="w-8 h-8 text-blue-400 mx-auto" />
                <div>
                  <p className="text-sm font-semibold text-white">Drag & drop your game HTML file here</p>
                  <p className="text-xs text-slate-400 mt-0.5">Supports standalone HTML5 games with embedded scripts or canvas</p>
                </div>
                <div>
                  <label className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow cursor-pointer transition-colors">
                    <span>Browse File</span>
                    <input
                      type="file"
                      accept=".html,.htm"
                      onChange={(e) => e.target.files && handleFileUpload(e.target.files[0])}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            )}

            {/* Method: CODE SANDBOX */}
            {method === 'code' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    HTML5 Game Code
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-slate-400">Load template:</span>
                    {GAME_TEMPLATES.map(t => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => handleSelectTemplate(t.id)}
                        className="text-[10px] text-slate-300 hover:text-white bg-white/[0.06] hover:bg-white/[0.12] px-2 py-0.5 rounded border border-white/10 transition-colors cursor-pointer"
                      >
                        {t.name}
                      </button>
                    ))}
                  </div>
                </div>

                <textarea
                  value={gameCode}
                  onChange={(e) => {
                    setGameCode(e.target.value);
                    setPreviewKey(prev => prev + 1);
                  }}
                  rows={9}
                  className="w-full p-3 font-mono text-xs bg-slate-950/80 border border-white/[0.08] rounded-xl text-slate-200 focus:outline-none focus:border-blue-500 leading-relaxed"
                  placeholder="<!DOCTYPE html><html><body><canvas id='gameCanvas'></canvas>...</body></html>"
                />
              </div>
            )}

            {/* Collapsible Metadata Section */}
            <div className="border-t border-white/[0.08] pt-4">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full flex items-center justify-between text-xs font-semibold text-slate-300 hover:text-white py-1 cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Sliders className="w-3.5 h-3.5 text-blue-400" />
                  <span>Category, Creator & Release Details</span>
                </div>
                {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showAdvanced && (
                <div className="mt-4 space-y-4 pt-3 border-t border-white/[0.04]">
                  {/* Genre & Author */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-400">Category / Genre</label>
                      <select
                        value={genre}
                        onChange={(e) => setGenre(e.target.value as GameGenre)}
                        className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-xs focus:outline-none focus:border-blue-500 cursor-pointer"
                      >
                        <option value="Action" className="bg-slate-900">Action</option>
                        <option value="Arcade" className="bg-slate-900">Arcade</option>
                        <option value="Shooter" className="bg-slate-900">Shooter</option>
                        <option value="Puzzle" className="bg-slate-900">Puzzle</option>
                        <option value="2 Player" className="bg-slate-900">2 Player</option>
                        <option value="Driving" className="bg-slate-900">Driving</option>
                        <option value="Sports" className="bg-slate-900">Sports</option>
                        <option value="Casual" className="bg-slate-900">Casual</option>
                        <option value="Retro" className="bg-slate-900">Retro</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-400">Creator / Developer Name</label>
                      <input
                        type="text"
                        value={author}
                        onChange={(e) => setAuthor(e.target.value)}
                        placeholder="Your Studio or Username"
                        className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-xs focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* Version & Changelog */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-400">Version</label>
                      <input
                        type="text"
                        value={version}
                        onChange={(e) => setVersion(e.target.value)}
                        placeholder="1.0.0"
                        className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-xs font-mono focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="sm:col-span-2 space-y-1">
                      <label className="text-xs font-medium text-slate-400">Release Notes / Changelog</label>
                      <input
                        type="text"
                        value={changelog}
                        onChange={(e) => setChangelog(e.target.value)}
                        placeholder="What's new in this version?"
                        className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-xs focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* Controls Instructions */}
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-400">Controls (One per line: Key:Action)</label>
                    <textarea
                      value={controlsInput}
                      onChange={(e) => setControlsInput(e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-xs font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Theme Accent Color */}
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-400">Accent Style (No Neon)</label>
                    <div className="flex items-center gap-3">
                      {[
                        { id: 'blue', name: 'Royal Blue', color: 'bg-blue-600' },
                        { id: 'emerald', name: 'Emerald', color: 'bg-emerald-600' },
                        { id: 'amber', name: 'Warm Amber', color: 'bg-amber-600' },
                        { id: 'slate', name: 'Monochrome Slate', color: 'bg-slate-600' },
                      ].map((th) => (
                        <button
                          key={th.id}
                          type="button"
                          onClick={() => setAccentTheme(th.id)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs cursor-pointer transition-all ${
                            accentTheme === th.id
                              ? 'border-white/40 bg-white/[0.1] text-white font-semibold'
                              : 'border-white/[0.06] text-slate-400 hover:text-white'
                          }`}
                        >
                          <span className={`w-2.5 h-2.5 rounded-full ${th.color}`} />
                          <span>{th.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Live Playable Preview (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-2xl glass-panel border border-white/[0.08] space-y-4 sticky top-24">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Play className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white font-['Outfit']">
                  Live Game Preview
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewKey(prev => prev + 1)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
                title="Reload preview"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Preview Frame */}
            <div className="relative aspect-[16/10] w-full rounded-xl overflow-hidden bg-black border border-white/[0.08] shadow-inner flex items-center justify-center">
              {method === 'link' && gameLink.trim() ? (
                <iframe
                  key={previewKey + '-' + gameLink}
                  src={cleanUrl(gameLink)}
                  title="Game Link Preview"
                  sandbox="allow-scripts allow-modals allow-same-origin allow-pointer-lock allow-forms allow-popups allow-fullscreen allow-orientation-lock allow-presentation"
                  className="w-full h-full border-0 block bg-black"
                  allow="autoplay; fullscreen; gamepad"
                />
              ) : method !== 'link' && gameCode.trim() ? (
                <iframe
                  key={previewKey}
                  srcDoc={gameCode}
                  title="Code Preview"
                  sandbox="allow-scripts allow-modals allow-same-origin allow-pointer-lock"
                  className="w-full h-full border-0 block bg-black"
                  allow="autoplay; fullscreen; gamepad"
                />
              ) : (
                <div className="text-center p-6 space-y-2">
                  <Globe className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-xs text-slate-400">
                    {method === 'link'
                      ? 'Enter your game link to test and preview the live game.'
                      : 'Upload an HTML file or write code to see the preview here.'}
                  </p>
                </div>
              )}
            </div>

            {/* Preview Information Card */}
            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-sm truncate">
                  {title.trim() || 'Untitled Game'}
                </span>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/20">
                  v{version || '1.0.0'}
                </span>
              </div>
              <p className="text-slate-400 text-[11px] line-clamp-2">
                {description.trim() || 'No description provided yet.'}
              </p>
              <div className="flex items-center justify-between pt-1 text-[10px] text-slate-400">
                <span>Genre: <strong className="text-slate-300">{genre}</strong></span>
                <span>By: <strong className="text-slate-300">{author.trim() || 'Sphere Creator'}</strong></span>
              </div>
            </div>

            {/* Publish CTA Button */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || !title.trim() || (method === 'link' && !gameLink.trim())}
              className="w-full py-3 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-lg shadow-blue-950 disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isUpdating ? 'Publish Update to Arcade' : 'Publish Game & Play Now'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
