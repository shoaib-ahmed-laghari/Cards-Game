const ICONS = ["👑", "⚡", "💀", "🕶️", "🧩", "🌀", "🎭", "🧠", "🎲", "🔮", "🗝️", "♠️", "♥️"];

const SFX = {
    ctx: null,
    enabled: false,
    musicEnabled: false,
    bg: document.getElementById("bgMusic"),

    init() {
        if (!this.ctx) this.ctx = new (window.AudioContext || webkitAudioContext)();
        if (this.ctx.state === "suspended") this.ctx.resume();
    },

    beep(f, d, v, t = "sine") {
        if (!this.enabled) return;
        this.init();
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = t; o.frequency.value = f; g.gain.value = v;
        o.connect(g); g.connect(this.ctx.destination);
        o.start(); o.stop(this.ctx.currentTime + d);
    },

    flip() { this.beep(300, .08, .15) },
    match() { this.beep(800, .25, .25, "triangle") },
    fail() { this.beep(160, .2, .25, "sawtooth") }
};

class Game {
    constructor() {
        this.board = document.getElementById("board");
        this.level = 1; this.score = 0;
        this.init();
    }

    init() {
        this.pairs = 3 + this.level;
        this.cols = this.level < 4 ? 3 : this.level < 7 ? 4 : 5;
        this.first = null; this.lock = false;
        this.moves = 0; this.time = 0; this.match = 0;
        clearInterval(this.timer); this.timer = null;
        document.getElementById("level").textContent = this.level;
        this.render();
    }

    render() {
        let icons = [];
        for (let i = 0; i < this.pairs; i++) icons.push(ICONS[i % ICONS.length]);
        let deck = [...icons, ...icons].sort(() => Math.random() - .5);
        this.board.innerHTML = "";
        this.board.style.gridTemplateColumns = `repeat(${this.cols},1fr)`;
        deck.forEach(icon => {
            const c = document.createElement("div");
            c.className = "card";
            c.innerHTML = `<div class="face back"></div><div class="face front">${icon}</div>`;
            c.onclick = () => this.flip(c, icon);
            this.board.appendChild(c);
        });
    }

    flip(card, icon) {
        if (this.lock || card.classList.contains("revealed")) return;
        SFX.flip();
        if (!this.timer) this.timer = setInterval(() => this.tick(), 1000);
        card.classList.add("revealed");

        if (!this.first) { this.first = { card, icon }; return; }

        this.lock = true; this.moves++;

        if (this.first.icon === icon) {
            setTimeout(() => {
                SFX.match();
                card.classList.add("matched");
                this.first.card.classList.add("matched");
                this.score += 100; this.match++;
                this.reset(); this.updateUI();
                if (this.match === this.pairs) this.win();
            }, 350);
        } else {
            setTimeout(() => {
                SFX.fail();
                card.classList.remove("revealed");
                this.first.card.classList.remove("revealed");
                this.reset();
            }, 650);
        }
    }

    reset() { this.first = null; this.lock = false }
    tick() {
        this.time++;
        let m = String(Math.floor(this.time / 60)).padStart(2, "0");
        let s = String(this.time % 60).padStart(2, "0");
        document.getElementById("time").textContent = `${m}:${s}`;
        this.updateUI();
    }

    updateUI() {
        document.getElementById("moves").textContent = this.moves;
        document.getElementById("score").textContent = this.score;
    }

    win() {
        clearInterval(this.timer);
        document.getElementById("resultText").textContent =
            this.level < 4 ? "GOOD 👍" : this.level < 7 ? "BETTER 🔥" : "BEST 👑";
        document.getElementById("winModal").classList.add("show");
    }
}

const game = new Game();

// Song Button
const songBtn = document.getElementById("songBtn");
songBtn.onclick = async () => {
    SFX.musicEnabled = !SFX.musicEnabled;
    SFX.init();
    if (SFX.musicEnabled) {
        SFX.bg.volume = 0.3;
        await SFX.bg.play();
        songBtn.textContent = "SONG ON 🎵";
        songBtn.classList.add("active");
    } else {
        SFX.bg.pause();
        songBtn.textContent = "SONG OFF 🎵";
        songBtn.classList.remove("active");
    }
};

// Card SFX Button
const sfxBtn = document.getElementById("sfxBtn");
sfxBtn.onclick = () => {
    SFX.enabled = !SFX.enabled;
    SFX.init();
    if (SFX.enabled) {
        sfxBtn.textContent = "SOUNDS ON 🔊";
        sfxBtn.classList.add("active");
    } else {
        sfxBtn.textContent = "SOUNDS OFF 🔊";
        sfxBtn.classList.remove("active");
    }
};

document.getElementById("nextLevel").onclick = () => {
    game.level++; game.init();
    document.getElementById("winModal").classList.remove("show");
};