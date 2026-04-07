const axios = require('axios');
const { sequelize, Reflection, Analyses, User } = require('../models');

// 환경 변수에서 AI 서버 주소 로드
const ML_SERVER_URL = process.env.ML_SERVER_URL;

/**
 * [Main] 회고 등록 컨트롤러
 */
exports.createReflection = async (req, res) => {
  const {
    userId, delayMinutes,
    emotionEmoji, selectedSpell, text, image,
    todayGoal, achievement, learned, confused, review, freeText, studyImage
  } = req.body;
  const io = req.app.get('socketio');

  // EDU_char_count: 학습 관련 필드 글자 수 합산
  const eduCharCount = [todayGoal, learned, confused, review, freeText]
    .filter(Boolean).join('').length;

  try {
    // 1. 원본 회고 데이터 저장 (Reflections 테이블)
    const reflection = await Reflection.create({
      UserId: userId,
      EMO_emoji: emotionEmoji || null,
      EMO_spell: selectedSpell || null,
      EMO_reflectionText: text || null,
      EMO_image: image || null,
      EDU_goal: todayGoal || null,
      EDU_achievement: achievement || null,
      EDU_learned: learned || null,
      EDU_confused: confused || null,
      EDU_review: review || null,
      EDU_reflectionText: freeText || null,
      EDU_image: studyImage || null,
      EDU_delay_minutes: delayMinutes || 0,
      EDU_char_count: eduCharCount,
    });

    // 2. 클라이언트에 즉시 응답 (사용자 대기 시간 최소화)
    res.status(201).json({
      success: true,
      message: '회고가 등록되었습니다. AI 분석이 백그라운드에서 진행됩니다.',
      data: { id: reflection.id }
    });

    // 3. 비동기 AI 분석 파이프라인 실행 (비동기 호출)
    processAnalysis(reflection, userId, io).catch(err => {
      console.error(`[Background Analysis Error] Reflection ID ${reflection.id}:`, err);
    });

  } catch (error) {
    console.error('Reflection creation failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * [Background] AI 분석 및 통계 업데이트 로직
 */
async function processAnalysis(reflection, userId, io) {
  try {
    console.log(`[ML Pipeline] 요청 시작 -> UserId: ${userId}`);
    if (io) io.to(`user_${userId}`).emit('analysis_started', { reflectionId: reflection.id });

    // A. 최신 유저 정보 및 이전 분석 결과 조회 (시계열 연산용)
    const [user, lastAnalysis] = await Promise.all([
      User.findByPk(userId),
      Analyses.findOne({ where: { UserId: userId }, order: [['createdAt', 'DESC']] })
    ]);

    // B. FastAPI ML 서버 규격(ReflectionPayload) 조립
    const mlPayload = {
      reflection_id: reflection.id,
      UserId: userId,
      EMO_emoji: reflection.EMO_emoji,
      EMO_spell: reflection.EMO_spell,
      EMO_reflectionText: reflection.EMO_reflectionText,
      EDU_goal: reflection.EDU_goal,
      EDU_achievement: reflection.EDU_achievement,
      EDU_learned: reflection.EDU_learned,
      EDU_confused: reflection.EDU_confused,
      EDU_review: reflection.EDU_review,
      EDU_reflectionText: reflection.EDU_reflectionText,
      EDU_delay_minutes: reflection.EDU_delay_minutes,
      EDU_textCount: reflection.EDU_char_count,
      cumulative_days: user ? user.attendance_days + 1 : 1,
      cumulative_absence_days: 0, // 필요 시 로직 추가 가능
      prev_cer: lastAnalysis ? lastAnalysis.cer : 0.0, // 시계열 누적 점수 전달
      service_usage_frequency: 1 // 필요 시 세션 카운트 전달
    };

    // C. FastAPI 서버로 분석 요청 (경로 주의: /api/v1/analyze)
    const aiResponse = await axios.post(`${ML_SERVER_URL}/api/v1/analyze`, mlPayload, { timeout: 45000 });
    const result = aiResponse.data;

    // D. 분석 결과 DB 저장 및 유저 통계 업데이트 (트랜잭션)
    await sequelize.transaction(async (t) => {
      // 1. Analyses 테이블 저장 (필드명 매핑 확인 필수)
      await Analyses.create({
        ReflectionId: reflection.id,
        UserId: userId,
        happy_prob: result.happy_prob,
        fufill_prob: result.fulfill_prob,   // DB 스키마 오타(fufill) 유지 시
        relief_prob: result.relief_prob,
        gratitude_prob: result.gratitude_prob,
        proud_prob: result.proud_prob,
        sad_prob: result.sad_prob,
        anxous_prob: result.anxious_prob,  // DB 스키마 오타(anxous) 유지 시
        defeat_prob: result.defeat_prob,
        stress_prob: result.stress_prob,
        embarrassed_prob: result.embarrassed_prob,
        bored_prob: result.bored_prob,
        exhausted_prob: result.exhausted_prob,
        depressed_prob: result.depressed_prob,
        ers: result.ERS,
        cer: result.CER,                   // 시계열 누적 점수
        dropout_prob: result.dropout_prob, // 이탈 확률
        gpt_EDU_summary: result.edu_summary
      }, { transaction: t });

      // 2. User 출석 및 사탕 데이터 업데이트
      if (user) {
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        const updateData = {};
        if (user.last_attendance_date !== todayStr) {
          updateData.last_attendance_date = todayStr;
          updateData.attendance_days = (user.attendance_days || 0) + 1;
          updateData.current_candy_count = (user.current_candy_count || 0) + 1;
          updateData.total_candy_count = (user.total_candy_count || 0) + 1;
          updateData.streak = user.last_attendance_date === yesterdayStr
            ? (user.streak || 0) + 1 : 1;
        }
        if (Object.keys(updateData).length > 0) {
          await user.update(updateData, { transaction: t });
        }
      }
    });

    // E. 소켓을 통한 실시간 분석 완료 통보
    if (io) {
      io.to(`user_${userId}`).emit('analysis_completed', {
        reflectionId: reflection.id,
        dropout_prob: result.dropout_prob,
        isDanger: result.dropout_prob > 0.65
      });
    }

    console.log(`[ML Pipeline Success] Reflection ID: ${reflection.id}`);

  } catch (error) {
    let errorMsg = 'AI 분석 중 오류가 발생했습니다.';
    if (error.code === 'ECONNREFUSED') errorMsg = 'AI 분석 서버에 연결할 수 없습니다.';
    console.error(`[Analysis Failure] Reflection ID ${reflection.id}:`, error.message);
    if (io) io.to(`user_${userId}`).emit('analysis_failed', { reflectionId: reflection.id, error: errorMsg });
  }
}

exports.resetJar = async (req, res) => {
  const { userId } = req.body;
  try {
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.current_candy_count < 15) return res.status(400).json({ success: false, message: 'Jar not full' });
    await user.update({ current_candy_count: 0 });
    res.json({ success: true, message: '유리병 리셋 완료', current_candy_count: 0 });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getHistory = async (req, res) => {
  try {
    const reflections = await Reflection.findAll({
      where: { UserId: req.params.userId },
      order: [['createdAt', 'DESC']]
    });
    res.json({ success: true, data: reflections });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getBoard = async (req, res) => {
  try {
    const posts = await Reflection.findAll({
      limit: 30,
      order: [['createdAt', 'DESC']]
    });
    res.json({ success: true, data: posts });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
