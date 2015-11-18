/**
 * Vertex structure
 * @param x - position x
 * @param y - position y
 * @param key - unique to identify this vertex
 * @constructor
 */
var Vertex = function (x, y, key) {
    this.key = key
    this.x = x;
    this.y = y;
    this.point = new Phaser.Point(this.x, this.y);
};

var Obstacle = function (vertexList) {
    this.vertexList = vertexList;
    this.polygon = new Phaser.Polygon(Obstacle.getPointsArray(this.vertexList));
    // Bound top, bot, left, right
    this.top = this.getTopVertex();
    this.bot = this.getBotVertex();
    this.left = this.getLeftVertex();
    this.right = this.getRightVertex();
    this.virtualCenter = new Phaser.Point((this.left + this.right) / 2, (this.top + this.bot) / 2);
};

Obstacle.prototype.draw = function (graphics) {
    graphics.beginFill(0xFF33ff, 0.5);
    graphics.drawPolygon(this.polygon);
    graphics.endFill();
};
Obstacle.getPointsArray = function (vertexList) {
    var points = [];
    for (var i = 0; i < vertexList.length; i++) {
        points.push(vertexList[i].point);
    }
    return points;
};
Obstacle.prototype.getTopVertex = function () {
    // Loop through vertices list to find the largest y coordinate
    // Asign top as the largest one
    var top = Infinity;
    var topVertex = null;
    for (var i = 0; i < this.vertexList.length; i++) {
        if (this.vertexList[i].y < top) {
            top = this.vertexList[i].y;
            topVertex = this.vertexList[i];
        }
    }
    return topVertex;
};
Obstacle.prototype.getBotVertex = function () {
    var bot = -Infinity;
    var botVertex = null;
    for (var i = 0; i < this.vertexList.length; i++) {
        if (this.vertexList[i].y > bot) {
            bot = this.vertexList[i].y;
            botVertex = this.vertexList[i];
        }
    }
    return botVertex;
};
Obstacle.prototype.getLeftVertex = function () {
    var left = Infinity;
    var leftVertex = null;
    for (var i = 0; i < this.vertexList.length; i++) {
        if (this.vertexList[i].x < left) {
            left = this.vertexList[i].x;
            leftVertex = this.vertexList[i];
        }
    }
    return leftVertex;
};
Obstacle.prototype.getRightVertex = function () {
    var right = -Infinity;
    var rightVertex = null;
    for (var i = 0; i < this.vertexList.length; i++) {
        if (this.vertexList[i].x > right) {
            right = this.vertexList[i].x;
            rightVertex = this.vertexList[i];
        }
    }
    return rightVertex;
};
var GraphUtils = function (obstaclesList) {
    this.obstaclesList = obstaclesList;
    this.extraObstaclesList = [];
};
GraphUtils.prototype.setExtraObstaclesList = function(list){
    this.extraObstaclesList = list;
};
GraphUtils.prototype.getCrossObstacles = function (startPoint, endPoint) {
    var crossObstacles = [];
    var extraList = this.obstaclesList.concat(this.extraObstaclesList);
    // Loop through obstacle list
    for (var i = 0; i < extraList.length; i++) {
        if (GraphUtils.isCrossOver(startPoint, endPoint, extraList[i]).value) {
            crossObstacles.push(extraList[i]);
        }
    }
    crossObstacles.sort(function (a, b) {
        //return a.left.x - b.left.x;
        return a.virtualCenter.distance(startPoint) - b.virtualCenter.distance(startPoint);
    });
    // Append startpoint and endpoint as obstacles
    //if (startPoint.x < endPoint.x) {
    crossObstacles.unshift(new Obstacle([new Vertex(startPoint.x, startPoint.y, 'start')]));
    crossObstacles.push(new Obstacle([new Vertex(endPoint.x, endPoint.y, 'end')]));
    //} else {
    //    crossObstacles.unshift(new Obstacle([new Vertex(endPoint.x, endPoint.y, 'start')]));
    //    crossObstacles.push(new Obstacle([new Vertex(startPoint.x, startPoint.y, 'end')]));
    //}
    return crossObstacles;
};

