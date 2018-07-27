
var RuinsOf1985 = (function () {
   var 
      mapWidth = 496,
      mapHeight = 496,
      infoWidth = 160,
      infoHeight = 239,
      map = null,
      selected = [ ],
      selections = [ ],
      tileSize = 64,
      scalar = 0.25,
      space = Math.round(tileSize * scalar),
      halfSpace = Math.round(space / 2),
      mapRenderer = PIXI.autoDetectRenderer(mapWidth, mapHeight),
      mapStage = new PIXI.Container(),
      statusRenderer = PIXI.autoDetectRenderer(infoWidth, infoHeight),
      statusStage = new PIXI.Container(),
      messagesRenderer = PIXI.autoDetectRenderer(infoWidth, infoHeight),
      messagesStage = new PIXI.Container(),
      sightLimit = 90,
      man = {
         cell: { x: 0, y: 0 }
      },
      tileTypes = {
         "dungeon_floor": {
            viewable: true,
            passable: true,
            passCost: 1
         },
         "brick_wall": {
            viewable: false,
            passable: false,
         },
         "cave_wall": {
            viewable: false,
            passable: false,
         },
         "door": {
            viewable: false,
            passable: false
         },
         "gate": {
            viewable: true,
            passable: false
         },
         "shallow_water": {
            viewable: true,
            passable: true,
            passCost: 2
         },
         "waist_high_water": {
            viewable: true,
            passable: true,
            passCost: 3
         },
         "deep_water": {
            viewable: true,
            passable: true,
            passCost: 5
         },
         "violet_fog": {
            viewable: false,
            passable: true,
            passCost: 1,
         },
         "chasm": {
            viewable: true,
            passable: false
         }
      },
      // FOV stuff
      LOSpaths = { },
      perimeter = [ ]
      raySpaces = [ ]
   ;


   function traceLOSpath (cell0, cell1) {
      var 
         scalar = 256,
         halfer = 128
      ;

      if (cell0.x === cell1.x && cell0.y === cell1.y) {
         return [ ];
      }

      if (adjacent(cell0, cell1)) {
         return [ cell1 ];
      }

      var 
         px0 = cellToPxCenter(cell0)[0],
         px1 = cellToPxCenter(cell1)[0],
         x = scaleDown(scalar, px0.x) + halfer,
         y = scaleDown(scalar, px0.y) + halfer,
         dx = px1.x - px0.x,
         dy = px1.y - px0.y,
         dr = 0,
         cellPath = [ ],
         lastCell = cell0,
         thisCell = cell0
      ;

      while (true) {
         x += dx;
         y += dy;

         thisCell = pxToCell( scaleUp(scalar, { x: x, y: y }) );

         if (lastCell.x !== thisCell.x || lastCell.y !== thisCell.y) {
            cellPath.push({ x: thisCell.x - cell0.x, y: thisCell.y - cell0.y, dr: cubeDistance(cell0, thisCell) });
            lastCell = thisCell;
         }

         if (thisCell.x === cell1.x && thisCell.y === cell1.y) {
            return cellPath;
         }
      }
   }

   function initLOSpaths () {
      var tmp = [ ],
         origin = { x: 120, y: 120 },
         r = range(20,220),
         paths = { }
      ;

      // select all spaces 90 away
      r.forEach(function (i) {
         r.forEach(function (j) {
            var thisGuy = { x: i, y: j },
               dr = cubeDistance(origin, thisGuy)
            ;

            if (dr <= 90) {
               thisGuy.dr = dr;
               tmp.push(thisGuy);
            }
         });
      });

      // traceLOS for each
      tmp.forEach(function (goal) {
         var path = traceLOSpath(origin, goal),
            dx = goal.x - origin.x,
            dy = goal.y - origin.y
         ;

         if (! paths[dx]) {
            paths[dx] = { };
         }

         paths[dx][dy] = { x: dx, y: dy, dr: goal.dr, path: path };
      });

      return paths;
   }

   function initRaySpaces () {
      var
         rays = 360,
         rad = 0,
         dRad = (2 * Math.PI) / rays,
         deltas = [ ],
         scalar = 256,
         halfer = 128,
         cell = { x: 60, y: 60 },
         pxs = cellToPxCenter(cell)
      ;

      console.log("Calculating rayspaces...");

      // precalculate delta-Radians for each ray

      for (var k = 0; k < rays; k++) {
         var
            dx = Math.sin(rad),
            dy = Math.cos(rad)
         ;

         rad = rad + dRad;

         deltas.push({ x: dx, y: dy });
      }

      // precalculate cell traversal path

      pxs.forEach(function (px) {
         deltas.forEach(function (delta) {
            var
               x = scaleDown(scalar, px.x) + halfer,
               y = scaleDown(scalar, px.y) + halfer,
               cellPath = [ ],
               lastCell = cell,
               thisCell = null
            ;

            while (true) {
               x += delta.x;
               y += delta.y;

               thisCell = pxToCell( scaleUp(scalar, { x: x, y: y }) );

               var dr = cubeDistance(cell, thisCell);

               if (dr > sightLimit) {
                  // out of range
                  break;
               }

               if (lastCell.x !== thisCell.x || lastCell.y !== thisCell.y) {
                  cellPath.push({ x: cell.x - thisCell.x, y: cell.y - thisCell.y, dr: dr });
                  lastCell = thisCell;
               }
            }

            raySpaces.push(cellPath);
         });
      });
   }

   function gebi (id) {
      return document.getElementById(id);
   }

   function setVal (id, val) {
      gebi(id).value = val;
      return true;
   }

   function setHTML (id, val) {
      gebi(id).innerHTML = val;
      return true;
   }

   function getInt (id) {
      return parseInt(gebi(id).value);
   }

   function tilePath (name) {
      return "tiles/default/" + name + ".png";
   }

   function getTexture (rezName) {
      return PIXI.loader.resources[tilePath(rezName)].texture;
   }

   function getTile (type) {
      var tile = new PIXI.Sprite(getTexture(type));
      tile.scale.x = scalar;
      tile.scale.y = scalar;
      return tile;
   }

   function getTileType (cell) {
      return tileTypes[map[cell.x][cell.y].type];
   }

   function range (m, n, step) {
      var rval = [];

      if (m < 0 && n < 0) {
         return rval;
      }

      if (!step) { step = 1; }

      for (var i = m; i <= n; i += step) {
         rval.push(i); 
      }

      return rval;
   }

   function die (n) {
      return Math.floor( Math.random() * n ) + 1;
   }

   function cellToPxCorner (cell) {
      var relative = {
         x: cell.x - man.cell.x + 15,
         y: cell.y - man.cell.y + 15
      };

      /*

         man.x = 15, 0 =   0, 30 =  30
         man.x = 20, 0 =  -5, 30 =  25
         man.x = 30, 0 = -15, 30 =  15
         man.x = 40, 0 = -25, 30 =   5

         (-1,0)  -> 1 left,  1/2 up
         (1,0)   -> 1 right, 1/2 down
         (0,-1)  -> 1 down
         (0,1)   -> 1 up
         (-1,-1) -> 1 left, 1/2 down
         (-1,1)  -> 1 left, 3/2 up
         (1,-1)  -> 1 right, 3/2 down
         (1,1)   -> 1 right, 1/2 up

      */

      return {
         x: Math.floor(space * relative.x),
         y: Math.floor(mapHeight - (space * (8.5 + relative.y - (relative.x / 2))))
      };
   }

   function cellToAllCorners (cell) {
      var
         pxNW = cellToPxCorner(cell),
         pxE = pxNW.x + space,
         pxS = pxNW.y + space
      ;

      return [ pxNW, { x: pxE, y: pxNW.y }, { x: pxNW.x, y: pxS }, { x: pxE, y: pxS } ];
   }

   function cellToAllSides (cell) {
      var
         pxNW = cellToPxCorner(cell),
         pxH = pxNW.x + halfSpace,
         pxW = pxNW.y + halfSpace
      ;

      return [ { x: pxNW.x, y: pxW }, { x: pxH, y: pxNW.y }, { x: pxNW.x + space, y: pxW }, { x: pxH, y: pxNW.y + space } ];
   }

   function cellToInnerBox (cell) {
      var
         pxNW = cellToPxCorner(cell),
         x7 = pxNW.x +  4,
         x8 = pxNW.x + 11,
         y7 = pxNW.y +  4,
         y8 = pxNW.y + 11
      ;

      return [ { x: x7, y: y7 }, { x: x7, y: y8 }, { x: x8, y: y7 }, { x: x8, y: y8 } ];
   }

   function cellToNineCenters (cell) {
      return [
         cellToPxCenter(cell),
         cellToPxCenter({ x: cell.x + 1, y: cell.y }),
         cellToPxCenter({ x: cell.x - 1, y: cell.y }),
         cellToPxCenter({ x: cell.x, y: cell.y + 1 }),
         cellToPxCenter({ x: cell.x, y: cell.y - 1 }),
         cellToPxCenter({ x: cell.x + 1, y: cell.y + 1 }),
         cellToPxCenter({ x: cell.x - 1, y: cell.y - 1 })
      ];
   }

   function cellToPxCenter (cell) {
      var corner = cellToPxCorner(cell),
         x0 = corner.x + halfSpace - 1,
         y0 = corner.y + halfSpace - 1
      ;

      return [
         {
            x: x0,
            y: y0
         }
      ];
//         {
//            x: x0 + 1,
//            y: y0
//         },
//         {
//            x: x0,
//            y: y0 + 1
//         },
//         {
//            x: x0 + 1,
//            y: y0 + 1
//         }
   }

   function pxToCell (px) {
      var x = Math.floor( px.x / space ) + man.cell.x - 15,
         y = Math.floor((mapHeight - px.y) / space + ((x - man.cell.x) / 2) + man.cell.y - 15)
      ;

      return {
         x: x,
         y: y
      };
   }

   function getMousePos(e) {
      var mapview  = gebi('map-view'),
         rect = mapview.getBoundingClientRect()
      ;

      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
   }

   function cubeToAxial (c) {
      var q = c.x,
         r = c.y
      ;

      return { x: q, y: r };
   }

   function axialToCube (ax) {
      var x = ax.x,
         y = ax.y,
         z = x - y
      ;

      return { x: x, y: y, z: z };
   }

   function cubeDistance (a, b) {
      var ac = axialToCube(a),
         bc = axialToCube(b)
      ;

      return Math.max(Math.abs(ac.x - bc.x), Math.abs(ac.y - bc.y), Math.abs(ac.z - bc.z));
   }

   function distanceFromCenter (cell) {
      return cubeDistance(man.cell, cell);
   }

   function cellRay (cellX, cellY, color) {
      var px = cellToPxCenter(cellX),
         py = cellToPxCenter(cellY),
         graphics = new PIXI.Graphics()
      ;

      graphics.lineStyle(1, color);
      graphics.moveTo(px.x, px.y);
      graphics.lineTo(py.x, py.y);

      mapStage.addChild(graphics);

      return true
   }

   function adjacent (cell0, cell1) {
      return cubeDistance(cell0, cell1) === 1;
   }

   function scaleDown (scalar, v) {
      return scalar * v;
   }

   function scaleUp(scalar, cell) {
      return { x: Math.floor(cell.x / scalar), y: Math.floor(cell.y / scalar) }; 
   }

   function LOS (fn, cell0, cell1, sight_radius) {
      // fn should be cellToPxCenter or cellToAllCorners

      var dr = cubeDistance(cell0, cell1),
         debug = false
      ;

      function logIt (data) {
         if (debug) {
            console.log([ cell0.x, cell0.y, cell1.x, cell1.y, dr ].concat(data));
         }
      }

      if (!map[cell0.x] || !map[cell0.x][cell0.y] || !map[cell1.x] || !map[cell1.x][cell1.y]) {
         // out of bounds
         logIt("Cell out of bounds");
         return null;
      }

      if (dr > sight_radius) {
         logIt("Cell out of sight");
         return false;
      }

      if (cell0.x === cell1.x && cell0.y === cell1.y) {
         logIt("self");
         return true;
      }

      if (adjacent(cell0, cell1)) {
         logIt("neighbor");
         return true;
      }

      var 
         px0 = fn(cell0),
         px1 = fn(cell1),
         scalar = 256,
         halfer = 128,
         hasLOS = false
      ;

      logIt([ "cell diff", cell0.x - cell1.x, cell0.y - cell1.y ]);

      px0.forEach(function (c1) {
         if (hasLOS) { return true; }
         px1.forEach(function (c2) {
            if (hasLOS) { return true; }

            var
               x = scaleDown(scalar, c1.x) + halfer,
               y = scaleDown(scalar, c1.y) + halfer,
               dx = c2.x - c1.x,
               dy = c2.y - c1.y,
               thisCell = cell0
            ;

            logIt([ "xydxdy", x, y, dx, dy ]); 

            while (true) {
               x += dx;
               y += dy;

               thisCell = pxToCell( scaleUp(scalar, { x: x, y: y }) );

               if (thisCell.x === cell1.x && thisCell.y === cell1.y) {
                  logIt(["Got LOS"]);
                  hasLOS = true;
                  return hasLOS;
               }

               if (!map[thisCell.x] || !map[thisCell.x][thisCell.y]) {
                  logIt(["Out of bounds", thisCell.x, thisCell.y]);
                  hasLOS = null;
                  return hasLOS;
               }

               if (getTileType(thisCell).viewable === false) {
                  logIt(["Hit a wall", thisCell.x, thisCell.y]);
                  hasLOS = false;
                  return hasLOS;
               }
            }

            return null;
         });
      });

      return hasLOS;
   }

   function newLOS (cell0, cell1, sight_radius) {
      var
         dx = cell1.x - cell0.x,
         dy = cell1.y - cell0.y,
         dr = cubeDistance(cell0, cell1)
      ;

      if (!map[cell0.x] || !map[cell0.x][cell0.y] || !map[cell1.x] || !map[cell1.x][cell1.y]) {
         // out of bounds
         return null;
      }

      if (dr > sight_radius) {
         // out of sight
         return false;
      }

      if (cell0.x === cell1.x && cell0.y === cell1.y) {
         // self
         return true;
      }

      if (adjacent(cell0, cell1)) {
         // neighbor
         return true;
      }

      if (! getTileType(cell0).viewable) {
         return false;
      }

      var path = LOSpaths[dx][dy].path,
         hasLOS = false,
         blocked = false
      ;

      path.forEach(function (delta) {
         if (blocked) { return; }

         var thisCell = { x: cell0.x + delta.x, y: cell0.y + delta.y };

         if (thisCell.x === cell1.x && thisCell.y === cell1.y) {
            hasLOS = true;
            return hasLOS;
         }

         if (!map[thisCell.x] || !map[thisCell.x][thisCell.y]) {
            hasLOS = null;
            blocked = true;
            return hasLOS;
         }

         if (getTileType(thisCell).viewable === false) {
            hasLOS = false;
            blocked = true;
            return hasLOS;
         }
      });

      return hasLOS;
   }

   function cellFOV (cell, sight_radius) {
      // relcalc FOV when:
      //   opening a door
      //   casting a barrier, portal, or obscure spell

      var 
         boundary = 90,
         minX = cell.x - boundary,
         maxX = cell.x + boundary,
         minY = cell.y - boundary,
         maxY = cell.y + boundary
      ;

      // init FOV

      function initFOV (fn) {
         var fov = [ ];

         range(minX, maxX).forEach(function (x) {
            fov[x] = [ ];

            range(minY, maxY).forEach(function (y) {
               if (cell.x === x && cell.y === y) {
                  // self
                  fov[x][y] = true;
                  return;
               }

               if (adjacent(cell, { x: x, y: y })) {
                  // neighbor
                  fov[x][y] = true;
                  return;
               }

               // default
               fov[x][y] = fn(x,y);
            });
         });

         return fov;
      }

      function iterativeLOS (fn) {
         return initFOV(function (x,y){
            return LOS(fn, cell, { x: x, y: y }, boundary);
         });
      }

      function perimeterLOS () {
         var fov = initFOV(function (x,y) { return false; });

         if (! getTileType(cell).viewable) {
            return fov;
         }

         perimeter.forEach(function (goal) {
            var path = LOSpaths[goal.x][goal.y].path,
               blocked = false
            ;

            path.forEach(function (delta) {
               if (blocked) { return; }

               if (delta.dr > sight_radius) {
                  blocked = true;
                  return false;
               }

               var thisCell = { x: cell.x + delta.x, y: cell.y + delta.y };

               if (!map[thisCell.x] || !map[thisCell.x][thisCell.y]) {
                  blocked = true;
                  return null;
               }

               fov[thisCell.x][thisCell.y] = true;

               if (thisCell.x === goal.x && thisCell.y === goal.y) {
                  return true;
               }

               if (getTileType(thisCell).viewable === false) {
                  blocked = true;
                  return false;
               }
            });
         });

         return fov;
      }

      function rayCaster () {
         var fov = initFOV(function (x,y) { return false; });

         if (! getTileType(cell).viewable) {
            return fov;
         }

         raySpaces.forEach(function (paths) {
            var blocked = false;

            paths.forEach(function (delta) {
               if (blocked) { return; }

               var thisCell = { x: cell.x + delta.x, y: cell.y + delta.y };

               if (!map[thisCell.x] || !map[thisCell.x][thisCell.y]) {
                  // out of bounds
                  blocked = true;
                  return;
               }

               fov[thisCell.x][thisCell.y] = true;

               if (getTileType(thisCell).viewable === false) {
                  // vision blocked
                  blocked = true;
                  return;
               }
            });
         });

         return fov;
      }

      function fovObject (fov) {
         function visible (x,y) {
            if (fov[x] && fov[x][y]) {
               return fov[x][y];
            }

            return false;
         }

         return { visible: visible };
      }

      //return fovObject( rayCaster() );
      return fovObject( perimeterLOS() );
      //return fovObject( iterativeLOS(cellToAllCorners) );
   }

   function messagePlayer (msg) {
      console.log(msg);
   }

   function selectCell (cell) {
      if (cell.x < 0 || cell.y < 0) {
         return;
      }

      if (!selected[cell.x]) {
         selected[cell.x] = [];
      }

      if (typeof selected[cell.x][cell.y] == "undefined") {
         selected[cell.x][cell.y] = false;
      }

      selected[cell.x][cell.y] = !selected[cell.x][cell.y];

      moveGuy(0,0);
   }

   function isSelected(cell) {
      if (selected[cell.x] && selected[cell.x][cell.y]) {
         return true;
      }

      return false;
   }

   function clearSelected () {
      selected.forEach(function (arr, i) {
         arr.forEach(function (v, j) {
            selected[i][j] = false;
         })
      });
   }

   function moveGuy (dx, dy) {
      // set up state machine for playerTurn vs monsterTurn
      // console.log(["moveGuy", man.cell.x, man.cell.y, dx, dy]);
      var newX = man.cell.x + dx,
         newY = man.cell.y + dy,
         type = getTileType({ x: newX, y: newY })
      ;

      if (type.passable === true) {
         man.cell.x = newX;
         man.cell.y = newY;

         var fov = cellFOV({ x: newX, y: newY}, sightLimit);

         iterateMap(
            function (i, j) {
               var
                  cell = { x: i, y: j },
                  pxLoc = cellToPxCorner(cell),
                  sprite = map[i][j].sprite,
                  hasLOS = newLOS(man.cell, cell, sightLimit)
               ;

               sprite.x = pxLoc.x;
               sprite.y = pxLoc.y;
               sprite.tint = 0xFFFFFF;
               sprite.visible = fov.visible(i, j);

               if (sprite.visible) {
                  if (!hasLOS) {
                     sprite.tint = 0x888888;
                  }
               }
               else {
                  if (hasLOS) {
                     sprite.visible = true;
                     sprite.tint = 0x0000FF;
                  }
               }

               if (selections[i] && selections[i][j]) {
                  mapStage.removeChild(selections[i][j]);
               }

               if (sprite.visible && isSelected(cell)) {
                  var border = new PIXI.Graphics();
                  border.lineStyle(1, 0x00FF00);
                  border.drawRect(pxLoc.x, pxLoc.y, 16, 16);
                  mapStage.addChild(border);
                  selections[i] = selections[i] || [];
                  selections[i][j] = border;
                  cellRay(man.cell, cell, 0x00FF00);
               }
            }
         );

         mapRenderer.render(mapStage);
      }
      else {
         messagePlayer("Impassable");
      }
   }

   function iterateMap (fn) {
      for (var i = 0; i < map.length; i++) {
         if (! map[i]) { continue; }
         for (var j = 0; j < map[i].length; j++) {
            if (! map[i][j]) { continue; }
            fn(i, j);
         }
      }
   }

   function sortNum (x,y) {
      return x - y;
   }

   function init (mapGraph, cell) {
      var mapv  = gebi('map-view'),
         statv = gebi('status-view'),
         msgv  = gebi('messages-view')
      ;

      //initRaySpaces();
      LOSpaths = initLOSpaths();

      Object.keys(LOSpaths).sort(sortNum).forEach(function (x) {
         Object.keys(LOSpaths[x]).sort(sortNum).forEach(function (y) {
            if (LOSpaths[x][y].dr === 90) {
               perimeter.push(LOSpaths[x][y]);
            }
         });
      });

      mapv.appendChild(mapRenderer.view);
      statv.appendChild(statusRenderer.view);
      msgv.appendChild(messagesRenderer.view);

      var characters = [ "guy", "adventurer" ],
         tilesToLoad = Object.keys(tileTypes).concat(characters).map(
            function (name) {
               return tilePath(name);
            }
         );

      PIXI.loader
         .add(tilesToLoad)
         .load(function () {
            setup(mapGraph, cell);
         })
      ;
   }

   function setup (mapGraph, cell) {
      map = mapGraph;
      man.cell = cell;

      mapStage.removeChildren();

      man.sprite = getTile('adventurer');
      manPx = cellToPxCorner(man.cell);
      man.sprite.x = manPx.x;
      man.sprite.y = manPx.y;

      iterateMap(
         function (i, j) {
            var tile = getTile(map[i][j].type);
            var pxLoc = cellToPxCorner({ x: i, y: j });
            tile.visible = false;
            tile.tint = 0xFFFFFF;
            tile.x = pxLoc.x;
            tile.y = pxLoc.y;
            map[i][j].sprite = tile;
            mapStage.addChild(tile);
         }
      );

      mapStage.addChild(man.sprite);

      moveGuy(0,0);

      messagePlayer('Drawing...');

      mapRenderer.render(mapStage);
   }

   return {
      init: init,
      setup: setup,
      gebi: gebi,
      setVal: setVal,
      setHTML: setHTML,
      getInt: getInt,
      die: die,
      distance: cubeDistance,
      dr: distanceFromCenter,
      movePlayer: moveGuy,
      getMousePos: getMousePos,
      pxToCell: pxToCell,
      selectCell: selectCell,
      clearSelected: clearSelected,
      messagePlayer: messagePlayer
   };
})();
