lucide.createIcons();

// --- MASTER DATA ---
const MASTER_PROC = [
    { name: "עגלה + אמבטיה", price: 4500, shop: "בייביסטאר" },
    { name: "סלקל לרכב", price: 950, shop: "שילב / מוצצים" },
    { name: "שידת החתלה", price: 1600, shop: "איקאה / נגרייה" },
    { name: "מיטת תינוק", price: 1200, shop: "בייביז" },
    { name: "משאבת חלב", price: 800, shop: "יד שרה (השאלה)" },
    { name: "חבילת ביגוד NB", price: 400, shop: "Next Online" }
];

const MASTER_MEDICAL = [
    { id: 1, name: "דופק ראשוני", week: 7, trim: 1, desc: "בדיקת אולטרסאונד ראשונה לראות דופק." },
    { id: 2, name: "שקיפות עורפית", week: 12, trim: 1, desc: "בדיקה לסריקת עובי נוזל בעורף." },
    { id: 3, name: "סקירה מוקדמת", week: 15, trim: 2, desc: "בדיקת איברים מפורטת." },
    { id: 4, name: "העמסת סוכר", week: 24, trim: 2, desc: "בדיקה לסוכרת הריון." },
    { id: 5, name: "סקירה מאוחרת", week: 23, trim: 2, desc: "וידוא תקינות איברים בשלב מתקדם." },
    { id: 6, name: "הערכת משקל", week: 32, trim: 3, desc: "מעקב גדילה שגרתי." }
];

const MASTER_BAGS = {
    inbar: ["שפתון לחות", "מטען ארוך", "בקבוק מים עם קשית", "חלוק רך", "חטיפים"],
    baby: ["בגד יציאה", "חיתולי NB", "שמיכת טטרה", "כובע כותנה"]
};

const MASTER_EMER = [
    { name: "קופ\"ח - מוקד אחיות", num: "*2700" },
    { name: "איכילוב - יולדות", num: "036973333" },
    { name: "שיבא - יולדות", num: "035303030" },
    { name: "מד\"א", num: "101" }
];

// --- APP STATE ---
let state = JSON.parse(localStorage.getItem('journey_v5')) || {
    lmp: '', manualW: '', manualD: '',
    tasks: MASTER_MEDICAL.map(m => ({ ...m, done: false })),
    proc: [],
    bag: [],
    emer: MASTER_EMER
};

// --- CORE LOGIC ---
function updateUI() {
    const today = new Date();
    let totalDays = 0;
    
    if (state.manualW !== '') {
        totalDays = (parseInt(state.manualW) * 7) + (parseInt(state.manualD) || 0);
    } else if (state.lmp) {
        totalDays = Math.floor((today - new Date(state.lmp)) / (1000*60*60*24));
    }

    const w = Math.floor(totalDays / 7);
    const d = totalDays % 7;

    document.getElementById('display-weeks').innerText = `שבוע ${w} + ${d} ימים`;
    document.getElementById('days-left').innerText = Math.max(0, 280 - totalDays);

    if (state.lmp) {
        const dd = new Date(state.lmp); dd.setDate(dd.getDate() + 280);
        document.getElementById('due-date').innerText = dd.toLocaleDateString('he-IL');
        document.getElementById('zodiac-sign').innerText = getZodiac(dd);
    }

    renderFruits(w);
    renderTasks(w);
    renderProc();
    renderBags();
    renderEmer();
    save();
}

function renderFruits(w) {
    const f = { 4:"🌱 זרעון", 9:"🍓 פטל", 12:"🍋 לימון", 16:"🥑 אבוקדו", 20:"🍌 בננה", 24:"🌽 תירס", 32:"🎃 דלעת", 40:"🍉 אבטיח" };
    let key = Object.keys(f).reverse().find(k => w >= k) || 4;
    document.getElementById('fruit-emoji').innerText = f[key].split(' ')[0];
    document.getElementById('fruit-name').innerText = `בגודל ${f[key].split(' ')[1]}`;
}

function renderTasks(currW) {
    [1,2,3].forEach(tr => {
        const container = document.getElementById(`list-${tr}`);
        container.innerHTML = state.tasks.filter(t => t.trim === tr).map(t => {
            const isLate = currW > t.week && !t.done;
            return `
                <div class="task-card ${isLate ? 'border-red-200 bg-red-50' : ''}">
                    <input type="checkbox" ${t.done?'checked':''} onchange="toggleTask(${t.id})">
                    <div class="flex-1">
                        <p class="font-bold text-xs">${t.name}</p>
                        <p class="text-[9px] ${isLate?'text-red-600 font-black':'text-slate-400'}">שבוע ${t.week}</p>
                    </div>
                    <button onclick="remove('tasks',${t.id})" class="text-slate-200">✕</button>
                </div>
            `;
        }).join('');
    });
}

function renderProc() {
    let total = 0;
    document.getElementById('proc-body').innerHTML = state.proc.map((p, i) => {
        total += Number(p.real || 0);
        return `
            <tr class="border-b text-xs">
                <td class="p-4 font-bold">${p.name}</td>
                <td class="p-4 text-slate-400 italic">₪${p.price}</td>
                <td class="p-4">₪<input type="number" value="${p.real||0}" class="w-16 bg-emerald-50 rounded px-1" onchange="editReal(${i},this.value)"></td>
                <td class="p-4 text-[10px] text-slate-500">${p.shop}</td>
                <td class="p-4"><button onclick="remove('proc',${i})" class="text-slate-200">✕</button></td>
            </tr>
        `;
    }).join('');
    document.getElementById('total-spent').innerText = `₪${total.toLocaleString()}`;
}

