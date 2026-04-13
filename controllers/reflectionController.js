const axios = require('axios');
const { Sequelize, Op } = require('sequelize');
const { sequelize, Reflection, Analyses, User } = require('../models');

const ML_SERVER_URL = process.env.ML_SERVER_URL;

/**
 * [Main] 회고 등록 컨트롤러
 */
exports.createReflection = async (req, res) => {
  const {
    userId, todayGoal, learned, confused, review, freeText, image, studyImage,
    EMO_reflectionText, EDU_achievement, emotionEmoji, selectedSpell, delayMinutes
  } = req.body;
  const io = req.app.get('socketio');

  // AI 분석용으로 모든 텍스트 병합 (기존 로직 유지)
  const combinedText = `[Goal] ${todayGoal || ''}\n[Learned] ${learned || ''}\n[Confused] ${confused || ''}\n[Review] ${review || ''}\n[Memo] ${freeText || ''}`;

  try {
    const userRecord = await User.findByPk(userId);
    if (!userRecord) return res.status(404).json({ success: false, message: 'User not found' });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // 1. cumulative_days, cumulative_absence_days 계산
    const allReflections = await Reflection.findAll({
      where: { userId: userId },
      attributes: ['createdAt'],
      order: [['createdAt', 'ASC']]
    });

    const cumulativeDays = allReflections.length + 1; // 현재 작성 포함

    let cumulativeAbsenceDays = 0;
    if (allReflections.length > 0) {
      const firstDate = new Date(allReflections[0].createdAt);
      firstDate.setHours(0, 0, 0, 0);
      const writtenDays = new Set(
        allReflections.map(r => new Date(r.createdAt).toISOString().split('T')[0])
      );
      writtenDays.add(today.toISOString().split('T')[0]); // 오늘 포함
      let cursor = new Date(firstDate);
      const todayStr = today.toISOString().split('T')[0];
      while (cursor.toISOString().split('T')[0] <= todayStr) {
        const dateStr = cursor.toISOString().split('T')[0];
        if (!writtenDays.has(dateStr)) cumulativeAbsenceDays++;
        cursor.setDate(cursor.getDate() + 1);
      }
    }

    // 2. 회고 데이터 생성 (최신 필드명 매핑)
    const reflection = await Reflection.create({
      userId: userId,
      EMO_reflectionText: EMO_reflectionText || combinedText,
      EMO_image: image || studyImage || null,
      EMO_emoji: emotionEmoji || null,
      EMO_spell: selectedSpell || null,
      EDU_goal: todayGoal,
      EDU_achievement: EDU_achievement || null,
      EDU_learned: learned,
      EDU_confused: confused,
      EDU_review: review,
      EDU_reflectionText: freeText,
      EDU_char_count: freeText?.length || 0,
      EDU_delay_time: delayMinutes || 0,
      cumulativeDays: cumulativeDays,
      cumulativeAbsenceDays: cumulativeAbsenceDays,
    });

    const todayReflectionCount = await Reflection.count({
      where: {
        userId: userId,
        createdAt: { [Op.gte]: today }
      }
    });

    if (todayReflectionCount <= 2) {
      const yesterdayReflectionCount = await Reflection.count({
        where: {
          userId: userId,
          createdAt: { 
            [Op.gte]: yesterday, 
            [Op.lt]: today 
          }
        }
      });

      await userRecord.update({
        current_candy_count: (userRecord.current_candy_count || 0) + 1,
        total_candy_count: (userRecord.total_candy_count || 0) + 1,
        attendance_days: (userRecord.attendance_days || 0) + 1,
        streak: yesterdayReflectionCount > 0 ? (userRecord.streak || 0) + 1 : 1
      });
    }

    res.status(201).json({ success: true, message: '등록 성공', data: { id: reflection.id } });
    
    // 비동기 AI 분석 처리
    processAnalysis(reflection, userId, io, { combinedText }).catch(err => console.error('[ProcessAnalysis Error]:', err));

  } catch (error) {
    console.error('[Reflection Create Error]:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * AI 분석 프로세스 (비동기)
 */
async function processAnalysis(reflection, userId, io, rawData) {
  try {
    const lastAnalysis = await Analyses.findOne({ 
      where: { userId: userId }, 
      order: [['createdAt', 'DESC']] 
    });

    const aiResponse = await axios.post(`${ML_SERVER_URL}/api/v1/analyze`, {
      reflection_id: reflection.id,
      UserId: userId,
      EMO_emoji: reflection.EMO_emoji || 'happy',
      EMO_spell: reflection.EMO_spell || '',
      EMO_reflectionText: rawData.combinedText,
      EMO_image: reflection.EMO_image || null,
      EDU_goal: reflection.EDU_goal || null,
      EDU_achievement: reflection.EDU_achievement || null,
      EDU_learned: reflection.EDU_learned || null,
      EDU_confused: reflection.EDU_confused || null,
      EDU_review: reflection.EDU_review || null,
      EDU_reflectionText: reflection.EDU_reflectionText || null,
      EDU_delay_minutes: reflection.EDU_delay_time || 0,
      EDU_textCount: reflection.EDU_char_count || 0,
      cumulative_days: reflection.cumulativeDays || 1,
      cumulative_absence_days: reflection.cumulativeAbsenceDays || 0,
      prev_cer: lastAnalysis ? lastAnalysis.cer : 0.0
    }, { timeout: 45000 });

    const result = aiResponse.data;

    await sequelize.transaction(async (t) => {
      // 1. 상세 분석 데이터 생성
      await Analyses.create({
        reflectionId: reflection.id,
        userId: userId,
        happyProb:       result.happy_prob       ?? 0.0,
        fulfillProb:     result.fulfill_prob      ?? 0.0,
        reliefProb:      result.relief_prob       ?? 0.0,
        gratitudeProb:   result.gratitude_prob    ?? 0.0,
        proudProb:       result.proud_prob        ?? 0.0,
        sadProb:         result.sad_prob          ?? 0.0,
        anxiousProb:     result.anxious_prob      ?? 0.0,
        defeatProb:      result.defeat_prob       ?? 0.0,
        stressProb:      result.stress_prob       ?? 0.0,
        embarrassedProb: result.embarrassed_prob  ?? 0.0,
        boredProb:       result.bored_prob        ?? 0.0,
        exhaustedProb:   result.exhausted_prob    ?? 0.0,
        depressedProb:   result.depressed_prob    ?? 0.0,
        ers:             result.ERS               ?? 0.0,
        cer:             result.CER               ?? 0.0,
        dropoutProb:     result.dropout_prob      ?? 0.0,
        gptEduSummary:   result.edu_summary       ?? ''
      }, { transaction: t });

      // 2. 회고 요약 정보 업데이트 (필요 시 필드 추가 매핑)
      await reflection.update({
        emoji: result.dominant_emotion || 'happy'
      }, { transaction: t });
    });

    if (io) io.to(`user_${userId}`).emit('analysis_completed', { reflectionId: reflection.id });
  } catch (error) {
    console.error('[Analysis Failed]:', error);
  }
}

/**
 * 사용자별 회고 히스토리 조회
 */
exports.getHistory = async (req, res) => {
  try {
    const reflections = await Reflection.findAll({
      where: { userId: req.params.userId },
      include: [{ model: Analyses, as: 'Analysis' }],
      order: [['createdAt', 'DESC']]
    });
    res.json({ success: true, data: reflections });
  } catch (error) {
    console.error('[History Fetch Error]:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * 대시보드 요약 정보 조회
 */
exports.getBoard = async (req, res) => {
  try {
    const posts = await Reflection.findAll({ 
      limit: 30, 
      order: [['createdAt', 'DESC']] 
    });
    
    const summary = {
      message: "모두의 마음이 모이고 있어요.",
      description: "오늘 우리 반의 감정 사탕은 상큼한 민트색이네요.",
      dominantEmotion: 'mint'
    };

    if (posts.length > 0) {
      const emotions = posts.map(p => p.emoji).filter(e => e); // rep_emotion 대신 emoji 사용
      if (emotions.length > 0) {
        const counts = emotions.reduce((acc, e) => {
          acc[e] = (acc[e] || 0) + 1;
          return acc;
        }, {});
        const dominant = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
        summary.dominantEmotion = dominant === 'happy' ? 'mint' : (dominant === 'sad' ? 'pink' : 'yellow');
        summary.description = `오늘 우리 반의 감정 사탕은 ${summary.dominantEmotion === 'mint' ? '상큼한 민트색' : summary.dominantEmotion === 'pink' ? '포근한 핑크색' : '따뜻한 노란색'}이네요.`;
      }
    }

    res.json({ success: true, data: posts, summary });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * 회고 수정
 */
exports.updateReflection = async (req, res) => {
  try {
    const reflection = await Reflection.findByPk(req.params.id);
    if (!reflection) return res.status(404).json({ success: false, message: 'Not found' });
    
    const newText = req.body.text || req.body.origin_text || req.body.originText;
    await reflection.update({ EDU_reflectionText: newText });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * 캔디 수량 초기화 (테스트용)
 */
exports.resetJar = async (req, res) => {
  try {
    const user = await User.findByPk(req.body.userId);
    if (user) await user.update({ current_candy_count: 0 });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
