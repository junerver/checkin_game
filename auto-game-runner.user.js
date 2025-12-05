// ==UserScript==
// @name         一键自动打游戏
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  自动依次启动6个小游戏并配合作弊脚本完成
// @author       You
// @match        https://thebottleneck.game.elysia.h-e.top/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
    'use strict';

    // ========== 配置 ==========
    const GAME_IDS = [
        'v1_color',    // 颜色校准
        'v2_diff',     // 选出不同色
        'a1_memory',   // 数字记忆
        'a2_sequence', // 01序列
        'k1_find65',   // 找65
        'k2_positive'  // 正面嘛
    ];

    const GAME_NAMES = {
        'v1_color': '颜色校准',
        'v2_diff': '选出不同色',
        'a1_memory': '数字记忆',
        'a2_sequence': '01序列',
        'k1_find65': '找65',
        'k2_positive': '正面嘛'
    };

    // 延时配置（毫秒）
    const DELAY_BEFORE_START_GAME = 1500;     // 进入详情页后等待时间
    const DELAY_AFTER_GAME_END = 2000;        // 游戏结束后等待时间
    const DELAY_BEFORE_NEXT_GAME = 1500;      // 返回主页后等待时间
    const GAME_TIMEOUT = 120000;              // 单个游戏最大超时时间（2分钟）
    const RESULT_CHECK_INTERVAL = 500;        // 检测游戏结束的间隔

    // 功能开关
    const AUTO_CLAIM_REDEMPTION = false;      // 是否自动领取兑换码（true=自动领取，false=不自动领取）

    // ========== 状态 ==========
    let isRunning = false;
    let currentGameIndex = 0;
    let statusButton = null;

    // ========== 工具函数 ==========

    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function log(message) {
        console.log(`[一键打游戏] ${message}`);
    }

    // 检查是否在主页（游戏列表可见）
    function isOnMainPage() {
        const mainArea = document.getElementById('mainArea');
        if (!mainArea) return false;
        const display = mainArea.style.display || window.getComputedStyle(mainArea).display;
        return display !== 'none';
    }

    // 检查是否在游戏详情页
    function isOnGameDetailPage() {
        const detailArea = document.getElementById('gameDetailArea');
        if (!detailArea) return false;
        const display = detailArea.style.display || window.getComputedStyle(detailArea).display;
        return display !== 'none' && display !== '';
    }

    // 检查是否在游戏进行页
    function isOnGamePlayPage() {
        const playArea = document.getElementById('gamePlayArea');
        if (!playArea) return false;
        const display = playArea.style.display || window.getComputedStyle(playArea).display;
        return display !== 'none' && display !== '';
    }

    // 检查游戏是否结束（出现结果显示）
    function isGameEnded() {
        const resultDisplay = document.querySelector('.result-display');
        return resultDisplay && resultDisplay.offsetParent !== null;
    }

    // 获取游戏卡片
    function getGameCard(gameId) {
        // 在 Shadow DOM 中查找 game-card
        const gameList = document.getElementById('gameList');
        if (!gameList) {
            log('未找到 gameList');
            return null;
        }

        // 尝试访问 Shadow DOM
        if (gameList.shadowRoot) {
            const cards = gameList.shadowRoot.querySelectorAll('game-card');
            for (const card of cards) {
                if (card.getAttribute('game-id') === gameId) {
                    return card;
                }
            }
        }

        // 备选：直接在 document 中查找（可能没有 Shadow DOM）
        const allCards = document.querySelectorAll('game-card');
        for (const card of allCards) {
            if (card.getAttribute('game-id') === gameId) {
                return card;
            }
        }

        return null;
    }

    // 点击游戏卡片
    function clickGameCard(gameId) {
        // 方案1：直接调用全局函数（最可靠）
        if (typeof window.showGameDetail === 'function') {
            window.showGameDetail(gameId);
            log(`调用 showGameDetail('${gameId}')`);
            return true;
        }

        // 方案2：查找并��击 game-card
        const card = getGameCard(gameId);
        if (card) {
            // 尝试点击 Shadow DOM 内部的 .card 元素
            if (card.shadowRoot) {
                const innerCard = card.shadowRoot.querySelector('.card');
                if (innerCard) {
                    innerCard.click();
                    log(`点击 game-card 内部 .card: ${GAME_NAMES[gameId]}`);
                    return true;
                }
            }

            // 直接点击组件
            card.click();
            log(`点击 game-card: ${GAME_NAMES[gameId]}`);
            return true;
        }

        log(`未找到游戏卡片: ${gameId}`);
        return false;
    }

    // 点击开始游戏按钮
    function clickStartGameButton() {
        // 方案1：直接调用全局函数
        if (typeof window.playGame === 'function') {
            window.playGame();
            log('调用 playGame()');
            return true;
        }

        // 方案2：点击按钮
        const playButton = document.querySelector('.play-button');
        if (playButton) {
            playButton.click();
            log('点击开始游戏按钮');
            return true;
        }

        log('未找到开始游戏按钮');
        return false;
    }

    // 返回主页
    function goBackToMain() {
        if (typeof window.backToMain === 'function') {
            window.backToMain();
            log('返回主页');
            return true;
        }

        const backButton = document.querySelector('.back-button');
        if (backButton) {
            backButton.click();
            log('点击返回按钮');
            return true;
        }

        return false;
    }

    // 等待游戏结束
    function waitForGameEnd() {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();

            const checkInterval = setInterval(() => {
                // 检查超时
                if (Date.now() - startTime > GAME_TIMEOUT) {
                    clearInterval(checkInterval);
                    log('游戏超时');
                    reject(new Error('游戏超时'));
                    return;
                }

                // 检查游戏是否结束
                if (isGameEnded()) {
                    clearInterval(checkInterval);
                    log('检测到游戏结束');
                    resolve();
                }
            }, RESULT_CHECK_INTERVAL);
        });
    }

    // 更新状态按钮文字
    function updateButtonStatus(text) {
        if (statusButton) {
            statusButton.textContent = text;
        }
    }

    // ========== 兑换码领取 ==========

    // 检查是否需要领取兑换码
    function needsToClaimRedemption() {
        const claimArea = document.getElementById('redemptionClaim');
        if (!claimArea) return false;
        const display = claimArea.style.display || window.getComputedStyle(claimArea).display;
        return display !== 'none';
    }

    // 检查兑换码是否已显示
    function isRedemptionDisplayed() {
        const displayArea = document.getElementById('redemptionDisplay');
        if (!displayArea) return false;
        const display = displayArea.style.display || window.getComputedStyle(displayArea).display;
        return display !== 'none';
    }

    // 获取兑换码
    function getRedemptionCode() {
        const codeEl = document.getElementById('codeDisplay');
        return codeEl ? codeEl.textContent.trim() : null;
    }

    // 复制文本到剪贴板
    async function copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            log(`兑换码已复制到剪贴板: ${text}`);
            return true;
        } catch (e) {
            log(`剪贴板复制失败: ${e.message}`);
            // 备选方案：尝试调用页面的 copyCode 函数
            if (typeof window.copyCode === 'function') {
                window.copyCode();
                log('调用 copyCode() 复制');
                return true;
            }
            return false;
        }
    }

    // 领取并复制兑换码
    async function claimAndCopyRedemptionCode() {
        // 确保在主页
        if (!isOnMainPage()) {
            log('返回主页以领取兑换码');
            goBackToMain();
            await delay(1000);
        }

        // 滚动到页面底部确保兑换码区域可见
        const redemptionSection = document.querySelector('.redemption-section');
        if (redemptionSection) {
            redemptionSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
            await delay(500);
        }

        // 检查是否需要领取
        if (needsToClaimRedemption()) {
            log('点击领取兑换码按钮');

            // 方案1：调用全局函数
            if (typeof window.claimRedemption === 'function') {
                window.claimRedemption();
                log('调用 claimRedemption()');
            } else {
                // 方案2：点击按钮
                const claimBtn = document.getElementById('claimButton');
                if (claimBtn) {
                    claimBtn.click();
                    log('点击 claimButton');
                }
            }

            // 等待兑换码显示
            await delay(2000);
        }

        // 检查兑换码是否显示
        if (isRedemptionDisplayed()) {
            const code = getRedemptionCode();
            if (code) {
                log(`兑换码: ${code}`);
                await copyToClipboard(code);

                // 显示提示
                showCodeNotification(code);
            } else {
                log('未能获取兑换码内容');
            }
        } else {
            log('兑换码未显示，可能需要先完成所有游戏');
        }
    }

    // 显示兑换码通知
    function showCodeNotification(code) {
        // 创建通知元素
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            padding: 24px 32px;
            border-radius: 16px;
            z-index: 99999;
            text-align: center;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
            font-family: system-ui, -apple-system, sans-serif;
            animation: fadeIn 0.3s ease;
        `;
        notification.innerHTML = `
            <div style="font-size: 24px; margin-bottom: 12px;">✅ 兑换码已复制!</div>
            <div style="font-size: 18px; font-family: monospace; background: rgba(0,0,0,0.2); padding: 12px 16px; border-radius: 8px; margin-bottom: 12px;">${code}</div>
            <div style="font-size: 14px; opacity: 0.9;">已自动复制到剪贴板</div>
        `;

        // 添加动画样式
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; transform: translate(-50%, -50%) scale(0.9); }
                to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
            }
        `;
        document.head.appendChild(style);

        document.body.appendChild(notification);

        // 5秒后自动消失
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transition = 'opacity 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    }

    // ========== 核心流程 ==========

    async function runSingleGame(gameId) {
        const gameName = GAME_NAMES[gameId];
        log(`开始游戏: ${gameName}`);
        updateButtonStatus(`${gameName}...`);

        // 1. 确保在主页
        log(`当前页面状态: 主页=${isOnMainPage()}, 详情页=${isOnGameDetailPage()}, 游戏页=${isOnGamePlayPage()}`);

        if (!isOnMainPage()) {
            log('不在主页，尝试返回');
            goBackToMain();
            await delay(1000);

            // 可能需要再返回一次（从游戏页到详情页再到主页）
            if (!isOnMainPage()) {
                goBackToMain();
                await delay(1000);
            }
        }

        // 2. 点击游戏卡片进入详情页
        log(`准备点击游戏卡片: ${gameId}`);
        if (!clickGameCard(gameId)) {
            throw new Error(`无法打开游戏: ${gameName}`);
        }
        await delay(DELAY_BEFORE_START_GAME);

        // 3. 点击开始游戏
        log(`点击后页面状态: 主页=${isOnMainPage()}, 详情页=${isOnGameDetailPage()}, 游戏页=${isOnGamePlayPage()}`);
        if (!isOnGameDetailPage()) {
            throw new Error(`未能进入详情页: ${gameName}`);
        }

        if (!clickStartGameButton()) {
            throw new Error(`无法开始游戏: ${gameName}`);
        }
        await delay(500);

        // 4. 等待游戏结束（作弊脚本会自动执行）
        log(`等待作弊脚本完成: ${gameName}`);
        try {
            await waitForGameEnd();
        } catch (e) {
            log(`游戏异常: ${e.message}`);
            // 即使超时也继续
        }

        // 5. 游戏结束后等待
        await delay(DELAY_AFTER_GAME_END);

        // 6. 返回主页
        goBackToMain();
        await delay(DELAY_BEFORE_NEXT_GAME);

        log(`游戏完成: ${gameName}`);
    }

    async function runAllGames() {
        if (isRunning) {
            log('已在运行中');
            return;
        }

        isRunning = true;
        currentGameIndex = 0;
        log('开始自动打游戏流程');
        updateButtonStatus('运行中...');

        try {
            for (let i = 0; i < GAME_IDS.length; i++) {
                currentGameIndex = i;
                const gameId = GAME_IDS[i];

                try {
                    await runSingleGame(gameId);
                } catch (e) {
                    log(`游戏 ${GAME_NAMES[gameId]} 出错: ${e.message}`);
                    // 尝试恢复到主页继续下一个游戏
                    goBackToMain();
                    await delay(1000);
                    goBackToMain();
                    await delay(1000);
                }
            }

            log('全部游戏完成！');

            // 根据开关决定是否自动领取兑换码
            if (AUTO_CLAIM_REDEMPTION) {
                updateButtonStatus('领取兑换码...');
                await claimAndCopyRedemptionCode();
            } else {
                log('自动领取兑换码已关闭，请手动领取');
            }

            updateButtonStatus('完成!');

            // 3秒后恢复按钮文字
            await delay(3000);
            updateButtonStatus('🎮 一键打卡');

        } catch (e) {
            log(`流程出错: ${e.message}`);
            updateButtonStatus('出错');
        } finally {
            isRunning = false;
        }
    }

    // ========== UI 创建 ==========

    function createAutoButton() {
        // 检查是否已经创建
        if (document.getElementById('autoGameBtn')) {
            statusButton = document.getElementById('autoGameBtn');
            return true;
        }

        // 检查主游戏区域是否显示（确保已登录）
        const mainArea = document.getElementById('mainArea');
        if (!mainArea || mainArea.style.display === 'none') {
            log('主游戏区域未显示，稍后重试');
            return false;
        }

        // 创建浮动按钮容器
        const btnContainer = document.createElement('div');
        btnContainer.id = 'autoGameBtnContainer';
        btnContainer.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
        `;

        // 创建按钮
        statusButton = document.createElement('button');
        statusButton.id = 'autoGameBtn';
        statusButton.textContent = '🎮 一键打卡';
        statusButton.style.cssText = `
            background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
            color: white;
            border: none;
            padding: 12px 20px;
            font-size: 16px;
            border-radius: 12px;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.215, 0.61, 0.355, 1);
            font-weight: 600;
            box-shadow: 0 4px 15px rgba(245, 158, 11, 0.4);
            font-family: system-ui, -apple-system, sans-serif;
        `;

        // 悬停效果
        statusButton.addEventListener('mouseenter', () => {
            if (!isRunning) {
                statusButton.style.transform = 'translateY(-2px) scale(1.05)';
                statusButton.style.boxShadow = '0 6px 20px rgba(245, 158, 11, 0.5)';
            }
        });

        statusButton.addEventListener('mouseleave', () => {
            statusButton.style.transform = 'translateY(0) scale(1)';
            statusButton.style.boxShadow = '0 4px 15px rgba(245, 158, 11, 0.4)';
        });

        // 点击事件
        statusButton.addEventListener('click', () => {
            if (isRunning) {
                log('正在运行中，请等待完成');
                return;
            }
            runAllGames();
        });

        btnContainer.appendChild(statusButton);
        document.body.appendChild(btnContainer);

        log('一键打卡按钮已创建');
        return true;
    }

    // ========== 初始化 ==========

    function init() {
        // 等待页面加载完成后创建按钮
        const maxAttempts = 20;
        let attempts = 0;

        const tryCreate = () => {
            attempts++;
            if (createAutoButton()) {
                log('初始化完成');
                return;
            }

            if (attempts < maxAttempts) {
                setTimeout(tryCreate, 500);
            } else {
                log('初始化失败：无法创建按钮');
            }
        };

        // 监听 DOM 变化以便在登录后创建按钮
        const observer = new MutationObserver(() => {
            if (!statusButton || !document.contains(statusButton)) {
                tryCreate();
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        // 首次尝试
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                setTimeout(tryCreate, 1000);
            });
        } else {
            setTimeout(tryCreate, 1000);
        }
    }

    init();

})();