GraphUtils.isCrossOver = function (startPoint, endPoint, obstacle) {
    // If obstacle has only one vertex, it never been cross by line
    if (obstacle.vertexList.length <= 1)
        return false;
    //TODO check one in two point is in the obstacle area - NO NEED
    var line1 = GraphUtils.getLineObject(startPoint, endPoint);
    var crosspoints = {'num': 0};
    for (var vert = 0; vert < obstacle.vertexList.length; vert++) {
        var point1 = obstacle.vertexList[vert];
        var point2 = obstacle.vertexList[(vert + 1) % obstacle.vertexList.length];
        var line2 = GraphUtils.getLineObject(point1, point2);
        var D = line1.A * line2.B - line2.A * line1.B;
        var Dx = line1.C * line2.B - line2.C * line1.B;
        var Dy = line1.A * line2.C - line2.A * line1.C;
        if (D == 0) {
            if (Dx != 0 || Dy != 0) {
                //TODO song song - NO NEED
            } else if (Dx == 0 && Dy == 0) {
                //TODO identical - NO NEED
            }
        } else {
            var crossx = Dx / D;
            var crossy = Dy / D;
            var point = new Vertex(crossx, crossy, 'none');
            if (GraphUtils.isAPointInALine(point, point1, point2) && GraphUtils.isAPointInALine(point, startPoint, endPoint)) {
                if (crosspoints[crossx] == null) {
                    crosspoints[crossx] = crossy;
                    crosspoints['num']++;
                }
            }
        }
    }
    if (crosspoints['num'] >= 2) {
        return {'value': true, 'crosspoints': crosspoints};
    }
    return {'value': false, 'crosspoints': null};
};

GraphUtils.prototype.getShortestPath = function (startPoint, endPoint) {
    var path = [];
    var graph = new Graph();
    var etra = this.obstaclesList.concat(this.extraObstaclesList);
    // Adjust startpoint
    var validStartPoint;
    for (var i = 0; i < etra.length; i++) {
        if (GraphUtils.isAPointinAPolygon(startPoint.point, etra[i].polygon)){
            validStartPoint = GraphUtils.findAnotherPointNoCollide(startPoint.point, etra[i]);
            break;
        }
    }
    // If startpoint is valid, remain the origin
    if (!validStartPoint){
        validStartPoint = startPoint.point;
    } else {
        //console.log('found new point');
        //console.log('old' + startPoint.point);
        //console.log('new' + validStartPoint);
    }
    var crossoverObstacle = this.getCrossObstacles(new Vertex(validStartPoint.x, validStartPoint.y, 'start'), endPoint);
    // crossoverObstacle.length - 1 is the index of endpoint (as an obstacle)
    // check if endpoint is in the obstacle -> adjust
    var closestValidDestination;
    for (var obs = 0; obs < etra.length; obs++) {
        if (GraphUtils.isAPointinAPolygon(endPoint.point, etra[obs].polygon)) {
            //console.log("inside");
            closestValidDestination = GraphUtils.getClosestValidDestination(endPoint.point, etra[obs]);
            closestValidDestination = GraphUtils.findAnotherPointNoCollide(closestValidDestination, etra[obs]);
            //console.log('closest' + closestValidDestination);
            crossoverObstacle = this.getCrossObstacles(new Vertex(validStartPoint.x, validStartPoint.y, 'start'), new Vertex(closestValidDestination.x, closestValidDestination.y, 'end'));
            break;
        }
    }

    GraphUtils.generate(graph, crossoverObstacle, etra);
    var result = graph.shortestPath('start', 'end');
    //TODO add push 0
    result.push("start");
    result.reverse();

    // Extract vertex from given data
    path.push(new Vertex(validStartPoint.x, validStartPoint.y, 'start'));
    for (var vert = 1; vert < result.length - 1; vert++) {
        path.push(Data.vertexData[result[vert]]);
    }
    if (closestValidDestination) {
        path.push(new Vertex(closestValidDestination.x, closestValidDestination.y, 'end'));
        return {'path': path, 'des': closestValidDestination};
    } else {
        path.push(endPoint);
        return {'path': path, 'des': endPoint.point};
    }
    //console.log(graph);
}
;
/**
 * Generate all the edges and vertices for the graph
 * @param graph - the graph hold all data
 * @param obstacleList - the cross-over obstacles
 */
GraphUtils.generate = function (graph, obstacleList, allObstacle) {
    // Loop through cross obstacle allObstacle
    for (var obsFrom = 0; obsFrom < obstacleList.length - 1; obsFrom++) {
        for (var obsTo = obsFrom + 1; obsTo < obstacleList.length; obsTo++) {
            //var obsTo = obsFrom + 1;
            GraphUtils.connect(obsFrom, obsTo, graph, obstacleList, allObstacle);
        }
    }
};
/**
 * Connect two obstacle by linking its vertices
 * @param from the start obstacle
 * @param to the end obstacle
 * @param graph the graph that holds all the vertices and their edges
 * @param obstacle all the obstacles during the test
 */
