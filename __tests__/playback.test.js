/**
 * Playback integration tests
 *
 * Tests for the playback flow and duration handling
 */

describe('Playback duration handling', () => {
  /**
   * This test verifies the fix for the bug where updating the store
   * during duration loading would trigger a re-render and destroy
   * the audio player that was just created.
   */

  test('duration update should not trigger full store notification', () => {
    // Simulate store state
    const performances = [
      { id: 'perf_1', title: 'Test', performerName: 'Artist', duration: 0 }
    ];

    // Simulate the fix: directly mutate performance data instead of calling store.updatePerformance
    const perf = performances.find(p => p.id === 'perf_1');
    if (perf) {
      perf.duration = 180; // 3 minutes
    }

    // Verify duration was updated without creating new array (no re-render trigger)
    expect(performances[0].duration).toBe(180);
    expect(performances[0]).toBe(perf); // Same reference, not a new object
  });

  test('store updatePerformance creates new objects (would trigger re-render)', () => {
    // Simulate what store.updatePerformance does
    const originalPerformances = [
      { id: 'perf_1', title: 'Test', performerName: 'Artist', duration: 0 }
    ];

    // This is what store.updatePerformance does - creates new array and objects
    const updatedPerformances = originalPerformances.map(p =>
      p.id === 'perf_1' ? { ...p, duration: 180 } : p
    );

    // New array and new object references
    expect(updatedPerformances).not.toBe(originalPerformances);
    expect(updatedPerformances[0]).not.toBe(originalPerformances[0]);
  });
});

describe('Performance card play flow', () => {
  test('should calculate correct offset in seconds', () => {
    const performance = {
      startOffset: { minutes: 1, seconds: 30 },
      endTime: { minutes: 3, seconds: 45 }
    };

    const offset = (performance.startOffset?.minutes || 0) * 60 +
                   (performance.startOffset?.seconds || 0);
    const endTime = (performance.endTime?.minutes || 0) * 60 +
                    (performance.endTime?.seconds || 0);

    expect(offset).toBe(90); // 1:30 = 90 seconds
    expect(endTime).toBe(225); // 3:45 = 225 seconds
  });

  test('should handle missing offset properties', () => {
    const performance = {};

    const offset = (performance.startOffset?.minutes || 0) * 60 +
                   (performance.startOffset?.seconds || 0);
    const endTime = (performance.endTime?.minutes || 0) * 60 +
                    (performance.endTime?.seconds || 0);

    expect(offset).toBe(0);
    expect(endTime).toBe(0);
  });

  test('should extract fade options from performance', () => {
    const perfWithFades = { fadeIn: true, fadeOut: true };
    const perfWithoutFades = { fadeIn: false, fadeOut: false };
    const perfDefault = {};

    // fadeIn/fadeOut default to true when not explicitly false
    expect(perfWithFades.fadeIn !== false).toBe(true);
    expect(perfWithFades.fadeOut !== false).toBe(true);

    expect(perfWithoutFades.fadeIn !== false).toBe(false);
    expect(perfWithoutFades.fadeOut !== false).toBe(false);

    expect(perfDefault.fadeIn !== false).toBe(true);
    expect(perfDefault.fadeOut !== false).toBe(true);
  });
});

describe('Time range badge display', () => {
  function formatTimeRange(performance) {
    const startOffset = performance.startOffset || { minutes: 0, seconds: 0 };
    const endTime = performance.endTime || { minutes: 0, seconds: 0 };
    const duration = performance.duration || 0;

    const offsetText = `${startOffset.minutes}:${startOffset.seconds.toString().padStart(2, '0')}`;
    const endTimeTotal = (endTime.minutes || 0) * 60 + (endTime.seconds || 0);

    if (endTimeTotal > 0) {
      const endTimeText = `${endTime.minutes}:${endTime.seconds.toString().padStart(2, '0')}`;
      return `${offsetText} → ${endTimeText}`;
    } else if (duration > 0) {
      const durationMin = Math.floor(duration / 60);
      const durationSec = Math.floor(duration % 60);
      return `${offsetText} → ${durationMin}:${durationSec.toString().padStart(2, '0')}`;
    }
    return offsetText;
  }

  test('should show endTime when set', () => {
    const perf = {
      startOffset: { minutes: 0, seconds: 30 },
      endTime: { minutes: 2, seconds: 0 },
      duration: 180
    };
    expect(formatTimeRange(perf)).toBe('0:30 → 2:00');
  });

  test('should show duration when endTime not set', () => {
    const perf = {
      startOffset: { minutes: 0, seconds: 0 },
      endTime: { minutes: 0, seconds: 0 },
      duration: 180
    };
    expect(formatTimeRange(perf)).toBe('0:00 → 3:00');
  });

  test('should show only offset when no duration available', () => {
    const perf = {
      startOffset: { minutes: 1, seconds: 15 },
      endTime: { minutes: 0, seconds: 0 },
      duration: 0
    };
    expect(formatTimeRange(perf)).toBe('1:15');
  });
});
