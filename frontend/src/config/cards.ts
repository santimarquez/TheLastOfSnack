/**
 * Action card metadata: display info and behavior.
 * Cards with requiresTarget need the user to pick a player before playing.
 * Cards with requiresDiscardCards need the user to select N cards from hand to discard.
 */
export interface CardMeta {
  type: string;
  imageUrl: string;
  requiresTarget: boolean;
  /** Number of cards to select from hand to discard (e.g. 2 for Trash) */
  requiresDiscardCards?: number;
}

/** Card back (reverse) image shown on the face-down deck. */
export const CARD_BACK_IMAGE_URL =
  "https://imagedelivery.net/F646Wun-eua00pA0NmkORQ/ed31476a-0e41-4ca5-a7d7-bf4347b9f300/public";

export const CARD_META: Record<string, CardMeta> = {
  microwave: {
    type: "microwave",
    imageUrl:
      "https://imagedelivery.net/F646Wun-eua00pA0NmkORQ/3e981812-cac0-49a5-dd1b-2510db65c900/public",
    requiresTarget: true,
  },
  freeze: {
    type: "freeze",
    imageUrl:
      "https://imagedelivery.net/F646Wun-eua00pA0NmkORQ/bcd882d4-6a81-4b45-27a5-fe5576672500/public",
    requiresTarget: true,
  },
  salt: {
    type: "salt",
    imageUrl:
      "https://imagedelivery.net/F646Wun-eua00pA0NmkORQ/10c74fe3-5145-48b8-b422-b04b2e549500/public",
    requiresTarget: true,
  },
  double_salt: {
    type: "double_salt",
    imageUrl:
      "https://imagedelivery.net/F646Wun-eua00pA0NmkORQ/5fbb0f25-12ee-456e-5c86-ad7efa97a200/public",
    requiresTarget: false,
  },
  shake: {
    type: "shake",
    imageUrl:
      "https://imagedelivery.net/F646Wun-eua00pA0NmkORQ/74e951b6-8216-4cf1-10e5-fefb4f01c400/public",
    requiresTarget: false,
  },
  spoil: {
    type: "spoil",
    imageUrl:
      "https://imagedelivery.net/F646Wun-eua00pA0NmkORQ/356e547e-76aa-420b-fe0a-18fa53a24900/public",
    requiresTarget: false,
  },
  buffet: {
    type: "buffet",
    imageUrl:
      "https://imagedelivery.net/F646Wun-eua00pA0NmkORQ/567fe342-b01d-4120-763e-a8d6b89b3700/public",
    requiresTarget: false,
  },
  trash: {
    type: "trash",
    imageUrl:
      "https://imagedelivery.net/F646Wun-eua00pA0NmkORQ/12bb9be5-0d46-4e91-058e-76cb5f1f8400/public",
    requiresTarget: false,
    requiresDiscardCards: 2,
  },
  trade_seats: {
    type: "trade_seats",
    imageUrl:
      "https://imagedelivery.net/F646Wun-eua00pA0NmkORQ/04e2b023-0a46-4246-0f88-a937816b1000/public",
    requiresTarget: true,
  },
  foil_wrap: {
    type: "foil_wrap",
    imageUrl:
      "https://imagedelivery.net/F646Wun-eua00pA0NmkORQ/048713b8-be76-4ace-88ca-50d7fa583f00/public",
    requiresTarget: false,
  },
  peek: {
    type: "peek",
    imageUrl:
      "https://imagedelivery.net/F646Wun-eua00pA0NmkORQ/189495ed-6273-491f-8bc5-bcbed84d2f00/public",
    requiresTarget: true,
  },
};

export function getCardMeta(type: string): CardMeta {
  return (
    CARD_META[type] ?? {
      type,
      imageUrl: "",
      requiresTarget: false,
    }
  );
}
