export interface VerticalMotionState {
  height: number
  velocity: number
  grounded: boolean
  jumpHeld: boolean
}

export const GROUNDED_VERTICAL_MOTION: VerticalMotionState = {
  height: 0,
  velocity: 0,
  grounded: true,
  jumpHeld: false,
}

export interface VerticalMovementProfile {
  gravity: number
  jumpVelocity: number
}

export const WOW_VERTICAL_MOVEMENT_PROFILE: VerticalMovementProfile = {
  gravity: 19.6,
  jumpVelocity: 7.2,
}

export function stepVerticalMotion(
  state: VerticalMotionState,
  jumpPressed: boolean,
  seconds: number,
  profile = WOW_VERTICAL_MOVEMENT_PROFILE,
): VerticalMotionState {
  const launched = state.grounded && jumpPressed && !state.jumpHeld
  const velocity = launched ? profile.jumpVelocity : state.velocity
  const nextVelocity = velocity - profile.gravity * seconds
  const nextHeight = state.height + velocity * seconds - profile.gravity * seconds * seconds / 2
  if (nextHeight <= 0 && nextVelocity <= 0) return { height: 0, velocity: 0, grounded: true, jumpHeld: jumpPressed }
  return { height: Math.max(0, nextHeight), velocity: nextVelocity, grounded: false, jumpHeld: jumpPressed }
}

export function launchVerticalMotion(state: VerticalMotionState, velocity: number): VerticalMotionState {
  return { ...state, velocity: Math.max(state.velocity, velocity), grounded: false }
}

export function isAirborne(state: VerticalMotionState, clearance = .75) {
  return state.height >= clearance
}
