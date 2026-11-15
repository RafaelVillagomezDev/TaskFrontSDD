import { test as sessionTest } from './session.fixture';
import { BoardPage } from '../pages/board.po';

interface TasksFixtures {
  // Tablero de una cuenta nueva con la sesión iniciada por API (003 plan D-15); las tareas que cree el test
  // se borran con la cuenta al terminar (CONSTITUTION.md IV.5). El login por la interfaz se prueba en login.e2e.ts
  board: BoardPage;
}

export const test = sessionTest.extend<TasksFixtures>({
  board: async ({ signedInPage }, provide) => {
    const board = new BoardPage(signedInPage);
    await signedInPage.goto('/');
    await board.board.waitFor();
    await provide(board);
  },
});

export { expect } from '@playwright/test';
