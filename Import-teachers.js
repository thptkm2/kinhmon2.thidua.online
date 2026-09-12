const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const csv = require('csv-parser');
const fetch = require('node-fetch'); // Thêm thư viện fetch tương thích

const SUPABASE_URL = 'https://qrgwuxargwbrdjvodnjd.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'sb_secret_kz9TV5homsqLMSwmt8vOMQ_D0eBrmKn'; 

// Khởi tạo client sử dụng custom fetch
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { fetch: fetch }
});

async function importTeachers() {
    const teachers = [];

    console.log("📂 Đang đọc file giaovien.csv...");
    
    if (!fs.existsSync('giaovien.csv')) {
        console.error("❌ Không tìm thấy file giaovien.csv trong thư mục!");
        return;
    }

    fs.createReadStream('giaovien.csv')
        .pipe(csv())
        .on('data', (row) => teachers.push(row))
        .on('end', async () => {
            console.log(`🚀 Bắt đầu import ${teachers.length} giáo viên...\n`);
            
            let success = 0, fail = 0;

            for (const gv of teachers) {
                const { data, error } = await supabase.auth.admin.createUser({
                    email: gv.email.trim(),
                    password: gv.password.trim(),
                    email_confirm: true,
                    user_metadata: {
                        teacher_code: gv.teacher_code,
                        full_name: gv.full_name,
                        role: gv.role ? gv.role.trim() : 'TEACHER',
                        department_id: parseInt(gv.department_id)
                    }
                });

                if (error) {
                    console.error(`❌ Lỗi [${gv.teacher_code} - ${gv.full_name}]:`, error.message);
                    fail++;
                } else {
                    console.log(`✅ Thành công: ${gv.teacher_code} - ${gv.full_name}`);
                    success++;
                }
            }

            console.log(`\n====================================`);
            console.log(`🎉 HOÀN TẤT! Thành công: ${success}/${teachers.length} | Thất bại: ${fail}/${teachers.length}`);
            console.log(`====================================`);
        });
}

importTeachers();