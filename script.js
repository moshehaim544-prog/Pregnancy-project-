lucide.createIcons();

// --- MASTER DATA ---
const MASTER_PROC = [
    { name: "עגלה + אמבטיה", price: 4800, shop: "בייביסטאר / מוצצים" },
    { name: "סלקל לרכב", price: 1100, shop: "שילב (בדיקת תקינות חובה)" },
    { name: "שידת החתלה", price: 1700, shop: "איקאה / נגריה בהזמנה" },
    { name: "מיטת תינוק + מזרן", price: 1500, shop: "עצמלה / בייביז" },
    { name: "משאבת חלב", price: 850, shop: "יד שרה או אמזון" },
    { name: "סט ביגוד ראשוני NB", price: 450, shop: "Next Online" },
    { name: "מזרן פעילות", price: 300, shop: "מינימו" }
];

const MASTER_MEDICAL = [
    { id: 1, name: "בדיקת דופק", week: 7, trim: 1, desc: "מפגש ראשון לראות שהכל תקין ויש דופק." },
    { id: 2, name: "שקיפות עורפית", week: 12, trim: 1, desc: "בדיקת אולטרסאונד למדידת עובי נוזל בעורף העובר." },
    { id: 3, name: "סקירת מערכות מוקדמת", week: 15, trim: 2, desc: "בדיקה מקיפה של כל איברי העובר." },
    { id: 4, name: "חלבון עוברי", week: 17, trim: 2, desc: "בדיקת דם סטטיסטית לזיהוי סיכונים." },
    { id: 5, name: "העמסת סוכר", week: 24, trim: 2, desc: "בדיקה לאיתור סוכרת הריון. מומלץ להביא לימון סחוט!" },
    { id: 6, name: "סקירה מאוחרת", week: 23, trim: 2, desc: "וידוא התפתחות תקינה של איברים בשלב מתקדם." },
    { id: 7, name: "הערכת משקל", week: 32, trim: 3, desc: "מעקב אחר קצב הגדילה של הבייבי." },
    { id: 8, name: "משטח GBS", week: 36, trim: 3, desc: "בדיקת נשאות לחיידק לקראת הלידה." }
];

const MASTER_BAGS = {
    inbar: ["חלוק רך", "מטען ארוך", "שפתון לחות", "כפכפי מקלחת", "בקבוק עם קשית", "חטיפי אנרגיה"],
    baby: ["בגד יציאה ראשון", "חיתולי NB", "שמיכת טטרה", "מוצץ NB", "כובע כותנה"]
};

const MASTER_EMER = [
    { name: "קופ\"ח - מוקד אחיות", num: "*2700" },
    { name: "איכילוב - מיון יולדות", num: "03-6973333" },
    { name: "שיבא - מיון יולדות", num: "03-5303030" },
    { name: "מרכז טרטולוגי", num: "02-6243669" }
];

// --- STATE ---
let state = JSON.parse(localStorage.getItem('journey_v6')) || {
    lmp: '', manualW: '', manualD: '',
    tasks: MASTER_MEDICAL.map(m => ({ ...m, done: false })),
    proc: [], bag: [], emer: MASTER_EMER
};

// --- AUTOMATION: LMP TO WEEKS ---
function handleLMPChange() {
    state.lmp = document.getElementById('lmp-date').value;
    if (state.lmp) {
        const diff = Math.floor((new Date() - new Date(state.lmp)) / (1000*60*60*24));
        state.manualW = Math.floor(diff / 7);
        state.manualD = diff % 7;
        document.getElementById('manual-w').value = state.manualW;
        document.getElementById('manual-d').value = state.manualD;
    }
    updateUI();
}

function handleManualChange() {
    state.manualW = document.getElementById('manual-w').value;
    state.manualD = document.getElementById('manual-d').value;
    updateUI();
}

