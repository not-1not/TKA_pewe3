-- ==========================================
-- SUPABASE COMPLETE SCHEMA - FULL SETUP
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- This script is idempotent (safe to run multiple times)
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
    "resultsVisible" BOOLEAN DEFAULT false,
    allowed_subjects JSONB DEFAULT '[]'::jsonb,
    allowed_packages JSONB DEFAULT '[]'::jsonb,
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
    "tokenId" TEXT,
    token TEXT,
    details TEXT,
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Create table 'materi'
CREATE TABLE IF NOT EXISTS public.materi (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Create table 'paket_soal'
CREATE TABLE IF NOT EXISTS public.paket_soal (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    subject TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Create table 'paket_soal_questions' (junction table)
CREATE TABLE IF NOT EXISTS public.paket_soal_questions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    paket_id TEXT NOT NULL REFERENCES public.paket_soal(id) ON DELETE CASCADE,
    question_id TEXT NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
    UNIQUE(paket_id, question_id)
);

-- ==========================================
-- Add missing columns (safe to run if they already exist)
-- ==========================================

-- Add columns to tokens if missing
DO $$ BEGIN
    ALTER TABLE public.tokens ADD COLUMN IF NOT EXISTS "resultsVisible" BOOLEAN DEFAULT false;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE public.tokens ADD COLUMN IF NOT EXISTS allowed_subjects JSONB DEFAULT '[]'::jsonb;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE public.tokens ADD COLUMN IF NOT EXISTS allowed_packages JSONB DEFAULT '[]'::jsonb;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Add columns to results if missing
DO $$ BEGIN
    ALTER TABLE public.results ADD COLUMN IF NOT EXISTS "tokenId" TEXT;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE public.results ADD COLUMN IF NOT EXISTS token TEXT;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE public.results ADD COLUMN IF NOT EXISTS details TEXT;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Add all potentially missing columns to questions
DO $$ BEGIN
    ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS subject TEXT;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS "package" TEXT;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS image TEXT;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS options JSONB;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS answer TEXT;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS materi_id TEXT;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ==========================================
-- Disable Row Level Security for development
-- (Enable and add policies before going to production!)
-- ==========================================
ALTER TABLE public.students DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tokens DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.results DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_states DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.materi DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.paket_soal DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.paket_soal_questions DISABLE ROW LEVEL SECURITY;

-- ==========================================
-- Grant access to anon and authenticated roles
-- ==========================================
GRANT ALL ON public.students TO anon, authenticated;
GRANT ALL ON public.tokens TO anon, authenticated;
GRANT ALL ON public.results TO anon, authenticated;
GRANT ALL ON public.exam_states TO anon, authenticated;
GRANT ALL ON public.questions TO anon, authenticated;
GRANT ALL ON public.materi TO anon, authenticated;
GRANT ALL ON public.paket_soal TO anon, authenticated;
GRANT ALL ON public.paket_soal_questions TO anon, authenticated;
