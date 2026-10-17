// --- game.js ---

let player = { name: "타락한 도박사", hp: 100, maxHp: 100, block: 0 };
let enemy = { hp: 150, maxHp: 150, intentDamage: 18 };

let masterDeck = []; let currentFloor = 1;
let deck = []; let discardPile = []; let hand = [];


function drawCard() {
    if (deck.length === 0) {
        if (discardPile.length === 0) return null;
        logMessage("덱이 모두 소진되어 버린 카드를 다시 섞습니다.");
        deck = discardPile; discardPile = [];
        shuffleDeck();
    }
    return deck.pop();
}

function getRankName(r) {
    if (r === 11) return 'J'; if (r === 12) return 'Q';
    if (r === 13) return 'K'; if (r === 14) return 'A'; return r;
}

function getCardBlock(rank) { return rank === 14 ? 12 : Math.max(2, 15 - rank); }

function logMessage(msg) {
    const logDiv = document.getElementById('log');
    logDiv.innerHTML += `> ${msg}<br>`;
    logDiv.scrollTop = logDiv.scrollHeight;
}

function openLobby() { document.getElementById('title-screen').style.display = 'none'; document.getElementById('lobby-screen').style.display = 'flex'; setTimeout(() => document.getElementById('lobby-screen').style.opacity = '1', 10); }
function returnToTitleFromLobby() { document.getElementById('lobby-screen').style.display = 'none'; document.getElementById('title-screen').style.display = 'flex'; setTimeout(() => document.getElementById('title-screen').style.opacity = '1', 10); }
function openCharacterSelection() { document.getElementById('lobby-screen').style.display = 'none'; document.getElementById('character-screen').style.display = 'flex'; setTimeout(() => document.getElementById('character-screen').style.opacity = '1', 10); }
function returnToLobbyFromChar() { document.getElementById('character-screen').style.display = 'none'; document.getElementById('lobby-screen').style.display = 'flex'; setTimeout(() => document.getElementById('lobby-screen').style.opacity = '1', 10); }
function returnToLobbyFromMap() { document.getElementById('map-screen').style.display = 'none'; document.getElementById('lobby-screen').style.display = 'flex'; setTimeout(() => document.getElementById('lobby-screen').style.opacity = '1', 10); }
function returnToLobby() { document.getElementById('game-main-container').style.display = 'none'; document.getElementById('lobby-screen').style.display = 'flex'; setTimeout(() => document.getElementById('lobby-screen').style.opacity = '1', 10); }

// ★ data.js의 CHARACTER_DATA 참조
function selectCharacter(type, maxHp) {
    player.name = CHARACTER_DATA[type] ? CHARACTER_DATA[type].name : "이름 없는 도박사";
    player.maxHp = maxHp; player.hp = maxHp;
    document.getElementById('player-class-name').innerText = player.name;
    initRun(); 
    document.getElementById('character-screen').style.display = 'none'; openMap();
}

function initRun() {
    currentFloor = 1; masterDeck = [];
    suits.forEach(suit => { ranks.forEach(rank => { masterDeck.push({ suit: suit, rank: rank }); }); });
}

function openMap() {
    document.getElementById('current-floor').innerText = currentFloor;
    document.getElementById('map-screen').style.display = 'flex';
    setTimeout(() => { document.getElementById('map-screen').style.opacity = '1'; }, 10);
}

function enterRestSite() {
    player.hp = Math.min(player.maxHp, player.hp + 20);
    alert(`안전 지대에서 휴식을 취했습니다.\n판돈(HP)을 20 회복하여 현재 ${player.hp}가 되었습니다.`);
    currentFloor++; openMap(); 
}

function enterBattle(type) {
    document.getElementById('map-screen').style.display = 'none'; document.getElementById('game-main-container').style.display = 'block'; setTimeout(() => document.getElementById('game-main-container').style.opacity = '1', 10);
    initBattle(type);
}

