/* DB에 저장할 수 없으니 데이터 보관을 위한 공간 */

export const Avatars = [
  // 커몬 등급
  { id: 1, name: "노멀1", grade: "common", image_url: "src/assets/avatar/common_dog.png" },
  { id: 2, name: "노멀2", grade: "common", image_url: "src/assets/avatar/common_cat.png" },
  { id: 3, name: "노멀3", grade: "common", image_url: "src/assets/avatar/common_rabbit.png" },
  { id: 4, name: "노멀4", grade: "common", image_url: "src/assets/avatar/common_bear.png" },

  // 레어 등급
  { id: 5, name: "레어1", grade: "rare", image_url: "src/assets/avatar/rare_dog.png" },
  { id: 6, name: "레어2", grade: "rare", image_url: "src/assets/avatar/rare_cat.png" },
  { id: 7, name: "레어3", grade: "rare", image_url: "src/assets/avatar/rare_rabbit.png" },

  // 유니크 등급
  { id: 8, name: "유니크1", grade: "unique", video_url: "src/assets/avatar/dog.mp4" },
  { id: 9, name: "유니크2", grade: "unique", video_url: "src/assets/avatar/cat.mp4" },

  // 에픽 등급
  { id: 10, name: "에픽", grade: "epic", video_url: "src/assets/avatar/lion.mp4" }
] as const;