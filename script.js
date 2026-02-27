lucide.createIcons();

// --- DATA REPOSITORIES ---
const MASTER_DATA = {
    tasks: [
        { name: "שקיפות עורפית", week: 11, desc: "אולטרסאונד המודד נוזל בעורף העובר לבדיקת תקינות כרומוזומלית." },
        { name: "סקירת מערכות מוקדמת", week: 14, desc: "אולטרסאונד מפורט לבדיקת כל איברי העובר שהתפתחו." },
        { name: "חלבון עוברי", week: 16, desc: "בדיקת דם המשלבת תוצאות לחישוב סיכון סטטיסטי." },
        { name: "העמסת סוכר 50 גרם", week: 24, desc: "בדיקת סקר לסוכרת הריון. מצריכה שתיית סוכר והמתנה של שעה." },
        { name: "סקירה מאוחרת", week: 22, desc: "בדיקה נוספת של איברי העובר בשלב מתקדם יותר." }
    ],
    proc: [
        { name: "עגלה + אמבטיה", price: 4000 },
        { name: "סלקל", price: 900 },
        { name: "שידה", price: 1500 },
        { name: "מיטת תינוק", price: 1200 },
        { name: "משאבת חלב", price: 600 },
        { name: "טרמפולינה", price: 400 }
    ],
    bagInbar: ["מטען ארוך", "שפתון לחות", "גרביים", "בקבוק מים", "חטיפי אנרגיה"],
    bagBaby: ["חיתולי NB", "מוצצים", "בגדי יציאה", "שמיכת טטרה"],
    books: [
        { title: "המדריך הישראלי להריון ולידה", author: "עמוס בר", type: "ספר" },
        { title: "הלוחשת לתינוקות", author: "טרייסי הוג", type: "ספר" },
        { title: "אפליקציית Wonder Weeks", author: "מעקב קפיצות גדילה", type: "כלי דיגיטלי" }
    ]
};

// --- STATE MANAGEMENT ---
let state = JSON.parse(localStorage.getItem('pregnancy_erp')) || {
    lmp: '', manualW: 0, manualD: 0,
    tasks: [], proc: [], bag: [], emergency: [],
    currentSelector: null
};

// Initial Sync for Tasks (Add defaults if empty)
if (state.tasks.length === 0) {
    state.tasks = MASTER_DATA.tasks.map((t, i) => ({ ...t, id: i, done: false }));
}

function updateUI() {
    const today = new Date();
    let totalDays = 0;
    
    if (state.manualW > 0 || state.manualD > 0) {
        totalDays = (parseInt(state.manualW) * 7) + (parseInt(state.manualD) || 0);
    } else if (state.lmp) {
        totalDays = Math.floor((today - new Date(state.lmp)) / (1000*60*60*24));
    }

    const weeks = Math.floor(totalDays / 7);
    const days = totalDays % 7;

    document.getElementById('display-weeks').innerText = `שבוע ${weeks} + ${days}`;
    
    if (state.lmp) {
        const dueDate = new Date(state.lmp);
        dueDate.setDate(dueDate.getDate() + 280);
        document.getElementById('due-date').innerText = dueDate.toLocaleDateString('he-IL');
        document.getElementById('zodiac-sign').innerText = getZodiac(dueDate);
    }

    renderTasks(weeks);
    renderProc();
    renderBags();
    renderEmergency();
    renderLearning();
    save();
}

// --- RENDER FUNCTIONS ---
function renderTasks(currentWeek) {
    const container = document.getElementById('tasks-container');
    container.innerHTML = state.tasks.sort((a,b) => a.week - b.week).map(t => {
        const isLate = currentWeek > t.week && !t.done;
        return `
            <div class="task-card ${isLate ? 'border-red-200 bg-red-50' : ''}">
                <input type="checkbox" ${t.done ? 'checked' : ''} onchange="toggleItem('tasks', ${t.id})">
                <div class="flex-1">
                    <p class="font-bold text-sm ${t.done ? 'line-through text-slate-400' : ''}">${t.name}</p>
                    <p class="text-[10px] ${isLate ? 'text-red-500 font-bold' : 'text-slate-400'}">שבוע מומלץ: ${t.week} ${isLate ? '(בדיקה בעיכוב!)' : ''}</p>
                </div>
                <button onclick="showHelp('${t.name}', '${t.desc}')" class="text-slate-300">?</button>
                <button onclick="removeItem('tasks', ${t.id})" class="text-slate-200 text-xs">✕</button>
            </div>
        `;
    }).join('');
}

