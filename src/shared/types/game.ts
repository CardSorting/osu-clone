export type Vector2 = {
  x: number;
  y: number;
};

export enum HitObjectType {
  CIRCLE = 'CIRCLE',
  SLIDER = 'SLIDER',
  SPINNER = 'SPINNER'
}

export enum HitResultType {
  MISS = 'MISS',
  BAD = 'BAD',
  GOOD = 'GOOD',
  GREAT = 'GREAT',
  PERFECT = 'PERFECT'
}

export enum Grade {
  F = 'F',
  D = 'D',
  C = 'C',
  B = 'B',
  A = 'A',
  S = 'S',
  SS = 'SS'
}

export interface HitResult {
  type: HitResultType;
  points: number;
  accuracy: number;
  timestamp: number;
}
