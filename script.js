lucide.createIcons();

// --- נתונים מובנים ---
const MEDICAL_DATABASE = [
    { week: 6, text: "בדיקת דם בטא + אולטרסאונד דופק", trim: 1 },
    { week: 11, text: "בדיקת שקיפות עורפית", trim: 1 },
    { week: 12, text: "סקר טרימסטר ראשון (דם)", trim: 1 },
    { week: 15, text: "סקירת מערכות מוקדמת", trim: 2 },
    { week: 17, text: "חלבון עוברי (תבחין מרובע)", trim: 2 },
    { week: 22, text: "סקירת מערכות מאוחרת", trim: 2 },
    { week: 24, text: "בדיקת העמסת סוכר (50 גרם)", trim: 2 },
    { week: 30, text: "הערכת משקל עובר", trim: 3 },
    { week: 35, text: "בדיקת GBS", trim: 3 },
    { week: 40, text: "מעקב הריון עודף / מוניטור", trim: 3 }
];

const INITIAL_PROCUREMENT = [
    { name: "עגלה + אמבטיה", est: 3500, real: 0, done: false },
    { name: "סלקל לרכב", est: 800, real: 0, done: false },
    { name: "שידת החתלה + מזרן", est: 1200, real: 0, done: false },
    { name: "מיטת תינוק", est: 1000, real: 0, done: false },
    { name: "חבילת ביגוד ראשונית", est: 400, real: 0, done: false }
];

const INITIAL_BAG = [
    { item: "מטען לטלפון ארוך מאוד", target: "inbar", done: false },
    { item: "בקבוק מים עם קשית", target: "inbar", done: false },
    { item: "בגדים ליציאה מהבית (ניו בורן)", target: "baby", done: false },
    { item: "חיתולי בד / טטרה", target: "baby", done: false }
];

const WEEKLY_TIPS = {
    8: "העובר בגודל פטל! ענבר, זה הזמן לנוח הרבה, הגוף בונה שליה.",
    12: "שקיפות עורפית עברה? אפשר להתחיל לספר למעגל הקרוב.",
    24: "העמסת סוכר לפנייך. משה, תכין לה לימון סחוט בתיק - זה עוזר עם הטעם.",
    32: "זמן להתחיל קורס הכנה ללידה אם עוד לא עשיתם.",
    38: "התיק לבית חולים חייב להיות מוכן ליד הדלת!"
};

// --- ניהול מצב (State) ---
let state = {
    lmp: localStorage.getItem('preg_lmp') || '',
    manualW: localStorage.getItem('preg_mw') || '',
    manualD: localStorage.getItem('preg_md') || '',
    tasks: JSON.parse(localStorage.getItem('preg_tasks')) || MEDICAL_DATABASE.map((d,i)=>({...d, id:i, done:false})),
    proc: JSON.parse(localStorage.getItem('preg_proc')) || INITIAL_PROCUREMENT,
    bag: JSON.parse(localStorage.getItem('preg_bag')) || INITIAL_BAG,
    emergency: JSON.parse(localStorage.getItem('preg_emer')) || [
        { name: "חדר לידה (ביה\"ח הנבחר)", num: "03-XXXXXXX" },
        { name: "מלווה / דולה", num: "050-XXXXXXX" }
    ]
};

// --- פונקציות ליבה ---
function updateAll() {
    saveState();
    const pulse = calculatePulse();
    renderTasks();
    renderProc();
    renderBag();
    renderEmergency();
    renderTip(pulse.weeks);
}

function calculatePulse() {
    let weeks, days, totalDays;
    
    if (state.manualW !== '') {
        weeks = parseInt(state.manualW) || 0;
        days = parseInt(state.manualD) || 0;
        totalDays = (weeks * 7) + days;
    } else if (state.lmp) {
        const diff = new Date() - new Date(state.lmp);
        totalDays = Math.floor(diff / (1000 * 60 * 60 * 24));
        weeks = Math.floor(totalDays / 7);
        days = totalDays % 7;
    } else {
        return { weeks: 0, days: 0, totalDays: 0 };
    }

    document.getElementById('display-weeks').innerText = `שבוע ${weeks} + ${days}`;
    document.getElementById('days-left').innerText = Math.max(0, 280 - totalDays);
    
    const fruits = { 4: "🌱 זרע", 8: "🍓 פטל", 12: "🍋 לימון", 16: "🥑 אבוקדו", 20: "🍌 בננה", 24: "🌽 תירס", 30: "🎃 דלעת", 36: "🍉 אבטיח" };
    let currentFruit = Object.keys(fruits).reverse().find(w => weeks >= w) || 4;
    document.getElementById('fruit-emoji').innerText = fruits[currentFruit].split(' ')[0];
    document.getElementById('fruit-name').innerText = `בגודל ${fruits[currentFruit].split(' ')[1]}`;
    
    return { weeks, days };
}

function renderTasks() {
    [1,2,3].forEach(tNum => {
        const list = document.getElementById(`list-${tNum}`);
        list.innerHTML = state.tasks.filter(t => t.trim === tNum).map(t => `
            <div class="task-card">
                <input type="checkbox" ${t.done ? 'checked' : ''} onchange="toggleTask(${t.id})">
                <div class="flex-1">
                    <p class="font-bold text-xs">${t.text}</p>
                    <p class="text-[9px] text-slate-400 italic">שבוע מומלץ: ${t.week}</p>
                </div>
            </div>
        `).join('');
    });
}

