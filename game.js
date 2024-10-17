(function () {

    const keys = (e) => {
        switch (e.keyCode) {
            case 27:
                if (confirm('Exit?')) exit();
                break;
            case 87: case 38: //W - Up
                if (currentDirection != 2) direction = 0;
                break;
            case 65: case 37://A - Left
                if (currentDirection != 3) direction = 1;
                break;
            case 83: case 40://S - Down
                if (currentDirection != 0) direction = 2;
                break;
            case 68: case 39://D - Right
                if (currentDirection != 1) direction = 3;
                break;
        }
    }

    const dotSize = 5;
    const cols = window.innerWidth >> dotSize;
    const rows = window.innerHeight >> dotSize;
    const fieldWidth = cols << dotSize;
    const fieldHeight = rows << dotSize;
    const left = (window.innerWidth - fieldWidth) >> 1;
    const top = (window.innerHeight - fieldHeight) >> 1;
    const maxSnakeLength = rows << 4;

    const screen = document.createElement('div');
    screen.style.width = fieldWidth + 'px';
    screen.style.height = fieldHeight + 'px';
    screen.style.position = 'fixed';
    screen.style.left = left + 'px';
    screen.style.top = top + 'px';
    document.title = '8-bit style Snake game by SERЁGA. Code is suitable for MOS 6502, Z80, I8080 and others.'
    document.body.appendChild(screen);

    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        let touchX = 0.0;
        let touchY = 0.0;
        const subAbs = (a, b) => {
            if (a > b) return a - b;
            return b - a;
        }
        window.addEventListener('touchstart', (e) => {
            touchX = e.touches[0].clientX;
            touchY = e.touches[0].clientY;
        });
        window.addEventListener("touchend", (e) => {
            let dx = subAbs(e.changedTouches[0].clientX, touchX);
            let dy = subAbs(e.changedTouches[0].clientY, touchY);
            if (dy < dx) {
                if (e.changedTouches[0].clientX > touchX) {
                    if (currentDirection != 1) direction = 3;
                } else {
                    if (currentDirection != 3) direction = 1;
                }
            } else {
                if (e.changedTouches[0].clientY > touchY) {
                    if (currentDirection != 0) direction = 2;
                } else {
                    if (currentDirection != 2) direction = 0;
                }
            }
        });
    } else {
        window.addEventListener('keydown', keys);
    }

    const colBuffer = new Array(maxSnakeLength);
    const rowBuffer = new Array(maxSnakeLength);
    const eBuffer = new Array(maxSnakeLength);

    let head = 0;
    let tail = 0;
    let col = 5;
    let row = 6;
    let direction = 0;
    let currentDirection = direction;

    let appleScore = 0;
    let appleCol = cols;
    let appleRow = rows;
    let appleVisible = 0;
    let seed = 10;
    let snakeLength = 0;
    let playerScore = 0;
    let game = 0;


    const exit = () => {
        window.removeEventListener('keydown', keys);
        window.clearInterval(game);
        document.body.removeChild(screen);
    }

    const moveDirection = [
        () => { row = clamp(row - 1, 0, rows - 1) },
        () => { col = clamp(col - 1, 0, cols - 1) },
        () => { row = clamp(row + 1, 0, rows - 1) },
        () => { col = clamp(col + 1, 0, cols - 1) }
    ];

    const clamp = (value, min, max) => {
        if (value > max) return min;
        if (value < min) return max;
        return value;
    }

    const createDot = (_col, _row,) => {
        let element = document.createElement('div');
        element.style.position = 'absolute';
        element.style.left = (_col << dotSize) + 'px';
        element.style.top = (_row << dotSize) + 'px';
        element.style.width = (1 << dotSize) + 'px';
        element.style.height = element.style.width;
        return element;
    }

    const addDot = (_col, _row, _head) => {
        if (snakeLength + 1 < maxSnakeLength) {
            let element = createDot(_col, _row);
            element.style.backgroundColor = 'green'
            screen.appendChild(element);
            eBuffer[_head] = element;
            colBuffer[_head] = _col;
            rowBuffer[_head] = _row;
            snakeLength++;
        } else {
            console.warn('Your snake is huge, if you know what I mean.');
        }
    }

    const rand4 = () => {
        seed = Date.now() + seed;
        seed &= 0x7FFF;
        seed = (seed >> 16) ^ (seed & 0xFFFF);
        seed = (seed >> 8) ^ (seed & 0xFF);
        return seed;
    }

    const rand2 = () => {
        seed = rand4();
        seed = (seed >> 4) ^ (seed & 0xF);
        seed = (seed >> 2) ^ (seed & 0x2);
        return seed;
    }

    const normalize = (value, module) => {
        if (value < 0) return normalize(module + value, module);
        if (value > module) return normalize(value - module, module);
        return value;
    }

    const collision = (_col, _row) => {
        for (let i = 0; i < snakeLength; i++) {
            let index = clamp(head - i, 0, maxSnakeLength);
            if (colBuffer[index] == _col && rowBuffer[index] == _row) {
                return true;
            }
        }
        return false;
    }

    const testApplePosition = () => {
        switch (rand2()) {
            case 0:
                appleCol = normalize(appleCol + rand4(), cols - 1);
                appleRow = normalize(appleRow + rand4(), rows - 1);
                break;
            case 1:
                appleCol = normalize(appleCol - rand4(), cols - 1);
                appleRow = normalize(appleRow + rand4(), rows - 1);
                break;
            case 2:
                appleCol = normalize(appleCol + rand4(), cols - 1);
                appleRow = normalize(appleRow - rand4(), rows - 1);
                break;
            case 3:
                appleCol = normalize(appleCol - rand4(), cols - 1);
                appleRow = normalize(appleRow - rand4(), rows - 1);
                break;
        }
        appleScore++;
        if (!collision(appleCol, appleRow)) {
            return true;
        }
        console.warn("Apple collision, recalculate position on next step.");
        return false;
    }

    const createApple = (_col, _row) => {
        let element = createDot(_col, _row);
        element.style.backgroundColor = 'red';
        element.style.display = 'none';
        screen.appendChild(element);
        return element;
    }

    const showApple = () => {
        if (testApplePosition()) {
            apple.style.display = 'block';
            apple.style.left = (appleCol << dotSize) + 'px';
            apple.style.top = (appleRow << dotSize) + 'px';
            appleVisible = 1;
        }
    }
    const hideApple = () => {
        apple.style.display = 'none';
        appleCol = cols;
        appleRow = rows;
        appleScore = 0;
        appleVisible = 0;
    }

    const getApple = (_col, _row) => {
        if (_col == appleCol && _row == appleRow) return true;
        return false;
    }

    let apple = createApple(appleCol, appleRow);

    const move = (_direction) => {
        currentDirection = _direction;
        moveDirection[direction]();
        if (collision(col, row)) {
            window.alert(`GAME OVER!\nScore:${playerScore}`);
            exit();
            return;
        }

        if (appleVisible == 0) {
            showApple();
        }

        head = clamp(head + 1, 0, maxSnakeLength);

        if (getApple(col, row)) {
            playerScore += appleScore;
            hideApple();
            addDot(col, row, head);
        } else {
            let e = eBuffer[tail];
            e.style.left = (col << dotSize) + 'px';
            e.style.top = (row << dotSize) + 'px';
            tail = clamp(tail + 1, 0, maxSnakeLength);
            eBuffer[head] = e;
        }

        colBuffer[head] = col;
        rowBuffer[head] = row;
    }

    if (window.confirm('Greetings and welcome. I want to play a game.')) {
        addDot(col, row, head);
        game = window.setInterval(() => {
            move(direction);
        }, 200);
    }
}())