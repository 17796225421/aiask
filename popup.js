const GPT_URLS = [
    'https://chat.aite.lol/?model=o1-preview',
    'https://chat.aite.lol/?model=gpt-4o-canmore',
    'https://chat.aite.lol/?model=o1-mini',
];

const CLAUDE_URLS = [
    'https://claude.yoyogpt.online/',
    'https://claude.yoyogpt.online/',
];

const ALTERNATE_GPT_URLS = [
    'https://g.azs.ai/?model=o1-preview',
    'https://g.azs.ai/?model=gpt-4o-canmore',
    'https://g.azs.ai/?model=o1-mini',
];

const ALTERNATE_CLAUDE_URLS = [
    'https://c.azs.ai',
    'https://c.azs.ai',
];

// 初始化 CHAT_URLS 和 SEARCH_URLS
function updateUrls() {
    const isGptAlternate = localStorage.getItem('isGptAlternate') === 'true';
    const isClaudeAlternate = localStorage.getItem('isClaudeAlternate') === 'true';

    // 选择正确的 GPT URLs
    const currentGptUrls = isGptAlternate ? ALTERNATE_GPT_URLS : GPT_URLS;
    // 选择正确的 Claude URLs
    const currentClaudeUrls = isClaudeAlternate ? ALTERNATE_CLAUDE_URLS : CLAUDE_URLS;

    // 更新 CHAT_URLS
    CHAT_URLS = [
        ...currentClaudeUrls,
        ...currentGptUrls,
    ];

    // 更新 SEARCH_URLS
    SEARCH_URLS = [
        'https://www.perplexity.ai/collections/1-qafGU1j_SySk1dumrnEhfg',
        'https://www.perplexity.ai/collections/perplexity-It9ohRwgQN.muqHyiZr..w',
        ...currentClaudeUrls,
        ...currentGptUrls,
    ];
}

// 存储所有已创建窗口的ID
let createdWindowIds = new Set();
// 标记是否正在进行关闭操作
let isClosingWindows = false;

// 初始化页面
document.addEventListener('DOMContentLoaded', function() {
    initializeTextArea();
    initializeAskButton();
    initializeSearchButton();
    initializeSwitchButtons();

    // 初始化 localStorage 的默认值
    if (localStorage.getItem('isGptAlternate') === null) {
        localStorage.setItem('isGptAlternate', 'false');
    }
    if (localStorage.getItem('isClaudeAlternate') === null) {
        localStorage.setItem('isClaudeAlternate', 'false');
    }

    // 初始更新 URLs
    updateUrls();
});

function initializeSwitchButtons() {
    // 初始化切换 GPT 按钮
    document.getElementById('switchGpt').addEventListener('click', () => {
        const currentValue = localStorage.getItem('isGptAlternate') === 'true';
        localStorage.setItem('isGptAlternate', (!currentValue).toString());
        updateUrls();
    });

    // 初始化切换 Claude 按钮
    document.getElementById('switchClaude').addEventListener('click', () => {
        const currentValue = localStorage.getItem('isClaudeAlternate') === 'true';
        localStorage.setItem('isClaudeAlternate', (!currentValue).toString());
        updateUrls();
    });
}

function initializeTextArea() {
    const specificIssues = document.getElementById('specificIssues');

    // 恢复保存的数据
    const savedData = JSON.parse(localStorage.getItem('questionDetailData') || '{}');
    specificIssues.value = savedData.specificIssues || '';

    // 监听变化并保存
    specificIssues.addEventListener('input', () => {
        saveData();
    });

    // 监听粘贴事件
    specificIssues.addEventListener('paste', (event) => {
        // 在粘贴后延迟调整大小
        setTimeout(() => resizeTextArea(specificIssues), 0);
    });

    // 初始调整大小
    resizeTextArea(specificIssues);
}

function initializeAskButton() {
    document.getElementById('askButton').addEventListener('click', () => {
        askAllDataToClipboard(CHAT_URLS);
    });
}

function initializeSearchButton() {
    document.getElementById('searchButton').addEventListener('click', () => {
        askAllDataToClipboard(SEARCH_URLS);
    });
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

async function askAllDataToClipboard(urls) {
    try {
        const questionData = JSON.parse(localStorage.getItem('questionDetailData') || '{}');
        await navigator.clipboard.writeText(questionData.specificIssues || '');
        console.log('内容已复制到剪贴板');
        openAndArrangeWindows(urls);
    } catch (err) {
        console.error('复制失败:', err);
    }
}

function openAndArrangeWindows(urls) {
    createdWindowIds.clear();
    isClosingWindows = false;

    chrome.windows.getAll({ populate: true }, async function(existingWindows) {
        const closingPromises = existingWindows
            .filter(window => window.tabs.some(tab => urls.includes(tab.url)))
            .map(window => new Promise(resolve => {
                chrome.windows.remove(window.id, resolve);
            }));

        await Promise.all(closingPromises);
        createNewWindows(urls);
    });
}

function createNewWindows(urls) {
    const screenMetrics = calculateScreenMetrics(urls.length);

    urls.forEach((url, index) => {
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

function calculateScreenMetrics(urlCount) {
    const outerWidth = screen.width;
    const outerHeight = screen.height;
    const baseWidth = Math.round(outerWidth / urlCount);
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
}

function handleWindowRemoval(closedWindowId) {
    if (isClosingWindows || !createdWindowIds.has(closedWindowId)) {
        return;
    }

    isClosingWindows = true;
    closeAllRelatedWindows(closedWindowId);
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