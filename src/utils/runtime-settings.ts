import { LocalStorage } from "@raycast/api";
import { RuntimeSettings, RuntimeConfig, DEFAULT_RUNTIME_SETTINGS } from "../types/runtime-types";

const STORAGE_KEY = "ccusage_runtime_settings";

/**
 * 設定をLocalStorageから読み込み
 */
export async function loadRuntimeSettings(): Promise<RuntimeSettings> {
  try {
    const stored = await LocalStorage.getItem<string>(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as RuntimeSettings;
      return {
        ...DEFAULT_RUNTIME_SETTINGS,
        ...parsed,
      };
    }
  } catch (error) {
    console.error("Failed to load runtime settings:", error);
  }

  return DEFAULT_RUNTIME_SETTINGS;
}

/**
 * 設定をLocalStorageに保存
 */
export async function saveRuntimeSettings(settings: RuntimeSettings): Promise<void> {
  try {
    await LocalStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error("Failed to save runtime settings:", error);
    throw error;
  }
}

/**
 * 選択されたランタイムの種類を取得
 */
export async function getSelectedRuntime(): Promise<RuntimeConfig["type"] | null> {
  const settings = await loadRuntimeSettings();
  return settings.selectedRuntime || null;
}

/**
 * 選択されたランタイムのパスを取得
 */
export async function getSelectedRuntimePath(): Promise<string | null> {
  const settings = await loadRuntimeSettings();
  return settings.customPath || null;
}

/**
 * 初期化済みかどうかチェック
 */
export async function isInitialized(): Promise<boolean> {
  const settings = await loadRuntimeSettings();
  return settings.initialized;
}

/**
 * 有効なランタイム設定があるかチェック
 */
export async function hasValidRuntimeConfig(): Promise<boolean> {
  const settings = await loadRuntimeSettings();
  return !!settings.selectedRuntime && settings.initialized;
}

/**
 * 初期化完了をマーク
 */
export async function markAsInitialized(): Promise<void> {
  const settings = await loadRuntimeSettings();
  settings.initialized = true;
  await saveRuntimeSettings(settings);
}

/**
 * 設定をリセット
 */
export async function resetRuntimeSettings(): Promise<void> {
  await LocalStorage.removeItem(STORAGE_KEY);
}
