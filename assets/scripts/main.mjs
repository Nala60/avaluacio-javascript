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
    const info = document.querySelector('main .info');
    info.classList.remove('animate');
    let totalWait = 2500 + waitms + 1000;
    console.log('info', text);
    info.querySelector('span').textContent = text;

    setTimeout(() => {
        info.classList.add('animate');
        setTimeout(() => info.classList.remove('animate'), 2500);
    }, 200)
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
function endPopupShow(lost) {
    endPopup.querySelector('span').textContent = `Player ${lost} lost!`;
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
    item.dataset.familly = familly.name;
    item.dataset.def = familly.defense;
    item.dataset.pwr = familly.power;
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
            const i = document.createElement('div');
            i.classList.add('item');

            clear(pobj[key]);

            i.dataset.type = `${key}s`;
            i.dataset.familly = '';

            pobj[key].appendChild(i);
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
                clear(i);
                i.appendChild(event.target);
                resolve();
            }
            selection.addEventListener('click', listener);
        });
    }
    const gearFactory = async function*() {
        const d = await data();
        console.log(d);
        for(const type of ['helmet', 'armor', 'shoe']) {
            console.log('factory', type, );
            const variants = d[type].variants;
            for(const familly of variants) {
                const item = createItem(`${type}s`, familly);
                selection.appendChild(item);
            }

            yield type;

            clear(selection)
        }
    }
    game.turn = game.pickPreference;
    
    for await(const type of gearFactory()) {
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
    const d = await data();
    await info("Fight!");

    let p1 = 50;
    let p1def 
        = game.player1.helmet.querySelector('.item').dataset.def * d.helmet.multiplier
        + game.player1.armor.querySelector('.item').dataset.def * d.armor.multiplier
        + game.player1.shoe.querySelector('.item').dataset.def * d.shoe.multiplier
        + 2

    let p1pwr
        = game.player1.helmet.querySelector('.item').dataset.pwr * d.helmet.multiplier
        + game.player1.armor.querySelector('.item').dataset.pwr * d.armor.multiplier
        + game.player1.shoe.querySelector('.item').dataset.pwr * d.shoe.multiplier
    let p2 = 50;
    let p2def 
        = game.player2.helmet.querySelector('.item').dataset.def * d.helmet.multiplier
        + game.player2.armor.querySelector('.item').dataset.def * d.armor.multiplier
        + game.player2.shoe.querySelector('.item').dataset.def * d.shoe.multiplier
        + 2

    let p2pwr
        = game.player2.helmet.querySelector('.item').dataset.pwr * d.helmet.multiplier
        + game.player2.armor.querySelector('.item').dataset.pwr * d.armor.multiplier
        + game.player2.shoe.querySelector('.item').dataset.pwr * d.shoe.multiplier

    game.turn = game.fightPreference;

    console.log(p1pwr, p2pwr, p1def, p2def)

    while(true) {
        const def = game.turn == 1 ? p2def : p1def;
        const pwr = game.turn == 2 ? p2def : p1def;
        const dmg = pwr * ((100 - def) / 100) * ((Math.random() + 0.5) * 0.5 + 0.5) * 0.7;
        await info(`Player ${game.turn} did ${dmg.toFixed(2)} damage!`);
        if(game.turn == 1) {
            p2 -= dmg;
            document.querySelector('.p2hp').textContent = p2.toFixed(2);
        } else {
            p1 -= dmg;
            document.querySelector('.p1hp').textContent = p1.toFixed(2);
        }

        console.log(p1, p2, game.turn);
        if(p1 < 0) return 1;
        if(p2 < 0) return 2;
        game.nextTurn();
    }
}
async function start() {
    await wait(250);
    console.log('start');
    init();
    randomize();
    console.log(game);
    await pick();
    const lost = await fight();
    endPopupShow(lost);
}

startPopupButton.addEventListener('click', startPopupHandler);
startPopupShow();
