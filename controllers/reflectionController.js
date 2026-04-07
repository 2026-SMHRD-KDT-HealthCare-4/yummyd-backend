const axios = require('axios');
const { sequelize, Reflection, RiskMetric, User } = require('../models');

const AI_SERVER_URL = process.env.AI_SERVER_URL;

exports.createReflection = async (req, res) => {
  const {
    userId, delayMinutes,
    emotionEmoji, selectedSpell, text, image,
    todayGoal, achievement, learned, confused, review, freeText, studyImage
  } = req.body;
  const io = req.app.get('socketio');

  // AI 분석용 텍스트 조합
  const analysisText = [text, todayGoal, learned, confused, review, freeText]
    .filter(Boolean).join('\n');

  // EDU_char_count: 학습 텍스트 전체 글자 수
  const eduCharCount = [todayGoal, learned, confused, review, freeText]
    .filter(Boolean).join('').length;

  try {
    const reflection = await Reflection.create({
      UserId: userId,
      EDU_delay_minutes: delayMinutes || 0,

      EMO_reflectionText: text       || null,
      EMO_image:          image      || null,
      EMO_emoji:          emotionEmoji  || null,
      EMO_spell:          selectedSpell || null,

      EDU_goal:           todayGoal   || null,
      EDU_achievement:    achievement || null,
      EDU_learned:        learned     || null,
      EDU_confused:       confused    || null,
      EDU_review:         review      || null,
      EDU_reflectionText: freeText    || null,
      EDU_image:          studyImage  || null,
      EDU_char_count:     eduCharCount,
    });

    res.status(201).json({
      success: true,
      message: '회고가 등록되었습니다. AI 분석이 곧 시작됩니다.',
      data: { id: reflection.id }
    });

    processAnalysis(reflection, userId, analysisText, delayMinutes, io).catch(err => {
      console.error(`[Background Analysis Error] Reflection ID ${reflection.id}:`, err);
    });

  } catch (error) {
    console.error('Reflection creation failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

async function processAnalysis(reflection, userId, text, delayMinutes, io) {
  try {
    console.log(`[Analysis Start] Connecting to ML Server at ${AI_SERVER_URL}...`);
    if (io) io.to(`user_${userId}`).emit('analysis_started', { reflectionId: reflection.id });

    const lastRisk = await RiskMetric.findOne({
      where: { user_id: userId },
      order: [['created_at', 'DESC']]
    });
    const prevCer = lastRisk ? parseFloat(lastRisk.cumulative_cer) : 0.0;

    const aiResponse = await axios.post(`${AI_SERVER_URL}/api/ml/analyze`, {
      student_id: userId,
      content: text,
      delay_minutes: delayMinutes || 0,
      prev_cer: prevCer
    }, { timeout: 30000 });

    if (!aiResponse.data || aiResponse.data.status !== 'success') {
      throw new Error('AI 서버 응답 형식이 올바르지 않습니다.');
    }

    const { emotions, risk_scores } = aiResponse.data;

    await sequelize.transaction(async (t) => {
      // RiskMetric 기록
      await RiskMetric.create({
        user_id: userId,
        daily_ers: risk_scores.ers || 0,
        cumulative_cer: risk_scores.cer || 0,
        dropout_prob: risk_scores.dropout_prob || 0,
        is_alert: parseFloat(risk_scores.cer) > 1.5
      }, { transaction: t });

      // User 출석/사탕 업데이트
      const user = await User.findByPk(userId, { transaction: t });
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

    if (io) {
      io.to(`user_${userId}`).emit('analysis_completed', {
        reflectionId: reflection.id,
        dominantEmotion: emotions.dominant
      });
    }

  } catch (error) {
    let errorMsg = 'AI 분석 중 오류가 발생했습니다.';
    if (error.code === 'ECONNREFUSED') errorMsg = 'AI 분석 서버에 연결할 수 없습니다.';
    console.error(`[Analysis Failure] ID ${reflection.id}:`, error.message);
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
