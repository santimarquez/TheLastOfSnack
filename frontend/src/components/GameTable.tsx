"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "@/i18n/context";
import { useGameStore } from "@/store/gameStore";
import { getCardMeta, CARD_BACK_IMAGE_URL } from "@/config/cards";
import { ActionCard, CARD_DRAG_TYPE, type CardDragData } from "./ActionCard";

export const DECK_DRAG_TYPE = "application/x-last-of-snack-deck-draw";
import { CardPreview } from "./CardPreview";
import { DrawCardFlying } from "./DrawCardFlying";
import { BuffetCardFlying } from "./BuffetCardFlying";
import styles from "./GameTable.module.css";

function useIsHost() {
  return useGameStore((s) => s.isHost);
}

type SendFn = (type: string, payload: Record<string, unknown>) => void;

/** Order players so "me" is at bottom (index n/2). */
function orderPlayersForArena<T>(items: T[], meIndex: number): T[] {
  if (meIndex < 0 || items.length === 0) return items;
  const n = items.length;
  const others = items.filter((_, i) => i !== meIndex);
  const me = items[meIndex];
  const mid = Math.floor(n / 2);
  return [...others.slice(0, mid), me, ...others.slice(mid)];
}

/** Split ordered players into top row and bottom row (me in bottom row). */
function splitPlayersTopBottom<T>(items: T[], meIndex: number): [T[], T[]] {
  if (meIndex < 0 || items.length === 0) return [[], []];
  const ordered = orderPlayersForArena(items, meIndex);
  const mid = Math.ceil(ordered.length / 2);
  return [ordered.slice(0, mid), ordered.slice(mid)];
}