// --- CORE UI ---
function updateUI() {
    let totalDays = 0;
    if (state.manualW !== '') {
        totalDays = (parseInt(state.manualW) * 7) + (parseInt(state.manualD) || 0);
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
    const f = { 4:"🌱 זרעון", 8:"🍓 פטל", 12:"🍋 לימון", 16:"🥑 אבוקדו", 20:"🍌 בננה", 24:"🌽 תירס", 30:"🎃 דלעת", 38:"🍉 אבטיח" };
    let key = Object.keys(f).reverse().find(k => w >= k) || 4;
    document.getElementById('fruit-emoji').innerText = f[key].split(' ')[0];
    document.getElementById('fruit-name').innerText = `הבייבי בגודל ${f[key].split(' ')[1]}`;
}

function renderTasks(currW) {
    [1,2,3].forEach(tr => {
        const container = document.getElementById(`list-${tr}`);
        container.innerHTML = state.tasks.filter(t => t.trim === tr).map(t => {
            const isLate = currW > t.week && !t.done;
            return `
                <div class="task-card ${isLate ? 'border-red-400 border-2' : ''}">
                    <input type="checkbox" class="w-5 h-5 accent-pink-500" ${t.done?'checked':''} onchange="toggleTask(${t.id})">
                    <div class="flex-1">
                        <p class="font-bold text-sm">${t.name}</p>
                        <p class="text-[10px] ${isLate?'text-red-600 font-black':'text-slate-400'}">שבוע ${t.week}</p>
                    </div>
                    <button onclick="showHelp('${t.name}','${t.desc}')" class="help-icon">?</button>
                    <button onclick="remove('tasks',${t.id})" class="text-slate-200 hover:text-red-400">✕</button>
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
            <tr class="border-b hover:bg-slate-50 transition-colors text-xs">
                <td class="p-4 font-black">${p.name}</td>
                <td class="p-4 text-slate-400">₪${p.price}</td>
                <td class="p-4">₪<input type="number" value="${p.real||0}" class="w-20 bg-emerald-50 rounded-lg p-1 font-bold" onchange="editReal(${i},this.value)"></td>
                <td class="p-4 text-[10px] italic text-slate-500">${p.shop}</td>
                <td class="p-4"><button onclick="remove('proc',${i})" class="text-slate-200 hover:text-red-400">✕</button></td>
            </tr>
        `;
    }).join('');
    document.getElementById('total-spent').innerText = `₪${total.toLocaleString()}`;
}

function renderBags() {
    ['inbar', 'baby'].forEach(type => {
        const list = state.bag.filter(b => b.target === type);
        document.getElementById(`bag-${type}`).innerHTML = list.map(b => `
            <div class="flex items-center gap-3 p-4 bg-white rounded-3xl shadow-sm text-sm border border-transparent hover:border-pink-200 transition-all">
                <input type="checkbox" class="accent-pink-500 w-4 h-4" ${b.done?'checked':''} onchange="toggleBag(${b.id})">
                <span class="flex-1 ${b.done?'line-through text-slate-300':''} font-medium">${b.name}</span>
                <button onclick="remove('bag',${b.id})" class="text-slate-200 hover:text-red-400">✕</button>
            </div>
        `).join('');
    });
}

function renderEmer() {
    document.getElementById('emergency-list').innerHTML = state.emer.map((e, i) => `
        <div class="card p-5 flex justify-between items-center bg-white group hover:border-emerald-200 transition-all">
            <div class="flex-1">
                <input type="text" value="${e.name}" class="font-black text-sm bg-transparent w-full outline-none" onchange="editEmer(${i},'name',this.value)">
                <input type="text" value="${e.num}" class="text-emerald-500 font-bold text-xs bg-transparent w-full outline-none" onchange="editEmer(${i},'num',this.value)">
            </div>
            <div class="flex gap-2">
                <a href="tel:${e.num}" class="p-3 bg-emerald-50 text-emerald-600 rounded-2xl"><i data-lucide="phone" class="w-4 h-4"></i></a>
                <button onclick="remove('emer',${i})" class="text-slate-200 group-hover:text-red-400">✕</button>
            </div>
        </div>
    `).join('');
    lucide.createIcons();
}

// --- ACTIONS ---
function addEmergencyItem() {
    state.emer.push({ name: "איש קשר חדש", num: "הזן מספר..." });
    updateUI();
}

function editEmer(i, key, val) { state.emer[i][key] = val; save(); }

function shareToWhatsApp() {
    const wStr = document.getElementById('display-weeks').innerText;
    const spent = document.getElementById('total-spent').innerText;
    const nextTask = state.tasks.find(t => !t.done);
    const bagLeft = state.bag.filter(b => !b.done).length;

    const msg = encodeURIComponent(
        `✨ *סיכום סטטוס הריון - ענבר ומשה* ✨\n\n` +
        `📅 *מצב נוכחי:* ${wStr}\n` +
        `⏳ *ימים ללידה:* ${document.getElementById('days-left').innerText}\n\n` +
        `🩺 *בדיקה קרובה:* ${nextTask ? nextTask.name : 'הכל בוצע!'}\n` +
        `💰 *תקציב שנוצל:* ${spent}\n` +
        `👜 *תיק לידה:* חסרים עוד ${bagLeft} פריטים\n\n` +
        `_נשלח מאפליקציית הניהול האישית שלנו_ 📱`
    );
    window.open(`https://wa.me/?text=${msg}`, '_blank');
}

// --- LOGIC HELPERS ---
let activeCtx = '';
function openSelector(ctx) {
    activeCtx = ctx;
    const s = document.getElementById('suggestion-select');
    s.innerHTML = '<option value="">-- בחר מרשימה --</option><option value="MANUAL">➕ הקלדה חופשית</option>';
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

function submitSelection() {
    const sel = document.getElementById('suggestion-select').value;
    const man = document.getElementById('manual-entry').value;
    let item;
    if (sel === 'MANUAL') item = { name: man, price: 0, shop: 'הקלדה ידנית', week: 20, trim: 2 };
    else if (sel) item = JSON.parse(sel);
    else return;
    if (activeCtx === 'proc') state.proc.push({ ...item, real: 0 });
    else if (activeCtx === 'task') state.tasks.push({ ...item, id: Date.now(), done: false, trim: item.trim || 2 });
    else state.bag.push({ id: Date.now(), name: item.name, target: activeCtx.split('-')[1], done: false });
    closeSelector(); updateUI();
}

function toggleManualInput(v) { document.getElementById('manual-input-container').classList.toggle('hidden', v !== 'MANUAL'); }
function closeSelector() { document.getElementById('selector-modal').classList.add('hidden'); document.getElementById('manual-entry').value = ''; }
function showHelp(t, d) { document.getElementById('help-title').innerText = t; document.getElementById('help-desc').innerText = d; document.getElementById('help-modal').classList.remove('hidden'); }
function toggleTask(id) { const t = state.tasks.find(x=>x.id===id); t.done=!t.done; updateUI(); }
function toggleBag(id) { const b = state.bag.find(x=>x.id===id); b.done=!b.done; updateUI(); }
function editReal(i, v) { state.proc[i].real = v; updateUI(); }
function remove(col, idOrIdx) {
    if (col === 'tasks') state.tasks = state.tasks.filter(x=>x.id!==idOrIdx);
    else if (col === 'bag') state.bag = state.bag.filter(x=>x.id!==idOrIdx);
    else state[col].splice(idOrIdx, 1);
    updateUI();
}
function save() { localStorage.setItem('journey_v6', JSON.stringify(state)); }
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

// Init
if(state.lmp) document.getElementById('lmp-date').value = state.lmp;
updateUI();
