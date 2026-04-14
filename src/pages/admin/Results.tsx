import React, { useState, useEffect } from 'react';
import { AdminLayout } from './Dashboard';
import { api, Result, Question } from '../../lib/db';
import { Download, Search, Edit3, Trash2, X, Save, BarChart3, Trophy } from 'lucide-react';

import { AnswerAnalysis } from '../../components/AnswerAnalysis';

const AdminResults = () => {
  const [results, setResults] = useState<Result[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [tokens, setTokens] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingResult, setEditingResult] = useState<Result | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedResult, setSelectedResult] = useState<Result | null>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [groupByToken, setGroupByToken] = useState(false);
  const [sortBy, setSortBy] = useState<'timestamp' | 'score' | 'name'>('timestamp');


  const fetchResults = async () => {
    setIsLoading(true);
    try {
      const [data, allQuestions, allTokens, materiList] = await Promise.all([
        api.getResults(),
        api.getQuestions(),
        api.getTokens(),
        api.getMateriList()
      ]);
      
      const enrichedResults = data.map(r => {
        const tok = allTokens.find(t => t.id === r.tokenId);
        return {
          ...r,
          materiName: r.materiName || materiList.find(m => m.id === (r.materi_id || tok?.materi_id))?.name || ''
        };
      });

      setResults(enrichedResults);
      setQuestions(allQuestions);
      setTokens(allTokens);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, []);

  const handleExportCSV = () => {
    if (results.length === 0) return;

    const headers = ['Timestamp', 'Student Name', 'School', 'Mapel', 'Materi', 'Token', 'Correct', 'Wrong', 'Score'];
    const rows = results.map(r => {
      let tokenStr = r.token || '';
      let mapel = r.subject || '';
      let materi = (r as any).materiName || '';

      if (!tokenStr && r.tokenId) {
        const tok = tokens.find(t => t.id === r.tokenId);
        tokenStr = tok?.token || '';
        mapel = tok?.subject || '';
      }
      
      return [
        new Date(r.timestamp).toLocaleString(),
        r.studentName,
        r.school,
        mapel,
        materi,
        tokenStr,
        r.correct,
        r.wrong,
        r.score
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(e => e.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `tka_results_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleEdit = (result: Result) => {
    setEditingResult({ ...result });
    setShowEditModal(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this result?')) {
      setIsLoading(true);
      try {
          await api.deleteResult(id);
          await fetchResults();
      } catch (err) {
          alert("Failed to delete result");
      } finally {
          setIsLoading(false);
      }
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingResult) {
      setIsLoading(true);
      try {
          await api.updateResult(editingResult);
          await fetchResults();
          setShowEditModal(false);
          setEditingResult(null);
      } catch (err) {
          alert("Failed to update result");
      } finally {
          setIsLoading(false);
      }
    }
  };

  const filteredResults = results
    .filter(r =>
      r.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.school.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'timestamp') return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      if (sortBy === 'score') return b.score - a.score;
      if (sortBy === 'name') return a.studentName.localeCompare(b.studentName);
      return 0;
    });

  const top10 = [...results]
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  const groupedResults = filteredResults.reduce((acc, r) => {
    let tokenStr = r.token || 'No Token';
    if (!tokenStr && r.tokenId) {
      const tok = tokens.find(t => t.id === r.tokenId);
      tokenStr = tok?.token || 'Unknown Token';
    }
    if (!acc[tokenStr]) acc[tokenStr] = [];
    acc[tokenStr].push(r);
    return acc;
  }, {} as Record<string, Result[]>);

  const renderResultRow = (r: Result) => {
    let tokenStr = '';
    let mapel = '';
    if (r.tokenId) {
      const tok = tokens.find(t => t.id === r.tokenId);
      tokenStr = tok?.token || '';
      mapel = tok?.subject || '';
    } else if (r.token) {
      tokenStr = r.token;
    }
    return (
      <tr key={r.id} className="border-b border-border hover:bg-background/50 transition-colors">
        <td className="p-3 sm:p-4 text-xs sm:text-sm">{new Date(r.timestamp).toLocaleString()}</td>
        <td className="p-3 sm:p-4 font-bold text-text-main text-sm sm:text-base">{r.studentName}</td>
        <td className="p-3 sm:p-4 text-text-muted text-xs sm:text-sm">{r.school}</td>
        <td className="p-3 sm:p-4 text-xs sm:text-sm font-bold text-secondary">{r.subject || mapel}</td>
        <td className="p-3 sm:p-4 text-xs sm:text-sm">{(r as any).materiName || '-'}</td>
        <td className="p-3 sm:p-4 text-xs sm:text-sm font-mono">{r.token || tokenStr}</td>
        <td className="p-3 sm:p-4 text-center font-bold text-secondary text-sm sm:text-base">{r.correct}</td>
        <td className="p-3 sm:p-4 text-center font-bold text-danger text-sm sm:text-base">{r.wrong}</td>
        <td className="p-3 sm:p-4 text-center font-black text-xl text-primary">{r.score}%</td>
        <td className="p-3 sm:p-4 text-right">
          <div className="flex justify-end gap-1 sm:gap-2">
            {r.answerDetails && r.answerDetails.length > 0 && (
              <button
                onClick={() => {
                  setSelectedResult(r);
                  setShowAnalysis(true);
                }}
                className="p-1.5 sm:p-2 text-text-muted hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                title="View Answer Analysis"
              >
                <BarChart3 size={16} className="sm:w-[18px] sm:h-[18px]" />
              </button>
            )}
            <button
              onClick={() => handleEdit(r)}
              className="p-1.5 sm:p-2 text-text-muted hover:text-warning hover:bg-warning/10 rounded-lg transition-colors"
              title="Edit Result"
            >
              <Edit3 size={16} className="sm:w-[18px] sm:h-[18px]" />
            </button>
            <button
              onClick={() => handleDelete(r.id)}
              className="p-1.5 sm:p-2 text-text-muted hover:text-danger hover:bg-danger/10 rounded-lg transition-colors"
              title="Delete Result"
            >
              <Trash2 size={16} className="sm:w-[18px] sm:h-[18px]" />
            </button>
          </div>
        </td>
      </tr>
    );
  };

  const renderMobileResultCard = (r: Result) => (
    <div key={r.id} className="bg-background rounded-xl border border-border p-4 hover:border-primary/50 transition-colors">
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="font-bold text-text-main text-base">{r.studentName}</div>
          <div className="text-xs text-text-muted">{r.school}</div>
          <div className="text-[10px] text-text-muted mt-1">{new Date(r.timestamp).toLocaleString()}</div>
        </div>
        <div className={`px-3 py-1.5 rounded-lg font-black text-lg ${r.score >= 70 ? 'bg-secondary/10 text-secondary' : r.score >= 50 ? 'bg-warning/10 text-warning' : 'bg-danger/10 text-danger'}`}>
          {r.score}%
        </div>
      </div>
      <div className="flex justify-between items-center">
        <div className="flex gap-4 text-xs">
          <span className="text-secondary font-bold">✓ {r.correct}</span>
          <span className="text-danger font-bold">✗ {r.wrong}</span>
        </div>
        <div className="flex gap-1">
          {r.answerDetails && r.answerDetails.length > 0 && (
            <button
              onClick={() => {
                setSelectedResult(r);
                setShowAnalysis(true);
              }}
              className="p-2 text-text-muted hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
            >
              <BarChart3 size={16} />
            </button>
          )}
          <button
            onClick={() => handleEdit(r)}
            className="p-2 text-text-muted hover:text-warning hover:bg-warning/10 rounded-lg transition-colors"
          >
            <Edit3 size={16} />
          </button>
          <button
            onClick={() => handleDelete(r.id)}
            className="p-2 text-text-muted hover:text-danger hover:bg-danger/10 rounded-lg transition-colors"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );


  return (
    <AdminLayout>
      {!showAnalysis ? (
        <>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 border-b border-border pb-4 gap-4">
            <h1 className="text-2xl sm:text-3xl font-black text-text-main">Exam Results</h1>
            <button
              onClick={handleExportCSV}
              className="btn btn-secondary shadow-sm w-full sm:w-auto text-sm sm:text-base"
              disabled={results.length === 0}
            >
              <Download size={16} className="sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Export CSV</span>
              <span className="sm:hidden">Export</span>
            </button>
          </div>

          <div className="card bg-surface">
            {/* Top 10 Ranking Board */}
            {results.length > 0 && (
              <div className="mb-8 p-6 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl border-2 border-primary/20">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-primary rounded-lg text-white">
                    <Trophy size={20} />
                  </div>
                  <h2 className="text-xl font-black text-text-main uppercase tracking-tight">Top 10 Ranking</h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {top10.map((r, idx) => (
                    <div key={r.id} className="bg-surface p-3 rounded-xl border border-border shadow-sm flex flex-col items-center relative overflow-hidden group hover:border-primary transition-all">
                      <div className="absolute top-0 right-0 px-2 py-0.5 bg-primary/20 text-primary text-[10px] font-black rounded-bl-lg">#{idx + 1}</div>
                      <div className="w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center text-primary font-black mb-2 animate-pulse">
                        {r.studentName.charAt(0).toUpperCase()}
                      </div>
                      <div className="font-bold text-center text-xs truncate w-full mb-1">{r.studentName}</div>
                      <div className="text-primary font-black text-lg leading-none">{r.score}%</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-6 flex flex-col lg:flex-row gap-4 lg:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 flex-1">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                  <input
                    type="text"
                    placeholder="Search name or school..."
                    className="input-field pl-9 text-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <select 
                    value={sortBy} 
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="input-field py-1 px-3 text-sm bg-surface border-border font-bold text-text-main"
                    aria-label="Urutkan berdasarkan"
                  >
                    <option value="timestamp">Sort: Terbaru</option>
                    <option value="score">Sort: Nilai Tertinggi</option>
                    <option value="name">Sort: Nama</option>
                  </select>
                  <button
                    onClick={() => setGroupByToken(!groupByToken)}
                    className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all border-2 ${
                      groupByToken 
                        ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' 
                        : 'bg-surface text-text-muted border-border hover:border-primary hover:text-primary'
                    }`}
                  >
                    {groupByToken ? 'Grouped by Token ✓' : 'Group by Token'}
                  </button>
                </div>
              </div>
              <div className="text-text-muted font-bold text-xs sm:text-sm whitespace-nowrap flex items-center gap-3 justify-end">
                {isLoading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>}
                {filteredResults.length} records total
              </div>
            </div>


            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-background border-b border-border text-text-muted uppercase tracking-wider text-xs sm:text-sm">
                    <th className="p-3 sm:p-4 font-bold">Date / Time</th>
                    <th className="p-3 sm:p-4 font-bold">Student Name</th>
                    <th className="p-3 sm:p-4 font-bold">School</th>
                    <th className="p-3 sm:p-4 font-bold">Mapel</th>
                    <th className="p-3 sm:p-4 font-bold">Materi</th>
                    <th className="p-3 sm:p-4 font-bold">Token</th>
                    <th className="p-3 sm:p-4 font-bold text-center">Correct</th>
                    <th className="p-3 sm:p-4 font-bold text-center">Wrong</th>
                    <th className="p-3 sm:p-4 font-bold text-center text-primary">Score</th>
                    <th className="p-3 sm:p-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {!groupByToken ? (
                    filteredResults.length > 0 ? (
                      filteredResults.map(r => renderResultRow(r))
                    ) : (
                      <tr>
                        <td colSpan={10} className="p-8 text-center text-text-muted font-bold">No results found.</td>
                      </tr>
                    )
                  ) : (
                    Object.keys(groupedResults).length > 0 ? (
                      Object.keys(groupedResults).map(tokenName => (
                        <React.Fragment key={tokenName}>
                          <tr className="bg-primary/5 border-b border-border">
                            <td colSpan={10} className="p-3 sm:p-4 font-black text-primary uppercase tracking-widest text-xs">
                              TOKEN: {tokenName} ({groupedResults[tokenName].length} data)
                            </td>
                          </tr>
                          {groupedResults[tokenName].map(r => renderResultRow(r))}
                        </React.Fragment>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={10} className="p-8 text-center text-text-muted font-bold">No results found.</td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>


            <div className="md:hidden space-y-3 mt-4">
              {!groupByToken ? (
                filteredResults.length > 0 ? (
                  filteredResults.map(r => renderMobileResultCard(r))
                ) : (
                  <div className="text-center p-8 text-text-muted">No results found.</div>
                )
              ) : (
                Object.keys(groupedResults).length > 0 ? (
                  Object.keys(groupedResults).map(tokenName => (
                    <div key={tokenName} className="space-y-3">
                      <div className="bg-primary/10 px-4 py-2 rounded-lg font-black text-primary text-[10px] uppercase tracking-widest border border-primary/20">
                        Token: {tokenName}
                      </div>
                      {groupedResults[tokenName].map(r => renderMobileResultCard(r))}
                    </div>
                  ))
                ) : (
                  <div className="text-center p-8 text-text-muted">No results found.</div>
                )
              )}
            </div>

          </div>
        </>
      ) : selectedResult && selectedResult.answerDetails ? (
        /* Analysis View */
        <div className="animate-fade-in">
          <button
            onClick={() => {
              setShowAnalysis(false);
              setSelectedResult(null);
            }}
            className="btn btn-outline mb-6 py-2 px-4"
          >
            ← Back to Results
          </button>

          <div className="card border-2 border-border/50 p-6 mb-6">
            <h2 className="text-2xl font-bold text-primary mb-4">Analisis Jawaban Siswa</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-background p-4 rounded-lg border border-border">
                <div className="text-xs font-bold text-text-muted uppercase mb-1">Nama Siswa</div>
                <div className="text-lg font-bold text-text-main">{selectedResult.studentName}</div>
              </div>
              <div className="bg-background p-4 rounded-lg border border-border">
                <div className="text-xs font-bold text-text-muted uppercase mb-1">Sekolah</div>
                <div className="text-lg font-bold text-text-main">{selectedResult.school}</div>
              </div>
              <div className="bg-background p-4 rounded-lg border border-border">
                <div className="text-xs font-bold text-text-muted uppercase mb-1">Nilai</div>
                <div className="text-2xl font-black text-primary">{selectedResult.score}%</div>
              </div>
              <div className="bg-background p-4 rounded-lg border border-border">
                <div className="text-xs font-bold text-text-muted uppercase mb-1">Waktu</div>
                <div className="text-sm font-bold text-text-main">{new Date(selectedResult.timestamp).toLocaleString()}</div>
              </div>
            </div>
          </div>

          <div className="card border-2 border-border/50 p-6">
            <AnswerAnalysis answerDetails={selectedResult.answerDetails} allQuestions={questions} />
          </div>

          <div className="flex justify-center mt-8 pb-8">
            <button
              onClick={() => {
                setShowAnalysis(false);
                setSelectedResult(null);
              }}
              className="btn btn-outline py-3 px-8"
            >
              ← Back to Results
            </button>
          </div>
        </div>
      ) : null}

      {/* Edit Modal */}
      {showEditModal && editingResult && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface w-full max-w-md rounded-2xl shadow-2xl p-5 sm:p-6 border-2 border-primary animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-xl font-bold">Edit Exam Result</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-text-muted hover:text-danger transition-colors p-1"
              >
                <X size={22} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3 sm:space-y-4">
              <div className="bg-background/50 p-3 rounded-lg border border-border mb-4">
                <p className="text-xs font-bold text-text-muted mb-1 uppercase tracking-wider">Student</p>
                <p className="font-black text-text-main text-sm sm:text-base">{editingResult.studentName}</p>
                <p className="text-xs sm:text-sm text-text-muted">{editingResult.school}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="input-group">
                  <label className="input-label text-xs sm:text-sm" htmlFor="edit-correct">Correct</label>
                  <input
                    id="edit-correct"
                    type="number"
                    className="input-field text-sm sm:text-base"
                    placeholder="Correct answers"
                    value={editingResult.correct}
                    onChange={e => setEditingResult({ ...editingResult, correct: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="input-group">
                  <label className="input-label text-xs sm:text-sm" htmlFor="edit-wrong">Wrong</label>
                  <input
                    id="edit-wrong"
                    type="number"
                    className="input-field text-sm sm:text-base"
                    placeholder="Wrong answers"
                    value={editingResult.wrong}
                    onChange={e => setEditingResult({ ...editingResult, wrong: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label text-xs sm:text-sm" htmlFor="edit-score">Final Score</label>
                <input
                  id="edit-score"
                  type="number"
                  step="0.01"
                  className="input-field text-xl sm:text-2xl font-black text-primary bg-primary/5 text-sm sm:text-base"
                  placeholder="Score percentage"
                  value={editingResult.score}
                  onChange={e => setEditingResult({ ...editingResult, score: parseFloat(e.target.value) || 0 })}
                />
              </div>

              <div className="flex gap-2 sm:gap-3 pt-3 sm:pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="btn btn-outline flex-1 text-sm sm:text-base"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary flex-1 gap-1 sm:gap-2 text-sm sm:text-base"
                >
                  <Save size={16} className="sm:w-5 sm:h-5" /> Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminResults;
