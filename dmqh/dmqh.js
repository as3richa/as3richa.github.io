var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var Animator = /** @class */ (function () {
    function Animator() {
    }
    return Animator;
}());
var StaticAnimator = /** @class */ (function (_super) {
    __extends(StaticAnimator, _super);
    function StaticAnimator(state) {
        var _this = _super.call(this) || this;
        _this.state = state;
        return _this;
    }
    StaticAnimator.prototype.at = function (time) {
        return this.state;
    };
    return StaticAnimator;
}(Animator));
var InterpolatingAnimator = /** @class */ (function (_super) {
    __extends(InterpolatingAnimator, _super);
    function InterpolatingAnimator(states, durations, startsAt) {
        var _this = _super.call(this) || this;
        if (durations.length != states.length - 1) {
            throw new Error("invariant violation");
        }
        _this.states = states;
        _this.startsAt = [startsAt];
        for (var i = 0; i < durations.length; i++) {
            _this.startsAt.push(_this.startsAt[i] + durations[i]);
        }
        return _this;
    }
    InterpolatingAnimator.prototype.at = function (time) {
        var index = this.startsAt.findIndex(function (startsAt) { return startsAt > time; });
        if (index == -1) {
            return this.states[this.states.length - 1];
        }
        if (index == 0) {
            return this.states[0];
        }
        var state0 = this.states[index - 1];
        var state = this.states[index];
        var startsAt = this.startsAt[index - 1];
        var endsAt = this.startsAt[index];
        var p = (time - startsAt) / (endsAt - startsAt);
        var q = 1.0 - p;
        return {
            x: state0.x * q + state.x * p,
            y: state0.y * q + state.y * p,
            scale: state0.scale * q + state.scale * p,
            opacity: state0.opacity * q + state.opacity * p,
        };
    };
    return InterpolatingAnimator;
}(Animator));
var Engine = /** @class */ (function () {
    function Engine() {
        var _this = this;
        this.gameEntities = [];
        this.initializeUiEntities();
        this.canvas = document.createElement("canvas");
        this.canvas.width = Engine.canvasWidth;
        this.canvas.height = Engine.canvasHeight;
        this.canvas.style.display = "block";
        this.canvas.style.marginTop =
            this.canvas.style.marginBottom = "".concat(Engine.canvasMargin, "px");
        this.canvas.style.marginLeft = this.canvas.style.marginRight = "auto";
        window.addEventListener("resize", this.resizeCanvas.bind(this));
        this.resizeCanvas();
        document.body.appendChild(this.canvas);
        this.context = this.canvas.getContext("2d");
        var renderForever = function (time) {
            _this.renderFrame(time);
            window.requestAnimationFrame(renderForever);
        };
        window.requestAnimationFrame(renderForever.bind(this));
        window.addEventListener("keydown", this.onKeyDown.bind(this));
        new SwipeHandler(this.canvas, Engine.swipeThreshold, this.onSwipe.bind(this));
        this.game = new Game(this.onGameEvents.bind(this));
    }
    Engine.prototype.initializeUiEntities = function () {
        this.uiEntities = [];
        this.uiEntities.push({
            primitive: new Textual("dmqh", Engine.textColor, "topleft"),
            animator: new StaticAnimator(__assign(__assign({}, Engine.titlePosition), { scale: Engine.titleSize, opacity: 1.0 })),
        });
        this.uiEntities.push({
            primitive: new RoundedSquare(Engine.gridColor, Engine.gridRadius),
            animator: new StaticAnimator({
                x: Engine.gridSize / 2,
                y: Engine.gridTop + Engine.gridSize / 2,
                scale: Engine.gridSize,
                opacity: 1.0,
            }),
        });
        for (var x = 0; x < 4; x++) {
            for (var y = 0; y < 4; y++) {
                var _a = this.cellToCanvas(x, y), canvasX = _a.x, canvasY = _a.y;
                this.uiEntities.push({
                    primitive: new RoundedSquare(Engine.emptyCellColor, Engine.tileRadius),
                    animator: new StaticAnimator({
                        x: canvasX,
                        y: canvasY,
                        scale: Engine.tileSize,
                        opacity: 1.0,
                    }),
                });
            }
        }
    };
    Engine.prototype.resizeCanvas = function () {
        var viewportWidth = document.documentElement.clientWidth;
        var viewportHeight = document.documentElement.clientHeight;
        if (viewportWidth < Engine.canvasWidth + 2 * Engine.canvasMargin ||
            viewportHeight < Engine.canvasHeight + 2 * Engine.canvasMargin) {
            var width = Math.min(viewportWidth - 2 * Engine.canvasMargin, ((viewportHeight - 2 * Engine.canvasMargin) / Engine.canvasHeight) *
                Engine.canvasWidth);
            var height = (width / Engine.canvasWidth) * Engine.canvasHeight;
            this.canvas.style.width = "".concat(Math.ceil(width), "px");
            this.canvas.style.height = "".concat(Math.ceil(height), "px");
        }
        else {
            this.canvas.style.width = "".concat(Engine.canvasWidth, "px");
            this.canvas.style.height = "".concat(Engine.canvasHeight, "px");
        }
    };
    Engine.prototype.onKeyDown = function (event) {
        var handled = true;
        switch (event.key) {
            case "Up":
            case "ArrowUp":
            case "w":
                this.game.play(Move.Up);
                break;
            case "Right":
            case "ArrowRight":
            case "d":
                this.game.play(Move.Right);
                break;
            case "Down":
            case "ArrowDown":
            case "s":
                this.game.play(Move.Down);
                break;
            case "Left":
            case "ArrowLeft":
            case "a":
                this.game.play(Move.Left);
                break;
            default:
                handled = false;
        }
        if (handled) {
            event.preventDefault();
        }
    };
    Engine.prototype.onSwipe = function (direction) {
        switch (direction) {
            case SwipeDirection.Up:
                this.game.play(Move.Up);
                break;
            case SwipeDirection.Right:
                this.game.play(Move.Right);
                break;
            case SwipeDirection.Down:
                this.game.play(Move.Down);
                break;
            case SwipeDirection.Left:
                this.game.play(Move.Left);
                break;
        }
    };
    Engine.prototype.onGameEvents = function (events) {
        var startsAt = performance.now();
        this.gameEntities = [];
        this.animateStatics(events.statics);
        this.animateScore(events.score, startsAt);
        if (events.moves.length == 0 && events.merges.length == 0) {
            this.animateSpawns(events.spawns, startsAt);
        }
        else {
            this.animateMoves(events.moves, events.merges, startsAt);
            this.animateSpawns(events.spawns, startsAt + Engine.moveDuration);
            this.animateMerges(events.merges, startsAt + Engine.moveDuration);
            if (events.gameOver) {
                this.animateGameOver(startsAt + 2 * Engine.moveDuration);
            }
        }
    };
    Engine.prototype.renderFrame = function (time) {
        var e_1, _a;
        this.context.resetTransform();
        this.context.globalAlpha = 1.0;
        this.context.clearRect(0, 0, Engine.canvasWidth, Engine.canvasHeight);
        try {
            for (var _b = __values(this.uiEntities.concat(this.gameEntities)), _c = _b.next(); !_c.done; _c = _b.next()) {
                var entity = _c.value;
                var _d = entity.animator.at(time), x = _d.x, y = _d.y, scale = _d.scale, opacity = _d.opacity;
                this.context.resetTransform();
                this.context.translate(x, y);
                this.context.scale(scale, scale);
                this.context.globalAlpha = opacity;
                entity.primitive.render(this.context);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_1) throw e_1.error; }
        }
    };
    Engine.prototype.animateStatics = function (statics) {
        var e_2, _a;
        try {
            for (var statics_1 = __values(statics), statics_1_1 = statics_1.next(); !statics_1_1.done; statics_1_1 = statics_1.next()) {
                var static_ = statics_1_1.value;
                var _b = this.cellToCanvas(static_.x, static_.y), x = _b.x, y = _b.y;
                this.gameEntities.push({
                    primitive: new Tile(static_.value, Engine.tileRadius),
                    animator: new StaticAnimator({
                        x: x,
                        y: y,
                        scale: Engine.tileSize,
                        opacity: 1,
                    }),
                });
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (statics_1_1 && !statics_1_1.done && (_a = statics_1.return)) _a.call(statics_1);
            }
            finally { if (e_2) throw e_2.error; }
        }
    };
    Engine.prototype.animateMoves = function (moves, merges, startsAt) {
        var e_3, _a, e_4, _b;
        try {
            for (var moves_1 = __values(moves), moves_1_1 = moves_1.next(); !moves_1_1.done; moves_1_1 = moves_1.next()) {
                var move = moves_1_1.value;
                var _c = this.cellToCanvas(move.x0, move.y0), x0 = _c.x, y0 = _c.y;
                var _d = this.cellToCanvas(move.x, move.y), x = _d.x, y = _d.y;
                this.gameEntities.push({
                    primitive: new Tile(move.value, Engine.tileRadius),
                    animator: new InterpolatingAnimator([
                        { x: x0, y: y0, scale: Engine.tileSize, opacity: 1 },
                        { x: x, y: y, scale: Engine.tileSize, opacity: 1 },
                    ], [Engine.moveDuration], startsAt),
                });
            }
        }
        catch (e_3_1) { e_3 = { error: e_3_1 }; }
        finally {
            try {
                if (moves_1_1 && !moves_1_1.done && (_a = moves_1.return)) _a.call(moves_1);
            }
            finally { if (e_3) throw e_3.error; }
        }
        try {
            for (var merges_1 = __values(merges), merges_1_1 = merges_1.next(); !merges_1_1.done; merges_1_1 = merges_1.next()) {
                var merge = merges_1_1.value;
                var _e = this.cellToCanvas(merge.x0, merge.y0), x0 = _e.x, y0 = _e.y;
                var _f = this.cellToCanvas(merge.x1, merge.y1), x1 = _f.x, y1 = _f.y;
                var _g = this.cellToCanvas(merge.x, merge.y), x = _g.x, y = _g.y;
                this.gameEntities.push({
                    primitive: new Tile(merge.value0, Engine.tileRadius),
                    animator: new InterpolatingAnimator([
                        { x: x0, y: y0, scale: Engine.tileSize, opacity: 1 },
                        { x: x, y: y, scale: Engine.tileSize, opacity: 1 },
                        { x: x, y: y, scale: Engine.tileSize, opacity: 0 },
                    ], [Engine.moveDuration, 0], startsAt),
                });
                this.gameEntities.push({
                    primitive: new Tile(merge.value0, Engine.tileRadius),
                    animator: new InterpolatingAnimator([
                        { x: x1, y: y1, scale: Engine.tileSize, opacity: 1 },
                        { x: x, y: y, scale: Engine.tileSize, opacity: 1 },
                        { x: x, y: y, scale: Engine.tileSize, opacity: 0 },
                    ], [Engine.moveDuration, 0], startsAt),
                });
            }
        }
        catch (e_4_1) { e_4 = { error: e_4_1 }; }
        finally {
            try {
                if (merges_1_1 && !merges_1_1.done && (_b = merges_1.return)) _b.call(merges_1);
            }
            finally { if (e_4) throw e_4.error; }
        }
    };
    Engine.prototype.animateSpawns = function (spawns, startsAt) {
        var e_5, _a;
        try {
            for (var spawns_1 = __values(spawns), spawns_1_1 = spawns_1.next(); !spawns_1_1.done; spawns_1_1 = spawns_1.next()) {
                var spawn = spawns_1_1.value;
                var _b = this.cellToCanvas(spawn.x, spawn.y), x = _b.x, y = _b.y;
                this.gameEntities.push({
                    primitive: new Tile(spawn.value, Engine.tileRadius),
                    animator: new InterpolatingAnimator([
                        { x: x, y: y, scale: 0, opacity: 0 },
                        { x: x, y: y, scale: Engine.tileSize, opacity: 1 },
                    ], [Engine.moveDuration], startsAt),
                });
            }
        }
        catch (e_5_1) { e_5 = { error: e_5_1 }; }
        finally {
            try {
                if (spawns_1_1 && !spawns_1_1.done && (_a = spawns_1.return)) _a.call(spawns_1);
            }
            finally { if (e_5) throw e_5.error; }
        }
    };
    Engine.prototype.animateMerges = function (merges, startsAt) {
        var e_6, _a;
        try {
            for (var merges_2 = __values(merges), merges_2_1 = merges_2.next(); !merges_2_1.done; merges_2_1 = merges_2.next()) {
                var merge = merges_2_1.value;
                var _b = this.cellToCanvas(merge.x, merge.y), x = _b.x, y = _b.y;
                this.gameEntities.push({
                    primitive: new Tile(merge.value, Engine.tileRadius),
                    animator: new InterpolatingAnimator([
                        { x: x, y: y, scale: Engine.tileSize, opacity: 0 },
                        { x: x, y: y, scale: Engine.tileSize, opacity: 1 },
                        { x: x, y: y, scale: Engine.cellSize, opacity: 1 },
                        { x: x, y: y, scale: Engine.tileSize, opacity: 1 },
                    ], [0, Engine.moveDuration / 2, Engine.moveDuration / 2], startsAt),
                });
            }
        }
        catch (e_6_1) { e_6 = { error: e_6_1 }; }
        finally {
            try {
                if (merges_2_1 && !merges_2_1.done && (_a = merges_2.return)) _a.call(merges_2);
            }
            finally { if (e_6) throw e_6.error; }
        }
    };
    Engine.prototype.animateScore = function (score, startsAt) {
        var _a = Engine.scorePosition, x = _a.x, y = _a.y;
        this.gameEntities.push({
            primitive: new Textual(score.score.toString(), Engine.textColor, "center"),
            animator: new StaticAnimator({
                x: x,
                y: y,
                scale: Engine.textSize,
                opacity: 1.0,
            }),
        });
        if (score.difference !== null) {
            this.gameEntities.push({
                primitive: new Textual(score.difference.toString(), Engine.pointsTextColor, "center"),
                animator: new InterpolatingAnimator([
                    { x: x, y: y, scale: Engine.textSize, opacity: 1.0 },
                    { x: x, y: 0, scale: Engine.textSize, opacity: 0.0 },
                ], [Engine.textFadeDuration], startsAt),
            });
        }
    };
    Engine.prototype.animateGameOver = function (startsAt) {
        this.gameEntities.push({
            primitive: new Textual("game over", Engine.gameOverTextColor, "center"),
            animator: new InterpolatingAnimator([
                {
                    x: Engine.gridSize / 2,
                    y: Engine.gridTop + Engine.gridSize / 2,
                    scale: Engine.titleSize,
                    opacity: 0,
                },
                {
                    x: Engine.gridSize / 2,
                    y: Engine.gridTop + Engine.gridSize / 2,
                    scale: Engine.titleSize,
                    opacity: 1,
                },
            ], [Engine.textFadeDuration], startsAt),
        });
    };
    Engine.prototype.cellToCanvas = function (x, y) {
        return {
            x: Engine.gridPadding + (x + 0.5) * Engine.cellSize,
            y: Engine.gridTop + Engine.gridPadding + (y + 0.5) * Engine.cellSize,
        };
    };
    Engine.canvasWidth = 500;
    Engine.canvasHeight = 600;
    Engine.canvasMargin = 16;
    Engine.gridSize = 500;
    Engine.gridPadding = 8;
    Engine.gridRadius = 0.02;
    Engine.gridTop = Engine.canvasHeight - Engine.gridSize;
    Engine.cellSize = (Engine.gridSize - 2 * Engine.gridPadding) / 4;
    Engine.tileSize = 100;
    Engine.tileRadius = 0.05;
    Engine.titleSize = 75;
    Engine.textSize = 30;
    Engine.titlePosition = {
        x: Engine.gridPadding,
        y: Engine.gridPadding,
    };
    Engine.scorePosition = {
        x: Engine.gridSize - Engine.gridPadding - Engine.cellSize / 2,
        y: Engine.gridTop / 2,
    };
    Engine.gridColor = "#4a4a4a";
    Engine.emptyCellColor = "#454545";
    Engine.textColor = "#505050";
    Engine.pointsTextColor = "#00dd00";
    Engine.gameOverTextColor = "#ee0000";
    Engine.moveDuration = 125;
    Engine.textFadeDuration = 400;
    Engine.swipeThreshold = Engine.gridSize / 8;
    return Engine;
}());
var Move;
(function (Move) {
    Move[Move["Up"] = 0] = "Up";
    Move[Move["Right"] = 1] = "Right";
    Move[Move["Down"] = 2] = "Down";
    Move[Move["Left"] = 3] = "Left";
})(Move || (Move = {}));
var Game = /** @class */ (function () {
    function Game(onEvents) {
        this.grid = new Uint32Array(16);
        this.onEvents = onEvents;
        this.reset();
    }
    Game.prototype.reset = function () {
        this.grid.fill(0);
        this.score = 0;
        this.onEvents({
            statics: [],
            spawns: [this.spawn(), this.spawn()],
            moves: [],
            merges: [],
            score: {
                score: 0,
                difference: null,
            },
            gameOver: false,
        });
    };
    Game.prototype.play = function (move) {
        var e_7, _a;
        var x00 = move == Move.Right ? 3 : 0;
        var y00 = move == Move.Down ? 3 : 0;
        var _b = __read([
            [0, 1],
            [-1, 0],
            [0, -1],
            [1, 0],
        ][move], 2), dx = _b[0], dy = _b[1];
        var dx0 = 1 - Math.abs(dx);
        var dy0 = 1 - Math.abs(dy);
        var statics = [];
        var moves = [];
        var merges = [];
        for (var i = 0; i < 4; i++) {
            var x0 = x00 + i * dx0;
            var y0 = y00 + i * dy0;
            var events = this.compactLine(x0, y0, dx, dy);
            statics.push.apply(statics, __spreadArray([], __read(events.statics), false));
            moves.push.apply(moves, __spreadArray([], __read(events.moves), false));
            merges.push.apply(merges, __spreadArray([], __read(events.merges), false));
        }
        if (moves.length == 0 && merges.length == 0) {
            return;
        }
        this.grid.fill(0);
        var tiles = statics.concat(moves).concat(merges);
        try {
            for (var tiles_1 = __values(tiles), tiles_1_1 = tiles_1.next(); !tiles_1_1.done; tiles_1_1 = tiles_1.next()) {
                var tile = tiles_1_1.value;
                this.set(tile.x, tile.y, tile.value);
            }
        }
        catch (e_7_1) { e_7 = { error: e_7_1 }; }
        finally {
            try {
                if (tiles_1_1 && !tiles_1_1.done && (_a = tiles_1.return)) _a.call(tiles_1);
            }
            finally { if (e_7) throw e_7.error; }
        }
        var scoreDifference = merges.length == 0
            ? null
            : merges
                .map(function (merge) { return 1 << merge.value; })
                .reduce(function (total, points) { return total + points; });
        this.score += scoreDifference || 0;
        var spawns = [this.spawn()];
        this.onEvents({
            statics: statics,
            moves: moves,
            merges: merges,
            spawns: spawns,
            score: {
                score: this.score,
                difference: scoreDifference,
            },
            gameOver: this.gameOver(),
        });
    };
    Game.prototype.spawn = function () {
        var value = Math.random() < Game.fourProbability ? 2 : 1;
        var cells = [];
        for (var x_1 = 0; x_1 < 4; x_1++) {
            for (var y_1 = 0; y_1 < 4; y_1++) {
                if (this.at(x_1, y_1) == 0) {
                    cells.push({ x: x_1, y: y_1 });
                }
            }
        }
        var _a = cells[Math.floor(Math.random() * cells.length)], x = _a.x, y = _a.y;
        this.set(x, y, value);
        return { x: x, y: y, value: value };
    };
    Game.prototype.compactLine = function (x0, y0, dx, dy) {
        var statics = [];
        var moves = [];
        var merges = [];
        var nonEmptyCells = [];
        for (var i = 0; i < 4; i++) {
            var x = x0 + i * dx;
            var y = y0 + i * dy;
            var value = this.at(x, y);
            if (value != 0) {
                nonEmptyCells.push({ x: x, y: y, value: value });
            }
        }
        for (var i = 0, k = 0; i < nonEmptyCells.length; i++, k++) {
            var _a = nonEmptyCells[i], x00 = _a.x, y00 = _a.y, value0 = _a.value;
            var x = x0 + k * dx;
            var y = y0 + k * dy;
            if (i < nonEmptyCells.length - 1 &&
                nonEmptyCells[i + 1].value == value0) {
                var _b = nonEmptyCells[i + 1], x1 = _b.x, y1 = _b.y;
                merges.push({
                    x0: x00,
                    y0: y00,
                    x1: x1,
                    y1: y1,
                    x: x,
                    y: y,
                    value0: value0,
                    value: value0 + 1,
                });
                i++;
            }
            else if (x != x00 || y != y00) {
                moves.push({ x0: x00, y0: y00, x: x, y: y, value: value0 });
            }
            else {
                statics.push({ x: x, y: y, value: value0 });
            }
        }
        return { statics: statics, moves: moves, merges: merges };
    };
    Game.prototype.gameOver = function () {
        if (this.grid.some(function (value) { return value == 0; })) {
            return false;
        }
        for (var x = 0; x < 4; x++) {
            for (var y = 0; y < 4; y++) {
                var value = this.at(x, y);
                if (x < 3 && this.at(x + 1, y) == value) {
                    return false;
                }
                if (y < 3 && this.at(x, y + 1) == value) {
                    return false;
                }
            }
        }
        return true;
    };
    Game.prototype.at = function (x, y) {
        return this.grid[4 * y + x];
    };
    Game.prototype.set = function (x, y, value) {
        this.grid[4 * y + x] = value;
    };
    Game.fourProbability = 0.05;
    return Game;
}());
var Primitive = /** @class */ (function () {
    function Primitive() {
    }
    return Primitive;
}());
var Tile = /** @class */ (function (_super) {
    __extends(Tile, _super);
    function Tile(value, radius) {
        var _a;
        var _this = _super.call(this) || this;
        _this.text = (1 << value).toString();
        _a = __read(Tile.colors[(value - 1) % Tile.colors.length], 2), _this.tileColor = _a[0], _this.textColor = _a[1];
        _this.radius = radius;
        var fontSize = Math.min(0.7, 0.7 / (_this.text.length * SevenSegmentFont.aspectRatio));
        _this.font = new SevenSegmentFont(fontSize);
        return _this;
    }
    Tile.prototype.render = function (context) {
        context.fillStyle = this.tileColor;
        fillRoundedRectangle(context, -0.5, -0.5, 1, 1, this.radius);
        context.fillStyle = this.textColor;
        this.font.fillText(context, this.text, 0, 0, "center");
    };
    Tile.lightTextColor = "#eeeeee";
    Tile.darkTextColor = "#1e1e1e";
    Tile.colors = [
        ["#4ec9b0", Tile.lightTextColor],
        ["#4fc1ff", Tile.lightTextColor],
        ["#569cd6", Tile.lightTextColor],
        ["#9cdcfe", Tile.darkTextColor],
        ["#b5cea8", Tile.darkTextColor],
        ["#c586c0", Tile.lightTextColor],
        ["#c8c8c8", Tile.darkTextColor],
        ["#ce9178", Tile.darkTextColor],
        ["#d16969", Tile.lightTextColor],
        ["#d7ba7d", Tile.darkTextColor],
        ["#dcdcaa", Tile.darkTextColor],
    ];
    return Tile;
}(Primitive));
var RoundedSquare = /** @class */ (function (_super) {
    __extends(RoundedSquare, _super);
    function RoundedSquare(color, radius) {
        var _this = _super.call(this) || this;
        _this.color = color;
        _this.radius = radius;
        return _this;
    }
    RoundedSquare.prototype.render = function (context) {
        context.fillStyle = this.color;
        fillRoundedRectangle(context, -0.5, -0.5, 1.0, 1.0, this.radius);
    };
    return RoundedSquare;
}(Primitive));
var Textual = /** @class */ (function (_super) {
    __extends(Textual, _super);
    function Textual(text, color, align) {
        var _this = _super.call(this) || this;
        _this.text = text;
        _this.color = color;
        _this.align = align;
        _this.font = new SevenSegmentFont(1);
        return _this;
    }
    Textual.prototype.render = function (context) {
        context.fillStyle = this.color;
        this.font.fillText(context, this.text, 0, 0, this.align);
    };
    return Textual;
}(Primitive));
var SevenSegmentFont = /** @class */ (function () {
    function SevenSegmentFont(height) {
        this.height = height;
    }
    SevenSegmentFont.prototype.fillText = function (context, text, x, y, align) {
        var e_8, _a;
        if (align == "center") {
            x -= (this.characterWidth() * text.length) / 2;
            y -= this.height / 2;
        }
        try {
            for (var text_1 = __values(text), text_1_1 = text_1.next(); !text_1_1.done; text_1_1 = text_1.next()) {
                var digit = text_1_1.value;
                this.fillCharacter(context, digit, x, y);
                x += this.characterWidth();
            }
        }
        catch (e_8_1) { e_8 = { error: e_8_1 }; }
        finally {
            try {
                if (text_1_1 && !text_1_1.done && (_a = text_1.return)) _a.call(text_1);
            }
            finally { if (e_8) throw e_8.error; }
        }
    };
    SevenSegmentFont.prototype.fillCharacter = function (context, character, x, y) {
        var e_9, _a, e_10, _b;
        var xs = [
            x + this.characterMargin(),
            x + this.characterWidth() - this.characterMargin(),
        ];
        var ys = [
            y + this.characterMargin(),
            y + this.height / 2,
            y + this.height - this.characterMargin(),
        ];
        var _c = __read(SevenSegmentFont.activeSegments[character], 2), horizontal = _c[0], vertical = _c[1];
        try {
            for (var horizontal_1 = __values(horizontal), horizontal_1_1 = horizontal_1.next(); !horizontal_1_1.done; horizontal_1_1 = horizontal_1.next()) {
                var segment = horizontal_1_1.value;
                this.fillHorizontalSegment(context, xs[0], ys[segment], xs[1]);
            }
        }
        catch (e_9_1) { e_9 = { error: e_9_1 }; }
        finally {
            try {
                if (horizontal_1_1 && !horizontal_1_1.done && (_a = horizontal_1.return)) _a.call(horizontal_1);
            }
            finally { if (e_9) throw e_9.error; }
        }
        try {
            for (var vertical_1 = __values(vertical), vertical_1_1 = vertical_1.next(); !vertical_1_1.done; vertical_1_1 = vertical_1.next()) {
                var segment = vertical_1_1.value;
                this.fillVerticalSegment(context, xs[segment % 2], ys[segment >> 1], ys[(segment >> 1) + 1]);
            }
        }
        catch (e_10_1) { e_10 = { error: e_10_1 }; }
        finally {
            try {
                if (vertical_1_1 && !vertical_1_1.done && (_b = vertical_1.return)) _b.call(vertical_1);
            }
            finally { if (e_10) throw e_10.error; }
        }
    };
    SevenSegmentFont.prototype.fillHorizontalSegment = function (context, x1, y, x2) {
        var left = x1 + this.segmentMargin();
        var top = y - this.segmentThickness() / 2;
        var right = x2 - this.segmentMargin();
        var bottom = y + this.segmentThickness() / 2;
        context.beginPath();
        context.moveTo(left, y);
        context.lineTo(left + this.segmentThickness() / 2, top);
        context.lineTo(right - this.segmentThickness() / 2, top);
        context.lineTo(right, y);
        context.lineTo(right - this.segmentThickness() / 2, bottom);
        context.lineTo(left + this.segmentThickness() / 2, bottom);
        context.lineTo(left, y);
        context.closePath();
        context.fill();
    };
    SevenSegmentFont.prototype.fillVerticalSegment = function (context, x, y1, y2) {
        var left = x - this.segmentThickness() / 2;
        var top = y1 + this.segmentMargin();
        var right = x + this.segmentThickness() / 2;
        var bottom = y2 - this.segmentMargin();
        context.beginPath();
        context.moveTo(x, top);
        context.lineTo(right, top + this.segmentThickness() / 2);
        context.lineTo(right, bottom - this.segmentThickness() / 2);
        context.lineTo(x, bottom);
        context.lineTo(left, bottom - this.segmentThickness() / 2);
        context.lineTo(left, top + this.segmentThickness() / 2);
        context.lineTo(x, top);
        context.closePath();
        context.fill();
    };
    SevenSegmentFont.prototype.characterWidth = function () {
        return this.height * SevenSegmentFont.aspectRatio;
    };
    SevenSegmentFont.prototype.characterMargin = function () {
        return this.height * SevenSegmentFont.characterMargin;
    };
    SevenSegmentFont.prototype.segmentThickness = function () {
        return this.height * SevenSegmentFont.segmentThickness;
    };
    SevenSegmentFont.prototype.segmentMargin = function () {
        return this.height * SevenSegmentFont.segmentMargin;
    };
    SevenSegmentFont.aspectRatio = 0.5;
    SevenSegmentFont.characterMargin = 0.1;
    SevenSegmentFont.segmentThickness = 0.08;
    SevenSegmentFont.segmentMargin = 0.01;
    SevenSegmentFont.activeSegments = {
        "0": [
            [0, 2],
            [0, 1, 2, 3],
        ],
        "1": [[], [1, 3]],
        "2": [
            [0, 1, 2],
            [1, 2],
        ],
        "3": [
            [0, 1, 2],
            [1, 3],
        ],
        "4": [[1], [0, 1, 3]],
        "5": [
            [0, 1, 2],
            [0, 3],
        ],
        "6": [
            [0, 1, 2],
            [0, 2, 3],
        ],
        "7": [[0], [1, 3]],
        "8": [
            [0, 1, 2],
            [0, 1, 2, 3],
        ],
        "9": [
            [0, 1, 2],
            [0, 1, 3],
        ],
        d: [
            [1, 2],
            [1, 2, 3],
        ],
        m: [[0], [0, 1, 2, 3]],
        q: [
            [0, 1],
            [0, 1, 3],
        ],
        h: [[1], [0, 2, 3]],
        g: [
            [0, 2],
            [0, 2, 3],
        ],
        a: [
            [0, 1],
            [0, 1, 2, 3],
        ],
        e: [
            [0, 1, 2],
            [0, 1, 2],
        ],
        o: [
            [1, 2],
            [2, 3],
        ],
        v: [[2], [0, 1, 2, 3]],
        r: [[1], [2]],
        " ": [[], []],
    };
    return SevenSegmentFont;
}());
var SwipeDirection;
(function (SwipeDirection) {
    SwipeDirection[SwipeDirection["Up"] = 0] = "Up";
    SwipeDirection[SwipeDirection["Right"] = 1] = "Right";
    SwipeDirection[SwipeDirection["Down"] = 2] = "Down";
    SwipeDirection[SwipeDirection["Left"] = 3] = "Left";
})(SwipeDirection || (SwipeDirection = {}));
var SwipeHandler = /** @class */ (function () {
    function SwipeHandler(element, threshold, onSwipe) {
        this.element = element;
        this.threshold = threshold;
        this.onSwipe = onSwipe;
        this.touchOrigin = null;
        this.boundOnTouchStart = this.onTouchStart.bind(this);
        this.boundOnTouchEnd = this.onTouchEnd.bind(this);
        element.addEventListener("touchstart", this.boundOnTouchStart);
        element.addEventListener("touchend", this.boundOnTouchEnd);
    }
    SwipeHandler.prototype.unregister = function () {
        this.element.removeEventListener("touchstart", this.boundOnTouchStart);
        this.element.removeEventListener("touchend", this.boundOnTouchEnd);
    };
    SwipeHandler.prototype.onTouchStart = function (event) {
        if (this.touchOrigin !== null) {
            return;
        }
        var touch = event.changedTouches[0];
        this.touchOrigin = __assign(__assign({}, this.touchToElementCoordinates(touch)), { id: touch.identifier });
    };
    SwipeHandler.prototype.onTouchEnd = function (event) {
        var e_11, _a;
        if (this.touchOrigin === null) {
            return;
        }
        var originalTouch = null;
        try {
            for (var _b = __values(event.changedTouches), _c = _b.next(); !_c.done; _c = _b.next()) {
                var touch = _c.value;
                if (touch.identifier === this.touchOrigin.id) {
                    originalTouch = touch;
                    break;
                }
            }
        }
        catch (e_11_1) { e_11 = { error: e_11_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_11) throw e_11.error; }
        }
        if (originalTouch === null) {
            return;
        }
        var _d = this.touchToElementCoordinates(originalTouch), x = _d.x, y = _d.y;
        var dx = x - this.touchOrigin.x;
        var dy = y - this.touchOrigin.y;
        this.touchOrigin = null;
        if (Math.abs(dx) > this.threshold !== Math.abs(dy) > this.threshold) {
            var direction = void 0;
            if (Math.abs(dx) > this.threshold) {
                direction = dx > 0 ? SwipeDirection.Right : SwipeDirection.Left;
            }
            else {
                direction = dy > 0 ? SwipeDirection.Down : SwipeDirection.Up;
            }
            this.onSwipe(direction);
        }
    };
    SwipeHandler.prototype.touchToElementCoordinates = function (touch) {
        var clientX = touch.clientX;
        var clientY = touch.clientY;
        var elementBoundingBox = this.element.getBoundingClientRect();
        var x = clientX - elementBoundingBox.left;
        var y = clientY - elementBoundingBox.top;
        return { x: x, y: y };
    };
    return SwipeHandler;
}());
function fillRoundedRectangle(context, left, top, width, height, radius) {
    var right = left + width;
    var bottom = top + height;
    context.beginPath();
    context.moveTo(left + radius, top);
    context.arcTo(right, top, right, bottom, radius);
    context.arcTo(right, bottom, left, bottom, radius);
    context.arcTo(left, bottom, left, top, radius);
    context.arcTo(left, top, right, top, radius);
    context.closePath();
    context.fill();
}
window.addEventListener("load", function () {
    new Engine();
});
