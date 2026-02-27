lucide.createIcons();

// --- מאגר מידע מורחב ---
const MEDICAL_KNOWLEDGE = {
    "בדיקת דם בטא": "בדיקה המודדת את הורמון ההיריון (HCG). היא מאשרת את ההיריון ומצביעה על התפתחות תקינה בשלבים המוקדמים.",
    "שקיפות עורפית": "בדיקת אולטרסאונד המבוצעת בין שבוע 11 ל-13. היא מודדת את עובי הנוזל בעורף העובר כדי להעריך סיכון להפרעות כרומוזומליות.",
    "סקירה מוקדמת": "אולטרסאונד מפורט (שבוע 14-17) הבודק את כל איברי העובר שהתפתחו. רואים דופק, ידיים, רגליים ואיברים פנימיים.",
    "העמסת סוכר": "בדיקה לאבחון סוכרת הריון. שותים תמיסת סוכר ומחכים לבדיקת דם. משה, תביא לימון!",
    "סקירה מאוחרת": "בדיקה נוספת (שבוע 22-24) כדי לוודא שכל האיברים ממשיכים להתפתח כראוי."
};

const SUGGESTIONS = {
    proc: ["עגלה", "סלקל", "מיטת תינוק", "שידת החתלה", "משאבת חלב", "מזרן פעילות", "טרמפולינה"],
    "bag-inbar": ["שפתון לחות", "גרביים חמים", "בקבוק מים עם קשית", "מטען ארוך", "חטיפי אנרגיה", "שמני עיסוי", "חלונית"],
    "bag-baby": ["חיתולי ניו-בורן", "מוצץ", "חליפת יציאה", "שמיכת טטרה", "כובע כותנה", "אלכוג'ל קטן"]
};

// --- לוגיקה ---
let state = JSON.parse(localStorage.getItem('journey_state')) || {
    lmp: '', manualW: '', manualD: '',
    tasks: [], proc: [], bag: [], emergency: [
        { name: "מוקד אחיות", num: "*2700" },
        { name: "מד\"א", num: "101" }
    ],
    kicks: 0
};

// אתחול בדיקות אם ריק
if (state.tasks.length === 0) {
    state.tasks = [
        { id: 1, week: 6, text: "בדיקת דם בטא", trim: 1, done: false },
        { id: 2, week: 12, text: "שקיפות עורפית", trim: 1, done: false },
        { id: 3, week: 15, text: "סקירה מוקדמת", trim: 2, done: false },
        { id: 4, week: 24, text: "העמסת סוכר", trim: 2, done: false },
        { id: 5, week: 32, text: "הערכת משקל", trim: 3, done: false }
    ];
}

function handleLMPChange() {
    state.lmp = document.getElementById('lmp-date').value;
    state.manualW = '';
    state.manualD = '';
    updateUI();
}

function handleManualChange() {
    state.manualW = document.getElementById('manual-w').value;
    state.manualD = document.getElementById('manual-d').value;
    updateUI();
}

function updateUI() {
    const today = new Date();
    let totalDays = 0;
    
    if (state.manualW !== '') {
        totalDays = (parseInt(state.manualW) * 7) + (parseInt(state.manualD) || 0);
    } else if (state.lmp) {
        totalDays = Math.floor((today - new Date(state.lmp)) / (1000*60*60*24));
    }

    const weeks = Math.floor(totalDays / 7);
    const days = totalDays % 7;
    
    // Update State & Inputs
    document.getElementById('display-weeks').innerText = `שבוע ${weeks} + ${days}`;
    document.getElementById('manual-w').value = weeks;
    document.getElementById('manual-d').value = days;
    document.getElementById('days-left').innerText = Math.max(0, 280 - totalDays);

    // Calculate Due Date
    if (state.lmp) {
        const dDate = new Date(state.lmp);
        dDate.setDate(dDate.getDate() + 280);
        document.getElementById('due-date').innerText = dDate.toLocaleDateString('he-IL');
        document.getElementById('zodiac-sign').innerText = getZodiac(dDate);
    }

    renderFruits(weeks);
    renderAll();
    save();
}

function getZodiac(date) {
    const days = [21, 20, 21, 21, 22, 22, 23, 24, 24, 24, 23, 22];
    const signs = ["גדי", "דלי", "דגים", "טלה", "שור", "תאומים", "סרטן", "אריה", "בתולה", "מאזניים", "עקרב", "קשת"];
    let month = date.getMonth();
    let day = date.getDate();
    if (day < days[month]) return signs[month];
    else return signs[(month + 1) % 12];
}

function renderFruits(weeks) {
    const fruits = { 4: ["🌱", "זרעון"], 8: ["🍓", "פטל"], 12: ["🍋", "לימון"], 20: ["🍌", "בננה"], 30: ["🎃", "דלעת"], 40: ["🍉", "אבטיח"] };
    let key = Object.keys(fruits).reverse().find(w => weeks >= w) || 4;
    document.getElementById('fruit-emoji').innerText = fruits[key][0];
    document.getElementById('fruit-name').innerText = `בגודל ${fruits[key][1]}`;
}

