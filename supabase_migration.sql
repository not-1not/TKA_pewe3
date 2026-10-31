-- ==========================================
-- SUPABASE COMPLETE SCHEMA - MIGRATION 2
-- ==========================================

-- 1. Create table 'students'
CREATE TABLE IF NOT EXISTS public.students (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT,
    name TEXT NOT NULL,
    school TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create table 'tokens'
CREATE TABLE IF NOT EXISTS public.tokens (
    id TEXT PRIMARY KEY,
    token TEXT UNIQUE NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "questionCount" INTEGER NOT NULL,
    subject TEXT,
    "package" TEXT,
    active BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create table 'results'
CREATE TABLE IF NOT EXISTS public.results (
    id TEXT PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "studentName" TEXT NOT NULL,
    school TEXT,
    correct INTEGER NOT NULL,
    wrong INTEGER NOT NULL,
    score NUMERIC NOT NULL,
    timestamp TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create table 'exam_states'
CREATE TABLE IF NOT EXISTS public.exam_states (
    "studentId" TEXT PRIMARY KEY,
    "tokenId" TEXT NOT NULL,
    "endTime" BIGINT,
    "startTime" BIGINT,
    answers JSONB DEFAULT '{}'::jsonb,
    doubt JSONB DEFAULT '{}'::jsonb,
    "questionOrder" JSONB DEFAULT '[]'::jsonb,
    "optionOrder" JSONB DEFAULT '{}'::jsonb,
    submitted BOOLEAN DEFAULT false,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create table 'questions'
CREATE TABLE IF NOT EXISTS public.questions (
    id TEXT PRIMARY KEY,
    subject TEXT,
    "package" TEXT,
    question TEXT NOT NULL,
    type TEXT NOT NULL,
    image TEXT,
    options JSONB,
    answer TEXT,
    materi_id TEXT,
    is_deleted BOOLEAN DEFAULT false,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Migrasi tambahan untuk tabel questions jika sudah ada:
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS materi_id TEXT;

-- ==========================================
-- (Optional) If you want to allow anonymous access 
-- without strict Row Level Security (RLS) policies for now.
-- Run these to ensure the APIs can read/write data freely:
-- ==========================================
ALTER TABLE public.questions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.students DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tokens DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.results DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_states DISABLE ROW LEVEL SECURITY;