// ★ data.js의 ENEMY_DATA 참조
function initBattle(type) {
    player.block = 0;
    let targetEnemy = ENEMY_DATA[type] || ENEMY_DATA['normal'];
    enemy.hp = targetEnemy.hp; 
    enemy.maxHp = targetEnemy.hp; 
    enemy.intentDamage = targetEnemy.intentDamage; 
    enemy.defense = targetEnemy.defense || 20; // 적 방어력 할당
    
    document.getElementById('log').innerHTML = `> [${currentFloor}층] ${targetEnemy.logDesc}<br>`;
    deck = masterDeck.map(c => ({ suit: c.suit, rank: c.rank, selected: false, uniqueId: Math.random() }));
    discardPile = []; hand = [];
    shuffleDeck();
    setTimeout(startPlayerTurn, 500);
}
function shuffleDeck() { for (let i = deck.length - 1; i > 0; i--) { let j = Math.floor(Math.random() * (i + 1)); [deck[i], deck[j]] = [deck[j], deck[i]]; } }

function startPlayerTurn() {
    player.block = 0;
    if (hand.length > 0) { discardPile.push(...hand); hand = []; }
    setButtonsEnabled(false); document.getElementById('draw-btn').disabled = false; 
    updateUI();
    logMessage("---- [플레이어 턴 시작] 드로우 버튼을 눌러 카드를 뽑으십시오. ----");
}

function drawHand() {
    document.getElementById('draw-btn').disabled = true; 
    for (let i = 0; i < 5; i++) {
        let card = drawCard();
        if(card) { 
            card.selected = false; 
            card.dealState = 'dealing'; 
            card.dealDelay = i * 0.12;
            hand.push(card); 
        }
    }
    updateUI();
    logMessage("딜러가 카드를 나누기 시작합니다...");

    setTimeout(() => {
        hand.forEach(c => { c.dealState = 'flipping'; c.dealDelay = 0; });
        updateUI(); 
        
        setTimeout(() => {
            hand.forEach(c => c.dealState = 'revealed');
            autoSelectBestHand();
            setButtonsEnabled(true); 
            updateUI();
            logMessage("새로운 5장의 카드를 확인했습니다.");
        }, 400);

    }, 800);
}

function toggleCard(uniqueId) {
    let card = hand.find(c => c.uniqueId === uniqueId);
    if (card) { card.selected = !card.selected; updateUI(); }
}

function dealerCall() {
    if (player.hp <= 5) { logMessage("체력(판돈)이 부족하여 딜러를 매수할 수 없습니다!"); return; }
    player.hp -= 5;
    
    let newCard = drawCard();
    if(newCard) { 
        newCard.selected = false; 
        newCard.dealState = 'dealing'; 
        newCard.dealDelay = 0; 
        hand.push(newCard); // 교체가 아닌 추가(Push)
    }
    
    setButtonsEnabled(false); updateUI();
    
    setTimeout(() => {
        if(newCard) newCard.dealState = 'flipping'; updateUI();
        setTimeout(() => {
            if(newCard) newCard.dealState = 'revealed';
            autoSelectBestHand(); setButtonsEnabled(true); updateUI();
            logMessage("딜러에게 피를 바치고(HP -5) 카드 1장을 추가로 뽑았습니다 (콜).");
        }, 400);
    }, 300);
}

function dealerRaise() {
    if (player.hp <= 10) { logMessage("체력(판돈)이 부족하여 레이즈를 할 수 없습니다!"); return; }
    player.hp -= 10;
    
    let addedCards = [];
    for(let i=0; i<2; i++) {
        let newCard = drawCard();
        if(newCard){ 
            newCard.selected = false; 
            newCard.dealState = 'dealing'; 
            newCard.dealDelay = i * 0.15; 
            hand.push(newCard); // 교체가 아닌 추가(Push)
            addedCards.push(newCard);
        }
    }
    
    setButtonsEnabled(false); updateUI();
    
    setTimeout(() => {
        addedCards.forEach(c => { c.dealState = 'flipping'; }); updateUI();
        setTimeout(() => {
            addedCards.forEach(c => { c.dealState = 'revealed'; });
            autoSelectBestHand(); setButtonsEnabled(true); updateUI();
            logMessage("딜러에게 거액의 대가(HP -10)를 바치고 카드 2장을 추가로 뽑았습니다 (레이즈!).");
        }, 400);
    }, 450);
}

