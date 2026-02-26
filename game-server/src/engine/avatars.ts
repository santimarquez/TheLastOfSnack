/**
 * 12 snack avatars: 2 per type (Pizza, Donut, Burger, Ice cream, Sushi, Taco).
 * Same avatar is never assigned to two players in the same game.
 */
export const AVATAR_URLS: Record<string, string> = {
  pizza_1: "https://imagedelivery.net/F646Wun-eua00pA0NmkORQ/9c2cf3ca-8b09-4f38-476f-0cff7e7e8200/mobile",
  pizza_2: "https://imagedelivery.net/F646Wun-eua00pA0NmkORQ/c573564b-b212-4940-2f09-f8df9ea0ba00/mobile",
  donut_1: "https://imagedelivery.net/F646Wun-eua00pA0NmkORQ/2ef6f79a-bfe2-4ea9-af33-0e6fac797100/mobile",
  donut_2: "https://imagedelivery.net/F646Wun-eua00pA0NmkORQ/41f63b65-48a3-4477-4dab-8e8483ea7b00/mobile",
  burger_1: "https://imagedelivery.net/F646Wun-eua00pA0NmkORQ/8dafe961-1c44-409c-1b07-06f6102f0100/mobile",
  burger_2: "https://imagedelivery.net/F646Wun-eua00pA0NmkORQ/1015163e-00b9-488d-1afe-cce3e433f200/mobile",
  ice_cream_1: "https://imagedelivery.net/F646Wun-eua00pA0NmkORQ/d0b86651-011b-4751-2f79-45f2590b5b00/mobile",
  ice_cream_2: "https://imagedelivery.net/F646Wun-eua00pA0NmkORQ/0b4f20eb-5eb9-406b-e72a-daf01c344300/mobile",
  sushi_1: "https://imagedelivery.net/F646Wun-eua00pA0NmkORQ/41dbba69-930c-4b28-55c0-2b75c567c800/mobile",
  sushi_2: "https://imagedelivery.net/F646Wun-eua00pA0NmkORQ/3ec99e92-8c99-4a77-4579-339b71f69500/mobile",
  taco_1: "https://imagedelivery.net/F646Wun-eua00pA0NmkORQ/4aaa285e-2c67-41fe-3925-323075dd8a00/mobile",
  taco_2: "https://imagedelivery.net/F646Wun-eua00pA0NmkORQ/1dc03a6e-a0bd-49b3-69a1-f9d623308000/mobile",
};

/** All avatar IDs (for lobby assignment). */
export const ALL_AVATAR_IDS = Object.keys(AVATAR_URLS) as string[];

/** Snack type id -> [avatarId1, avatarId2]. Only snack types with avatars. */
export const AVATAR_IDS_BY_SNACK: Record<string, [string, string]> = {
  pizza: ["pizza_1", "pizza_2"],
  donut: ["donut_1", "donut_2"],
  burger: ["burger_1", "burger_2"],
  ice_cream: ["ice_cream_1", "ice_cream_2"],
  sushi: ["sushi_1", "sushi_2"],
  taco: ["taco_1", "taco_2"],
};
