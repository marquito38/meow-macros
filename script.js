const { useState, useEffect, useMemo, useRef } = React;

// --- CONSTANTS ---
const GOALS = { calories: 1645, carbs: 160, protein: 150, fat: 45, fiber: 38 };
const USER_WEIGHT_KG = 73; 
const BASE_BMR = 1600;

// MIAMI RECOMP WORKOUT DATA (v3.5 Alignment)
const WORKOUTS = {
    A: {
        name: "Workout A (Push Focus)",
        exercises: [
            { name: "DB Incline Bench", sets: 3, target: "3 x 6-8" },
            { name: "DB Goblet Squats", sets: 3, target: "3 x 8-10" },
            { name: "Lateral Raises", sets: 4, target: "4 x 12-15" },
            { name: "Tricep Ext.", sets: 3, target: "3 x 10-12" }
        ]
    },
    B: {
        name: "Workout B (Pull Focus)",
        exercises: [
            { name: "DB Romanian DL", sets: 3, target: "3 x 6-8" },
            { name: "Row/Pulldown", sets: 3, target: "3 x 8-10" },
            { name: "Rear Delt Fly", sets: 3, target: "3 x 15" },
            { name: "Bicep Curls", sets: 3, target: "3 x 10-12" }
        ]
    }
};

const STARTER_LIBRARY = [
    { id: '1', name: 'Egg Whites', carbs: 0, protein: 11.7, fat: 0, fiber: 0, measure: 'g' },
    { id: '2', name: 'Greek Yogurt', carbs: 3.5, protein: 9.4, fat: 0, fiber: 0, measure: 'g' },
    { id: '3', name: 'Banana', carbs: 23, protein: 1, fat: 0.3, fiber: 2.6, measure: 'g' },
    { id: '4', name: 'Whole Egg', carbs: 0.6, protein: 6, fat: 5, fiber: 0, measure: 'unit' }, 
    { id: '5', name: 'Salmon (Raw)', carbs: 0, protein: 22, fat: 12, fiber: 0, measure: 'g' },
    { id: '6', name: 'Garbanzo Beans', carbs: 17, protein: 5, fat: 1.5, fiber: 5, measure: 'g' }, 
    { id: '7', name: 'Corn', carbs: 7, protein: 0.8, fat: 0.4, fiber: 2, measure: 'g' }, 
    { id: '8', name: 'Mixed Berries', carbs: 9, protein: 0.5, fat: 0, fiber: 3, measure: 'g' },
    { id: '9', name: 'Avocado', carbs: 8.5, protein: 2, fat: 14.7, fiber: 6.7, measure: 'g' },
    { id: '10', name: 'Chicken Breast', carbs: 0, protein: 31, fat: 3.6, fiber: 0, measure: 'g' }
];

const MOTIVATION_QUOTES = ["You're doing great! 🐾", "So strong! 💪", "Keep shining! ✨", "Pawsome work! 😻", "Believe in the meow! ⭐"];

// --- HELPERS ---

const getLocalYMD = () => {
    const now = new Date();
    const local = new Date(now.getTime() - (now.getTimezoneOffset() * 60000));
    return local.toISOString().split('T')[0];
};

const calcCals = (c, p, f) => Math.round((c * 4) + (p * 4) + (f * 9));

// --- COMPONENTS ---
const CatGif = ({ type, className }) => {
    // Reliable GitHub-hosted animated cat
    const gifUrl = "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Animals/Cat%20Face.png";
    const fallbacks = { swat: "🐾", happy: "😻", sleep: "💤", workout: "🏋️‍♀️" };
    
    const [error, setError] = useState(false);
    
    if (error) return <span className={`flex items-center justify-center text-4xl ${className}`}>{fallbacks[type] || '🐱'}</span>;
    return <img src={gifUrl} alt="Mochi Cat" className={`object-contain ${className}`} onError={() => setError(true)} />;
};

const CatPawSwat = ({ trigger }) => {
    if (!trigger) return null;
    return <div className="fixed top-1/2 left-0 w-full pointer-events-none z-[60] flex items-center justify-center animate-swat"><CatGif type="swat" className="w-64 h-64 drop-shadow-2xl" /></div>;
};

const SuccessModal = ({ isOpen, onClose, title, message, subtext }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[70] bg-blue-100/80 backdrop-blur-sm flex items-center justify-center p-6 animate-pop" onClick={onClose}>
            <div className="text-center bg-white p-8 rounded-[2.5rem] shadow-2xl w-full max-w-sm border-4 border-blue-100" onClick={e => e.stopPropagation()}>
                <CatGif type="workout" className="w-40 h-40 mx-auto mb-4" />
                <h2 className="text-2xl font-black text-blue-400 mb-2">{title}</h2>
                <p className="text-lg text-slate-500 mb-6 font-bold">"{message}"</p>
                {subtext && <div className="bg-blue-50 rounded-2xl p-4 mb-8 text-blue-600 font-bold">{subtext}</div>}
                <button onClick={onClose} className="w-full bg-blue-300 text-white py-4 rounded-2xl font-black uppercase shadow-lg shadow-blue-200 hover:bg-blue-400 active:scale-95 transition-transform">Continue!</button>
            </div>
        </div>
    );
};

