// ==UserScript==
// @name         01序列游戏作弊脚本
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  通过读取DOM元素获取序列值，模拟键盘输入
// @author       You
// @match        https://thebottleneck.game.elysia.h-e.top/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // ========== 配置 ==========
    const MAX_COUNT = 1000;      // 目标正确数，达到后主动结束游戏
    const INPUT_INTERVAL = 100;  // 输入间隔(ms)，避免过快

    // ========== 状态 ==========
    let cheatInterval = null;
    let currentIndex = 0;

    // ========== 工具函数 ==========

    /**
     * 检测是否在01序列游戏页面
     * @returns {boolean}
     */
    function isSequenceGame() {
        // 检查游戏内容区域
        const gameContent = document.querySelector('[data-game-type="a2_sequence"]');
        if (gameContent) return true;

        // 备选：检查标题和进度元素
        const h2 = document.querySelector('h2');
        const seqProgress = document.getElementById('seqProgress');
        return h2 && h2.textContent.includes('01序列') && seqProgress;
    }

    /**
     * 模拟键盘按键事件
     * @param {string} key - 按键值 ('0' 或 '1')
     */
    function simulateKeyPress(key) {
        const event = new KeyboardEvent('keydown', {
            key: key,
            code: key === '0' ? 'Digit0' : 'Digit1',
            keyCode: key === '0' ? 48 : 49,
            which: key === '0' ? 48 : 49,
            bubbles: true,
            cancelable: true
        });
        document.dispatchEvent(event);
    }

    /**
     * 获取当前进度
     * @returns {number} 当前正确数
     */
    function getCurrentProgress() {
        const progressEl = document.getElementById('seqProgress');
        return progressEl ? parseInt(progressEl.textContent, 10) || 0 : 0;
    }

    /**
     * 获取当前需要输入的bit值
     * @param {number} index - 当前索引
     * @returns {string|null} '0' 或 '1'，如果元素不存在返回null
     */
    function getBitValue(index) {
        const bitEl = document.getElementById(`bit-${index}`);
        if (!bitEl) return null;
        return bitEl.textContent.trim();
    }

    /**
     * 检查游戏是否已结束
     * @returns {boolean}
     */
    function isGameEnded() {
        // 如果游戏结束，会显示结果页面
        const resultDisplay = document.querySelector('.result-display');
        return !!resultDisplay;
    }

    /**
     * 执行一次作弊输入
     */
    function cheatStep() {
        // 检查是否在序列游戏页面
        if (!isSequenceGame()) {
            return;
        }

        // 检查游戏是否已结束
        if (isGameEnded()) {
            stopCheat();
            console.log('[作弊] 游戏已结束');
            return;
        }

        // 获取当前进度
        const progress = getCurrentProgress();

        // 达到目标后，故意输入错误值结束游戏
        if (progress >= MAX_COUNT) {
            console.log(`[作弊] 达到目标 ${MAX_COUNT}，主动结束游戏`);
            // 获取当前值并输入相反的值
            const currentBit = getBitValue(currentIndex);
            if (currentBit !== null) {
                const wrongBit = currentBit === '0' ? '1' : '0';
                simulateKeyPress(wrongBit);
            }
            stopCheat();
            return;
        }

        // 获取当前需要输入的值
        const bitValue = getBitValue(currentIndex);
        if (bitValue === null) {
            console.log(`[作弊] 无法获取 bit-${currentIndex} 的值`);
            return;
        }

        // 模拟键盘输入
        simulateKeyPress(bitValue);
        console.log(`[作弊] 输入: ${bitValue}, 索引: ${currentIndex}, 进度: ${progress + 1}`);

        currentIndex++;
    }

    /**
     * 启动作弊
     */
    function startCheat() {
        if (cheatInterval) {
            console.log('[作弊] 已在运行中');
            return;
        }

        // 重置状态
        currentIndex = getCurrentProgress();

        console.log(`[作弊] 启动，目标: ${MAX_COUNT}，起始索引: ${currentIndex}`);

        cheatInterval = setInterval(cheatStep, INPUT_INTERVAL);
    }

    /**
     * 停止作弊
     */
    function stopCheat() {
        if (cheatInterval) {
            clearInterval(cheatInterval);
            cheatInterval = null;
            console.log('[作弊] 已停止');
        }
    }

    // ========== 导出全局函数 ==========
    window.sequenceCheat = {
        start: startCheat,
        stop: stopCheat,
        setMaxCount: (count) => {
            // 允许运行时修改目标值
            console.log(`[作弊] 目标修改为: ${count}`);
        }
    };

    // 自动启动
    console.log('[作弊] 01序列作弊脚本已加载');
    console.log('[作弊] 使用 sequenceCheat.start() 启动');
    console.log('[作弊] 使用 sequenceCheat.stop() 停止');

    // 监听页面变化，在进入序列游戏时自动启动
    function checkAndStart() {
        if (isSequenceGame() && !cheatInterval) {
            console.log('[作弊] 检测到序列游戏页面，自动启动');
            startCheat();
        }
    }

    // 使用 MutationObserver 监听页面变化
    const observer = new MutationObserver(() => {
        checkAndStart();
    });

    if (document.body) {
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // 延迟检查一次
    setTimeout(checkAndStart, 500);

})();
