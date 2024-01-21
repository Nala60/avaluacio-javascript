import data from "./data.mjs";

const startPopupButton = document.querySelector('button#start');
const startPopup = document.querySelector('.startpopup.popup');
const endPopup = document.querySelector('.endpopup');
const main = document.querySelector('main');
const selection = document.querySelector('.selection');

const players = Object.create(null);
Object.defineProperty(players, '1', {
    value: document.querySelector('.player1')
});
Object.defineProperty(players, '2', {
    value: document.querySelector('.player2')
});

const wait = ms => new Promise(resolve => setInterval(resolve, ms));
let _info_running = false;
const info = (text, waitms = 0) => {
    let totalWait = 2500 + waitms + 60;
    console.log('info', text);
    const info = document.querySelector('main .info');
    info.querySelector('span').textContent = text;

    info.classList.remove('animate');
    setInterval(() => {
        info.classList.add('animate');
    }, 50)
    return new Promise(resolve => setInterval(async () => {
        resolve();
    }, totalWait));
}
const range = function*(a, b) {
    let _a, _b;
    if(typeof b === 'undefined') {
        _a = 0;
        _b = a;
    } else {
        _a = a;
        _b = b;
    }

    for(let i = _a; i < _b; i++) yield i; 
}
/**
 * 
 * @param {HTMLElement} element 
 */
const clear = element => { while(element.firstChild) element.removeChild(element.lastChild) }
const noS = type => type.replace(/s$/, '');

function startPopupShow() {
    startPopup.dataset.active = true;
}
function startPopupHide() {
    startPopup.dataset.active = false;
}
function endPopupShow() {
    endPopup.dataset.active = true;

    setTimeout(() => {
        endPopupHide();
        startPopupShow();
    }, 5000)
}
function endPopupHide() {
    endPopup.dataset.active = false;
}
function startPopupHandler() {
    startPopupHide();
    start();
}

const game = Object.create(null);
Object.defineProperties(game, {
    turn: {
        get: () => {
            return main.dataset.turn;
        },
        set: t => {
            main.dataset.turn = t;
        }
    },
    nextTurn: {
        value: () => game.turn == 1 ? game.turn = 2 : game.turn = 1,
        writable: false
    },
    getPlayer: {
        value: n => game[`player${n}`]
    }
});
const createItem = (type, familly) => {
    /**
     * @type {HTMLTemplateElement}
     */
    const template = document.querySelector('template#item-template');
    const clone = document.importNode(template.content, true);
    const item = clone.querySelector('.item');
    item.dataset.type = type;
    item.dataset.familly = familly;
    return item;
}

function init() {
    console.log('init');

    for(const key in game) delete game[key];

    function initPlayer(n) {
        const player = players[n];
        const pobj = {
            helmet: player.querySelector('.helmet'),
            armor: player.querySelector('.armor'),
            shoe: player.querySelector('.shoe'),
            weapon: null
        }
        for(const key in pobj) {
            if(key === 'weapon') continue;

            pobj[key].dataset.type = `${key}s`;
            pobj[key].dataset.familly = '';
        }
        return pobj;
    }

    game.pickPreference = 1;
    game.fightPreference = 2;

    game.player1 = initPlayer(1);
    game.player2 = initPlayer(2);

    game.turn = 0;
}
function randomize() {
    console.log('randomize');

    if(Math.random() > 0.5) {
        game.pickPreference = 2;
        game.fightPreference = 1;
    }
}
async function pick() {
    console.log('pick');

    await info('Select your equipement!');

    const waitPick = async () => {
        return new Promise(resolve => {
            const listener = (event) => {
                console.log('click!');

                console.log(event.target);
                const target = event.target;

                if(!target.classList.contains('item')) {
                    console.log('nope');
                    return;
                }

                selection.removeEventListener('click', listener);
                console.log('yeah');
                const player = game.getPlayer(game.turn);
                const i = player[noS(target.dataset.type)];
                i.dataset.type = target.dataset.type;
                i.dataset.familly = target.dataset.familly;
                resolve();
            }
            selection.addEventListener('click', listener);
        });
    }
    const gearFactory = function*() {
        for(const type of ['helmet', 'armor', 'shoe']) {
            console.log('factory', type);
            for(const familly of ['cloth', 'leather', 'plate']) {
                const item = createItem(`${type}s`, familly);
                selection.appendChild(item);
            }

            yield type;

            clear(selection)
        }
    }
    game.turn = game.pickPreference;
    
    for(const type of gearFactory()) {
        for(const _ of range(2)) {
            await info(`Player ${game.turn}'s turn to pick!`);
            await waitPick();
            game.nextTurn();
        }
        clear(selection);
    }
    game.turn = 0;
}
async function fight() {
    console.log('fight');
}
async function start() {
    await wait(250);
    console.log('start');
    init();
    randomize();
    console.log(game);
    await pick();
    await fight();
    endPopupShow();
}

startPopupButton.addEventListener('click', startPopupHandler);
startPopupShow();
