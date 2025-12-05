// ========== V1: 颜色校准游戏 ==========
function loadColorCalibrationGame(container) {
    const game = {
        rounds: 5,
        currentRound: 0,
        results: [],
        targetColor: null,
        startTime: null,
        colorPicker: null
    };
    
    // HSV -> RGB（V=1的标准转换）
    function hsvToRgb(h, s, v) {
        const c = v * s;
        const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
        const m = v - c;
        let r, g, b;
        if (h < 60) [r, g, b] = [c, x, 0];
        else if (h < 120) [r, g, b] = [x, c, 0];
        else if (h < 180) [r, g, b] = [0, c, x];
        else if (h < 240) [r, g, b] = [0, x, c];
        else if (h < 300) [r, g, b] = [x, 0, c];
        else [r, g, b] = [c, 0, x];
        return {
            r: Math.round((r + m) * 255),
            g: Math.round((g + m) * 255),
            b: Math.round((b + m) * 255)
        };
    }

    // 只生成取色器可达的颜色（V=1，H∈[0,360)，S∈[0,1]）
    function randomReachableColor() {
        const h = Math.random() * 360;
        const s = Math.random();
        const v = 1;
        const rgb = hsvToRgb(h, s, v);
        return { r: rgb.r, g: rgb.g, b: rgb.b };
    }
    
    function nextRound() {
        if (game.currentRound >= game.rounds) {
            showResults();
            return;
        }
        
        game.currentRound++;
        game.targetColor = randomReachableColor();
        game.startTime = Date.now();
        
        container.innerHTML = `
            <div class="game-container">
                <h2>🎨 颜色校准</h2>
                <div class="game-info">
                    <p>轮次: ${game.currentRound}/${game.rounds}</p>
                    <p>请调整下方颜色选择器，使其与目标颜色匹配</p>
                </div>
                <div class="color-comparison">
                    <div class="target-color-section">
                        <div class="color-label">目标颜色</div>
                        <div class="color-display" style="background: ${colorToHex(game.targetColor)}"></div>
                    </div>
                </div>
                <div id="customColorPicker"></div>
                <button onclick="submitColorMatch()" style="margin-top: 20px;">提交匹配</button>
            </div>
        `;
        
        // 初始化自定义颜色选择器（只显示色圈，不显示预览和十六进制）
        const pickerContainer = container.querySelector('#customColorPicker');
        game.colorPicker = new CustomColorPicker(pickerContainer, {
            initialColor: '#808080',
            showPreview: false,
            showHex: false
        });
    }
    
    window.submitColorMatch = function() {
        const elapsed = (Date.now() - game.startTime) / 1000;
        const selectedColor = game.colorPicker.getColor();
        const selectedHex = selectedColor.hex;
        const selectedRgb = hexToColor(selectedHex);
        
        const distance = colorDistance(game.targetColor, selectedRgb);
        const maxDistance = Math.sqrt(255*255 + 255*255 + 255*255);
        const accuracy = 1 - (distance / maxDistance);
        
        // 调试日志：打印准确度计算详情
        console.log('=== 🎨 颜色校准 - 第' + game.currentRound + '轮 ===');
        console.log('目标颜色 RGB:', game.targetColor);
        console.log('目标颜色 HEX:', colorToHex(game.targetColor));
        console.log('选择颜色 RGB:', selectedRgb);
        console.log('选择颜色 HEX:', selectedHex);
        console.log('颜色距离:', distance.toFixed(2));
        console.log('最大距离:', maxDistance.toFixed(2));
        console.log('准确度:', (accuracy * 100).toFixed(2) + '%', '(' + accuracy.toFixed(6) + ')');
        console.log('用时:', elapsed.toFixed(2) + '秒');
        console.log('本轮得分 (前端预估):', (accuracy / (elapsed + 5)).toFixed(6));
        console.log('=====================================\n');
        
        game.results.push({
            target: colorToHex(game.targetColor),
            result: selectedHex,
            accuracy: accuracy,
            time: elapsed
        });
        
        nextRound();
    };
    
    function showResults() {
        const rawData = {rounds: game.results};

        // 先渲染占位结算，再异步请求后端填充
        container.innerHTML = `
            <div class="game-container">
                <div class="result-display">
                    <h3>🎉 游戏完成！</h3>
                    <h2>🎨 颜色校准</h2>
                    <p>总分: <span id="v1_color_score">计算中...</span></p>
                    <p>排名: <span id="v1_color_rank">计算中...</span></p>
                    <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; margin-top: 20px;">
                        <button onclick="backToDetail()">查看详情</button>
                        <button onclick="backToMain()">返回主页</button>
                    </div>
                </div>
            </div>
        `;

        submitGameResult('v1_color', rawData).then(result => {
            const scoreEl = container.querySelector('#v1_color_score');
            const rankEl = container.querySelector('#v1_color_rank');
            if (result && result.success) {
                if (scoreEl) scoreEl.textContent = result.score.toFixed(4);
                if (rankEl) rankEl.textContent = `超越了 ${result.percentile.toFixed(1)}% 的玩家`;
            } else {
                if (scoreEl) scoreEl.textContent = '提交失败';
                if (rankEl) rankEl.textContent = '提交失败';
            }
        }).catch(() => {
            const scoreEl = container.querySelector('#v1_color_score');
            const rankEl = container.querySelector('#v1_color_rank');
            if (scoreEl) scoreEl.textContent = '提交失败';
            if (rankEl) rankEl.textContent = '提交失败';
        });
    }
    
    nextRound();
}

// Ensure global access when scripts are wrapped/obfuscated
if (typeof window !== 'undefined' && typeof window.loadColorCalibrationGame !== 'function') {
    window.loadColorCalibrationGame = loadColorCalibrationGame;
}