export function GameTable({ send }: { send: SendFn }) {
  const { t } = useTranslations();
  const { gameState, playerId, drawAnimation, clearDrawAnimation, buffetAnimation, clearBuffetAnimation } = useGameStore();
  const isHost = useIsHost();
  const phase = gameState?.phase ?? "lobby";
  const me = gameState?.players?.find((p) => p.id === playerId);
  const players = gameState?.players ?? [];
  const meIndex = players.findIndex((p) => p.id === playerId);
  const [topPlayers, bottomPlayers] = splitPlayersTopBottom(players, meIndex >= 0 ? meIndex : 0);
  const currentPlayerId = (() => {
    if (phase !== "playing" || !gameState?.turnOrder?.length) return null;
    const eliminated = new Set(gameState.eliminatedPlayerIds ?? []);
    const order = gameState.turnOrder;
    let idx = gameState.currentTurnIndex % order.length;
    for (let i = 0; i < order.length; i++) {
      const id = order[idx];
      if (!eliminated.has(id)) return id;
      idx = (idx + 1) % order.length;
    }
    return null;
  })();
  const isMyTurn = currentPlayerId === playerId;
  const turnStartedAt = gameState?.turnStartedAt ?? 0;
  const turnTimeoutSec = gameState?.turnTimeoutSec ?? 60;

  const myHand = me?.hand ?? [];
  const myRole = me?.role;
  const [pendingCard, setPendingCard] = useState<{ id: string; type: string } | null>(null);
  const [selectedDiscardIds, setSelectedDiscardIds] = useState<Set<string>>(new Set());
  const [isDraggingCard, setIsDraggingCard] = useState(false);
  const [isDraggingFromDeck, setIsDraggingFromDeck] = useState(false);
  const [draggedCardData, setDraggedCardData] = useState<CardDragData | null>(null);
  /** Optimistic: cards just dropped, shown face-up until server confirms */
  const [pendingDiscardCards, setPendingDiscardCards] = useState<{ id: string; type: string }[]>([]);
  const [hoveredCard, setHoveredCard] = useState<{ id: string; type: string } | null>(null);
  const [previewCard, setPreviewCard] = useState<{ id: string; type: string } | null>(null);
  const [previewLeaving, setPreviewLeaving] = useState(false);
  const previewLeaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => {
    if (hoveredCard) {
      if (previewLeaveTimeoutRef.current) {
        clearTimeout(previewLeaveTimeoutRef.current);
        previewLeaveTimeoutRef.current = undefined;
      }
      setPreviewCard(hoveredCard);
      setPreviewLeaving(false);
    } else if (previewCard) {
      setPreviewLeaving(true);
      previewLeaveTimeoutRef.current = setTimeout(() => {
        setPreviewCard(null);
        setPreviewLeaving(false);
        previewLeaveTimeoutRef.current = undefined;
      }, 200);
    }
    return () => {
      if (previewLeaveTimeoutRef.current) clearTimeout(previewLeaveTimeoutRef.current);
    };
  }, [hoveredCard]);
  const revealedRoles = gameState?.revealedRoles ?? {};
  const revealedCategories = gameState?.revealedCategories ?? {};
  const shieldedCounts = (() => {
    const arr = gameState?.shieldedPlayerIds ?? [];
    const m = new Map<string, number>();
    for (const id of arr) m.set(id, (m.get(id) ?? 0) + 1);
    return m;
  })();
  const deckCount = gameState?.deckCount ?? 0;
  const currentTurnDrawn = gameState?.currentTurnDrawn ?? true;
  const needsToDraw = isMyTurn && !currentTurnDrawn && deckCount > 0;
  const serverDiscardPile = gameState?.discardPile ?? [];
  const discardPile = [...pendingDiscardCards, ...serverDiscardPile];
  const currentPlayer = currentPlayerId
    ? players.find((p) => p.id === currentPlayerId)
    : null;

  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (phase !== "playing" || !isMyTurn) return;
    const interval = setInterval(() => setTick((x) => x + 1), 1000);
    return () => clearInterval(interval);
  }, [phase, isMyTurn]);

  useEffect(() => {
    if (pendingDiscardCards.length === 0) return;
    const serverIds = new Set(serverDiscardPile.map((c) => c.id));
    setPendingDiscardCards((prev) => prev.filter((c) => !serverIds.has(c.id)));
  }, [serverDiscardPile]);

  // Timer: remaining seconds
  const elapsed = (Date.now() - turnStartedAt) / 1000;
  const remainingSec = Math.max(0, Math.min(turnTimeoutSec, Math.floor(turnTimeoutSec - elapsed)));
  const timerPct = turnTimeoutSec > 0 ? (remainingSec / turnTimeoutSec) * 100 : 0;

  const orderedPlayers = [...topPlayers, ...bottomPlayers];
  const validTargets = orderedPlayers.filter((p) => p.id !== playerId && p.status === "active");

  function parseDragData(e: React.DragEvent): CardDragData | null {
    const raw = e.dataTransfer.getData(CARD_DRAG_TYPE);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as CardDragData;
    } catch {
      return null;
    }
  }

  function handleDragStart(_e: React.DragEvent, data: CardDragData) {
    setIsDraggingCard(true);
    setDraggedCardData(data);
  }

  function handleDragEnd() {
    setIsDraggingCard(false);
    setIsDraggingFromDeck(false);
    setDraggedCardData(null);
  }

  const canDropOnDiscard =
    isMyTurn &&
    currentTurnDrawn &&
    draggedCardData &&
    !draggedCardData.requiresTarget;

  const canDropOnPlayer = (targetId: string) =>
    isMyTurn &&
    currentTurnDrawn &&
    draggedCardData?.requiresTarget &&
    validTargets.some((p) => p.id === targetId);

  function handleDiscardDrop(e: React.DragEvent) {
    e.preventDefault();
    const data = parseDragData(e);
    if (!data || !isMyTurn || !currentTurnDrawn || data.requiresTarget) return;
    if (data.requiresDiscardCards && data.requiresDiscardCards > 0) {
      setPendingCard({ id: data.cardId, type: data.type });
      setSelectedDiscardIds(new Set());
    } else {
      setPendingDiscardCards((prev) => [...prev, { id: data.cardId, type: data.type }]);
      send("play_card", { cardId: data.cardId });
    }
    setIsDraggingCard(false);
    setDraggedCardData(null);
  }

  function handlePlayerDrop(e: React.DragEvent, targetId: string) {
    e.preventDefault();
    const data = parseDragData(e);
    if (!data || !data.requiresTarget || !validTargets.some((p) => p.id === targetId)) return;
    send("play_card", { cardId: data.cardId, targetId });
    setIsDraggingCard(false);
    setDraggedCardData(null);
  }

  function handleDeckDragStart(e: React.DragEvent) {
    if (!needsToDraw) return;
    setIsDraggingFromDeck(true);
    e.dataTransfer.setData(DECK_DRAG_TYPE, "draw");
    e.dataTransfer.effectAllowed = "move";
    const deckCard = (e.currentTarget as HTMLElement).querySelector(`.${styles.deckCard}`);
    if (deckCard) e.dataTransfer.setDragImage(deckCard as HTMLElement, 40, 50);
  }

  function handleHandDrop(e: React.DragEvent) {
    e.preventDefault();
    if (!e.dataTransfer.types.includes(DECK_DRAG_TYPE)) return;
    send("draw_card", {});
  }

  return (
    <>
      {previewCard && (
        <CardPreview card={previewCard} isLeaving={previewLeaving} />
      )}
      {drawAnimation && (
        <DrawCardFlying
          targetPlayerId={drawAnimation.playerId}
          onComplete={clearDrawAnimation}
        />
      )}
      {buffetAnimation && (
        <BuffetCardFlying
          playerIds={buffetAnimation.playerIds}
          onComplete={clearBuffetAnimation}
        />
      )}
      <section className={styles.arenaSection}>
        <div className={styles.arenaBg} />
        <div className={styles.playersRowTop}>
          {topPlayers.map((p) => {
            const isYou = p.id === playerId;
            const isCurrent = p.id === currentPlayerId;
            const roleToShow = revealedRoles[p.id] ?? (isYou ? undefined : p.role);
            const canDrop = canDropOnPlayer(p.id);
            return (
              <div
                key={p.id}
                className={`${styles.playerSlot} ${isYou ? styles.playerSlotYou : ""} ${isCurrent ? styles.playerSlotCurrent : ""} ${p.status === "spectator" ? styles.playerSlotOut : ""}`}
              >
                {isCurrent && isYou && (
                  <div className={styles.yourTurnBadge}>{t("gameTable.yourTurn")}</div>
                )}
                {isCurrent && !isYou && (
                  <div className={styles.theirTurnBadge}>
                    {t("gameTable.waitingForTurn", { name: p.displayName })}
                  </div>
                )}
                <div
                  className={`${styles.playerAvatar} ${canDrop ? styles.dropZoneActive : ""}`}
                  data-player-avatar={p.id}
                  onDragOver={(e) => {
                    if (canDrop) {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = "move";
                    }
                  }}
                  onDrop={(e) => handlePlayerDrop(e, p.id)}
                >
                  {p.avatarUrl ? (
                    <img src={p.avatarUrl} alt="" className={styles.playerAvatarImg} />
                  ) : (
                    <span className="material-symbols-outlined">lunch_dining</span>
                  )}
                </div>
                <span className={styles.playerSlotName}>
                  {isYou ? t("gameTable.you") : p.displayName}
                  {p.isBot && (
                    <span className={styles.playerSlotBotIcon} title={t("lobby.bot")} aria-label={t("lobby.bot")}>
                      <span className="material-symbols-outlined">smart_toy</span>
                    </span>
                  )}
                </span>
                {roleToShow && (
                  <span className={styles.playerSlotRole}>{roleToShow.name}</span>
                )}
                {!roleToShow && revealedCategories[p.id] && (
                  <span className={styles.playerSlotCategory}>{revealedCategories[p.id]}</span>
                )}
                {shieldedCounts.get(p.id) != null && shieldedCounts.get(p.id)! > 0 && p.status === "active" && (
                  <span
                    className={styles.playerSlotShield}
                    title={
                      shieldedCounts.get(p.id)! > 1
                        ? t("gameTable.shieldCount", { count: String(shieldedCounts.get(p.id)!) })
                        : t("gameTable.shieldOne")
                    }
                  >
                    <span className="material-symbols-outlined">shield</span>
                    {shieldedCounts.get(p.id)! > 1 && (
                      <span className={styles.playerSlotShieldCount}>{shieldedCounts.get(p.id)}</span>
                    )}
                  </span>
                )}
                {p.status === "spectator" && <span className={styles.playerSlotOutLabel}>{t("gameTable.out")}</span>}
              </div>
            );
          })}
        </div>
        <div className={styles.arenaCircle}>
          <div className={styles.arenaInnerDashed} />
          <div className={styles.tableCenter}>
            {(phase === "playing" || phase === "ended") && (
              <div
                className={`${styles.deckPile} ${needsToDraw ? styles.deckPileDraggable : ""}`}
                draggable={needsToDraw}
                onDragStart={handleDeckDragStart}
                onDragEnd={handleDragEnd}
              >
                <div className={styles.deckCardWrap} data-deck-source>
                  <div
                    className={styles.deckCard}
                    title={String(deckCount)}
                    style={{ backgroundImage: `url(${CARD_BACK_IMAGE_URL})` }}
                  />
                  {needsToDraw && (
                    <span className={styles.deckDrawPrompt} aria-label={t("gameTable.drawCardPrompt")}>
                      <span className="material-symbols-outlined">touch_app</span>
                      {t("gameTable.drawCard")}
                    </span>
                  )}
                  <span className={styles.deckCountBadge} aria-label={t("gameTable.cardsLeft", { count: String(deckCount) })}>
                    {deckCount}
                  </span>
                </div>
                <span className={styles.deckLabel}>{t("gameHeader.deck")}</span>
              </div>
            )}
            <div
              className={`${styles.discardPile} ${styles.discardDropZone} ${canDropOnDiscard ? styles.dropZoneActive : ""}`}
              onDragOver={(e) => {
                if (canDropOnDiscard) {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                }
              }}
              onDragLeave={() => {}}
              onDrop={handleDiscardDrop}
            >
              <div className={styles.discardPileStack}>
                {discardPile
                  .slice(-8)
                  .reverse()
                  .map((card, i) => {
                    const meta = getCardMeta(card.type);
                    const rotation = ((i * 11) % 17) - 8;
                    const dx = ((i * 3) % 5) - 2;
                    const dy = ((i * 7) % 5) - 2;
                    return (
                      <div
                        key={card.id}
                        className={styles.discardPileCard}
                        style={
                          {
                            zIndex: i,
                            "--pile-rotation": `${rotation}deg`,
                            "--pile-dx": `${dx}px`,
                            "--pile-dy": `${dy}px`,
                          } as React.CSSProperties
                        }
                      >
                        <div
                          className={styles.discardPileCardBg}
                          style={
                            meta.imageUrl
                              ? { backgroundImage: `url(${meta.imageUrl})` }
                              : undefined
                          }
                        />
                        <span className={styles.discardPileCardTitle}>
                          {t(`cards.${card.type}.title`) !== `cards.${card.type}.title`
                            ? t(`cards.${card.type}.title`)
                            : card.type}
                        </span>
                      </div>
                    );
                  })}
              </div>
              <span className={styles.discardLabel}>{t("gameTable.discardPile")}</span>
            </div>
          </div>
        </div>
        <div className={styles.playersRowBottom}>
          {bottomPlayers.map((p) => {
              const isYou = p.id === playerId;
              const isCurrent = p.id === currentPlayerId;
              const roleToShow = revealedRoles[p.id] ?? (isYou ? undefined : p.role);
              const canDrop = canDropOnPlayer(p.id);
              return (
                <div
                  key={p.id}
                  className={`${styles.playerSlot} ${isYou ? styles.playerSlotYou : ""} ${isCurrent ? styles.playerSlotCurrent : ""} ${p.status === "spectator" ? styles.playerSlotOut : ""}`}
                >
                  {isCurrent && isYou && (
                    <div className={styles.yourTurnBadge}>{t("gameTable.yourTurn")}</div>
                  )}
                  {isCurrent && !isYou && (
                    <div className={styles.theirTurnBadge}>
                      {t("gameTable.waitingForTurn", { name: p.displayName })}
                    </div>
                  )}
                  <div
                    className={`${styles.playerAvatar} ${canDrop ? styles.dropZoneActive : ""}`}
                    data-player-avatar={p.id}
                    onDragOver={(e) => {
                      if (canDrop) {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = "move";
                      }
                    }}
                    onDrop={(e) => handlePlayerDrop(e, p.id)}
                  >
                    {p.avatarUrl ? (
                      <img src={p.avatarUrl} alt="" className={styles.playerAvatarImg} />
                    ) : (
                      <span className="material-symbols-outlined">lunch_dining</span>
                    )}
                  </div>
                  <span className={styles.playerSlotName}>
                    {isYou ? t("gameTable.you") : p.displayName}
                    {p.isBot && (
                      <span className={styles.playerSlotBotIcon} title={t("lobby.bot")} aria-label={t("lobby.bot")}>
                        <span className="material-symbols-outlined">smart_toy</span>
                      </span>
                    )}
                  </span>
                  {roleToShow && (
                    <span className={styles.playerSlotRole}>{roleToShow.name}</span>
                  )}
                  {!roleToShow && revealedCategories[p.id] && (
                    <span className={styles.playerSlotCategory}>{revealedCategories[p.id]}</span>
                  )}
                  {shieldedCounts.get(p.id) != null && shieldedCounts.get(p.id)! > 0 && p.status === "active" && (
                  <span
                    className={styles.playerSlotShield}
                    title={
                      shieldedCounts.get(p.id)! > 1
                        ? t("gameTable.shieldCount", { count: String(shieldedCounts.get(p.id)!) })
                        : t("gameTable.shieldOne")
                    }
                  >
                    <span className="material-symbols-outlined">shield</span>
                    {shieldedCounts.get(p.id)! > 1 && (
                      <span className={styles.playerSlotShieldCount}>{shieldedCounts.get(p.id)}</span>
                    )}
                  </span>
                )}
                  {p.status === "spectator" && <span className={styles.playerSlotOutLabel}>{t("gameTable.out")}</span>}
                </div>
              );
            })}
        </div>
      </section>

      <footer className={styles.hud}>
        <div className={styles.hudLeft}>
          <div className={styles.secretCard}>
            <span className={styles.hudLabel}>{t("gameTable.secretIdentity")}</span>
            <div className={styles.secretCardInner}>
              {me?.avatarUrl ? (
                <img src={me.avatarUrl} alt="" className={styles.secretCardAvatar} />
              ) : (
                <span className="material-symbols-outlined">restaurant</span>
              )}
              <p className={styles.secretCardName}>{myRole?.name ?? "?"}</p>
            </div>
          </div>
          <div className={styles.weaknessCard}>
            <span className={styles.hudLabelWeakness}>{t("gameTable.weakness")}</span>
            <div className={styles.weaknessContent}>
              {myRole?.weakness && myRole?.eliminatedBy ? (
                <>
                  <span className={styles.weaknessName}>{myRole.weakness}</span>
                  <span className={styles.weaknessEliminatedBy}>{myRole.eliminatedBy}</span>
                </>
              ) : (
                <span className={styles.weaknessName}>—</span>
              )}
            </div>
          </div>
        </div>
        <div className={styles.hudDivider} />
        {phase === "playing" && (myHand.length > 0 || needsToDraw) ? (
          <>
            {!isMyTurn && (
              <div className={styles.waitingForTurn}>
                <div className={styles.waitingAvatar}>
                  {currentPlayer?.avatarUrl ? (
                    <img src={currentPlayer.avatarUrl} alt="" className={styles.waitingAvatarImg} />
                  ) : (
                    <span className="material-symbols-outlined">lunch_dining</span>
                  )}
                </div>
                <p className={styles.waitingText}>
                  {currentPlayer
                    ? t("gameTable.waitingForTurn", { name: currentPlayer.displayName })
                    : t("gameTable.notYourTurnTitle")}
                </p>
              </div>
            )}
            <div className={styles.handSection}>
              {pendingCard && isMyTurn ? (
                (() => {
                  const meta = getCardMeta(pendingCard.type);
                  const discardCount = meta.requiresDiscardCards ?? 0;
                  if (discardCount > 0) {
                    const otherCards = myHand.filter((c) => c.id !== pendingCard.id);
                    const canConfirm = selectedDiscardIds.size === discardCount;
                    return (
                      <div className={styles.targetSelection}>
                        <p className={styles.targetSelectionLabel}>
                          {t("gameTable.selectCardsToDiscard", { count: String(discardCount) })}
                        </p>
                        <div className={styles.handCards}>
                          {otherCards.map((c) => {
                            const isSelected = selectedDiscardIds.has(c.id);
                            return (
                              <div
                                key={c.id}
                                className={isSelected ? styles.discardCardSelected : undefined}
                              >
                                <ActionCard
                                  card={c}
                                  playable
                                  onClick={() => {
                                    setSelectedDiscardIds((prev) => {
                                      const next = new Set(prev);
                                      if (next.has(c.id)) next.delete(c.id);
                                      else if (next.size < discardCount) next.add(c.id);
                                      return next;
                                    });
                                  }}
                                />
                              </div>
                            );
                          })}
                        </div>
                        <div className={styles.targetSelectionActions}>
                          <button
                            type="button"
                            className={styles.targetCancelBtn}
                            onClick={() => {
                              setPendingCard(null);
                              setSelectedDiscardIds(new Set());
                            }}
                          >
                            {t("common.close")}
                          </button>
                          <button
                            type="button"
                            className={styles.targetButton}
                            disabled={!canConfirm}
                            onClick={() => {
                              const discarded = Array.from(selectedDiscardIds);
                              const toAdd = [
                                { id: pendingCard.id, type: pendingCard.type },
                                ...discarded.map((id) => {
                                  const c = myHand.find((h) => h.id === id);
                                  return c ? { id: c.id, type: c.type } : null;
                                }).filter(Boolean) as { id: string; type: string }[],
                              ];
                              setPendingDiscardCards((prev) => [...prev, ...toAdd]);
                              send("play_card", {
                                cardId: pendingCard.id,
                                discardedCardIds: discarded,
                              });
                              setPendingCard(null);
                              setSelectedDiscardIds(new Set());
                            }}
                          >
                            {t("gameTable.discard")}
                          </button>
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div className={styles.targetSelection}>
                      <p className={styles.targetSelectionLabel}>{t("gameTable.selectTarget")}</p>
                      <div className={styles.targetSelectionPlayers}>
                        {orderedPlayers
                          .filter((p) => p.id !== playerId && p.status === "active")
                          .map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              className={styles.targetButton}
                              onClick={() => {
                                send("play_card", { cardId: pendingCard.id, targetId: p.id });
                                setPendingCard(null);
                              }}
                            >
                              <div className={styles.targetAvatar}>
                                {p.avatarUrl ? (
                                  <img src={p.avatarUrl} alt="" />
                                ) : (
                                  <span className="material-symbols-outlined">lunch_dining</span>
                                )}
                              </div>
                              <span>{p.displayName}</span>
                            </button>
                          ))}
                      </div>
                      <button
                        type="button"
                        className={styles.targetCancelBtn}
                        onClick={() => setPendingCard(null)}
                      >
                        {t("common.close")}
                      </button>
                    </div>
                  );
                })()
              ) : (
                <div
                  className={`${styles.handCards} ${needsToDraw && isDraggingFromDeck ? styles.handDropZoneActive : ""}`}
                  onDragOver={(e) => {
                    if (needsToDraw && e.dataTransfer.types.includes(DECK_DRAG_TYPE)) {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = "move";
                    }
                  }}
                  onDragLeave={() => {}}
                  onDrop={handleHandDrop}
                >
                  {myHand.length === 0 && needsToDraw ? (
                    <div className={styles.handDrawPlaceholder}>
                      <span className="material-symbols-outlined">back_hand</span>
                      <span>{t("gameTable.dragDeckHere")}</span>
                    </div>
                  ) : (
                  myHand.map((c) => (
                      <div
                        key={c.id}
                        onMouseEnter={() => setHoveredCard(c)}
                        onMouseLeave={() => setHoveredCard(null)}
                      >
                        <ActionCard
                          card={c}
                          playable={isMyTurn && currentTurnDrawn}
                          disabled={phase !== "playing" || !isMyTurn || !currentTurnDrawn}
                          draggable={!pendingCard && isMyTurn && currentTurnDrawn}
                          onDragStart={handleDragStart}
                          onDragEnd={handleDragEnd}
                        />
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
            {isMyTurn && (
              <div className={styles.hudRight}>
              <div className={styles.timerWrap}>
                <svg className={styles.timerSvg} viewBox="0 0 80 80">
                  <circle className={styles.timerBg} cx="40" cy="40" r="34" />
                  <circle
                    className={styles.timerFill}
                    cx="40"
                    cy="40"
                    r="34"
                    style={{
                      strokeDasharray: 213.6,
                      strokeDashoffset: 213.6 - (213.6 * timerPct) / 100,
                    }}
                  />
                </svg>
                <div className={styles.timerText}>
                  <span className={styles.timerNum}>{remainingSec}</span>
                  <span className={styles.timerUnit}>{t("gameTable.timerUnit")}</span>
                </div>
              </div>
              <button
                type="button"
                className={styles.endTurnBtn}
                disabled={phase !== "playing" || !currentTurnDrawn}
                title={t("gameTable.endTurnTitle")}
                onClick={() => send("end_turn", {})}
              >
                <span>{t("gameTable.endTurn")}</span>
                <span className="material-symbols-outlined">double_arrow</span>
              </button>
            </div>
            )}
          </>
        ) : phase === "playing" ? (
          <div className={styles.waitingForTurn}>
            <div className={styles.waitingAvatar}>
              {currentPlayer?.avatarUrl ? (
                <img src={currentPlayer.avatarUrl} alt="" className={styles.waitingAvatarImg} />
              ) : (
                <span className="material-symbols-outlined">lunch_dining</span>
              )}
            </div>
            <p className={styles.waitingText}>
              {currentPlayer
                ? t("gameTable.waitingForTurn", { name: currentPlayer.displayName })
                : t("gameTable.notYourTurnTitle")}
            </p>
          </div>
        ) : null}
      </footer>
    </>
  );
}