function evaluatePokerHand(cards) {
    if (cards.length === 0) return { name: "없음 (공격 안 함)", multiplier: 0, base: 0 };
    
    let sortedRanks = cards.map(c => c.rank).sort((a, b) => a - b); 
    let counts = {}; sortedRanks.forEach(r => counts[r] = (counts[r] || 0) + 1);
    
    let countGroups = {4:[], 3:[], 2:[], 1:[]};
    for (let r in counts) countGroups[counts[r]].push(Number(r));
    for (let c in countGroups) countGroups[c].sort((a,b) => b - a);
    
    // 플러시 판정 보강 (5장 이상이 같은 무늬인지 카운트)
    let suitCounts = { '♠':0, '♥':0, '◆':0, '♣':0 };
    cards.forEach(c => suitCounts[c.suit]++);
    let flushSuit = Object.keys(suitCounts).find(s => suitCounts[s] >= 5);
    let isFlush = !!flushSuit;
    let flushBase = isFlush ? cards.filter(c => c.suit === flushSuit).map(c => c.rank).sort((a,b)=>b-a).slice(0,5).reduce((a,b)=>a+b,0) : 0;

    // 스트레이트 판정 보강
    let isStraight = false; let straightSum = 0; let uniqueRanks = [...new Set(sortedRanks)];
    if (uniqueRanks.length >= 5) {
        for (let i = 0; i <= uniqueRanks.length - 5; i++) {
            if (uniqueRanks[i+4] - uniqueRanks[i] === 4) { 
                isStraight = true; 
                straightSum = uniqueRanks.slice(i, i+5).reduce((a,b)=>a+b,0); 
            }
        }
    }

    // 스트레이트 플러시 판정 보강
    let isStraightFlush = false; let stFlushSum = 0;
    if (isFlush) {
        let flushRanks = [...new Set(cards.filter(c => c.suit === flushSuit).map(c=>c.rank).sort((a,b)=>a-b))];
        if (flushRanks.length >= 5) {
            for (let i = 0; i <= flushRanks.length - 5; i++) {
                if (flushRanks[i+4] - flushRanks[i] === 4) {
                    isStraightFlush = true;
                    stFlushSum = flushRanks.slice(i, i+5).reduce((a,b)=>a+b,0);
                }
            }
        }
    }

    if (isStraightFlush) return { name: "스트레이트 플러시", multiplier: 10, base: stFlushSum };
    if (countGroups[4].length > 0) return { name: "포카드", multiplier: 8, base: countGroups[4][0] * 4 };
    if (countGroups[3].length > 0 && countGroups[2].length > 0) return { name: "풀하우스", multiplier: 6, base: (countGroups[3][0] * 3) + (countGroups[2][0] * 2) };
    if (isFlush) return { name: "플러시", multiplier: 5, base: flushBase };
    if (isStraight) return { name: "스트레이트", multiplier: 4, base: straightSum };
    if (countGroups[3].length > 0) return { name: "트리플", multiplier: 3, base: countGroups[3][0] * 3 };
    if (countGroups[2].length > 1) return { name: "투페어", multiplier: 2, base: (countGroups[2][0] * 2) + (countGroups[2][1] * 2) };
    if (countGroups[2].length === 1) return { name: "원페어", multiplier: 1.5, base: countGroups[2][0] * 2 };
    
    return { name: "하이 카드", multiplier: 1, base: Math.max(...sortedRanks) };
}

function autoSelectBestHand() {
    if (hand.length === 0) return;
    let bestSubset = []; let maxScore = -1; let bestMultiplier = -1;
    for (let i = 1; i < (1 << hand.length); i++) {
        let subset = [];
        for (let j = 0; j < hand.length; j++) if ((i & (1 << j))) subset.push(hand[j]);
        let evalResult = evaluatePokerHand(subset); let score = evalResult.base * evalResult.multiplier;
        if (evalResult.multiplier > bestMultiplier || (evalResult.multiplier === bestMultiplier && score > maxScore) || (evalResult.multiplier === bestMultiplier && score === maxScore && subset.length < bestSubset.length)) {
            bestMultiplier = evalResult.multiplier; maxScore = score; bestSubset = subset;
        }
    }
    hand.forEach(c => c.selected = false);
    if (bestMultiplier > 1) bestSubset.forEach(c => { let hc = hand.find(hc => hc.uniqueId === c.uniqueId); if (hc) hc.selected = true; });
    else { let highestCard = hand.reduce((max, card) => card.rank > max.rank ? card : max, hand[0]); if (highestCard) highestCard.selected = true; }
}

