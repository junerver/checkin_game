// ==UserScript==
// @name         找65自动答题
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  自动完成找65游戏
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    function startAutoFind65() {
        function findCorrect() {
            const options = document.querySelectorAll('.statement-option .option-text');
            for (let i = 0; i < options.length; i++) {
                const text = options[i].textContent;
                if (typeof real65Statements !== 'undefined' && real65Statements.includes(text)) {
                    return i;
                }
            }
            return -1;
        }

        const timer = setInterval(() => {
            // 检查游戏是否结束
            if (document.querySelector('.result-display') || !document.querySelector('.statement-option')) {
                clearInterval(timer);
                console.log('✅ 找65完成！');
                return;
            }

            const correct = findCorrect();
            if (correct >= 0) {
                window.selectOption(correct);
            }
        }, 500);

        console.log('🎯 找65自动答题已启动 (500ms/题)');
    }

    // 检测游戏页面
    const observer = new MutationObserver(() => {
        if (document.querySelector('.find65-options') && !window._find65Started) {
            window._find65Started = true;
            setTimeout(startAutoFind65, 500);
        }
        // 游戏结束后重置标记
        if (document.querySelector('.result-display')) {
            window._find65Started = false;
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });
})();
