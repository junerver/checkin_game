

// ========== K1: 找65游戏 ==========
function loadFind65Game(container) {
    const MAX_ROUNDS = 20;

    const game = {
        roundNumber: 0,
        correctRounds: 0,
        keyboardHandler: null,
        currentCorrectIndex: null,
        roundStartTime: null,
        totalScore: 0,
        // 反作弊：可复算原始数据
        rounds: [],
        game_start_ts: Date.now(),
    };

    // 启动前端轻量遥测（失焦/按键/设备信息）
    if (window.startAntiCheatTelemetry) {
        try { window.startAntiCheatTelemetry(); } catch { }
    }

    function nextRound() {
        game.roundNumber++;

        // 达到轮次上限则结束（最多20轮）
        if (game.roundNumber > MAX_ROUNDS) {
            showResults();
            return;
        }

        // 随机选择一个真65发言
        const real65 =
            real65Statements[Math.floor(Math.random() * real65Statements.length)];

        // 生成3个非65风格的发言
        const fake65Options = generateFake65Statements(3);

        // 组合成4个选项并打乱
        const allOptions = [real65, ...fake65Options];
        shuffleArray(allOptions);

        // 记录正确答案的索引
        game.currentCorrectIndex = allOptions.indexOf(real65);

        // 记录本轮开始时间
        game.roundStartTime = Date.now();

        // 生成选项HTML
        let optionsHTML = "";
        const letters = ["A", "B", "C", "D"];
        allOptions.forEach((stmt, i) => {
            optionsHTML += `
                <div class="statement-option" onclick="selectOption(${i})" data-option="${i}">
                    <span class="option-letter">${letters[i]}</span>
                    <span class="option-text">${stmt}</span>
                </div>
            `;
        });

        container.innerHTML = `
            <div class="game-container">
                <h2>🎯 找65</h2>
                <div class="game-info">
                    <p>轮次: ${game.roundNumber} / ${MAX_ROUNDS}</p>
                    <p>连续正确: ${game.correctRounds}</p>
                    <p>请选择真正的65风格发言</p>
                    <p style="font-size: 0.9em; color: #666;">提示: 使用 A/B/C/D 键快速选择</p>
                </div>
                <div class="statement-options find65-options">
                    ${optionsHTML}
                </div>
            </div>
        `;

        // 设置键盘事件
        setupKeyboard();
    }

    function generateFake65Statements(count) {
        // 非65风格发言（包含其他用户的发言风格）


        const results = [];
        const used = new Set();

        while (results.length < count) {
            const idx = Math.floor(Math.random() * fakeStatements.length);
            if (!used.has(idx)) {
                used.add(idx);
                results.push(fakeStatements[idx]);
            }
        }

        return results;
    }

    function setupKeyboard() {
        // 移除旧的事件监听器
        if (game.keyboardHandler) {
            document.removeEventListener("keydown", game.keyboardHandler);
        }

        // 创建新的事件监听器
        game.keyboardHandler = function (e) {
            const key = e.key.toLowerCase();
            const keyMap = {
                a: 0,
                b: 1,
                c: 2,
                d: 3,
            };

            if (key in keyMap) {
                e.preventDefault();
                window.selectOption(keyMap[key]);
            }
        };

        document.addEventListener("keydown", game.keyboardHandler);
    }

    window.selectOption = function (selected) {
        // 移除键盘监听
        if (game.keyboardHandler) {
            document.removeEventListener("keydown", game.keyboardHandler);
            game.keyboardHandler = null;
        }

        const now = Date.now();
        const isCorrect = selected === game.currentCorrectIndex;

        // 记录本轮原始数据（用于服务端重算）
        game.rounds.push({
            start_ts: game.roundStartTime,
            end_ts: now,
            chosen_index: selected,
            is_correct: isCorrect
        });

        // 计算本轮用时（秒）与前端展示分（仅展示，后端将统一重算）
        const roundTime = (now - game.roundStartTime) / 1000;
        const roundScore = 1 / (3 + roundTime);
        if (isCorrect) {
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
            document.removeEventListener("keydown", game.keyboardHandler);
            game.keyboardHandler = null;
        }

        // 结束并保留一次遥测快照
        if (window.stopAntiCheatTelemetry) {
            try { window.stopAntiCheatTelemetry(); } catch { }
        }

        // 仅提交可复算原始数据（服务端统一重算）
        const rawData = {
            game_start_ts: game.game_start_ts,
            rounds: game.rounds
        };

        // 先渲染占位结算，再异步请求后端填充
        container.innerHTML = `
      <div class="game-container">
        <div class="result-display">
          <h3>🎉 游戏完成！</h3>
          <h2>🎯 找65</h2>
          <p>连续正确轮数: ${game.correctRounds}</p>
          <p>本局总轮数: ${game.roundNumber}（上限 ${MAX_ROUNDS}）</p>
          <p>总分(前端展示): ${game.totalScore.toFixed(2)}</p>
          <p>排名: <span id="k1_find65_rank">计算中...</span></p>
          <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; margin-top: 20px;">
            <button onclick="backToDetail()">查看详情</button>
            <button onclick="backToMain()">返回主页</button>
          </div>
        </div>
      </div>
    `;

        submitGameResult("k1_find65", rawData)
            .then((result) => {
                const rankEl = container.querySelector('#k1_find65_rank');
                if (result && result.success) {
                    if (rankEl) rankEl.textContent = `超越了 ${result.percentile.toFixed(1)}% 的玩家`;
                } else {
                    if (rankEl) rankEl.textContent = '提交失败';
                }
            })
            .catch(() => {
                const rankEl = container.querySelector('#k1_find65_rank');
                if (rankEl) rankEl.textContent = '提交失败';
            });
    }

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    nextRound();
}

// Ensure global access when scripts are wrapped/obfuscated
if (typeof window !== 'undefined' && typeof window.loadFind65Game !== 'function') {
    window.loadFind65Game = loadFind65Game;
}
