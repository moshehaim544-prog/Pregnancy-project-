lucide.createIcons();

// נתוני פירות וטיפים
const pregnancyData = {
    fruits: { 4: "גרגיר פרג", 8: "פטל", 12: "ליים", 16: "בוטן", 20: "בננה", 24: "תירס", 28: "חציל", 32: "דלעת", 36: "מלון", 40: "אבטיח" },
    dadTips: {
        1: "ענבר עלולה להיות עייפה מאוד. פנק אותה במנוחה.",
        2: "זמן מעולה להתחיל לחפש עגלות יחד.",
        3: "הכינו רשימת שמות פוטנציאליים."
    }
};

let tasks = JSON.parse(localStorage.getItem('preg_tasks')) || [
    { id: 1, text: "בדיקת דם בטא", trim: 1, done: false, type: "medical" },
    { id: 2, text: "שקיפות עורפית", trim: 1, done: false, type: "medical" },
    { id: 3, text: "סקירה מוקדמת", trim: 2, done: false, type: "medical" }
];

function calculatePulse() {
    const lmpValue = document.getElementById('lmp-date').value;
    if (!lmpValue) return;

    const lmp = new Date(lmpValue);
    const today = new Date();
    const diff = today - lmp;
    
    let totalDays = Math.floor(diff / (1000 * 60 * 60 * 24));
    let weeks = Math.floor(totalDays / 7);
    let days = totalDays % 7;

    // Override
    const override = document.getElementById('override-weeks').value;
    if (override) { weeks = parseInt(override); days = 0; }

    document.getElementById('display-weeks').innerText = `שבוע ${weeks} ו-${days} ימים`;
    document.getElementById('days-left').innerText = 280 - totalDays;
    
    // Update Fruit
    let fruitKey = Object.keys(pregnancyData.fruits).reverse().find(k => weeks >= k) || 4;
    document.getElementById('fruit-emoji').innerText = getFruitEmoji(fruitKey);
    document.getElementById('fruit-name').innerText = `בגודל ${pregnancyData.fruits[fruitKey]}`;
    
    renderTasks();
}

function getFruitEmoji(week) {
    const emojis = { 4: "🌱", 8: "🍓", 12: "🍋", 16: "🥑", 20: "🍌", 24: "🌽", 28: "🍆", 32: "🎃", 36: "🍈", 40: "🍉" };
    return emojis[week] || "👶";
}

function renderTasks() {
    for (let i = 1; i <= 3; i++) {
        const container = document.getElementById(`list-${i}`);
        container.innerHTML = tasks.filter(t => t.trim === i).map(t => `
            <div class="task-item">
                <input type="checkbox" ${t.done ? 'checked' : ''} onchange="toggleTask(${t.id})">
                <span class="${t.done ? 'line-through text-slate-400' : ''}">${t.text}</span>
            </div>
        `).join('');
    }
}

function toggleTask(id) {
    const task = tasks.find(t => t.id === id);
    task.done = !task.done;
    localStorage.setItem('preg_tasks', JSON.stringify(tasks));
    renderTasks();
}

function showTab(tab) {
    document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(`content-${tab}`).classList.remove('hidden');
    document.getElementById(`tab-${tab === 'procurement' ? 'proc' : tab === 'emergency' ? 'emer' : 'tasks'}`).classList.add('active');
}

// Init
calculatePulse();
