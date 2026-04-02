const axios = require('axios');
const { EmotionLog, Reflection, Intervention } = require('../models');

const AI_SERVER_URL = process.env.AI_SERVER_URL;

exports.handleChat = async (req, res) => {
  const { userId, message } = req.body;
  try {
    // 1. 마지막 감정 상태 조회
    const lastEmotion = await EmotionLog.findOne({
      include: [{ model: Reflection, where: { UserId: userId } }],
      order: [['createdAt', 'DESC']]
    });

    // 2. 최근 대화 내역(최대 5건) 조회
    const previousInterventions = await Intervention.findAll({
      where: { UserId: userId },
      order: [['createdAt', 'DESC']],
      limit: 5
    });

    // 대화 내역을 시간순으로 정렬 (최신순으로 가져왔으므로 반전)
    const history = previousInterventions
      .reverse()
      .map(inv => inv.chatbot_transcript)
      .filter(t => t && t.user && t.bot);

    // 3. AI 서버 호출 (History 포함)
    const aiChat = await axios.post(`${AI_SERVER_URL}/api/ml/chat`, {
      student_id: userId,
      message: message,
      current_emotions: lastEmotion || {},
      history: history
    });

    // 4. 새로운 개입(Intervention) 기록 저장
    await Intervention.create({
      UserId: userId,
      trigger_reason: 'User Initiated',
      chatbot_transcript: { user: message, bot: aiChat.data.reply }
    });

    res.json({ success: true, reply: aiChat.data.reply });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
