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

// 블라블라캔디 서버 메모리 저장소 (class_id → posts[])
const candyBoards = {};

io.on('connection', (socket) => {
  socket.on('join', ({ userId, classId }) => {
    socket.join(`user_${userId}`);
    if (classId) {
      socket.join(`class_${classId}`);
      console.log(`📡 Socket: User ${userId} joined class_${classId} room.`);
      // 접속 시 현재 게시판 데이터 전달
      const posts = candyBoards[classId] || [];
      socket.emit('candy_board_init', posts);
    }
  });

  // 캔디 던지기 (새 글 작성)
  socket.on('candy_post', ({ classId, post }) => {
    if (!classId || !post) return;
    if (!candyBoards[classId]) candyBoards[classId] = [];
    const newPost = {
      id: Date.now(),
      text: post.text,
      avatarUrl: post.avatarUrl || null,
      authorLabel: post.authorLabel || '유리병',
      likes: 0,
      likedBy: [],
      createdAt: new Date().toISOString(),
    };
    candyBoards[classId].unshift(newPost);
    // 최대 50개 유지
    if (candyBoards[classId].length > 50) candyBoards[classId].pop();
    io.to(`class_${classId}`).emit('candy_post_new', newPost);
  });

  // 하트 누르기
  socket.on('candy_like', ({ classId, postId, userId }) => {
    if (!classId || !postId || !userId) return;
    const posts = candyBoards[classId];
    if (!posts) return;
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    if (post.likedBy.includes(userId)) {
      post.likedBy = post.likedBy.filter(id => id !== userId);
    } else {
      post.likedBy.push(userId);
    }
    post.likes = post.likedBy.length;
    io.to(`class_${classId}`).emit('candy_like_update', { postId, likes: post.likes, likedBy: post.likedBy });
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
    // 10년 차 아키텍트의 장애 대응 전략:
    // DB 연결 및 스키마 동기화 자동화
    await sequelize.authenticate();
    console.log('✅ Database connected successfully.');

    // 모델 구조와 DB 테이블을 강제로 일치시킴 (컬럼 추가/변경 자동 처리)
    await sequelize.sync({ constraints: false });
    console.log('✅ Database schema synchronized.');

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
        third_party_consent: true,
        current_candy_count: 0,
        total_candy_count: 0,
        attendance_days: 0,
        streak: 0
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
        third_party_consent: true,
        current_candy_count: 0,
        total_candy_count: 0,
        attendance_days: 0,
        streak: 0
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