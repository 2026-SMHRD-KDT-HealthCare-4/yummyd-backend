const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

const JWT_SECRET = process.env.JWT_SECRET || 'yummy_secret_key_1234';

// [POST] 회원가입
exports.register = async (req, res) => {
  const { 
    login_id, password, username, email, role, 
    organization_name, institution_id, group_id, cohort_id, 
    privacy_consent, third_party_consent 
  } = req.body;

  try {
    if (!privacy_consent) {
      return res.status(400).json({ success: false, message: '개인정보 수집 동의가 필요합니다.' });
    }

    const existingUser = await User.findOne({ where: { login_id } });
    if (existingUser) {
      return res.status(400).json({ success: false, message: '이미 사용 중인 아이디입니다.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      login_id,
      password: hashedPassword,
      username,
      email,
      role: role || 'student',
      organization_name: role === 'institution' ? organization_name : null,
      institution_id: (role === 'student' && institution_id !== '') ? institution_id : null,
      group_id: (role === 'student' && group_id !== '') ? group_id : null,
      cohort_id: (role === 'student' && cohort_id !== '') ? cohort_id : null,
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

// [GET] 아이디 중복 확인
exports.checkId = async (req, res) => {
  const { login_id } = req.query;
  try {
    const user = await User.findOne({ where: { login_id } });
    res.json({ success: true, isDuplicate: !!user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// [POST] 로그인
exports.login = async (req, res) => {
  const { login_id, password } = req.body;

  try {
    // 1. 사용자 조회 (로그인 아이디 기준)
    const user = await User.findOne({ where: { login_id } });
    
    if (!user) {
      return res.status(401).json({ success: false, message: '존재하지 않는 아이디입니다.' });
    }

    // 2. 비밀번호 비교
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: '비밀번호가 일치하지 않습니다.' });
    }

    // 3. JWT 발행 (유효기간 1일)
    const token = jwt.sign(
      { id: user.id, role: user.role, username: user.username },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    // 4. 성공 응답 (프론트엔드에 필요한 모든 유저 정보 포함)
    res.json({ 
      success: true, 
      token, 
      user: { 
        id: user.id, 
        username: user.username, 
        role: user.role,
        institution_id: user.institution_id,
        group_id: user.group_id,
        cohort_id: user.cohort_id,
        current_candy_count: user.current_candy_count || 0,
        total_candy_count: user.total_candy_count || 0,
        attendance_days: user.attendance_days || 0,
        streak: user.streak || 0
      } 
    });
  } catch (error) {
    console.error('[Login Error Detail]', error);
    res.status(500).json({ 
      success: false, 
      message: '로그인 처리 중 오류가 발생했습니다.',
      error: error.message 
    });
  }
};

// [GET] 내 정보 가져오기 (세션 복구용)
exports.getMe = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: '인증되지 않은 사용자입니다.' });
    
    // DB에서 최신 정보 다시 가져오기
    const user = await User.findByPk(req.user.id);
    res.json({ 
      success: true, 
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        institution_id: user.institution_id,
        group_id: user.group_id,
        cohort_id: user.cohort_id,
        current_candy_count: user.current_candy_count || 0,
        total_candy_count: user.total_candy_count || 0,
        attendance_days: user.attendance_days || 0,
        streak: user.streak || 0
      } 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// [PATCH] 내 정보 수정 (수강생 전용 그룹 변경 등)
exports.updateProfile = async (req, res) => {
  try {
    const { group_id, institution_id } = req.body;
    const user = await User.findByPk(req.user.id);
    
    if (institution_id) user.institution_id = institution_id;
    if (group_id) user.group_id = group_id;
    
    await user.save();
    res.json({ success: true, message: '프로필이 업데이트되었습니다.', user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
