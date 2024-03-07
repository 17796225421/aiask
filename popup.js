// 当页面加载完毕时，从 localStorage 中获取数据并显示在输入框中
document.addEventListener('DOMContentLoaded', function () {
    let specificIssues = document.getElementById('specificIssues');

    // 动态调整输入框大小
    [specificIssues].forEach(textarea => {
        textarea.addEventListener('focus', () => resizeTextArea(textarea));
        textarea.addEventListener('input', () => resizeTextArea(textarea));
    });

    // 从 localStorage 中恢复数据
    let savedData = localStorage.getItem('questionDetailData');
    if (savedData) {
        savedData = JSON.parse(savedData);
        specificIssues.value = savedData.specificIssues || '';
    }

    // 监听输入框的变化并实时保存数据
    specificIssues.addEventListener('input', saveData);

});

// 直接为复制按钮绑定复制功能的事件监听器
document.getElementById('copyButton').addEventListener('click', copyAllDataToClipboard);

function resizeTextArea(textarea) {
    // 重置高度，以便可以缩小如果文本行减少
    textarea.style.height = 'auto';
    // 根据内容的滚动高度来调整文本区域的高度
    textarea.style.height = textarea.scrollHeight + 'px';
}

// 保存数据到 localStorage
function saveData() {
    let dataToSave = {
        specificIssues: document.getElementById('specificIssues').value,
    };
    localStorage.setItem('questionDetailData', JSON.stringify(dataToSave));
}


function copyAllDataToClipboard() {
    // 获取localStorage中的所有数据
    let questionData = JSON.parse(localStorage.getItem('questionDetailData')) || {};

    let combinedData =
        `${questionData.specificIssues || ''}`
    // 复制到剪贴板
    navigator.clipboard.writeText(combinedData).then(function () {
        console.log('内容已复制到粘贴板');

        openAndArrangeWindows(); // 假设这就是您想要执行的函数

    }, function (err) {
        console.error('无法复制内容: ', err);
    });
}

function openAndArrangeWindows() {
    let window1, window2;

    // 获取所有窗口
    chrome.windows.getAll({populate: true}, function(windows) {
        windows.forEach(function(window) {
            window.tabs.forEach(function(tab) {
                // 检查是否是我们需要的窗口
                if (tab.url === 'https://poe.com/Claude-3-Opus-200k' || tab.url === 'https://poe.com/GPT-4-32k') {
                    // 是的话就关闭
                    chrome.windows.remove(window.id);
                }
            });
        });
    });

    const outerWidth = screen.width;
    const outerHeight = screen.height;

    // 创建第一个窗口，并保存引用
    chrome.windows.create({
        url: 'https://poe.com/Claude-3-Opus-200k',
        type: 'popup',
        left:outerWidth/2,
        top: 0,
        width: outerWidth / 4 * 1.05,
        height: outerHeight
    }, function (win) {
        window1 = win;
    });

    // 创建第二个窗口，并保存引用
    chrome.windows.create({
        url: 'https://poe.com/GPT-4-32k',
        type: 'popup',
        left: outerWidth/4*3,
        top: 0,
        width: outerWidth / 4 * 1.05,
        height: outerHeight
    }, function (win) {
        window2 = win;
    });

    // 监听第一个窗口的关闭事件
    chrome.windows.onRemoved.addListener(function (windowId) {
        if (windowId === window1.id && window2) {
            chrome.windows.remove(window2.id);
        }
    });

    // 监听第二个窗口的关闭事件
    chrome.windows.onRemoved.addListener(function (windowId) {
        if (windowId === window2.id && window1) {
            chrome.windows.remove(window1.id);
        }
    });
}