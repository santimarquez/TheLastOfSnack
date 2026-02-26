import type { Card } from "../state/types.js";

const CARD_TYPES = ["season", "reveal", "eliminate", "peek", "swap"] as const;
const DECK_SIZE = 24;

function createDeck(): Card[] {
  const deck: Card[] = [];
  let id = 0;
  for (let i = 0; i < DECK_SIZE; i++) {
    const type = CARD_TYPES[i % CARD_TYPES.length];
    deck.push({ id: `card-${id++}`, type });
  }
  return deck;
}

export function createShuffledDeck(): Card[] {
  const deck = createDeck();
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

export function dealHands(deck: Card[], playerCount: number): { hands: Card[][]; remainingDeck: Card[] } {
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

export function drawCard(deck: Card[]): { card: Card; remaining: Card[] } | null {
  if (deck.length === 0) return null;
  const [card, ...remaining] = deck;
  return { card, remaining };
}
