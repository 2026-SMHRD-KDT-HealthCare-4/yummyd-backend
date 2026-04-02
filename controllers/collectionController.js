const { User, Collection } = require('../models');

// 가상의 아이템 데이터베이스 (실제 환경에서는 별도 테이블이나 설정 파일로 관리 권장)
const ITEM_POOL = [
  { id: 'h1', type: 'hat', name: '빨간 모자' },
  { id: 'h2', type: 'hat', name: '파란 캡' },
  { id: 'g1', type: 'glass', name: '검정 선글라스' },
  { id: 'g2', type: 'glass', name: '동그란 안경' },
  { id: 'a1', type: 'accessory', name: '반짝이는 목걸이' },
  { id: 'b1', type: 'background', name: '푸른 숲' },
  // ... 더 많은 아이템 추가 가능
];

exports.drawItem = async (req, res) => {
  const { userId } = req.body;
  try {
    const user = await User.findByPk(userId);
    if (!user || user.current_candy_count < 1) {
      return res.status(400).json({ success: false, message: "캔디가 부족합니다!" });
    }

    // 1. 캔디 소모
    await user.update({ current_candy_count: user.current_candy_count - 1 });

    // 2. 랜덤 아이템 추첨
    const randomItem = ITEM_POOL[Math.floor(Math.random() * ITEM_POOL.length)];

    // 3. 중복 체크 및 컬렉션 추가
    const [collection, created] = await Collection.findOrCreate({
      where: { UserId: userId, item_id: randomItem.id },
      defaults: { item_type: randomItem.type, is_equipped: false }
    });

    res.json({ 
      success: true, 
      item: randomItem, 
      isNew: created, 
      currentCandy: user.current_candy_count 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getCollection = async (req, res) => {
  try {
    const items = await Collection.findAll({ where: { UserId: req.params.userId } });
    res.json({ success: true, data: items });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.toggleEquip = async (req, res) => {
  const { userId, itemId } = req.body;
  try {
    const item = await Collection.findOne({ where: { UserId: userId, item_id: itemId } });
    if (!item) return res.status(404).json({ success: false, message: "Item not found" });

    // 같은 타입의 다른 아이템 해제 (카테고리별 하나만 착용)
    await Collection.update(
      { is_equipped: false },
      { where: { UserId: userId, item_type: item.item_type } }
    );

    // 선택한 아이템 착용
    await item.update({ is_equipped: !item.is_equipped });
    res.json({ success: true, isEquipped: item.is_equipped });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
