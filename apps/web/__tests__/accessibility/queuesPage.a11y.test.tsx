import React from 'react';
import { render } from '@testing-library/react';
import { axe } from 'jest-axe';
import { describe, expect, it } from 'vitest';
import QueuesPage from '../../app/(venue)/queues/page';

describe('Queues page accessibility', () => {
  it('has no critical axe violations', async () => {
    const { container } = render(<QueuesPage />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