function renderProc() {
    let total = 0;
    document.getElementById('proc-body').innerHTML = state.proc.map((p, i) => {
        total += Number(p.real || 0);
        return `
            <tr class="border-b border-slate-50">
                <td class="py-3 px-2 font-bold">${p.name}</td>
                <td class="text-slate-400">₪${p.price}</td>
                <td>₪<input type="number" value="${p.real || 0}" class="w-20 bg-emerald-50 rounded px-2" onchange="editRealPrice(${i}, this.value)"></td>
                <td class="text-center"><input type="checkbox" ${p.done ? 'checked' : ''} onchange="toggleItem('proc', ${i})"></td>
                <td><button onclick="removeItem('proc', ${i})" class="opacity-20 hover:opacity-100">✕</button></td>
            </tr>
        `;
    }).join('');
    document.getElementById('total-spent').innerText = `₪${total.toLocaleString()}`;
}

function renderBags() {
    ['inbar', 'baby'].forEach(type => {
        const list = state.bag.filter(b => b.target === type);
        document.getElementById(`bag-${type}`).innerHTML = list.map(b => `
            <div class="flex items-center gap-2 p-2 hover:bg-slate-50 rounded-lg">
                <input type="checkbox" ${b.done ? 'checked' : ''} onchange="toggleBagItem(${b.id})">
                <span class="text-xs flex-1">${b.name}</span>
                <button onclick="removeItem('bag', ${b.id})" class="text-slate-200">✕</button>
            </div>
        `).join('');
    });
}

function renderEmergency() {
    document.getElementById('emergency-list').innerHTML = state.emergency.map((e, i) => `
        <div class="card p-4 flex justify-between items-center bg-white">
            <div class="flex-1">
                <input type="text" value="${e.name}" class="block font-black text-xs bg-transparent w-full" onchange="editEmergency(${i}, 'name', this.value)">
                <input type="text" value="${e.num}" class="block text-pink-500 font-mono text-sm bg-transparent w-full" onchange="editEmergency(${i}, 'num', this.value)">
            </div>
            <div class="flex gap-3 items-center">
                <a href="tel:${e.num}" class="text-emerald-500"><i data-lucide="phone" class="w-5 h-5"></i></a>
                <button onclick="removeItem('emergency', ${i})" class="text-red-200 hover:text-red-500">✕</button>
            </div>
        </div>
    `).join('');
    lucide.createIcons();
}

function renderLearning() {
    document.getElementById('learning-list').innerHTML = MASTER_DATA.books.map(b => `
        <div class="flex gap-4 p-4 border rounded-2xl bg-white shadow-sm">
            <div class="text-2xl">${b.type === 'ספר' ? '📖' : '📱'}</div>
            <div>
                <p class="font-bold text-sm">${b.title}</p>
                <p class="text-xs text-slate-400">${b.author}</p>
            </div>
        </div>
    `).join('');
}

// --- SELECTOR MODAL LOGIC ---
function openSelector(type) {
    state.currentSelector = type;
    const modal = document.getElementById('selector-modal');
    const select = document.getElementById('suggestion-select');
    const extras = document.getElementById('modal-extra-fields');
    
    // Reset
    select.innerHTML = '<option value="">-- בחר מרעיונות קיימים --</option>';
    document.getElementById('manual-entry').value = '';
    extras.classList.add('hidden');
    
    let source = [];
    if (type === 'task') source = MASTER_DATA.tasks;
    if (type === 'proc') { source = MASTER_DATA.proc; extras.classList.remove('hidden'); }
    if (type === 'bag-inbar') source = MASTER_DATA.bagInbar;
    if (type === 'bag-baby') source = MASTER_DATA.bagBaby;
    
    source.forEach(item => {
        const option = document.createElement('option');
        option.value = typeof item === 'string' ? item : item.name;
        option.innerText = typeof item === 'string' ? item : `${item.name} (${item.week || '₪'+item.price})`;
        select.appendChild(option);
    });
    
    modal.classList.remove('hidden');
}

