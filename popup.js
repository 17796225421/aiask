const CHAT_URLS = [
    'https://claude.yoyogpt.online/',
    'https://chat.aite.lol/?model=o1-preview',
    'https://chat.aite.lol/?model=gpt-4o-canmore',
    'https://chat.aite.lol/?model=o1-mini',
    'https://claude.yoyogpt.online/',
    'https://www.perplexity.ai/collections/1-qafGU1j_SySk1dumrnEhfg',
    'https://www.perplexity.ai/collections/perplexity-It9ohRwgQN.muqHyiZr..w',
];

// https://chat.aite.lol
// https://www.gptai.cc

// https://cn.claudesvip.top
// https://claude.yoyogpt.online

// 存储所有已创建窗口的ID
let createdWindowIds = new Set();
// 标记是否正在进行关闭操作
let isClosingWindows = false;

// 初始化页面
document.addEventListener('DOMContentLoaded', function() {
    initializeTextArea();
    initializeAskButton();
});

function initializeTextArea() {
    const specificIssues = document.getElementById('specificIssues');

    // 恢复保存的数据
    const savedData = JSON.parse(localStorage.getItem('questionDetailData') || '{}');
    specificIssues.value = savedData.specificIssues || '';

    // 监听变化并保存
    specificIssues.addEventListener('input', saveData);

    // 初始调整大小
    resizeTextArea(specificIssues);
}

function initializeAskButton() {
    document.getElementById('askButton').addEventListener('click', askAllDataToClipboard);
}

function resizeTextArea(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
}

function saveData() {
    const dataToSave = {
        specificIssues: document.getElementById('specificIssues').value
    };
    localStorage.setItem('questionDetailData', JSON.stringify(dataToSave));
}

async function askAllDataToClipboard() {
    try {
        const questionData = JSON.parse(localStorage.getItem('questionDetailData') || '{}');
        await navigator.clipboard.writeText(questionData.specificIssues || '');
        console.log('内容已复制到剪贴板');
        openAndArrangeWindows();
    } catch (err) {
        console.error('复制失败:', err);
    }
}

function openAndArrangeWindows() {
    // 重置状态
    createdWindowIds.clear();
    isClosingWindows = false;

    // 首先关闭所有现有的相关窗口
    chrome.windows.getAll({ populate: true }, async function(existingWindows) {
        const closingPromises = existingWindows
            .filter(window => window.tabs.some(tab => CHAT_URLS.includes(tab.url)))
            .map(window => new Promise(resolve => {
                chrome.windows.remove(window.id, resolve);
            }));

        await Promise.all(closingPromises);
        createNewWindows();
    });
}

function createNewWindows() {
    const screenMetrics = calculateScreenMetrics();

    CHAT_URLS.forEach((url, index) => {
        const position = calculateWindowPosition(index, screenMetrics);
        chrome.windows.create({
            url: url,
            type: 'popup',
            ...position
        }, function(window) {
            if (window) {
                createdWindowIds.add(window.id);
                setupWindowListeners(window.id);
            }
        });
    });
}

function calculateScreenMetrics() {
    const outerWidth = screen.width;
    const outerHeight = screen.height;
    const baseWidth = Math.round(outerWidth / CHAT_URLS.length);
    const extraWidth = Math.round(baseWidth * 0.3);

    return {
        windowWidth: baseWidth + extraWidth,
        overlap: extraWidth,
        height: outerHeight
    };
}

function calculateWindowPosition(index, metrics) {
    return {
        left: index * (metrics.windowWidth - metrics.overlap),
        top: 0,
        width: metrics.windowWidth,
        height: metrics.height
    };
}

function setupWindowListeners(windowId) {
    // 监听窗口状态变化
    chrome.windows.onRemoved.addListener(handleWindowRemoval);
    chrome.windows.onFocusChanged.addListener(handleWindowFocus);
}

function handleWindowRemoval(closedWindowId) {
    if (isClosingWindows || !createdWindowIds.has(closedWindowId)) {
        return;
    }

    isClosingWindows = true;
    closeAllRelatedWindows(closedWindowId);
}

function handleWindowFocus(focusedWindowId) {
    if (focusedWindowId === chrome.windows.WINDOW_ID_NONE) {
        return;
    }

    chrome.windows.get(focusedWindowId, { populate: true }, function(window) {
        if (!window || !window.tabs.some(tab => CHAT_URLS.includes(tab.url))) {
            return;
        }

        // 如果焦点窗口是我们的窗口之一，确保它保持在最前面
        chrome.windows.update(focusedWindowId, { focused: true });
    });
}

async function closeAllRelatedWindows(excludeWindowId) {
    const allWindows = await new Promise(resolve => {
        chrome.windows.getAll({ populate: true }, resolve);
    });

    const closingPromises = Array.from(createdWindowIds)
        .filter(id => id !== excludeWindowId)
        .map(id => new Promise(resolve => {
            chrome.windows.remove(id, resolve);
        }));

    await Promise.all(closingPromises);

    // 重置状态
    createdWindowIds.clear();
    isClosingWindows = false;
}