function playTurnAction() {
    let selectedCards = hand.filter(c => c.selected);
    if (selectedCards.length === 0) { logMessage("행동할 카드를 최소 1장 이상 선택하십시오."); return; }
    
    // 배팅액(HP) 차감 처리
    let betSlider = document.getElementById('bet-slider');
    let betAmount = parseInt(betSlider.value);
    if (player.hp < betAmount) { logMessage("판돈(HP)이 부족합니다!"); return; }
    
    setButtonsEnabled(false); document.getElementById('draw-btn').disabled = true;
    player.hp -= betAmount;
    logMessage(`--- 🩸 체력 ${betAmount}을(를) 판돈으로 걸고 운명의 주사위를 굴립니다! ---`);

    // 스탯 및 확률 연산
    let result = evaluatePokerHand(selectedCards); 
    let atkStat = result.base;
    let defStat = selectedCards.reduce((sum, c) => sum + getCardBlock(c.rank), 0);
    
    let hitChance = Math.max(5, Math.min(95, 50 + (atkStat - enemy.defense)));
    let defChance = Math.max(5, Math.min(95, 50 + (defStat - enemy.intentDamage)));

    // 1~100 주사위 굴림
    let atkRoll = Math.floor(Math.random() * 100) + 1;
    let defRoll = Math.floor(Math.random() * 100) + 1;
    let atkSuccess = atkRoll <= hitChance;
    let defSuccess = defRoll <= defChance;

    let finalDamage = atkSuccess ? Math.floor(betAmount * result.multiplier) : 0;
    let finalBlock = defSuccess ? Math.floor(betAmount * result.multiplier) : 0;

    logMessage(`[공격 판정] 필요 확률 ${hitChance}% / 주사위 ${atkRoll} ➔ ${atkSuccess ? `<span style="color:#ff6b6b">명중! (${finalDamage} 피해)</span>` : '빗나감..'}`);
    logMessage(`[방어 판정] 필요 확률 ${defChance}% / 주사위 ${defRoll} ➔ ${defSuccess ? `<span style="color:#4a90e2">성공! (${finalBlock} 방어)</span>` : '방어 실패..'}`);

    player.block += finalBlock;

    let domCards = document.querySelectorAll('#hand-container .card'); 
    
    // 미선택 카드 버리기
    domCards.forEach((cardDOM, index) => { 
        if (!hand[index].selected) cardDOM.classList.add('discarding'); 
    });

    // 선택된 카드 공격 연출 (명중했을 때만 적을 향해 날아감)
    setTimeout(() => {
        domCards.forEach((cardDOM, index) => { 
            if (hand[index].selected) {
                if (atkSuccess) cardDOM.classList.add('attacking'); 
                else cardDOM.classList.add('discarding'); // 빗나가면 그냥 쓰레기통으로
            }
        });

        setTimeout(() => {
            if (atkSuccess) {
                enemy.hp -= finalDamage; if (enemy.hp < 0) enemy.hp = 0;
                document.getElementById('enemy-hp').innerText = enemy.hp; 
            }
            
            setTimeout(() => {
                discardPile.push(...hand); hand = []; updateUI();
                if (enemy.hp <= 0) { 
                    logMessage("심연의 딜러를 무릎 꿇리고 판을 지배했습니다! 승리!"); 
                    alert("전투 승리! 다음 구역으로 나아갑니다."); 
                    currentFloor++; openMap(); return; 
                }
                logMessage("---- [적의 턴 시작] ----"); setTimeout(enemyTurn, 600);
            }, 380); 
        }, 120); 
    }, 150); 
}