function renderBags() {
    ['inbar', 'baby'].forEach(type => {
        const list = state.bag.filter(b => b.target === type);
        document.getElementById(`bag-${type}`).innerHTML = list.map(b => `
            <div class="flex items-center gap-2 p-3 bg-white/80 rounded-2xl shadow-sm text-xs">
                <input type="checkbox" ${b.done?'checked':''} onchange="toggleBag(${b.id})">
                <span class="flex-1 ${b.done?'line-through text-slate-400':''}">${b.name}</span>
                <button onclick="remove('bag',${b.id})" class="text-slate-200">✕</button>
            </div>
        `).join('');
    });
}

function renderEmer() {
    document.getElementById('emergency-list').innerHTML = state.emer.map((e, i) => `
        <div class="card p-4 flex justify-between items-center bg-white">
            <div>
                <p class="font-black text-xs text-slate-600">${e.name}</p>
                <p class="text-emerald-500 font-mono font-bold">${e.num}</p>
            </div>
            <div class="flex gap-2">
                <a href="tel:${e.num}" class="p-2 bg-emerald-50 text-emerald-600 rounded-full"><i data-lucide="phone" class="w-4 h-4"></i></a>
                <button onclick="remove('emer',${i})" class="text-slate-200">✕</button>
            </div>
        </div>
    `).join('');
    lucide.createIcons();
}

// --- WHATSAPP SHARING ---
function shareToWhatsApp() {
    const wStr = document.getElementById('display-weeks').innerText;
    const due = document.getElementById('due-date').innerText;
    const spent = document.getElementById('total-spent').innerText;
    
    let nextTask = state.tasks.find(t => !t.done) || {name: "הכל הושלם!"};
    let missingBag = state.bag.filter(b => !b.done).length;

    const text = encodeURIComponent(
        `*סיכום המסע שלנו:* \n` +
        `📍 אנחנו ב: ${wStr}\n` +
        `📅 תאריך לידה משוער: ${due}\n\n` +
        `🩺 הבדיקה הבאה: ${nextTask.name}\n` +
        `💰 תקציב שנוצל עד כה: ${spent}\n` +
        `👜 חוסרים בתיק לידה: עוד ${missingBag} פריטים\n\n` +
        `_נשלח מאפליקציית הניהול האישית שלנו_`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
}

// --- HELPERS ---
let activeCtx = '';
function openSelector(ctx) {
    activeCtx = ctx;
    const s = document.getElementById('suggestion-select');
    s.innerHTML = '<option value="">-- בחר מרשימה או ידני --</option><option value="MANUAL">➕ הקלדה חופשית</option>';
    
    let list = [];
    if(ctx === 'proc') list = MASTER_PROC;
    else if(ctx === 'task') list = MASTER_MEDICAL;
    else list = MASTER_BAGS[ctx.split('-')[1]].map(name => ({name}));

    list.forEach(item => {
        const o = document.createElement('option');
        o.value = JSON.stringify(item);
        o.innerText = item.name + (item.price ? ` (כ-₪${item.price})` : '');
        s.appendChild(o);
    });
    document.getElementById('selector-modal').classList.remove('hidden');
}

function toggleManualInput(val) {
    document.getElementById('manual-input-container').classList.toggle('hidden', val !== 'MANUAL');
}

function submitSelection() {
    const sel = document.getElementById('suggestion-select').value;
    const man = document.getElementById('manual-entry').value;
    let item;

    if (sel === 'MANUAL') item = { name: man, price: 0, shop: 'ידני', week: 20, trim: 2 };
    else if (sel) item = JSON.parse(sel);
    else return;

    if (activeCtx === 'proc') state.proc.push({ ...item, real: 0 });
    else if (activeCtx === 'task') state.tasks.push({ ...item, id: Date.now(), done: false, trim: item.trim || 2 });
    else state.bag.push({ id: Date.now(), name: item.name, target: activeCtx.split('-')[1], done: false });

    closeSelector();
    updateUI();
}

function closeSelector() { 
    document.getElementById('selector-modal').classList.add('hidden');
    document.getElementById('manual-entry').value = '';
}

function toggleTask(id) { const t = state.tasks.find(x=>x.id===id); t.done=!t.done; updateUI(); }
function toggleBag(id) { const b = state.bag.find(x=>x.id===id); b.done=!b.done; updateUI(); }
function editReal(i, v) { state.proc[i].real = v; updateUI(); }
function remove(col, idOrIdx) {
    if (col === 'tasks') state.tasks = state.tasks.filter(x=>x.id!==idOrIdx);
    else if (col === 'bag') state.bag = state.bag.filter(x=>x.id!==idOrIdx);
    else state[col].splice(idOrIdx, 1);
    updateUI();
}
function handleLMPChange() { state.lmp = document.getElementById('lmp-date').value; state.manualW = ''; updateUI(); }
function handleManualChange() { state.manualW = document.getElementById('manual-w').value; state.manualD = document.getElementById('manual-d').value; updateUI(); }
function resetToLMP() { state.manualW = ''; updateUI(); }
function save() { localStorage.setItem('journey_v5', JSON.stringify(state)); }
function getZodiac(d) {
    const day = d.getDate(), month = d.getMonth() + 1;
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
function showTab(t) {
    document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(`tab-${t}`).classList.remove('hidden');
    document.getElementById(`btn-${t}`).classList.add('active');
}

document.getElementById('lmp-date').value = state.lmp;
updateUI();
