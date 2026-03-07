"use client";

import { useState, useEffect, useRef, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "@/i18n/context";
import { useGameStore, type ActionLogEntry } from "@/store/gameStore";
import { getCardMeta, CARD_BACK_IMAGE_URL } from "@/config/cards";
import { ActionCard, CARD_DRAG_TYPE, type CardDragData } from "./ActionCard";

export const DECK_DRAG_TYPE = "application/x-last-of-snack-deck-draw";
import { CardPreview } from "./CardPreview";
import { DrawCardFlying } from "./DrawCardFlying";
import { BuffetCardFlying } from "./BuffetCardFlying";
import { TradeSeatsAnimation } from "./TradeSeatsAnimation";
import { CardPlayedAnimation } from "./CardPlayedAnimation";
import { ShieldConsumedAnimation } from "./ShieldConsumedAnimation";
import { TrashDiscardFlying } from "./TrashDiscardFlying";
import { ALL_SNACK_IDS } from "@last-of-snack/shared";
import styles from "./GameTable.module.css";

/** Convert snack id to PascalCase for i18n keys (e.g. ice_cream -> IceCream). */
function snackIdToPascal(id: string): string {
  return id
    .split("_")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join("");
}

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
  const {
    gameState,
    playerId,
    drawAnimation,
    setDrawAnimation,
    clearDrawAnimation,
    buffetAnimation,
    clearBuffetAnimation,
    tradeSeatsAnimation,
    clearTradeSeatsAnimation,
    cardPlayedAnimation,
    clearCardPlayedAnimation,
    shieldConsumedAnimation,
    clearShieldConsumedAnimation,
    trashDiscardAnimation,
    clearTrashDiscardAnimation,
    actionLog,
    requestExpandActionLog,
    setRequestExpandActionLog,
  } = useGameStore();
  const isHost = useIsHost();
  const phase = gameState?.phase ?? "lobby";
  const [actionLogCollapsed, setActionLogCollapsed] = useState(true);
  const [actionLogAutoScroll, setActionLogAutoScroll] = useState(true);
  const actionLogListRef = useRef<HTMLDivElement>(null);
  const me = gameState?.players?.find((p) => p.id === playerId);
  const players = gameState?.players ?? [];
  const meIndex = players.findIndex((p) => p.id === playerId);
  const [topPlayers, bottomPlayers] = splitPlayersTopBottom(
    players,
    meIndex >= 0 ? meIndex : 0,
  );
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
  const [pendingCard, setPendingCard] = useState<{
    id: string;
    type: string;
  } | null>(null);
  const [selectedDiscardIds, setSelectedDiscardIds] = useState<Set<string>>(
    new Set(),
  );
  const [isDraggingCard, setIsDraggingCard] = useState(false);
  const [isDraggingFromDeck, setIsDraggingFromDeck] = useState(false);
  const [draggedCardData, setDraggedCardData] = useState<CardDragData | null>(
    null,
  );
  /** Optimistic: cards just dropped, shown face-up until server confirms */
  const [pendingDiscardCards, setPendingDiscardCards] = useState<
    { id: string; type: string }[]
  >([]);
  const [hoveredCard, setHoveredCard] = useState<{
    id: string;
    type: string;
  } | null>(null);
  const [previewCard, setPreviewCard] = useState<{
    id: string;
    type: string;
  } | null>(null);
  const [previewLeaving, setPreviewLeaving] = useState(false);
  const previewLeaveTimeoutRef = useRef<
    ReturnType<typeof setTimeout> | undefined
  >(undefined);
  const [arenaScale, setArenaScale] = useState(1);
  const arenaWrapRef = useRef<HTMLDivElement>(null);
  const arenaContentRef = useRef<HTMLDivElement>(null);
  const [showWeaknessTable, setShowWeaknessTable] = useState(false);
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
      if (previewLeaveTimeoutRef.current)
        clearTimeout(previewLeaveTimeoutRef.current);
    };
  }, [hoveredCard]);

  // Close preview when we play a card (turn ends)
  useEffect(() => {
    if (cardPlayedAnimation?.playerId === playerId) {
      if (previewLeaveTimeoutRef.current) {
        clearTimeout(previewLeaveTimeoutRef.current);
        previewLeaveTimeoutRef.current = undefined;
      }
      setPreviewCard(null);
      setPreviewLeaving(false);
    }
  }, [cardPlayedAnimation, playerId]);

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
  const needsToDraw = isMyTurn && !currentTurnDrawn && deckCount > 0 && !buffetAnimation;
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

  // Action log: auto-scroll to bottom when new entries and autoScroll enabled
  useEffect(() => {
    if (!actionLogAutoScroll || actionLogCollapsed) return;
    const el = actionLogListRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [actionLog, actionLogAutoScroll, actionLogCollapsed]);

  // Expand action log when requested (e.g. from "View Rankings" in elimination pop-up)
  useEffect(() => {
    if (requestExpandActionLog) {
      setActionLogCollapsed(false);
      setActionLogAutoScroll(true);
      setRequestExpandActionLog(false);
    }
  }, [requestExpandActionLog, setRequestExpandActionLog]);

  // Scale the arena table to fit available space; hand section keeps fixed size
  useLayoutEffect(() => {
    const wrap = arenaWrapRef.current;
    const content = arenaContentRef.current;
    if (!wrap || !content) return;
    const update = () => {
      const cw = wrap.clientWidth;
      const ch = wrap.clientHeight;
      const w = content.offsetWidth;
      const h = content.offsetHeight;
      if (w <= 0 || h <= 0) return;
      const scale = Math.min(1, cw / w, ch / h);
      setArenaScale(scale);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [phase, topPlayers.length, bottomPlayers.length]);

  function handleActionLogScroll() {
    const el = actionLogListRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    if (distanceFromBottom <= 5) {
      setActionLogAutoScroll(true);
    } else if (scrollTop > 500) {
      setActionLogAutoScroll(false);
    }
  }

  function scrollActionLogToBottom() {
    const el = actionLogListRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
      setActionLogAutoScroll(true);
    }
  }

  // Timer: remaining seconds
  const elapsed = (Date.now() - turnStartedAt) / 1000;
  const remainingSec = Math.max(
    0,
    Math.min(turnTimeoutSec, Math.floor(turnTimeoutSec - elapsed)),
  );
  const timerPct =
    turnTimeoutSec > 0 ? (remainingSec / turnTimeoutSec) * 100 : 0;

  const orderedPlayers = [...topPlayers, ...bottomPlayers];
  const validTargets = orderedPlayers.filter(
    (p) => p.id !== playerId && p.status === "active",
  );
  const eliminatedSet = new Set(gameState?.eliminatedPlayerIds ?? []);

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
    !draggedCardData.requiresTarget &&
    draggedCardData.type !== "foil_wrap";

  const canDropOnPlayer = (targetId: string) => {
    if (!isMyTurn || !currentTurnDrawn || !draggedCardData) return false;
    if (draggedCardData.type === "foil_wrap") return targetId === playerId;
    return (
      Boolean(draggedCardData.requiresTarget) &&
      validTargets.some((p) => p.id === targetId)
    );
  };

  function handleDiscardDrop(e: React.DragEvent) {
    e.preventDefault();
    const data = parseDragData(e);
    if (!data || !isMyTurn || !currentTurnDrawn || data.requiresTarget) return;
    if (data.type === "foil_wrap") return;
    if (data.requiresDiscardCards && data.requiresDiscardCards > 0) {
      setPendingCard({ id: data.cardId, type: data.type });
      setSelectedDiscardIds(new Set());
    } else {
      setPendingDiscardCards((prev) => [
        ...prev,
        { id: data.cardId, type: data.type },
      ]);
      send("play_card", { cardId: data.cardId });
    }
    setIsDraggingCard(false);
    setDraggedCardData(null);
  }

  function handlePlayerDrop(e: React.DragEvent, targetId: string) {
    e.preventDefault();
    const data = parseDragData(e);
    if (!data) return;
    const isFoilWrapOnSelf = data.type === "foil_wrap" && targetId === playerId;
    const isTargetOnOther =
      data.requiresTarget && validTargets.some((p) => p.id === targetId);
    if (!isFoilWrapOnSelf && !isTargetOnOther) return;
    send("play_card", { cardId: data.cardId, targetId });
    setIsDraggingCard(false);
    setDraggedCardData(null);
  }

  function handleDeckDragStart(e: React.DragEvent) {
    if (!needsToDraw) return;
    setIsDraggingFromDeck(true);
    e.dataTransfer.setData(DECK_DRAG_TYPE, "draw");
    e.dataTransfer.effectAllowed = "move";
    const deckCard = (e.currentTarget as HTMLElement).querySelector(
      `.${styles.deckCard}`,
    );
    if (deckCard) e.dataTransfer.setDragImage(deckCard as HTMLElement, 40, 50);
  }

  function handleHandDrop(e: React.DragEvent) {
    e.preventDefault();
    if (!e.dataTransfer.types.includes(DECK_DRAG_TYPE)) return;
    if (playerId) setDrawAnimation({ playerId });
    send("draw_card", {});
  }

  function formatActionLogEntry(entry: ActionLogEntry): string {
    const cardTitle = (type: string) => {
      const key = `cards.${type}.title`;
      const out = t(key);
      return out !== key ? out : type;
    };
    switch (entry.kind) {
      case "turn":
        return t("gameTable.actionLogTurn", { name: entry.playerName });
      case "draw":
        return t("gameTable.actionLogDraw", { name: entry.playerName });
      case "play":
        return t("gameTable.actionLogPlay", {
          name: entry.playerName,
          card: cardTitle(entry.cardType),
        });
      case "play_target":
        return t("gameTable.actionLogPlayOn", {
          name: entry.playerName,
          card: cardTitle(entry.cardType),
          target: entry.targetName,
        });
      case "eliminated":
        return t("gameTable.actionLogEliminated", {
          name: entry.playerName,
          role: entry.roleName,
        });
      case "game_over_winner":
        return t("gameTable.actionLogGameOverWinner", {
          winner: entry.winnerName,
        });
      case "game_over_draw":
        return t("gameTable.actionLogGameOverDraw");
      default:
        return "";
    }
  }

  const showActionLog = phase === "playing" || phase === "ended";

  return (
    <div className={styles.gameTableWrap}>
      <div className={styles.gameTableMain}>
        {showActionLog && (
          <div
            className={styles.actionLogContainer}
            aria-label={t("gameTable.actionLogTitle")}>
            <section
              className={`${styles.actionLogPanel} ${actionLogCollapsed ? styles.actionLogPanelHidden : ""}`}
              aria-hidden={actionLogCollapsed}>
              <div className={styles.actionLogHeader}>
                <span
                  className={`material-symbols-outlined ${styles.actionLogHeaderIcon}`}>
                  history
                </span>
                <h3 className={styles.actionLogHeaderTitle}>
                  {t("gameTable.actionLogTitle")}
                </h3>
                <button
                  type="button"
                  className={styles.actionLogCollapseBtn}
                  onClick={() => setActionLogCollapsed(true)}
                  aria-label={t("gameTable.actionLogCollapse")}>
                  <span className="material-symbols-outlined">
                    chevron_left
                  </span>
                </button>
              </div>
              <div className={styles.actionLogContent}>
                <div
                  ref={actionLogListRef}
                  className={styles.actionLogList}
                  role="log"
                  aria-live="polite"
                  onScroll={handleActionLogScroll}>
                  {actionLog.length === 0 ? (
                    <p className={styles.actionLogEmpty}>
                      {t("gameTable.actionLogEmpty")}
                    </p>
                  ) : (
                    actionLog.map((entry) => (
                      <div key={entry.id} className={styles.actionLogEntry}>
                        {formatActionLogEntry(entry)}
                      </div>
                    ))
                  )}
                </div>
                {!actionLogAutoScroll && (
                  <button
                    type="button"
                    className={styles.actionLogScrollDown}
                    onClick={scrollActionLogToBottom}
                    aria-label={t("gameTable.actionLogScrollDown")}>
                    <span className="material-symbols-outlined">
                      keyboard_arrow_down
                    </span>
                  </button>
                )}
              </div>
            </section>
            <div
              className={`${styles.actionLogCollapsedBar} ${!actionLogCollapsed ? styles.actionLogPanelHidden : ""}`}
              aria-hidden={!actionLogCollapsed}>
              <button
                type="button"
                className={styles.actionLogToggleBtn}
                onClick={() => setActionLogCollapsed(false)}
                aria-label={t("gameTable.actionLogExpand")}>
                <span className="material-symbols-outlined">history</span>
                <span className={styles.actionLogToggleLabel}>
                  {t("gameTable.actionLogTitle")}
                </span>
              </button>
            </div>
          </div>
        )}
        {previewCard && (
          <CardPreview card={previewCard} isLeaving={previewLeaving} />
        )}
        {drawAnimation && (
          <DrawCardFlying
            targetPlayerId={drawAnimation.playerId}
            currentPlayerId={playerId}
            onComplete={clearDrawAnimation}
          />
        )}
        {buffetAnimation && (
          <BuffetCardFlying
            playerIds={buffetAnimation.playerIds}
            onComplete={clearBuffetAnimation}
          />
        )}
        {trashDiscardAnimation && (
          <TrashDiscardFlying
            targetId={trashDiscardAnimation.targetId}
            cards={trashDiscardAnimation.cards}
            onComplete={clearTrashDiscardAnimation}
          />
        )}
        {tradeSeatsAnimation && (
          <TradeSeatsAnimation
            playerId1={tradeSeatsAnimation.playerId1}
            playerId2={tradeSeatsAnimation.playerId2}
            players={players}
            onComplete={clearTradeSeatsAnimation}
          />
        )}
        {cardPlayedAnimation && (
          <CardPlayedAnimation
            cardType={cardPlayedAnimation.cardType}
            playerId={cardPlayedAnimation.playerId}
            destination={cardPlayedAnimation.destination}
            startRect={cardPlayedAnimation.startRect}
            onComplete={clearCardPlayedAnimation}
          />
        )}
        {shieldConsumedAnimation && (
          <ShieldConsumedAnimation
            targetPlayerId={shieldConsumedAnimation.targetPlayerId}
            onComplete={clearShieldConsumedAnimation}
          />
        )}
        <section className={styles.arenaSection}>
          <div className={styles.arenaBg} />
          <div className={styles.arenaTableWrap} ref={arenaWrapRef}>
            <div
              className={styles.arenaTableScaled}
              ref={arenaContentRef}
              style={{
                transform: `scale(${arenaScale})`,
                transformOrigin: "center center",
              }}>
              <div className={styles.playersRowTop}>
                {topPlayers.map((p) => {
                  const isYou = p.id === playerId;
                  const isCurrent = p.id === currentPlayerId;
                  const roleToShow =
                    revealedRoles[p.id] ?? (isYou ? undefined : p.role);
                  const canDrop = canDropOnPlayer(p.id);
                  return (
                    <div
                      key={p.id}
                      className={`${styles.playerSlot} ${isYou ? styles.playerSlotYou : ""} ${isCurrent ? styles.playerSlotCurrent : ""} ${p.status === "spectator" ? styles.playerSlotOut : ""}`}>
                      {isCurrent && isYou && (
                        <div
                          className={styles.yourTurnBadge}
                          role="status"
                          aria-label={t("gameTable.yourTurn")}>
                          <span className="material-symbols-outlined" aria-hidden>
                            expand_more
                          </span>
                        </div>
                      )}
                      {isCurrent && !isYou && (
                        <div
                          className={styles.theirTurnBadge}
                          role="status"
                          aria-label={t("gameTable.waitingForTurn", {
                            name: p.displayName,
                          })}>
                          <span className="material-symbols-outlined" aria-hidden>
                            expand_more
                          </span>
                        </div>
                      )}
                      <div className={styles.playerAvatarWrap}>
                        <div
                          className={`${styles.playerAvatar} ${canDrop ? styles.dropZoneActive : ""}`}
                          data-player-avatar={p.id}
                          onDragOver={(e) => {
                            if (canDrop) {
                              e.preventDefault();
                              e.dataTransfer.dropEffect = "move";
                            }
                          }}
                          onDrop={(e) => handlePlayerDrop(e, p.id)}>
                          {p.avatarUrl ? (
                            <img
                              src={p.avatarUrl}
                              alt=""
                              className={styles.playerAvatarImg}
                            />
                          ) : (
                            <span className="material-symbols-outlined">
                              lunch_dining
                            </span>
                          )}
                          {isDraggingCard && canDrop && (
                            <span
                              className={`${styles.dropZoneHint} ${styles.dropZoneHintTwoLines}`}>
                              {draggedCardData?.type === "foil_wrap" && p.id === playerId
                                ? t("gameTable.dropToProtect")
                                : t("gameTable.dropToTarget")}
                              <br />
                              {p.displayName}
                            </span>
                          )}
                        </div>
                        {eliminatedSet.has(p.id) && (
                          <div
                            className={styles.playerAvatarEliminatedCross}
                            aria-hidden
                            title={t("gameTable.eliminated")}
                          />
                        )}
                        {shieldedCounts.get(p.id) != null &&
                          shieldedCounts.get(p.id)! > 0 &&
                          p.status === "active" && (
                            <div
                              className={styles.playerAvatarFoilWrap}
                              style={{
                                backgroundImage: `url(${getCardMeta("foil_wrap").imageUrl})`,
                              }}
                              title={
                                shieldedCounts.get(p.id)! > 1
                                  ? t("gameTable.shieldCount", {
                                      count: String(shieldedCounts.get(p.id)!),
                                    })
                                  : t("gameTable.shieldOne")
                              }>
                              {shieldedCounts.get(p.id)! > 1 && (
                                <span
                                  className={styles.playerAvatarFoilWrapCount}>
                                  {shieldedCounts.get(p.id)}
                                </span>
                              )}
                            </div>
                          )}
                      </div>
                      <span className={styles.playerSlotName}>
                        {isYou ? t("gameTable.you") : p.displayName}
                        {p.isBot && (
                          <span
                            className={styles.playerSlotBotIcon}
                            title={t("lobby.bot")}
                            aria-label={t("lobby.bot")}>
                            <span className="material-symbols-outlined">
                              smart_toy
                            </span>
                          </span>
                        )}
                      </span>
                      {roleToShow && (
                        <span className={styles.playerSlotRole}>
                          {roleToShow.name}
                        </span>
                      )}
                      {!roleToShow && revealedCategories[p.id] && (
                        <span className={styles.playerSlotCategory}>
                          {t(
                            `cardReveal.${(revealedCategories[p.id] ?? "").toLowerCase()}`,
                          )}
                        </span>
                      )}
                      {p.status === "spectator" && (
                        <span className={styles.playerSlotOutLabel}>
                          {t("gameTable.out")}
                        </span>
                      )}
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
                      onDoubleClick={() => {
                        if (needsToDraw && playerId) {
                          setDrawAnimation({ playerId });
                          send("draw_card", {});
                        }
                      }}
                      role={needsToDraw ? "button" : undefined}
                      aria-label={
                        needsToDraw ? t("gameTable.drawCard") : undefined
                      }>
                      <div className={styles.deckCardWrap} data-deck-source>
                        <div
                          className={styles.deckCard}
                          title={String(deckCount)}
                          style={{
                            backgroundImage: `url(${CARD_BACK_IMAGE_URL})`,
                          }}
                        />
                        {needsToDraw && (
                          <span
                            className={styles.deckDrawPrompt}
                            aria-label={t("gameTable.drawCardPrompt")}>
                            <span className="material-symbols-outlined">
                              touch_app
                            </span>
                            {t("gameTable.drawCard")}
                          </span>
                        )}
                        <span
                          className={styles.deckCountBadge}
                          aria-label={t("gameTable.cardsLeft", {
                            count: String(deckCount),
                          })}>
                          {deckCount}
                        </span>
                      </div>
                      <span className={styles.deckLabel}>
                        {t("gameHeader.deck")}
                      </span>
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
                    onDrop={handleDiscardDrop}>
                    {isDraggingCard && canDropOnDiscard && (
                      <span className={styles.dropZoneHint}>
                        {t("gameTable.dropToDiscard")}
                      </span>
                    )}
                    <div className={styles.discardPileStack} data-discard-pile>
                      {discardPile
                        .slice(-8)
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
                              }>
                              <div
                                className={styles.discardPileCardBg}
                                style={
                                  meta.imageUrl
                                    ? {
                                        backgroundImage: `url(${meta.imageUrl})`,
                                      }
                                    : undefined
                                }
                              />
                              <span className={styles.discardPileCardTitle}>
                                {t(`cards.${card.type}.title`) !==
                                `cards.${card.type}.title`
                                  ? t(`cards.${card.type}.title`)
                                  : card.type}
                              </span>
                            </div>
                          );
                        })}
                    </div>
                    <span className={styles.discardLabel}>
                      {t("gameTable.discardPile")}
                    </span>
                  </div>
                </div>
              </div>
              <div className={styles.playersRowBottom}>
                {bottomPlayers.map((p) => {
                  const isYou = p.id === playerId;
                  const isCurrent = p.id === currentPlayerId;
                  const roleToShow =
                    revealedRoles[p.id] ?? (isYou ? undefined : p.role);
                  const canDrop = canDropOnPlayer(p.id);
                  return (
                    <div
                      key={p.id}
                      className={`${styles.playerSlot} ${isYou ? styles.playerSlotYou : ""} ${isCurrent ? styles.playerSlotCurrent : ""} ${p.status === "spectator" ? styles.playerSlotOut : ""}`}>
                      {isCurrent && isYou && (
                        <div
                          className={styles.yourTurnBadge}
                          role="status"
                          aria-label={t("gameTable.yourTurn")}>
                          <span className="material-symbols-outlined" aria-hidden>
                            expand_more
                          </span>
                        </div>
                      )}
                      {isCurrent && !isYou && (
                        <div
                          className={styles.theirTurnBadge}
                          role="status"
                          aria-label={t("gameTable.waitingForTurn", {
                            name: p.displayName,
                          })}>
                          <span className="material-symbols-outlined" aria-hidden>
                            expand_more
                          </span>
                        </div>
                      )}
                      <div className={styles.playerAvatarWrap}>
                        <div
                          className={`${styles.playerAvatar} ${canDrop ? styles.dropZoneActive : ""}`}
                          data-player-avatar={p.id}
                          onDragOver={(e) => {
                            if (canDrop) {
                              e.preventDefault();
                              e.dataTransfer.dropEffect = "move";
                            }
                          }}
                          onDrop={(e) => handlePlayerDrop(e, p.id)}>
                          {p.avatarUrl ? (
                            <img
                              src={p.avatarUrl}
                              alt=""
                              className={styles.playerAvatarImg}
                            />
                          ) : (
                            <span className="material-symbols-outlined">
                              lunch_dining
                            </span>
                          )}
                          {isDraggingCard && canDrop && (
                            <span
                              className={`${styles.dropZoneHint} ${styles.dropZoneHintTwoLines}`}>
                              {draggedCardData?.type === "foil_wrap" && p.id === playerId
                                ? t("gameTable.dropToProtect")
                                : t("gameTable.dropToTarget")}
                              <br />
                              {p.displayName}
                            </span>
                          )}
                        </div>
                        {eliminatedSet.has(p.id) && (
                          <div
                            className={styles.playerAvatarEliminatedCross}
                            aria-hidden
                            title={t("gameTable.eliminated")}
                          />
                        )}
                        {shieldedCounts.get(p.id) != null &&
                          shieldedCounts.get(p.id)! > 0 &&
                          p.status === "active" && (
                            <div
                              className={styles.playerAvatarFoilWrap}
                              style={{
                                backgroundImage: `url(${getCardMeta("foil_wrap").imageUrl})`,
                              }}
                              title={
                                shieldedCounts.get(p.id)! > 1
                                  ? t("gameTable.shieldCount", {
                                      count: String(shieldedCounts.get(p.id)!),
                                    })
                                  : t("gameTable.shieldOne")
                              }>
                              {shieldedCounts.get(p.id)! > 1 && (
                                <span
                                  className={styles.playerAvatarFoilWrapCount}>
                                  {shieldedCounts.get(p.id)}
                                </span>
                              )}
                            </div>
                          )}
                      </div>
                      <span className={styles.playerSlotName}>
                        {isYou ? t("gameTable.you") : p.displayName}
                        {p.isBot && (
                          <span
                            className={styles.playerSlotBotIcon}
                            title={t("lobby.bot")}
                            aria-label={t("lobby.bot")}>
                            <span className="material-symbols-outlined">
                              smart_toy
                            </span>
                          </span>
                        )}
                      </span>
                      {roleToShow && (
                        <span className={styles.playerSlotRole}>
                          {roleToShow.name}
                        </span>
                      )}
                      {!roleToShow && revealedCategories[p.id] && (
                        <span className={styles.playerSlotCategory}>
                          {t(
                            `cardReveal.${(revealedCategories[p.id] ?? "").toLowerCase()}`,
                          )}
                        </span>
                      )}
                      {p.status === "spectator" && (
                        <span className={styles.playerSlotOutLabel}>
                          {t("gameTable.out")}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <footer className={styles.hud}>
          <div className={styles.hudLeft}>
            <div className={styles.secretCard}>
              <span className={styles.hudLabel}>
                {t("gameTable.secretIdentity")}
              </span>
              <div className={styles.secretCardInner}>
                {me?.avatarUrl ? (
                  <img
                    src={me.avatarUrl}
                    alt=""
                    className={styles.secretCardAvatar}
                  />
                ) : (
                  <span className="material-symbols-outlined">restaurant</span>
                )}
                <p className={styles.secretCardName}>{myRole?.name ?? "?"}</p>
              </div>
            </div>
            <div className={styles.weaknessCard}>
              <span className={styles.hudLabelWeakness}>
                {t("gameTable.weakness")}
              </span>
              <div className={styles.weaknessContent}>
                {myRole?.id ? (
                  <>
                    <span className={styles.weaknessName}>
                      {t(`howToPlay.character${snackIdToPascal(myRole.id)}Weakness`)}
                    </span>
                  </>
                ) : (
                  <span className={styles.weaknessName}>—</span>
                )}
              </div>
              <button
                type="button"
                className={styles.weaknessHelperBtn}
                onClick={() => setShowWeaknessTable(true)}
                aria-label={t("gameTable.weaknessHelper")}>
                {t("gameTable.weaknessHelper")}
              </button>
            </div>
          </div>
          {showWeaknessTable &&
            createPortal(
              <div
                className={styles.weaknessTableOverlay}
                role="dialog"
                aria-modal="true"
                aria-labelledby="weakness-table-title"
                onClick={() => setShowWeaknessTable(false)}>
                <div
                  className={styles.weaknessTableModal}
                  onClick={(e) => e.stopPropagation()}>
                  <div className={styles.weaknessTableHeader}>
                    <h2
                      id="weakness-table-title"
                      className={styles.weaknessTableTitle}>
                      {t("gameTable.weaknessTableTitle")}
                    </h2>
                    <button
                      type="button"
                      className={styles.weaknessTableClose}
                      onClick={() => setShowWeaknessTable(false)}
                      aria-label={t("common.close")}>
                      <span className="material-symbols-outlined">close</span>
                    </button>
                  </div>
                  <table className={styles.weaknessTable}>
                    <thead>
                      <tr>
                        <th>{t("gameTable.weaknessTableSnack")}</th>
                        <th>{t("gameTable.weaknessTableWeakness")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ALL_SNACK_IDS.map((snackId) => (
                        <tr key={snackId}>
                          <td>{t(`howToPlay.character${snackIdToPascal(snackId)}`)}</td>
                          <td>{t(`howToPlay.character${snackIdToPascal(snackId)}Weakness`)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>,
              document.body
            )}
          <div className={styles.hudDivider} />
          {phase === "playing" && (myHand.length > 0 || needsToDraw) ? (
            <>
              {!isMyTurn && (
                <div className={styles.waitingForTurn}>
                  <div className={styles.waitingAvatar}>
                    {currentPlayer?.avatarUrl ? (
                      <img
                        src={currentPlayer.avatarUrl}
                        alt=""
                        className={styles.waitingAvatarImg}
                      />
                    ) : (
                      <span className="material-symbols-outlined">
                        lunch_dining
                      </span>
                    )}
                  </div>
                  <p className={styles.waitingText}>
                    {currentPlayer
                      ? t("gameTable.waitingForTurn", {
                          name: currentPlayer.displayName,
                        })
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
                      const otherCards = myHand.filter(
                        (c) => c.id !== pendingCard.id,
                      );
                      const canConfirm =
                        selectedDiscardIds.size === discardCount;
                      return (
                        <div className={styles.targetSelection}>
                          <p className={styles.targetSelectionLabel}>
                            {t("gameTable.selectCardsToDiscard", {
                              count: String(discardCount),
                            })}
                          </p>
                          <div className={styles.handCards}>
                            {otherCards.map((c) => {
                              const isSelected = selectedDiscardIds.has(c.id);
                              return (
                                <div
                                  key={c.id}
                                  className={
                                    isSelected
                                      ? styles.discardCardSelected
                                      : undefined
                                  }>
                                  <ActionCard
                                    card={c}
                                    playable
                                    onClick={() => {
                                      setSelectedDiscardIds((prev) => {
                                        const next = new Set(prev);
                                        if (next.has(c.id)) next.delete(c.id);
                                        else if (next.size < discardCount)
                                          next.add(c.id);
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
                              }}>
                              {t("common.close")}
                            </button>
                            <button
                              type="button"
                              className={styles.targetButton}
                              disabled={!canConfirm}
                              onClick={() => {
                                const discarded =
                                  Array.from(selectedDiscardIds);
                                const toAdd = [
                                  {
                                    id: pendingCard.id,
                                    type: pendingCard.type,
                                  },
                                  ...(discarded
                                    .map((id) => {
                                      const c = myHand.find((h) => h.id === id);
                                      return c
                                        ? { id: c.id, type: c.type }
                                        : null;
                                    })
                                    .filter(Boolean) as {
                                    id: string;
                                    type: string;
                                  }[]),
                                ];
                                setPendingDiscardCards((prev) => [
                                  ...prev,
                                  ...toAdd,
                                ]);
                                send("play_card", {
                                  cardId: pendingCard.id,
                                  discardedCardIds: discarded,
                                });
                                setPendingCard(null);
                                setSelectedDiscardIds(new Set());
                              }}>
                              {t("gameTable.discard")}
                            </button>
                          </div>
                        </div>
                      );
                    }
                    return (
                      <div className={styles.targetSelection}>
                        <p className={styles.targetSelectionLabel}>
                          {t("gameTable.selectTarget")}
                        </p>
                        <div className={styles.targetSelectionPlayers}>
                          {orderedPlayers
                            .filter(
                              (p) => p.id !== playerId && p.status === "active",
                            )
                            .map((p) => (
                              <button
                                key={p.id}
                                type="button"
                                className={`${styles.targetButton} ${styles.targetButtonPlayerTarget}`}
                                onClick={() => {
                                  send("play_card", {
                                    cardId: pendingCard.id,
                                    targetId: p.id,
                                  });
                                  setPendingCard(null);
                                }}>
                                <div className={styles.targetAvatar}>
                                  {p.avatarUrl ? (
                                    <img src={p.avatarUrl} alt="" />
                                  ) : (
                                    <span className="material-symbols-outlined">
                                      lunch_dining
                                    </span>
                                  )}
                                </div>
                                <span>{p.displayName}</span>
                              </button>
                            ))}
                        </div>
                        <button
                          type="button"
                          className={styles.targetCancelBtn}
                          onClick={() => setPendingCard(null)}>
                          {t("common.close")}
                        </button>
                      </div>
                    );
                  })()
                ) : (
                  <div
                    className={`${styles.handCards} ${needsToDraw && isDraggingFromDeck ? styles.handDropZoneActive : ""}`}
                    data-my-hand="true"
                    onDragOver={(e) => {
                      if (
                        needsToDraw &&
                        e.dataTransfer.types.includes(DECK_DRAG_TYPE)
                      ) {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = "move";
                      }
                    }}
                    onDragLeave={() => {}}
                    onDrop={handleHandDrop}>
                    {myHand.length === 0 && needsToDraw ? (
                      <div className={styles.handDrawPlaceholder}>
                        <span className="material-symbols-outlined">
                          back_hand
                        </span>
                        <span>{t("gameTable.dragDeckHere")}</span>
                      </div>
                    ) : (
                      myHand.map((c) => (
                        <div
                          key={c.id}
                          data-card-id={c.id}
                          onMouseEnter={() => setHoveredCard(c)}
                          onMouseLeave={() => setHoveredCard(null)}>
                          <ActionCard
                            card={c}
                            playable={isMyTurn && currentTurnDrawn}
                            disabled={
                              phase !== "playing" ||
                              !isMyTurn ||
                              !currentTurnDrawn
                            }
                            disabledTitle={t("gameTable.cardDisabledHint")}
                            draggable={
                              !pendingCard && isMyTurn && currentTurnDrawn
                            }
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
                      <circle
                        className={styles.timerBg}
                        cx="40"
                        cy="40"
                        r="34"
                      />
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
                      <span className={styles.timerUnit}>
                        {t("gameTable.timerUnit")}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className={styles.endTurnBtn}
                    disabled={phase !== "playing" || !currentTurnDrawn}
                    title={t("gameTable.endTurnTitle")}
                    onClick={() => send("end_turn", {})}>
                    <span>{t("gameTable.endTurn")}</span>
                    <span className="material-symbols-outlined">
                      double_arrow
                    </span>
                  </button>
                </div>
              )}
            </>
          ) : phase === "playing" ? (
            <div className={styles.waitingForTurn}>
              <div className={styles.waitingAvatar}>
                {currentPlayer?.avatarUrl ? (
                  <img
                    src={currentPlayer.avatarUrl}
                    alt=""
                    className={styles.waitingAvatarImg}
                  />
                ) : (
                  <span className="material-symbols-outlined">
                    lunch_dining
                  </span>
                )}
              </div>
              <p className={styles.waitingText}>
                {currentPlayer
                  ? t("gameTable.waitingForTurn", {
                      name: currentPlayer.displayName,
                    })
                  : t("gameTable.notYourTurnTitle")}
              </p>
            </div>
          ) : null}
        </footer>
      </div>
    </div>
  );
}
