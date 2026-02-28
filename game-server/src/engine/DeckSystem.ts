import type { Card } from "../state/types.js";

/** Deck composition per card type for 4 players. Scaled proportionally for 5–8 players. */
const DECK_4_PLAYERS: Record<string, number> = {
  microwave: 8,
  freeze: 8,
  double_salt: 5,
  shake: 5,
  spoil: 5,
  salt: 15,
  trade_seats: 10,
  peek: 9,
  foil_wrap: 8,
  buffet: 8,
  trash: 8,
};

function getDeckComposition(playerCount: number): Record<string, number> {
  const scale = playerCount / 4;
  const composition: Record<string, number> = {};
  for (const [type, count4] of Object.entries(DECK_4_PLAYERS)) {
    composition[type] = Math.max(1, Math.round(count4 * scale));
  }
  return composition;
}

function createDeck(playerCount: number): Card[] {
  const composition = getDeckComposition(playerCount);
  const deck: Card[] = [];
  let id = 0;
  for (const [type, count] of Object.entries(composition)) {
    for (let i = 0; i < count; i++) {
      deck.push({ id: `card-${id++}`, type });
    }
  }
  return deck;
}

export function createShuffledDeck(playerCount: number): Card[] {
  const deck = createDeck(playerCount);
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

export function dealHands(
  deck: Card[],
  playerCount: number,
): { hands: Card[][]; remainingDeck: Card[] } {
  const hands: Card[][] = Array.from({ length: playerCount }, () => []);
  const cardsPerPlayer = 3;
  let index = 0;
  for (let p = 0; p < playerCount; p++) {
    for (let c = 0; c < cardsPerPlayer && index < deck.length; c++) {
      hands[p].push(deck[index++]);
    }
  }
  const remainingDeck = deck.slice(index);
  return { hands, remainingDeck };
}

export function drawCard(
  deck: Card[],
): { card: Card; remaining: Card[] } | null {
  if (deck.length === 0) return null;
  const [card, ...remaining] = deck;
  return { card, remaining };
}
