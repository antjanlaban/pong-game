import { FIELD_H, PADDLE_H } from "../config";
import type { Paddle } from "../types";
import { clampScalar } from "./vec";

/** move a paddle vertically by its dir at the given speed, clamped to the field. */
export function stepPaddle(paddle: Paddle, speed: number, dt: number): Paddle {
  const y = clampScalar(paddle.y + paddle.dir * speed * dt, 0, FIELD_H - PADDLE_H);
  return { ...paddle, y };
}
