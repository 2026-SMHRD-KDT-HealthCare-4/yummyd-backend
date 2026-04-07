const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const http = require('http');
const { Server } = require('socket.io');

const { sequelize, User, Class, Institution } = require('./models');
const routes = require('./routes');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

app.set('socketio', io);

io.on('connection', (socket) => {
  socket.on('join', ({ userId, classId }) => {
    socket.join(`user_${userId}`);
    if (classId) {
      socket.join(`class_${classId}`);
      console.log(`📡 Socket: User ${userId} joined class_${classId} room.`);
    }
  });
});

const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use('/api', routes);

app.use((err, req, res, next) => {
  console.error(' [Global Error] ', err.stack);
  res.status(500).json({ success: false, error: 'Internal Server Error' });
});

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected successfully.');

    // sync() 제거 — 공유 DB에서 팀원 서버 시작 시 테이블 자동 재생성 방지
    // DB 구조 변경 필요 시 직접 SQL로 수동 실행할 것

    // daily_candy_count, last_candy_date 컬럼 없으면 추가 (MySQL 버전 호환)
    const addColumnIfMissing = async (column, definition) => {
      const [rows] = await sequelize.query(
        `SHOW COLUMNS FROM \`Users\` LIKE '${column}'`
      );
      if (rows.length === 0) {
        await sequelize.query(`ALTER TABLE \`Users\` ADD COLUMN \`${column}\` ${definition}`);
        console.log(`✅ Users.${column} 컬럼 추가 완료`);
      }
    };
    await addColumnIfMissing('daily_candy_count', 'INT DEFAULT 0');
    await addColumnIfMissing('last_candy_date', 'DATE DEFAULT NULL');

    const adminPassword = await bcrypt.hash('admin1234', 10);

    // 1. 테스트용 기관 계정 생성 (Institution 테이블)
    const [testInst] = await Institution.findOrCreate({
      where: { login_id: 'yummy_inst' },
      defaults: {
        login_id: 'yummy_inst',
        password: adminPassword,
        inst_name: '야미 아카데미',
        email: 'center@yummy.com',
        subscription_status: 'enterprise'
      }
    });

    // 2. 해당 기관의 테스트 클래스 생성
    const [testClass] = await Class.findOrCreate({
      where: { class_name: '웹 개발 1기', institution_id: testInst.id },
      defaults: { class_name: '웹 개발 1기', institution_id: testInst.id }
    });

    const studentPassword = await bcrypt.hash('student1234', 10);

    // 3. 테스트용 수강생 계정 생성 (student/student1234)
    await User.findOrCreate({
      where: { login_id: 'student' },
      defaults: {
        login_id: 'student',
        password: studentPassword,
        username: '테스트 학생',
        email: 'student@yummy.com',
        role: 'student',
        class_id: testClass.id,
        privacy_consent: true,
        third_party_consent: true
      }
    });

    // 4. 기존 관리자 계정 (admin/admin1234)
    await User.findOrCreate({ 
      where: { login_id: 'admin' }, 
      defaults: { 
        login_id: 'admin',
        password: adminPassword,
        username: '관리자',
        email: 'admin@yummy.com',
        role: 'instructor',
        privacy_consent: true,
        third_party_consent: true
      } 
    });

    console.log('👤 Seed Data Verified.');

    server.listen(PORT, () => {
      console.log(`🚀 Backend Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Server Startup Failed:', error);
    process.exit(1);
  }
};

startServer();