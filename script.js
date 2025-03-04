let isMuted = false; // 🚀 Start Muted by Default
const muteButton = document.getElementById("mute-btn");
let lastSpokenText = ""; // 🔹 Stores the last spoken message when muted

muteButton.addEventListener("click", () => {
    isMuted = !isMuted;
    muteButton.textContent = isMuted ? "🔇 Muted" : "🔊 Unmuted";

    if (!isMuted && lastSpokenText) {
        // 🛑 Stop current speech and restart from the last message
        speechSynthesis.cancel();
        speakMessage(lastSpokenText, true); // ✅ Resume speaking
    } else {
        speechSynthesis.cancel(); // 🔇 If muting, stop speech immediately
    }
});



document.addEventListener("DOMContentLoaded", function() {
    addBotMessage("Hello! I'm here to help you find mental health support. How are you feeling today?");
    init3DCharacter();

document.addEventListener("click", () => {
    speechSynthesis.speak(new SpeechSynthesisUtterance(""));
}, { once: true });

    
    const sendButton = document.getElementById("send-btn");
    const inputField = document.getElementById("chat-input");
    const voiceButton = document.getElementById("voice-btn");

    sendButton.addEventListener("click", sendMessage);
    inputField.addEventListener("keypress", (event) => {
        if (event.key === "Enter") sendMessage();
    });
    voiceButton.addEventListener("click", startVoiceRecognition);
});

const chatBox = document.getElementById("chat-box");

function sendMessage() {
    const inputField = document.getElementById("chat-input");
    const message = inputField.value.trim();
    if (!message) return;
    addUserMessage(message);
    inputField.value = "";

    fetch("https://pennybackend.onrender.com/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message })
    })
    .then(response => response.json())
    .then(data => {
        addBotMessage(data.reply);
    })
    .catch(err => {
        addBotMessage("Sorry, something went wrong.");
        console.error(err);
    });
}

function addUserMessage(message) {
    const messageDiv = document.createElement("div");
    messageDiv.className = "message user-message";
    messageDiv.textContent = message;
    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function addBotMessage(message) {
    const messageDiv = document.createElement("div");
    messageDiv.className = "message bot-message";
    messageDiv.textContent = message;
    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight;

    speakMessage(message);
}

// 🎙️ Speech with Lip Sync
let currentUtterance = null; // Stores the current speech, so we can stop it if needed.

function speakMessage(text, isResuming = false) {
    if (isMuted) {
        lastSpokenText = text; // 🔹 Store last message if muted
        return; // 🛑 Do not speak aloud when muted
    }

    // 🛑 Stop Current Speech if User Sends a New Message
    if (currentUtterance) {
        speechSynthesis.cancel();
        currentUtterance = null;
    }

    // 🔹 Ensure Speech API Works on Mobile by Preloading
    if (speechSynthesis.speaking || speechSynthesis.pending) {
        setTimeout(() => speakMessage(text, isResuming), 100);
        return;
    }

    // 1️⃣ **Remove Bracketed Organization Names**
    text = text.replace(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g, "$2");

    // 2️⃣ **Format URLs to be spoken naturally**
    text = text.replace(/https?:\/\/(www\.)?/gi, "");
    text = text.replace(/\.(com|org|net|gov|edu|info|io|co\.uk|org\.uk|ac\.uk|gov\.uk|me\.uk|uk|fr|de|es)\b/gi, " dot $1");

    // 3️⃣ **Ensure Short Phone Numbers Are Read Digit by Digit**  
    text = text.replace(/\b(\d{3})\s(\d{3})\b/g, (match, p1, p2) => {
        return p1.split("").join(" ") + " " + p2.split("").join(" ");
    });

    // 4️⃣ **Split Text into Sentences for Smooth Speech**
    const utteranceQueue = text.match(/[^.!?]+[.!?]*/g) || [text];

    function selectBestVoice(utterance) {
        const voices = speechSynthesis.getVoices();

        let bestVoice = voices.find(voice => voice.lang === "en-GB" && voice.name.includes("Female"));

        if (!bestVoice) {
            bestVoice = voices.find(voice =>
                voice.name.includes("Google UK English Female") ||
                voice.name.includes("Google US English") ||
                voice.name.includes("Samantha") ||
                voice.name.includes("Victoria") ||
                voice.name.includes("Karen")
            );
        }

        if (bestVoice) {
            utterance.voice = bestVoice;
        } else {
            console.warn("❌ No preferred female voice found. Using default voice.");
        }
    }

    function speakNextSentence() {
        if (utteranceQueue.length === 0) return;

        currentUtterance = new SpeechSynthesisUtterance(utteranceQueue.shift());
        currentUtterance.lang = "en-GB";
        currentUtterance.rate = 0.9;
        currentUtterance.pitch = 1.2;

        selectBestVoice(currentUtterance);

        currentUtterance.onstart = () => playLipSync();
        currentUtterance.onend = () => {
            stopLipSync();
            setTimeout(speakNextSentence, 200);
        };

        speechSynthesis.speak(currentUtterance);
    }

    if (speechSynthesis.getVoices().length === 0) {
        speechSynthesis.onvoiceschanged = speakNextSentence;
    } else {
        speakNextSentence();
    }
}





//startHeadMovement(); // 🎭 Head moves while speaking
        //playAnimation("talking"); // ✅ Play talking animation
//stopHeadMovement(); // 🛑 Stop movement after speaking
            //playAnimation("idle"); // ✅ Return to idle animation after speaking


// Ensure voices load properly (Fix for Chrome)
speechSynthesis.onvoiceschanged = () => {
    console.log("Voices updated:", speechSynthesis.getVoices());
};

// 🎤 Voice Recognition (Improved Listening)
function startVoiceRecognition() {
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = "en-GB";
    recognition.continuous = true;
    recognition.interimResults = true;

    let finalTranscript = "";
    let silenceTimer;

    recognition.onresult = (event) => {
        let interimTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript + " ";
            } else {
                interimTranscript += event.results[i][0].transcript;
            }
        }

        document.getElementById("chat-input").value = finalTranscript + interimTranscript;

        clearTimeout(silenceTimer);
        silenceTimer = setTimeout(() => {
            recognition.stop();
            sendMessage();
        }, 1500);
    };

    recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
    };

    recognition.start();
}

 


