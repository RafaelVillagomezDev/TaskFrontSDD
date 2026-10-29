import { test as authTest } from './auth.fixture';
import { BoardPage } from '../pages/board.po';
import { LoginPage } from '../pages/login.po';

interface TasksFixtures {
  // Tablero de una cuenta nueva con la sesión iniciada por la interfaz; las tareas que cree el test
  // se borran con la cuenta al terminar (CONSTITUTION.md IV.5)
  board: BoardPage;
}

export const test = authTest.extend<TasksFixtures>({
  board: async ({ page, freshAccount }, provide) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.login(freshAccount);
    const board = new BoardPage(page);
    await board.board.waitFor();
    await provide(board);
  },
});

export { expect } from '@playwright/test';
