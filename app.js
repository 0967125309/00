// 初始化 GUN
const gun = Gun(['https://gun-manhattan.herokuapp.com/gun']);

// 遊戲常數
const BOARD_SIZE = 20; // 棋盤格子數
const INITIAL_MONEY = 15000; // 初始金錢
const SALARY = 2000; // 經過起點獲得的薪水

// 遊戲資料結構
const gameState = gun.get('monopoly');
const players = gameState.get('players');
const properties = gameState.get('properties');

// 初始化地產資料
const propertyData = [
    { name: '台北', price: 5000 },
    { name: '台中', price: 4000 },
    { name: '高雄', price: 4500 },
    { name: '花蓮', price: 3000 },
    // ... 可以繼續添加更多地產
];

// 遊戲狀態管理
let currentPlayer = null;
let localPlayer = null;

// DOM 元素
const loginSection = document.getElementById('login-section');
const gameSection = document.getElementById('game-section');
const playerNameInput = document.getElementById('player-name');
const joinButton = document.getElementById('join-btn');
const gameBoard = document.getElementById('game-board');
const rollDiceButton = document.getElementById('roll-dice');
const diceResult = document.getElementById('dice-result');
const playersList = document.getElementById('players');
const currentPlayerDisplay = document.getElementById('current-player');
const playerMoneyDisplay = document.getElementById('player-money');

// 初始化遊戲板
function initializeBoard() {
    // 清空遊戲板
    gameBoard.innerHTML = '';
    
    // 創建棋盤格子
    for (let i = 0; i < BOARD_SIZE; i++) {
        const cell = document.createElement('div');
        cell.className = 'board-cell';
        if (i === 0) {
            cell.textContent = '起點';
        } else if (i < propertyData.length) {
            cell.className += ' property';
            cell.textContent = `${propertyData[i-1].name}\n$${propertyData[i-1].price}`;
            cell.dataset.propertyId = i-1;
        }
        gameBoard.appendChild(cell);
    }
}

// 玩家加入遊戲
joinButton.addEventListener('click', () => {
    const playerName = playerNameInput.value.trim();
    if (!playerName) return;

    localPlayer = {
        id: Math.random().toString(36).substr(2, 9),
        name: playerName,
        position: 0,
        money: INITIAL_MONEY,
        properties: []
    };

    players.get(localPlayer.id).put(localPlayer);
    loginSection.style.display = 'none';
    gameSection.style.display = 'grid';
    
    // 如果是第一個玩家，設為當前玩家
    players.once((data) => {
        if (!data || Object.keys(data).length === 1) {
            gameState.get('currentPlayerId').put(localPlayer.id);
        }
    });
});

// 監聽玩家列表變化
players.map().on((player, id) => {
    if (!player) return;
    updatePlayersList();
    updatePlayerPosition(id, player);
});

// 監聽當前玩家變化
gameState.get('currentPlayerId').on((currentPlayerId) => {
    if (!currentPlayerId) return;
    
    const isMyTurn = currentPlayerId === localPlayer?.id;
    rollDiceButton.disabled = !isMyTurn;
    
    players.get(currentPlayerId).once((player) => {
        if (!player) return;
        currentPlayerDisplay.textContent = `當前玩家：${player.name}`;
        if (isMyTurn) {
            alert('輪到你的回合了！');
        }
    });
});

// 擲骰子
rollDiceButton.addEventListener('click', () => {
    const dice = Math.floor(Math.random() * 6) + 1;
    diceResult.textContent = `骰子點數：${dice}`;
    
    // 更新玩家位置
    const newPosition = (localPlayer.position + dice) % BOARD_SIZE;
    
    // 如果經過或到達起點，獲得薪水
    if (newPosition < localPlayer.position) {
        localPlayer.money += SALARY;
    }
    
    localPlayer.position = newPosition;
    players.get(localPlayer.id).put(localPlayer);
    
    // 更換下一位玩家
    players.once((allPlayers) => {
        const playerIds = Object.keys(allPlayers);
        const currentIndex = playerIds.indexOf(localPlayer.id);
        const nextIndex = (currentIndex + 1) % playerIds.length;
        gameState.get('currentPlayerId').put(playerIds[nextIndex]);
    });
});

// 更新玩家列表顯示
function updatePlayersList() {
    players.once((allPlayers) => {
        if (!allPlayers) return;
        
        playersList.innerHTML = '';
        Object.values(allPlayers).forEach(player => {
            if (!player) return;
            
            const playerDiv = document.createElement('div');
            playerDiv.className = 'player-info';
            if (player.id === localPlayer?.id) {
                playerDiv.className += ' current-turn';
            }
            playerDiv.innerHTML = `
                <div>${player.name}</div>
                <div>金錢：$${player.money}</div>
                <div>位置：${player.position}</div>
            `;
            playersList.appendChild(playerDiv);
        });
    });
}

// 更新玩家在棋盤上的位置
function updatePlayerPosition(playerId, player) {
    // 移除舊的玩家標記
    const oldToken = document.querySelector(`.player-token[data-player-id="${playerId}"]`);
    if (oldToken) {
        oldToken.remove();
    }
    
    // 添加新的玩家標記
    const cell = gameBoard.children[player.position];
    const token = document.createElement('div');
    token.className = 'player-token';
    token.dataset.playerId = playerId;
    token.style.backgroundColor = stringToColor(player.name);
    cell.appendChild(token);
}

// 將字符串轉換為顏色（用於玩家標記）
function stringToColor(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    let color = '#';
    for (let i = 0; i < 3; i++) {
        const value = (hash >> (i * 8)) & 0xFF;
        color += ('00' + value.toString(16)).substr(-2);
    }
    return color;
}

// 初始化遊戲
initializeBoard();