// 🌟 3D Character Setup
let scene, camera, renderer, character, mixer;
let animations = {}; // ✅ Ensure animations are stored properly
let mouthOpenIndex = null;
let eyeBlinkLIndex = null;
let eyeBlinkRIndex = null;

function init3DCharacter() {
    const container = document.getElementById("character-container");
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(50, container.offsetWidth / container.offsetHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setSize(container.offsetWidth, container.offsetHeight);
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 1.7);
    scene.add(ambientLight);

    const loader = new THREE.GLTFLoader();
    loader.load("https://models.readyplayer.me/67c3374808c357cff848a050.glb", (gltf) => {
        console.log("✅ GLB Loaded:", gltf);
        character = gltf.scene;
        console.log("✅ Character Nodes:", character);
        character.scale.set(0.6, 0.6, 0.6);
        character.position.set(0, -1, 0);
        scene.add(character);

        mixer = new THREE.AnimationMixer(character);
        loadAnimations();

        // 🎯 Get Blend Shape Indexes
        character.traverse((child) => {
            if (child.isMesh && child.morphTargetDictionary) {
                mouthOpenIndex = child.morphTargetDictionary["mouthOpen"];
                eyeBlinkLIndex = child.morphTargetDictionary["EyeLeft"];
                eyeBlinkRIndex = child.morphTargetDictionary["EyeRight"];
            }
        });

        startBlinking();
        //startIdleHeadMovement(); // 🔄 Start idle movement
    },
    undefined,
    (error) => {
        console.error("❌ Error Loading GLB:", error);
    }
);

    camera.position.set(0.065, 1.48, 0.95);
    camera.rotation.set(0.54, 0, 0);
    animate();
}

// 🎭 Lip Sync Animation
let lipSyncInterval;

function playLipSync() {
    if (!character || mouthOpenIndex === null) return;

    lipSyncInterval = setInterval(() => {
        character.traverse((child) => {
            if (child.isMesh && child.morphTargetInfluences) {
                child.morphTargetInfluences[mouthOpenIndex] = Math.random() * 0.6 + 0.2;
            }
        });
    }, 100);
}

function stopLipSync() {
    clearInterval(lipSyncInterval);
    character.traverse((child) => {
        if (child.isMesh && child.morphTargetInfluences) {
            child.morphTargetInfluences[mouthOpenIndex] = 0;
        }
    });
}

// 👀 Eye Blinking Animation
function startBlinking() {
    function blink() {
        if (!character) return;

        character.traverse((child) => {
            if (child.isMesh && (child.name.includes("Eye") || child.name.includes("Eyelid"))) {
                child.scale.y = 0.1; // Close eyes by flattening vertically
            }
        });

        setTimeout(() => {
            character.traverse((child) => {
                if (child.isMesh && (child.name.includes("Eye") || child.name.includes("Eyelid"))) {
                    child.scale.y = 1; // Reopen eyes
                }
            });

            setTimeout(blink, Math.random() * 3000 + 3000); // Blink every 3-6 seconds
        }, 150);
    }

    blink();
}


// 🔄 Idle Head Movement
function startIdleHeadMovement() {
    function moveHead() {
        if (!character) return;

        character.rotation.y += (Math.random() * 0.2 - 0.1); // Subtle side-to-side
        character.rotation.x += (Math.random() * 0.1 - 0.05); // Small up-down

        setTimeout(moveHead, Math.random() * 5000 + 5000); // Every 5-10 sec
    }

    moveHead();
}

// 🎭 Speaking Head Movement
let headMovementInterval;

function startHeadMovement() {
    if (!character) return;

    headMovementInterval = setInterval(() => {
        character.rotation.y += (Math.random() * 0.15 - 0.075); // Random small nods
    }, 300);
}

function stopHeadMovement() {
    clearInterval(headMovementInterval);
}

// 🔄 Load Idle & Talking Animations
function loadAnimations() {
    const animLoader = new THREE.GLTFLoader();

    // ✅ Load Idle Animation
    animLoader.load("animations/idle.glb", (gltf) => {
        
        if (gltf.animations.length > 0) {
            animations["idle"] = mixer.clipAction(gltf.animations[0]);
            animations["idle"].play();
        } else {
            console.warn("⚠️ No animations found in idle.glb");
        }
        
        animations["idle"].play(); // ✅ Play idle by default
    });

    // ✅ Load Talking Animation
        animLoader.load("animations/talking.glb", (gltf) => {
            animations["talking"] = mixer.clipAction(gltf.animations[0]);
    });
}

// 🎭 Function to switch animations
function playAnimation(name) {
    if (!mixer || !animations[name]) return;
    mixer.stopAllAction();
    animations[name].play();
}


// 🚀 Continuous Animation Loop
function animate() {
    requestAnimationFrame(animate);
    if (mixer) mixer.update(0.02);
    renderer.render(scene, camera);
}

