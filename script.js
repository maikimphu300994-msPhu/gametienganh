const video = document.getElementById("video");
const startBtn = document.getElementById("startBtn");
const questionEl = document.getElementById("question");
const textA = document.getElementById("textA");
const textB = document.getElementById("textB");
const boxA = document.getElementById("boxA");
const boxB = document.getElementById("boxB");
const msgEl = document.getElementById("message");
const loading = document.getElementById("loading-overlay");

let currentQ = 0;
let score = 0;
let isLock = false;

// BỘ CÂU HỎI
const quizData = [
    {q: "1. I ___ to the zoo yesterday.", a: "go", b: "went", c: "B"},
    {q: "2. She ___ TV last night.", a: "watched", b: "watch", c: "A"},
    {q: "3. They ___ football yesterday.", a: "play", b: "played", c: "B"},
    {q: "4. We ___ pizza for dinner.", a: "ate", b: "eat", c: "A"},
    {q: "5. He ___ his homework at 8 PM.", a: "did", b: "do", c: "A"},
    {q: "6. My mom ___ a cake last Sunday.", a: "make", b: "made", c: "B"},
    {q: "7. I ___ a movie last night.", a: "saw", b: "see", c: "A"},
    {q: "8. We ___ English two days ago.", a: "studied", b: "study", c: "A"},
    {q: "9. The cat ___ on the sofa.", a: "sleep", b: "slept", c: "B"},
    {q: "10. They ___ to the beach by car.", a: "drove", b: "drive", c: "A"},
    {q: "11. Yesterday, she ___ very happy.", a: "was", b: "is", c: "A"},
    {q: "12. The birds ___ in the sky.", a: "fly", b: "flew", c: "B"},
    {q: "13. I ___ my keys this morning.", a: "lost", b: "lose", c: "A"},
    {q: "14. He ___ a letter to his friend.", a: "wrote", b: "write", c: "A"},
    {q: "15. We ___ the window yesterday.", a: "break", b: "broke", c: "B"},
    {q: "16. They ___ a song at the party.", a: "sang", b: "sing", c: "A"},
    {q: "17. I ___ a good book last week.", a: "read", b: "reads", c: "A"},
    {q: "18. She ___ very fast in the race.", a: "run", b: "ran", c: "B"},
    {q: "19. We ___ up early this morning.", a: "woke", b: "wake", c: "A"},
    {q: "20. The teacher ___ us a story.", a: "told", b: "tell", c: "A"}
];

function checkResult(isCorrect, score) {
    if (isCorrect) {
        if (score >= 90) { // Giả sử Excellent là trên 90 điểm
            // Dừng các âm thanh đang phát để tránh bị đè tiếng
            this.soundExcellent.pause();
            this.soundExcellent.currentTime = 0;
            
            // Phát tiếng "Yeah" tung hô
            this.soundExcellent.play();
            
            console.log("Hiệu ứng: Excellent! (Yeahhh)");
        } else {
            // Các âm thanh thắng lợi bình thường khác (nếu có)
        }
    } else {
        // Giữ nguyên phần "è è" bạn đã thấy ok hôm qua
        this.soundWrong.pause();
        this.soundWrong.currentTime = 0;
        this.soundWrong.play();
        
        console.log("Hiệu ứng: Wrong! (è è)");
    }
}
}

function loadQuestion() {
    if (currentQ >= quizData.length) {
        questionEl.innerText = "GAME FINISHED!";
        textA.innerText = "FINAL"; textB.innerText = "SCORE: " + score;
        msgEl.innerText = "YOU ARE AMAZING! 🏆";
        return;
    }
    const data = quizData[currentQ];
    questionEl.innerText = data.q;
    textA.innerText = data.a;
    textB.innerText = data.b;
    document.getElementById("progress").innerText = `Question: ${currentQ + 1}/20`;
}

function handleAnswer(choice) {
    if (isLock) return;
    isLock = true;

    const correct = quizData[currentQ].c;
    const selectedBox = (choice === "A") ? boxA : boxB;

    if (choice === correct) {
        score += 10;
        selectedBox.style.background = "#2ecc71";
        selectedBox.style.color = "white";
        msgEl.innerText = "EXCELLENT! 🌟";
        msgEl.style.color = "#2ecc71";
        speakResult("Yeah! Excellent", true); // MÁY NÓI YEAH EXCELLENT
    } else {
        selectedBox.style.background = "#e74c3c";
        selectedBox.style.color = "white";
        msgEl.innerText = "WRONG! ❌";
        msgEl.style.color = "#e74c3c";
        speakResult("Oh no, wrong", false); // MÁY NÓI WRONG
    }

    document.getElementById("score").innerText = `Score: ${score}`;

    setTimeout(() => {
        currentQ++;
        msgEl.innerText = "";
        boxA.style.background = ""; boxB.style.background = "";
        boxA.style.color = ""; boxB.style.color = "";
        isLock = false;
        loadQuestion();
    }, 2000);
}

// KHỞI TẠO FACEMESH
const faceMesh = new FaceMesh({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
});

faceMesh.setOptions({
    maxNumFaces: 1, refineLandmarks: true, minDetectionConfidence: 0.6, minTrackingConfidence: 0.6
});

faceMesh.onResults((results) => {
    loading.style.display = "none";
    if (!results.multiFaceLandmarks || isLock) return;
    const landmarks = results.multiFaceLandmarks[0];
    const leftEye = landmarks[33];
    const rightEye = landmarks[263];
    const angle = Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x) * 180 / Math.PI;

    if (angle < -12) handleAnswer("B"); 
    if (angle > 12) handleAnswer("A");
});

async function init() {
    const camera = new Camera(video, {
        onFrame: async () => { await faceMesh.send({image: video}); },
        width: 640, height: 480
    });
    camera.start();
}

startBtn.onclick = () => {
    // Đánh thức hệ thống giọng nói ngay khi bấm Start
    const wakeup = new SpeechSynthesisUtterance("Start");
    wakeup.volume = 0;
    window.speechSynthesis.speak(wakeup);
    
    startBtn.style.display = "none";
    init();
    loadQuestion();
};

