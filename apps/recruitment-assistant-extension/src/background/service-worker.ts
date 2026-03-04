/**
 * Background Service Worker для Recruitment Assistant Extension
 *
 * Обрабатывает сообщения от content script и проксирует API запросы
 * для обхода CORS ограничений.
 */

import { createMessageHandler } from "./handlers";
import { log } from "./lib";

chrome.runtime.onMessage.addListener(createMessageHandler());

chrome.runtime.onInstalled.addListener((details) => {
  log("Расширение установлено", { reason: details.reason });

  if (details.reason === "install") {
    log("Первая установка расширения");
  } else if (details.reason === "update") {
    log("Расширение обновлено", {
      previousVersion: details.previousVersion,
    });
  }
});

log("Service Worker запущен");
