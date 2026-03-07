const video = document.getElementById("video");
const questionText = document.getElementById("question");
const optionA = document.getElementById("optionA");
const optionB = document.getElementById("optionB");
const scoreEl = document.getElementById("score-board");
const progressEl = document.getElementById("progress-text");
const feedback = document.getElementById("feedback-overlay");
const cursor = document.getElementById("tilt-cursor");
const startBtn = document.getElementById("startBtn");

let current = 0;
let score = 0;
let lock = false;
const SENSITIVITY = 12; // Độ nghiêng cần thiết (độ)

const questions = [
    {q:"Yesterday I ___ to school", a:"go", b:"went", correct:"B"},
    {q:"She ___ TV last night", a:"watched", b:"watch", correct:"A"},
    {q:"They ___ football yesterday", a:"play", b:"played", correct:"B"},
    {q:"We ___ dinner at 7pm", a:"eat", b:"ate", correct:"B"},
    {q:"He ___ his homework", a:"did", b:"do", correct:"A"},
    {q:"I ___ a movie yesterday", a:"saw", b:"see", correct:"A"},
    {q:"She ___ a cake", a:"make", b:"made", correct:"B"},
    {q:"They ___ to the park", a:"went", b:"go", correct:"A"},
    {q:"We ___ English yesterday", a:"studied", b:"study", correct:"A"},
    {q:"He ___ very fast", a:"run", b:"ran", correct:"B"}
];

// Âm thanh không cần file
function playSound(type) {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if(type === 'correct') {
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1);
        gain.gain.fadeOut = 0.2;
    } else {
        osc.frequency.setValueAtTime(200, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.2);
    }

    osc.start();
    osc.stop(ctx.currentTime + 0.2);
}

function showQuestion() {
    if(current >= questions.length) {
        finishGame();
        return;
    }
    const q = questions[current];
    questionText.innerText = q.q;
    optionA.innerText = q.a;
    optionB.innerText = q.b;
    progressEl.innerText = `Question: ${current + 1}/${questions.length}`;
    
    // Đọc câu hỏi
    const msg = new SpeechSynthesisUtterance(q.q.replace('___', 'blank'));
    msg.lang = 'en-US';
    speechSynthesis.speak(msg);
}

function checkAnswer(choice) {
    if(lock) return;
    lock = true;

    const isCorrect = choice === questions[current].correct;
    if(isCorrect) {
        score += 10;
        scoreEl.innerText = `Score: ${score}`;
        feedback.innerText = "CORRECT! 🎉";
        feedback.style.color = "#4caf50";
        playSound('correct');
    } else {
        feedback.innerText = "WRONG! ❌";
        feedback.style.color = "#f44336";
        playSound('wrong');
    }

    setTimeout(() => {
        feedback.innerText = "";
        current++;
        lock = false;
        showQuestion();
    }, 1500);
}

function finishGame() {
    questionText.innerText = `Game Over! Final Score: ${score}`;
    document.querySelector('.options-container').style.display = 'none';
    const msg = new SpeechSynthesisUtterance("Congratulations! You finished the game.");
    speechSynthesis.speak(msg);
}

async function init() {
    const faceMesh = new FaceMesh({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
    });

    faceMesh.setOptions({ maxNumFaces: 1, refineLandmarks: true, minDetectionConfidence: 0.5 });

    faceMesh.onResults(results => {
        if (!results.multiFaceLandmarks || lock) return;
        
        const landmarks = results.multiFaceLandmarks[0];
        const leftEye = landmarks[33];
        const rightEye = landmarks[263];
        
        // Tính góc nghiêng (đảo ngược lại vì camera mirror)
        const angle = Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x) * 180 / Math.PI;
        
        // Cập nhật thanh trượt trực quan
        const offset = Math.max(-30, Math.min(30, angle));
        cursor.style.left = `${50 + (offset * 1.5)}%`;

        if (angle > SENSITIVITY) {
            document.getElementById('btnB').classList.add('active-B');
            checkAnswer("B");
            setTimeout(() => document.getElementById('btnB').classList.remove('active-B'), 500);
        } else if (angle < -SENSITIVITY) {
            document.getElementById('btnA').classList.add('active-A');
            checkAnswer("A");
            setTimeout(() => document.getElementById('btnA').classList.remove('active-A'), 500);
        }
    });

    const camera = new Camera(video, {
        onFrame: async () => { await faceMesh.send({image: video}); },
        width: 640, height: 480
    });
    camera.start();
}

startBtn.onclick = () => {
    startBtn.style.display = "none";
    init();
    showQuestion();
};