function renderAll() {
    // Render Tasks
    [1,2,3].forEach(tr => {
        document.getElementById(`list-${tr}`).innerHTML = state.tasks.filter(t => t.trim === tr).map(t => `
            <div class="task-card">
                <input type="checkbox" ${t.done?'checked':''} onchange="toggleTask(${t.id})">
                <div class="flex-1 text-xs font-bold">${t.text}</div>
                <div class="help-icon" onclick="openHelp('${t.text}')">?</div>
            </div>
        `).join('');
    });

    // Render Proc
    document.getElementById('proc-body').innerHTML = state.proc.map((p, i) => `
        <tr class="border-b">
            <td class="p-3"><input type="text" value="${p.name}" class="bg-transparent w-full" onchange="edit('proc',${i},'name',this.value)"></td>
            <td class="p-3 italic">₪<input type="number" value="${p.price}" class="w-16 bg-transparent" onchange="edit('proc',${i},'price',this.value)"></td>
            <td class="p-3 text-center"><input type="checkbox" ${p.done?'checked':''} onchange="edit('proc',${i},'done',this.checked)"></td>
            <td class="p-3"><button onclick="remove('proc',${i})" class="text-slate-300">✕</button></td>
        </tr>
    `).join('');
    
    // Render Bags
    ['inbar', 'baby'].forEach(tg => {
        document.getElementById(`bag-${tg}`).innerHTML = state.bag.filter(b => b.target === tg).map((b, i) => {
            const idx = state.bag.indexOf(b);
            return `<div class="flex gap-2 items-center bg-slate-50 p-2 rounded-xl text-xs mb-2">
                <input type="checkbox" ${b.done?'checked':''} onchange="edit('bag',${idx},'done',this.checked)">
                <input type="text" value="${b.name}" class="bg-transparent flex-1" onchange="edit('bag',${idx},'name',this.value)">
                <button onclick="remove('bag',${idx})" class="text-slate-300">✕</button>
            </div>`;
        }).join('');
    });

    // Render Emergency
    document.getElementById('emergency-list').innerHTML = state.emergency.map((e, i) => `
        <div class="card p-4 flex justify-between items-center bg-white border-pink-100">
            <div>
                <input type="text" value="${e.name}" class="block font-black text-xs bg-transparent" onchange="edit('emer',${i},'name',this.value)">
                <input type="text" value="${e.num}" class="block text-pink-500 font-mono text-sm bg-transparent" onchange="edit('emer',${i},'num',this.value)">
            </div>
            <div class="flex gap-2">
                <a href="tel:${e.num}" class="p-2 bg-pink-50 rounded-full text-pink-500"><i data-lucide="phone" class="w-4 h-4"></i></a>
                <button onclick="remove('emer',${i})" class="text-slate-200 hover:text-red-400">✕</button>
            </div>
        </div>
    `).join('');

    document.getElementById('kick-count').innerText = state.kicks;
    lucide.createIcons();
}

// Actions
window.openHelp = (title) => {
    document.getElementById('help-title').innerText = title;
    document.getElementById('help-desc').innerText = MEDICAL_KNOWLEDGE[title] || "בדיקה שגרתית למעקב אחר התפתחות ההיריון.";
    document.getElementById('help-modal').classList.remove('hidden');
};
window.closeHelp = () => document.getElementById('help-modal').classList.add('hidden');

window.openSuggestionMenu = (type) => {
    const list = SUGGESTIONS[type === 'proc' ? 'proc' : type];
    const picked = list[Math.floor(Math.random() * list.length)];
    if (type === 'proc') state.proc.push({ name: picked, price: 0, done: false });
    else state.bag.push({ name: picked, target: type.split('-')[1], done: false });
    updateUI();
};

window.edit = (type, i, k, v) => {
    if(type==='proc') state.proc[i][k]=v;
    if(type==='bag') state.bag[i][k]=v;
    if(type==='emer') state.emergency[i][k]=v;
    updateUI();
};

window.remove = (type, i) => {
    if(type==='proc') state.proc.splice(i,1);
    if(type==='bag') state.bag.splice(i,1);
    if(type==='emer') state.emergency.splice(i,1);
    updateUI();
};

window.addKick = () => { state.kicks++; updateUI(); };
window.resetKicks = () => { state.kicks = 0; updateUI(); };

window.showTab = (t) => {
    document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(`tab-${t}`).classList.remove('hidden');
    document.getElementById(`btn-${t === 'procurement' ? 'proc' : t === 'hospital' ? 'hosp' : t === 'emergency' ? 'emer' : t}`).classList.add('active');
};

window.save = () => localStorage.setItem('journey_state', JSON.stringify(state));
window.resetDates = () => { state.manualW = ''; state.manualD = ''; updateUI(); };

// Start
document.getElementById('lmp-date').value = state.lmp;
updateUI();
