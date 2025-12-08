// ==UserScript==
// @name         数字记忆自动作弊
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  自动捕获Canvas绘制的数字，模拟人类输入，防反作弊
// @author       You
// @match        https://thebottleneck.game.elysia.h-e.top/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function () {
    'use strict';

    // 配置
    const AUTO_END_AT_DIGIT = 10;      // 在第20位数时自动结束游戏
    const MIN_TYPE_DELAY = 50;         // 单个按键最小间隔 (ms)
    const MAX_TYPE_DELAY = 150;        // 单个按键最大间隔 (ms)
    const MIN_SUBMIT_DELAY = 100;      // 输入完成后到按回车的最小延时
    const MAX_SUBMIT_DELAY = 250;      // 输入完成后到按回车的最大延时

    // 存储捕获的数字
    let capturedDigits = '';
    let lastCaptureTime = 0;
    let hasSubmittedThisRound = false;
    let isTyping = false;  // 防止重复触发输入

    // 生成随机延时
    function getRandomDelay(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
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

    // 在 document-start 阶段拦截 fillText
    const originalFillText = CanvasRenderingContext2D.prototype.fillText;
    CanvasRenderingContext2D.prototype.fillText = function (text, x, y, maxWidth) {
        if (/^\d$/.test(text)) {
            const now = Date.now();
            if (now - lastCaptureTime > 500) {
                capturedDigits = '';
                hasSubmittedThisRound = false;
                isTyping = false;
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

    // 模拟单个按键事件
    function simulateKeyPress(element, char) {
        const keyCode = char.charCodeAt(0);
        const key = char;

        // KeyDown 事件
        const keyDownEvent = new KeyboardEvent('keydown', {
            key: key,
            code: `Digit${char}`,
            keyCode: keyCode,
            which: keyCode,
            bubbles: true,
            cancelable: true
        });
        element.dispatchEvent(keyDownEvent);

        // KeyPress 事件
        const keyPressEvent = new KeyboardEvent('keypress', {
            key: key,
            code: `Digit${char}`,
            keyCode: keyCode,
            which: keyCode,
            charCode: keyCode,
            bubbles: true,
            cancelable: true
        });
        element.dispatchEvent(keyPressEvent);

        // 更新输入框的值
        element.value += char;

        // Input 事件
        const inputEvent = new InputEvent('input', {
            data: char,
            inputType: 'insertText',
            bubbles: true,
            cancelable: true
        });
        element.dispatchEvent(inputEvent);

        // KeyUp 事件
        const keyUpEvent = new KeyboardEvent('keyup', {
            key: key,
            code: `Digit${char}`,
            keyCode: keyCode,
            which: keyCode,
            bubbles: true,
            cancelable: true
        });
        element.dispatchEvent(keyUpEvent);
    }

    // 模拟回车键提交
    function simulateEnterKey(element) {
        const keyDownEvent = new KeyboardEvent('keydown', {
            key: 'Enter',
            code: 'Enter',
            keyCode: 13,
            which: 13,
            bubbles: true,
            cancelable: true
        });
        element.dispatchEvent(keyDownEvent);

        const keyPressEvent = new KeyboardEvent('keypress', {
            key: 'Enter',
            code: 'Enter',
            keyCode: 13,
            which: 13,
            bubbles: true,
            cancelable: true
        });
        element.dispatchEvent(keyPressEvent);

        const keyUpEvent = new KeyboardEvent('keyup', {
            key: 'Enter',
            code: 'Enter',
            keyCode: 13,
            which: 13,
            bubbles: true,
            cancelable: true
        });
        element.dispatchEvent(keyUpEvent);
    }

    // 逐字符模拟输入
    async function simulateTyping(element, text) {
        element.focus();
        element.value = '';  // 清空

        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            simulateKeyPress(element, char);

            // 每个字符之间随机延迟
            if (i < text.length - 1) {
                await new Promise(resolve =>
                    setTimeout(resolve, getRandomDelay(MIN_TYPE_DELAY, MAX_TYPE_DELAY))
                );
            }
        }

        // 输入完成后随机延迟，然后按回车
        await new Promise(resolve =>
            setTimeout(resolve, getRandomDelay(MIN_SUBMIT_DELAY, MAX_SUBMIT_DELAY))
        );

        simulateEnterKey(element);
    }

    // 自动填入数字
    async function autoFillDigits() {
        if (!isMemoryGame() || !capturedDigits || hasSubmittedThisRound || isTyping) return;

        const input = document.querySelector('input[type="text"], input[type="number"], input:not([type])');
        if (!input) return;

        const style = window.getComputedStyle(input);
        if (style.display === 'none' || style.visibility === 'hidden') return;

        if (input.value !== '') return;

        // 标记状态
        isTyping = true;
        hasSubmittedThisRound = true;

        const currentDigitCount = getCurrentDigitCount();

        let valueToFill = capturedDigits;
        if (currentDigitCount >= AUTO_END_AT_DIGIT) {
            valueToFill = 'x';
        }

        // 模拟人类输入
        await simulateTyping(input, valueToFill);

        isTyping = false;
    }

    // 监听 DOM 变化
    function startObserver() {
        const observer = new MutationObserver((mutations) => {
            if (isMemoryGame() && !isTyping) {
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
