export class WaveformUtils {
  public static alignApexToFrame(targetFrame: number, durationFrames: number, attackPercent = 0.8): {
    startFrame: number;
    endFrame: number;
    apexFrame: number;
  } {
    const leadFrames = Math.round(durationFrames * attackPercent);
    const startFrame = Math.max(0, targetFrame - leadFrames);
    const endFrame = startFrame + durationFrames;

    return {
      startFrame,
      endFrame,
      apexFrame: targetFrame
    };
  }

  public static clampVolumeDb(volumeDb: number, min = -45, max = -6): number {
    return Math.max(min, Math.min(max, volumeDb));
  }
}
