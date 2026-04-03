const { DataTypes, Sequelize } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('Reflection', {
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    origin_text: { type: DataTypes.TEXT, allowNull: false },
    gpt_summary: { type: DataTypes.TEXT },
    rep_emotion: { type: DataTypes.STRING }, // 대표 감정
    sentiment_score: { type: DataTypes.DECIMAL(5, 4) }, // 감정 점수 (수치화)
    daily_risk: { type: DataTypes.DECIMAL(5, 2) }, // 일일 위험도 (이탈 예측용)
    keywords: { type: DataTypes.JSON }, // 핵심 키워드 리스트
    
    // 기존 EmotionLog 통합 필드 (KcELECTRA 결과)
    happy_prob: { type: DataTypes.DECIMAL(5, 4) },
    sad_prob: { type: DataTypes.DECIMAL(5, 4) },
    angry_prob: { type: DataTypes.DECIMAL(5, 4) },
    heartache_prob: { type: DataTypes.DECIMAL(5, 4) },
    anxious_prob: { type: DataTypes.DECIMAL(5, 4) },
    embarrassed_prob: { type: DataTypes.DECIMAL(5, 4) },
    
    image_data: { type: DataTypes.TEXT('long') },

    // 감정 리플렉션 섹션
    emotion_emoji: { type: DataTypes.STRING },       // 'happy'|'normal'|'sad'|'tired'|'angry'
    selected_spell: { type: DataTypes.STRING },      // 선택한 주문 텍스트
    emotion_one_line: { type: DataTypes.TEXT },      // 감정 한 줄 입력 (max 150)

    // 학습 내용 섹션
    today_goal: { type: DataTypes.TEXT },            // 오늘 정복하고 싶었던 것
    achievement: { type: DataTypes.STRING },         // 'clear'|'half'|'little'|'retry'
    learned: { type: DataTypes.TEXT },               // 오늘 새로 안 것
    confused: { type: DataTypes.TEXT },              // 아직 모르는 것
    review: { type: DataTypes.TEXT },                // 내일 꼭 복습할 것
    free_text: { type: DataTypes.TEXT('long') },     // 추가 자유 입력 (max 2000)
    study_image: { type: DataTypes.TEXT('long') },   // 학습 자료 이미지

    is_private: { type: DataTypes.BOOLEAN, defaultValue: false },
    analysis_status: { 
      type: DataTypes.ENUM('pending', 'analyzing', 'completed', 'failed'), 
      defaultValue: 'pending' 
    },
    submitted_at: { type: DataTypes.DATE, defaultValue: Sequelize.NOW }
  }, {
    timestamps: true,
    underscored: true,
    tableName: 'Reflections'
  });
};
