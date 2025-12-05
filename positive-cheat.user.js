// ==UserScript==
// @name         正面嘛自动作弊
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  通过题库文本匹配自动判断正面/负面
// @author       You
// @match        https://thebottleneck.game.elysia.h-e.top/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // 配置
    const MIN_DELAY = 300;          // 点击前最小延时 (ms)
    const MAX_DELAY = 300;          // 点击前最大延时 (ms)
    const COOLDOWN = 300;           // 点击后冷却时间 (ms)

    // 完整题库 - 从源码解析得到
    const STATEMENTS = [
        // 负面语句（阴阳怪气）
        // {text: `你可真是个天才。`, isPositive: false}, // 难以区分：可能是真心夸奖
        // {text: `哇，你好厉害哦。`, isPositive: false}, // 难以区分：语气不明显
        { text: `就你最聪明。`, isPositive: false },
        // {text: `你可真能干。`, isPositive: false}, // 难以区分：可能是真心夸奖
        { text: `这都行？佩服佩服。`, isPositive: false },
        { text: `你能这么想，真是难为你了。`, isPositive: false },
        // {text: `你可真会说话。`, isPositive: false}, // 难以区分：有时确实是夸人
        { text: `呵呵，那可真是谢谢你啊。`, isPositive: false },
        // {text: `你开心就好。`, isPositive: false}, // 难以区分：有时是真心祝福
        { text: `那（我）可得好好学习一下。`, isPositive: false },
        // {text: `你的品味真独特。`, isPositive: false}, // 难以区分：可能是真心夸奖
        // {text: `你总是这么出人意料。`, isPositive: false}, // 难以区分：可能是惊喜
        { text: `这件衣服一般人驾驭不了。`, isPositive: false },
        { text: `哟，这不X总吗？`, isPositive: false },
        { text: `你可真是个大忙人。`, isPositive: false },
        { text: `哟，今天太阳打西边出来了？`, isPositive: false },
        { text: `你说的都对。`, isPositive: false },
        { text: `是是是，你最有理。`, isPositive: false },
        // {text: `长见识了。`, isPositive: false}, // 难以区分：可能是真心感慨
        // {text: `你可真是个小机灵鬼。`, isPositive: false}, // 难以区分：对小孩可能是真心夸奖
        { text: `真是孝死我了。`, isPositive: false },
        { text: `知道了，你最懂。`, isPositive: false },
        { text: `这福气给你，你要不要啊？`, isPositive: false },
        { text: `这水平，不去（xxx）真是屈才了。`, isPositive: false },
        { text: `你的逻辑真感人。`, isPositive: false },
        // {text: `还是你面子大。`, isPositive: false}, // 难以区分：有时是真心认可
        // {text: `你可真是个热心肠。`, isPositive: false}, // 难以区分：通常是夸人的
        { text: `我看你就是闲的。`, isPositive: false },
        { text: `给你能耐的。`, isPositive: false },
        { text: `你（这么做）可真行。`, isPositive: false },
        // {text: `真是委屈你了。`, isPositive: false}, // 难以区分：可能是真心安慰
        { text: `听君一席话，如听一席话。`, isPositive: false },
        { text: `你是不是觉得你很幽默？`, isPositive: false },
        // {text: `我真羡慕你。`, isPositive: false}, // 难以区分：可能是真心羡慕
        // {text: `你这人（心）可真大。`, isPositive: false}, // 难以区分：可能是夸心态好
        // {text: `祝你成功。`, isPositive: false}, // 难以区分：通常是祝福语
        { text: `辛苦你了（还要特地来害我）。`, isPositive: false },
        // {text: `这可真是原汁原味。`, isPositive: false}, // 难以区分：可能是夸赞正宗
        // {text: `你还真是一点没变。`, isPositive: false}, // 难以区分：可能是怀念
        { text: `你们读书人花样就是多。`, isPositive: false },
        { text: `也不知道是随谁了。`, isPositive: false },
        { text: `你这（PPT/设计）做得真花哨。`, isPositive: false },
        // {text: `这个创意很大胆。`, isPositive: false}, // 难以区分：可能是真心夸奖
        // {text: `你这格局就打开了。`, isPositive: false}, // 难以区分：可能是真心夸奖
        // {text: `你这效率可真高啊。`, isPositive: false}, // 难以区分：可能是真心夸奖
        // {text: `这可真是巧了。`, isPositive: false}, // 难以区分：可能只是感慨
        // {text: `他就是太老实了。`, isPositive: false}, // 难以区分：有时是夸人品好
        // {text: `你这人就是太实在。`, isPositive: false}, // 难以区分：有时是夸人品好
        // {text: `多喝热水。`, isPositive: false}, // 难以区分：有时是真心关心
        { text: `不然呢？`, isPositive: false },

        // 正面语句
        { text: `你真是太棒了！`, isPositive: true },
        { text: `这个主意非常出色。`, isPositive: true },
        { text: `你的表现超出了所有人的预期。`, isPositive: true },
        { text: `你是一个非常可靠的人。`, isPositive: true },
        { text: `你的才华令人钦佩。`, isPositive: true },
        { text: `你做得完全正确。`, isPositive: true },
        { text: `这个解决方案堪称完美。`, isPositive: true },
        { text: `你的善良深深地打动了我。`, isPositive: true },
        { text: `你总是这么乐于助人。`, isPositive: true },
        { text: `你的品味非常好。`, isPositive: true },
        { text: `我相信你一定能做到。`, isPositive: true },
        { text: `别担心，一切都会好起来的。`, isPositive: true },
        { text: `你的进步非常明显。`, isPositive: true },
        { text: `继续保持这个好势头。`, isPositive: true },
        { text: `我永远支持你的决定。`, isPositive: true },
        { text: `你已经做得很好了。`, isPositive: true },
        { text: `你的努力没有白费。`, isPositive: true },
        { text: `看到你恢复活力真是太好了。`, isPositive: true },
        { text: `这是一个非常有价值的尝试。`, isPositive: true },
        { text: `你的未来一片光明。`, isPositive: true },
        { text: `非常感谢你的及时帮助。`, isPositive: true },
        { text: `能认识你真是我的荣幸。`, isPositive: true },
        { text: `听到这个消息我太开心了。`, isPositive: true },
        { text: `跟你在一起的时光总是很愉快。`, isPositive: true },
        { text: `这个礼物我非常喜欢。`, isPositive: true },
        { text: `你今天看起来精神焕发。`, isPositive: true },
        { text: `这顿饭真是美味极了。`, isPositive: true },
        { text: `这里的风景美不胜收。`, isPositive: true },
        { text: `和你聊天总能让我学到新东西。`, isPositive: true },
        { text: `祝你今天过得愉快。`, isPositive: true },
        { text: `我完全同意你的看法。`, isPositive: true },
        { text: `这是一个明智的选择。`, isPositive: true },
        { text: `你的分析非常到位。`, isPositive: true },
        { text: `这确实是最好的办法。`, isPositive: true },
        { text: `你的慷慨让人感动。`, isPositive: true },
        { text: `你的诚实值得尊敬。`, isPositive: true },
        { text: `这场演讲非常精彩。`, isPositive: true },
        { text: `这个项目非常有意义。`, isPositive: true },
        { text: `你的孩子被教育得很有礼貌。`, isPositive: true },
        { text: `你的乐观精神很有感染力。`, isPositive: true },
        { text: `恭喜你获得了这个成就！`, isPositive: true },
        { text: `你完全配得上这份荣誉。`, isPositive: true },
        { text: `任务圆满完成。`, isPositive: true },
        { text: `真是个天大的好消息！`, isPositive: true },
        { text: `你们团队的协作非常高效。`, isPositive: true },
        { text: `你的设计既美观又实用。`, isPositive: true },
        { text: `你对细节的关注令人赞叹。`, isPositive: true },
        { text: `很高兴我们达成了共识。`, isPositive: true },
        { text: `你的到来让这里蓬荜生辉。`, isPositive: true },
        { text: `你总是能带来正能量。`, isPositive: true }
    ];

    // 状态追踪
    let lastClickedRound = 0;
    let isInCooldown = false;
    let pendingTimeout = null;

    // 生成随机延时
    function getRandomDelay() {
        return Math.floor(Math.random() * (MAX_DELAY - MIN_DELAY + 1)) + MIN_DELAY;
    }

    // 获取当前轮次
    function getCurrentRound() {
        const gameInfo = document.querySelector('.game-info');
        if (!gameInfo) return 0;

        const text = gameInfo.textContent;
        const match = text.match(/轮次:\s*(\d+)\s*\/\s*\d+/);
        if (match) {
            return parseInt(match[1], 10);
        }
        return 0;
    }

    // 检测是否在"正面嘛"游戏页面
    function isPositiveGame() {
        const h2 = document.querySelector('h2');
        const gameInfo = document.querySelector('.game-info');
        const positiveBtn = document.getElementById('positiveBtn');
        const negativeBtn = document.getElementById('negativeBtn');

        return h2 && h2.textContent.includes('正面嘛') &&
            gameInfo && positiveBtn && negativeBtn;
    }

    // 获取当前显示的语句文本
    function getCurrentStatementText() {
        const statementEl = document.querySelector('.statement-option');
        if (statementEl) {
            return statementEl.textContent.trim();
        }
        return null;
    }

    // 从题库中查找答案
    function findAnswerFromText(text) {
        if (!text) return null;

        // 精确匹配
        for (const stmt of STATEMENTS) {
            if (stmt.text === text) {
                return stmt.isPositive;
            }
        }

        // 模糊匹配（去除空格后比较）
        const normalizedText = text.replace(/\s+/g, '');
        for (const stmt of STATEMENTS) {
            if (stmt.text.replace(/\s+/g, '') === normalizedText) {
                return stmt.isPositive;
            }
        }

        // 包含匹配
        for (const stmt of STATEMENTS) {
            if (text.includes(stmt.text) || stmt.text.includes(text)) {
                return stmt.isPositive;
            }
        }

        console.log('[正面嘛作弊] 未找到匹配的语句:', text);
        return null;
    }

    // 自动作答
    function autoAnswer() {
        // 如果在冷却期，跳过
        if (isInCooldown) {
            console.log('[正面嘛作弊] 冷却期中，跳过');
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

        // 获取当前语句文本
        const statementText = getCurrentStatementText();
        if (!statementText) {
            console.log('[正面嘛作弊] 无法获取语句文本');
            return;
        }

        // 从题库查找答案
        const answer = findAnswerFromText(statementText);
        if (answer === null) {
            console.log('[正面嘛作弊] 未找到答案，跳过');
            return;
        }

        // 选择正确的按钮
        const correctBtn = answer ? document.getElementById('positiveBtn') : document.getElementById('negativeBtn');
        const answerText = answer ? '正面' : '负面';

        if (correctBtn) {
            const delay = getRandomDelay();
            console.log(`[正面嘛作弊] 轮次 ${currentRound}，语句: "${statementText}"，答案: ${answerText}，将在 ${delay}ms 后点击`);

            pendingTimeout = setTimeout(() => {
                // 再次检查是否仍然在游戏中且轮次未变
                if (!isPositiveGame()) {
                    console.log('[正面嘛作弊] 游戏已结束或页面已变化');
                    pendingTimeout = null;
                    return;
                }

                const nowRound = getCurrentRound();
                if (nowRound === currentRound && nowRound > lastClickedRound) {
                    correctBtn.click();
                    lastClickedRound = currentRound;
                    console.log(`[正面嘛作弊] 轮次 ${currentRound}，已点击 ${answerText}`);

                    // 进入冷却期
                    isInCooldown = true;
                    console.log(`[正面嘛作弊] 进入冷却期 ${COOLDOWN}ms`);

                    setTimeout(() => {
                        isInCooldown = false;
                        console.log('[正面嘛作弊] 冷却期结束');
                        // 冷却结束后主动检查一次
                        setTimeout(() => {
                            if (isPositiveGame()) {
                                autoAnswer();
                            }
                        }, 300);
                    }, COOLDOWN);
                }

                pendingTimeout = null;
            }, delay);
        }
    }

    // 防抖函数
    let debounceTimer = null;
    function debouncedCheck() {
        if (isInCooldown) return;

        if (debounceTimer) {
            clearTimeout(debounceTimer);
        }
        debounceTimer = setTimeout(() => {
            if (isPositiveGame()) {
                autoAnswer();
            }
        }, 300);
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

        console.log('[正面嘛作弊] 脚本已启动，题库共 ' + STATEMENTS.length + ' 条，正在监听页面变化...');
    }

    // 初始化
    function init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                startObserver();
                setTimeout(() => {
                    if (isPositiveGame()) {
                        autoAnswer();
                    }
                }, 1500);
            });
        } else {
            startObserver();
            setTimeout(() => {
                if (isPositiveGame()) {
                    autoAnswer();
                }
            }, 1500);
        }
    }

    init();
})();
