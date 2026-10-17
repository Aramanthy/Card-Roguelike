// --- data.js ---

// 1. 트럼프 카드 기본 데이터
const suits = ['♠', '♥', '◆', '♣'];
const ranks = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];

// 2. 도박사(플레이어 캐릭터) 데이터 사전
const CHARACTER_DATA = {
    'gambler': { name: "타락한 도박사" },
    'cheater': { name: "사기꾼" },
    'broker': { name: "영혼을 파는 자" }
};

// 3. 심연의 딜러(적) 데이터 사전
const ENEMY_DATA = {
    'normal': { 
        name: "일반 딜러", 
        hp: 150, 
        intentDamage: 15, 
        logDesc: "일반 딜러와의 승부가 시작됩니다." 
    },
    'elite': { 
        name: "정예 딜러", 
        hp: 300, 
        intentDamage: 28, 
        logDesc: "끔찍한 기운의 정예 딜러가 나타났습니다!" 
    }
};