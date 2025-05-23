import {
  getCurrentWidget,
  SeelenLauncherWidgetId,
  SeelenToolbarWidgetId,
  SeelenWallWidgetId,
  SeelenWegWidgetId,
  SeelenWindowManagerWidgetId,
  Settings,
  ThemeList,
  UIColors,
} from '@seelen-ui/lib';
import { Theme, WidgetId } from '@seelen-ui/lib/types';
import { useEffect, useState } from 'react';

type Args = undefined | string | { [x: string]: any };
export const cx = (...args: Args[]): string => {
  return args
    .map((arg) => {
      if (!arg) {
        return;
      }

      if (typeof arg === 'string') {
        return arg;
      }

      let classnames = '';
      Object.keys(arg).forEach((key) => {
        if (arg[key]) {
          classnames += ` ${key}`;
        }
      });

      return classnames.trimStart();
    })
    .join(' ');
};

export function isDarkModeEnabled() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function useDarkMode() {
  const [isDarkMode, setIsDarkMode] = useState(isDarkModeEnabled());

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = () => setIsDarkMode(mediaQuery.matches);
    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, []);

  return isDarkMode;
}

/* backward compatibility object for old themes */
const OLD_THEME_KEYS_BY_WIDGET_ID = {
  [SeelenToolbarWidgetId]: 'toolbar',
  [SeelenWegWidgetId]: 'weg',
  [SeelenWindowManagerWidgetId]: 'wm',
  [SeelenLauncherWidgetId]: 'launcher',
  [SeelenWallWidgetId]: 'wall',
} as Record<WidgetId, string>;

function loadThemes(allThemes: Theme[], selected: string[]) {
  const themes = allThemes
    .filter((theme) => selected.includes(theme.metadata.filename))
    .sort((a, b) => {
      return selected.indexOf(a.metadata.filename) - selected.indexOf(b.metadata.filename);
    });

  const widget = getCurrentWidget();

  document.getElementById(widget.label)?.remove();
  let element = document.createElement('style');
  element.id = widget.label;
  element.textContent = '';

  for (const theme of themes) {
    const oldKey = OLD_THEME_KEYS_BY_WIDGET_ID[widget.id];
    const cssFileContent =
      theme.styles[widget.id] || (oldKey ? theme.styles[oldKey as WidgetId] : undefined);
    if (!cssFileContent) {
      continue;
    }
    let layerName = 'theme-' + theme.metadata.filename.replace(/[\.]/g, '_');
    element.textContent += `@layer ${layerName} {\n${cssFileContent}\n}\n`;
  }

  document.head.appendChild(element);
}

export async function StartThemingTool() {
  const settings = await Settings.getAsync();

  let allThemes = (await ThemeList.getAsync()).asArray();
  let selected = settings.inner.selectedThemes;

  await ThemeList.onChange((list) => {
    allThemes = list.asArray();
    loadThemes(allThemes, selected);
  });

  await Settings.onChange((settings) => {
    selected = settings.inner.selectedThemes;
    loadThemes(allThemes, selected);
  });

  (await UIColors.getAsync()).setAsCssVariables();
  UIColors.onChange((colors) => colors.setAsCssVariables());

  loadThemes(allThemes, selected);
}