GraphUtils.connect = function (from, to, graph, obstacle, allObstacle) {
    // Connect all its own edges
    for (var i = 0; i < obstacle.length; i++) {
        GraphUtils.connectEdgesOfObstacle(obstacle[i], graph);
    }
    var fromObs = obstacle[from];
    var toObs = obstacle[to];
    for (var fromVert = 0; fromVert < fromObs.vertexList.length; fromVert++) {
        //var edges = {};
        for (var toVert = 0; toVert < toObs.vertexList.length; toVert++) {
            // Loop through all the crossover obstacle to check if there is any collision
            var isCollision = false;
            for (var obs = 0; obs < allObstacle.length; obs++) {
                if (GraphUtils.isCrossOver(fromObs.vertexList[fromVert], toObs.vertexList[toVert], allObstacle[obs]).value) {
                    isCollision = true;
                    break;
                }

            }
            if (!isCollision) {
                var dis = fromObs.vertexList[fromVert].point.distance(toObs.vertexList[toVert].point);
                if (graph.vertices[fromObs.vertexList[fromVert].key] == null) {
                    var edges = {};
                    edges[toObs.vertexList[toVert].key] = dis;
                    graph.addVertex(fromObs.vertexList[fromVert].key, edges);
                } else {
                    graph.addEdgeToVertex(fromObs.vertexList[fromVert].key, toObs.vertexList[toVert].key, dis);
                }
                if (graph.vertices[toObs.vertexList[toVert].key] == null) {
                    var edgesRev = {};
                    edgesRev[fromObs.vertexList[fromVert].key] = dis;
                    graph.addVertex(toObs.vertexList[toVert].key, edgesRev);
                } else {
                    graph.addEdgeToVertex(toObs.vertexList[toVert].key, fromObs.vertexList[fromVert].key, dis);
                }
            }
        }
        //TODO check null sound nerd
        //if (Object.keys(edges).length != 0) {
        //    graph.addVertex(fromObs.vertexList[fromVert].key, edges);
        //}
    }
};
/**
 * get Data of a line: coexist
 * @param a Vertex type
 * @param b Vertex type
 * @returns {{A: number, B: number, C: number}}
 */
GraphUtils.getLineObject = function (a, b) {
    var B = a.x - b.x,
        A = b.y - a.y,
        C = a.x * b.y - a.y * b.x;
    return {'A': A, 'B': B, 'C': C}
};
/**
 * Check a point is in a line (segment)
 * @param p Vertex type
 * @param a Vertex type
 * @param b Vertex type
 * @returns {boolean}
 */
GraphUtils.isAPointInALine = function (p, a, b) {
    // Except case p = a or p = b
    //if (p.x == a.x && p.y == a.y)
    //    return false;
    //if (p.x == b.x && p.y == b.y)
    //    return false;
    var ap = Math.round(a.point.distance(p));
    var bp = Math.round(b.point.distance(p));
    var ab = Math.round(a.point.distance(b));
    var result = (Math.abs(ap + bp - ab) <= 5);
    return (Math.abs(ap + bp - ab) <= 1);
};
/**
 * Connect all edges of a obstacle together
 * @param obstacle
 * @param graph
 */
GraphUtils.connectEdgesOfObstacle = function (obstacle, graph) {
    for (var vert = 0; vert < obstacle.vertexList.length; vert++) {
        var point1 = obstacle.vertexList[vert];
        var point2 = obstacle.vertexList[(vert + 1) % obstacle.vertexList.length];
        var dis = point1.point.distance(point2);
        var edges1 = {};
        var edges2 = {};
        if (graph.vertices[point1.key] == null) {
            edges1[point2.key] = dis;
            graph.addVertex(point1.key, edges1);
        } else {
            graph.addEdgeToVertex(point1.key, point2.key, dis);
        }
        if (graph.vertices[point2.key] == null) {
            edges2[point1.key] = dis;
            graph.addVertex(point2.key, edges2);
        } else {
            graph.addEdgeToVertex(point2.key, point1.key, dis);
        }
    }
};

GraphUtils.isAPointinAPolygon = function (currentPoint, polygon) {
    //Ray-cast algorithm is here onward
    var k, j = polygon.points.length - 1;
    var oddNodes = false; //to check whether number of intersections is odd
    for (k = 0; k < polygon.points.length; k++) {
        //fetch adjucent points of the polygon
        var polyK = polygon.points[k];
        var polyJ = polygon.points[j];

        //check the intersections
        if (((polyK.y > currentPoint.y) != (polyJ.y > currentPoint.y)) &&
            (currentPoint.x < (polyJ.x - polyK.x) * (currentPoint.y - polyK.y) / (polyJ.y - polyK.y) + polyK.x))
            oddNodes = !oddNodes; //switch between odd and even
        j = k;
    }

    //if odd number of intersections
    return (oddNodes);
};

