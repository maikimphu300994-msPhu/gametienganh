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

// 20 câu hỏi Quá khứ đơn chuẩn
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

function loadQuestion() {
    if (currentQ >= quizData.length) {
        questionEl.innerText = "GAME FINISHED!";
        textA.innerText = "FINAL"; textB.innerText = "SCORE: " + score;
        msgEl.innerText = "CONGRATULATIONS! 🏆";
        msgEl.style.color = "#f1c40f";
        return;
    }
    const data = quizData[currentQ];
    questionEl.innerText = data.q;
    textA.innerText = data.a;
    textB.innerText = data.b;
    document.getElementById("progress").innerText = `Question: ${currentQ + 1}/20`;
    
    // Đọc câu hỏi tiếng Anh
    const msg = new SpeechSynthesisUtterance(data.q.replace("___", "blank"));
    msg.lang = "en-US";
    speechSynthesis.speak(msg);
}

function handleAnswer(choice) {
    if (isLock) return;
    isLock = true;

    const correct = quizData[currentQ].c;
    const selectedBox = (choice === "A") ? boxA : boxB;

    if (choice === correct) {
        score += 10;
        selectedBox.style.background = "#2ecc71"; // Xanh lá khi đúng
        selectedBox.style.color = "white";
        msgEl.innerText = "EXCELLENT! 🌟";
        msgEl.style.color = "#2ecc71";
    } else {
        selectedBox.style.background = "#e74c3c"; // Đỏ khi sai
        selectedBox.style.color = "white";
        msgEl.innerText = "WRONG! ❌";
        msgEl.style.color = "#e74c3c";
    }

    document.getElementById("score").innerText = `Score: ${score}`;

    // Tạm dừng 1.5 giây để học sinh thấy kết quả trước khi sang câu mới
    setTimeout(() => {
        currentQ++;
        msgEl.innerText = "";
        boxA.style.background = ""; // Reset màu về mặc định
        boxB.style.background = "";
        boxA.style.color = "";
        boxB.style.color = "";
        isLock = false;
        loadQuestion();
    }, 1500);
}

const faceMesh = new FaceMesh({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
});

faceMesh.setOptions({
    maxNumFaces: 1,
    refineLandmarks: true,
    minDetectionConfidence: 0.6,
    minTrackingConfidence: 0.6
});

faceMesh.onResults((results) => {
    loading.style.display = "none";
    if (!results.multiFaceLandmarks || isLock) return;

    const landmarks = results.multiFaceLandmarks[0];
    const leftEye = landmarks[33];
    const rightEye = landmarks[263];

    // Tính toán góc nghiêng giữa 2 mắt
    const dy = rightEye.y - leftEye.y;
    const dx = rightEye.x - leftEye.x;
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;

    // FIX NGƯỢC BÊN: Nghiêng đầu sang trái màn hình (vai trái học sinh) chọn A, phải chọn B
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
    startBtn.style.display = "none";
    init();
    loadQuestion();
};
