const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const http = require('http');
const { Server } = require('socket.io');

const { sequelize, User, Group } = require('./models');
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
  // ... socket events
});

const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use('/api', routes);

app.use((err, req, res, next) => {
  console.error(' [Global Error] ', err.stack);
  res.status(500).json({ success: false, error: 'Internal Server Error' });
});

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected successfully.');

    // sync() 사용하여 테이블 생성/유지
    await sequelize.sync(); 
    console.log('✅ Database models synchronized.');

    const adminPassword = await bcrypt.hash('admin1234', 10);

    // 1. 테스트용 기관 계정 생성
    const [testInst] = await User.findOrCreate({
      where: { login_id: 'yummy_inst' },
      defaults: {
        password: adminPassword,
        username: '야미 교육센터',
        email: 'center@yummy.com',
        role: 'institution',
        organization_name: '야미 아카데미',
        privacy_consent: true,
        third_party_consent: true
      }
    });

    // 2. 해당 기관의 테스트 그룹 생성
    await Group.findOrCreate({
      where: { name: '웹 개발 1기', institution_id: testInst.id },
      defaults: { name: '웹 개발 1기', institution_id: testInst.id }
    });

    // 3. 기존 관리자 계정
    await User.findOrCreate({ 
      where: { login_id: 'admin' }, 
      defaults: { 
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
