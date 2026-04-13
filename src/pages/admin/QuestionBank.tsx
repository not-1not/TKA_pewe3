
import React, { useState, useEffect } from 'react';
import { AdminLayout } from './Dashboard';
import { api, Question, Statement, PaketSoal, QuestionType } from '../../lib/db';
import { Plus, Trash2, Edit3, X, CheckSquare, Square, Filter, Layers, Copy, Move, Search, Upload, FileQuestion, ChevronsUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';




const QuestionBank = () => {
  // Tambah Paket Soal
  const handleAddPaket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paketForm.name) return alert('Nama paket wajib diisi');
    setPaketLoading(true);
    try {
      await api.addPaketSoal(paketForm);
      setPaketForm({ name: '', subject: '' });
      setShowPaketForm(false);
      await fetchPaketList();
    } catch (err: any) {
      alert('Gagal menambah paket: ' + (err?.message || err));
    } finally {
      setPaketLoading(false);
    }
  };

  // Hapus Paket Soal
  const handleDeletePaket = async (id: string) => {
    if (!window.confirm('Hapus paket soal ini beserta relasinya?')) return;
    setPaketLoading(true);
    try {
      await api.deletePaketSoal(id);
      if (selectedPaketId === id) setSelectedPaketId(null);
      await fetchPaketList();
    } catch (err: any) {
      alert('Gagal menghapus paket: ' + (err?.message || err));
    } finally {
      setPaketLoading(false);
    }
  };
  // Paket Soal State
  const [paketList, setPaketList] = useState<PaketSoal[]>([]);
  const [selectedPaketId, setSelectedPaketId] = useState<string | null>(null);
  const [showPaketForm, setShowPaketForm] = useState(false);
  const [paketForm, setPaketForm] = useState<{ name: string; subject?: string }>({ name: '', subject: '' });
  const [paketLoading, setPaketLoading] = useState(false);
  const [paketQuestions, setPaketQuestions] = useState<Question[]>([]);
  const [paketQuestionsLoading, setPaketQuestionsLoading] = useState(false);

  // Soal State
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [filterSubject, setFilterSubject] = useState('All');
  const [filterPackage, setFilterPackage] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'subject' | 'package' | 'question' | 'none'>('none');
  const [showForm, setShowForm] = useState(false);
  const [showBulkAdd, setShowBulkAdd] = useState(false);
  const [bulkText, setBulkText] = useState('');

  const initialFormData: Partial<Question> = {
    subject: '',
    package: '',
    question: '',
    type: 'pilihan_ganda',
    option_a: { text: '', image: '' },
    option_b: { text: '', image: '' },
    option_c: { text: '', image: '' },
    option_d: { text: '', image: '' },
    correct_answer: 'A',
    statements: [
      { text: '', isCorrect: false, correctAnswer: 'Sesuai' },
      { text: '', isCorrect: false, correctAnswer: 'Sesuai' },
      { text: '', isCorrect: false, correctAnswer: 'Sesuai' },
    ],
    image: ''
  };

  const [formData, setFormData] = useState<Partial<Question>>(initialFormData);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [subjects, setSubjects] = useState<string[]>(['All']);
  const [packages, setPackages] = useState<string[]>(['All']);
  const [tempPackages, setTempPackages] = useState<string[]>([]);
  const [tempSubjects, setTempSubjects] = useState<string[]>([]);
  const [newPackageName, setNewPackageName] = useState('');
  const [tableSortField, setTableSortField] = useState<'package' | 'subject' | 'question' | 'type' | 'none'>('none');
  const [tableSortDir, setTableSortDir] = useState<'asc' | 'desc'>('asc');
  const [headerPackageFilter, setHeaderPackageFilter] = useState('All');
  const [headerSubjectFilter, setHeaderSubjectFilter] = useState('All');
  const [headerQuestionSearch, setHeaderQuestionSearch] = useState('');

  // Fetch Paket Soal
  const fetchPaketList = async () => {
    setPaketLoading(true);
    try {
      const data = await api.getPaketSoalList();
      setPaketList(data);
    } catch (err) {
      console.error(err);
    } finally {
      setPaketLoading(false);
    }
  };

  useEffect(() => {
    fetchPaketList();
  }, []);

  // Fetch questions in paket saat paket dipilih
  useEffect(() => {
    if (selectedPaketId) {
      setPaketQuestionsLoading(true);
      api.getQuestionsByPaket(selectedPaketId)
        .then(setPaketQuestions)
        .catch(e => setPaketQuestions([]))
        .finally(() => setPaketQuestionsLoading(false));
    } else {
      setPaketQuestions([]);
    }
  }, [selectedPaketId]);

  // Tambah/hapus soal ke/dari paket
  const handleAddQuestionToPaket = async (questionId: string) => {
    if (!selectedPaketId) return;
    setPaketQuestionsLoading(true);
    try {
      await api.addQuestionToPaket(selectedPaketId, questionId);
      await api.getQuestionsByPaket(selectedPaketId).then(setPaketQuestions);
    } catch (e: any) {
      alert('Gagal menambah soal ke paket: ' + (e?.message || e));
    } finally {
      setPaketQuestionsLoading(false);
    }
  };

  const handleRemoveQuestionFromPaket = async (questionId: string) => {
    if (!selectedPaketId) return;
    setPaketQuestionsLoading(true);
    try {
      await api.removeQuestionFromPaket(selectedPaketId, questionId);
      await api.getQuestionsByPaket(selectedPaketId).then(setPaketQuestions);
    } catch (e: any) {
      alert('Gagal menghapus soal dari paket: ' + (e?.message || e));
    } finally {
      setPaketQuestionsLoading(false);
    }
  };

  // Fetch all questions
  const fetchQuestions = async () => {
    setIsLoading(true);
    try {
      const data = await api.getQuestions();
      setQuestions(data);
      const uniqueSubjects = ['All', ...Array.from(new Set(data.map(q => q.subject).filter(Boolean)))];
      setSubjects(uniqueSubjects);
      const uniquePackages = ['All', ...Array.from(new Set(data.map(q => q.package).filter(Boolean)))];
      setPackages(uniquePackages);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  const effectiveSubjectFilter = headerSubjectFilter !== 'All' ? headerSubjectFilter : filterSubject;
  const effectivePackageFilter = headerPackageFilter !== 'All' ? headerPackageFilter : filterPackage;
  const effectiveSearch = (searchTerm || headerQuestionSearch).trim().toLowerCase();
  const effectiveSort = tableSortField !== 'none' ? tableSortField : sortBy;

  // Filter soal: jika paket dipilih, tampilkan hanya soal dalam paket
  const filteredQuestions = (selectedPaketId ? paketQuestions : questions)
    .filter(q => (effectiveSubjectFilter === 'All' || q.subject === effectiveSubjectFilter))
    .filter(q => (effectivePackageFilter === 'All' || q.package === effectivePackageFilter))
    .filter(q => (effectiveSearch === '' ||
      q.question.toLowerCase().includes(effectiveSearch) ||
      (q.package || '').toLowerCase().includes(effectiveSearch) ||
      q.subject.toLowerCase().includes(effectiveSearch)
    ))
    .sort((a, b) => {
      const wipe = (v?: string) => (v || '').toLowerCase();
      let cmp = 0;
      if (effectiveSort === 'subject') cmp = wipe(a.subject).localeCompare(wipe(b.subject));
      else if (effectiveSort === 'package') cmp = wipe(a.package).localeCompare(wipe(b.package));
      else if (effectiveSort === 'question') cmp = wipe(a.question).localeCompare(wipe(b.question));
      else if (effectiveSort === 'type') cmp = wipe(a.type).localeCompare(wipe(b.type));
      if (tableSortField !== 'none') {
        return tableSortDir === 'desc' ? -cmp : cmp;
      }
      return cmp;
    });

  const toggleTableSort = (field: 'package' | 'subject' | 'question' | 'type') => {
    if (tableSortField === field) {
      setTableSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setTableSortField(field);
      setTableSortDir('asc');
    }
  };

  const handleReorder = async (newOrder: Question[]) => {
    if (filterSubject !== 'All' || filterPackage !== 'All' || sortBy !== 'none') return; // Reorder only in default view
    setQuestions(newOrder);
    setIsLoading(true);
    try {
      await api.setQuestions(newOrder);
    } catch (err) {
      alert("Failed to save new order");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.subject || !formData.question) return alert("Subject and Question required");

    if (formData.type === 'pilihan_ganda') {
      const opts = [formData.option_a, formData.option_b, formData.option_c, formData.option_d];
      if (opts.some(opt => !opt || (typeof opt === 'string' ? !opt : (!opt.text && !opt.image)))) return alert("All options (A-D) must have text or image for Pilihan Ganda");
      if (!formData.correct_answer) return alert("Correct answer is required for Pilihan Ganda");
    } else {
      const statements = formData.statements || [];
      if (statements.length !== 3 || statements.some(s => !s.text?.trim())) return alert("All 3 statements are required for Pilihan Ganda Kompleks / MCMA");
      if (formData.type === 'multiple_choice_multiple_answer' && statements.some(s => !s.correctAnswer?.trim())) return alert("All statement answers (Sesuai/Tidak Sesuai) are required for MCMA");
    }

    setIsLoading(true);
    try {
      // Pastikan option_a-d selalu object {text, image}
      const toOptionContent = (opt: any) =>
        typeof opt === 'object' && opt !== null ? opt : { text: opt || '', image: '' };
      const newQuestion = {
        ...formData,
        id: editingId || 'Q-' + Date.now().toString(36),
        option_a: toOptionContent(formData.option_a),
        option_b: toOptionContent(formData.option_b),
        option_c: toOptionContent(formData.option_c),
        option_d: toOptionContent(formData.option_d),
      } as Question;

      if (editingId) {
        await api.updateQuestion(newQuestion);
      } else {
        await api.addQuestion(newQuestion);
      }

      await fetchQuestions();
      onCloseForm();
    } catch (err: any) {
      console.error("Failed to save question:", err);
      const message = err?.message || err?.toString() || "Unknown error";
      alert(`Failed to save question: ${message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (q: Question) => {
    // Ensure options are in OptionContent format
    const toOptionContent = (opt: any) =>
      typeof opt === 'object' && opt !== null ? opt : { text: opt || '', image: '' };
    setFormData({
      ...initialFormData,
      ...q,
      option_a: toOptionContent(q.option_a),
      option_b: toOptionContent(q.option_b),
      option_c: toOptionContent(q.option_c),
      option_d: toOptionContent(q.option_d),
      statements: q.statements || initialFormData.statements
    });
    setEditingId(q.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this question?")) {
      setIsLoading(true);
      try {
        await api.deleteQuestion(id);
        await fetchQuestions();
      } catch (err) {
        alert("Failed to delete question");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const onCloseForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData(initialFormData);
  };

  const updateStatement = (index: number, field: keyof Statement, value: any) => {
    const newStatements = [...(formData.statements || [])];
    newStatements[index] = { ...newStatements[index], [field]: value };
    setFormData({ ...formData, statements: newStatements });
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredQuestions.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredQuestions.map(q => q.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkAdd = async () => {
    if (!bulkText.trim()) return;
    setIsLoading(true);
    try {
      const allRows = api.parseCSV(bulkText);
      const newQuestions: Question[] = allRows.map(parts => {
        // Skip header if it looks like one
        if (parts[0]?.toLowerCase() === 'package' || parts[2]?.toLowerCase() === 'question') return null;
        if (parts.length < 4) return null;

        // Parse base columns
        const pkg = parts[0] || 'Default';
        const subj = parts[1] || 'Umum';
        
        // Detect if there's an extra column between Subject and Question (Category/Materi)
        // or between Question and Type.
        // Standard: pkg(0), subj(1), question(2), type(3)
        // Let's check common patterns. If parts[3] does not look like a type (PG, PK, MCMA, TF, etc.)
        // but parts[4] does, then they might have an extra column.
        
        let qText = parts[2] || '';
        let typeRaw = (parts[3] || 'PG').toUpperCase();
        let offset = 0;
        
        const isType = (s: string) => ['PG','MC','PK','MCMA','TF','MULTIPLE','PILIHAN'].some(t => s.toUpperCase().includes(t));
        
        if (!isType(typeRaw) && isType(parts[4] || '')) {
          // Likely extra column like 'Category' at index 2 or 3
          // If parts[2] is actually Category and parts[3] is Question
          // ... we'll try to be smart but let's stick to a more predictable logic.
          // For now, let's assume if index 4 is the type, everything is shifted 1.
          qText = parts[3] || '';
          typeRaw = (parts[4] || 'PG').toUpperCase();
          offset = 1;
        }

        let type: QuestionType = 'pilihan_ganda';
        if (typeRaw === 'PK' || typeRaw === 'KOMPLEKS' || typeRaw === 'PILIHAN_GANDA_KOMPLEKS') type = 'pilihan_ganda_kompleks';
        else if (typeRaw === 'MCMA' || typeRaw === 'TF' || typeRaw === 'MULTIPLE_CHOICE_MULTIPLE_ANSWER') type = 'multiple_choice_multiple_answer';

        const q: Question = {
          id: 'Q-' + Math.random().toString(36).substring(2, 9),
          package: pkg,
          subject: subj,
          question: qText,
          type: type,
          image: ''
        };

        if (type === 'pilihan_ganda') {
          const parseOpt = (str: string) => {
            const [text, image] = (str || '').split('||');
            return { text: text || '', image: image || '' };
          };
          q.option_a = parseOpt(parts[4 + offset] || '');
          q.option_b = parseOpt(parts[5 + offset] || '');
          q.option_c = parseOpt(parts[6 + offset] || '');
          q.option_d = parseOpt(parts[7 + offset] || '');
          q.correct_answer = (parts[8 + offset] || 'A').toUpperCase() as any;
          q.image = parts[9 + offset] || '';
        } else {
          const s1_text = parts[4 + offset] || '';
          const s1_ans = (parts[5 + offset] || '').toUpperCase();
          const s2_text = parts[6 + offset] || '';
          const s2_ans = (parts[7 + offset] || '').toUpperCase();
          const s3_text = parts[8 + offset] || '';
          const s3_ans = (parts[9 + offset] || '').toUpperCase();
          q.image = parts[10 + offset] || '';

          const isPositive = (val: string) => 
            ['TRUE', '1', 'S', 'SESUAI', 'B', 'BENAR', 'T', 'TEPAT', 'Y', 'YA', 'MENDUKUNG'].includes(val.toUpperCase()) || 
            val.toUpperCase().startsWith('SESUAI') || 
            val.toUpperCase().startsWith('BENAR');

          if (type === 'pilihan_ganda_kompleks') {
            q.statements = [
              { text: s1_text, isCorrect: isPositive(s1_ans) },
              { text: s2_text, isCorrect: isPositive(s2_ans) },
              { text: s3_text, isCorrect: isPositive(s3_ans) },
            ];
          } else if (type === 'multiple_choice_multiple_answer') {
            const getLabel = (val: string) => {
              const v = val.toUpperCase();
              if (v === 'BENAR' || v === 'SALAH' || v === 'B') return isPositive(val) ? 'Benar' : 'Salah';
              if (v === 'TEPAT' || v === 'TIDAK TEPAT') return isPositive(val) ? 'Tepat' : 'Tidak Tepat';
              if (v === 'YA' || v === 'TIDAK') return isPositive(val) ? 'Ya' : 'Tidak';
              // Default to Sesuai/Tidak Sesuai as it's the standard for MCMA in this app
              return isPositive(val) ? 'Sesuai' : 'Tidak Sesuai';
            };
            q.statements = [
              { text: s1_text, correctAnswer: getLabel(s1_ans) },
              { text: s2_text, correctAnswer: getLabel(s2_ans) },
              { text: s3_text, correctAnswer: getLabel(s3_ans) },
            ];
          }
        }
        return q;
      }).filter((q): q is Question => q !== null && !!q.question);

      if (newQuestions.length === 0) throw new Error("No valid data found");

      await api.setQuestions(newQuestions);
      await fetchQuestions();
      setShowBulkAdd(false);
      setBulkText('');
      alert(`Successfully added ${newQuestions.length} questions!`);
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) return;
    if (confirm(`Delete ${selectedIds.length} selected questions?`)) {
      setIsLoading(true);
      try {
        // Use deleteQuestions API for batch deletion
        await api.deleteQuestions(selectedIds);
        await fetchQuestions();
        setSelectedIds([]);
      } catch (err) {
        console.error("Failed to delete questions:", err);
        alert("Failed to delete questions");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} selected questions? This action cannot be undone.`)) return;

    setIsLoading(true);
    try {
      await api.deleteQuestions(selectedIds);
      await fetchQuestions();
      setSelectedIds([]);
      alert("Questions deleted successfully");
    } catch (err) {
      alert("Failed to delete questions");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkSubjectChange = async (targetSubject: string) => {
    if (selectedIds.length === 0) return;
    if (targetSubject === 'New') {
      const name = prompt("Enter new subject name:");
      if (!name) return;
      if (!subjects.includes(name) && !tempSubjects.includes(name)) {
        setTempSubjects(prev => [...prev, name]);
      }
      targetSubject = name;
    }
    if (!confirm(`Change subject of ${selectedIds.length} questions to "${targetSubject}"?`)) return;

    setIsLoading(true);
    try {
      const selectedQs = questions.filter(q => selectedIds.includes(q.id));
      // Update each question individually using updateQuestion
      const updatePromises = selectedQs.map(q =>
        api.updateQuestion({ ...q, subject: targetSubject })
      );
      await Promise.all(updatePromises);
      // Refresh all questions from database
      await fetchQuestions();
      setSelectedIds([]);
      alert("Subjects updated successfully");
    } catch (err) {
      console.error("Failed to update subjects:", err);
      alert("Failed to update subjects");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkDuplicate = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Duplicate ${selectedIds.length} selected questions?`)) return;

    setIsLoading(true);
    try {
      const selectedQs = questions.filter(q => selectedIds.includes(q.id));
      const newQs = selectedQs.map(q => ({
        ...q,
        id: 'Q-' + Math.random().toString(36).substring(2, 9),
        question: q.question + " (Copy)"
      }));
      // Add new questions using addQuestion for each
      const addPromises = newQs.map(q => api.addQuestion(q));
      await Promise.all(addPromises);
      await fetchQuestions();
      setSelectedIds([]);
      alert("Questions duplicated successfully");
    } catch (err) {
      console.error("Failed to duplicate questions:", err);
      alert("Failed to duplicate questions");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkMove = async (targetPackage: string) => {
    if (selectedIds.length === 0) return;
    if (targetPackage === 'New') {
      const name = prompt("Enter new package name:");
      if (!name) return;
      if (!packages.includes(name) && !tempPackages.includes(name)) {
        setTempPackages(prev => [...prev, name]);
      }
      targetPackage = name;
    }
    if (!confirm(`Move ${selectedIds.length} questions to package "${targetPackage}"?`)) return;

    setIsLoading(true);
    try {
      const selectedQs = questions.filter(q => selectedIds.includes(q.id));
      const updatePromises = selectedQs.map(q =>
        api.updateQuestion({ ...q, package: targetPackage })
      );
      await Promise.all(updatePromises);
      await fetchQuestions();
      setSelectedIds([]);
      setFilterPackage(targetPackage);
      setHeaderPackageFilter(targetPackage);
      alert("Questions moved successfully");
    } catch (err: any) {
      console.error("Failed to move questions:", err);
      const message = err?.message || err?.toString() || '';
      if (message.toLowerCase().includes("could not find the 'package' column")) {
        setQuestions(prev => prev.map(q => selectedIds.includes(q.id) ? { ...q, package: targetPackage } : q));
        setSelectedIds([]);
        alert('Package column tidak tersedia, perubahan disimpan lokal saja.');
      } else {
        alert("Failed to move questions");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const allUniquePackages = Array.from(new Set([...packages, ...tempPackages])).filter(p => p !== 'All');
  const allUniqueSubjects = Array.from(new Set([...subjects, ...tempSubjects])).filter(s => s !== 'All');

  const handleCreatePackage = () => {
    const trimmed = newPackageName.trim();
    if (!trimmed) return alert('Package name cannot be empty');
    if (allUniquePackages.includes(trimmed)) return alert('Package already exists');

    setTempPackages(prev => [...prev, trimmed]);
    setNewPackageName('');
    setFilterPackage(trimmed);
    setSelectedIds([]);
    alert(`Package '${trimmed}' created. Select questions and click Move to assign.`);
  };

  const handleInlinePackageUpdate = async (q: Question, value: string) => {
    setIsLoading(true);
    try {
      await api.updateQuestion({ ...q, package: value });
      await fetchQuestions();
      alert('Question package updated successfully');
    } catch (err: any) {
      console.error('Failed to update question package:', err);
      const message = err?.message || err?.toString() || '';
      if (message.toLowerCase().includes("could not find the 'package' column")) {
        setQuestions(prev => prev.map(item => item.id === q.id ? { ...item, package: value } : item));
        alert('Package column tidak tersedia, perubahan disimpan lokal saja.');
      } else {
        alert(`Failed to update question package: ${message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const formatQuestionForExport = (q: Question): string => {
    const pkg = q.package || '';
    const subj = q.subject || '';
    const qText = (q.question || '').replace(/\|/g, ' ');
    const type = q.type || 'pilihan_ganda';

    const getOptText = (opt: any) => {
      if (typeof opt === 'object' && opt !== null) {
        return `${opt.text || ''}${opt.image ? `||${opt.image}` : ''}`;
      }
      return String(opt || '');
    };

    let fields: string[] = [];

    if (q.type === 'pilihan_ganda') {
      fields = [
        getOptText(q.option_a),
        getOptText(q.option_b),
        getOptText(q.option_c),
        getOptText(q.option_d),
        q.correct_answer || 'A',
        '' // Empty for PK/MCMA answer col
      ];
    } else {
      for (let i = 0; i < 3; i++) {
        const stmt = q.statements?.[i];
        if (stmt) {
          fields.push(stmt.text || '');
          if (q.type === 'pilihan_ganda_kompleks') {
            fields.push(stmt.isCorrect ? 'TRUE' : 'FALSE');
          } else {
            fields.push(stmt.correctAnswer || 'Tidak Sesuai');
          }
        } else {
          fields.push('', q.type === 'pilihan_ganda_kompleks' ? 'FALSE' : 'Tidak Sesuai');
        }
      }
    }
    
    return `${pkg}|${subj}|${qText}|${type}|${fields.join('|')}|${q.image || ''}`;
  };

  const handleDownloadPackage = () => {
    if (filteredQuestions.length === 0) {
      alert('No questions to download. Apply filters first.');
      return;
    }

    const header = 'package|subject|question|type|field1|field2|field3|field4|field5|field6|image';
    const lines = [header, ...filteredQuestions.map(formatQuestionForExport)];
    const content = lines.join('\n');

    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(content));
    const filename = `questions_export_${new Date().toISOString().split('T')[0]}.txt`;
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);

    alert(`Downloaded ${filteredQuestions.length} questions as ${filename}. This file can be re-imported using Bulk Add.`);
  };

  const handleDownloadCSV = () => {
    if (filteredQuestions.length === 0) {
      alert('No questions to download. Apply filters first.');
      return;
    }

    // Standard columns: package, subject, question, type, col4, col5, col6, col7, col8, col9, image
    // PG uses: col4-7 (opts), col8 (ans), col9 (empty)
    // PK/MCMA uses: col4-9 (s1_text, s1_ans, s2_text, s2_ans, s3_text, s3_ans)
    
    const csvRows = filteredQuestions.map(q => {
      let row = [
        q.package || 'Default',
        q.subject || 'Umum',
        q.question || '',
        q.type || 'pilihan_ganda'
      ];

      const getOptText = (opt: any) => {
        if (typeof opt === 'object' && opt !== null) {
          return `${opt.text || ''}${opt.image ? `||${opt.image}` : ''}`;
        }
        return String(opt || '');
      };

      if (q.type === 'pilihan_ganda') {
        row.push(
          getOptText(q.option_a),
          getOptText(q.option_b),
          getOptText(q.option_c),
          getOptText(q.option_d),
          q.correct_answer || 'A',
          '' // Column 9 is empty for PG
        );
      } else {
        // PK / MCMA
        for (let i = 0; i < 3; i++) {
          const stmt = q.statements?.[i];
          if (stmt) {
            row.push(stmt.text || '');
            if (q.type === 'pilihan_ganda_kompleks') {
              row.push(stmt.isCorrect ? 'TRUE' : 'FALSE');
            } else {
              row.push(stmt.correctAnswer || 'Tidak Sesuai');
            }
          } else {
            row.push('', q.type === 'pilihan_ganda_kompleks' ? 'FALSE' : 'Tidak Sesuai');
          }
        }
      }
      row.push(q.image || ''); // Column 10 (Image)
      
      return row.map(cell => {
        const str = String(cell);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      }).join(',');
    });

    const headers = ['package', 'subject', 'question', 'type', 'optA_or_s1text', 'optB_or_s1ans', 'optC_or_s2text', 'optD_or_s2ans', 'ansPG_or_s3text', 's3ans', 'image'];
    const content = [headers.join(','), ...csvRows].join('\n');
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(content));
    const filename = `questions_export_${new Date().toISOString().split('T')[0]}.csv`;
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);

    alert(`Downloaded ${filteredQuestions.length} questions as ${filename}. This file can be re-imported using Bulk Add.`);
  };

  const packageStats = allUniquePackages.map(p => ({
    name: p,
    count: questions.filter(q => q.package === p).length
  }));

  return (
    <AdminLayout>
      {/* --- Paket Soal Section --- */}
      <div className="mb-8 bg-[#f8fafc] p-4 rounded-lg">
        <h2 className="font-semibold text-xl mb-2">Paket Soal</h2>
        <div className="flex gap-4 items-center flex-wrap">
          <button onClick={() => setShowPaketForm(v => !v)} className="py-1 px-3 bg-[#2563eb] text-white border-none rounded font-medium">
            + Paket Baru
          </button>
          {paketList.map(paket => (
            <span
              key={paket.id}
              className={`py-1 px-3 rounded mr-2 cursor-pointer inline-flex items-center gap-1 ${
                selectedPaketId === paket.id
                  ? 'bg-[#2563eb] text-white'
                  : 'bg-[#e0e7ef] text-[#222]'
              }`}
              onClick={() => setSelectedPaketId(paket.id)}
            >
              {paket.name}
              <button onClick={e => { e.stopPropagation(); handleDeletePaket(paket.id); }} className="bg-transparent border-none text-danger ml-1 cursor-pointer" title="Hapus Paket">
                <Trash2 size={14} />
              </button>
            </span>
          ))}
        </div>
        {showPaketForm && (
          <form onSubmit={handleAddPaket} className="mt-3 flex gap-2 items-center">
            <input
              type="text"
              placeholder="Nama Paket"
              value={paketForm.name}
              onChange={e => setPaketForm(f => ({ ...f, name: e.target.value }))}
              className="p-1 rounded border border-[#ccc]"
              required
            />
            <input
              type="text"
              placeholder="Mapel (opsional)"
              value={paketForm.subject}
              onChange={e => setPaketForm(f => ({ ...f, subject: e.target.value }))}
              className="p-1 rounded border border-[#ccc]"
            />
            <button type="submit" className="py-1 px-3 bg-[#22c55e] text-white border-none rounded font-medium" disabled={paketLoading}>
              Simpan
            </button>
            <button type="button" onClick={() => setShowPaketForm(false)} className="py-1 px-3 bg-[#e0e7ef] text-[#222] border-none rounded font-medium">
              Batal
            </button>
          </form>
        )}
      </div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b-2 border-border pb-4 gap-4">
        <div>
          <h1 className="text-3xl font-black text-text-main flex items-center gap-3">
            <FileQuestion size={28} className="text-primary" /> Question Bank
          </h1>
          <p className="text-sm text-text-muted font-bold">Manage and organize your exam material</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button onClick={() => setShowBulkAdd(true)} className="btn btn-outline border-primary text-primary hover:bg-primary/5 shadow-sm flex-1 md:flex-none">
            <Upload size={20} /> Bulk Add
          </button>
          <button
            onClick={handleDownloadPackage}
            disabled={filteredQuestions.length === 0}
            className="btn btn-outline border-secondary text-secondary hover:bg-secondary/5 shadow-sm flex-1 md:flex-none disabled:opacity-50 disabled:cursor-not-allowed text-xs"
            title="Download as text format (for re-import)"
          >
            <Upload size={20} className="rotate-180" /> TXT
          </button>
          <button
            onClick={handleDownloadCSV}
            disabled={filteredQuestions.length === 0}
            className="btn btn-outline border-accent text-accent hover:bg-accent/5 shadow-sm flex-1 md:flex-none disabled:opacity-50 disabled:cursor-not-allowed text-xs"
            title="Download as CSV (for Excel/Sheets)"
          >
            <Upload size={20} className="rotate-180" /> CSV
          </button>
          <button
            onClick={() => {
              setEditingId(null);
              setFormData({
                ...initialFormData,
                package: filterPackage !== 'All' ? filterPackage : '',
                subject: filterSubject !== 'All' ? filterSubject : ''
              });
              setShowForm(true);
            }}
            className="btn btn-primary shadow-lg flex-1 md:flex-none"
          >
            <Plus size={20} /> Add Question
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-6 mb-8">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-black uppercase tracking-widest text-text-muted ml-1">Filter Subject</label>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {Array.from(new Set([...subjects, ...tempSubjects])).map(s => (
              <button
                key={s}
                onClick={() => {
                  setFilterSubject(s);
                  setSelectedIds([]);
                }}
                className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all border-2 ${filterSubject === s
                  ? 'bg-primary border-primary text-white shadow-md'
                  : 'bg-surface border-border text-text-muted hover:border-primary/50'
                  }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-black uppercase tracking-widest text-text-muted ml-1">Filter Package</label>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {Array.from(new Set([...packages, ...tempPackages])).map(p => (
              <button
                key={p}
                onClick={() => {
                  setFilterPackage(p);
                  setSelectedIds([]);
                }}
                className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all border-2 ${filterPackage === p
                  ? 'bg-secondary border-secondary text-white shadow-md'
                  : 'bg-surface border-border text-text-muted hover:border-secondary/50'
                  }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 border-t border-border/50 pt-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-text-muted">Sort By:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-surface border-2 border-border rounded-lg px-3 py-1 text-sm font-bold text-text-main focus:border-primary outline-none"
              title="Sort questions by"
            >
              <option value="none">Default (Custom Order)</option>
              <option value="package">Package Name</option>
              <option value="subject">Subject</option>
              <option value="question">Question Text</option>
            </select>
          </div>

          <div className="flex-1"></div>

          <div className="flex gap-3">
            <button
              onClick={toggleSelectAll}
              className="btn btn-outline bg-surface text-text-main border-border text-sm flex items-center gap-2"
            >
              {selectedIds.length === filteredQuestions.length && filteredQuestions.length > 0 ? <CheckSquare size={18} /> : <Square size={18} />}
              {selectedIds.length === filteredQuestions.length && filteredQuestions.length > 0 ? 'Deselect All' : 'Select All'}
            </button>

            <AnimatePresence>
              {selectedIds.length > 0 && (
                <button
                  onClick={handleBatchDelete}
                  className="btn bg-danger text-white text-sm flex items-center gap-2 animate-in slide-in-from-right-4"
                >
                  <Trash2 size={18} /> Delete ({selectedIds.length})
                </button>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>


      {showForm && (
        <div className="card bg-surface border-2 border-warning mb-8 animate-fade-in relative shadow-xl p-6">
          <button onClick={onCloseForm} className="absolute top-4 right-4 text-text-muted hover:text-danger">
            <X size={24} />
          </button>
          <h2 className="text-xl font-bold mb-6">{editingId ? 'Edit Question' : 'Create New Question'}</h2>

          <form onSubmit={handleSave} className="grid md:grid-cols-2 gap-x-6 gap-y-4">
            <div className="input-group">
              <label className="input-label" htmlFor="qb-package">Package Group</label>
              <input
                id="qb-package"
                type="text" className="input-field" placeholder="e.g. TO-1, Latihan-A"
                value={formData.package} onChange={e => setFormData({ ...formData, package: e.target.value })}
                title="Enter question package group"
              />
              <p className="text-xs text-text-muted mt-1">Group questions into packages/pakets</p>
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="qb-subject">Subject Category</label>
              <input
                id="qb-subject"
                type="text" className="input-field" placeholder="e.g. Mathematics, Science"
                value={formData.subject} onChange={e => setFormData({ ...formData, subject: e.target.value })}
                title="Enter subject category"
              />
              <p className="text-xs text-text-muted mt-1">Subject/category (Math, Bio, etc)</p>
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="qb-type">Question Type</label>
              <select
                id="qb-type"
                className="input-field"
                value={formData.type}
                onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                title="Select question type"
              >
                <option value="pilihan_ganda">PG - Pilihan Ganda (Single Choice A/B/C/D)</option>
                <option value="pilihan_ganda_kompleks">PK - Pilihan Ganda Kompleks (Choose 2 of 3)</option>
                <option value="multiple_choice_multiple_answer">MCMA - Multiple Choice (Sesuai/Tidak Sesuai)</option>
              </select>
              <p className="text-xs text-text-muted mt-1">PG: 4 options, 1 answer | PK: 3 statements, 2 correct | MCMA: 3 statements, S/T each</p>
            </div>

            <div className="input-group md:col-span-2">
              <label className="input-label">Question Text</label>
              <textarea
                className="input-field min-h-[100px]" placeholder="Type your full question here..."
                value={formData.question} onChange={e => setFormData({ ...formData, question: e.target.value })}
                title="Enter question text"
              />
            </div>

            <div className="input-group md:col-span-2">
              <label className="input-label">Image URL (Optional)</label>
              <input
                type="text" className="input-field" placeholder="https://example.com/image.jpg"
                value={formData.image || ''} onChange={e => setFormData({ ...formData, image: e.target.value })}
                title="Enter image URL (optional)"
              />
              {formData.image && (
                <div className="mt-2 p-2 border border-border rounded-lg bg-background inline-block">
                  <img src={formData.image} alt="Preview" className="max-h-32 rounded object-contain" />
                </div>
              )}
            </div>

            {formData.type === 'pilihan_ganda' && (
              <>
                {["A", "B", "C", "D"].map((opt, idx) => {
                  const key = `option_${opt.toLowerCase()}`;
                  const value = formData[key] || { text: '', image: '' };
                  return (
                    <div className="input-group" key={key}>
                      <label className="input-label" htmlFor={`qb-opt-${opt}`}>{`Option ${opt}`}</label>
                      <input
                        id={`qb-opt-${opt}`}
                        type="text"
                        className="input-field border-primary/30 mb-1"
                        value={value.text || ''}
                        onChange={e => setFormData({ ...formData, [key]: { ...value, text: e.target.value } })}
                        title={`Option ${opt} text`}
                        placeholder={`Answer choice ${opt}`}
                      />
                      <input
                        type="text"
                        className="input-field border-primary/30 mb-1"
                        value={value.image || ''}
                        onChange={e => setFormData({ ...formData, [key]: { ...value, image: e.target.value } })}
                        title={`Option ${opt} image URL`}
                        placeholder={`Image URL for option ${opt} (optional)`}
                      />
                      {value.image && (
                        <div className="mt-1 p-1 border border-border rounded bg-background inline-block">
                          <img src={value.image} alt={`Option ${opt} preview`} className="max-h-20 rounded object-contain" />
                        </div>
                      )}
                    </div>
                  );
                })}
                <div className="input-group md:col-span-2">
                  <label className="input-label" htmlFor="qb-correct">Correct Answer</label>
                  <select
                    id="qb-correct"
                    className="input-field text-lg font-bold bg-secondary/10 border-secondary/50 text-secondary"
                    value={formData.correct_answer}
                    onChange={e => setFormData({ ...formData, correct_answer: e.target.value as 'A' | 'B' | 'C' | 'D' })}
                    title="Select the correct option"
                  >
                    <option value="A">Choice A</option>
                    <option value="B">Choice B</option>
                    <option value="C">Choice C</option>
                    <option value="D">Choice D</option>
                  </select>
                </div>
              </>
            )}

            {(formData.type === 'pilihan_ganda_kompleks' || formData.type === 'multiple_choice_multiple_answer') && (
              <div className="md:col-span-2 space-y-4">
                <label className="input-label">Statements (3 total)</label>
                {formData.statements?.map((s, i) => (
                  <div key={i} className="flex gap-4 items-center bg-background/30 p-3 rounded-lg border border-border">
                    <span className="font-bold text-primary">{i + 1}.</span>
                    <input
                      id={`qb-stmt-${i}`}
                      type="text" className="input-field flex-1" placeholder={`Statement ${i + 1}`}
                      value={s.text} onChange={e => updateStatement(i, 'text', e.target.value)}
                      title={`Statement ${i + 1} text`}
                    />
                    {formData.type === 'pilihan_ganda_kompleks' ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox" className="w-5 h-5"
                          checked={s.isCorrect} onChange={e => updateStatement(i, 'isCorrect', e.target.checked)}
                          aria-label={`Statement ${i + 1} is correct`}
                          title={`Mark statement ${i + 1} as correct`}
                        />
                        <span className="text-xs font-bold">Benar</span>
                      </div>
                    ) : (
                      <select
                        className="input-field w-32"
                        value={s.correctAnswer} onChange={e => updateStatement(i, 'correctAnswer', e.target.value)}
                        title={`Correct answer for statement ${i + 1}`}
                      >
                        <option value="Sesuai">Sesuai</option>
                        <option value="Tidak Sesuai">Tidak Sesuai</option>
                        <option value="Benar">Benar</option>
                        <option value="Salah">Salah</option>
                      </select>
                    )}
                  </div>
                ))}
              </div>
            )}

            <button type="submit" className="btn btn-warning md:col-span-2 text-white text-lg py-3 mt-4">
              {editingId ? 'Update Question' : 'Save New Question'}
            </button>
          </form>
        </div>
      )}

      <div className="card bg-surface p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Filter size={20} className="text-primary" />
            {filterSubject === 'All' && filterPackage === 'All' ? 'All Questions' :
              `${filterSubject !== 'All' ? filterSubject : ''} ${filterPackage !== 'All' ? `[${filterPackage}]` : ''} Questions`}
            ({filteredQuestions.length})
            {isLoading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary ml-2"></div>}
          </h2>          <div className="mt-4 flex flex-wrap items-center gap-2">
            <input
              type="text"
              className="input-field w-full sm:w-72"
              placeholder="New Package Name"
              value={newPackageName}
              onChange={e => setNewPackageName(e.target.value)}
              title="Create a package label for grouping questions"
            />
            <button
              onClick={handleCreatePackage}
              className="btn btn-secondary py-2 px-4 text-sm"
            >
              Create Package
            </button>
            <span className="text-xs text-text-muted">When created, assign questions with bulk move or inline select below.</span>
          </div>          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
            <input
              type="text"
              placeholder="Search questions..."
              className="input-field pl-9 py-2 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              title="Search by question text, package, or subject"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-danger"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Package Summary Bar */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-none">
          {packageStats.map(ps => (
            <button
              key={ps.name}
              onClick={() => setFilterPackage(ps.name)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border-2 whitespace-nowrap transition-all ${filterPackage === ps.name ? 'border-secondary bg-secondary/10 text-secondary' : 'border-border bg-background hover:border-secondary/30'
                }`}
            >
              <Layers size={14} />
              <span className="text-xs font-black uppercase">{ps.name}</span>
              <span className="text-[10px] bg-secondary/20 px-1.5 rounded-full font-bold">{ps.count}</span>
            </button>
          ))}
          <button
            onClick={() => {
              const name = prompt("Enter new package name:");
              if (name) {
                if (!packages.includes(name) && !tempPackages.includes(name)) {
                  setTempPackages(prev => [...prev, name]);
                }
                setFilterPackage(name);
                setSelectedIds([]);
              }
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border-2 border-dashed border-border bg-background hover:border-primary/50 text-text-muted hover:text-primary transition-all whitespace-nowrap font-bold"
          >
            <Plus size={14} />
            <span className="text-xs uppercase">Create New Package View</span>
          </button>
        </div>

        {/* Bulk Actions Bar */}
        <AnimatePresence>
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-4 p-4 mb-4 bg-primary/5 border-2 border-primary/20 rounded-xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
              <span className="text-sm font-black text-primary uppercase tracking-widest">{selectedIds.length} Selected</span>
              <div className="h-6 w-[2px] bg-primary/20 mx-2" />
              <div className="flex gap-2 flex-wrap flex-1">
                <select
                  onChange={(e) => handleBulkMove(e.target.value)}
                  value=""
                  className="input-field py-1 px-3 text-xs w-auto bg-white border-primary/30 text-primary font-bold shadow-sm"
                  title="Move selected questions to a package"
                >
                  <option value="" disabled>Move to Package...</option>
                  {allUniquePackages.map(p => <option key={p} value={p}>{p}</option>)}
                  <option value="New">+ Add New Package</option>
                </select>
                <select
                  onChange={(e) => handleBulkSubjectChange(e.target.value)}
                  value=""
                  className="input-field py-1 px-3 text-xs w-auto bg-white border-primary/30 text-primary font-bold shadow-sm"
                  title="Change subject of selected questions"
                >
                  <option value="" disabled>Change Subject...</option>
                  {allUniqueSubjects.map(s => <option key={s} value={s}>{s}</option>)}
                  <option value="New">+ Add New Subject</option>
                </select>
                <button
                  onClick={handleBulkDuplicate}
                  className="flex items-center gap-2 px-3 py-1 text-xs font-bold text-secondary hover:bg-secondary/10 rounded-lg transition-colors border border-secondary/20"
                  title="Duplicate selected questions"
                >
                  <Copy size={14} /> Duplicate Selected
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="flex items-center gap-2 px-3 py-1 text-xs font-bold text-danger hover:bg-danger/10 rounded-lg transition-colors border border-danger/20"
                  title="Permanently delete selected questions"
                >
                  <Trash2 size={14} /> Delete Selected
                </button>
                <button
                  onClick={() => setSelectedIds([])}
                  className="text-xs font-bold text-text-muted hover:underline"
                >Cancel</button>
              </div>
            </div>
          )}
        </AnimatePresence>

        <div className="overflow-x-auto rounded-xl border-2 border-border bg-background/50">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-surface border-b-2 border-border text-text-muted uppercase tracking-widest text-[10px] font-black">
                <th className="p-4 w-12 text-center">
                  <button onClick={toggleSelectAll} className="text-text-muted hover:text-primary transition-colors">
                    {selectedIds.length === filteredQuestions.length && filteredQuestions.length > 0 ? <CheckSquare size={20} /> : <Square size={20} />}
                  </button>
                </th>
                <th className="p-4 w-16 text-center">No</th>
                <th className="p-4 w-32 cursor-pointer" onClick={() => toggleTableSort('package')}>
                  Package
                  <span className="ml-1 align-middle">
                    {tableSortField === 'package' ? (tableSortDir === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : <ChevronsUpDown size={12} />}
                  </span>
                </th>
                <th className="p-4 w-32 cursor-pointer" onClick={() => toggleTableSort('subject')}>
                  Subject
                  <span className="ml-1 align-middle">
                    {tableSortField === 'subject' ? (tableSortDir === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : <ChevronsUpDown size={12} />}
                  </span>
                </th>
                <th className="p-4 cursor-pointer" onClick={() => toggleTableSort('question')}>
                  Question
                  <span className="ml-1 align-middle">
                    {tableSortField === 'question' ? (tableSortDir === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : <ChevronsUpDown size={12} />}
                  </span>
                </th>
                <th className="p-4 w-32 cursor-pointer" onClick={() => toggleTableSort('type')}>
                  Type
                  <span className="ml-1 align-middle">
                    {tableSortField === 'type' ? (tableSortDir === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : <ChevronsUpDown size={12} />}
                  </span>
                </th>
                <th className="p-4 w-32 text-right">Actions</th>
              </tr>
              <tr className="bg-background text-text-muted text-[11px]">
                <th></th>
                <th></th>
                <th className="p-2">
                  <select value={headerPackageFilter} onChange={e => setHeaderPackageFilter(e.target.value)} className="input-field w-full text-xs" aria-label="Filter by package">
                    <option value="All">All</option>
                    {allUniquePackages.map(pkg => <option key={pkg} value={pkg}>{pkg}</option>)}
                  </select>
                </th>
                <th className="p-2">
                  <select value={headerSubjectFilter} onChange={e => setHeaderSubjectFilter(e.target.value)} className="input-field w-full text-xs" aria-label="Filter by subject">
                    <option value="All">All</option>
                    {allUniqueSubjects.map(subj => <option key={subj} value={subj}>{subj}</option>)}
                  </select>
                </th>
                <th className="p-2">
                  <input type="text" value={headerQuestionSearch} onChange={e => setHeaderQuestionSearch(e.target.value)} placeholder="Search question..." className="input-field w-full text-xs" />
                </th>
                <th></th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredQuestions.length > 0 ? (
                filteredQuestions.map((q, idx) => (
                  <tr
                    key={q.id}
                    className={`border-b border-border transition-colors hover:bg-primary/5 ${selectedIds.includes(q.id) ? 'bg-primary/10' : ''
                      }`}
                  >
                    <td className="p-4 text-center">
                      <button
                        onClick={() => toggleSelect(q.id)}
                        className={`transition-colors ${selectedIds.includes(q.id) ? 'text-primary' : 'text-text-muted hover:text-primary'}`}
                      >
                        {selectedIds.includes(q.id) ? <CheckSquare size={20} /> : <Square size={20} />}
                      </button>
                    </td>
                    <td className="p-4 text-center font-bold text-text-muted">{idx + 1}</td>
                    <td className="p-4">
                      <select
                        value={q.package || ''}
                        onChange={e => handleInlinePackageUpdate(q, e.target.value)}
                        className="input-field h-8 w-full text-xs"
                        title="Assign question to package"
                      >
                        <option value="">No Package</option>
                        {allUniquePackages.map(pkg => (
                          <option key={pkg} value={pkg}>{pkg}</option>
                        ))}
                      </select>
                      {selectedPaketId && (
                        paketQuestions.some(pq => pq.id === q.id)
                          ? <button onClick={() => handleRemoveQuestionFromPaket(q.id)} title="Hapus dari paket" className="ml-2 text-danger border-none bg-transparent cursor-pointer"><Trash2 size={16} /></button>
                          : <button onClick={() => handleAddQuestionToPaket(q.id)} title="Tambah ke paket" className="ml-2 text-secondary border-none bg-transparent cursor-pointer"><Plus size={16} /></button>
                      )}
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-1 rounded bg-primary/10 text-primary text-[10px] font-black uppercase border border-primary/20">
                        {q.subject}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1">
                        <p className="font-bold text-text-main text-sm line-clamp-1" title={q.question}>{q.question}</p>
                        <div className="flex gap-2">
                          {q.image && (
                            <span className="text-[9px] text-primary flex items-center gap-1 font-black uppercase">
                              <Layers size={10} /> Image
                            </span>
                          )}
                          <span className="text-[9px] text-text-muted font-bold uppercase truncate max-w-[200px]">
                            {q.type === 'pilihan_ganda' 
                              ? `${typeof q.option_a === 'object' ? (q.option_a as any).text : q.option_a}, ${typeof q.option_b === 'object' ? (q.option_b as any).text : q.option_b}...`
                              : `${q.statements?.length} Statement`}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-[10px] font-black bg-accent/10 text-accent border border-accent/20 px-2 py-1 rounded uppercase">
                        {q.type === 'pilihan_ganda' ? 'Single' :
                          q.type === 'pilihan_ganda_kompleks' ? 'Kompleks' : 'MCMA'}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => handleEdit(q)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:bg-warning/10 hover:text-warning transition-colors"
                          title="Edit"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(q.id)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:bg-danger/10 hover:text-danger transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-text-muted font-bold italic">
                    No questions found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* Bulk Add Modal */}
      {showBulkAdd && (
        <div className="fixed inset-0 bg-text-main/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in text-text-main">
          <div className="card bg-surface max-w-4xl w-full border-4 border-primary shadow-2xl relative">
            <button onClick={() => setShowBulkAdd(false)} className="absolute top-4 right-4 text-text-muted hover:text-danger">
              <X size={24} />
            </button>
            <h2 className="text-2xl font-black mb-4 flex items-center gap-2">
              <Upload className="text-primary" /> Bulk Import Questions
            </h2>
            <p className="text-sm text-text-muted mb-4 font-bold">
              Paste from Excel/Sheets (Tab, Pipe |, or Comma separator). Format matches table columns &amp; download CSV.&#10;
              <span className="block mt-2 text-primary bg-primary/10 p-2 rounded text-xs font-mono">
                <strong>Base format:</strong> package | subject | question | type | [type-specific fields] | image
              </span>
              <span className="block text-xs mt-2 text-text-muted">
                <strong>PG (Pilihan Ganda):</strong> package | subject | question | PG | optA (teks||url_gambar) | optB (teks||url_gambar) | optC (teks||url_gambar) | optD (teks||url_gambar) | answer(A/B/C/D) | [image]<br />
                <strong>PK (Pilihan Ganda Kompleks):</strong> package | subject | question | PK | s1_text | s1(TRUE/FALSE) | s2_text | s2(TRUE/FALSE) | s3_text | s3(TRUE/FALSE) | [image]<br />
                <strong>MCMA (Sesuai/Tidak Sesuai):</strong> package | subject | question | MCMA | s1_text | s1(S/T) | s2_text | s2(S/T) | s3_text | s3(S/T) | [image]
              </span>
            </p>
            <textarea
              className="input-field h-80 font-mono text-xs mb-6"
              placeholder="Default|Math|1+1=?|PG|1||https://img.com/1.png|2||https://img.com/2.png|3||https://img.com/3.png|4||https://img.com/4.png|B|&#10;Default|Bio|Plant facts|PK|Has leaves|TRUE|Needs water|TRUE|Can move|FALSE|&#10;Default|IPA|Energy types|MCMA|Heat exists|S|Sound moves|S|Light stops|T|"
              value={bulkText}
              onChange={e => setBulkText(e.target.value)}
              title="Paste your questions here - matches downloadable CSV format"
            />
            <div className="flex gap-4">
              <button
                onClick={() => setShowBulkAdd(false)}
                className="btn btn-outline flex-1 py-4 font-black uppercase tracking-widest text-xs"
              >Cancel</button>
              <button
                onClick={handleBulkAdd}
                disabled={isLoading || !bulkText.trim()}
                className="btn btn-primary flex-1 py-4 font-black uppercase tracking-widest text-xs"
              >
                {isLoading ? 'Processing...' : `Add ${bulkText.split('\n').filter(l => l.trim()).length} Questions`}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default QuestionBank;
