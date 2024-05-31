export const gameOutcomeMultiplier = {
  DICE: 10001,
  HILO: 52,
  MINES: 25,
  LIMBO: 16777216,
  DIAMONDS: 7,
  PLINKO: 2,
};

// total game outcomes expected in each request
export const totalOutcomes = {
  DICE: 1,
  LIMBO: 1,
  HILO: 104,
  MINES: 24,
  DIAMONDS: 5,
  PLINKO: 16,
};

// max raw outcomes (for multiplayer games like crash, aviatorx and slide)
export const maxRawOutcomes = {
  CRASH: 4294967296,
  AVIATORX: 4294967296,
  SLIDE: 4294967296,
  LIMBO: 16777216,
};

export const maxMultiplierCap = {
  CRASH: 250,
  AVIATORX: 250,
  SLIDE: 250,
}

// cut off for the game outcomes (for multiplayer games like crash and slide) (RTP)
export const outComeCutoff = {
  CRASH: 0.99,
  AVIATORX: 0.99,
  SLIDE: 0.98,
  LIMBO: 0.99,
};

// RTP to house edge conversion
export const houseEdgeConversion = {
  1: 0.01,
  2: 0.02,
  3: 0.03,
  5: 0.05,
  7: 0.07,
  9: 0.09,
};

// possible house edges
export const houseEdges = [1, 2, 3, 5, 7];
