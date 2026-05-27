const canvas = document.getElementById('wheel');
const ctx = canvas.getContext('2d');
const itemsContainer = document.getElementById('items-container');
const historyList = document.getElementById('history-list');
const spinBtn = document.getElementById('spin-btn');

// 초기 기본 항목들 (weight 값이 확률 및 칸 넓이를 결정합니다)
let items = [
    { text: '치킨', weight: 1, color: '#fca5a5' },
    { text: '피자', weight: 1, color: '#fdba74' },
    { text: '햄버거', weight: 1, color: '#fcd34d' },
    { text: '국밥', weight: 1, color: '#86efac' },
    { text: '돈까스', weight: 1, color: '#93c5fd' },
    { text: '초밥', weight: 1, color: '#c4b5fd' }
];

// 예쁜 파스텔 톤 색상표
const colors = ['#fca5a5', '#fdba74', '#fcd34d', '#86efac', '#6ee7b7', '#93c5fd', '#a5b4fc', '#c4b5fd', '#f9a8d4', '#fda4af'];
let currentRotation = 0;
let isSpinning = false;
let resultCount = 0;

// 설정창 렌더링 함수
function renderSettings() {
    itemsContainer.innerHTML = '';
    items.forEach((item, index) => {
        const row = document.createElement('div');
        row.className = 'item-row';
        row.innerHTML = `
            <input type="text" value="${item.text}" onchange="updateItem(${index}, 'text', this.value)" placeholder="칸 내용">
            <input type="number" value="${item.weight}" min="1" onchange="updateItem(${index}, 'weight', this.value)" placeholder="비율(넓이)">
            <button class="remove-btn" onclick="removeItem(${index})">X</button>
        `;
        itemsContainer.appendChild(row);
    });
}

// 항목 내용/확률 업데이트
window.updateItem = (index, key, value) => {
    items[index][key] = key === 'weight' ? Math.max(1, Number(value)) : value;
};

// 항목 삭제
window.removeItem = (index) => {
    if(items.length <= 2) {
        alert('돌림판 항목은 최소 2개 이상이어야 합니다.');
        return;
    }
    items.splice(index, 1);
    renderSettings();
    drawWheel();
};

// 항목 추가 버튼 이벤트
document.getElementById('add-item-btn').addEventListener('click', () => {
    items.push({ 
        text: `새 항목 ${items.length + 1}`, 
        weight: 1, 
        color: colors[items.length % colors.length] 
    });
    renderSettings();
    drawWheel();
});

// 돌림판 적용 버튼 이벤트
document.getElementById('update-wheel-btn').addEventListener('click', () => {
    drawWheel();
});

// 돌림판 그리기 로직
function drawWheel() {
    const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
    let startAngle = 0;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    items.forEach((item) => {
        // 비율에 따른 각도 계산
        const sliceAngle = (item.weight / totalWeight) * 2 * Math.PI;
        
        ctx.beginPath();
        ctx.moveTo(canvas.width / 2, canvas.height / 2);
        ctx.arc(canvas.width / 2, canvas.height / 2, canvas.width / 2, startAngle, startAngle + sliceAngle);
        ctx.closePath();
        ctx.fillStyle = item.color;
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // 텍스트 추가
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(startAngle + sliceAngle / 2);
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#1e293b';
        ctx.font = 'bold 18px sans-serif';
        // 텍스트가 너무 길면 잘리도록 조치
        let displayText = item.text.length > 10 ? item.text.substring(0, 10) + '...' : item.text;
        ctx.fillText(displayText, canvas.width / 2 - 30, 0);
        ctx.restore();

        // 나중에 당첨 여부를 계산하기 위해 각도 정보 저장
        item.startAngle = startAngle;
        item.endAngle = startAngle + sliceAngle;
        
        startAngle += sliceAngle;
    });
}

// 돌리기 버튼 이벤트
spinBtn.addEventListener('click', () => {
    if (isSpinning) return;
    
    // 비어있는 내용 검사
    const hasEmptyText = items.some(item => item.text.trim() === '');
    if (hasEmptyText) {
        alert('모든 칸의 내용을 입력해주세요!');
        return;
    }

    isSpinning = true;
    spinBtn.disabled = true;

    // 10~15바퀴 사이에서 랜덤으로 돌기 (3600도 ~ 5400도) + 랜덤 추가 각도
    const spinAngle = Math.floor(Math.random() * 1800) + 3600; 
    currentRotation += spinAngle;

    canvas.style.transform = `rotate(${currentRotation}deg)`;

    // CSS transition 시간(5초) 후에 결과 계산
    setTimeout(() => {
        isSpinning = false;
        spinBtn.disabled = false;
        calculateResult();
    }, 5000); 
});

// 당첨 결과 계산 로직
function calculateResult() {
    // 1. 현재 총 회전 각도를 360도로 나눈 나머지 (0~360도)
    const normalizedRotation = currentRotation % 360;
    
    // 2. 캔버스는 시계 방향으로 돌고, 포인터는 고정(위쪽, 270도 위치)이므로 보정 계산
    const pointerAngle = (360 - normalizedRotation + 270) % 360;
    const pointerRadian = (pointerAngle * Math.PI) / 180;

    let result = '';
    for (let i = 0; i < items.length; i++) {
        if (pointerRadian >= items[i].startAngle && pointerRadian < items[i].endAngle) {
            result = items[i].text;
            break;
        }
    }

    // 부동소수점 오차 대비
    if (!result && items.length > 0) result = items[0].text;

    addHistory(result);
}

// 결과 목록에 추가
function addHistory(result) {
    if (resultCount === 0) {
        historyList.innerHTML = ''; // 첫 결과 추가 시 안내문구 제거
    }
    
    resultCount++;
    const li = document.createElement('li');
    const time = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
    const resultText = document.createElement('span');
    resultText.textContent = `${resultCount}회차 당첨: ${result}`;
    
    const timeText = document.createElement('span');
    timeText.textContent = time;
    timeText.style.fontSize = '12px';
    timeText.style.color = '#64748b';

    li.appendChild(resultText);
    li.appendChild(timeText);
    
    // 최신 결과가 위로 오도록 prepend 사용
    historyList.prepend(li);
}

// 초기 로딩 시 렌더링
renderSettings();
drawWheel();