// ==UserScript==
// @name         数字记忆自动作弊
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  自动捕获Canvas绘制的数字并填入输入框，自动提交，第20轮自动结束
// @author       You
// @match        https://thebottleneck.game.elysia.h-e.top/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function () {
    'use strict';

    // 配置
    const AUTO_END_AT_DIGIT = 20;  // 在第20位数时自动结束游戏
    const MIN_SUBMIT_DELAY = 200;  // 提交前最小延时
    const MAX_SUBMIT_DELAY = 300;  // 提交前最大延时

    // 存储捕获的数字
    let capturedDigits = '';
    let lastCaptureTime = 0;
    let hasSubmittedThisRound = false;  // 防止重复提交

    // 生成随机延时
    function getRandomDelay() {
        return Math.floor(Math.random() * (MAX_SUBMIT_DELAY - MIN_SUBMIT_DELAY + 1)) + MIN_SUBMIT_DELAY;
    }

    // 获取当前位数
    function getCurrentDigitCount() {
        const gameInfo = document.querySelector('.game-info');
        if (!gameInfo) return 0;

        const text = gameInfo.textContent;
        const match = text.match(/当前位数:\s*(\d+)/);
        if (match) {
            return parseInt(match[1], 10);
        }
        return 0;
    }

    // 在 document-start 阶段拦截 fillText，确保在游戏代码之前注入
    const originalFillText = CanvasRenderingContext2D.prototype.fillText;
    CanvasRenderingContext2D.prototype.fillText = function (text, x, y, maxWidth) {
        // 如果是单个数字，记录下来
        if (/^\d$/.test(text)) {
            const now = Date.now();
            // 如果距离上次捕获超过500ms，说明是新一轮，重置
            if (now - lastCaptureTime > 500) {
                capturedDigits = '';
                hasSubmittedThisRound = false;  // 新一轮，重置提交标记
            }
            capturedDigits += text;
            lastCaptureTime = now;
        }
        return originalFillText.apply(this, arguments);
    };

    // 检测是否在数字记忆游戏页面
    function isMemoryGame() {
        const gameContent = document.querySelector('[data-game-type="a1_memory"]');
        return !!gameContent;
    }

    // 自动提交
    function autoSubmit() {
        const submitBtn = document.querySelector('button[onclick="checkMemory()"]');
        if (submitBtn) {
            const delay = getRandomDelay();
            setTimeout(() => {
                submitBtn.click();
            }, delay);
        }
    }

    // 自动填入数字
    function autoFillDigits() {
        if (!isMemoryGame() || !capturedDigits || hasSubmittedThisRound) return;

        // 查找输入框
        const input = document.querySelector('input[type="text"], input[type="number"], input:not([type])');
        if (!input) return;

        // 检查输入框是否可见
        const style = window.getComputedStyle(input);
        if (style.display === 'none' || style.visibility === 'hidden') return;

        // 检查输入框是否已有值
        if (input.value !== '') return;

        // 获取当前位数
        const currentDigitCount = getCurrentDigitCount();

        // 判断是否需要故意输错结束游戏
        let valueToFill = capturedDigits;
        if (currentDigitCount >= AUTO_END_AT_DIGIT) {
            valueToFill = 'x';
        }

        // 设置值
        input.value = valueToFill;

        // 触发 input 事件，确保游戏能检测到值变化
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));

        // 聚焦输入框
        input.focus();

        // 标记已提交，防止重复
        hasSubmittedThisRound = true;

        // 自动提交
        autoSubmit();
    }

    // 监听 DOM 变化，检测输入框出现
    function startObserver() {
        const observer = new MutationObserver((mutations) => {
            if (isMemoryGame()) {
                // 延迟一点执行，确保输入框完全渲染
                setTimeout(autoFillDigits, 100);
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // 初始化
    function init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', startObserver);
        } else {
            startObserver();
        }
    }

    init();
})();
