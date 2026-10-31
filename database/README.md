# 🛡️ Panduan Manajemen & Cadangan Database Soal (TKA CBT)

Sistem database soal ini dirancang dengan pendekatan **Hybrid Anti-Rusak & Anti-Terhapus**:
1. **Online (Supabase PostgreSQL)**: Aman, tahan benturan beban banyak siswa (*concurrent*), dan tidak mudah rusak.
2. **Soft Delete (Tong Sampah)**: Soal yang dihapus tidak langsung hilang permanen, melainkan masuk ke "Tong Sampah" dan bisa dipulihkan kapan saja.
3. **Penyimpanan Lokal (Folder Aplikasi & One-Click Backup)**: Anda dapat mengunduh seluruh master soal ke file `.json` dan menyimpannya di folder ini atau di komputer Anda.

---

## 📁 Struktur Direktori Cadangan Lokal

```
database/
├── backup_master/
│   └── soal_master_default.json    <-- Master contoh bank soal (bisa di-restore kapan saja)
├── supabase_full_setup.sql         <-- Skrip SQL lengkap untuk Supabase
└── supabase_migration.sql          <-- Skrip migrasi kolom soft delete
```

---

## ⚡ Cara Menjalankan Migrasi di Supabase (Jika Diperlukan)

Jika kolom `is_deleted` belum ada di database Supabase Anda, jalankan query berikut di **Supabase Dashboard → SQL Editor**:

```sql
-- Tambahkan dukungan Tong Sampah (Soft Delete)
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS materi_id TEXT;
```

---

## 🚀 Fitur Pengelolaan Bank Soal di Aplikasi

1. **Tombol "Cadangkan (.json)"**:
   * Terdapat di pojok kanan atas halaman **Bank Soal**.
   * Klik tombol ini untuk mengunduh seluruh soal beserta paket dan materinya ke dalam file `.json`.
   * Simpan file hasil cadangan ke folder `database/backup_master/` atau Google Drive Anda.

2. **Tombol "Pulihkan (.json)"**:
   * Klik tombol ini dan pilih file cadangan `.json` (misalnya file `soal_master_default.json`).
   * Tersedia 2 mode pemulihan:
     * **Gabungkan / Merge (Disarankan)**: Menambahkan soal baru tanpa menghapus soal yang sudah ada.
     * **Gantikan Semua / Replace**: Mengganti seluruh isi bank soal dengan isi file cadangan.

3. **Tombol "Tong Sampah"**:
   * Jika tidak sengaja menghapus soal dari tabel utama, soal tersebut berpindah ke Tong Sampah.
   * Di dalam Tong Sampah, Anda bisa:
     * **Pulihkan Soal (*Restore*)**: Mengembalikan soal ke bank soal aktif.
     * **Hapus Permanen**: Menghapus selamanya hanya jika Anda sudah 100% yakin.
     * **Kosongkan Tong Sampah**: Membersihkan seluruh soal yang ada di tong sampah.
