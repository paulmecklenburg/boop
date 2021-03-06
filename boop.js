// TODO
// - adventure / challenge mode
// - size grows over time
// - use check box for help toggle

// Util

var randInt = function(max) {
    return Math.floor(Math.random() * max);
}

// Boop

var GRID_SIZE = 20;
var CELL_SIZE = 20;

var canvas = document.createElement("canvas");
var ctx = canvas.getContext("2d");
canvas.height = canvas.width = GRID_SIZE * CELL_SIZE;
document.body.appendChild(canvas);

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
var start;
var robot;
var goal;
var moveCount;
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

var trySolve = function(loc) { 
    var found_from = {};
    found_from[loc] = undefined;
    var queue = [loc];
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

var newBoardPositions = function() {
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
        start = new Pos(randInt(GRID_SIZE), randInt(GRID_SIZE));
    } while (start in obstacles);
    robot = start;
    do {
        goal = new Pos(randInt(GRID_SIZE), randInt(GRID_SIZE));
    } while (goal in obstacles || goal.equals(robot));
    moveCount = 0;
}

var drawCell = function(pos, style) {
    ctx.fillStyle=style;
    ctx.fillRect(pos.x * CELL_SIZE, pos.y * CELL_SIZE,
                 CELL_SIZE, CELL_SIZE);
}

var redraw = function(solution) {
    ctx.drawImage(assets.board, 0, 0);
    for (ob_key in obstacles) {
        obst = obstacles[ob_key];
        ctx.drawImage(assets.obstacle,
                      obst.x * CELL_SIZE, obst.y * CELL_SIZE);
    }
    if (solution) {
        for (i in solution) {
            var loc = solution[i];
            drawCell(loc, "#0080FF");
        }
    }
    ctx.drawImage(assets.goal, goal.x * CELL_SIZE, goal.y * CELL_SIZE);
    drawCell(start, "#80E0A0");
    drawCell(robot, "#00B030");
}

// analytics tracking
var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-2808178-1']);
_gaq.push(['_trackPageview']);

(function() {
    var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
    ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
    var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
})();

var newBoard = function() {
    updateHelpValue(false);
    do {
        newBoardPositions();
        solution = trySolve(robot)
    } while (!solution || solution.length < 4);
    redraw();
    _gaq.push(['_trackEvent', 'Boop', 'NewGame']);
}

// Artwork.
var assets = {};
var assetList = [
    ["board", "board.png"],
    ["obstacle", "obstacle.png"],
    ["goal", "goal.png"]
];
var assetCount = 0;
var assetsReady = function() {
    return assetCount == assetList.length;
}
for (i in assetList) {
    var asset = assetList[i];
    var img = new Image();
    img.onload = function() {
        assetCount++;
        if (assetsReady()) {
            newBoard();
        }
    }
    assets[asset[0]] = img;
    img.src = asset[1];
}

var updateBoard = function() {
    solution = trySolve(robot);
    if (robot.equals(goal)) {
        var optimal = trySolve(start)
        var minMoves = optimal.length - 1;
        var msg = ("It took you " + moveCount + " moves. The best solution was "
                   + minMoves + " moves");
        redraw(optimal);
        _gaq.push(['_trackEvent', 'Boop', 'Win']);
        alert(msg);
        newBoard();
    } else {
        if (showPath) {
            redraw(solution);
        } else {
            redraw();
        }
    }
    if (!solution) {
        alert("Oh no! You're stuck.");
        robot = start;
        redraw();
    }
}

var toggleHelp = document.getElementById("toggleHelp");
var updateHelpValue = function(val) {
    showPath = val;
    toggleHelp.value = showPath ? "[s] help (on)" : "[s] help (off)";
}
toggleHelp.onclick = function() {
    updateHelpValue(!showPath);
    updateBoard();
}

var resetButton = document.getElementById("resetButton");
resetButton.onclick = function() {
    robot = start;
    moveCount = 0;
    updateBoard();
}

var newBoardButton = document.getElementById("newBoard");
newBoardButton.onclick = function() {
    newBoard();
    updateBoard();
}

var keyPress = function(e) {
    if (!assetsReady()) {
        return;
    }
    if (e.keyCode == 38) {
        robot = goUp(robot);
        moveCount++;
        updateBoard();
    }
    if (e.keyCode == 40) {
        robot = goDown(robot);
        moveCount++;
        updateBoard();
    }
    if (e.keyCode == 37) {
        robot = goLeft(robot);
        moveCount++;
        updateBoard();
    }
    if (e.keyCode == 39) {
        robot = goRight(robot);
        moveCount++;
        updateBoard();
    }
    if (e.keyCode == 78) {
        // 'n'
        newBoardButton.onclick();
    }
    if (e.keyCode == 82) {
        // 'r'
        resetButton.onclick();
    }
    if (e.keyCode == 83) {
        // 's'
        toggleHelp.onclick();
    }
}

addEventListener("keydown", keyPress, false);

var isiOS = /(iPad|iPhone|iPod)/g.test(navigator.userAgent);
var clickEvent = isiOS ? 'touchstart' : 'click';
canvas.addEventListener(clickEvent, function(e) {
    var x;
    var y;
    if (e.pageX || e.pageY) {
        x = e.pageX;
        y = e.pageY;
    }
    else {
      x = e.clientX + document.body.scrollLeft +
            document.documentElement.scrollLeft;
      y = e.clientY + document.body.scrollTop +
            document.documentElement.scrollTop;
    }

    x -= canvas.offsetLeft;
    y -= canvas.offsetTop;

    var e = {};

    var upperRight = x > y;
    var upperLeft = (canvas.width - x) > y;

    if (upperRight) {
        if (upperLeft) {
            e.keyCode = 38;
        } else {
            e.keyCode = 39;
        }
    } else {
        if (upperLeft) {
            e.keyCode = 37;
        } else {
            e.keyCode = 40;
        }
    }
    
    keyPress(e);
}, false);
