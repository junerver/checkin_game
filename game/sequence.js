// ========== A2: 01序列游戏 ==========
function loadSequenceGame(container) {
    const game = {
        sequence: [],
        currentIndex: 0,
        correctCount: 0,
        startTime: null,
        scrollInterval: null,
        scrollOffset: 0,
        baseSpeed: 0, // 基础速度（字符宽度/1.5）
        scrollSpeed: 0, // 当前实际速度
        charWidth: 0, // 实际字符宽度
        keyboardHandler: null,
        renderedUpTo: 0, // 已渲染到第几个字符
        started: false
    };

    function start() {
        // 反作弊：启动前端轻量遥测（失焦/按键/设备信息）
        if (window.startAntiCheatTelemetry) {
            try { window.startAntiCheatTelemetry(); } catch { }
        }
        // 生成1000位序列
        for (let i = 0; i < 1000; i++) {
            game.sequence.push(Math.random() > 0.5 ? 1 : 0);
        }

        game.startTime = Date.now();

        container.innerHTML = `
            <div class="game-container">
                <h2>⚡ 01序列</h2>
                <div class="game-info">
                    <p>连续正确: <span id="seqProgress">0</span></p>
                    <p>速度: <span id="speedDisplay">0</span> px/秒</p>
                    <p style="font-size: 0.9em; color: #666;">提示: 使用键盘 0/1 键或点击按钮输入</p>
                </div>
                <div class="sequence-viewport" style="position: relative; width: 100%; height: 120px; overflow: hidden; border: 2px solid #333; background: #f5f5f5; margin: 20px 0;">
                    <div id="seqDisplay" style="position: absolute; left: 0; top: 50%; white-space: nowrap; font-size: 48px; font-family: monospace; font-weight: bold; will-change: transform;"></div>
                    <div style="position: absolute; left: 20px; top: 0; bottom: 0; width: 3px; background: red; z-index: 10;"></div>
                </div>
                <div class="sequence-controls">
                    <button id="btn0" onclick="inputBit(0)">按 0</button>
                    <button id="btn1" onclick="inputBit(1)" style="margin-left: 10px;">按 1</button>
                </div>
            </div>
        `;

        updateDisplay();

        // 测量实际字符宽度并设置初始速度
        setTimeout(() => {
            const displayEl = document.getElementById('seqDisplay');
            if (displayEl && displayEl.firstChild) {
                // 测量第一个字符的实际宽度
                const tempSpan = document.createElement('span');
                tempSpan.textContent = '0';
                tempSpan.style.cssText = displayEl.style.cssText;
                displayEl.appendChild(tempSpan);
                game.charWidth = tempSpan.offsetWidth;
                displayEl.removeChild(tempSpan);

                // 设置基础速度为 字宽/1.5
                game.baseSpeed = game.charWidth / 1.5;
                game.scrollSpeed = game.baseSpeed;
                document.getElementById('speedDisplay').textContent = game.scrollSpeed.toFixed(1);

                console.log(`字符宽度: ${game.charWidth}px, 基础速度: ${game.baseSpeed.toFixed(1)}px/秒`);
            }
        }, 100);

        setupKeyboard();

        // 滚动循环延后到首次按键后再启动
        game.scrollInterval = null;
    }

    function setupKeyboard() {
        // 移除旧的事件监听器
        if (game.keyboardHandler) {
            document.removeEventListener('keydown', game.keyboardHandler);
        }

        // 创建新的事件监听器
        game.keyboardHandler = function (e) {
            if (e.key === '0') {
                e.preventDefault();
                window.inputBit(0);
            } else if (e.key === '1') {
                e.preventDefault();
                window.inputBit(1);
            }
        };

        document.addEventListener('keydown', game.keyboardHandler);
    }

    function scrollSequence() {
        // 增加滚动偏移量
        const deltaTime = 16 / 1000; // 16ms转为秒
        game.scrollOffset += game.scrollSpeed * deltaTime;

        // 检查当前位是否滚出视口左边缘（超过红线位置20px）
        const currentBitOffset = game.currentIndex * game.charWidth; // 使用实际字符宽度
        if (game.scrollOffset > currentBitOffset + 20) {
            endGame();
            return;
        }

        // 只更新位置，不重新渲染HTML
        const displayEl = document.getElementById('seqDisplay');
        if (displayEl) {
            displayEl.style.transform = `translateX(${20 - game.scrollOffset}px) translateY(-50%)`;
        }
    }

    function updateDisplay() {
        const displayEl = document.getElementById('seqDisplay');
        if (!displayEl) return;

        // 初始只渲染前100个字符
        renderBatch(0, 100);

        // 使用 transform 而不是 left，避免重新布局
        displayEl.style.transform = `translateX(${20 - game.scrollOffset}px) translateY(-50%)`;
    }

    function renderBatch(startIndex, count) {
        const displayEl = document.getElementById('seqDisplay');
        if (!displayEl) return;

        const endIndex = Math.min(startIndex + count, game.sequence.length);
        let html = displayEl.innerHTML; // 保留已有内容

        for (let i = startIndex; i < endIndex; i++) {
            const style = i === 0 ? 'color: #ff4444; text-shadow: 0 0 10px rgba(255,68,68,0.8);' : '';
            html += `<span id="bit-${i}" style="${style}">${game.sequence[i]}</span>`;
        }

        displayEl.innerHTML = html;
        game.renderedUpTo = endIndex;
    }

    function checkAndRenderMore() {
        // 每当进度接近已渲染的末尾时（比如还剩20个），渲染下一批
        if (game.currentIndex >= game.renderedUpTo - 20 && game.renderedUpTo < game.sequence.length) {
            renderBatch(game.renderedUpTo, 100);
        }
    }

    window.inputBit = function (bit) {
        // 首次按键后才启动滚动
        if (!game.started) {
            game.started = true;
            if (!game.scrollInterval) {
                game.scrollInterval = setInterval(scrollSequence, 16);
            }
        }

        const expected = game.sequence[game.currentIndex];

        if (bit === expected) {
            // 只隐藏当前字符，不重新渲染整个序列
            const currentBitEl = document.getElementById(`bit-${game.currentIndex}`);
            if (currentBitEl) {
                currentBitEl.style.visibility = 'hidden';
            }

            game.correctCount++;
            game.currentIndex++;
            document.getElementById('seqProgress').textContent = game.correctCount;

            // 检查是否需要渲染更多字符
            checkAndRenderMore();

            // 高亮新的当前位
            const nextBitEl = document.getElementById(`bit-${game.currentIndex}`);
            if (nextBitEl) {
                nextBitEl.style.color = '#ff4444';
                nextBitEl.style.textShadow = '0 0 10px rgba(255,68,68,0.8)';
            }

            // 平方项加速：速度 = 基础速度 × (1 + 0.001 × correctCount²)
            // 例如：0个时×1, 10个时×1.1, 20个时×1.4, 30个时×1.9, 50个时×3.5
            const speedMultiplier = 1 + 0.001 * game.correctCount * game.correctCount;
            game.scrollSpeed = game.baseSpeed * speedMultiplier;
            document.getElementById('speedDisplay').textContent = game.scrollSpeed.toFixed(1);

            // 检查是否完成所有序列
            if (game.currentIndex >= game.sequence.length) {
                endGame();
                return;
            }
        } else {
            endGame();
        }
    };

    function endGame() {
        // 清理定时器和事件监听
        if (game.scrollInterval) {
            clearInterval(game.scrollInterval);
            game.scrollInterval = null;
        }
        if (game.keyboardHandler) {
            document.removeEventListener('keydown', game.keyboardHandler);
            game.keyboardHandler = null;
        }

        // 反作弊：结束并保留一次遥测快照
        if (window.stopAntiCheatTelemetry) {
            try { window.stopAntiCheatTelemetry(); } catch { }
        }
        const rawData = {
            correct_count: game.correctCount
        };

        // 先渲染占位结算，再异步请求后端填充
        container.innerHTML = `
            <div class="game-container">
                <div class="result-display">
                    <h3>🎉 游戏完成！</h3>
                    <h2>⚡ 01序列</h2>
                    <p>成功序列长度: ${game.correctCount}</p>
                    <p>得分: <span id="a2_sequence_score">计算中...</span></p>
                    <p>排名: <span id="a2_sequence_rank">计算中...</span></p>
                    <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; margin-top: 20px;">
                        <button onclick="backToDetail()">查看详情</button>
                        <button onclick="backToMain()">返回主页</button>
                    </div>
                </div>
            </div>
        `;

        submitGameResult('a2_sequence', rawData).then(result => {
            const scoreEl = container.querySelector('#a2_sequence_score');
            const rankEl = container.querySelector('#a2_sequence_rank');
            if (result && result.success) {
                if (scoreEl) scoreEl.textContent = result.score.toFixed(0);
                if (rankEl) rankEl.textContent = `超越了 ${result.percentile.toFixed(1)}% 的玩家`;
            } else {
                if (scoreEl) scoreEl.textContent = '提交失败';
                if (rankEl) rankEl.textContent = '提交失败';
            }
        }).catch(() => {
            const scoreEl = container.querySelector('#a2_sequence_score');
            const rankEl = container.querySelector('#a2_sequence_rank');
            if (scoreEl) scoreEl.textContent = '提交失败';
            if (rankEl) rankEl.textContent = '提交失败';
        });
    }

    start();
}

// Ensure global access when scripts are wrapped/obfuscated
if (typeof window !== 'undefined' && typeof window.loadSequenceGame !== 'function') {
    window.loadSequenceGame = loadSequenceGame;
}