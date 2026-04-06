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
  socket.on('join', ({ userId, cohortId }) => {
    socket.join(`user_${userId}`);
    if (cohortId) {
      socket.join(`cohort_${cohortId}`);
      console.log(`📡 Socket: User ${userId} joined cohort_${cohortId} room.`);
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

    // sync() 사용하여 테이블 생성/유지 (constraints: false → 공유 DB FK 타입 충돌 방지)
    await sequelize.sync({ constraints: false });
    console.log('✅ Database models synchronized.');

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
        institution_id: testInst.id,
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
        institution_id: testInst.id,
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
