var GRID_SIZE = 20;
var CELL_SIZE = 20;

var canvas = document.createElement("canvas");
var ctx = canvas.getContext("2d");
canvas.height = canvas.width = GRID_SIZE * CELL_SIZE;
document.body.appendChild(canvas);

var randInt = function(max) {
    return Math.floor(Math.random() * max);
}

function Pos(x_, y_) {
    this.x = x_;
    this.y = y_;
}
Pos.prototype.toString = function() {
    return this.x + ':' + this.y;
}
Pos.prototype.equals = function(other) {
    return this.x == other.x && this.y == other.y;
}

// global game state
var obstacles;
var robot;
var goal;
var showPath;

var moveSearch = function(pos, update) {
    var prev;
    var next = pos;
    do {
        prev = next;
        next = update(prev);
    } while (!(next in obstacles) && !(prev.equals(goal)));
    return prev;
}

var goRight = function(pos) {
    return moveSearch(pos, function(p) {
        return new Pos(p.x + 1, p.y);
    });
}

var goLeft = function(pos) {
    return moveSearch(pos, function(p) {
        return new Pos(p.x - 1, p.y);
    });
}

var goUp = function(pos) {
    return moveSearch(pos, function(p) {
        return new Pos(p.x, p.y - 1);
    });
}

var goDown = function(pos) {
    return moveSearch(pos, function(p) {
        return new Pos(p.x, p.y + 1);
    });
}

var possibleMoves = function(loc) {
    return [goRight(loc), goLeft(loc), goUp(loc), goDown(loc)];
}

var backTrace = function(loc, found_from) {
    var res = [];
    do {
        res.push(loc);
        loc = found_from[loc];
    } while (loc);
    return res;
}

var trySolve = function() { 
    var found_from = {};
    found_from[robot] = undefined;
    var queue = [robot];
    while (queue.length > 0) {
        var loc = queue.shift();
        if (loc.equals(goal)) {
            return backTrace(loc, found_from);
        }
        moves = possibleMoves(loc);
        for (i in moves) {
            dst = moves[i];
            if (!(dst in found_from)) {
                found_from[dst] = loc;
                queue.push(dst);
            }
        }
    }
    return false;
}

var addObst = function(x, y) {
    var pos = new Pos(x, y);
    obstacles[pos] = pos;
}

var resetPositions = function() {
    obstacles = {};
    var density = (Math.random() * .15) + .05;
    var numObst = Math.floor(GRID_SIZE * GRID_SIZE * density);
    for (var i = 0; i < numObst; i++) {
        addObst(randInt(GRID_SIZE), randInt(GRID_SIZE));
    }
    for (var i = 0; i < GRID_SIZE; i++) {
        addObst(-1, i); addObst(GRID_SIZE, i);
        addObst(i, -1); addObst(i, GRID_SIZE);
    }
    do {
        robot = new Pos(randInt(GRID_SIZE), randInt(GRID_SIZE));
    } while (robot in obstacles);
    do {
        goal = new Pos(randInt(GRID_SIZE), randInt(GRID_SIZE));
    } while (goal in obstacles || goal.equals(robot));
}

var drawCell = function(pos, style) {
    ctx.fillStyle=style;
    ctx.fillRect(pos.x * CELL_SIZE, pos.y * CELL_SIZE,
                 CELL_SIZE, CELL_SIZE);
}

var redraw = function(solution) {
    ctx.fillStyle="#E0E0E0";
    ctx.fillRect(0, 0, GRID_SIZE * CELL_SIZE, GRID_SIZE * CELL_SIZE);
    for (ob_key in obstacles) {
        obst = obstacles[ob_key];
        drawCell(obst, "#303030");
    }
    if (showPath) {
        for (i in solution) {
            var loc = solution[i];
            drawCell(loc, "#0080FF");
        }
    }
    drawCell(goal, "#E02020");
    drawCell(robot, "#00B030");
}

var reset = function() {
    showPath = false;
    do {
        resetPositions();
    } while (!trySolve());
    redraw();
}

reset();

addEventListener("keydown", function (e) {
    if (e.keyCode == 38) {
        robot = goUp(robot);
    }
    if (e.keyCode == 40) {
        robot = goDown(robot);
    }
    if (e.keyCode == 37) {
        robot = goLeft(robot);
    }
    if (e.keyCode == 39) {
        robot = goRight(robot);
    }
    if (e.keyCode == 82) {
        // 'r'
        reset();
    }
    if (e.keyCode == 83) {
        // 's'
        showPath = !showPath;
    }
    solution = trySolve();
    redraw(solution);
    if (robot.equals(goal)) {
        alert("Win!");
        reset();
    }
    if (!solution) {
        alert("Oh no! You're stuck.");
        reset();
    }
}, false);
