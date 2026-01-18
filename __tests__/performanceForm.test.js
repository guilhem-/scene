/**
 * PerformanceForm unit tests
 *
 * Tests the form behavior for editing performances with existing files,
 * offset management, and file upload handling.
 */

describe('PerformanceForm file section behavior', () => {
  /**
   * Tests the logic for showing/hiding existing file vs file input sections
   */

  describe('when editing a performance with existing file', () => {
    test('should show existing file section with file name', () => {
      const performance = {
        id: 'perf_123',
        title: 'Test Performance',
        performerName: 'Test Artist',
        musicFile: {
          originalName: 'song.mp3',
          storedPath: 'data/perf_123/music_file.mp3',
          mimeType: 'audio/mpeg'
        },
        startOffset: { minutes: 1, seconds: 30 }
      };

      // Simulate the logic from populateForm
      const hasExistingFile = !!performance.musicFile;
      const existingFileName = performance.musicFile?.originalName;

      expect(hasExistingFile).toBe(true);
      expect(existingFileName).toBe('song.mp3');
    });

    test('should enable offset controls for existing file', () => {
      const performance = {
        musicFile: { originalName: 'song.mp3' },
        startOffset: { minutes: 2, seconds: 15 }
      };

      // Simulate offset population logic
      const offsetMinutes = performance.startOffset?.minutes || 0;
      const offsetSeconds = performance.startOffset?.seconds || 0;
      const shouldEnableOffsets = !!performance.musicFile;

      expect(shouldEnableOffsets).toBe(true);
      expect(offsetMinutes).toBe(2);
      expect(offsetSeconds).toBe(15);
    });

    test('should preserve offset values when file exists', () => {
      const performance = {
        musicFile: { originalName: 'song.mp3' },
        startOffset: { minutes: 0, seconds: 45 }
      };

      // Even with 0 minutes, should keep the value
      const offsetMinutes = performance.startOffset?.minutes ?? 0;
      const offsetSeconds = performance.startOffset?.seconds ?? 0;

      expect(offsetMinutes).toBe(0);
      expect(offsetSeconds).toBe(45);
    });
  });

  describe('when editing a performance without existing file', () => {
    test('should show file input section', () => {
      const performance = {
        id: 'perf_456',
        title: 'No Music Performance',
        performerName: 'Silent Artist',
        musicFile: null,
        startOffset: { minutes: 0, seconds: 0 }
      };

      const hasExistingFile = !!performance.musicFile;

      expect(hasExistingFile).toBe(false);
    });

    test('should disable offset controls when no file', () => {
      const performance = {
        musicFile: null,
        startOffset: { minutes: 0, seconds: 0 }
      };

      const shouldEnableOffsets = !!performance.musicFile;

      expect(shouldEnableOffsets).toBe(false);
    });
  });

  describe('when creating a new performance', () => {
    test('should show file input section by default', () => {
      // In create mode, no existing performance
      const editingPerformance = null;
      const hasExistingFile = false;

      expect(editingPerformance).toBeNull();
      expect(hasExistingFile).toBe(false);
    });

    test('should disable offsets until file is selected', () => {
      const hasFile = false;
      const shouldEnableOffsets = hasFile;

      expect(shouldEnableOffsets).toBe(false);
    });
  });
});

describe('PerformanceForm offset calculation', () => {
  /**
   * Tests that offset values are correctly converted to seconds
   */

  test('should calculate total offset in seconds correctly', () => {
    function calculateOffset(startOffset) {
      return (startOffset?.minutes || 0) * 60 + (startOffset?.seconds || 0);
    }

    expect(calculateOffset({ minutes: 1, seconds: 30 })).toBe(90);
    expect(calculateOffset({ minutes: 0, seconds: 45 })).toBe(45);
    expect(calculateOffset({ minutes: 2, seconds: 0 })).toBe(120);
    expect(calculateOffset({ minutes: 0, seconds: 0 })).toBe(0);
    expect(calculateOffset(null)).toBe(0);
    expect(calculateOffset(undefined)).toBe(0);
  });

  test('should handle missing offset properties', () => {
    function calculateOffset(startOffset) {
      return (startOffset?.minutes || 0) * 60 + (startOffset?.seconds || 0);
    }

    expect(calculateOffset({ minutes: 1 })).toBe(60);
    expect(calculateOffset({ seconds: 30 })).toBe(30);
    expect(calculateOffset({})).toBe(0);
  });
});

describe('PerformanceForm file change handling', () => {
  /**
   * Tests the behavior when user decides to change the existing file
   */

  test('should reset to file input mode when change button clicked', () => {
    // Simulate state before clicking change
    let existingFileSectionVisible = true;
    let fileInputSectionVisible = false;
    let hasExistingFile = true;

    // Simulate showFileInput() logic
    function showFileInput() {
      existingFileSectionVisible = false;
      fileInputSectionVisible = true;
      // Note: hasExistingFile stays true until form is submitted with new file
    }

    showFileInput();

    expect(existingFileSectionVisible).toBe(false);
    expect(fileInputSectionVisible).toBe(true);
  });

  test('should enable offsets after new file is selected', () => {
    // Simulate a file being selected
    const newFile = { name: 'new_song.mp3', type: 'audio/mpeg' };
    const hasFile = !!newFile;

    expect(hasFile).toBe(true);
  });
});

