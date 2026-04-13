const { Op } = require("sequelize");
const { Collection, CollectionUsers, User } = require("../models");

const drawItem = async (req, res) => {
  try {
    const { userId } = req.body;

    // 1. 유저 조회
    const user = await User.findByPk(userId);

    if (!user) {
      return res.json({
        success: false,
        message: "유저 없음"
      });
    }

    // 2. 캔디 확인 (2개 필요)
    if (user.current_candy_count < 2) {
      return res.json({
        success: false,
        message: "캔디가 부족합니다"
      });
    }

    // 3. 이미 보유한 아바타 조회
    const owned = await CollectionUsers.findAll({
      where: { user_id: userId },
      attributes: ["collection_id"]
    });

    const ownedIds = owned.map(o => o.collection_id);

    // 4. 보유하지 않은 아바타만 가져오기
    const available = await Collection.findAll({
      where: {
        id: {
          [Op.notIn]: ownedIds.length ? ownedIds : [0]
        }
      }
    });

    if (available.length === 0) {
      return res.json({
        success: false,
        message: "모든 아바타를 이미 보유중입니다"
      });
    }

    // 5. 확률 랜덤 뽑기
    const item = drawRandom(available);

    // 6. 컬렉션 추가
    await CollectionUsers.create({
      user_id: userId,
      collection_id: item.id,
      is_equipped: false
    });

    // 7. 캔디 차감
    user.current_candy_count -= 2;
    await user.save();

    res.json({
      success: true,
      item
    });

  } catch (err) {
    console.error(err);
    res.json({
      success: false,
      message: "draw error"
    });
  }
};

function drawRandom(items) {
  const total = items.reduce((sum, i) => sum + i.weight, 0);
  let rand = Math.random() * total;

  for (const item of items) {
    rand -= item.weight;
    if (rand <= 0) return item;
  }

  return items[0];
}

const fetchCollection = async (req, res) => {
  try {
    const { userId } = req.params;

    const list = await CollectionUsers.findAll({
      where: { user_id: userId },
      include: [
        {
          model: Collection
        }
      ]
    });

    res.json({
      success: true,
      data: list
    });

  } catch (err) {
    console.error(err);
    res.json({
      success: false,
      message: "fetch collection error"
    });
  }
};

const toggleEquip = async (req, res) => {
  try {
    const { userId, itemId } = req.body;

    // 전체 해제
    await CollectionUsers.update(
      { is_equipped: false },
      { where: { user_id: userId } }
    );

    // 선택 장착
    await CollectionUsers.update(
      { is_equipped: true },
      {
        where: {
          user_id: userId,
          collection_id: itemId
        }
      }
    );

    res.json({
      success: true
    });

  } catch (err) {
    console.error(err);
    res.json({
      success: false,
      message: "toggle equip error"
    });
  }
};

module.exports = {
  drawItem,
  fetchCollection,
  toggleEquip
};