function enemyTurn() {
    logMessage(`딜러가 심판의 역습을 가합니다! (위협: ${enemy.intentDamage})`);
    let actualDmg = Math.max(0, enemy.intentDamage - player.block); player.block = Math.max(0, player.block - enemy.intentDamage);
    player.hp -= actualDmg; if (player.hp < 0) player.hp = 0;
    logMessage(`일격으로 인해 생명력(판돈)이 ${actualDmg} 소모되었습니다.`); updateUI();
    if (player.hp <= 0) { logMessage("판돈이 바닥나 심연 속으로 추락했습니다... 파산 (GAME OVER)"); alert("파산 (게임 오버)!"); returnToLobby(); return; }
    setTimeout(startPlayerTurn, 900);
}

function setButtonsEnabled(enabled) { document.getElementById('call-btn').disabled = !enabled; document.getElementById('raise-btn').disabled = !enabled; document.getElementById('action-btn').disabled = !enabled; }

function updateUI() {
    document.getElementById('player-hp').innerText = player.hp; document.getElementById('player-max-hp').innerText = player.maxHp;
    document.getElementById('player-block').innerText = player.block; document.getElementById('enemy-hp').innerText = enemy.hp;
    document.getElementById('deck-count').innerText = deck.length; document.getElementById('discard-count').innerText = discardPile.length;

    let selectedCards = hand.filter(c => c.selected);
    let evalResult = evaluatePokerHand(selectedCards);
    
    let atkStat = evalResult.base;
    let defStat = selectedCards.reduce((sum, c) => sum + getCardBlock(c.rank), 0);
    
    let currentEnemyDef = enemy.defense || 20;
    let hitChance = Math.max(5, Math.min(95, 50 + (atkStat - currentEnemyDef)));
    let defChance = Math.max(5, Math.min(95, 50 + (defStat - enemy.intentDamage)));

    document.getElementById('current-hand-name').innerText = evalResult.name;
    document.getElementById('current-multiplier').innerText = evalResult.multiplier;
    document.getElementById('current-atk-stat').innerText = atkStat;
    document.getElementById('current-def-stat').innerText = defStat;
    
    document.getElementById('enemy-def-display').innerText = currentEnemyDef;
    document.getElementById('enemy-atk-display').innerText = enemy.intentDamage;
    document.getElementById('hit-chance').innerText = hitChance;
    document.getElementById('def-chance').innerText = defChance;

    let betSlider = document.getElementById('bet-slider');
    if (betSlider) {
        betSlider.max = Math.max(1, player.hp);
        let betVal = parseInt(betSlider.value);
        if (betVal > player.hp) betVal = player.hp;
        document.getElementById('bet-amount-display').innerText = betVal;
        
        let expectedOutput = Math.floor(betVal * evalResult.multiplier);
        document.getElementById('expected-dmg').innerText = expectedOutput;
        document.getElementById('expected-blk').innerText = expectedOutput;
    }

    let handContainer = document.getElementById('hand-container');
    handContainer.innerHTML = '';
    
    hand.forEach(card => {
        let cardDiv = document.createElement('div');
        let isRed = (card.suit === '♥' || card.suit === '◆');
        cardDiv.className = `card ${isRed ? 'red' : 'black'} ${card.selected ? 'selected' : ''}`;
        
        if (card.dealState === 'dealing') {
            cardDiv.classList.add('back', 'dealing');
            cardDiv.style.animationDelay = `${card.dealDelay}s`;
        } else if (card.dealState === 'flipping') {
            cardDiv.classList.add('flipping');
        }
        
        let blockVal = getCardBlock(card.rank);
        cardDiv.innerHTML = `<div style="font-size: 15px;">${card.suit}</div><div style="font-size: 22px; font-weight: bold; margin-top: 4px;">${getRankName(card.rank)}</div><div class="card-stat">🛡️ +${blockVal}</div>`;
        
        if (card.dealState === 'revealed' || !card.dealState) { cardDiv.onclick = () => toggleCard(card.uniqueId); }
        handContainer.appendChild(cardDiv);
    });
}