function renderProc() {
    const body = document.getElementById('proc-body');
    let total = 0;
    body.innerHTML = state.proc.map((p, i) => {
        total += Number(p.real || 0);
        return `
        <tr class="border-b border-slate-50 hover:bg-slate-50/50">
            <td class="p-3"><input type="text" value="${p.name}" class="bg-transparent border-none w-full" onchange="editItem('proc',${i},'name',this.value)"></td>
            <td class="p-3 text-slate-400 italic">₪${p.est}</td>
            <td class="p-3">₪<input type="number" value="${p.real}" class="bg-transparent border-b border-pink-100 w-16" onchange="editItem('proc',${i},'real',this.value)"></td>
            <td class="p-3 text-center"><input type="checkbox" ${p.done ? 'checked' : ''} onchange="editItem('proc',${i},'done',this.checked)"></td>
            <td class="p-3"><button onclick="deleteItem('proc',${i})" class="text-slate-300 hover:text-red-500">✕</button></td>
        </tr>`;
    }).join('');
    document.getElementById('total-spent').innerText = `₪${total.toLocaleString()}`;
}

function renderBag() {
    const targets = ['inbar', 'baby'];
    targets.forEach(target => {
        const container = document.getElementById(`bag-${target}`);
        container.innerHTML = state.bag.filter(b => b.target === target).map((b, i) => {
            const globalIdx = state.bag.indexOf(b);
            return `
            <div class="flex items-center gap-2 mb-2 bg-slate-50 p-2 rounded-xl text-xs">
                <input type="checkbox" ${b.done ? 'checked' : ''} onchange="editItem('bag',${globalIdx},'done',this.checked)">
                <input type="text" value="${b.item}" class="bg-transparent border-none flex-1" onchange="editItem('bag',${globalIdx},'item',this.value)">
                <button onclick="deleteItem('bag',${globalIdx})" class="opacity-30">✕</button>
            </div>`;
        }).join('') + `<button onclick="addItemToBag('${target}')" class="text-[10px] text-slate-400 mt-2">+ הוסף פריט</button>`;
    });
}

function renderEmergency() {
    const container = document.getElementById('emergency-list');
    container.innerHTML = state.emergency.map((e, i) => `
        <div class="bg-white p-3 rounded-2xl border border-red-100 flex justify-between items-center shadow-sm">
            <div>
                <input type="text" value="${e.name}" class="block font-bold text-xs bg-transparent" onchange="editItem('emer',${i},'name',this.value)">
                <input type="text" value="${e.num}" class="block text-red-500 font-mono text-sm bg-transparent" onchange="editItem('emer',${i},'num',this.value)">
            </div>
            <a href="tel:${e.num}" class="bg-red-500 text-white p-2 rounded-full"><i data-lucide="phone" class="w-4 h-4"></i></a>
        </div>
    `).join('');
    lucide.createIcons();
}

function renderTip(week) {
    const tipBox = document.getElementById('weekly-tip-box');
    const tipText = document.getElementById('tip-text');
    const weekNum = document.getElementById('tip-week-num');
    
    let closestWeek = Object.keys(WEEKLY_TIPS).reverse().find(w => week >= w) || 8;
    weekNum.innerText = week;
    tipText.innerText = WEEKLY_TIPS[closestWeek] || "תמשיכו ככה! אתם עושים עבודה נהדרת.";
}

// --- עוזרים (Actions) ---
window.editItem = (type, idx, key, val) => {
    if(type === 'proc') state.proc[idx][key] = val;
    if(type === 'bag') state.bag[idx][key] = val;
    if(type === 'emer') state.emergency[idx][key] = val;
    updateAll();
};

window.deleteItem = (type, idx) => {
    if(type === 'proc') state.proc.splice(idx, 1);
    if(type === 'bag') state.bag.splice(idx, 1);
    updateAll();
};

window.addProcItem = () => {
    state.proc.push({ name: "מוצר חדש", est: 0, real: 0, done: false });
    updateAll();
};

window.addItemToBag = (target) => {
    state.bag.push({ item: "פריט חדש", target, done: false });
    updateAll();
};

window.addEmergency = () => {
    state.emergency.push({ name: "איש קשר", num: "05X-XXXXXXX" });
    updateAll();
};

window.toggleTask = (id) => {
    const task = state.tasks.find(t => t.id === id);
    task.done = !task.done;
    updateAll();
};

window.showTab = (tabName) => {
    document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(`tab-${tabName}`).classList.remove('hidden');
    document.getElementById(`btn-${tabName === 'procurement' ? 'proc' : tabName === 'hospital' ? 'hosp' : tabName === 'emergency' ? 'emer' : 'tasks'}`).classList.add('active');
};

window.saveState = () => {
    state.lmp = document.getElementById('lmp-date').value;
    state.manualW = document.getElementById('manual-w').value;
    state.manualD = document.getElementById('manual-d').value;
    localStorage.setItem('preg_lmp', state.lmp);
    localStorage.setItem('preg_mw', state.manualW);
    localStorage.setItem('preg_md', state.manualD);
    localStorage.setItem('preg_tasks', JSON.stringify(state.tasks));
    localStorage.setItem('preg_proc', JSON.stringify(state.proc));
    localStorage.setItem('preg_bag', JSON.stringify(state.bag));
    localStorage.setItem('preg_emer', JSON.stringify(state.emergency));
};

window.resetToLMP = () => {
    document.getElementById('manual-w').value = '';
    document.getElementById('manual-d').value = '';
    state.manualW = '';
    state.manualD = '';
    updateAll();
};

// טעינה ראשונית
document.getElementById('lmp-date').value = state.lmp;
document.getElementById('manual-w').value = state.manualW;
document.getElementById('manual-d').value = state.manualD;
updateAll();