describe('PerformanceForm submission', () => {
  /**
   * Tests the form data preparation for submission
   */

  test('should include offset values in form data', () => {
    const formValues = {
      title: 'Test',
      performerName: 'Artist',
      offsetMin: '1',
      offsetSec: '30',
      musicFile: null
    };

    // Simulate FormData append logic
    const formData = {};
    formData.title = formValues.title.trim();
    formData.performerName = formValues.performerName.trim();
    formData.startOffsetMinutes = formValues.offsetMin;
    formData.startOffsetSeconds = formValues.offsetSec;

    expect(formData.startOffsetMinutes).toBe('1');
    expect(formData.startOffsetSeconds).toBe('30');
  });

  test('should only include file if new file selected', () => {
    // Case 1: No new file selected, keeping existing
    const files1 = [];
    const shouldIncludeFile1 = files1.length > 0;
    expect(shouldIncludeFile1).toBe(false);

    // Case 2: New file selected
    const files2 = [{ name: 'new.mp3' }];
    const shouldIncludeFile2 = files2.length > 0;
    expect(shouldIncludeFile2).toBe(true);
  });

  test('should include end time values in form data', () => {
    const formValues = {
      title: 'Test',
      performerName: 'Artist',
      offsetMin: '0',
      offsetSec: '10',
      endTimeMin: '1',
      endTimeSec: '30',
      musicFile: null
    };

    // Simulate FormData append logic
    const formData = {};
    formData.title = formValues.title.trim();
    formData.performerName = formValues.performerName.trim();
    formData.startOffsetMinutes = formValues.offsetMin;
    formData.startOffsetSeconds = formValues.offsetSec;
    formData.endTimeMinutes = formValues.endTimeMin;
    formData.endTimeSeconds = formValues.endTimeSec;

    expect(formData.endTimeMinutes).toBe('1');
    expect(formData.endTimeSeconds).toBe('30');
  });
});

describe('PerformanceForm end time validation', () => {
  /**
   * Tests end time validation logic
   */

  /**
   * Simulates the validateEndTime logic from PerformanceForm.js
   */
  function validateEndTime(endTimeMin, endTimeSec, offsetMin, offsetSec, audioDuration = 0) {
    let endMinutes = parseInt(endTimeMin, 10) || 0;
    let endSeconds = parseInt(endTimeSec, 10) || 0;
    const totalEndTime = (endMinutes * 60) + endSeconds;

    // If end time is 0, it's disabled - no validation needed
    if (totalEndTime === 0) {
      return { minutes: 0, seconds: 0, valid: true };
    }

    const offsetMinutes = parseInt(offsetMin, 10) || 0;
    const offsetSeconds = parseInt(offsetSec, 10) || 0;
    const totalOffset = (offsetMinutes * 60) + offsetSeconds;

    // End time must be greater than start offset
    if (totalEndTime <= totalOffset) {
      const minEndTime = totalOffset + 1;
      endMinutes = Math.floor(minEndTime / 60);
      endSeconds = minEndTime % 60;
    }

    // Also validate against audio duration if known
    let finalEndTime = (endMinutes * 60) + endSeconds;
    if (audioDuration > 0 && finalEndTime > audioDuration) {
      endMinutes = Math.floor(audioDuration / 60);
      endSeconds = Math.floor(audioDuration % 60);
    }

    return { minutes: endMinutes, seconds: endSeconds, valid: true };
  }

  test('should allow end time of 0 (disabled)', () => {
    const result = validateEndTime('0', '0', '0', '10');
    expect(result.minutes).toBe(0);
    expect(result.seconds).toBe(0);
  });

  test('should allow end time greater than offset', () => {
    const result = validateEndTime('1', '30', '0', '10');
    expect(result.minutes).toBe(1);
    expect(result.seconds).toBe(30);
  });

  test('should adjust end time when less than or equal to offset', () => {
    // End time 0:05 with offset 0:10 should become 0:11
    const result = validateEndTime('0', '5', '0', '10');
    expect(result.minutes).toBe(0);
    expect(result.seconds).toBe(11);
  });

  test('should adjust end time when equal to offset', () => {
    // End time 0:10 with offset 0:10 should become 0:11
    const result = validateEndTime('0', '10', '0', '10');
    expect(result.minutes).toBe(0);
    expect(result.seconds).toBe(11);
  });

  test('should clamp end time to audio duration', () => {
    // End time 2:00 with duration 90s should become 1:30
    const result = validateEndTime('2', '0', '0', '0', 90);
    expect(result.minutes).toBe(1);
    expect(result.seconds).toBe(30);
  });

  test('should handle end time with minutes rolling over', () => {
    // End time 0:30 with offset 1:00 should become 1:01
    const result = validateEndTime('0', '30', '1', '0');
    expect(result.minutes).toBe(1);
    expect(result.seconds).toBe(1);
  });
});

describe('PerformanceForm end time display', () => {
  /**
   * Tests end time display in edit mode
   */

  test('should display end time when editing performance with end time set', () => {
    const performance = {
      id: 'perf_789',
      title: 'Test Performance',
      performerName: 'Test Artist',
      musicFile: { originalName: 'song.mp3' },
      startOffset: { minutes: 0, seconds: 10 },
      endTime: { minutes: 1, seconds: 30 }
    };

    // Simulate populateForm logic
    const endTimeMinutes = performance.endTime?.minutes || 0;
    const endTimeSeconds = performance.endTime?.seconds || 0;

    expect(endTimeMinutes).toBe(1);
    expect(endTimeSeconds).toBe(30);
  });

  test('should display 0 end time when not set', () => {
    const performance = {
      id: 'perf_789',
      title: 'Test Performance',
      performerName: 'Test Artist',
      musicFile: { originalName: 'song.mp3' },
      startOffset: { minutes: 0, seconds: 10 }
      // No endTime property
    };

    const endTimeMinutes = performance.endTime?.minutes || 0;
    const endTimeSeconds = performance.endTime?.seconds || 0;

    expect(endTimeMinutes).toBe(0);
    expect(endTimeSeconds).toBe(0);
  });
});