const ProgressBar = ({ current, max, colorClass, label, reverse = false }) => {
    const pct = Math.min(100, Math.max(0, (current / max) * 100));
    const remaining = reverse ? max - current : current;
    const isOver = reverse && current > max;
    const displayVal = `${Math.round(current)}g / ${max}g`;
    
    return (
        <div className="flex flex-col w-full mb-3">
            <div className="flex justify-between text-xs font-black mb-1 text-slate-400 uppercase tracking-wide">
                <span>{label}</span>
                <span className={isOver ? 'text-red-400' : 'text-slate-500'}>{displayVal}</span>
            </div>
            <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-50">
                <div className={`h-full transition-all duration-1000 ${colorClass} ${isOver ? 'bg-red-300' : ''}`} style={{ width: `${pct}%`, borderRadius: '999px' }}></div>
            </div>
        </div>
    );
};

// --- MAIN APP ---
function App() {
    const [view, setView] = useState('home');
    const [data, setData] = useState({ history: {}, fitnessHistory: {}, library: STARTER_LIBRARY, settings: { apiKey: '' } });
    const [date, setDate] = useState(getLocalYMD());
    
    // UI State
    const [modalOpen, setModalOpen] = useState(false);
    const [finishModalOpen, setFinishModalOpen] = useState(false);
    const [successModalData, setSuccessModalData] = useState(null); 
    const [swatTrigger, setSwatTrigger] = useState(false);
    const [viewHistoryItem, setViewHistoryItem] = useState(null);
    
    // Inputs
    const [editFood, setEditFood] = useState({ name: '', weight: 100, carbs: 0, protein: 0, fat: 0, fiber: 0, category: 'Snack', measure: 'g' });
    const [selectedBaseItem, setSelectedBaseItem] = useState(null);

    const [isLibraryEditMode, setIsLibraryEditMode] = useState(false);
    const [baseEditValues, setBaseEditValues] = useState({});

    const [librarySearch, setLibrarySearch] = useState('');
    const [isNew, setIsNew] = useState(true);
    const [activeRoutine, setActiveRoutine] = useState('A');
    const [workoutDuration, setWorkoutDuration] = useState(40);
    const [workoutInputs, setWorkoutInputs] = useState({});
    const [timers, setTimers] = useState({});

    const calorieChartRef = useRef(null);
    const volumeChartRef = useRef(null);
    const timerRef = useRef(null);

    // Event Delegation for Sticky "0"
    useEffect(() => {
        const handleFocus = (e) => {
            if (e.target.tagName === 'INPUT' && e.target.type === 'number' && e.target.value === '0') {
                e.target.value = '';
            }
        };
        const handleBlur = (e) => {
            if (e.target.tagName === 'INPUT' && e.target.type === 'number' && e.target.value === '') {
                e.target.value = '0';
            }
        };
        document.addEventListener('focus', handleFocus, true);
        document.addEventListener('blur', handleBlur, true);
        return () => {
            document.removeEventListener('focus', handleFocus, true);
            document.removeEventListener('blur', handleBlur, true);
        };
    }, []);

    // Date Reset Check
    useEffect(() => {
        const checkDateReset = () => {
            const currentLocal = getLocalYMD();
            if (currentLocal !== date) setDate(currentLocal);
        };
        checkDateReset();
        window.addEventListener('focus', checkDateReset);
        return () => window.removeEventListener('focus', checkDateReset);
    }, [date]);

    // Data Persistence
    useEffect(() => {
        const saved = localStorage.getItem('meow_data_v10');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (!parsed.history) parsed.history = {};
                if (!parsed.fitnessHistory) parsed.fitnessHistory = {};
                if (!parsed.library) parsed.library = STARTER_LIBRARY;
                setData(parsed);
            } catch (e) { console.error("Data parse error", e); }
        } else {
            const old = localStorage.getItem('meow_data_v9');
            if(old) setData(JSON.parse(old));
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('meow_data_v10', JSON.stringify(data));
    }, [data]);

    // Timer Loop
    useEffect(() => {
        timerRef.current = setInterval(() => {
            setTimers(prev => {
                const next = { ...prev };
                let changed = false;
                Object.keys(next).forEach(k => { if (next[k] > 0) { next[k]--; changed = true; } });
                return changed ? next : prev;
            });
        }, 1000);
        return () => clearInterval(timerRef.current);
    }, []);

    // Derived Calculations
    const todayLog = data.history[date] || [];
    const todayWorkouts = data.fitnessHistory[date] || [];
    const totals = todayLog.reduce((acc, item) => ({
        c: acc.c + item.c, p: acc.p + item.p, f: acc.f + item.f, fib: acc.fib + item.fib
    }), { c: 0, p: 0, f: 0, fib: 0 });
    
    const totalEatenCals = calcCals(totals.c, totals.p, totals.f);
    const totalBurnedCals = todayWorkouts.reduce((acc, w) => acc + w.calories, 0);
    const adjustedCalorieGoal = GOALS.calories + totalBurnedCals;
    const remainingCals = adjustedCalorieGoal - totalEatenCals;

    const formatLastLog = (exName) => {
        const dates = Object.keys(data.fitnessHistory).sort().reverse();
        for (const d of dates) {
            const sessions = data.fitnessHistory[d];
            for (const s of sessions) {
                if (s.exercises && s.exercises[exName]) {
                    const entry = s.exercises[exName];
                    if (Array.isArray(entry)) return "Last: " + entry.map(set => `${set.weight}x${set.reps}`).join(", ");
                    else if (entry.weight) return `Last: ${entry.weight}x${entry.reps}`;
                }
            }
        }
        return "New!";
    };

    const sortLibrary = (lib) => {
        if (!Array.isArray(lib)) return [];
        return [...lib].sort((a, b) => {
            const aLast = a.lastUsed || 0;
            const bLast = b.lastUsed || 0;
            if (bLast !== aLast) return bLast - aLast; 
            return (a.name || "").localeCompare(b.name || ""); 
        });
    };

    const handleWeightChange = (val) => {
        const newWeight = Number(val);
        if (selectedBaseItem) {
            const baseAmount = selectedBaseItem.measure === 'unit' ? 1 : 100;
            const ratio = newWeight / baseAmount;
            setEditFood({
                ...editFood, weight: newWeight,
                carbs: parseFloat((selectedBaseItem.carbs * ratio).toFixed(1)),
                protein: parseFloat((selectedBaseItem.protein * ratio).toFixed(1)),
                fat: parseFloat((selectedBaseItem.fat * ratio).toFixed(1)),
                fiber: parseFloat((selectedBaseItem.fiber * ratio).toFixed(1))
            });
        } else setEditFood({ ...editFood, weight: newWeight });
    };

    const handleAddFood = () => {
        const newEntry = {
            id: Date.now(), name: editFood.name, weight: editFood.weight, measure: editFood.measure,
            c: editFood.carbs, p: editFood.protein, f: editFood.fat, fib: editFood.fiber, category: editFood.category
        };
        let newLib = [...data.library];
        const existingIdx = newLib.findIndex(i => i.name === editFood.name);
        if (existingIdx >= 0) {
            newLib[existingIdx] = { ...newLib[existingIdx], lastUsed: Date.now(), lastAmount: editFood.weight };
        } else {
            newLib.push({ ...editFood, id: Date.now().toString(), lastUsed: Date.now() });
        }
        setData({ 
            ...data, 
            history: { ...data.history, [date]: [newEntry, ...(data.history[date] || [])] },
            library: newLib
        });
        setModalOpen(false);
        setSwatTrigger(true);
        setTimeout(() => setSwatTrigger(false), 1200);
    };

    const openAddFood = (item = null) => {
        setIsLibraryEditMode(false);
        if (item) {
            const startWeight = item.lastAmount || (item.measure === 'unit' ? 1 : 100);
            const baseAmount = item.measure === 'unit' ? 1 : 100;
            const ratio = startWeight / baseAmount;
            setEditFood({ 
                ...item, weight: startWeight,
                carbs: parseFloat((item.carbs * ratio).toFixed(1)),
                protein: parseFloat((item.protein * ratio).toFixed(1)),
                fat: parseFloat((item.fat * ratio).toFixed(1)),
                fiber: parseFloat((item.fiber * ratio).toFixed(1)),
                measure: item.measure || 'g' 
            });
            setSelectedBaseItem(item); setIsNew(false);
        } else {
            setEditFood({ name: '', weight: 100, carbs: 0, protein: 0, fat: 0, fiber: 0, category: 'Snack', measure: 'g' });
            setSelectedBaseItem(null); setIsNew(true);
        }
        setModalOpen(true);
    };

    const handleStartEditLibrary = () => {
        const isUnit = selectedBaseItem.measure === 'unit';
        setBaseEditValues({
            ...selectedBaseItem, measureType: isUnit ? 'unit' : 'g', servingSize: isUnit ? 1 : 100
        });
        setIsLibraryEditMode(true);
    };

    const handleSaveLibraryEdit = () => {
        let updatedItem = { ...selectedBaseItem, name: baseEditValues.name };
        if (baseEditValues.measureType === 'unit') {
            updatedItem = { ...updatedItem, measure: 'unit', carbs: Number(baseEditValues.carbs), protein: Number(baseEditValues.protein), fat: Number(baseEditValues.fat), fiber: Number(baseEditValues.fiber) };
        } else {
            const serving = Number(baseEditValues.servingSize) || 100;
            const ratio = 100 / serving;
            updatedItem = { ...updatedItem, measure: 'g', carbs: parseFloat((Number(baseEditValues.carbs) * ratio).toFixed(1)), protein: parseFloat((Number(baseEditValues.protein) * ratio).toFixed(1)), fat: parseFloat((Number(baseEditValues.fat) * ratio).toFixed(1)), fiber: parseFloat((Number(baseEditValues.fiber) * ratio).toFixed(1)) };
        }
        const newLib = data.library.map(i => i.id === updatedItem.id ? updatedItem : i);
        setData({...data, library: newLib});
        setSelectedBaseItem(updatedItem);
        const baseAmount = updatedItem.measure === 'unit' ? 1 : 100;
        const calcRatio = editFood.weight / baseAmount;
        setEditFood({
            ...editFood, name: updatedItem.name,
            carbs: parseFloat((updatedItem.carbs * calcRatio).toFixed(1)),
            protein: parseFloat((updatedItem.protein * calcRatio).toFixed(1)),
            fat: parseFloat((updatedItem.fat * calcRatio).toFixed(1)),
            fiber: parseFloat((updatedItem.fiber * calcRatio).toFixed(1)),
            measure: updatedItem.measure
        });
        setIsLibraryEditMode(false);
    };

    const handleFinishWorkout = () => {
        const duration = parseInt(workoutDuration) || 0;
        const burned = duration * 6;
        const workoutLog = { id: Date.now(), routine: activeRoutine, duration: duration, calories: burned, exercises: JSON.parse(JSON.stringify(workoutInputs)) };
        setData({ ...data, fitnessHistory: { ...data.fitnessHistory, [date]: [workoutLog, ...(data.fitnessHistory[date] || [])] } });
        setWorkoutInputs({}); setFinishModalOpen(false);
        setSuccessModalData({ title: "Nice Work!", message: MOTIVATION_QUOTES[Math.floor(Math.random() * MOTIVATION_QUOTES.length)], subtext: <div className="text-center"><p className="text-sm font-bold uppercase text-blue-400">Calories Burned</p><p className="text-4xl font-black text-blue-500">{burned}</p></div> });
    };

    const handleDeleteWorkout = (logId, logDate) => {
        if(confirm("Remove this workout?")) {
            const dayLogs = data.fitnessHistory[logDate].filter(l => l.id !== logId);
            setData({ ...data, fitnessHistory: { ...data.fitnessHistory, [logDate]: dayLogs } });
        }
    };

    const renderTrends = () => {
        try {
            const history = data.history || {};
            const fitnessHistory = data.fitnessHistory || {};
            if (!Object.keys(history).length && !Object.keys(fitnessHistory).length) {
                 return (
                    <div className="pb-20 safe-pb space-y-6 flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
                        <h2 className="text-2xl font-black text-blue-300 mb-2">No Data Yet</h2>
                        <div className="kawaii-card p-6 w-full text-center">
                            <p className="text-slate-400 mb-2">The charts are empty! 😿</p>
                            <p className="text-sm text-blue-300">Start logging to see your progress.</p>
                        </div>
                    </div>
                 );
            }
            const pastWorkouts = Object.entries(fitnessHistory).flatMap(([d, logs]) => Array.isArray(logs) ? logs.map(l => ({ date: d, ...l })) : []).sort((a, b) => b.id - a.id).slice(0, 10);
            return (
                <div className="pb-20 safe-pb space-y-6">
                    <h2 className="text-2xl font-black text-blue-400 text-center">Weekly Trends</h2>
                    <div className="kawaii-card p-4 h-64"><h3 className="text-xs font-black text-slate-400 uppercase mb-2">Calories (In vs Out)</h3><div className="h-52"><canvas id="calChart"></canvas></div></div>
                    <div className="kawaii-card p-4 h-64"><h3 className="text-xs font-black text-slate-400 uppercase mb-2">Volume Lifted</h3><div className="h-52"><canvas id="volChart"></canvas></div></div>
                    <div className="space-y-3">
                        <h3 className="font-bold text-slate-400 text-sm ml-2">Recent Missions</h3>
                        {pastWorkouts.length === 0 ? <p className="text-xs text-slate-400 ml-2">No missions recorded.</p> : pastWorkouts.map(w => {
                            let vol = 0;
                            if (w.exercises) Object.values(w.exercises).forEach(sets => { if (Array.isArray(sets)) sets.forEach(s => vol += (Number(s.weight)||0)*(Number(s.reps)||0)); });
                            const routineName = WORKOUTS[w.routine]?.name || "Unknown Mission";
                            return (
                                <div key={w.id} onClick={() => setViewHistoryItem(w)} className="kawaii-card p-4 border-l-4 border-blue-300 shadow-sm cursor-pointer hover:bg-blue-50 transition-colors">
                                    <div className="flex justify-between items-start">
                                        <div><p className="font-bold text-slate-600 text-sm">{routineName}</p><span className="text-[10px] text-slate-400">{w.date}</span><p className="text-xs font-bold text-blue-400">{w.calories} kcal</p><p className="text-[10px] text-slate-400 mt-1">Vol: <span className="font-black text-slate-600">{vol.toLocaleString()} lbs</span></p></div>
                                        <button onClick={(e) => { e.stopPropagation(); handleDeleteWorkout(w.id, w.date); }} className="text-slate-300 hover:text-red-400 p-2"><span className="material-icons-round text-lg">delete</span></button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            );
        } catch (error) {
            console.error("Trends Page Crash:", error);
            return <div className="flex flex-col items-center justify-center min-h-[80vh] p-6 text-center"><h2 className="text-2xl font-black text-slate-600 mb-4">Error 😿</h2><button onClick={() => { localStorage.clear(); window.location.reload(); }} className="bg-red-400 text-white py-4 px-8 font-bold uppercase rounded-2xl shadow-lg">Reset Data</button></div>;
        }
    };

    useEffect(() => {
        if (view === 'trends') {
            try {
                if (calorieChartRef.current) calorieChartRef.current.destroy();
                if (volumeChartRef.current) volumeChartRef.current.destroy();
                Chart.defaults.color = '#94a3b8'; Chart.defaults.borderColor = '#f1f5f9'; Chart.defaults.font.family = "'Nunito', sans-serif";
                const labels = []; const calsIn = []; const calsOut = []; const volumeData = [];
                const history = data.history || {}; const fitnessHistory = data.fitnessHistory || {};
                for (let i=6; i>=0; i--) {
                    const d = new Date(); d.setDate(d.getDate() - i); const k = d.toISOString().split('T')[0];
                    labels.push(d.toLocaleDateString('en-US', {weekday:'short'}));
                    const log = history[k] || []; const fit = fitnessHistory[k] || [];
                    const dayIn = log.reduce((s, x) => s + calcCals(x.c,x.p,x.f), 0);
                    const dayBurn = fit.reduce((s, x) => s + x.calories, 0);
                    calsIn.push(dayIn); calsOut.push(BASE_BMR + dayBurn);
                    let dayVol = 0;
                    fit.forEach(sess => { if (sess.exercises) Object.values(sess.exercises).forEach(sets => { if(Array.isArray(sets)) sets.forEach(s => dayVol += (s.weight || 0) * (s.reps || 0)); }); });
                    volumeData.push(dayVol);
                }
                const calCanvas = document.getElementById('calChart'); const volCanvas = document.getElementById('volChart');
                if (calCanvas) calorieChartRef.current = new Chart(calCanvas, { type: 'bar', data: { labels, datasets: [ { label: 'In', data: calsIn, backgroundColor: '#93c5fd', borderRadius: 6 }, { label: 'Out', data: calsOut, backgroundColor: '#fed7aa', borderRadius: 6 } ] }, options: { responsive: true, maintainAspectRatio: false, scales: { x: { stacked: false }, y: { beginAtZero: true } } } });
                if (volCanvas) volumeChartRef.current = new Chart(volCanvas, { type: 'line', data: { labels, datasets: [{ label: 'Volume', data: volumeData, borderColor: '#74c0fc', backgroundColor: 'rgba(165, 216, 255, 0.2)', tension: 0.4, fill: true, pointBackgroundColor: '#fff', pointBorderColor: '#74c0fc', pointRadius: 4 }] }, options: { responsive: true, maintainAspectRatio: false } });
            } catch (err) { console.error("Chart Error:", err); }
        }
    }, [view, data]);

    const renderHome = () => (
        <div className="space-y-6 pb-20 safe-pb">
            <div className="flex justify-between items-center mb-2 px-2">
                <div className="flex items-center gap-3"><CatGif type="happy" className="w-12 h-12" /><h1 className="text-2xl font-black text-blue-400 tracking-tight">Meow Macros</h1></div>
            </div>
            <div className="kawaii-card p-6 relative overflow-hidden">
                <div className="flex justify-between items-end mb-6 relative z-10">
                    <div><h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Calories Left</h2><p className={`text-4xl font-black ${remainingCals < 0 ? 'text-red-400' : 'text-slate-700'}`}>{remainingCals} <span className="text-sm text-slate-400 font-bold">kcal</span></p></div>
                    <div className="w-20 h-20 relative flex items-center justify-center animate-bounce-gentle">
                        <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90"><path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#f1f5f9" strokeWidth="3" /><path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#a5d8ff" strokeWidth="3" strokeDasharray={`${Math.min(100, (totalEatenCals/adjustedCalorieGoal)*100)}, 100`} strokeLinecap="round" /></svg>
                        <span className="absolute text-xs font-black text-blue-400">{Math.round((totalEatenCals/adjustedCalorieGoal)*100)}%</span>
                    </div>
                </div>
                <ProgressBar current={totals.c} max={GOALS.carbs} colorClass="bg-orange-200" label="Carbs" reverse={true} />
                <ProgressBar current={totals.p} max={GOALS.protein} colorClass="bg-blue-300" label="Protein" reverse={true} />
                <ProgressBar current={totals.f} max={GOALS.fat} colorClass="bg-yellow-200" label="Fat" reverse={true} />
                <ProgressBar current={totals.fib} max={GOALS.fiber} colorClass="bg-teal-200" label="Fiber" reverse={false} />
            </div>
            <button onClick={() => openAddFood()} className="w-full bg-blue-300 text-white p-4 rounded-3xl shadow-lg font-bold flex flex-row items-center justify-center gap-2 hover:bg-blue-400 active:scale-95 transition-all"><span className="material-icons-round text-2xl">add_circle</span> Add Food</button>
            <div className="space-y-3">
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest ml-2">Today's Bowl</h3>
                {!todayLog.length ? <div className="text-center py-10 opacity-70"><CatGif type="sleep" className="w-32 h-32 mx-auto mb-2 opacity-50 grayscale" /><p className="text-xs font-bold uppercase text-slate-400">Empty Bowl...</p></div> : todayLog.map(item => (
                    <div key={item.id} className="kawaii-card p-4 flex justify-between items-center">
                        <div><div className="flex items-center gap-2"><span className="text-[10px] bg-blue-50 text-blue-400 px-2 py-1 rounded-lg font-black uppercase">{item.category}</span><p className="font-bold text-slate-600 text-sm">{item.name}</p></div><p className="text-[10px] text-slate-400 font-bold uppercase mt-1 ml-1">{item.weight}{item.measure} • {Math.round(calcCals(item.c, item.p, item.f))} cal • <span className="text-teal-400">{item.fib.toFixed(1)}g Fib</span></p></div>
                        <button onClick={() => setData({...data, history: {...data.history, [date]: todayLog.filter(i=>i.id!==item.id)}})} className="bg-red-50 text-red-300 p-2 rounded-xl hover:bg-red-100 transition-colors"><span className="material-icons-round text-lg">delete</span></button>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderFitness = () => (
        <div className="pb-24 safe-pb space-y-6">
            <div className="sticky top-0 bg-blue-50 z-30 pb-2 pt-2"><h2 className="text-2xl font-black text-blue-400 px-2">Meow Muscles</h2><div className="flex bg-white p-1 rounded-2xl shadow-sm mt-4 mx-2">
                {['A', 'B'].map(r => <button key={r} onClick={() => setActiveRoutine(r)} className={`flex-1 py-3 rounded-xl font-black text-xs uppercase transition-all ${activeRoutine === r ? 'bg-blue-300 text-white shadow-md' : 'text-slate-400 hover:bg-blue-50'}`}>{WORKOUTS[r].name}</button>)}
            </div></div>
            <div className="space-y-6 px-2">
                {WORKOUTS[activeRoutine].exercises.map((ex, idx) => {
                    const lastSummary = formatLastLog(ex.name); const timeLeft = timers[ex.name] || 0;
                    const currentSets = workoutInputs[ex.name] || Array(ex.sets).fill({weight:0, reps:0, difficulty:'😼'});
                    return (
                        <div key={idx} className="kawaii-card p-4">
                            <div className="flex justify-between items-center mb-4"><div className="flex-1"><div className="flex items-center gap-2"><h3 className="font-bold text-slate-700 text-sm">{ex.name}</h3>{timeLeft > 0 && <span className="text-xs font-bold text-blue-400 animate-pulse bg-blue-50 px-2 py-1 rounded-lg">{timeLeft}s</span>}</div><div className="flex flex-col mt-1"><p className="text-[10px] font-black text-blue-300 uppercase italic">{ex.target}</p><p className="text-[10px] font-bold text-slate-400 uppercase">{lastSummary}</p></div></div><button onClick={() => setTimers(prev => ({...prev, [ex.name]: prev[ex.name]>0 ? 0 : 90}))} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-colors shadow-sm ${timeLeft > 0 ? 'bg-red-100 text-red-400' : 'bg-slate-100 text-slate-500'}`}>{timeLeft > 0 ? 'Stop' : 'Rest'}</button></div>
                            <div className="grid grid-cols-4 gap-2 mb-2 text-center px-1 font-black text-[9px] uppercase text-slate-300"><span>Set</span><span>Lbs</span><span>Reps</span><span>Feel</span></div>
                            <div className="space-y-2">{Array.from({length: ex.sets}).map((_, setIdx) => {
                                const setData = currentSets[setIdx] || {weight: 0, reps: 0, difficulty: '😼'};
                                const updateSet = (field, val) => { const newSets = [...currentSets]; while(newSets.length <= setIdx) newSets.push({weight:0, reps:0, difficulty:'😼'}); newSets[setIdx] = { ...newSets[setIdx], [field]: val }; setWorkoutInputs({ ...workoutInputs, [ex.name]: newSets }); };
                                return (
                                    <div key={setIdx} className="grid grid-cols-4 gap-2">
                                        <div className="flex items-center justify-center font-black text-blue-200 text-sm bg-blue-50 rounded-xl">{setIdx + 1}</div>
                                        <input type="number" className="kawaii-input p-2 text-center font-bold text-xs" value={setData.weight} onChange={e => updateSet('weight', Number(e.target.value))} />
                                        <input type="number" className="kawaii-input p-2 text-center font-bold text-xs" value={setData.reps} onChange={e => updateSet('reps', Number(e.target.value))} />
                                        <select className="kawaii-input p-1 text-center text-xs appearance-none" value={setData.difficulty} onChange={e => updateSet('difficulty', e.target.value)}><option>😺</option><option>😼</option><option>🙀</option></select>
                                    </div>
                                );
                            })}</div>
                        </div>
                    );
                })}
            </div>
            <button onClick={() => setFinishModalOpen(true)} className="w-full bg-blue-400 text-white py-4 rounded-3xl font-black uppercase shadow-lg hover:bg-blue-500 active:scale-95 transition-transform flex items-center justify-center gap-2 sticky bottom-24 z-20 mx-auto max-w-[90%]"><span className="material-icons-round text-xl">check_circle</span> Finish Workout</button>
        </div>
    );

    const renderLibrary = () => (
        <div className="pb-20 safe-pb">
            <div className="sticky top-0 bg-blue-50 z-30 pb-4 pt-2"><h2 className="text-2xl font-black text-blue-400 mb-4 px-2">Food Library</h2><div className="relative px-2"><span className="material-icons-round absolute left-6 top-3 text-blue-300 text-base">search</span><input className="w-full bg-white pl-10 pr-4 py-3 rounded-2xl shadow-sm outline-none font-bold text-sm" placeholder="Search foods..." value={librarySearch} onChange={e => setLibrarySearch(e.target.value)} /></div></div>
            <div className="space-y-3 px-2">{sortLibrary(data.library ? data.library.filter(i => (i.name || "").toLowerCase().includes(librarySearch.toLowerCase())) : []).map(item => (
                <button key={item.id} onClick={() => openAddFood(item)} className="w-full kawaii-card p-4 flex justify-between items-center text-left hover:scale-[1.02] transition-transform"><div><p className="font-bold text-slate-600">{item.name}</p><p className="text-[10px] text-slate-400 uppercase font-bold mt-1">Per {item.measure === 'unit' ? 'Unit' : '100g'} • <span className="text-blue-400">P: {Math.round(item.protein)}</span> <span className="text-orange-400">C: {Math.round(item.carbs)}</span></p></div><div className="bg-blue-50 p-2 rounded-full text-blue-300"><span className="material-icons-round text-base">add</span></div></button>
            ))}</div>
        </div>
    );

    return (
        <div className="max-w-md mx-auto min-h-screen px-4 py-6 relative font-nunito">
            <CatPawSwat trigger={swatTrigger} /><SuccessModal isOpen={!!successModalData} onClose={() => setSuccessModalData(null)} {...successModalData} />
            {view === 'home' && renderHome()} {view === 'fitness' && renderFitness()} {view === 'library' && renderLibrary()} {view === 'trends' && renderTrends()} {view === 'settings' && <div className="text-center pt-20 text-blue-300 font-bold">Settings Locked 🔒</div>}
            <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[95%] max-w-[400px] bg-white/90 backdrop-blur-md shadow-2xl rounded-3xl p-2 flex justify-around items-center z-40 safe-pb border border-white">
                <button onClick={() => setView('home')} className={`p-3 rounded-2xl transition-all ${view==='home'?'bg-blue-50 text-blue-400':'text-slate-300'}`}><span className="material-icons-round text-xl">home</span></button>
                <button onClick={() => setView('fitness')} className={`p-3 rounded-2xl transition-all ${view==='fitness'?'bg-blue-50 text-blue-400':'text-slate-300'}`}><span className="material-icons-round text-xl">fitness_center</span></button>
                <button onClick={() => setView('library')} className={`p-3 rounded-2xl transition-all ${view==='library'?'bg-blue-50 text-blue-400':'text-slate-300'}`}><span className="material-icons-round text-xl">menu_book</span></button>
                <button onClick={() => setView('trends')} className={`p-3 rounded-2xl transition-all ${view==='trends'?'bg-blue-50 text-blue-400':'text-slate-300'}`}><span className="material-icons-round text-xl">insights</span></button>
            </nav>
            {modalOpen && (
                <div className="fixed inset-0 z-50 bg-blue-900/20 backdrop-blur-sm flex items-end sm:items-center justify-center p-4" onClick={() => setModalOpen(false)}><div className="bg-white w-full max-w-sm rounded-[2.5rem] p-6 shadow-2xl animate-in slide-in-from-bottom-10 border-4 border-blue-50" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-between items-center mb-6"><div className="flex items-center gap-2"><h2 className="text-xl font-black text-slate-700 uppercase tracking-tight">{isLibraryEditMode ? 'Edit Source' : (isNew ? 'New Entry' : 'Add Food')}</h2>{selectedBaseItem && !isLibraryEditMode && <button onClick={handleStartEditLibrary} className="bg-blue-50 text-blue-300 p-2 rounded-full"><span className="material-icons-round text-base">edit</span></button>}</div><button onClick={() => setModalOpen(false)} className="bg-slate-100 w-10 h-10 rounded-full flex items-center justify-center font-bold text-slate-400 hover:text-red-400 transition-colors">&times;</button></div>
                    {isLibraryEditMode ? <div className="space-y-4"><div className="flex gap-2"><div className="flex-1"><label className="text-[10px] font-black uppercase text-slate-400 ml-2 mb-1 block">Name</label><input className="kawaii-input w-full p-3 font-bold text-sm" value={baseEditValues.name} onChange={e => setBaseEditValues({...baseEditValues, name: e.target.value})} /></div><div className="w-1/3"><label className="text-[10px] font-black uppercase text-slate-400 ml-2 mb-1 block">Type</label><button onClick={() => setBaseEditValues({...baseEditValues, measureType: baseEditValues.measureType === 'g' ? 'unit' : 'g'})} className="w-full bg-blue-50 p-3 rounded-2xl font-bold text-xs uppercase text-blue-400 border-2 border-blue-100">{baseEditValues.measureType === 'g' ? 'Grams' : 'Units'}</button></div></div>{baseEditValues.measureType === 'g' && <div><label className="text-[10px] font-black uppercase text-slate-400 ml-2 mb-1 block">Serving Size (g)</label><input type="number" className="kawaii-input w-full p-3 font-bold text-center" value={baseEditValues.servingSize} onChange={e => setBaseEditValues({...baseEditValues, servingSize: Number(e.target.value)})} /></div>}<div className="bg-slate-50 p-4 rounded-[2rem] border border-slate-100"><p className="text-[10px] font-black text-center text-slate-400 uppercase mb-3">Macros per {baseEditValues.measureType === 'g' ? `${baseEditValues.servingSize}g` : '1 Unit'}</p><div className="grid grid-cols-4 gap-2">{['carbs', 'protein', 'fat', 'fiber'].map(m => <div key={m}><label className="text-[8px] font-bold uppercase text-slate-400 block text-center mb-1">{m.substring(0,3)}</label><input type="number" className="w-full p-2 rounded-xl text-center font-bold text-xs bg-white border-2 border-slate-100 outline-none" value={baseEditValues[m]} onChange={e => setBaseEditValues({...baseEditValues, [m]: Number(e.target.value)})} /></div>)}</div></div><button onClick={handleSaveLibraryEdit} className="w-full bg-orange-300 text-white py-4 rounded-2xl font-black uppercase shadow-lg hover:bg-orange-400">Update Library</button></div> : <div className="space-y-4 max-h-[70vh] overflow-y-auto no-scrollbar"><div className="bg-slate-50 p-1 rounded-2xl flex border border-slate-100">{['g', 'unit'].map(m => <button key={m} onClick={() => setEditFood({...editFood, measure: m})} className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase transition-all ${editFood.measure === m ? 'bg-white shadow-sm text-blue-400' : 'text-slate-400'}`}>{m === 'g' ? 'Grams' : 'Quantity'}</button>)}</div><input className="kawaii-input w-full p-4 font-bold text-sm" value={editFood.name} onChange={e => setEditFood({...editFood, name: e.target.value})} placeholder="Food Name" /><div><label className="text-[10px] font-black uppercase text-slate-400 ml-2 mb-1 block">{editFood.measure === 'g' ? 'Weight (g)' : 'Quantity'}</label><input type="number" className="kawaii-input w-full p-4 font-black text-2xl text-center text-blue-400" value={editFood.weight} onChange={e => handleWeightChange(e.target.value)} /></div><div className="bg-slate-50 p-4 rounded-[2rem] border border-slate-100"><p className="text-[10px] font-black text-center text-slate-400 uppercase mb-3">Calculated Macros</p><div className="grid grid-cols-4 gap-2">{['carbs', 'protein', 'fat', 'fiber'].map(m => <div key={m}><label className="text-[8px] font-bold uppercase text-slate-400 block text-center mb-1">{m.substring(0,3)}</label><input type="number" className="w-full p-2 rounded-xl text-center font-bold text-xs bg-white border border-slate-100" value={editFood[m]} onChange={e => setEditFood({...editFood, [m]: Number(e.target.value)})} /></div>)}</div></div><button onClick={handleAddFood} className="w-full bg-blue-300 text-white py-4 rounded-2xl font-black uppercase shadow-lg shadow-blue-200">Add to Bowl</button></div>}
                </div></div>
            )}
            {finishModalOpen && (
                <div className="fixed inset-0 z-50 bg-blue-900/20 backdrop-blur-sm flex items-end sm:items-center justify-center p-4" onClick={() => setFinishModalOpen(false)}><div className="bg-white w-full max-w-sm rounded-[2.5rem] p-6 shadow-2xl animate-in slide-in-from-bottom-10 border-4 border-blue-50" onClick={e => e.stopPropagation()}><h2 className="text-xl font-black text-blue-400 uppercase mb-6 text-center">Great Job!</h2><div className="mb-6"><label className="text-[10px] font-black uppercase text-slate-400 ml-1 mb-1 block">Minutes Spent</label><input type="number" className="kawaii-input w-full p-4 font-black text-3xl text-center text-blue-400" value={workoutDuration} onChange={e => setWorkoutDuration(e.target.value)} /></div><button onClick={handleFinishWorkout} className="w-full bg-blue-400 text-white py-4 rounded-2xl font-black uppercase shadow-lg flex items-center justify-center gap-2"><span className="material-icons-round text-xl">save</span> Save Workout</button></div></div>
            )}
            {viewHistoryItem && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setViewHistoryItem(null)}><div className="bg-white w-full max-w-sm max-h-[80vh] overflow-y-auto rounded-[2.5rem] p-6 shadow-2xl no-scrollbar" onClick={e => e.stopPropagation()}><div className="flex justify-between items-center mb-6"><div><h2 className="text-lg font-black text-slate-700">{WORKOUTS[viewHistoryItem.routine]?.name || "Workout"}</h2><p className="text-xs text-slate-400 font-bold">{viewHistoryItem.date} • {viewHistoryItem.duration} min • {viewHistoryItem.calories} kcal</p></div><button onClick={() => setViewHistoryItem(null)} className="bg-slate-50 p-2 rounded-full text-slate-400 hover:text-red-400 transition-colors"><span className="material-icons-round text-base">close</span></button></div><div className="space-y-4">{Object.entries(viewHistoryItem.exercises).map(([name, sets], idx) => <div key={idx} className="bg-slate-50 p-4 rounded-2xl border border-slate-100"><p className="font-bold text-slate-600 text-sm mb-2">{name}</p><div className="grid grid-cols-4 gap-2 mb-1 px-1 text-center font-black uppercase text-slate-400 text-[8px]"><span>Set</span><span>Lbs</span><span>Reps</span><span>Feel</span></div><div className="space-y-1">{sets.map((s, sIdx) => <div key={sIdx} className="grid grid-cols-4 gap-2"><div className="text-center font-bold text-blue-300 text-xs bg-white rounded-lg py-1">{sIdx + 1}</div><input disabled className="bg-white p-1 text-center font-bold text-xs text-slate-600 rounded-lg" value={s.weight} /><input disabled className="bg-white p-1 text-center font-bold text-xs text-slate-600 rounded-lg" value={s.reps} /><div className="text-center text-xs py-1">{s.difficulty}</div></div>)}</div></div>)}</div></div></div>
            )}
        </div>
    );
}
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);