function submitSelection() {
    const type = state.currentSelector;
    const selectedVal = document.getElementById('suggestion-select').value;
    const manualVal = document.getElementById('manual-entry').value;
    const finalName = manualVal || selectedVal;
    
    if (!finalName) return;

    if (type === 'task') {
        const week = document.getElementById('extra-week').value || 0;
        state.tasks.push({ id: Date.now(), name: finalName, week: parseInt(week), done: false, desc: 'הוספה ידנית' });
    } else if (type === 'proc') {
        const price = document.getElementById('extra-price').value || 0;
        state.proc.push({ name: finalName, price: parseInt(price), real: 0, done: false });
    } else if (type.startsWith('bag')) {
        state.bag.push({ id: Date.now(), name: finalName, target: type.split('-')[1], done: false });
    }
    
    closeSelector();
    updateUI();
}

// --- ACTIONS & UTILS ---
function toggleItem(collection, idOrIdx) {
    if (collection === 'tasks') {
        const item = state.tasks.find(t => t.id === idOrIdx);
        item.done = !item.done;
    } else {
        state[collection][idOrIdx].done = !state[collection][idOrIdx].done;
    }
    updateUI();
}

function toggleBagItem(id) {
    const item = state.bag.find(b => b.id === id);
    item.done = !item.done;
    updateUI();
}

function removeItem(collection, idxOrId) {
    if (collection === 'tasks') {
        state.tasks = state.tasks.filter(t => t.id !== idxOrId);
    } else if (collection === 'bag') {
        state.bag = state.bag.filter(b => b.id !== idxOrId);
    } else {
        state[collection].splice(idxOrId, 1);
    }
    updateUI();
}

function addEmergencyItem() {
    state.emergency.push({ name: "איש קשר חדש", num: "05X-XXXXXXX" });
    updateUI();
}

function editEmergency(i, key, val) { state.emergency[i][key] = val; save(); }
function editRealPrice(i, val) { state.proc[i].real = val; updateUI(); }

function handleLMPChange() {
    state.lmp = document.getElementById('lmp-date').value;
    state.manualW = 0;
    state.manualD = 0;
    updateUI();
}

function handleManualChange() {
    state.manualW = document.getElementById('manual-w').value;
    state.manualD = document.getElementById('manual-d').value;
    updateUI();
}

function resetDates() {
    state.manualW = 0; state.manualD = 0;
    document.getElementById('manual-w').value = '';
    document.getElementById('manual-d').value = '';
    updateUI();
}

function showHelp(title, desc) {
    document.getElementById('help-title').innerText = title;
    document.getElementById('help-desc').innerText = desc || "אין תיאור זמין לבדיקה זו.";
    document.getElementById('help-modal').classList.remove('hidden');
}

function closeSelector() { document.getElementById('selector-modal').classList.add('hidden'); }

function getZodiac(date) {
    const day = date.getDate(), month = date.getMonth() + 1;
    if ((month == 3 && day >= 21) || (month == 4 && day <= 19)) return "טלה";
    if ((month == 4 && day >= 20) || (month == 5 && day <= 20)) return "שור";
    if ((month == 5 && day >= 21) || (month == 6 && day <= 20)) return "תאומים";
    if ((month == 6 && day >= 21) || (month == 7 && day <= 22)) return "סרטן";
    if ((month == 7 && day >= 23) || (month == 8 && day <= 22)) return "אריה";
    if ((month == 8 && day >= 23) || (month == 9 && day <= 22)) return "בתולה";
    if ((month == 9 && day >= 23) || (month == 10 && day <= 22)) return "מאזניים";
    if ((month == 10 && day >= 23) || (month == 11 && day <= 21)) return "עקרב";
    if ((month == 11 && day >= 22) || (month == 12 && day <= 21)) return "קשת";
    if ((month == 12 && day >= 22) || (month == 1 && day <= 19)) return "גדי";
    if ((month == 1 && day >= 20) || (month == 2 && day <= 18)) return "דלי";
    return "דגים";
}

function showTab(tab) {
    document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(`tab-${tab}`).classList.remove('hidden');
    document.getElementById(`btn-${tab}`).classList.add('active');
}

function save() { localStorage.setItem('pregnancy_erp', JSON.stringify(state)); }

// Init
document.getElementById('lmp-date').value = state.lmp;
updateUI();
