import type { Preferences } from './types';

import { createAppPreferences } from './app-config';

// 使用应用特定的配置
const defaultPreferences: Preferences = createAppPreferences();

export { defaultPreferences };