GraphUtils.reflexOfAPointInALine = function (point, line) {
    var a = point.x;
    var b = point.y;
    var A = line.A;
    var B = line.B;
    var C = line.C;
    var t = (C - A * a - B * b) / (A * A + B * B);
    var x = Math.round(a + A * t);
    var y = Math.round(b + B * t);
    return new Phaser.Point(x, y);
};
GraphUtils.getClosestValidDestination = function (insidePoint, obstacle) {

    var lines = [];
    for (var vert = 0; vert < obstacle.vertexList.length; vert++) {
        var point1 = obstacle.vertexList[vert].point;
        var point2 = obstacle.vertexList[(vert + 1) % obstacle.vertexList.length].point;

        lines.push(GraphUtils.getLineObject(point1, point2));
    }

    var reflectPoints = [];
    for (var line = 0; line < lines.length; line++) {
        reflectPoints.push(GraphUtils.reflexOfAPointInALine(insidePoint, lines[line]));
    }

    var minDistance = Infinity;
    var result = null;
    for (var p = 0; p < reflectPoints.length; p++) {
        var dis = insidePoint.distance(reflectPoints[p]);
        if (dis < minDistance) {
            result = reflectPoints[p];
            minDistance = dis;
        }
    }
    return result;
};

GraphUtils.findAnotherPointNoCollide = function(origin, obstacle) {
    var offset = 5;
    // Adjust
    var case1 = new Phaser.Point(origin.x + offset, origin.y);
    var case2 = new Phaser.Point(origin.x - offset, origin.y);
    var case3 = new Phaser.Point(origin.x, origin.y + offset);
    var case4 = new Phaser.Point(origin.x, origin.y - offset);

    var cases = [case1, case2, case3, case4];
    for (var c = 0; c < cases.length; c++) {
        if (!GraphUtils.isAPointinAPolygon(cases[c], obstacle.polygon)) {
            return cases[c];
        }
    }
    return origin;
};
GraphUtils.prototype.getARandomValidPosition = function(){
    var result = null;
    while (result == null) {
        var x = Math.round(144 + Math.random() * 1755);
        var y = Math.round(149 + Math.random() * 1761);
        var newPoint = new Phaser.Point(x, y);
        var extra = this.obstaclesList.concat(this.setExtraObstaclesList);
        for (var obs = 0; obs< extra.length; obs++) {
            if (!GraphUtils.isAPointinAPolygon(newPoint, extra[obs].polygon)){
                result = newPoint;
                break;
            }
        }
    }
    return result;
};
/////////////////////////////////////////////////////////////////////////////////////////

function PriorityQueue() {
    this._nodes = [];

    this.enqueue = function (priority, key) {
        this._nodes.push({key: key, priority: priority});
        this.sort();
    };
    this.dequeue = function () {
        return this._nodes.shift().key;
    };
    this.sort = function () {
        this._nodes.sort(function (a, b) {
            return a.priority - b.priority;
        });
    };
    this.isEmpty = function () {
        return !this._nodes.length;
    }
}

/**
 * Pathfinding starts here
 */
function Graph() {
    var INFINITY = 1 / 0;
    this.vertices = {};

    this.addVertex = function (name, edges) {
        this.vertices[name] = edges;
    };
    this.addEdgeToVertex = function (vert, edge, distance) {
        this.vertices[vert][edge] = distance;
    };
    this.shortestPath = function (start, finish) {
        var nodes = new PriorityQueue(),
            distances = {},
            previous = {},
            path = [],
            smallest, vertex, neighbor, alt;

        for (vertex in this.vertices) {
            if (vertex === start) {
                distances[vertex] = 0;
                nodes.enqueue(0, vertex);
            }
            else {
                distances[vertex] = INFINITY;
                nodes.enqueue(INFINITY, vertex);
            }

            previous[vertex] = null;
        }

        while (!nodes.isEmpty()) {
            smallest = nodes.dequeue();

            if (smallest === finish) {
                path;

                while (previous[smallest]) {
                    path.push(smallest);
                    smallest = previous[smallest];
                }

                break;
            }

            if (!smallest || distances[smallest] === INFINITY) {
                continue;
            }

            for (neighbor in this.vertices[smallest]) {
                alt = distances[smallest] + this.vertices[smallest][neighbor];

                if (alt < distances[neighbor]) {
                    distances[neighbor] = alt;
                    previous[neighbor] = smallest;

                    nodes.enqueue(alt, neighbor);
                }
            }
        }

        return path;
    }
}
