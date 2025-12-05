// ==UserScript==
// @name         颜色校准作弊
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  自动匹配目标颜色，获得完美分数
// @author       You
// @match        https://thebottleneck.game.elysia.h-e.top/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function () {
    'use strict';

    // 配置
    const AUTO_SUBMIT_DELAY = 1500;  // 自动提交延时（毫秒）

    // 状态追踪
    let lastProcessedRound = 0;
    let isProcessing = false;
    let prototypeHooked = false;
    let originalGetColor = null;

    // 从 hex 颜色提取 RGB
    function hexToRgb(hex) {
        hex = hex.replace('#', '');
        if (hex.length === 3) {
            hex = hex.split('').map(c => c + c).join('');
        }
        const num = parseInt(hex, 16);
        return {
            r: (num >> 16) & 255,
            g: (num >> 8) & 255,
            b: num & 255
        };
    }

    // RGB 转 hex
    function rgbToHex(r, g, b) {
        return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
    }

    // 从背景样式提取颜色
    function extractColorFromStyle(style) {
        if (!style) return null;

        // 匹配 #rrggbb 或 #rgb
        const hexMatch = style.match(/#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})/);
        if (hexMatch) {
            return hexMatch[0];
        }

        // 匹配 rgb(r, g, b)
        const rgbMatch = style.match(/rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i);
        if (rgbMatch) {
            return rgbToHex(
                parseInt(rgbMatch[1]),
                parseInt(rgbMatch[2]),
                parseInt(rgbMatch[3])
            );
        }

        return null;
    }

    // 获取当前轮次
    function getCurrentRound() {
        const gameInfo = document.querySelector('.game-info');
        if (!gameInfo) return 0;

        const text = gameInfo.textContent;
        const match = text.match(/轮次:\s*(\d+)\/\d+/);
        return match ? parseInt(match[1], 10) : 0;
    }

    // 检测是否在颜色校准游戏
    function isColorCalibrationGame() {
        const h2 = document.querySelector('h2');
        const colorDisplay = document.querySelector('.color-display');
        const colorPicker = document.querySelector('#customColorPicker');

        return h2 && h2.textContent.includes('颜色校准') &&
            colorDisplay && colorPicker;
    }

    // 获取目标颜色
    function getTargetColor() {
        const colorDisplay = document.querySelector('.color-display');
        if (!colorDisplay) return null;

        const style = colorDisplay.getAttribute('style') || colorDisplay.style.background;
        return extractColorFromStyle(style);
    }

    // Hook CustomColorPicker 类的原型
    function hookColorPickerPrototype() {
        if (prototypeHooked) return true;

        if (typeof window.CustomColorPicker === 'function' && window.CustomColorPicker.prototype) {
            originalGetColor = window.CustomColorPicker.prototype.getColor;

            window.CustomColorPicker.prototype.getColor = function() {
                // 检查是否在颜色校准游戏中
                if (isColorCalibrationGame()) {
                    const targetHex = getTargetColor();
                    if (targetHex) {
                        const rgb = hexToRgb(targetHex);
                        console.log('[颜色校准作弊] getColor 被拦截，返回目标颜色:', targetHex);
                        return {
                            hex: targetHex,
                            rgb: rgb,
                            r: rgb.r,
                            g: rgb.g,
                            b: rgb.b
                        };
                    }
                }

                // 不在游戏中，调用原始方法
                return originalGetColor.call(this);
            };

            prototypeHooked = true;
            console.log('[颜色校准作弊] CustomColorPicker.prototype.getColor 已被 Hook');
            return true;
        }

        return false;
    }

    // 主要作弊逻辑
    function processRound() {
        if (isProcessing) return;
        if (!isColorCalibrationGame()) return;

        const currentRound = getCurrentRound();
        if (currentRound <= lastProcessedRound || currentRound === 0) return;

        isProcessing = true;

        const targetHex = getTargetColor();
        if (!targetHex) {
            console.log('[颜色校准作弊] 无法获取目标颜色');
            isProcessing = false;
            return;
        }

        console.log(`[颜色校准作弊] 轮次 ${currentRound}，目标颜色: ${targetHex}`);

        // 尝试 Hook 原型
        if (!prototypeHooked) {
            const hooked = hookColorPickerPrototype();
            if (hooked) {
                console.log('[颜色校准作弊] Hook 成功');
            } else {
                console.log('[颜色校准作弊] CustomColorPicker 类尚未可用，稍后重试');
            }
        }

        // 自动提交
        setTimeout(() => {
            const submitBtn = document.querySelector('button[onclick="submitColorMatch()"]');
            if (submitBtn && isColorCalibrationGame() && getCurrentRound() === currentRound) {
                // 再次确保 Hook 已生效
                hookColorPickerPrototype();

                submitBtn.click();
                lastProcessedRound = currentRound;
                console.log(`[颜色校准作弊] 轮次 ${currentRound} 已提交`);
            }
            isProcessing = false;
        }, AUTO_SUBMIT_DELAY);
    }

    // 防抖检查
    let debounceTimer = null;
    function debouncedCheck() {
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            // 尝试 Hook
            hookColorPickerPrototype();

            if (isColorCalibrationGame()) {
                processRound();
            }
        }, 300);
    }

    // 监听 CustomColorPicker 类的定义
    function watchForCustomColorPicker() {
        let customColorPickerDefined = false;

        // 使用 Object.defineProperty 拦截 CustomColorPicker 的定义
        const originalDescriptor = Object.getOwnPropertyDescriptor(window, 'CustomColorPicker');

        Object.defineProperty(window, 'CustomColorPicker', {
            configurable: true,
            enumerable: true,
            get: function() {
                return this._CustomColorPicker;
            },
            set: function(value) {
                console.log('[颜色校准作弊] 检测到 CustomColorPicker 类定义');
                this._CustomColorPicker = value;

                // 延迟 Hook，确保原型已完全定义
                setTimeout(() => {
                    hookColorPickerPrototype();
                }, 0);
            }
        });

        // 如果已经定义了，立即 Hook
        if (originalDescriptor && originalDescriptor.value) {
            window._CustomColorPicker = originalDescriptor.value;
            hookColorPickerPrototype();
        }
    }

    // 启动观察者
    function startObserver() {
        const observer = new MutationObserver(() => {
            debouncedCheck();
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        console.log('[颜色校准作弊] 脚本已启动，正在监听页面变化...');
    }

    // 初始化
    function init() {
        // 尽早拦截 CustomColorPicker 类的定义
        watchForCustomColorPicker();

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                startObserver();
                setTimeout(debouncedCheck, 1000);
            });
        } else {
            startObserver();
            setTimeout(debouncedCheck, 1000);
        }

        // 定期检查并尝试 Hook
        setInterval(() => {
            if (!prototypeHooked) {
                hookColorPickerPrototype();
            }
        }, 500);
    }

    init();
})();
