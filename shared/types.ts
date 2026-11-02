/**
 * Types shared between the browser client and the Node server.
 * Keep this module dependency-free so it can be imported from anywhere.
 */

export interface HealthResponse {
  readonly status: 'ok';
  readonly version: string;
  readonly uptimeSeconds: number;
  readonly timestamp: string;
}

export interface DialogueChoiceDto {
  readonly label: string;
  readonly next: string | null;
}

export interface DialogueNodeDto {
  readonly id: string;
  readonly speaker: string;
  readonly text: string;
  readonly next?: string | null;
  readonly choices?: readonly DialogueChoiceDto[];
}

export interface DialogueResponse {
  readonly nodes: readonly DialogueNodeDto[];
}

export const API_ROUTES = {
  health: '/api/health',
  clarenceDialogue: '/api/dialogue/clarence',
} as const;

export type ApiRoute = (typeof API_ROUTES)[keyof typeof API_ROUTES];
