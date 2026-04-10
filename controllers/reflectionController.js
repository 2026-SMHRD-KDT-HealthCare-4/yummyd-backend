const axios = require('axios');
const { Sequelize, Op } = require('sequelize');
const { sequelize, Reflection, Analyses, User } = require('../models');

const ML_SERVER_URL = process.env.ML_SERVER_URL;

/**
 * [Main] 회고 등록 컨트롤러
 */
exports.createReflection = async (req, res) => {
  const {
    userId, todayGoal, learned, confused, review, freeText, image, studyImage
  } = req.body;
  const io = req.app.get('socketio');

  const combinedText = `[Goal] ${todayGoal || ''}\n[Learned] ${learned || ''}\n[Confused] ${confused || ''}\n[Review] ${review || ''}\n[Memo] ${freeText || ''}`;

  try {
    const userRecord = await User.findByPk(userId);
    if (!userRecord) return res.status(404).json({ success: false, message: 'User not found' });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const reflection = await Reflection.create({
      userId: userId,
      origin_text: combinedText,
      image_data: image || studyImage || null,
      analysis_status: 'pending'
    });

    const todayReflectionCount = await Reflection.count({
      where: {
        userId: userId,
        createdAt: { [Op.gte]: today }
      }
    });

    if (todayReflectionCount === 1) {
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
      where: { UserId: userId }, 
      order: [['createdAt', 'DESC']] 
    });

    const aiResponse = await axios.post(`${ML_SERVER_URL}/api/v1/analyze`, {
      reflection_id: reflection.id,
      UserId: userId,
      EMO_reflectionText: rawData.combinedText,
      prev_cer: lastAnalysis ? lastAnalysis.cer : 0.0
    }, { timeout: 45000 });

    const result = aiResponse.data;

    await sequelize.transaction(async (t) => {
      await Analyses.create({
        ReflectionId: reflection.id,
        UserId: userId,
        happy_prob: result.happy_prob ?? 0.0,
        sad_prob: result.sad_prob ?? 0.0,
        anxious_prob: result.anxious_prob ?? 0.0,
        ers: result.ERS ?? 0.0,
        cer: result.CER ?? 0.0,
        dropout_prob: result.dropout_prob ?? 0.0,
        gpt_EDU_summary: result.edu_summary ?? ''
      }, { transaction: t });

      await reflection.update({
        analysis_status: 'completed',
        rep_emotion: result.dominant_emotion || 'happy',
        gpt_summary: result.edu_summary || '',
        happy_prob: result.happy_prob ?? 0.0,
        sad_prob: result.sad_prob ?? 0.0,
        anxious_prob: result.anxious_prob ?? 0.0
      }, { transaction: t });
    });

    if (io) io.to(`user_${userId}`).emit('analysis_completed', { reflectionId: reflection.id });
  } catch (error) {
    console.error('[Analysis Failed]:', error);
    await reflection.update({ analysis_status: 'failed' });
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
      const emotions = posts.map(p => p.rep_emotion).filter(e => e);
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
    
    const newText = req.body.text || req.body.origin_text;
    await reflection.update({ origin_text: newText, analysis_status: 'pending' });
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
