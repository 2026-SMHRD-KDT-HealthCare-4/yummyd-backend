const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Institution } = require('../models');

const JWT_SECRET = process.env.JWT_SECRET || 'yummy_secret_key_1234';

// [POST] 회원가입
exports.register = async (req, res) => {
  const { 
    login_id, password, username, email, role, 
    inst_name, institution_id, class_id, 
    privacy_consent, third_party_consent 
  } = req.body;

  try {
    if (!privacy_consent) {
      return res.status(400).json({ success: false, message: '개인정보 수집 동의가 필요합니다.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    if (role === 'institution') {
      // 기관 회원가입 (Institution 테이블)
      const existingInst = await Institution.findOne({ where: { login_id } });
      if (existingInst) return res.status(400).json({ success: false, message: '이미 사용 중인 기관 아이디입니다.' });

      const newInst = await Institution.create({
        login_id,
        password: hashedPassword,
        email,
        inst_name: inst_name || username
      });
      return res.status(201).json({ success: true, message: '기관 등록이 완료되었습니다.', id: newInst.id });
    }

    // 학생/강사 회원가입 (User 테이블)
    const existingUser = await User.findOne({ where: { login_id } });
    if (existingUser) return res.status(400).json({ success: false, message: '이미 사용 중인 아이디입니다.' });

    const newUser = await User.create({
      login_id,
      password: hashedPassword,
      username,
      email,
      role: role || 'student',
      institution_id: (role === 'student' && institution_id) ? institution_id : null,
      class_id: (role === 'student' && class_id) ? class_id : null,
      privacy_consent,
      third_party_consent,
      current_candy_count: 0,
      total_candy_count: 0
    });

    res.status(201).json({ success: true, message: '회원가입이 완료되었습니다.', userId: newUser.id });
  } catch (error) {
    console.error('[Registration Error]', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// [POST] 로그인
exports.login = async (req, res) => {
  const { login_id, password, login_type } = req.body; // login_type: 'user' or 'institution'

  try {
    let account;
    let isInst = false;

    if (login_type === 'institution') {
      account = await Institution.findOne({ where: { login_id } });
      isInst = true;
    } else {
      account = await User.findOne({ where: { login_id } });
    }
    
    if (!account) {
      return res.status(401).json({ success: false, message: '존재하지 않는 아이디입니다.' });
    }

    const isMatch = await bcrypt.compare(password, account.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: '비밀번호가 일치하지 않습니다.' });
    }

    const token = jwt.sign(
      { 
        id: account.id, 
        role: isInst ? 'admin' : account.role, 
        username: isInst ? account.inst_name : account.username 
      },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    // 로그인 시 last_login_at 업데이트
    if (!isInst) {
      await account.update({ last_login_at: new Date() });
    }

    res.json({ 
      success: true, 
      token, 
      user: isInst ? {
        id: account.id,
        username: account.inst_name,
        role: 'admin',
        is_institution: true
      } : { 
        id: account.id, 
        username: account.username, 
        role: account.role,
        institution_id: account.institution_id,
        class_id: account.class_id,
        current_candy_count: account.current_candy_count || 0,
        total_candy_count: account.total_candy_count || 0,
        attendance_days: account.attendance_days || 0,
        streak: account.streak || 0
      } 
    });
  } catch (error) {
    console.error('[Login Error Detail]', error);
    res.status(500).json({ success: false, message: '로그인 처리 중 오류가 발생했습니다.' });
  }
};

exports.getMe = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: '인증되지 않은 사용자입니다.' });
    
    let account;
    if (req.user.role === 'admin') {
      account = await Institution.findByPk(req.user.id);
    } else {
      account = await User.findByPk(req.user.id);
    }

    if (!account) return res.status(404).json({ success: false, message: '계정을 찾을 수 없습니다.' });

    res.json({ 
      success: true, 
      user: req.user.role === 'admin' ? {
        id: account.id,
        username: account.inst_name,
        role: 'admin',
        is_institution: true
      } : {
        id: account.id,
        username: account.username,
        role: account.role,
        institution_id: account.institution_id,
        class_id: account.class_id,
        current_candy_count: account.current_candy_count || 0,
        total_candy_count: account.total_candy_count || 0,
        attendance_days: account.attendance_days || 0,
        streak: account.streak || 0
      } 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// [GET] 아이디 중복 확인
exports.checkId = async (req, res) => {
  const { login_id } = req.query;
  try {
    const user = await User.findOne({ where: { login_id } });
    const inst = await Institution.findOne({ where: { login_id } });
    
    if (user || inst) {
      return res.json({ success: true, isDuplicate: true });
    }
    res.json({ success: true, isDuplicate: false });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// [PATCH] 프로필 업데이트 (클래스 설정 등)
exports.updateProfile = async (req, res) => {
  const { class_id } = req.body;
  const userId = req.user.id;
  try {
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ success: false, message: '사용자를 찾을 수 없습니다.' });

    await user.update({ class_id });
    res.json({ success: true, message: '프로필이 업데이트되었습니다.' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
