import { EventEmitter } from "events";

export type Team = {
  id: string;
  name: string;
  players: Player[];
};

export type Player = {
  id: string;
  name: string;
  score: number;
  teamId: string;
  team: Team;
};

export type GameState =
  | "not-started"
  | "started"
  | "questioning"
  | "results"
  | "ended";

export type Game = {
  id: string;
  state: GameState;
  name: string;
  quizId: string;
  questionNumber: number;
  teams: Team[];
  code: string;
  ee: EventEmitter;
  // Track player answers: questionId -> playerId -> optionId
  playerAnswers: Map<string, Map<string, string>>;
};

export const games = new Map<string, Game>();
