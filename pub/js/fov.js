
function die (n) {
    return Math.floor( Math.random() * n ) + 1;
}

function random_cell (weights) {
    var keys = [ "floor", "wall", "water", "fog" ] ;

    var wsum = keys.reduce(
        function (sum, k) {
            return sum + weights[k];
        },
        0
    );

    var yarr = [];

    keys.map(
        function (k) {
            for (var i = 0; i < weights[k]; i++) {
                yarr.push(k);
            }
        }
    );

    var roll = die(wsum);

    return { type: yarr[roll - 1], seen: false, visible: false };
}

function random_graph (env) {
    var graph = [],
        maxX = env.max.x - 1,
        maxY = env.max.y - 1
    ;

    for (var x = 0; x < env.max.x; x++) {
        graph[x] = [];

        for (var y = 0; y < env.max.y; y++) {
            graph[x][y] = (x === 0 || y === 0 || x === maxX || y === maxY)
                         ? { type: "wall", seen: false, visible: false }
                         : (x === 1 || y === 1 || x === maxX - 1 || y === maxY - 1)
                            ? { type: "floor", seen: false, visible: false }
                            : random_cell(env.weights)
            ;
        }
    }

    return graph;
}


function FAP (env) {
    function size_it (a,b) {
        return (a - env.margin * 2) / b;
    }

    function mktype (ps, vw, fi, se, vs) {
        return {
            passable: ps,
            viewable: vw,
            fill: fi,
            seen: se,
            visible: vs
        };
    }

    var playground = document.getElementById("playground");
    playground.width = playground.width;

    var
        pen = playground.getContext("2d"),
        scalar = Math.min(
            size_it(playground.width, env.max.x),
            size_it(playground.height, env.max.y)
        ),
        halfer = scalar / 2,
        types = {
            floor: mktype(true, true, false, "#444", "#888"),
            wall:  mktype(false, false, true, "#444", "#888"),
            water: mktype(false, true, true, "#037", "#037"),
            fog: mktype(true, false, true, "#404", "#808")
        },
        graph = random_graph(env),
        guyCell = { x: 1, y: 1 }
    ;

    function yshift (x) {
        return (x % 2) ? 0 : 1;
    }

    function dr (cellA, cellB) {
        return Math.floor(
            Math.sqrt(
                Math.pow(cellB.x - cellA.x, 2)
                +
                Math.pow(cellB.y - cellA.y, 2)
            )
        );
    }

    function los (cell0, cell1, sight_radius) {
        if (cell0.x === cell1.x && cell0.y === cell1.y) {
            draw_cell({
                x: cell0.x,
                y: cell0.y,
                type: graph[cell0.x][cell0.y].type,
                seen: true,
                visible: true
            });

            return;
        }

        return center_to_center();
        return corners_to_center();

        function center_to_center () {
            var p0 = cell_to_grid(cell0),
                px0 = cell_to_px_center(cell0),
                px1 = cell_to_px_center(cell1),
                x = p0.x,
                y = p0.y,
                dx = px1.x - px0.x,
                dy = px1.y - px0.y
            ;

            var thisCell = cell0;

            while ( ! ( (thisCell.x === cell1.x) && (thisCell.y === cell1.y) ) ) {
                x += dx;
                y += dy;

                thisCell = grid_to_cell({ x: x, y: y });

                if (!graph[thisCell.x] || !graph[thisCell.x][thisCell.y]) {
                    console.log("Out of bounds: %d %d", thisCell.x, thisCell.y);
                    return null;
                }

                if (dr(cell0, thisCell) > sight_radius) {
                    return false;
                }

                draw_cell({
                    x: thisCell.x,
                    y: thisCell.y,
                    type: graph[thisCell.x][thisCell.y].type,
                    seen: true,
                    visible: true
                });

                if (types[graph[thisCell.x][thisCell.y].type].viewable === false) {
                    //ray(px0, grid_to_px({ x: x, y: y}), "#f00");
                    return false;
                }
            }

            //ray(px0, grid_to_px({ x: x, y: y }), "#0ff");

            return true;
        }

        function corners_to_center () {
            var delta = 2,
                px0nw = cell_to_px_corner(cell0),
                px0ne = { x: px0nw.x + delta, y: px0nw.y + scalar - delta },
                px0sw = { x: px0nw.x + scalar - delta, y: px0nw.y + delta },
                px0se = { x: px0nw.x + scalar - delta, y: px0nw.y + scalar - delta },
                px0 = cell_to_px_center(cell0),
                px1 = cell_to_px_center(cell1),
                dx = px1.x - px0.x,
                dy = px1.y - px0.y
            ;

            px0nw.x = px0nw.x + delta;
            px0nw.x = px0nw.x + delta;

            [ px0nw, px0ne, px0sw, px0se ].forEach(
                function (p) {
                    var thisCell = cell0,
                        g = px_to_grid(p),
                        x = g.x,
                        y = g.y
                    ;

                    while ( ! ( (thisCell.x === cell1.x) && (thisCell.y === cell1.y) ) ) {
                        x += dx;
                        y += dy;

                        thisCell = grid_to_cell({ x: x, y: y });

                        if (!graph[thisCell.x] || !graph[thisCell.x][thisCell.y]) {
                            console.log("Out of bounds: %d %d", thisCell.x, thisCell.y);
                            return null;
                        }

                        if (dr(cell0, thisCell) > sight_radius) {
                            return false;
                        }

                        draw_cell({
                            x: thisCell.x,
                            y: thisCell.y,
                            type: graph[thisCell.x][thisCell.y].type,
                            seen: true,
                            visible: true
                        });

                        if (types[graph[thisCell.x][thisCell.y].type].viewable === false) {
                            //ray(px0, grid_to_px({ x: x, y: y}), "#f00");
                            return false;
                        }
                    }

                    //ray(px0, grid_to_px({ x: x, y: y }), "#0ff");
                }
            );

            return true;
        }
    }

    function fov (cell) {
        var rad = env.sight_radius,
            x0 = Math.max(0, cell.x - rad),
            y0 = Math.max(0, cell.y - rad),
            x1 = Math.min(env.max.x - 1, cell.x + rad),
            y1 = Math.min(env.max.y - 1, cell.y + rad)
        ;

        return fov_edge(cell);

        function fov_all (cell) {
            for (var i = x0; i <= x1; i++) {
                for (var j = y0; j <= y1; j++) {
                    if (cell.x === i && cell.y === j) {
                        continue;
                    }

                    los(cell, { x: i, y: j }, rad);
                }
            }
        }

        function fov_edge (cell) {
            for (var i = x0; i <= x1; i++) {
                var lower = { x: i, y: y0 },
                    upper = { x: i, y: y1 }
                ;

                los(cell, lower, rad);
                los(cell, upper, rad);
            }

            for (var j = y0; j <= y1; j++) {
                var lower = { x: x0, y: j },
                    upper = { x: x1, y: j }
                ;

                los(cell, lower, rad);
                los(cell, upper, rad);
            }
        }

        function fov_circle (cell) {
            var p0 = cell_to_px_center(cell),
                range = [ 0, 1, 2, 3, 5, 7, 11 ],
                visible = [ ]
            ;

            [ { x: 1, y: 1 }, { x: -1, y: 1 }, { x: 1, y: -1 }, { x: -1, y: -1 } ].forEach(
                function (direction) {
                    range.forEach(
                        function (i) {
                            range.forEach(
                                function (j) {
                                    if (i === j && Math.abs(i) !== 2) {
                                        return;
                                    }

                                    if (i === 0 && Math.abs(j) !== 2) {
                                        return;
                                    }

                                    if (j === 0 && Math.abs(i) !== 2) {
                                        return;
                                    }

                                    var x = p0.x,
                                        y = p0.y,
                                        dx = i * direction.x,
                                        dy = j * direction.y,
                                        k = 0
                                    ;

                                    while (k < 1000) {
                                        k++;
                                        x += dx;
                                        y += dy;

                                        thisCell = px_to_cell({ x: x, y: y });

                                        if (!graph[thisCell.x] || !graph[thisCell.x][thisCell.y]) {
                                            ray(p0, { x: x, y: y }, "#0ff");
                                            break;
                                        }

                                        if (!visible[thisCell.x]) {
                                            visible[thisCell.x] = [ ];
                                        }

                                        if (!visible[thisCell.x][thisCell.y]) {
                                            draw_cell({
                                                x: thisCell.x,
                                                y: thisCell.y,
                                                type: graph[thisCell.x][thisCell.y].type,
                                                seen: true,
                                                visible: true
                                            });

                                            visible[thisCell.x][thisCell.y] = true;
                                        }

                                        if (types[graph[thisCell.x][thisCell.y].type].viewable === false) {
                                            ray(p0, { x: x, y: y }, "#f00");
                                            break;
                                        }
                                    }
                                }
                            );
                        }
                    );
                }
            );
        }
    }

    function cell_to_px_corner (cell) {
        return {
            x: Math.floor(env.margin + scalar * cell.x),
            y: Math.floor(playground.height - env.margin - scalar * cell.y - halfer * yshift(cell.x))
        };
    }

    function cell_to_px_center (cell) {
        var corner = cell_to_px_corner(cell);

        return {
            x: Math.floor(corner.x + halfer),
            y: Math.floor(corner.y + halfer)
        };
    }

    function px_to_cell (px) {
        var x = Math.floor( (px.x - env.margin) / scalar ),
            y = - Math.floor( (px.y - playground.height + env.margin + halfer * yshift(x) ) / scalar)
        ;

        return {
            x: x,
            y: y
        };
    }

    var gscale = 100;

    function px_to_grid (px) {
        return {
            x: Math.round(px.x * gscale),
            y: Math.round(px.y * gscale)
        };
    }

    function grid_to_px (g) {
        return {
            x: Math.round(g.x / gscale),
            y: Math.round(g.y / gscale)
        };
    }

    function cell_to_grid (cell) {
        return px_to_grid( cell_to_px_center(cell) );
    }

    function grid_to_cell (g) {
        return px_to_cell( grid_to_px(g) );
    }

    function getMousePos(e) {
        var rect = playground.getBoundingClientRect();

        return {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        };
    }

    function draw_cell (cell) {
        var
            corner_px = cell_to_px_corner(cell),
            color = cell.visible
                  ? types[cell.type].visible
                  : cell.seen
                    ? types[cell.type].seen
                    : "#000"
        ;

        if (types[cell.type].fill) {
            pen.fillStyle = color;
            pen.fillRect(corner_px.x, corner_px.y, scalar, scalar);
        }
        else {
            pen.strokeStyle = color;
            pen.strokeRect(corner_px.x, corner_px.y, scalar, scalar);
        }

        return;
    }

    function draw_guy () {
        var littleMan = new Image();
        var px = cell_to_px_corner(guyCell);

        littleMan.onload = function() {
            pen.drawImage(littleMan, px.x, px.y, scalar, scalar);
        };

        littleMan.src = 'tiles/default/guy.png';

        fov(guyCell);
    }

    function cell_ray (cell0, cell1, color) {
        var px0 = cell_to_px_center(cell0),
            px1 = cell_to_px_center(cell1)
        ;

        ray(px0, px1, color);
    }

    function ray (px0, px1, color) {
        pen.strokeStyle = color;
        pen.beginPath();
        pen.moveTo(px0.x, px0.y);
        pen.lineTo(px1.x, px1.y);
        pen.stroke();
        pen.closePath();
    }

    function draw() {
        pen.fillStyle = "#000";
        pen.fillRect(0, 0, playground.width, playground.height);

        for (var x = 0; x < graph.length; x++) {
            for (var y = 0; y < graph[x].length; y++) {
                var cell = graph[x][y];

                if (cell.seen) {
                    draw_cell({
                        x: x,
                        y: y,
                        type: cell.type,
                        seen: cell.seen,
                        visible: cell.visible || false
                    });
                }
            }
        }

        draw_guy();
    }

    function move_guy (cell) {
        var type = types[graph[cell.x][cell.y].type];

        if (type.passable === true) {
            guyCell = cell;
        }
        else {
            $("#message").css("color", type.visible);
            $("#message").text("Impassable");
        }
    }

    $("#playground").mousemove(
        function (e) {
            var pos = getMousePos(e),
                cell = px_to_cell(pos),
                grid = px_to_grid(pos)
            ;

            $("#pxx").text(pos.x);
            $("#pxy").text(pos.y);
            $("#cellx").text(cell.x);
            $("#celly").text(cell.y);
            $("#gridx").text(grid.x);
            $("#gridy").text(grid.y);
        }
    );

    $("#playground").click(
        function (e) {
            var pos = getMousePos(e),
                cell = px_to_cell(pos)
            ;

            move_guy(cell);
            requestAnimationFrame(draw);
        }
    );

    $("#playground").keypress(
        function(e) {
            e.preventDefault();

            var x = guyCell.x,
                y = guyCell.y,
                shiftup = yshift(x),
                shiftdown = yshift(x - 1)
            ;

            switch (e.charCode || e.keyCode) {
                case 55:
                    move_guy({ x: x - 1, y: y + shiftup });
                    break;
                case 56:
                    move_guy({ x: x, y: y + 1 });
                    break;
                case 57:
                    move_guy({ x: x + 1, y: y + shiftup });
                    break;
                case 52:
                    move_guy({ x: x - 1, y: y - shiftdown });
                    break;
                case 53:
                    move_guy({ x: x, y: y - 1 });
                    break;
                case 54:
                    move_guy({ x: x + 1, y: y - shiftdown });
                    break;
                case 113:
                    move_guy({ x: x - 1, y: y + shiftup });
                    break;
                case 119:
                    move_guy({ x: x, y: y + 1 });
                    break;
                case 101:
                    move_guy({ x: x + 1, y: y + shiftup });
                    break;
                case 97:
                    move_guy({ x: x - 1, y: y - shiftdown });
                    break;
                case 115:
                    move_guy({ x: x, y: y - 1 });
                    break;
                case 100:
                    move_guy({ x: x + 1, y: y - shiftdown });
                    break;
            }

            requestAnimationFrame(draw);
        }
    );

    return {
        env: env,
        draw: draw
    };
}

var world = null;

function make_map () {
    $("#playground").off();

    var env = {
        margin: 30,
        max: {
            x: parseInt($("#width").val()),
            y: parseInt($("#height").val())
        },
        weights: {
            floor: parseInt($("#floor").val()),
            wall: parseInt($("#wall").val()),
            water: parseInt($("#water").val()),
            fog: parseInt($("#fog").val())
        },
        sight_radius: parseInt($("#sight_radius").val())
    };

    world = FAP(env);

    requestAnimationFrame(world.draw);

    $("#playground").focus();
}

$(document).ready(
    function () {
        $("#redraw").click(make_map);
        make_map();
    }
);

