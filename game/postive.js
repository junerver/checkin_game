// ========== K2: 正面嘛游戏 ==========
function loadPositiveGame(container) {
    const MAX_ROUNDS = 20; // 限制最多20轮
    // 启动前端轻量遥测（失焦/按键/设备信息）
    if (window.startAntiCheatTelemetry) {
        try { window.startAntiCheatTelemetry(); } catch { }
    }
    const game = {
        roundNumber: 0,
        correctRounds: 0,
        keyboardHandler: null,
        currentStatement: null,
        roundStartTime: null,
        totalScore: 0
    };

    // 100条话语 - 50条负面（阴阳怪气）+ 50条正面
    const statements = [
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

    function nextRound() {
        game.roundNumber++;

        // 达到轮次上限则结束（最多20轮）
        if (game.roundNumber > MAX_ROUNDS) {
            showResults();
            return;
        }

        // 完全随机选择
        const selected = statements[Math.floor(Math.random() * statements.length)];

        // 保存当前语句到game对象
        game.currentStatement = selected;

        // 记录本轮开始时间
        game.roundStartTime = Date.now();

        container.innerHTML = `
            <div class="game-container">
                <h2>😊 正面嘛</h2>
                <div class="game-info">
                    <p>轮次: ${game.roundNumber} / ${MAX_ROUNDS}</p>
                    <p>连续正确: ${game.correctRounds}</p>
                    <p>请判断这句话是正面还是负面</p>
                    <p style="font-size: 0.9em; color: #666;">提示: 使用 ← 键选择"正面"，→ 键选择"负面"</p>
                </div>
                <div class="statement-options">
                    <div class="statement-option" style="font-size: 1.5em; text-align: center; padding: 40px;">
                        ${selected.text}
                    </div>
                </div>
                <div style="text-align: center; margin-top: 30px;">
                    <button id="positiveBtn" onclick="judgeStatement(true)">← 正面</button>
                    <button id="negativeBtn" onclick="judgeStatement(false)" style="margin-left: 20px;">负面 →</button>
                </div>
            </div>
        `;

        // 设置键盘事件
        setupKeyboard();
    }

    function setupKeyboard() {
        // 移除旧的事件监听器
        if (game.keyboardHandler) {
            document.removeEventListener('keydown', game.keyboardHandler);
        }

        // 创建新的事件监听器
        game.keyboardHandler = function (e) {
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                window.judgeStatement(true);
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                window.judgeStatement(false);
            }
        };

        document.addEventListener('keydown', game.keyboardHandler);
    }

    window.judgeStatement = function (userSaysPositive) {
        // 移除键盘监听
        if (game.keyboardHandler) {
            document.removeEventListener('keydown', game.keyboardHandler);
            game.keyboardHandler = null;
        }

        // 使用保存的当前语句
        if (!game.currentStatement) {
            console.error('无法找到当前语句');
            return;
        }

        const correct = userSaysPositive === game.currentStatement.isPositive;

        if (correct) {
            // 计算本轮用时（秒）
            const roundTime = (Date.now() - game.roundStartTime) / 1000;
            // 本轮得分 = 1 / (3 + 用时秒数)
            const roundScore = 1 / (3 + roundTime);
            game.totalScore += roundScore;

            game.correctRounds++;
            // 若已达到上限，直接结算
            if (game.roundNumber >= MAX_ROUNDS) {
                showResults();
            } else {
                nextRound();
            }
        } else {
            showResults();
        }
    };

    function showResults() {
        // 移除键盘监听
        if (game.keyboardHandler) {
            document.removeEventListener('keydown', game.keyboardHandler);
            game.keyboardHandler = null;
        }
        // 结束并保留一次遥测快照
        if (window.stopAntiCheatTelemetry) {
            try { window.stopAntiCheatTelemetry(); } catch { }
        }

        const rawData = {
            correct_rounds: game.correctRounds,
            total_score: game.totalScore
        };

        // 先渲染占位结算，再异步请求后端填充
        container.innerHTML = `
            <div class="game-container">
                <div class="result-display">
                    <h3>🎉 游戏完成！</h3>
                    <h2>😊 正面嘛</h2>
                    <p>连续正确轮数: ${game.correctRounds}</p>
                    <p>本局总轮数: ${game.roundNumber}（上限 ${MAX_ROUNDS}）</p>
                    <p>总分: ${game.totalScore.toFixed(2)}</p>
                    <p>排名: <span id="k2_positive_rank">计算中...</span></p>
                    <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; margin-top: 20px;">
                        <button onclick="backToDetail()">查看详情</button>
                        <button onclick="backToMain()">返回主页</button>
                    </div>
                </div>
            </div>
        `;

        submitGameResult('k2_positive', rawData).then(result => {
            const rankEl = container.querySelector('#k2_positive_rank');
            if (result && result.success) {
                if (rankEl) rankEl.textContent = `超越了 ${result.percentile.toFixed(1)}% 的玩家`;
            } else {
                if (rankEl) rankEl.textContent = '提交失败';
            }
        }).catch(() => {
            const rankEl = container.querySelector('#k2_positive_rank');
            if (rankEl) rankEl.textContent = '提交失败';
        });
    }

    nextRound();
}

// Ensure global access when scripts are wrapped/obfuscated
if (typeof window !== 'undefined' && typeof window.loadPositiveGame !== 'function') {
    window.loadPositiveGame = loadPositiveGame;
}

// Ensure global access when scripts are wrapped/obfuscated
if (typeof window !== 'undefined' && typeof window.loadPositiveGame !== 'function') {
    window.loadPositiveGame = loadPositiveGame;
}

// Ensure global access when scripts are wrapped/obfuscated
if (typeof window !== 'undefined' && typeof window.loadPositiveGame !== 'function') {
    window.loadPositiveGame = loadPositiveGame;
}