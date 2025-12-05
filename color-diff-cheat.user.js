// ==UserScript==
// @name         找不同色自动点击
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  自动识别并点击颜色不同的方块
// @author       You
// @match        https://thebottleneck.game.elysia.h-e.top/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // 配置
    const MIN_DELAY = 300;  // 点击前最小延时 1.5秒
    const MAX_DELAY = 300;  // 点击前最大延时 3秒
    const COOLDOWN = 300;   // 点击后冷却时间 3秒

    // 状态追踪
    let lastClickedRound = 0;   // 上次点击的轮次
    let isInCooldown = false;   // 是否在冷却期
    let pendingTimeout = null;  // 待执行的定时器

    // 生成随机延时
    function getRandomDelay() {
        return Math.floor(Math.random() * (MAX_DELAY - MIN_DELAY + 1)) + MIN_DELAY;
    }

    // 获取当前轮次
    function getCurrentRound() {
        const gameInfo = document.querySelector('.game-info');
        if (!gameInfo) return 0;

        const text = gameInfo.textContent;
        const match = text.match(/轮次:\s*(\d+)\/\d+/);
        if (match) {
            return parseInt(match[1], 10);
        }
        return 0;
    }

    // 检测是否在"选出不同色"游戏页面
    function isColorDiffGame() {
        const h2 = document.querySelector('h2');
        const gameInfo = document.querySelector('.game-info');
        const gridContainer = document.querySelector('.grid-container');

        return h2 && h2.textContent.includes('选出不同色') &&
            gameInfo && gridContainer;
    }

    // 找到颜色不同的格子并点击
    function findAndClickDifferentCell() {
        // 如果在冷却期，跳过
        if (isInCooldown) {
            console.log(`[找不同色作弊] 冷却期中，跳过检测`);
            return;
        }

        const currentRound = getCurrentRound();

        // 如果已经处理过这一轮，跳过
        if (currentRound <= lastClickedRound || currentRound === 0) {
            return;
        }

        // 如果已有待执行的点击，跳过
        if (pendingTimeout) {
            return;
        }

        const cells = document.querySelectorAll('.grid-cell');
        if (cells.length === 0) return;

        // 统计每种颜色出现的次数
        const colorCount = {};
        const colorCells = {};

        cells.forEach((cell, index) => {
            const bgColor = cell.style.background || cell.style.backgroundColor;
            if (bgColor) {
                if (!colorCount[bgColor]) {
                    colorCount[bgColor] = 0;
                    colorCells[bgColor] = [];
                }
                colorCount[bgColor]++;
                colorCells[bgColor].push({ cell, index });
            }
        });

        // 找到只出现一次的颜色（即不同的那个）
        let differentCell = null;
        let differentIndex = -1;

        for (const color in colorCount) {
            if (colorCount[color] === 1) {
                differentCell = colorCells[color][0].cell;
                differentIndex = colorCells[color][0].index;
                break;
            }
        }

        if (differentCell) {
            const delay = getRandomDelay();
            console.log(`[找不同色作弊] 轮次 ${currentRound}，发现不同颜色在索引 ${differentIndex}，将在 ${delay}ms 后点击`);

            pendingTimeout = setTimeout(() => {
                // 再次检查是否仍然在游戏中且轮次未变
                if (!isColorDiffGame()) {
                    console.log(`[找不同色作弊] 游戏已结束或页面已变化`);
                    pendingTimeout = null;
                    return;
                }

                const nowRound = getCurrentRound();
                if (nowRound === currentRound && nowRound > lastClickedRound) {
                    // 执行点击
                    differentCell.click();
                    lastClickedRound = currentRound;
                    console.log(`[找不同色作弊] 轮次 ${currentRound}，已点击索引 ${differentIndex}`);

                    // 进入冷却期
                    isInCooldown = true;
                    console.log(`[找不同色作弊] 进入冷却期 ${COOLDOWN}ms`);

                    setTimeout(() => {
                        isInCooldown = false;
                        console.log(`[找不同色作弊] 冷却期结束，可以继续检测`);
                        // 冷却结束后主动检查一次
                        setTimeout(() => {
                            if (isColorDiffGame()) {
                                findAndClickDifferentCell();
                            }
                        }, 500);
                    }, COOLDOWN);
                }

                pendingTimeout = null;
            }, delay);
        }
    }

    // 防抖函数
    let debounceTimer = null;
    function debouncedCheck() {
        // 冷却期内不检测
        if (isInCooldown) return;

        if (debounceTimer) {
            clearTimeout(debounceTimer);
        }
        debounceTimer = setTimeout(() => {
            if (isColorDiffGame()) {
                findAndClickDifferentCell();
            }
        }, 500);
    }

    // 使用 MutationObserver 监听页面变化
    function startObserver() {
        const observer = new MutationObserver((mutations) => {
            debouncedCheck();
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        console.log('[找不同色作弊] 脚本已启动，正在监听页面变化...');
    }

    // 初始化
    function init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                startObserver();
                setTimeout(() => {
                    if (isColorDiffGame()) {
                        findAndClickDifferentCell();
                    }
                }, 1500);
            });
        } else {
            startObserver();
            setTimeout(() => {
                if (isColorDiffGame()) {
                    findAndClickDifferentCell();
                }
            }, 1500);
        }
    }

    init();
})();
