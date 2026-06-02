import {
  BALL_RADIUS,
  FIELD_H,
  FIELD_W,
  PADDLE_H,
  PADDLE_W,
  PALETTE,
  TRAIL_LENGTH,
} from "../config";
import type { EffectsState, GameState } from "../types";

export function draw(ctx: CanvasRenderingContext2D, state: GameState, effects: EffectsState): void {
  ctx.save();
  // background
  ctx.fillStyle = PALETTE.bg;
  ctx.fillRect(0, 0, FIELD_W, FIELD_H);

  // screenshake: random offset scaled by shake amplitude
  const sx = (Math.random() * 2 - 1) * effects.shake;
  const sy = (Math.random() * 2 - 1) * effects.shake;
  ctx.translate(sx, sy);

  // center dashed glowing line
  ctx.strokeStyle = PALETTE.accent;
  ctx.shadowColor = PALETTE.accent;
  ctx.shadowBlur = 12;
  ctx.lineWidth = 3;
  ctx.setLineDash([16, 18]);
  ctx.beginPath();
  ctx.moveTo(FIELD_W / 2, 0);
  ctx.lineTo(FIELD_W / 2, FIELD_H);
  ctx.stroke();
  ctx.setLineDash([]);

  // ball trail (fading glow segments)
  for (let i = 0; i < effects.trail.length; i++) {
    const p = effects.trail[i];
    if (!p) continue;
    const t = i / TRAIL_LENGTH;
    ctx.globalAlpha = t * 0.5;
    ctx.fillStyle = PALETTE.ball;
    ctx.shadowColor = PALETTE.ball;
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.arc(p.x, p.y, BALL_RADIUS * t, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // paddles
  drawGlowRect(ctx, state.p1.x, state.p1.y, PADDLE_W, PADDLE_H, PALETTE.p1);
  drawGlowRect(ctx, state.p2.x, state.p2.y, PADDLE_W, PADDLE_H, PALETTE.p2);

  // ball
  ctx.fillStyle = PALETTE.ball;
  ctx.shadowColor = PALETTE.ball;
  ctx.shadowBlur = 24;
  ctx.beginPath();
  ctx.arc(state.ball.pos.x, state.ball.pos.y, BALL_RADIUS, 0, Math.PI * 2);
  ctx.fill();

  // score
  ctx.shadowBlur = 8;
  ctx.fillStyle = PALETTE.accent;
  ctx.font = "700 64px ui-monospace, 'Segoe UI', monospace";
  ctx.textAlign = "center";
  ctx.fillText(String(state.score1), FIELD_W / 2 - 80, 80);
  ctx.fillText(String(state.score2), FIELD_W / 2 + 80, 80);

  // global hit-flash veil
  if (effects.flash > 0) {
    ctx.globalAlpha = Math.min(0.35, effects.flash * 0.25);
    ctx.fillStyle = "#ffffff";
    ctx.shadowBlur = 0;
    ctx.fillRect(-sx, -sy, FIELD_W, FIELD_H);
    ctx.globalAlpha = 1;
  }

  ctx.restore();
}

function drawGlowRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
): void {
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 20;
  ctx.fillRect(x, y, w, h);
}
