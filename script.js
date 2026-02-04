const { useState, useEffect, useMemo, useRef } = React;

// --- CONSTANTS ---
const GOALS = { calories: 1645, carbs: 160, protein: 150, fat: 45, fiber: 38 };
const USER_WEIGHT_KG = 73; 
const BASE_BMR = 1600;

// WORKOUT DATA
const WORKOUTS = {
    A: {
        name: "Workout A (Push)",
        exercises: [
            { name: "DB Incline Bench", sets: 3, target: "3 x 6-8" },
            { name: "DB Goblet Squats", sets: 3, target: "3 x 8-10" },
            { name: "FT Lateral Raises", sets: 4, target: "4 x 12-15" },
            { name: "FT Tricep Ext", sets: 3, target: "3 x 10-12" },
            { name: "Jump Rope HIIT", sets: 1, target: "10 mins" }
        ]
    },
    B: {
        name: "Workout B (Pull)",
        exercises: [
            { name: "DB Romanian DL", sets: 3, target: "3 x 6-8" },
            { name: "FT Row/Pulldown", sets: 3, target: "3 x 8-10" },
            { name: "DB Rear Delt Fly", sets: 3, target: "3 x 15" },
            { name: "DB Bicep Curls", sets: 3, target: "3 x 10-12" },
            { name: "Bike HIIT", sets: 1, target: "10 mins" }
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

const MOTIVATION_QUOTES = ["Crushed it! 🐾", "Paws-itively Strong! 💪", "Feline ferocious today! 🦁", "You're the cat's pajamas! 😻", "Purr-fect Performance! ⭐"];

// --- HELPERS ---

const getLocalYMD = () => {
    const now = new Date();
    const local = new Date(now.getTime() - (now.getTimezoneOffset() * 60000));
    return local.toISOString().split('T')[0];
};

const calcCals = (c, p, f) => Math.round((c * 4) + (p * 4) + (f * 9));

const getVolumeAnimal = (vol) => {
    if(vol > 300000) return "a Blue Whale 🐋";
    if(vol > 15000) return "a T-Rex 🦖";
    if(vol > 6000) return "an Elephant 🐘";
    if(vol > 4000) return "a Car 🚗";
    if(vol > 500) return "a Tiger 🐅";
    return "a Piano 🎹";
};

// --- COMPONENTS ---
const CatGif = ({ type, className }) => {
    const [error, setError] = useState(false);
    const gifs = { swat: "https://cataas.com/cat/gif", happy: "https://cataas.com/cat/gif?type=medium", sleep: "https://cataas.com/cat/gif?type=small", workout: "https://cataas.com/cat/gif?type=square" };
    const fallbacks = { swat: "🐾", happy: "😻", sleep: "💤", workout: "🏋️‍♀️" };
    if (error) return <span className={`flex items-center justify-center text-4xl ${className}`}>{fallbacks[type] || '🐱'}</span>;
    return <img src={gifs[type]} alt="Cat" className={`object-cover rounded-2xl ${className}`} onError={() => setError(true)} />;
};

const CatPawSwat = ({ trigger }) => {
    if (!trigger) return null;
    return <div className="fixed top-1/2 left-0 w-full pointer-events-none z-[60] flex items-center justify-center animate-swat"><CatGif type="swat" className="w-64 h-64 rounded-full shadow-2xl border-4 border-white" /></div>;
};

const SuccessModal = ({ isOpen, onClose, title, message, subtext }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[70] bg-black/80 flex items-center justify-center p-6 animate-pop" onClick={onClose}>
            <div className="text-center text-white w-full max-w-sm" onClick={e => e.stopPropagation()}>
                <CatGif type="workout" className="w-64 h-64 rounded-full border-4 border-pink-400 mx-auto mb-6 shadow-2xl shadow-pink-500/50" />
                <h2 className="text-3xl font-black uppercase mb-2 text-pink-300">{title}</h2>
                <p className="text-xl font-bold italic mb-4">"{message}"</p>
                {subtext && <div className="bg-white/20 rounded-xl p-4 mb-8">{subtext}</div>}
                <button onClick={onClose} className="bg-pink-500 text-white w-full py-4 rounded-2xl font-black uppercase shadow-lg active:scale-95 transition-transform">Close</button>
            </div>
        </div>
    );
};

const ProgressBar = ({ current, max, color, label, reverse = false }) => {
    const pct = Math.min(100, Math.max(0, (current / max) * 100));
    const remaining = reverse ? max - current : current;
    const isOver = reverse && current > max;
    const displayVal = `${Math.round(current)}g / ${max}g (${isOver ? Math.round(current - max) + 'g over' : Math.round(remaining) + 'g left'})`;
    
    return (
        <div className="flex flex-col w-full mb-3">
            <div className="flex justify-between text-xs font-bold mb-1 text-slate-600 uppercase tracking-wider">
                <span>{label}</span>
                <span className={isOver ? 'text-red-500 font-black' : ''}>{displayVal}</span>
            </div>
            <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden">
                <div className={`h-full transition-all duration-1000 ${color} ${isOver ? 'bg-red-500' : ''}`} style={{ width: `${pct}%` }}></div>
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

    // FEATURE 2.5: Edit Library Mode
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
    const fileInputRef = useRef(null);
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
            if (currentLocal !== date) {
                setDate(currentLocal);
            }
        };
        checkDateReset();
        window.addEventListener('focus', checkDateReset);
        return () => window.removeEventListener('focus', checkDateReset);
    }, [date]);

    // Data Persistence (Robust Loading)
    useEffect(() => {
        const saved = localStorage.getItem('meow_data_v10');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                // Safe guard: ensure objects exist
                if (!parsed.history) parsed.history = {};
                if (!parsed.fitnessHistory) parsed.fitnessHistory = {};
                if (!parsed.library) parsed.library = STARTER_LIBRARY;
                setData(parsed);
            } catch (e) {
                console.error("Data parse error", e);
                // Fallback to defaults or v9 if needed, but setData is already defaulted
            }
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
        return "Last: --";
    };

    const sortLibrary = (lib) => {
        return [...lib].sort((a, b) => {
            const aLast = a.lastUsed || 0;
            const bLast = b.lastUsed || 0;
            if (bLast !== aLast) return bLast - aLast; 
            return a.name.localeCompare(b.name); 
        });
    };

    // Reactive Food Math Handler
    const handleWeightChange = (val) => {
        const newWeight = Number(val);
        if (selectedBaseItem) {
            const baseAmount = selectedBaseItem.measure === 'unit' ? 1 : 100;
            const ratio = newWeight / baseAmount;
            
            setEditFood({
                ...editFood,
                weight: newWeight,
                carbs: parseFloat((selectedBaseItem.carbs * ratio).toFixed(1)),
                protein: parseFloat((selectedBaseItem.protein * ratio).toFixed(1)),
                fat: parseFloat((selectedBaseItem.fat * ratio).toFixed(1)),
                fiber: parseFloat((selectedBaseItem.fiber * ratio).toFixed(1))
            });
        } else {
            setEditFood({ ...editFood, weight: newWeight });
        }
    };

    const handleAddFood = () => {
        const newEntry = {
            id: Date.now(),
            name: editFood.name,
            weight: editFood.weight, 
            measure: editFood.measure,
            c: editFood.carbs,
            p: editFood.protein,
            f: editFood.fat,
            fib: editFood.fiber,
            category: editFood.category
        };

        let newLib = [...data.library];
        const existingIdx = newLib.findIndex(i => i.name === editFood.name);
        if (existingIdx >= 0) {
            newLib[existingIdx] = { 
                ...newLib[existingIdx], 
                lastUsed: Date.now(),
                lastAmount: editFood.weight 
            };
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
        setIsLibraryEditMode(false); // Reset edit mode
        if (item) {
            const startWeight = item.lastAmount || (item.measure === 'unit' ? 1 : 100);
            const baseAmount = item.measure === 'unit' ? 1 : 100;
            const ratio = startWeight / baseAmount;

            setEditFood({ 
                ...item, 
                weight: startWeight,
                carbs: parseFloat((item.carbs * ratio).toFixed(1)),
                protein: parseFloat((item.protein * ratio).toFixed(1)),
                fat: parseFloat((item.fat * ratio).toFixed(1)),
                fiber: parseFloat((item.fiber * ratio).toFixed(1)),
                measure: item.measure || 'g' 
            });
            setSelectedBaseItem(item); 
            setIsNew(false);
        } else {
            setEditFood({ name: '', weight: 100, carbs: 0, protein: 0, fat: 0, fiber: 0, category: 'Snack', measure: 'g' });
            setSelectedBaseItem(null); 
            setIsNew(true);
        }
        setModalOpen(true);
    };

    // FEATURE 2.5: Handle Edit Library Source (Refactored for Smart Serving Size)
    const handleStartEditLibrary = () => {
        // Initialize with default serving size 100 for grams or 1 for units
        const isUnit = selectedBaseItem.measure === 'unit';
        setBaseEditValues({
            ...selectedBaseItem,
            measureType: isUnit ? 'unit' : 'g',
            servingSize: isUnit ? 1 : 100
        });
        setIsLibraryEditMode(true);
    };

    const handleSaveLibraryEdit = () => {
        let updatedItem = { ...selectedBaseItem, name: baseEditValues.name };
        
        if (baseEditValues.measureType === 'unit') {
            updatedItem = {
                ...updatedItem,
                measure: 'unit',
                carbs: Number(baseEditValues.carbs),
                protein: Number(baseEditValues.protein),
                fat: Number(baseEditValues.fat),
                fiber: Number(baseEditValues.fiber)
            };
        } else {
            // Grams: Normalize to 100g base for internal storage
            // Formula: (InputMacro / ServingSize) * 100
            const serving = Number(baseEditValues.servingSize) || 100;
            const ratio = 100 / serving;
            
            updatedItem = {
                ...updatedItem,
                measure: 'g',
                carbs: parseFloat((Number(baseEditValues.carbs) * ratio).toFixed(1)),
                protein: parseFloat((Number(baseEditValues.protein) * ratio).toFixed(1)),
                fat: parseFloat((Number(baseEditValues.fat) * ratio).toFixed(1)),
                fiber: parseFloat((Number(baseEditValues.fiber) * ratio).toFixed(1))
            };
        }

        // 1. Update Library
        const newLib = data.library.map(i => i.id === updatedItem.id ? updatedItem : i);
        setData({...data, library: newLib});
        setSelectedBaseItem(updatedItem); // Update base reference

        // 2. Recalculate Calculator View (Standard Mode)
        const baseAmount = updatedItem.measure === 'unit' ? 1 : 100;
        const calcRatio = editFood.weight / baseAmount;
        
        setEditFood({
            ...editFood,
            name: updatedItem.name,
            carbs: parseFloat((updatedItem.carbs * calcRatio).toFixed(1)),
            protein: parseFloat((updatedItem.protein * calcRatio).toFixed(1)),
            fat: parseFloat((updatedItem.fat * calcRatio).toFixed(1)),
            fiber: parseFloat((updatedItem.fiber * calcRatio).toFixed(1)),
            measure: updatedItem.measure
        });

        // 3. Exit Edit Mode
        setIsLibraryEditMode(false);
    };

    const handleFinishWorkout = () => {
        const duration = parseInt(workoutDuration) || 0;
        const burned = duration * 6;
        
        const workoutLog = {
            id: Date.now(),
            routine: activeRoutine,
            duration: duration,
            calories: burned,
            exercises: JSON.parse(JSON.stringify(workoutInputs))
        };

        setData({ 
            ...data, 
            fitnessHistory: { ...data.fitnessHistory, [date]: [workoutLog, ...(data.fitnessHistory[date] || [])] } 
        });
        
        setWorkoutInputs({});
        setFinishModalOpen(false);
        setSuccessModalData({
            title: "Workout Complete!",
            message: MOTIVATION_QUOTES[Math.floor(Math.random() * MOTIVATION_QUOTES.length)],
            subtext: <div className="text-center"><p className="text-sm font-bold uppercase text-pink-200">Calories Burned</p><p className="text-4xl font-black text-white">{burned}</p></div>
        });
    };

    const handleDeleteWorkout = (logId, logDate) => {
        if(confirm("Delete this workout log?")) {
            const dayLogs = data.fitnessHistory[logDate].filter(l => l.id !== logId);
            setData({
                ...data,
                fitnessHistory: { ...data.fitnessHistory, [logDate]: dayLogs }
            });
        }
    };

    // --- CHARTS & TRENDS (NUCLEAR SAFEGUARD) ---
    const renderTrends = () => {
        // EXTREME DEFENSIVE CODING: Wrap entire render in try/catch
        try {
            // Safe accessors
            const history = data.history || {};
            const fitnessHistory = data.fitnessHistory || {};

            const hasHistory = Object.keys(history).length > 0;
            const hasFitness = Object.keys(fitnessHistory).length > 0;
            
            if (!hasHistory && !hasFitness) {
                 return (
                    <div className="pb-20 safe-pb space-y-6 flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
                        <h2 className="text-2xl font-black text-slate-700">Trends & History</h2>
                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-pink-100">
                            <p className="text-slate-500 font-bold mb-2">No data yet! 😿</p>
                            <p className="text-sm text-slate-400">Start logging food or workouts to see your charts.</p>
                        </div>
                    </div>
                 );
            }

            const pastWorkouts = Object.entries(fitnessHistory)
                .flatMap(([d, logs]) => {
                    if (!Array.isArray(logs)) return [];
                    return logs.map(l => ({ date: d, ...l }));
                })
                .sort((a, b) => (b.id || 0) - (a.id || 0))
                .slice(0, 10);

            return (
                <div className="pb-20 safe-pb space-y-6">
                    <h2 className="text-2xl font-black text-slate-700">Trends & History</h2>
                    <div className="bg-white p-4 rounded-3xl shadow-sm h-64">
                        <h3 className="text-xs font-black text-slate-400 uppercase mb-2">Calories: In vs Out</h3>
                        <div className="h-52"><canvas id="calChart"></canvas></div>
                    </div>
                    <div className="bg-white p-4 rounded-3xl shadow-sm h-64">
                        <h3 className="text-xs font-black text-slate-400 uppercase mb-2">Volume Lifted</h3>
                        <div className="h-52"><canvas id="volChart"></canvas></div>
                    </div>
                    <div className="space-y-3">
                        <h3 className="font-bold text-slate-700">Workout Log</h3>
                        {pastWorkouts.length === 0 ? <p className="text-xs text-slate-400">No workouts yet.</p> : pastWorkouts.map(w => {
                            let vol = 0;
                            // Defensive check for exercises
                            if (w.exercises) {
                                Object.values(w.exercises).forEach(sets => {
                                    if (Array.isArray(sets)) {
                                        sets.forEach(s => vol += (Number(s.weight)||0)*(Number(s.reps)||0));
                                    }
                                });
                            }
                            
                            // Safe routine name access
                            const routineName = WORKOUTS[w.routine] ? WORKOUTS[w.routine].name : "Unknown Workout";

                            return (
                                <div key={w.id} onClick={() => setViewHistoryItem(w)} className="bg-white p-4 rounded-2xl shadow-sm border-l-4 border-indigo-400 active:scale-95 transition-transform cursor-pointer">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-bold text-slate-700 text-sm">{routineName} <span className="text-xs font-normal text-slate-400">({w.date})</span></p>
                                            <p className="text-xs font-bold text-pink-500">{w.calories} cal</p>
                                            <p className="text-[10px] text-slate-500 mt-1">Total Volume: <span className="font-black">{vol.toLocaleString()} lbs</span></p>
                                        </div>
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
            return (
                <div className="flex flex-col items-center justify-center min-h-[80vh] p-6 text-center">
                    <h2 className="text-2xl font-black text-slate-800 mb-4">Something went wrong 😿</h2>
                    <p className="text-slate-500 mb-8">The charts couldn't load due to data corruption.</p>
                    <button 
                        onClick={() => {
                            if(confirm("This will delete all your local data to fix the app. Are you sure?")) {
                                localStorage.clear();
                                window.location.reload();
                            }
                        }}
                        className="bg-red-500 text-white py-4 px-8 rounded-2xl font-black uppercase shadow-xl"
                    >
                        Reset Data & Fix
                    </button>
                </div>
            );
        }
    };

    // Chart Effect (Safety wrapper)
    useEffect(() => {
        if (view === 'trends') {
            try {
                if (calorieChartRef.current) calorieChartRef.current.destroy();
                if (volumeChartRef.current) volumeChartRef.current.destroy();

                const labels = [];
                const calsIn = [];
                const calsOut = [];
                const volumeData = [];

                // Use robust accessors
                const history = data.history || {};
                const fitnessHistory = data.fitnessHistory || {};

                for (let i=6; i>=0; i--) {
                    const d = new Date();
                    d.setDate(d.getDate() - i);
                    const k = d.toISOString().split('T')[0];
                    labels.push(d.toLocaleDateString('en-US', {weekday:'short'}));
                    
                    const log = history[k] || [];
                    const fit = fitnessHistory[k] || [];
                    const dayIn = log.reduce((s, x) => s + calcCals(x.c,x.p,x.f), 0);
                    const dayBurn = fit.reduce((s, x) => s + x.calories, 0);
                    calsIn.push(dayIn);
                    calsOut.push(BASE_BMR + dayBurn);

                    let dayVol = 0;
                    fit.forEach(sess => {
                        if (sess.exercises) {
                            Object.values(sess.exercises).forEach(sets => {
                                if(Array.isArray(sets)) {
                                    sets.forEach(s => dayVol += (s.weight || 0) * (s.reps || 0));
                                }
                            });
                        }
                    });
                    volumeData.push(dayVol);
                }

                const calCanvas = document.getElementById('calChart');
                const volCanvas = document.getElementById('volChart');

                if (calCanvas) {
                    calorieChartRef.current = new Chart(calCanvas, {
                        type: 'bar',
                        data: {
                            labels,
                            datasets: [
                                { label: 'In (Food)', data: calsIn, backgroundColor: '#f472b6', borderRadius: 4 },
                                { label: 'Out (BMR+Work)', data: calsOut, backgroundColor: '#60a5fa', borderRadius: 4 }
                            ]
                        },
                        options: { responsive: true, maintainAspectRatio: false, scales: { x: { stacked: false }, y: { beginAtZero: true } } }
                    });
                }

                if (volCanvas) {
                    volumeChartRef.current = new Chart(volCanvas, {
                        type: 'line',
                        data: {
                            labels,
                            datasets: [{
                                label: 'Volume (lbs)',
                                data: volumeData,
                                borderColor: '#818cf8',
                                backgroundColor: 'rgba(129, 140, 248, 0.2)',
                                tension: 0.4,
                                fill: true
                            }]
                        },
                        options: { responsive: true, maintainAspectRatio: false }
                    });
                }
            } catch (err) {
                console.error("Chart Render Error:", err);
            }
        }
        return () => {
            if (calorieChartRef.current) calorieChartRef.current.destroy();
            if (volumeChartRef.current) volumeChartRef.current.destroy();
        };
    }, [view, data]);

    const renderHome = () => (
        <div className="space-y-6 pb-20 safe-pb">
            <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                    <img 
                        src="https://media.giphy.com/media/sIIhZliB2McAo/giphy.gif" 
                        alt="Nyan Cat" 
                        style={{
                            height: '65px',
                            width: 'auto',
                            borderRadius: '0',
                            verticalAlign: 'middle', 
                            marginRight: '15px' 
                        }} 
                    />
                    <h1 className="text-2xl font-black text-pink-500 tracking-tight">Meow Macros</h1>
                </div>
            </div>

            <div className="glass-panel p-5 rounded-3xl shadow-lg border-b-4 border-pink-200 relative overflow-hidden">
                <div className="flex justify-between items-end mb-4 relative z-10">
                    <div>
                        <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">Remaining</h2>
                        <p className={`text-3xl font-black ${remainingCals < 0 ? 'text-red-500' : 'text-slate-700'}`}>
                            {remainingCals} <span className="text-sm text-slate-400">kcal</span>
                        </p>
                        {totalBurnedCals > 0 && <p className="text-[10px] text-emerald-500 font-bold">+{totalBurnedCals} bonus from Meow Muscles!</p>}
                    </div>
                    <div className="w-16 h-16 relative flex items-center justify-center">
                        <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                            <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#ffe4e6" strokeWidth="4" />
                            <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#f472b6" strokeWidth="4" strokeDasharray={`${Math.min(100, (totalEatenCals/adjustedCalorieGoal)*100)}, 100`} />
                        </svg>
                        <span className="absolute text-[8px] font-bold text-pink-500">{Math.round((totalEatenCals/adjustedCalorieGoal)*100)}%</span>
                    </div>
                </div>
                <ProgressBar current={totals.c} max={GOALS.carbs} color="bg-blue-400" label="Carbs" reverse={true} />
                <ProgressBar current={totals.p} max={GOALS.protein} color="bg-pink-400" label="Protein" reverse={true} />
                <ProgressBar current={totals.f} max={GOALS.fat} color="bg-amber-400" label="Fat" reverse={true} />
                <ProgressBar current={totals.fib} max={GOALS.fiber} color="bg-emerald-400" label="Fiber (38g Goal)" reverse={false} />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <button onClick={() => openAddFood()} className="bg-teal-500 text-white p-4 rounded-2xl shadow-md font-bold flex flex-col items-center gap-2 active:scale-95 transition-transform"><span className="material-icons-round text-2xl">add_circle</span> Add Food</button>
                <button onClick={() => fileInputRef.current.click()} className="bg-indigo-500 text-white p-4 rounded-2xl shadow-md font-bold flex flex-col items-center gap-2 active:scale-95 transition-transform"><span className="material-icons-round text-2xl">photo_camera</span> AI Scan</button>
                <input type="file" ref={fileInputRef} className="hidden" />
            </div>

            <div className="space-y-2">
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-1">Today's Bowl</h3>
                {todayLog.length === 0 ? (
                    <div className="text-center py-10 opacity-70"><CatGif type="sleep" className="w-32 h-32 mx-auto mb-2 opacity-80" /><p className="text-xs font-bold uppercase text-slate-400">Empty Bowl...</p></div>
                ) : todayLog.map(item => (
                    <div key={item.id} className="bg-white p-3 rounded-2xl shadow-sm flex justify-between items-center border-l-4 border-teal-400">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-black uppercase">{item.category}</span>
                                <p className="font-bold text-slate-700 text-sm">{item.name}</p>
                            </div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">
                                {item.weight}{item.measure} • {Math.round(calcCals(item.c, item.p, item.f))} cal • <span className="text-emerald-500">{item.fib.toFixed(1)}g Fib</span>
                            </p>
                        </div>
                        <button onClick={() => setData({...data, history: {...data.history, [date]: todayLog.filter(i=>i.id!==item.id)}})} className="text-slate-300 hover:text-red-400"><span className="material-icons-round text-base">delete</span></button>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderFitness = () => (
        <div className="pb-24 safe-pb space-y-6">
            <div className="sticky top-0 bg-[#FFF0F5] z-30 pb-2 pt-2">
                <h2 className="text-2xl font-black text-slate-700">Meow Muscles Pro 💪</h2>
                <div className="flex bg-white p-1 rounded-2xl shadow-sm mt-4">
                    {['A', 'B'].map(r => (
                        <button key={r} onClick={() => setActiveRoutine(r)} className={`flex-1 py-3 rounded-xl font-black text-xs uppercase transition-all ${activeRoutine === r ? 'bg-pink-500 text-white shadow-md' : 'text-slate-400'}`}>{WORKOUTS[r].name}</button>
                    ))}
                </div>
            </div>

            <div className="space-y-6">
                {WORKOUTS[activeRoutine].exercises.map((ex, idx) => {
                    const lastSummary = formatLastLog(ex.name);
                    const timeLeft = timers[ex.name] || 0;
                    const currentSets = workoutInputs[ex.name] || Array(ex.sets).fill({weight:0, reps:0, difficulty:'😼'});
                    
                    return (
                        <div key={idx} className="bg-white p-2 rounded-3xl shadow-sm border border-slate-100">
                            <div className="flex justify-between items-center mb-3 px-2">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-bold text-slate-800 text-sm">{ex.name}</h3>
                                        {timeLeft > 0 && <span className="text-xs font-mono text-pink-500 font-bold animate-pulse">{timeLeft}s</span>}
                                    </div>
                                    <div className="flex flex-col">
                                        <p className="text-[10px] font-black text-pink-400 uppercase">Goal: {ex.target}</p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase truncate max-w-[200px]">{lastSummary}</p>
                                    </div>
                                </div>
                                <button onClick={() => setTimers(prev => ({...prev, [ex.name]: prev[ex.name]>0 ? 0 : 90}))} className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-colors ${timeLeft > 0 ? 'bg-pink-100 text-pink-500' : 'bg-slate-100 text-slate-500'}`}>{timeLeft > 0 ? 'Stop 🛑' : 'Cat Nap 😺'}</button>
                            </div>

                            <div className="workout-grid mb-2 px-1 text-center">
                                <span className="text-[9px] font-black uppercase text-slate-300">Set</span>
                                <span className="text-[9px] font-black uppercase text-slate-300">Lbs</span>
                                <span className="text-[9px] font-black uppercase text-slate-300">Reps</span>
                                <span className="text-[9px] font-black uppercase text-slate-300">Diff</span>
                            </div>

                            <div className="space-y-2">
                                {Array.from({length: ex.sets}).map((_, setIdx) => {
                                    const setData = currentSets[setIdx] || {weight: 0, reps: 0, difficulty: '😼'};
                                    const updateSet = (field, val) => {
                                        const newSets = [...currentSets];
                                        while(newSets.length <= setIdx) newSets.push({weight:0, reps:0, difficulty:'😼'});
                                        newSets[setIdx] = { ...newSets[setIdx], [field]: val };
                                        setWorkoutInputs({ ...workoutInputs, [ex.name]: newSets });
                                    };
                                    return (
                                        <div key={setIdx} className="workout-grid">
                                            <div className="text-center font-black text-slate-300 text-xs">{setIdx + 1}</div>
                                            <input type="number" className="bg-slate-50 p-2 rounded-xl text-center font-bold text-xs outline-none focus:ring-1 ring-pink-300" value={setData.weight} onChange={e => updateSet('weight', Number(e.target.value))} />
                                            <input type="number" className="bg-slate-50 p-2 rounded-xl text-center font-bold text-xs outline-none focus:ring-1 ring-pink-300" value={setData.reps} onChange={e => updateSet('reps', Number(e.target.value))} />
                                            <select className="bg-slate-50 p-2 rounded-xl text-center text-xs appearance-none outline-none" value={setData.difficulty} onChange={e => updateSet('difficulty', e.target.value)}><option>😺</option><option>😼</option><option>🙀</option></select>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
            <button onClick={() => setFinishModalOpen(true)} className="w-full bg-slate-800 text-white py-4 rounded-2xl font-black uppercase shadow-xl hover:bg-slate-900 active:scale-95 transition-transform flex items-center justify-center gap-2 sticky bottom-24 z-20"><span className="material-icons-round text-xl">check_circle</span> Finish Workout</button>
        </div>
    );

    const renderLibrary = () => (
        <div className="pb-20 safe-pb">
            <div className="sticky top-0 bg-[#FFF0F5] z-30 pb-4 pt-2">
                <h2 className="text-2xl font-black text-slate-700 mb-4">Food Library</h2>
                <div className="relative">
                    <span className="material-icons-round absolute left-4 top-3 text-slate-400 text-base">search</span>
                    <input className="w-full bg-white pl-10 pr-4 py-3 rounded-2xl shadow-sm outline-none focus:ring-2 ring-pink-300 font-bold text-sm text-slate-700" placeholder="Search foods..." value={librarySearch} onChange={e => setLibrarySearch(e.target.value)} />
                </div>
            </div>
            <div className="space-y-3">
                {sortLibrary(data.library.filter(i => i.name.toLowerCase().includes(librarySearch.toLowerCase()))).map(item => (
                    <button key={item.id} onClick={() => openAddFood(item)} className="w-full bg-white p-4 rounded-2xl shadow-sm flex justify-between items-center text-left hover:bg-white/80 transition-colors">
                        <div>
                            <p className="font-bold text-slate-700">{item.name}</p>
                            <p className="text-[10px] text-slate-400 uppercase">Per {item.measure === 'unit' ? 'Unit' : '100g'}: C:{Math.round(item.carbs)} P:{Math.round(item.protein)}</p>
                        </div>
                        <div className="bg-slate-100 p-2 rounded-full"><span className="material-icons-round text-base text-slate-400">add</span></div>
                    </button>
                ))}
            </div>
        </div>
    );

    return (
        <div className="max-w-md mx-auto min-h-screen px-4 py-6 relative">
            <CatPawSwat trigger={swatTrigger} />
            <SuccessModal isOpen={!!successModalData} onClose={() => setSuccessModalData(null)} {...successModalData} />
            
            {/* Views */}
            {view === 'home' && renderHome()}
            {view === 'fitness' && renderFitness()}
            {view === 'library' && renderLibrary()}
            {view === 'trends' && renderTrends()}
            {view === 'settings' && <div className="text-center pt-20 text-slate-400">Settings logic preserved in background.</div>}

            {/* Nav */}
            <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[95%] max-w-[400px] bg-white/90 backdrop-blur-md border border-white/50 shadow-xl rounded-full p-2 flex justify-around items-center z-40 safe-pb">
                <button onClick={() => setView('home')} className={`p-3 rounded-full transition-all ${view==='home'?'bg-pink-100 text-pink-500':'text-slate-400'}`}><span className="material-icons-round text-xl">home</span></button>
                <button onClick={() => setView('fitness')} className={`p-3 rounded-full transition-all ${view==='fitness'?'bg-pink-100 text-pink-500':'text-slate-400'}`}><span className="material-icons-round text-xl">fitness_center</span></button>
                <button onClick={() => setView('library')} className={`p-3 rounded-full transition-all ${view==='library'?'bg-pink-100 text-pink-500':'text-slate-400'}`}><span className="material-icons-round text-xl">menu_book</span></button>
                <button onClick={() => setView('trends')} className={`p-3 rounded-full transition-all ${view==='trends'?'bg-pink-100 text-pink-500':'text-slate-400'}`}><span className="material-icons-round text-xl">insights</span></button>
            </nav>

            {/* Add Food / Edit Library Modal */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4" onClick={() => setModalOpen(false)}>
                    <div className="bg-white w-full max-w-sm rounded-[2rem] p-6 shadow-2xl animate-in slide-in-from-bottom-10" onClick={e => e.stopPropagation()}>
                        
                        {/* FEATURE 2.5: Header with Edit Toggle */}
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-2">
                                <h2 className="text-xl font-black text-slate-800 uppercase">
                                    {isLibraryEditMode ? 'Edit Library' : (isNew ? 'New Entry' : 'Add Food')}
                                </h2>
                                {/* Show Pencil if it's a library item and we are not already editing it */}
                                {selectedBaseItem && !isLibraryEditMode && (
                                    <button onClick={handleStartEditLibrary} className="text-slate-400 hover:text-pink-500 transition-colors">
                                        <span className="material-icons-round text-lg">edit</span>
                                    </button>
                                )}
                            </div>
                            <button onClick={() => setModalOpen(false)} className="bg-slate-100 w-10 h-10 rounded-full flex items-center justify-center font-bold">&times;</button>
                        </div>

                        {/* FEATURE 2.5: Conditional Body Content */}
                        {isLibraryEditMode ? (
                            <div className="space-y-4">
                                <div className="bg-amber-50 p-3 rounded-xl border border-amber-200">
                                    <p className="text-xs font-bold text-amber-600 flex items-center gap-1">
                                        <span className="material-icons-round text-sm">auto_fix_high</span> 
                                        Smart Editor: Enter values from Nutrition Label
                                    </p>
                                </div>
                                
                                <div className="flex gap-2">
                                    <div className="flex-1">
                                        <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Food Name</label>
                                        <input className="w-full bg-slate-50 p-3 rounded-2xl font-bold outline-none text-sm" value={baseEditValues.name} onChange={e => setBaseEditValues({...baseEditValues, name: e.target.value})} />
                                    </div>
                                    <div className="w-1/3">
                                         <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Type</label>
                                         <button onClick={() => setBaseEditValues({...baseEditValues, measureType: baseEditValues.measureType === 'g' ? 'unit' : 'g'})} className="w-full bg-slate-100 p-3 rounded-2xl font-bold text-xs uppercase text-slate-600 border border-slate-200">
                                            {baseEditValues.measureType === 'g' ? 'Grams' : 'Units'}
                                         </button>
                                    </div>
                                </div>

                                {baseEditValues.measureType === 'g' && (
                                    <div>
                                        <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Serving Size (g)</label>
                                        <input type="number" className="w-full bg-slate-50 p-3 rounded-2xl font-bold outline-none text-center" value={baseEditValues.servingSize} onChange={e => setBaseEditValues({...baseEditValues, servingSize: Number(e.target.value)})} />
                                    </div>
                                )}

                                <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100">
                                    <p className="text-[10px] font-black text-center text-slate-400 uppercase mb-3">
                                        Macros in {baseEditValues.measureType === 'g' ? `${baseEditValues.servingSize}g` : '1 Unit'}
                                    </p>
                                    <div className="grid grid-cols-4 gap-2">
                                        {['carbs', 'protein', 'fat', 'fiber'].map(m => (
                                            <div key={m}>
                                                <label className="text-[8px] font-bold uppercase text-slate-400 block text-center mb-1">{m}</label>
                                                <input type="number" className="w-full p-2 rounded-xl text-center font-bold text-xs bg-white border border-slate-200" value={baseEditValues[m]} onChange={e => setBaseEditValues({...baseEditValues, [m]: Number(e.target.value)})} />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <button onClick={handleSaveLibraryEdit} className="w-full bg-amber-500 text-white py-4 rounded-2xl font-black uppercase shadow-xl hover:bg-amber-600 active:scale-95 transition-transform">Save & Normalize 💾</button>
                            </div>
                        ) : (
                            <div className="space-y-4 max-h-[70vh] overflow-y-auto no-scrollbar">
                                <div className="bg-slate-100 p-1 rounded-xl flex mb-2">
                                    {['g', 'unit'].map(m => (
                                        <button key={m} onClick={() => setEditFood({...editFood, measure: m})} className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase transition-all ${editFood.measure === m ? 'bg-white shadow text-pink-500' : 'text-slate-400'}`}>{m === 'g' ? 'Grams (Weight)' : 'Units (Qty)'}</button>
                                    ))}
                                </div>
                                <input className="w-full bg-slate-50 p-4 rounded-2xl font-bold outline-none text-xs" value={editFood.name} onChange={e => setEditFood({...editFood, name: e.target.value})} placeholder="Food Name" />
                                
                                <div>
                                    <label className="text-[10px] font-black uppercase text-slate-400 ml-2">{editFood.measure === 'g' ? 'Weight (g)' : 'Quantity'}</label>
                                    <input type="number" className="w-full bg-slate-50 p-4 rounded-2xl font-bold text-2xl outline-none text-center" value={editFood.weight} onChange={e => handleWeightChange(e.target.value)} />
                                </div>

                                <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100">
                                    <p className="text-[10px] font-black text-center text-slate-400 uppercase mb-3">Macros (Auto-Calc if Library Item)</p>
                                    <div className="grid grid-cols-4 gap-2">
                                        {['carbs', 'protein', 'fat', 'fiber'].map(m => (
                                            <div key={m}>
                                                <label className="text-[8px] font-bold uppercase text-slate-400 block text-center mb-1">{m}</label>
                                                <input type="number" className="w-full p-2 rounded-xl text-center font-bold text-xs" value={editFood[m]} onChange={e => setEditFood({...editFood, [m]: Number(e.target.value)})} />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <button onClick={handleAddFood} className="w-full bg-pink-500 text-white py-4 rounded-2xl font-black uppercase shadow-xl hover:bg-pink-600 active:scale-95 transition-transform">Add to Bowl 🥣</button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Finish Workout Modal */}
            {finishModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4" onClick={() => setFinishModalOpen(false)}>
                    <div className="bg-white w-full max-w-sm rounded-[2rem] p-6 shadow-2xl animate-in slide-in-from-bottom-10" onClick={e => e.stopPropagation()}>
                        <h2 className="text-xl font-black text-slate-800 uppercase mb-6">Almost Done!</h2>
                        <div className="mb-6">
                            <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Total Duration (Minutes)</label>
                            <input type="number" className="w-full bg-slate-100 p-4 rounded-2xl font-black text-3xl text-center outline-none focus:ring-2 ring-pink-300" value={workoutDuration} onChange={e => setWorkoutDuration(e.target.value)} />
                        </div>
                        <button onClick={handleFinishWorkout} className="w-full bg-slate-800 text-white py-4 rounded-2xl font-black uppercase shadow-xl hover:bg-slate-900 active:scale-95 transition-transform flex items-center justify-center gap-2"><span className="material-icons-round text-xl">check_circle</span> Log Workout</button>
                    </div>
                </div>
            )}

            {/* View History Modal */}
            {viewHistoryItem && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setViewHistoryItem(null)}>
                    <div className="bg-white w-full max-w-sm max-h-[80vh] overflow-y-auto rounded-[2rem] p-4 shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h2 className="text-lg font-black text-slate-800">{WORKOUTS[viewHistoryItem.routine]?.name || "Workout"}</h2>
                                <p className="text-xs text-slate-400 font-bold">{viewHistoryItem.date} • {viewHistoryItem.duration} mins • {viewHistoryItem.calories} kcal</p>
                            </div>
                            <button onClick={() => setViewHistoryItem(null)} className="bg-slate-100 p-2 rounded-full"><span className="material-icons-round text-base">close</span></button>
                        </div>
                        
                        <div className="space-y-4">
                            {Object.entries(viewHistoryItem.exercises).map(([name, sets], idx) => (
                                <div key={idx} className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                                    <p className="font-bold text-slate-700 text-sm mb-2">{name}</p>
                                    <div className="workout-grid mb-1 px-1 text-center">
                                        <span className="text-[8px] font-black uppercase text-slate-300">Set</span>
                                        <span className="text-[8px] font-black uppercase text-slate-300">Lbs</span>
                                        <span className="text-[8px] font-black uppercase text-slate-300">Reps</span>
                                        <span className="text-[8px] font-black uppercase text-slate-300">Diff</span>
                                    </div>
                                    <div className="space-y-1">
                                        {sets.map((s, sIdx) => (
                                            <div key={sIdx} className="workout-grid">
                                                <div className="text-center font-bold text-slate-400 text-xs">{sIdx + 1}</div>
                                                <input disabled className="bg-white p-1.5 rounded-lg text-center font-bold text-xs text-slate-600 border border-slate-200" value={s.weight} />
                                                <input disabled className="bg-white p-1.5 rounded-lg text-center font-bold text-xs text-slate-600 border border-slate-200" value={s.reps} />
                                                <div className="text-center text-xs">{s.difficulty}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);