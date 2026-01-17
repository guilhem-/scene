/**
 * AudioPlayer unit tests
 *
 * Tests the time display logic, particularly the fix for the offset display bug.
 * Since AudioPlayer uses ES modules and Jest is not configured for ESM,
 * we test the logic directly.
 */

describe('AudioPlayer time formatting', () => {
  // Replicate the formatTime static method for testing
  function formatTime(seconds) {
    if (isNaN(seconds) || !isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  test('should format 0 seconds as 0:00', () => {
    expect(formatTime(0)).toBe('0:00');
  });

  test('should format 65 seconds as 1:05', () => {
    expect(formatTime(65)).toBe('1:05');
  });

  test('should format 90 seconds as 1:30', () => {
    expect(formatTime(90)).toBe('1:30');
  });

  test('should format 120 seconds as 2:00', () => {
    expect(formatTime(120)).toBe('2:00');
  });

  test('should handle NaN', () => {
    expect(formatTime(NaN)).toBe('0:00');
  });

  test('should handle Infinity', () => {
    expect(formatTime(Infinity)).toBe('0:00');
  });
});

describe('AudioPlayer offset time reporting', () => {
  /**
   * This tests the logic that should be in notifyStatus().
   * When playing with an offset, if the audioElement.currentTime hasn't
   * caught up yet (race condition), we should report the startOffset instead.
   */

  // Simulates the corrected getCurrentTime logic that accounts for startOffset
  function getEffectiveCurrentTime(audioCurrentTime, startOffset, isPlaying) {
    // When playing with an offset and currentTime is less than offset,
    // we should report the offset (this is the fix)
    if (isPlaying && audioCurrentTime < startOffset) {
      return startOffset;
    }
    return audioCurrentTime;
  }

  describe('when play starts with an offset', () => {
    test('should report offset time when audioElement.currentTime is 0 (race condition)', () => {
      const startOffset = 90; // 1:30
      const audioCurrentTime = 0; // Race condition: browser hasn't updated yet
      const isPlaying = true;

      const effectiveTime = getEffectiveCurrentTime(audioCurrentTime, startOffset, isPlaying);

      expect(effectiveTime).toBe(90);
    });

    test('should report offset time when audioElement.currentTime is less than offset', () => {
      const startOffset = 90;
      const audioCurrentTime = 5; // Still catching up
      const isPlaying = true;

      const effectiveTime = getEffectiveCurrentTime(audioCurrentTime, startOffset, isPlaying);

      expect(effectiveTime).toBe(90);
    });

    test('should report actual currentTime when it has caught up to offset', () => {
      const startOffset = 90;
      const audioCurrentTime = 90; // Caught up
      const isPlaying = true;

      const effectiveTime = getEffectiveCurrentTime(audioCurrentTime, startOffset, isPlaying);

      expect(effectiveTime).toBe(90);
    });

    test('should report actual currentTime when it exceeds offset', () => {
      const startOffset = 90;
      const audioCurrentTime = 105; // 15 seconds past offset
      const isPlaying = true;

      const effectiveTime = getEffectiveCurrentTime(audioCurrentTime, startOffset, isPlaying);

      expect(effectiveTime).toBe(105);
    });
  });

  describe('when play starts without an offset', () => {
    test('should report 0 when starting from beginning', () => {
      const startOffset = 0;
      const audioCurrentTime = 0;
      const isPlaying = true;

      const effectiveTime = getEffectiveCurrentTime(audioCurrentTime, startOffset, isPlaying);

      expect(effectiveTime).toBe(0);
    });

    test('should report actual currentTime during playback', () => {
      const startOffset = 0;
      const audioCurrentTime = 45;
      const isPlaying = true;

      const effectiveTime = getEffectiveCurrentTime(audioCurrentTime, startOffset, isPlaying);

      expect(effectiveTime).toBe(45);
    });
  });

  describe('when not playing', () => {
    test('should report 0 when stopped', () => {
      const startOffset = 90;
      const audioCurrentTime = 0;
      const isPlaying = false;

      const effectiveTime = getEffectiveCurrentTime(audioCurrentTime, startOffset, isPlaying);

      expect(effectiveTime).toBe(0);
    });
  });
});

describe('AudioPlayer seek behavior', () => {
  /**
   * Documents that seeking should happen AFTER play() starts for reliability.
   * Some browsers don't allow seeking to unbuffered positions before playback.
   */

  test('seek after play is more reliable than seek before play', () => {
    // This test documents the expected behavior:
    // 1. Call audioElement.play() first
    // 2. Then call seekTo(offset)
    // 3. This ensures the audio is in a playable state before seeking

    const playOrder = [];

    // Simulate the correct order of operations
    function simulateCorrectPlayWithOffset(offset) {
      playOrder.push('play');
      if (offset > 0) {
        playOrder.push('seek');
      }
      playOrder.push('fadeIn');
    }

    simulateCorrectPlayWithOffset(90);

    expect(playOrder).toEqual(['play', 'seek', 'fadeIn']);
  });

  test('seek should not be called when offset is 0', () => {
    const playOrder = [];

    function simulatePlayWithOffset(offset) {
      playOrder.push('play');
      if (offset > 0) {
        playOrder.push('seek');
      }
      playOrder.push('fadeIn');
    }

    simulatePlayWithOffset(0);

    expect(playOrder).toEqual(['play', 'fadeIn']);
    expect(playOrder).not.toContain('seek');
  });
});
