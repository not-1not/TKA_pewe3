import React, { useState, useEffect } from 'react';
import { AdminLayout } from './Dashboard';
import { api, ExamToken } from '../../lib/db';
import { Plus, Trash2, KeyRound, Copy, CheckSquare, Square, Zap, ZapOff, BookOpen, Layers } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';

const Tokens = () => {
  const [tokens, setTokens] = useState<ExamToken[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);
  const [duration, setDuration] = useState(60);
  const [qCount, setQCount] = useState(25);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [allTokens, allQuestions] = await Promise.all([
        api.getTokens(),
        api.getQuestions()
      ]);
      setTokens(allTokens);
      const subjects = Array.from(new Set(allQuestions.map(q => q.subject)));
      setAvailableSubjects(subjects);
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
          const subjectQs = allQuestions.filter(q => q.subject === subject);
          if (qCount > subjectQs.length && subject !== 'All') {
            // Note: confirm might block but it's okay for admin simple flow
            // If strictly needing non-blocking UI, would need a custom modal
          }

          newTokens.push({
            id: 'TOK-' + Date.now() + Math.random().toString(36).substring(2, 5),
            token: generateTokenStr(),
            durationMinutes: duration,
            questionCount: Math.min(qCount, subjectQs.length || qCount),
            subject: subject,
            active: true
          });
        });

        if (newTokens.length === 0) return;

        const currentTokens = await api.getTokens();
        const updated = [...currentTokens, ...newTokens];
        await api.setTokens(updated);
        await fetchData();
        setSelectedSubjects([]);
        alert(`Successfully generated ${newTokens.length} tokens.`);
    } catch (err) {
        alert("Failed to create tokens");
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
    } catch (err) {
        alert("Failed to toggle token");
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
    } catch (err) {
        alert("Failed to update tokens");
    } finally {
        setIsLoading(false);
    }
  };

  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) return;
    if (confirm(`Delete ${selectedIds.length} selected tokens?`)) {
      setIsLoading(true);
      try {
          const remaining = tokens.filter(t => !selectedIds.includes(t.id));
          await api.setTokens(remaining);
          await fetchData();
          setSelectedIds([]);
      } catch (err) {
          alert("Failed to delete tokens");
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
  
  const handleCopy = (t: string) => {
    navigator.clipboard.writeText(t);
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

              <div className="grid grid-cols-2 gap-4">
                <div className="input-group">
                  <label className="input-label text-[10px]">Duration (Min)</label>
                  <input 
                    type="number" min="5" max="180" step="5"
                    className="input-field text-center" 
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value))}
                    title="Exam duration in minutes"
                  />
                </div>
                <div className="input-group">
                  <label className="input-label text-[10px]">Qs per Subject</label>
                  <input 
                    type="number" min="1" max="100"
                    className="input-field text-center" 
                    value={qCount}
                    onChange={(e) => setQCount(parseInt(e.target.value))}
                    title="Number of questions per subject"
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
                              onClick={() => handleCopy(t.token)}
                              title="Click to copy"
                            >
                              {t.token}
                            </span>
                            <Copy size={14} className="text-text-muted" />
                         </div>
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
    </AdminLayout>
  );
};

export default Tokens;
