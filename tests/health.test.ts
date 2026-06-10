import { describe, expect, it } from 'vitest';

import { app } from '../src/app.js';

describe('app bootstrap', () => {
  it('exports an express app', () => {
    expect(app).toBeDefined();
  });
});
