import React, { useState } from 'react';
import { 
  X, Sparkles, Plus, Edit3, Trash2, Play, CheckCircle2, 
  Upload, ImageIcon, Code2, Sliders, ArrowLeft, Save, AlertCircle, ExternalLink
} from 'lucide-react';
import { Game, GameGenre } from '../types/game';
import { FrontPageCover } from './FrontPageCover';
import { updateGame, deleteGame } from '../utils/api';
import { removeMyCreatedGameId } from '../utils/myGames';

interface CreatedGamesSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  myGames: Game[];
  onPlayGame: (game: Game) => void;
  onOpenUpload: () => void;
  onGameUpdated: (game: Game) => void;
  onGameDeleted: (gameId: string) => void;
}

const GENRES: GameGenre[] = [
  'Action', 'Arcade', 'Shooter', 'Puzzle', 'Driving', 
  'Retro', 'Sports', 'Casual', '2 Player', 'Multiplayer', 'Educational'
];

export const CreatedGamesSidebar: React.FC<CreatedGamesSidebarProps> = ({
  isOpen,
  onClose,
  myGames,
  onPlayGame,
  onOpenUpload,
  onGameUpdated,
  onGameDeleted,
}) => {
  // Selected game to edit info
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);

  // Editable fields for selected game
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [genre, setGenre] = useState<GameGenre>('Action');
  const [coverImage, setCoverImage] = useState<string>('');
  const [controlsInput, setControlsInput] = useState<string>('');
  const [tagsInput, setTagsInput] = useState<string>('');
  const [version, setVersion] = useState<string>('1.0.0');
  const [gameCode, setGameCode] = useState<string>('');
  const [embedUrl, setEmbedUrl] = useState<string>('');
  
  // Save feedback state
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Handle clicking a game in the side list to edit info
  const handleSelectToEdit = (game: Game) => {
    setSelectedGame(game);
    setTitle(game.title);
    setDescription(game.description || '');
    setGenre(game.genre || 'Action');
    setCoverImage(game.coverImage || '');
    setControlsInput(
      game.controls && game.controls.length > 0
        ? game.controls.map(c => `${c.key}:${c.action}`).join('\n')
        : 'Arrow Keys:Move\nSpacebar:Action'
    );
    setTagsInput(game.tags ? game.tags.join(', ') : 'Web, Indie');
    setVersion(game.currentVersion || '1.0.0');
    setGameCode(game.code || '');
    setEmbedUrl(game.embedUrl || '');
    setSaveSuccess(false);
    setErrorMsg('');
  };

  // Handle image upload for game cover
  const handleCoverUpload = (file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setCoverImage(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle saving the edited game info
  const handleSaveInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGame) return;

    if (!title.trim()) {
      setErrorMsg('Game title cannot be empty.');
      return;
    }

    if (!coverImage || !coverImage.trim()) {
      setErrorMsg('Game front cover poster is required.');
      return;
    }

    setIsSaving(true);
    setErrorMsg('');

    try {
      const parsedControls = controlsInput
        .split('\n')
        .map(line => line.trim())
        .filter(Boolean)
        .map(line => {
          const parts = line.split(':');
          return {
            key: (parts[0] || '').trim(),
            action: (parts[1] || 'Action').trim()
          };
        });

      const parsedTags = tagsInput
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);

      const updatedPayload = {
        title: title.trim(),
        description: description.trim(),
        genre,
        coverImage: coverImage.trim(),
        controls: parsedControls.length > 0 ? parsedControls : selectedGame.controls,
        tags: parsedTags.length > 0 ? parsedTags : selectedGame.tags,
        version: version.trim() || selectedGame.currentVersion || '1.0.0',
        changelog: 'Updated game metadata and front cover in creator side mode.',
        code: gameCode || selectedGame.code,
        embedUrl: embedUrl.trim() || undefined,
      };

      const result = await updateGame(selectedGame.id, updatedPayload);
      onGameUpdated(result);
      setSelectedGame(result);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (err: any) {
      console.error('Failed to update game:', err);
      setErrorMsg(err.message || 'Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle deleting game
  const handleDelete = async (gameId: string) => {
    if (confirm('Are you sure you want to delete this game? This action cannot be undone.')) {
      try {
        await deleteGame(gameId);
        removeMyCreatedGameId(gameId);
        onGameDeleted(gameId);
        setSelectedGame(null);
      } catch (err) {
        console.error('Error deleting game:', err);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-[#090d16]/95 backdrop-blur-2xl border-l border-white/[0.1] shadow-2xl flex flex-col transition-all duration-300 animate-in slide-in-from-right font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Header */}
      <div className="h-16 px-5 border-b border-white/[0.08] flex items-center justify-between shrink-0 bg-white/[0.02]">
        <div className="flex items-center gap-2.5 min-w-0">
          {selectedGame ? (
            <button
              onClick={() => setSelectedGame(null)}
              className="p-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 hover:text-white transition-colors cursor-pointer mr-1"
              title="Back to my games list"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          ) : (
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-bold shadow-md shadow-orange-950/50">
              <Edit3 className="w-4 h-4" />
            </div>
          )}

          <div className="min-w-0">
            <h2 className="text-sm sm:text-base font-bold text-white font-['Outfit'] truncate flex items-center gap-2">
              <span>{selectedGame ? 'Edit Game Info' : 'My Created Games'}</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-500/30 font-semibold">
                {selectedGame ? selectedGame.currentVersion : `${myGames.length} Created`}
              </span>
            </h2>
            <p className="text-[11px] text-slate-400 truncate">
              {selectedGame ? 'Edit metadata, cover poster, & code' : 'Select any game below to view and edit its info'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {!selectedGame && (
            <button
              onClick={onOpenUpload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Close side panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
        {/* VIEW A: LIST OF USER'S CREATED GAMES */}
        {!selectedGame && (
          <div className="space-y-3">
            {myGames.length === 0 ? (
              <div className="p-8 text-center rounded-2xl border border-dashed border-white/[0.1] bg-white/[0.02] space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white font-['Outfit']">No Games Made Yet</h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                    You haven't uploaded or created any games yet. Use the Sandbox or upload your code file to create your first game!
                  </p>
                </div>
                <button
                  onClick={onOpenUpload}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-950 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Upload & Generate First Game</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-400 font-medium px-1">
                  <span>Click any game to view and edit its details:</span>
                  <span>{myGames.length} Total</span>
                </div>

                {myGames.map((game) => (
                  <div
                    key={game.id}
                    onClick={() => handleSelectToEdit(game)}
                    className="group relative p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] hover:border-blue-500/50 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-xl space-y-2.5"
                  >
                    <div className="flex items-center gap-3">
                      {/* Game Front Cover Thumbnail */}
                      <div className="w-20 h-14 rounded-xl overflow-hidden shrink-0 border border-white/10 bg-black/40 relative shadow-inner">
                        <FrontPageCover game={game} showHoverOverlay={false} />
                      </div>

                      {/* Info & Meta */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs sm:text-sm font-bold text-white font-['Outfit'] truncate group-hover:text-blue-300 transition-colors">
                            {game.title}
                          </h4>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-950/70 text-blue-300 border border-blue-500/20">
                            {game.genre}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400 bg-white/[0.05] px-1.5 py-0.5 rounded">
                            {game.currentVersion}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            · {game.plays || 0} plays
                          </span>
                        </div>
                      </div>

                      {/* Quick Action Icon */}
                      <div className="shrink-0 text-slate-400 group-hover:text-blue-400 transition-colors p-1.5 rounded-lg group-hover:bg-white/[0.06]">
                        <Edit3 className="w-4 h-4" />
                      </div>
                    </div>

                    {/* Bottom action row */}
                    <div className="flex items-center justify-between pt-2 border-t border-white/[0.05] text-[11px]">
                      <span className="text-slate-400 group-hover:text-slate-300">
                        Click to view & edit info →
                      </span>
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => onPlayGame(game)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-500/30 font-semibold cursor-pointer"
                        >
                          <Play className="w-3 h-3 fill-emerald-400" />
                          <span>Play</span>
                        </button>
                        <button
                          onClick={() => handleSelectToEdit(game)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold cursor-pointer"
                        >
                          <span>Edit</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* VIEW B: EDIT GAME INFO INSPECTOR */}
        {selectedGame && (
          <form onSubmit={handleSaveInfo} className="space-y-4">
            {/* Status alerts */}
            {saveSuccess && (
              <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-500/40 text-xs text-emerald-300 flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-semibold">Game info updated and saved successfully!</span>
              </div>
            )}

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-500/40 text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Field 1: Front Cover Poster */}
            <div className="space-y-2 p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.08]">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-blue-400" />
                  <span>Front Cover Poster</span>
                  <span className="text-[10px] text-amber-300 bg-amber-950/80 px-1.5 py-0.2 rounded border border-amber-500/30">
                    REQUIRED
                  </span>
                </label>
              </div>

              {/* Cover Preview */}
              <div className="aspect-[16/10] w-full rounded-xl overflow-hidden border border-white/[0.12] bg-black/50 relative shadow-md">
                {coverImage ? (
                  <img
                    src={coverImage}
                    alt={title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-1.5 p-4 text-center">
                    <ImageIcon className="w-6 h-6 text-slate-600" />
                    <span className="text-xs">No cover image uploaded</span>
                  </div>
                )}
              </div>

              {/* Change/Upload Cover Controls */}
              <div className="flex items-center gap-2 pt-1">
                <label className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600/80 hover:bg-blue-600 text-white text-xs font-semibold cursor-pointer transition-colors border border-blue-500/40">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload New Poster File</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => e.target.files && handleCoverUpload(e.target.files[0])}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Or Paste URL */}
              <input
                type="url"
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                placeholder="Or paste image URL (https://...)"
                className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/[0.08] text-slate-200 text-xs font-mono focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Field 2: Game Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Game Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Astro Blaster"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.1] text-white text-sm font-semibold focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            {/* Field 3: Genre & Version */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Genre
                </label>
                <select
                  value={genre}
                  onChange={(e) => setGenre(e.target.value as GameGenre)}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#0e1422] border border-white/[0.1] text-white text-xs focus:outline-none focus:border-blue-500"
                >
                  {GENRES.map(g => (
                    <option key={g} value={g} className="bg-slate-900 text-white">
                      {g}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Version
                </label>
                <input
                  type="text"
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  placeholder="1.0.0"
                  className="w-full px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.1] text-white text-xs font-mono focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Field 4: Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Describe your game gameplay and rules..."
                className="w-full p-3 rounded-xl bg-white/[0.04] border border-white/[0.1] text-slate-200 text-xs focus:outline-none focus:border-blue-500 resize-none leading-relaxed"
              />
            </div>

            {/* Field 5: Controls Mapping */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                <span>Key Controls (Key:Action)</span>
                <span className="text-[10px] text-slate-400 font-normal">One per line</span>
              </label>
              <textarea
                value={controlsInput}
                onChange={(e) => setControlsInput(e.target.value)}
                rows={3}
                placeholder="W/A/S/D:Move&#10;Space:Jump&#10;Mouse:Aim & Shoot"
                className="w-full p-3 rounded-xl bg-white/[0.04] border border-white/[0.1] font-mono text-xs text-slate-200 focus:outline-none focus:border-blue-500 resize-none"
              />
            </div>

            {/* Field 6: Tags */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Tags (comma separated)
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="Action, 2D, Retro, Space"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.1] text-white text-xs focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Field 7: Game Code / Sandbox HTML */}
            <div className="space-y-1.5 p-3 rounded-xl bg-white/[0.02] border border-white/[0.08]">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Code2 className="w-3.5 h-3.5" />
                  <span>Sandbox Code / Embed</span>
                </label>
                <label className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold cursor-pointer">
                  <span>Upload Code File</span>
                  <input
                    type="file"
                    accept=".html,.htm,.js,.txt"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          if (ev.target?.result) {
                            setGameCode(ev.target.result as string);
                          }
                        };
                        reader.readAsText(e.target.files[0]);
                      }
                    }}
                    className="hidden"
                  />
                </label>
              </div>

              <textarea
                value={gameCode}
                onChange={(e) => setGameCode(e.target.value)}
                rows={5}
                placeholder="<!DOCTYPE html><html><body>...</body></html>"
                className="w-full p-2.5 font-mono text-[11px] bg-black/60 border border-white/[0.1] rounded-xl text-slate-300 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Primary Action Buttons */}
            <div className="pt-2 space-y-2">
              <button
                type="submit"
                disabled={isSaving}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.99] text-white font-bold text-xs shadow-lg shadow-blue-950 transition-all cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Saving Changes...' : 'Save Game Changes'}</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onPlayGame(selectedGame)}
                  className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition-all cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-emerald-400" />
                  <span>Play In Arcade</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDelete(selectedGame.id)}
                  className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-500/30 text-xs font-semibold transition-all cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Game</span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
