const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// =================== UBAH BAGIAN INI ===================
const supabaseUrl = 'https://edamgoptfzcaxmyiribw.supabase.co'; // Pastikan tidak ada /rest/v1/ di belakangnya
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkYW1nb3B0ZnpjYXhteWlyaWJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMyMDM5NzgsImV4cCI6MjEwODc3OTk3OH0.j_qHJSKHeHUPr7XmdPZlNpXjzWVxEvA0jSmd3LyHLbM';
// =======================================================

const supabase = createClient(supabaseUrl, supabaseKey);

app.get('/', (req, res) => {
    res.send('Mantap! Server VISTA + Supabase sudah menyala.');
});

app.post('/rfid', async (req, res) => {
    const rfid_uid = req.body.cardUid.trim().toUpperCase();
    console.log('Mengecek UID kartu di Supabase:', rfid_uid);

    try {
        const { data, error } = await supabase
            .from('siswa')
            .select('*')
            .eq('uid', rfid_uid)
            .single();

        if (data) {
            if (data.tuntas_penjajakan === false || data.syarat_asas === false) {
                console.log('Status ditolak: Syarat ujian belum lengkap.');
                res.json({ ok: false, message: "BLM SYARAT" });
            } else {
                console.log('Status diterima: Syarat lengkap.');
                
                // --- FITUR BARU: MENCATAT RIWAYAT TAP KE DATABASE ---
                await supabase.from('absensi').insert([
                    { uid_siswa: rfid_uid, mode_alat: 'PENJAJAKAN', ruang: 'LAB KOMPUTER' }
                ]);
                console.log('Riwayat tap berhasil disimpan ke Supabase!');
                // ----------------------------------------------------

                res.json({ ok: true, student: { name: data.nama } });
            }
        } else {
            console.log('Kartu tidak terdaftar ditolak.');
            res.json({ ok: false, message: "KARTU TDK ADA" });
        }
    } catch (err) {
        console.error('Error saat menghubungi database:', err);
        res.json({ ok: false, message: "SERVER DB LAMBAT" });
    }
});

app.listen(PORT, () => {
    console.log(`Server VISTA berjalan di http://localhost:${PORT}`);
});