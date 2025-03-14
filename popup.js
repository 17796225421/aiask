const GPT_URLS = [
    'https://chatshare.xyz/?model=o1-pro',
    'https://chatshare.xyz/?model=o1-pro',
    'https://chatshare.xyz/?model=o1-pro',
    // 'https://chatshare.xyz/?model=o1-pro',
    // 'https://chatshare.xyz/?model=o3-mini-high',
    'https://chatshare.xyz/?model=o3-mini-high',
    'https://chatshare.xyz/?model=gpt-4-5',
    // 'https://grok.com/',
    // 'https://console.volcengine.com/ark/region:ark+cn-beijing/experience/chat',
];

const CLAUDE_URLS = [
    // 'https://kelaode.yoyogpt.online/',
    // 'https://kelaode.yoyogpt.online/',
    'https://claude.ai/new',
];

const GEMINI_URLS = [
    // 'https://gemini.google.com/app',
    // 'https://aistudio.google.com/app/prompts/new_chat?model=gemini-exp-1206',
    // 'https://gemini.google.com/u/1/app/72d311613c6d838e',
    // 'https://gemini.google.com/u/1/app/3537f8022957553c',
];

const ALTERNATE_GPT_URLS = [
    'https://chat.rawchat.cn/?model=o1-pro',
    'https://chat.rawchat.cn/?model=o1-pro',
    'https://chat.rawchat.cn/?model=o1-pro',
    'https://chat.rawchat.cn/?model=o1-pro',
];

const ALTERNATE_CLAUDE_URLS = [
    'https://c.azs.ai',
    'https://c.azs.ai',
];

let currentTabId = 0;
let questionDetailDataMap = {};

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
        ...GEMINI_URLS,
    ];

    // 更新 SEARCH_URLS
    SEARCH_URLS = [
        'https://www.perplexity.ai/collections/1-qafGU1j_SySk1dumrnEhfg',
        'https://www.perplexity.ai/collections/perplexity-It9ohRwgQN.muqHyiZr..w',
        'https://gemini.google.com/immersive/99fe2be3fb5bd218/955d82adf931cde5',
        ...currentClaudeUrls,
        ...currentGptUrls,
        ...GEMINI_URLS,
    ];
}

// 存储所有已创建窗口的ID
let createdWindowIds = new Set();
// 标记是否正在进行关闭操作
let isClosingWindows = false;

// 初始化页面
document.addEventListener('DOMContentLoaded', function() {
    initializeTabSystem();
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

    // 恢复当前标签页的数据
    specificIssues.value = questionDetailDataMap[currentTabId]?.specificIssues || '';

    // 监听变化并保存
    specificIssues.addEventListener('input', () => {
        saveData();
    });

    // 监听粘贴事件
    specificIssues.addEventListener('paste', (event) => {
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

function initializeTabSystem() {
    // 初始化 tabId
    let savedTabId = localStorage.getItem('tabId');
    if (savedTabId === null) {
        localStorage.setItem('tabId', '0');
    }

    // 初始化 questionDetailDataMap
    const savedMap = localStorage.getItem('questionDetailDataMap');
    if (savedMap) {
        questionDetailDataMap = JSON.parse(savedMap);
    }

    // 如果没有任何标签页，创建第一个
    if (Object.keys(questionDetailDataMap).length === 0) {
        const initialTabId = localStorage.getItem('tabId');
        questionDetailDataMap[initialTabId] = {
            specificIssues: ''
        };
        saveQuestionDetailDataMap();
    }

    // 恢复上次活动的标签页
    setCurrentTabId(localStorage.getItem('lastActiveTabId') || '0');

    // 渲染标签页
    renderTabs();

    // 设置新增标签页的点击事件
    document.getElementById('addTab').addEventListener('click', addNewTab);

    // 恢复输入框内容
    const textarea = document.getElementById('specificIssues');
    textarea.value = questionDetailDataMap[currentTabId]?.specificIssues || '';
    resizeTextArea(textarea);
}

function renderTabs() {
    const tabContainer = document.getElementById('tabContainer');
    tabContainer.innerHTML = '';

    Object.keys(questionDetailDataMap).forEach(tabId => {
        const tab = document.createElement('div');
        tab.className = `tab ${tabId === currentTabId.toString() ? 'active' : ''}`;

        // 创建标签文本容器
        const tabText = document.createElement('span');
        tabText.textContent = `聊天 ${parseInt(tabId) + 1}`;
        tab.appendChild(tabText);

        // 创建关闭按钮
        const closeButton = document.createElement('span');
        closeButton.className = 'tab-close';
        closeButton.innerHTML = '×';
        closeButton.addEventListener('click', (e) => {
            e.stopPropagation(); // 阻止事件冒泡
            deleteTab(tabId);
        });
        tab.appendChild(closeButton);

        tab.dataset.tabId = tabId;
        tab.addEventListener('click', () => switchTab(tabId));
        tabContainer.appendChild(tab);
    });
}


function switchTab(tabId) {
    setCurrentTabId(tabId);
    const textarea = document.getElementById('specificIssues');
    textarea.value = questionDetailDataMap[tabId].specificIssues || '';
    renderTabs();
    resizeTextArea(textarea);
}
function addNewTab() {
    // 获取所有已使用的 tabId
    const usedTabIds = new Set(Object.keys(questionDetailDataMap).map(id => parseInt(id)));

    // 在 0-4 范围内找到第一个未使用的 tabId
    let newTabId = 0;
    while (newTabId < 5) {
        if (!usedTabIds.has(newTabId)) {
            break;
        }
        newTabId++;
    }

    // 如果所有 ID 都被使用了，返回
    if (newTabId >= 5) {
        alert('已达到最大标签页数量限制(5)');
        return;
    }

    // 保存新的 tabId
    localStorage.setItem('tabId', newTabId.toString());

    // 初始化新标签页的数据
    questionDetailDataMap[newTabId] = {
        specificIssues: ''
    };

    // 切换到新标签页
    setCurrentTabId(newTabId);

    saveQuestionDetailDataMap();
    renderTabs();

    // 清空输入框
    const textarea = document.getElementById('specificIssues');
    textarea.value = '';
    resizeTextArea(textarea);
}

function saveQuestionDetailDataMap() {
    localStorage.setItem('questionDetailDataMap', JSON.stringify(questionDetailDataMap));
}

function saveData() {
    questionDetailDataMap[currentTabId] = {
        specificIssues: document.getElementById('specificIssues').value
    };
    saveQuestionDetailDataMap();
}

function deleteTab(tabId) {
    // 如果只剩一个标签页，不允许删除
    if (Object.keys(questionDetailDataMap).length <= 1) {
        return;
    }

    // 删除数据
    delete questionDetailDataMap[tabId];
    saveQuestionDetailDataMap();

    // 如果删除的是当前标签页，切换到其他标签页
    if (tabId === currentTabId.toString()) {
        const remainingTabs = Object.keys(questionDetailDataMap);
        setCurrentTabId(remainingTabs[0]);

        const textarea = document.getElementById('specificIssues');
        textarea.value = questionDetailDataMap[currentTabId].specificIssues || '';
        resizeTextArea(textarea);
    }

    // 重新渲染标签页
    renderTabs();
}


async function askAllDataToClipboard(urls) {
    try {
        const currentData = questionDetailDataMap[currentTabId] || {};
        const textToCopy = (currentData.specificIssues || '') + '（说中文）';
        await navigator.clipboard.writeText(textToCopy);
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

function setCurrentTabId(tabId) {
    currentTabId = tabId.toString();
    localStorage.setItem('lastActiveTabId', currentTabId);
}