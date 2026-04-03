const axios = require('axios');
const { sequelize, Reflection, RiskMetric, User } = require('../models');
const { Op } = require('sequelize');

const AI_SERVER_URL = process.env.AI_SERVER_URL;

exports.createReflection = async (req, res) => {
  const {
    userId, text, delayMinutes, image, isPrivate,
    emotionEmoji, selectedSpell, emotionOneLine,
    todayGoal, achievement, learned, confused, review, freeText, studyImage
  } = req.body;
  const io = req.app.get('socketio');

  // AI 분석용 텍스트: 감정 한 줄 + 학습내용 조합
  const analysisText = [
    text,
    emotionOneLine,
    todayGoal,
    learned,
    confused,
    review,
    freeText
  ].filter(Boolean).join('\n');

  try {
    const reflection = await Reflection.create({
      user_id: userId,
      origin_text: analysisText,
      image_data: image,
      is_private: isPrivate || false,
      analysis_status: 'pending',
      emotion_emoji: emotionEmoji || null,
      selected_spell: selectedSpell || null,
      emotion_one_line: emotionOneLine || null,
      today_goal: todayGoal || null,
      achievement: achievement || null,
      learned: learned || null,
      confused: confused || null,
      review: review || null,
      free_text: freeText || null,
      study_image: studyImage || null
    });

    res.status(201).json({
      success: true,
      message: "회고가 등록되었습니다. AI 분석이 곧 시작됩니다.",
      data: { id: reflection.id, status: 'pending' }
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
    await reflection.update({ analysis_status: 'analyzing' });
    
    if (io) io.to(`user_${userId}`).emit('analysis_started', { reflectionId: reflection.id });

    const lastRisk = await RiskMetric.findOne({
      where: { user_id: userId },
      order: [['created_at', 'DESC']]
    });
    const prevCer = lastRisk ? parseFloat(lastRisk.cumulative_cer) : 0.0;

    // AI 서버 호출 (타임아웃 및 에러 처리 강화)
    const aiResponse = await axios.post(`${AI_SERVER_URL}/api/ml/analyze`, {
      student_id: userId,
      content: text,
      delay_minutes: delayMinutes || 0,
      prev_cer: prevCer
    }, { timeout: 30000 });

    if (!aiResponse.data || aiResponse.data.status !== 'success') {
      throw new Error('AI 서버 응답 형식이 올바르지 않습니다.');
    }

    const { summary, emotions, risk_scores, keywords } = aiResponse.data;

    await sequelize.transaction(async (t) => {
      // 1. Reflection 업데이트 (감정 정보 통합)
      await reflection.update({
        gpt_summary: summary,
        rep_emotion: emotions.dominant,
        happy_prob: emotions.happy || 0,
        sad_prob: emotions.sad || 0,
        angry_prob: emotions.angry || 0,
        heartache_prob: emotions.heartache || 0,
        anxious_prob: emotions.anxious || 0,
        embarrassed_prob: emotions.embarrassed || 0,
        daily_risk: risk_scores.ers || 0,
        keywords: keywords || [],
        analysis_status: 'completed'
      }, { transaction: t });

      // 2. RiskMetric 기록
      await RiskMetric.create({
        user_id: userId,
        daily_ers: risk_scores.ers || 0,
        cumulative_cer: risk_scores.cer || 0,
        dropout_prob: risk_scores.dropout_prob || 0,
        is_alert: parseFloat(risk_scores.cer) > 1.5
      }, { transaction: t });

      // 3. User 상태 업데이트 (출석/사탕/로그인)
      const user = await User.findByPk(userId, { transaction: t });
      if (user) {
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        const updateData = {
          last_login_at: now
        };

        // 출석 및 사탕 지급 (1일 1회)
        // 기존 필드명을 새 모델 정의(underscored)에 맞게 쓰거나 Sequelize가 맵핑함
        // 여기서는 직접 필드명을 사용
        if (user.last_attendance_date !== todayStr) {
          updateData.last_attendance_date = todayStr;
          updateData.attendance_days = (user.attendance_days || 0) + 1;
          updateData.current_candy_count = (user.current_candy_count || 0) + 1;
          updateData.total_candy_count = (user.total_candy_count || 0) + 1;

          if (user.last_attendance_date === yesterdayStr) {
            updateData.streak = (user.streak || 0) + 1;
          } else {
            updateData.streak = 1;
          }
        }
        
        await user.update(updateData, { transaction: t });
      }
    });

    if (io) {
      io.to(`user_${userId}`).emit('analysis_completed', { 
        reflectionId: reflection.id,
        summary: summary,
        dominantEmotion: emotions.dominant
      });
    }

  } catch (error) {
    let errorMsg = 'AI 분석 중 오류가 발생했습니다.';
    if (error.code === 'ECONNREFUSED') errorMsg = 'AI 분석 서버에 연결할 수 없습니다.';
    
    console.error(`[Analysis Failure] ID ${reflection.id}:`, error.message);
    await reflection.update({ analysis_status: 'failed' }).catch(e => console.error(e));
    if (io) io.to(`user_${userId}`).emit('analysis_failed', { reflectionId: reflection.id, error: errorMsg });
  }
}

exports.resetJar = async (req, res) => {
  const { userId } = req.body;
  try {
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    if (user.current_candy_count < 15) return res.status(400).json({ success: false, message: "Jar not full" });

    await user.update({ current_candy_count: 0 });
    res.json({ success: true, message: "유리병 리셋 완료", current_candy_count: 0 });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getHistory = async (req, res) => {
  try {
    const reflections = await Reflection.findAll({
      where: { user_id: req.params.userId },
      order: [['created_at', 'DESC']]
    });
    res.json({ success: true, data: reflections });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getBoard = async (req, res) => {
  try {
    const posts = await Reflection.findAll({
      where: { is_private: false },
      limit: 30,
      order: [['created_at', 'DESC']]
    });
    res.json({ success: true, data: posts });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
