const express = require("express");
const { drawItem, toggleEquip, fetchCollection } = require("../controllers/collectionController");

const router = express.Router();

// 뽑기
router.post("/draw", drawItem);

// 장착 변경
router.post("/toggle-equip", toggleEquip);

// 컬렉션 조회
router.get("/:userId", fetchCollection);

module.exports = router;