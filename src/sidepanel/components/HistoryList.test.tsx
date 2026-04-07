import '@testing-library/jest-dom';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { HistoryList } from './HistoryList';
import type { AnalysisResult } from '../../shared/types';

const makeResult = (id: string, prompt: string): AnalysisResult => ({
  id,
  imageUrl: 'https://example.com/img.jpg',
  fullPrompt: prompt,
  breakdown: { subject: 'test subject', style: 'test style', mood: 'test mood', technical: 'test tech' },
  provider: 'anthropic',
  model: 'claude-haiku-4-5-20251001',
  timestamp: Date.now(),
});

describe('HistoryList', () => {
  it('shows empty state when no history', () => {
    render(<HistoryList history={[]} onClear={vi.fn()} onViewDetail={vi.fn()} />);
    expect(screen.getByText(/right-click/i)).toBeInTheDocument();
  });

  it('renders all history items', () => {
    const history = [makeResult('1', 'Mountain at sunset'), makeResult('2', 'Forest in mist')];
    render(<HistoryList history={history} onClear={vi.fn()} onViewDetail={vi.fn()} />);
    expect(screen.getByText('Mountain at sunset')).toBeInTheDocument();
  });

  it('calls onClear when clear button clicked', () => {
    const onClear = vi.fn();
    const history = [makeResult('1', 'Test prompt')];
    render(<HistoryList history={history} onClear={onClear} onViewDetail={vi.fn()} />);
    fireEvent.click(screen.getByText(/clear history/i));
    expect(onClear).toHaveBeenCalledOnce();
  });
});
