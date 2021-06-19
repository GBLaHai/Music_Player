/**
 * 1. Render songs
 * 2. Scroll top
 * 3. Play / pause / seek
 * 4. CD rotate
 * 5. Next / prev
 * 6. Random
 * 7. Next / repeat when ended
 * 8. Active song
 * 9. Scroll active song into view
 * 10. Play song when click
 */

const $ = document.querySelector.bind(document);
const $$ = document.querySelectorAll.bind(document); 

const PLAYER_STORAGE_KEY = 'USER_PLAYER';

const playlist = $('.playlist');
const player = $('.player');
const progress = $('.progress');
const cd = $('.cd');
const heading = $('header h2');
const cdThumb = $('.cd-thumb');
const audio = $('#audio');
const nextBtn = $('.btn-next');
const prevBtn = $('.btn-prev');
const randomBtn = $('.btn-random');
const repeatBtn = $('.btn-repeat');

const app = {
    currentIndex: 0,
    isPlaying: false,
    isRandom: false,
    isRepeat: false,
    config: JSON.parse(localStorage.getItem(PLAYER_STORAGE_KEY)) || {},
    songs:  [
        {
            name: 'Nevada',
            singer: 'Vicetone',
            path: './assets/music/Nevada.mp3',
            image: './assets/img/Nevada.jpg'
        },
        {
            name: 'Reality',
            singer: 'Lost Frequencies',
            path: './assets/music/Reality.mp3',
            image: './assets/img/Reality.jpg'
        },
        {
            name: 'Monoday',
            singer: 'TheFatRat',
            path: './assets/music/Monoday.mp3',
            image: './assets/img/Monoday.jfif'
        },
        {
            name: 'Sugar',
            singer: 'Maroon 5',
            path: './assets/music/Sugar.mp3',
            image: './assets/img/Sugar.jpg'
        },
        {
            name: 'Lemon Tree',
            singer: 'DJ DESA REMIX',
            path: './assets/music/LemonTree.mp3',
            image: './assets/img/LemonTree.jpg'
        },
        {
            name: 'Attention',
            singer: 'Charlie Puth',
            path: './assets/music/Attention.mp3',
            image: './assets/img/Attention.jfif'
        }
    ],
    setConfig: function(key, value) {
        this.config[key] = value;
        localStorage.setItem(PLAYER_STORAGE_KEY, JSON.stringify(this.config));
    },
    render: function() {
        const htmls = this.songs.map((song, index) => {
            return `
            <div class="song ${index === this.currentIndex ? 'active' : ''}" data-index="${index}">
                <div class="thumb" style="background-image: url('${song.image}')">
                </div>
                <div class="body">
                <h3 class="title">${song.name}</h3>
                <p class="author">${song.singer}</p>
                </div>
                <div class="option">
                <i class="fas fa-ellipsis-h"></i>
                </div>
            </div>
            `
        });

        playlist.innerHTML = htmls.join('');

    },
    defineProperties: function() {
        Object.defineProperty(this, 'currentSong', {
            get: function() {
                return this.songs[this.currentIndex];
            }
        })
    },
    handleEvents: function() {
        const _this = this;
        const cdWidth = cd.offsetWidth;

        // Xử lí cd quay và dừng
        const cdThumbAnimate = cdThumb.animate([
            { transform: 'rotate(360deg)'}
        ], {
            duration: 10000, // 10 seconds
            iterations: Infinity,
        });
        cdThumbAnimate.pause();

        // Xử lí phong to / thu nhỏ cd
        document.onscroll = function() {
            const scrollTop = document.documentElement.scrollTop || window.scrollY;
            const newCdWidth = cdWidth - scrollTop;

            cd.style.width = newCdWidth > 10 ? newCdWidth + 'px' : 0;
            cd.style.opacity = newCdWidth / cdWidth;
        }

        // xử lí khi click play
        const playBtn = $('.btn-toggle-play');
        playBtn.onclick = function() {
            if(_this.isPlaying) {
                audio.pause();
            } else {
                audio.play();
            }
        }

        // khi song được play
        audio.onplay = function() {
            _this.isPlaying = true;
            player.classList.add('playing');
            cdThumbAnimate.play();
        }

        // Khi song bị pause
        audio.onpause = function() {
            _this.isPlaying = false;
            player.classList.remove('playing');
            cdThumbAnimate.pause();
        }

        // Khi tiến độ bài hát thay đổi
        audio.ontimeupdate = function() {
            if (audio.duration) {
                const progressPercent = Math.floor(this.currentTime / audio.duration *100);
                progress.value = progressPercent;
            }
        }

        // Xử lí khi tua song
        progress.onchange = function(e) {
            const seekTime = e.target.value*audio.duration/100;
            audio.currentTime = seekTime;
        }

        // khi next songs
        nextBtn.onclick = function() {
            const activeSong = $('.song.active');
            activeSong.classList.remove('active');
            if(_this.isRandom) {
                _this.playRandomSong();
            } else {
                _this.nextSong();
            }
            audio.play();
            const listSong = $$('.song');
            listSong.forEach(function(song, index) {
                if(index === _this.currentIndex) {
                    song.classList.add('active');
                }
            })
            _this.srollToActiveSong();
        }

        // khi prev songs
        prevBtn.onclick = function() {
            if(_this.isRandom) {
                _this.playRandomSong();
            } else {
                _this.prevSong();
            }
            audio.play();
            _this.render();
            _this.srollToActiveSong();
        }

        // Xử lí bật / tắt nút random
        randomBtn.onclick = function() {
            _this.isRandom = !_this.isRandom;
            _this.setConfig('isRandom', _this.isRandom);
            randomBtn.classList.toggle('active', _this.isRandom);
        }

        // Xử lí next song when song ended
        audio.onended = function () {
            if(_this.isRepeat) {
                audio.play();
            } else {
                nextBtn.onclick();
            }
        }

        // Xử lí bật / tắt nút repeat
        repeatBtn.onclick = function () {
            _this.isRepeat = !_this.isRepeat;
            _this.setConfig('isRepeat', _this.isRepeat);
            repeatBtn.classList.toggle('active', _this.isRepeat);
        }

        // Lắng nghe event click into playlist
        playlist.onclick = function (e) {
            const nodeSong = e.target.closest('.song:not(.active)');
            const optionBtn =  e.target.closest('.option')
            if(nodeSong || optionBtn) {

                // Xử lí khi click vào song
                if(nodeSong && !optionBtn) {
                    _this.currentIndex = Number(nodeSong.getAttribute('data-index'));
                    _this.loadCurrentSong();
                    _this.render();
                    audio.play();
                    
                }

                // Xử lí khi click vào song option
                if(optionBtn){

                }
            }
        }
    },
    nextSong: function() {
        this.currentIndex ++;
        if(this.currentIndex >= this.songs.length) {
            this.currentIndex -= this.songs.length;
        }
        this.loadCurrentSong();
    },
    prevSong: function() {
        this.currentIndex--;
        if (this.currentIndex < 0) {
            this.currentIndex += this.songs.length;
        }
        this.loadCurrentSong();
    },
    playRandomSong: function() {
        let newIndex;
        do {
            newIndex = Math.floor(Math.random() * this.songs.length);
        } while (newIndex === app.currentIndex);

        app.currentIndex = newIndex;
        this.loadCurrentSong();
    },
    activeCurrentSong: function() {
        this.currentSong;
    },
    loadCurrentSong: function() {
        heading.textContent = this.currentSong.name;
        cdThumb.style.backgroundImage = `url('${this.currentSong.image}')`;
        audio.src = this.currentSong.path;
    },
    loadConfig: function() {
        app.isRandom = this.config.isRandom;
        app.isRepeat = this.config.isRepeat;
    },
    srollToActiveSong: function() {
        setTimeout(() => {
            const activeSong = $('.song.active');
            activeSong.scrollIntoView({
                behavior: 'smooth',
                block: 'end',
            });
        }, 100);
    },
    start: function() {
        // Gán cấu hình từ config vào app
        this.loadConfig();

        // Định nghĩa các thuộc tính cho Object
        this.defineProperties();
        
        // Lắng nghe / xử lí các sự kiện trong DOM events
        this.handleEvents();

        // Tải thông tin bài hát đầu tiên vào UI khi chạy ứng dụng
        this.loadCurrentSong();

        // Render playlist
        this.render();

        // Hiển thị trạng thái ban đẩu của btn repeat $ random
        randomBtn.classList.toggle('active', this.isRandom);
        repeatBtn.classList.toggle('active', this.isRepeat);
    }
}

app.start();

function run(x,y) {
    if(x+1 < y) {
        return [x+1, ...run(x+1,y)];
    }
    return [];
}
