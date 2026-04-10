const { Op } = require("sequelize");
const { sequelize, Collection, CollectionUsers, User } = require("../models");

/**
 * [Main] 아바타 뽑기 컨트롤러
 */
const drawItem = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { userId } = req.body;
    const user = await User.findByPk(userId, { transaction: t });

    if (!user) {
      await t.rollback();
      return res.status(404).json({ success: false, message: "유저를 찾을 수 없습니다." });
    }

    // [Policy] 무료화 반영: 캔디 체크 로직 제거

    const ownedItems = await CollectionUsers.findAll({
      where: { user_id: userId },
      attributes: ["collection_id"],
      transaction: t
    });
    const ownedIds = ownedItems.map(o => o.collection_id);

    const availableItems = await Collection.findAll({
      where: { id: { [Op.notIn]: ownedIds.length ? ownedIds : [0] } },
      transaction: t
    });

    if (availableItems.length === 0) {
      await t.rollback();
      return res.json({ success: false, message: "축하합니다! 모든 컬렉션을 수집하셨습니다. ✨" });
    }

    const item = drawRandom(availableItems);

    await CollectionUsers.create({
      user_id: userId,
      collection_id: item.id,
      is_equipped: false
    }, { transaction: t });

    // [Policy] 무료화 반영: 캔디 차감 로직 제거

    await t.commit();
    res.json({ success: true, item });

  } catch (err) {
    if (t) await t.rollback();
    console.error("[Draw Error Critical]:", err); // 예외 로깅 강화
    res.status(500).json({ success: false, error: err.message });
  }
};

function drawRandom(items) {
  const totalWeight = items.reduce((sum, i) => sum + (i.weight || 1), 0);
  let rand = Math.random() * totalWeight;
  for (const item of items) {
    rand -= (item.weight || 1);
    if (rand <= 0) return item;
  }
  return items[0];
}

const fetchCollection = async (req, res) => {
  try {
    const { userId } = req.params;
    const list = await CollectionUsers.findAll({
      where: { user_id: userId },
      include: [{ 
        model: Collection,
        required: true 
      }]
    });
    res.json({ success: true, data: list });
  } catch (err) {
    console.error('[Fetch Collection Error Critical]:', err); // 예외 로깅 강화
    res.status(500).json({ success: false, message: "조회 실패", error: err.message });
  }
};

const toggleEquip = async (req, res) => {
  try {
    const { userId, itemId } = req.body;
    await sequelize.transaction(async (t) => {
      await CollectionUsers.update({ is_equipped: false }, { where: { user_id: userId }, transaction: t });
      await CollectionUsers.update({ is_equipped: true }, { where: { user_id: userId, collection_id: itemId }, transaction: t });
    });
    res.json({ success: true });
  } catch (err) {
    console.error('[Toggle Equip Error Critical]:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = { drawItem, fetchCollection, toggleEquip };
