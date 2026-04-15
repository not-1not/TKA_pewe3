import React, { useState, useEffect } from 'react';
import { AdminLayout } from './Dashboard';
import { api, ExamToken, Materi } from '../../lib/db';
import { Plus, Trash2, KeyRound, Copy, CheckSquare, Square, Zap, ZapOff, BookOpen, Layers, Eye, EyeOff, Edit3, Check, X, Save, Book } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';

const Tokens = () => {
  const [tokens, setTokens] = useState<ExamToken[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);
  const [duration, setDuration] = useState(60);
  const [qCount, setQCount] = useState(25);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [availablePackages, setAvailablePackages] = useState<string[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<string>('All');
  const [availableMateri, setAvailableMateri] = useState<Materi[]>([]);
  const [selectedMateriId, setSelectedMateriId] = useState<string>('');
  
  // Pengaturan baru:
  const [allowedSubjects, setAllowedSubjects] = useState<string[]>([]);
  const [allowedPackages, setAllowedPackages] = useState<string[]>([]);
  const [randQs, setRandQs] = useState(true);
  const [randOpts, setRandOpts] = useState(true);
  
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [allTokens, allQuestions, materiList] = await Promise.all([
        api.getTokens(),
        api.getQuestions(),
        api.getMateriList()
      ]);
      
      const tokensWithMateri = (allTokens as any[]).map(t => ({
        ...t,
        materiName: materiList.find(m => m.id === t.materi_id)?.name || ''
      }));

      setTokens(tokensWithMateri);
      setAvailableMateri(materiList);
      const subjects = Array.from(new Set(allQuestions.map(q => q.subject).filter(Boolean))) as string[];
      setAvailableSubjects(subjects);
      const packs = Array.from(new Set(allQuestions.map(q => q.package).filter(Boolean))) as string[];
      setAvailablePackages(['All', ...packs]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const generateTokenStr = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; 
    let res = '';
    for(let i=0; i<6; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return res;
  };

  const handleCreateTokens = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedSubjects.length === 0) {
      alert("Please select at least one subject.");
      return;
    }

    setIsLoading(true);
    try {
        const allQuestions = await api.getQuestions();
        const newTokens: ExamToken[] = [];
        
        selectedSubjects.forEach(subject => {
          const subjectQs = allQuestions.filter(q => 
            (q.subject === subject || subject === 'All') && 
            (selectedPackage === 'All' || q.package === selectedPackage) &&
            (!selectedMateriId || q.materi_id === selectedMateriId)
          );

          newTokens.push({
            id: 'TOK-' + Date.now() + Math.random().toString(36).substring(2, 5),
            token: generateTokenStr(),
            durationMinutes: duration,
            questionCount: Math.min(qCount, subjectQs.length || qCount),
            subject: subject,
            package: selectedPackage === 'All' ? '' : selectedPackage,
            active: true,
            randomizeQuestions: randQs,
            randomizeOptions: randOpts,
            allowed_subjects: allowedSubjects.length > 0 ? allowedSubjects : undefined,
            allowed_packages: allowedPackages.length > 0 ? allowedPackages : undefined,
            materi_id: selectedMateriId || undefined
          });
        });

        if (newTokens.length === 0) return;

        const currentTokens = await api.getTokens();
        const updated = [...currentTokens, ...newTokens];
        await api.setTokens(updated);
        await fetchData();
        setSelectedSubjects([]);
        setAllowedSubjects([]);
        setAllowedPackages([]);
        setSelectedMateriId('');
        alert(`Successfully generated ${newTokens.length} tokens.`);
    } catch (err: any) {
        console.error("Token creation error:", err);
        alert("Failed to create tokens: " + (err.message || String(err)));
    } finally {
        setIsLoading(false);
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    setIsLoading(true);
    try {
        const currentBatch = await api.getTokens();
        const all = currentBatch.map(tok => {
          if (tok.id === id) return { ...tok, active: !currentStatus };
          return tok;
        });
        await api.setTokens(all);
        await fetchData();
    } catch (err: any) {
        console.error("Toggle token error:", err);
        alert("Failed to toggle token: " + (err.message || String(err)));
    } finally {
        setIsLoading(false);
    }
  };

  const handleToggleResultsVisible = async (id: string, currentStatus: boolean | undefined) => {
    setIsLoading(true);
    try {
        const currentBatch = await api.getTokens();
        const all = currentBatch.map(tok => {
          if (tok.id === id) return { ...tok, resultsVisible: !currentStatus };
          return tok;
        });
        await api.setTokens(all);
        await fetchData();
    } catch (err: any) {
        console.error("Toggle results visibility error:", err);
        alert("Failed to toggle results visibility: " + (err.message || String(err)));
    } finally {
        setIsLoading(false);
    }
  };

  const handleBatchToggle = async (activate: boolean) => {
    if (selectedIds.length === 0) return;
    setIsLoading(true);
    try {
        const currentBatch = await api.getTokens();
        const all = currentBatch.map(tok => {
          if (selectedIds.includes(tok.id)) return { ...tok, active: activate };
          return tok;
        });
        await api.setTokens(all);
        await fetchData();
        setSelectedIds([]);
    } catch (err: any) {
        console.error("Batch toggle error:", err);
        alert("Failed to update tokens: " + (err.message || String(err)));
    } finally {
        setIsLoading(false);
    }
  };

  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) return;
    
    const activeSelected = tokens.filter(t => selectedIds.includes(t.id) && t.active);
    if (activeSelected.length > 0) {
      alert(`Cannot delete tokens while they are still active. Please deactivate the following tokens first: ${activeSelected.map(t => t.token).join(', ')}`);
      return;
    }

    if (confirm(`Delete ${selectedIds.length} selected tokens?`)) {
      setIsLoading(true);
      try {
          const remaining = tokens.filter(t => !selectedIds.includes(t.id));
          await api.setTokens(remaining);
          await fetchData();
          setSelectedIds([]);
      } catch (err: any) {
          console.error("Batch delete error:", err);
          alert("Failed to delete tokens: " + (err.message || String(err)));
      } finally {
          setIsLoading(false);
      }
    }
  };

  const handleDeleteToken = async (token: ExamToken) => {
    if (token.active) {
      alert("Cannot delete an active token. Please stop/deactivate it first.");
      return;
    }

    if (confirm(`Are you sure you want to delete token "${token.token}"?`)) {
      setIsLoading(true);
      try {
        const remaining = tokens.filter(t => t.id !== token.id);
        await api.setTokens(remaining);
        await fetchData();
      } catch (err: any) {
        console.error("Delete token error:", err);
        alert("Failed to delete token: " + (err.message || String(err)));
      } finally {
        setIsLoading(false);
      }
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === tokens.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(tokens.map(t => t.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSubject = (subj: string) => {
    setSelectedSubjects(prev => 
      prev.includes(subj) ? prev.filter(s => s !== subj) : [...prev, subj]
    );
  };

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingToken, setEditingToken] = useState<ExamToken | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const handleCopy = (id: string, t: string) => {
    navigator.clipboard.writeText(t);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleEditToken = (token: ExamToken) => {
    setEditingToken({ ...token });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingToken) return;
    setIsLoading(true);
    try {
      const currentBatch = await api.getTokens();
      const updated = currentBatch.map(tok =>
        tok.id === editingToken.id ? editingToken : tok
      );
      await api.setTokens(updated);
      await fetchData();
      setShowEditModal(false);
      setEditingToken(null);
    } catch (err: any) {
      alert('Failed to update token: ' + (err.message || String(err)));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="flex border-b-2 border-border pb-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-text-main flex items-center gap-3">
            <KeyRound className="text-warning" /> Multi-Token Manager
          </h1>
          <p className="text-sm text-text-muted font-bold mt-1">Generate tokens for multiple subjects at once</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <div className="card bg-surface sticky top-8 border-2 border-primary/30 p-6 shadow-xl">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Layers className="text-primary" /> Multi-Generation
            </h2>
            
            <form onSubmit={handleCreateTokens} className="space-y-6">
                            <div className="space-y-3">
                              <label className="input-label font-black text-xs uppercase tracking-widest text-primary">3. Allowed Subjects (Tombol di Login Siswa)</label>
                              <div className="space-y-2 max-h-[120px] overflow-y-auto pr-2 border-b border-border pb-2">
                                {availableSubjects.length > 0 ? (
                                  availableSubjects.map(s => (
                                    <button 
                                      key={s} type="button" 
                                      onClick={() => setAllowedSubjects(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])}
                                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg border-2 transition-all ${
                                        allowedSubjects.includes(s) 
                                        ? 'border-primary bg-primary text-white font-bold' 
                                        : 'border-border bg-background text-text-muted hover:border-primary/50'
                                      }`}
                                    >
                                      {allowedSubjects.includes(s) ? <CheckSquare size={16} /> : <BookOpen size={16} />}
                                      <span className="text-sm truncate">{s}</span>
                                    </button>
                                  ))
                                ) : (
                                  <div className="text-xs text-danger font-bold bg-danger/5 p-3 rounded-lg border border-dashed border-danger/30">
                                    Please add questions to the Question Bank first.
                                  </div>
                                )}
                              </div>
                              <div className="flex gap-2">
                                <button 
                                  type="button" onClick={() => setAllowedSubjects(availableSubjects)}
                                  className="text-[10px] font-black uppercase text-primary hover:underline"
                                >Select All</button>
                                <button 
                                  type="button" onClick={() => setAllowedSubjects([])}
                                  className="text-[10px] font-black uppercase text-text-muted hover:underline ml-auto"
                                >Clear</button>
                              </div>
                            </div>

                            <div className="space-y-3">
                              <label className="input-label font-black text-xs uppercase tracking-widest text-secondary">4. Allowed Packages (Tombol di Login Siswa)</label>
                              <div className="space-y-2 max-h-[120px] overflow-y-auto pr-2 border-b border-border pb-2">
                                {availablePackages.length > 0 ? (
                                  availablePackages.filter(p => p !== 'All').map(p => (
                                    <button 
                                      key={p} type="button" 
                                      onClick={() => setAllowedPackages(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])}
                                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg border-2 transition-all ${
                                        allowedPackages.includes(p) 
                                        ? 'border-secondary bg-secondary text-white font-bold' 
                                        : 'border-border bg-background text-text-muted hover:border-secondary/50'
                                      }`}
                                    >
                                      {allowedPackages.includes(p) ? <CheckSquare size={16} /> : <Layers size={16} />}
                                      <span className="text-sm truncate">{p}</span>
                                    </button>
                                  ))
                                ) : (
                                  <div className="text-xs text-danger font-bold bg-danger/5 p-3 rounded-lg border border-dashed border-danger/30">
                                    Please add questions to the Question Bank first.
                                  </div>
                                )}
                              </div>
                              <div className="flex gap-2">
                                <button 
                                  type="button" onClick={() => setAllowedPackages(availablePackages.filter(p => p !== 'All'))}
                                  className="text-[10px] font-black uppercase text-secondary hover:underline"
                                >Select All</button>
                                <button 
                                  type="button" onClick={() => setAllowedPackages([])}
                                  className="text-[10px] font-black uppercase text-text-muted hover:underline ml-auto"
                                >Clear</button>
                              </div>
                            </div>
              <div className="space-y-3">
                <label className="input-label font-black text-xs uppercase tracking-widest text-primary">1. Select Subjects</label>
                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 border-b border-border pb-2">
                  {availableSubjects.length > 0 ? (
                    availableSubjects.map(s => (
                      <button 
                        key={s} type="button" 
                        onClick={() => toggleSubject(s)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg border-2 transition-all ${
                          selectedSubjects.includes(s) 
                          ? 'border-primary bg-primary text-white font-bold' 
                          : 'border-border bg-background text-text-muted hover:border-primary/50'
                        }`}
                      >
                        {selectedSubjects.includes(s) ? <CheckSquare size={16} /> : <BookOpen size={16} />}
                        <span className="text-sm truncate">{s}</span>
                      </button>
                    ))
                  ) : (
                    <div className="text-xs text-danger font-bold bg-danger/5 p-3 rounded-lg border border-dashed border-danger/30">
                      Please add questions to the Question Bank first.
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button 
                    type="button" onClick={() => setSelectedSubjects(availableSubjects)}
                    className="text-[10px] font-black uppercase text-primary hover:underline"
                  >Select All</button>
                  <button 
                    type="button" onClick={() => setSelectedSubjects([])}
                    className="text-[10px] font-black uppercase text-text-muted hover:underline ml-auto"
                  >Clear</button>
                </div>
              </div>

              {/* Additional Filters */}
              <div className="space-y-3 pt-4 border-t border-border">
                <label className="input-label font-black text-xs uppercase tracking-widest text-secondary">2. Advanced Filtering (Optional)</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="input-group">
                    <label className="input-label text-[10px]">Package</label>
                    <select 
                      className="input-field bg-background"
                      value={selectedPackage}
                      onChange={(e) => setSelectedPackage(e.target.value)}
                      title="Select package"
                    >
                      {availablePackages.map(p => (
                        <option key={p} value={p}>{p === 'All' ? 'All Packages' : p}</option>
                      ))}
                    </select>
                  </div>

                  <div className="input-group">
                    <label className="input-label text-[10px]">Materi</label>
                    <select 
                      className="input-field bg-background"
                      value={selectedMateriId}
                      onChange={(e) => setSelectedMateriId(e.target.value)}
                      title="Select material"
                    >
                      <option value="">All Materials</option>
                      {availableMateri.map(m => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-3 mt-2">
                   <div className="flex items-center justify-between bg-background p-3 rounded-lg border border-border">
                      <span className="text-[10px] font-black uppercase text-text-muted">Urutan Soal</span>
                      <button 
                        type="button"
                        onClick={() => setRandQs(!randQs)}
                        className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase transition-all border-2 ${
                          randQs 
                          ? 'bg-secondary/10 border-secondary text-secondary' 
                          : 'bg-primary/10 border-primary text-primary'
                        }`}
                      >
                         {randQs ? 'Acak (Random)' : 'Urut Sesuai Nomor'}
                      </button>
                   </div>
                   <div className="flex items-center justify-between bg-background p-3 rounded-lg border border-border">
                      <span className="text-[10px] font-black uppercase text-text-muted">Urutan Jawaban</span>
                      <button 
                        type="button"
                        onClick={() => setRandOpts(!randOpts)}
                        className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase transition-all border-2 ${
                          randOpts 
                          ? 'bg-secondary/10 border-secondary text-secondary' 
                          : 'bg-primary/10 border-primary text-primary'
                        }`}
                      >
                         {randOpts ? 'Acak (Random)' : 'Tetap (Fix)'}
                      </button>
                   </div>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-border mt-4">
                <label className="input-label font-black text-xs uppercase tracking-widest text-secondary">3. Token Configuration</label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="input-group">
                    <label className="input-label text-[10px]">Duration (Min)</label>
                    <input 
                      type="number" min="5" max="180" step="5"
                      className="input-field text-center bg-background" 
                      value={duration}
                      onChange={(e) => setDuration(parseInt(e.target.value))}
                      title="Duration in minutes"
                      placeholder="60"
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label text-[10px]">Qs per Subject</label>
                    <input 
                      type="number" min="1" max="100"
                      className="input-field text-center bg-background" 
                      value={qCount}
                      onChange={(e) => setQCount(parseInt(e.target.value))}
                      title="Questions per subject"
                      placeholder="25"
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="btn btn-primary w-full shadow-lg py-4 flex items-center justify-center gap-2 text-lg disabled:opacity-50"
                  disabled={selectedSubjects.length === 0}
                >
                  <Zap size={20} /> Generate {selectedSubjects.length} Tokens
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-surface p-4 rounded-2xl border border-border">
             <button 
              onClick={toggleSelectAll} 
              className="btn btn-outline bg-surface text-text-main border-border text-xs flex items-center gap-2"
            >
              {selectedIds.length === tokens.length && tokens.length > 0 ? <CheckSquare size={14} /> : <Square size={14} />}
              {selectedIds.length === tokens.length && tokens.length > 0 ? 'Deselect All Tokens' : `Select All (${tokens.length})`}
            </button>

            <AnimatePresence>
               {selectedIds.length > 0 && (
                 <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1">
                    <button onClick={() => handleBatchToggle(true)} className="btn bg-secondary text-white text-[10px] px-3 py-2 flex items-center gap-1">
                      <Zap size={12} /> Activate
                    </button>
                    <button onClick={() => handleBatchToggle(false)} className="btn bg-text-muted text-white text-[10px] px-3 py-2 flex items-center gap-1">
                      <ZapOff size={12} /> Deactivate
                    </button>
                    <button onClick={handleBatchDelete} className="btn bg-danger text-white text-[10px] px-3 py-2 flex items-center gap-1">
                      <Trash2 size={12} /> Delete
                    </button>
                 </div>
               )}
            </AnimatePresence>
          </div>

          <div className="card bg-surface p-6 min-h-[400px]">
            <div className="flex justify-between items-center mb-6">
               <h2 className="text-xl font-bold">Tokens Repository</h2>
               {isLoading && <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>}
            </div>
            
            <div className="space-y-3">
              {tokens.length > 0 ? (
                tokens.sort((a,b) => (b.subject || '').localeCompare(a.subject || '')).map(t => (
                  <div 
                    key={t.id} 
                    className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                      selectedIds.includes(t.id) 
                      ? 'border-warning bg-warning/5' 
                      : (t.active ? 'border-border bg-background/50 hover:border-primary/20' : 'border-danger/10 bg-danger/5 opacity-60')
                    }`}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <button 
                        onClick={() => toggleSelect(t.id)}
                        className={`transition-colors ${selectedIds.includes(t.id) ? 'text-warning' : 'text-text-muted hover:text-primary'}`}
                      >
                        {selectedIds.includes(t.id) ? <CheckSquare size={20} /> : <Square size={20} />}
                      </button>

                      <div className="flex-1 min-w-0">
                         <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-black bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded uppercase">{t.subject || 'Mixed'}</span>
                            <span className={`text-[10px] font-black ${t.active ? 'text-secondary' : 'text-danger'} uppercase`}>
                               {t.active ? '● Active' : '○ Inactive'}
                            </span>
                         </div>
                         <div className="flex items-center gap-3">
                            <span 
                              className="font-black tracking-[0.1em] text-xl text-text-main cursor-pointer hover:text-primary transition-colors truncate"
                              onClick={() => handleCopy(t.id, t.token)}
                              title="Click to copy"
                            >
                              {t.token}
                            </span>
                            <button
                              onClick={() => handleCopy(t.id, t.token)}
                              className={`p-1 rounded transition-all ${copiedId === t.id ? 'text-secondary bg-secondary/10' : 'text-text-muted hover:text-primary hover:bg-primary/10'}`}
                              title={copiedId === t.id ? 'Copied!' : 'Copy token'}
                            >
                              {copiedId === t.id ? <Check size={14} /> : <Copy size={14} />}
                            </button>
                         </div>
                      </div>

                      <div className="text-right hidden sm:block px-6 border-l border-border">
                        <div className="text-xs font-black text-text-muted uppercase">Materi</div>
                        <div className="text-sm font-black text-text-main">{t.materiName || '-'}</div>
                      </div>

                      <div className="text-right hidden sm:block px-6 border-l border-border">
                        <div className="text-xs font-black text-text-muted uppercase">Config</div>
                        <div className="text-sm font-black text-text-main">
                          {t.durationMinutes}m / {t.questionCount}Q
                        </div>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => handleToggleActive(t.id, t.active)}
                      className={`btn text-[10px] font-black uppercase py-2 px-4 shadow-sm border-2 ${
                        t.active 
                        ? 'border-danger/20 text-danger hover:bg-danger hover:text-white' 
                        : 'border-secondary/20 text-secondary hover:bg-secondary hover:text-white'
                      }`}
                    >
                      {t.active ? 'Stop' : 'Start'}
                    </button>

                    <button 
                      onClick={() => handleToggleResultsVisible(t.id, t.resultsVisible)}
                      className={`btn text-[10px] font-black uppercase py-2 px-4 shadow-sm border-2 ${
                        t.resultsVisible !== false
                        ? 'border-secondary/20 text-secondary hover:bg-secondary hover:text-white' 
                        : 'border-warning/20 text-warning hover:bg-warning hover:text-white'
                      }`}
                      title="Toggle if students can see results"
                    >
                      {t.resultsVisible !== false ? <Eye size={14} className="inline mr-1" /> : <EyeOff size={14} className="inline mr-1" />}
                      {t.resultsVisible !== false ? 'Show' : 'Hide'}
                    </button>

                    <button 
                      onClick={() => handleEditToken(t)}
                      className="btn text-[10px] font-black uppercase py-2 px-4 shadow-sm border-2 border-primary/20 text-primary hover:bg-primary hover:text-white"
                      title="Edit token settings"
                    >
                      <Edit3 size={14} className="inline mr-1" /> Edit
                    </button>

                    <button 
                      onClick={() => handleDeleteToken(t)}
                      disabled={t.active}
                      className={`btn text-[10px] font-black uppercase py-2 px-3 shadow-sm border-2 transition-all ${
                        t.active 
                        ? 'border-border text-text-muted opacity-40 cursor-not-allowed' 
                        : 'border-danger/20 text-danger hover:bg-danger hover:text-white'
                      }`}
                      title={t.active ? "Deactivate to enable deletion" : "Delete token"}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-text-muted">
                    <KeyRound size={64} className="opacity-10 mb-4" />
                    <p className="font-bold">No tokens available.</p>
                    <p className="text-xs font-medium">Select subjects on the left to generate tokens.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Edit Token Modal */}
      {showEditModal && editingToken && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface w-full max-w-md rounded-2xl shadow-2xl p-6 border-2 border-primary animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Edit3 size={20} className="text-primary" /> Edit Token
              </h2>
              <button onClick={() => setShowEditModal(false)} className="text-text-muted hover:text-danger transition-colors p-1">
                <X size={22} />
              </button>
            </div>

            <div className="space-y-4 max-h-[70vh] overflow-y-auto px-1 pr-2 custom-scrollbar">
              <div className="input-group">
                <label className="input-label text-xs" htmlFor="edit-token">Token Code</label>
                <input
                  id="edit-token"
                  type="text"
                  className="input-field font-black tracking-widest text-lg"
                  value={editingToken.token}
                  onChange={e => setEditingToken({ ...editingToken, token: e.target.value.toUpperCase() })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="input-group">
                  <label className="input-label text-xs" htmlFor="edit-subject">Base Subject</label>
                  <select
                    id="edit-subject"
                    className="input-field"
                    value={editingToken.subject || ''}
                    onChange={e => setEditingToken({ ...editingToken, subject: e.target.value })}
                  >
                    <option value="">All / Mixed</option>
                    {availableSubjects.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div className="input-group">
                  <label className="input-label text-xs" htmlFor="edit-materi">Materi (Relasi)</label>
                  <select 
                    id="edit-materi"
                    className="input-field"
                    value={editingToken.materi_id || ''}
                    onChange={(e) => setEditingToken({ ...editingToken, materi_id: e.target.value || undefined })}
                  >
                    <option value="">No Materi / All</option>
                    {availableMateri.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="input-group">
                <label className="input-label text-xs" htmlFor="edit-package">Package Filter</label>
                <select
                  id="edit-package"
                  className="input-field"
                  value={editingToken.package || ''}
                  onChange={e => setEditingToken({ ...editingToken, package: e.target.value })}
                >
                  <option value="">All Packages</option>
                  {availablePackages.filter(p => p !== 'All').map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              {/* Allowed Subjects Multi-Select */}
              <div className="space-y-2">
                <label className="input-label text-[10px] font-black uppercase text-primary">Allowed Subjects (Selection)</label>
                <div className="flex flex-wrap gap-1.5 p-2 bg-background border border-border rounded-lg max-h-[100px] overflow-y-auto">
                  {availableSubjects.map(s => {
                    const isSelected = (editingToken.allowed_subjects || []).includes(s);
                    return (
                      <button
                        key={s} type="button"
                        onClick={() => {
                          const current = editingToken.allowed_subjects || [];
                          const next = current.includes(s) ? current.filter(x => x !== s) : [...current, s];
                          setEditingToken({ ...editingToken, allowed_subjects: next.length > 0 ? next : undefined });
                        }}
                        className={`px-2 py-1 rounded text-[10px] font-bold border transition-all ${isSelected ? 'bg-primary border-primary text-white shadow-sm' : 'bg-surface border-border text-text-muted hover:border-primary/30'}`}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Allowed Packages Multi-Select */}
              <div className="space-y-2">
                <label className="input-label text-[10px] font-black uppercase text-secondary">Allowed Packages (Selection)</label>
                <div className="flex flex-wrap gap-1.5 p-2 bg-background border border-border rounded-lg max-h-[100px] overflow-y-auto">
                  {availablePackages.filter(p => p !== 'All').map(p => {
                    const isSelected = (editingToken.allowed_packages || []).includes(p);
                    return (
                      <button
                        key={p} type="button"
                        onClick={() => {
                          const current = editingToken.allowed_packages || [];
                          const next = current.includes(p) ? current.filter(x => x !== p) : [...current, p];
                          setEditingToken({ ...editingToken, allowed_packages: next.length > 0 ? next : undefined });
                        }}
                        className={`px-2 py-1 rounded text-[10px] font-bold border transition-all ${isSelected ? 'bg-secondary border-secondary text-white shadow-sm' : 'bg-surface border-border text-text-muted hover:border-secondary/30'}`}
                      >
                        {p}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="input-group">
                  <label className="input-label text-xs" htmlFor="edit-duration">Duration (Min)</label>
                  <input
                    id="edit-duration"
                    type="number" min="5" max="180" step="5"
                    className="input-field text-center"
                    value={editingToken.durationMinutes}
                    onChange={e => setEditingToken({ ...editingToken, durationMinutes: parseInt(e.target.value) || 60 })}
                  />
                </div>
                <div className="input-group">
                  <label className="input-label text-xs" htmlFor="edit-qcount">Question Count</label>
                  <input
                    id="edit-qcount"
                    type="number" min="1" max="100"
                    className="input-field text-center"
                    value={editingToken.questionCount}
                    onChange={e => setEditingToken({ ...editingToken, questionCount: parseInt(e.target.value) || 25 })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2 p-3 rounded-lg bg-background border border-border">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-text-muted">Urutan Soal</span>
                  <button
                    type="button"
                    onClick={() => setEditingToken({ ...editingToken, randomizeQuestions: !editingToken.randomizeQuestions })}
                    className={`px-3 py-1 rounded-full text-[9px] font-black uppercase transition-all border-2 ${
                      editingToken.randomizeQuestions !== false
                      ? 'bg-secondary/10 border-secondary text-secondary'
                      : 'bg-primary/10 border-primary text-primary'
                    }`}
                  >
                    {editingToken.randomizeQuestions !== false ? 'Acak' : 'Urut Nomor'}
                  </button>
                </div>
                <div className="flex items-center justify-between border-t border-border/50 pt-2">
                  <span className="text-[10px] font-black uppercase text-text-muted">Urutan Jawaban</span>
                  <button
                    type="button"
                    onClick={() => setEditingToken({ ...editingToken, randomizeOptions: !editingToken.randomizeOptions })}
                    className={`px-3 py-1 rounded-full text-[9px] font-black uppercase transition-all border-2 ${
                      editingToken.randomizeOptions !== false
                      ? 'bg-secondary/10 border-secondary text-secondary'
                      : 'bg-primary/10 border-primary text-primary'
                    }`}
                  >
                    {editingToken.randomizeOptions !== false ? 'Acak' : 'Tetap (Fix)'}
                  </button>
                </div>
                <div className="flex items-center justify-between border-t border-border/50 pt-2">
                  <span className="text-[10px] font-black uppercase text-text-muted">Status Ujian</span>
                  <button
                    type="button"
                    onClick={() => setEditingToken({ ...editingToken, active: !editingToken.active })}
                    className={`px-3 py-1 rounded-full text-[9px] font-black uppercase transition-all border-2 ${
                      editingToken.active
                      ? 'bg-green-500/10 border-green-500 text-green-600'
                      : 'bg-red-500/10 border-red-500 text-red-600'
                    }`}
                  >
                    {editingToken.active ? 'Aktif' : 'Non-Aktif'}
                  </button>
                </div>
                <div className="flex items-center justify-between border-t border-border/50 pt-2">
                  <span className="text-[10px] font-black uppercase text-text-muted">Hasil Siswa</span>
                  <button
                    type="button"
                    onClick={() => setEditingToken({ ...editingToken, resultsVisible: !editingToken.resultsVisible })}
                    className={`px-3 py-1 rounded-full text-[9px] font-black uppercase transition-all border-2 ${
                      editingToken.resultsVisible
                      ? 'bg-blue-500/10 border-blue-500 text-blue-600'
                      : 'bg-yellow-500/10 border-yellow-500 text-yellow-600'
                    }`}
                  >
                    {editingToken.resultsVisible ? 'Ditampilkan' : 'Disembunyikan'}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="btn btn-outline flex-1"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                className="btn btn-primary flex-1 gap-2"
                disabled={isLoading}
              >
                <Save size={16} /> Save
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default Tokens;
